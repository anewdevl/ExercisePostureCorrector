import os
os.environ['DATABASE_URL'] = 'sqlite://'
import base64
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch
import cv2
import numpy as np
from server import app, db
from training import sessions, guard, close_pose, SESSION_TTL



class TrackerTests(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()
        with app.app_context():
            db.drop_all()
            db.create_all()
        self.pose = Mock()
        self.pose.process.return_value = SimpleNamespace(pose_landmarks=None)
        self.initialize = patch('training.initialize_pose', return_value=(Mock(), self.pose, Mock()))
        self.initialize.start()
        self.available = patch('training.MEDIAPIPE_AVAILABLE', True)
        self.available.start()
        _, encoded = cv2.imencode('.jpg', np.zeros((100, 100, 3), dtype=np.uint8))
        self.image = 'data:image/jpeg;base64,' + base64.b64encode(encoded).decode()

    def tearDown(self):
        with guard:
            for state in sessions.values():
                close_pose(state)
            sessions.clear()
        self.initialize.stop()
        self.available.stop()

    def start(self):
        result = self.client.post('/api/training/sessions', json={'exercise': 'Squats'})
        self.assertEqual(result.status_code, 201)
        return result.json['token']

    def test_no_detection_never_creates_fake_results(self):
        token = self.start()
        response = self.client.post(f'/api/training/sessions/{token}/frame', json={'image': self.image})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json['tracking'])
        self.assertEqual(response.json['repetitions'], 0)
        self.assertFalse(self.client.post(f'/api/training/sessions/{token}/end', json={}).json['saved'])
        self.assertEqual(self.client.get('/api/training/history').json['workouts'], [])
        self.pose.close.assert_called_once()

    @patch('training.draw_landmarks', side_effect=lambda frame, *args: frame)
    def test_partial_pose_is_drawn_without_counting(self, draw):
        self.pose.process.return_value = SimpleNamespace(pose_landmarks=SimpleNamespace(
            landmark=[SimpleNamespace(visibility=.2) for _ in range(33)]))
        token = self.start()
        response = self.client.post(f'/api/training/sessions/{token}/frame', json={'image': self.image})
        self.assertEqual(response.status_code, 200)
        draw.assert_called_once()
        self.assertFalse(response.json['tracking'])
        self.assertEqual(response.json['repetitions'], 0)
        self.assertIn('Pose detected', response.json['message'])

    def test_sessions_are_isolated_and_finish_is_idempotent(self):
        first, second = self.start(), self.start()
        sessions[first]['counter'] = 7
        sessions[first]['tracked'] = 4
        self.assertEqual(sessions[second]['counter'], 0)
        one = self.client.post(f'/api/training/sessions/{first}/end', json={})
        two = self.client.post(f'/api/training/sessions/{first}/end', json={})
        self.assertEqual(one.json, two.json)
        history = self.client.get('/api/training/history').json['workouts']
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0]['repetitions'], 7)
        self.assertEqual(self.client.post(f'/api/training/sessions/{first}/frame', json={'image': self.image}).status_code, 409)

    def test_expiry_releases_resources(self):
        token = self.start()
        sessions[token]['touched'] -= SESSION_TTL + 1
        self.client.get('/api/training/health')
        self.assertNotIn(token, sessions)
        self.pose.close.assert_called_once()

    def test_bad_inputs_and_capacity(self):
        self.assertEqual(self.client.post('/api/training/sessions', json={'exercise': 'Unknown'}).status_code, 400)
        self.assertEqual(self.client.post('/api/training/sessions', data='{}').status_code, 415)
        token = self.start()
        for image in ['', 'data:image/jpeg;base64,????', 'data:image/jpeg;base64,']:
            self.assertEqual(self.client.post(f'/api/training/sessions/{token}/frame', json={'image': image}).status_code, 400)
        for _ in range(3):
            self.start()
        self.assertEqual(self.client.post('/api/training/sessions', json={'exercise': 'Squats'}).status_code, 409)
        self.assertEqual(self.client.post('/api/training/sessions/missing/end', json={}).status_code, 404)

    def test_lost_landmarks_interrupt_hold(self):
        token = self.start()
        sessions[token]['plank'] = {'start_time': 1, 'current_duration': 10, 'best_duration': 10}
        sessions[token]['stage'] = 'planking'
        response = self.client.post(f'/api/training/sessions/{token}/frame', json={'image': self.image})
        self.assertEqual(response.json['hold'], 0)
        self.assertEqual(response.json['bestHold'], 10)
        self.assertIsNone(sessions[token]['plank']['start_time'])


if __name__ == '__main__':
    unittest.main()
