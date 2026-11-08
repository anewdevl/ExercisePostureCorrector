"""Deterministic geometry/state checks; no camera or model inference."""
import importlib
import unittest
from types import SimpleNamespace
from unittest.mock import patch
import numpy as np
from exercises.utils import calculate_angle, mp
from exercises.visibility import joints_visible


class ProcessorTests(unittest.TestCase):
    def setUp(self):
        self.frame = np.zeros((480, 640, 3), dtype=np.uint8)
        self.points = [SimpleNamespace(x=.5, y=.5, visibility=1.) for _ in range(33)]
        self.results = SimpleNamespace(pose_landmarks=SimpleNamespace(landmark=self.points))

    def test_geometry(self):
        self.assertAlmostEqual(calculate_angle((0, 0), (1, 0), (2, 0)), 180)
        self.assertAlmostEqual(calculate_angle((0, 0), (1, 0), (1, 1)), 90)

    def test_visibility_depends_on_exercise(self):
        self.points[27].visibility = 0
        self.assertTrue(joints_visible(self.results.pose_landmarks, 'Bicep Curls'))
        self.assertFalse(joints_visible(self.results.pose_landmarks, 'Squats'))
        self.points[14].visibility = 0
        self.assertFalse(joints_visible(self.results.pose_landmarks, 'Bicep Curls'))
        self.assertFalse(joints_visible(None, 'Squats'))

    def test_repeated_frames_do_not_duplicate_counts(self):
        # Preserve established thresholds; test complete transitions and held poses.
        cases = {
            'bicepcurls': ([170], [20]),
            'hammercurls': ([170, 170], [60, 60]),
            'pullups': ([170, 170], [60, 60]),
            'shoulderpress': ([60, 60], [170, 170]),
            'pushups': ([170, 170, 180], [80, 80, 180]),
            'squats': ([170], [80]),
            'deadlifts': ([170, 170], [120, 100]),
            'lunges': ([170, 170, 90], [80, 170, 90]),
        }
        for name, (rest, active) in cases.items():
            with self.subTest(exercise=name):
                module = importlib.import_module('exercises.' + name)
                process = getattr(module, 'process_' + name)
                counter, stage = 0, 'ready'
                for angles, expected in [(rest, 0), (active, 1), (active, 1), (rest, 1), (active, 2)]:
                    with patch.object(module, 'calculate_angle', side_effect=angles):
                        _, counter, stage = process(self.frame.copy(), self.results, mp.solutions.pose, counter, stage)
                    self.assertEqual(counter, expected)

    def test_pushup_alignment_uses_shoulder_hip_ankle_line(self):
        module = importlib.import_module('exercises.pushups')
        for left, right, y in [(11, 12, .1), (23, 24, .5), (27, 28, .9)]:
            self.points[left].x, self.points[left].y = .4, y
            self.points[right].x, self.points[right].y = .6, y
        with patch.object(module.cv2, 'putText') as draw:
            module.process_pushups(self.frame, self.results, mp.solutions.pose, 0, 'ready')
        messages = [call.args[1] for call in draw.call_args_list]
        self.assertNotIn('Keep body straight', messages)

    def test_plank_break_resets_current_hold_but_keeps_best(self):
        module = importlib.import_module('exercises.plank')
        state = {'start_time': 95., 'current_duration': 5., 'best_duration': 5.}
        with patch.object(module, 'calculate_angle', side_effect=[170, 170, 90, 90]):
            _, _, stage, state = module.process_plank(self.frame, self.results, mp.solutions.pose, 0, 'planking', state)
        self.assertEqual(stage, 'resting')
        self.assertIsNone(state['start_time'])
        self.assertEqual(state['current_duration'], 0)
        self.assertEqual(state['best_duration'], 5.)


if __name__ == '__main__':
    unittest.main()
