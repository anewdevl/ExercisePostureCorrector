import os
os.environ['DATABASE_URL'] = 'sqlite://'
import tempfile
import unittest
import re
from unittest.mock import patch, Mock
from server import app, db
from training import sessions, close_pose
from catalog import tracking_id


class IntegrationTests(unittest.TestCase):
    def test_built_frontend_module_mime(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200, 'Build the frontend before this integration check')
        scripts = re.findall(r'<script[^>]+src="([^"]+)"', response.get_data(as_text=True))
        self.assertTrue(scripts)
        response.close()
        for script in scripts:
            asset = self.client.get(script)
            self.assertEqual(asset.status_code, 200)
            self.assertEqual(asset.mimetype, 'text/javascript')
            cached = self.client.get(script, headers={'If-None-Match': asset.headers['ETag']})
            self.assertEqual(cached.status_code, 200)
            self.assertEqual(cached.mimetype, 'text/javascript')
            cached.close()
            asset.close()

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        app.config.update(TESTING=True, PROVIDER_SETTINGS_PATH=self.temp.name + '/settings.json')
        with app.app_context():
            db.drop_all()
            db.create_all()
        self.client = app.test_client()
        self.environment = patch.dict(os.environ, {'AI_PROVIDER': 'gemini', 'GEMINI_API_KEY': 'test-secret', 'GEMINI_MODEL': 'test-model'})
        self.environment.start()
        self.addCleanup(self.environment.stop)

    def tearDown(self):
        for state in sessions.values():
            close_pose(state)
        sessions.clear()

    def test_settings_never_expose_keys(self):
        response = self.client.get('/api/settings')
        self.assertEqual(response.json['provider'], 'gemini')
        self.assertTrue(response.json['geminiKeyConfigured'])
        self.assertNotIn('test-secret', response.get_data(as_text=True))
        changed = self.client.put('/api/settings', json={'provider': 'ollama', 'geminiModel': 'test-model', 'ollamaModel': 'local:model'})
        self.assertEqual(changed.status_code, 200)
        self.assertEqual(self.client.get('/api/settings').json['provider'], 'ollama')
        self.assertEqual(self.client.put('/api/settings', json={'provider': 'unknown'}).status_code, 400)

    @patch('providers.requests.post')
    def test_gemini_transport_and_roles(self, post):
        post.return_value = Mock(status_code=200, json=lambda: {'candidates': [{'finishReason': 'STOP', 'content': {'parts': [{'text': 'Try a squat.'}]}}]})
        response = self.client.post('/api/chat', json={'message': 'Next?', 'history': [{'role': 'assistant', 'content': 'Hello'}]})
        self.assertEqual(response.status_code, 200)
        args = post.call_args
        self.assertIn('generativelanguage.googleapis.com', args.args[0])
        self.assertNotIn('test-secret', args.args[0])
        self.assertEqual(args.kwargs['headers']['x-goog-api-key'], 'test-secret')
        self.assertEqual(args.kwargs['json']['contents'][0]['role'], 'model')
        self.assertIn('systemInstruction', args.kwargs['json'])

    @patch('providers.requests.post')
    def test_no_silent_fallback_on_missing_key_or_quota(self, post):
        with patch.dict(os.environ, {'GEMINI_API_KEY': ''}):
            self.assertEqual(self.client.post('/api/chat', json={'message': 'Hello'}).status_code, 503)
            post.assert_not_called()
        post.return_value = Mock(status_code=429)
        response = self.client.post('/api/chat', json={'message': 'Hello'})
        self.assertEqual(response.status_code, 503)
        self.assertIn('quota', response.json['error'])
        self.assertEqual(post.call_count, 1)

    def test_supported_aliases_do_not_claim_unknown_variants(self):
        self.assertEqual(tracking_id('Push ups'), 'push-up')
        self.assertIsNone(tracking_id('Bulgarian split squat'))
        self.assertIsNone(tracking_id('Running'))

    @patch('training.MEDIAPIPE_AVAILABLE', True)
    @patch('training.initialize_pose', return_value=(Mock(), Mock(), Mock()))
    def test_saved_plan_links_to_session_and_survives_plan_delete(self, pose):
        saved = self.client.post('/api/create_workout', json={'name': 'Monday', 'exercises': [{'name': 'Push ups', 'sets': 3, 'repetitions': 10}]})
        exercise = saved.json['exercises'][0]
        self.assertEqual(exercise['trackingId'], 'push-up')
        response = self.client.post('/api/training/sessions', json={'trackingId': 'push-up', 'planExerciseId': exercise['id']})
        self.assertEqual(response.status_code, 201)
        token = response.json['token']
        sessions[token]['tracked'] = 3
        sessions[token]['counter'] = 2
        self.assertEqual(self.client.post(f'/api/training/sessions/{token}/end', json={}).status_code, 200)
        self.assertEqual(self.client.delete('/api/delete_workout/' + str(saved.json['id'])).status_code, 200)
        result = self.client.get('/api/training/history').json['workouts'][0]
        self.assertEqual(result['workoutName'], 'Monday')
        self.assertEqual(result['repetitions'], 2)
        self.assertEqual(result['trackingId'], 'push-up')

    @patch('training.MEDIAPIPE_AVAILABLE', True)
    @patch('training.initialize_pose')
    def test_stale_or_mismatched_plan_link_rejected(self, pose):
        self.assertEqual(self.client.post('/api/training/sessions', json={'trackingId': 'squat', 'planExerciseId': 999}).status_code, 400)
        pose.assert_not_called()


if __name__ == '__main__':
    unittest.main()
