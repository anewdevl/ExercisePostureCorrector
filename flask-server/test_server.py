import os
os.environ['DATABASE_URL'] = 'sqlite://'
import json
import unittest
from unittest.mock import patch, Mock
import requests
import tempfile
from server import app, db
from models import Workout, Exercise


class PlannerTests(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        app.config["PROVIDER_SETTINGS_PATH"] = self.temp.name + "/settings.json"
        self.env = patch.dict(os.environ, {"AI_PROVIDER": "ollama"})
        self.env.start()
        self.addCleanup(self.env.stop)
        self.client = app.test_client()
        with app.app_context():
            db.drop_all()
            db.create_all()
        self.workout = {'name': 'Strength', 'exercises': [{'name': 'Squats', 'sets': 3, 'repetitions': 10}]}

    def test_create_edit_delete_and_cascade(self):
        created = self.client.post('/api/create_workout', json=self.workout)
        self.assertEqual(created.status_code, 201)
        identifier = created.json['id']
        updated = self.client.patch(f'/api/update_workout/{identifier}', json={
            'name': 'Upper body', 'exercises': [{'name': 'Push-ups', 'sets': 2, 'repetitions': 8}]})
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json['exercises'][0]['name'], 'Push-ups')
        self.assertEqual(self.client.delete(f'/api/delete_workout/{identifier}').status_code, 200)
        self.assertEqual(self.client.get('/api/workouts').json, {'workouts': []})
        with app.app_context():
            self.assertEqual(db.session.query(Exercise).count(), 0)

    def test_invalid_update_is_atomic(self):
        identifier = self.client.post('/api/create_workout', json=self.workout).json['id']
        response = self.client.patch(f'/api/update_workout/{identifier}', json={'name': 'Changed', 'exercises': []})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.client.get('/api/workouts').json['workouts'][0]['name'], 'Strength')

    def test_validation_and_duplicates(self):
        for value in [None, [], {}, {'name': ' ', 'exercises': []}]:
            self.assertEqual(self.client.post('/api/create_workout', data=json.dumps(value), content_type='application/json').status_code, 400)
        for value in [-1, 0, True, 1.5, '2.5', None]:
            self.workout['exercises'][0]['sets'] = value
            self.assertEqual(self.client.post('/api/create_workout', json=self.workout).status_code, 400)
        self.workout['exercises'][0]['sets'] = 3
        self.client.post('/api/create_workout', json=self.workout)
        self.assertEqual(self.client.post('/api/create_workout', json=self.workout).status_code, 409)
        self.assertEqual(self.client.patch('/api/update_workout/999', json=self.workout).status_code, 404)

    @patch('providers.requests.post')
    def test_chat_history_is_request_scoped(self, post):
        post.return_value = Mock(json=lambda: {'message': {'content': 'Hello'}})
        self.assertEqual(self.client.post('/api/chat', json={'message': 'First user'}).status_code, 200)
        self.assertEqual(self.client.post('/api/chat', json={'message': 'Second user'}).status_code, 200)
        messages = post.call_args.kwargs['json']['messages']
        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[-1]['content'], 'Second user')
        self.assertEqual(post.call_args.kwargs['timeout'], (5, 120))

    @patch('providers.requests.post', side_effect=requests.Timeout)
    def test_model_failure_is_actionable(self, post):
        response = self.client.post('/api/chat', json={'message': 'Help'})
        self.assertEqual(response.status_code, 503)
        self.assertIn('too long', response.json['error'])

    @patch('server.ask_model')
    def test_generated_plan_schema(self, ask):
        details = dict(height='170', weight='70', age='30', gender='male', fitnessLevel='beginner', goal='overall-fitness')
        ask.return_value = json.dumps({'workout': [{'day': day, 'exercises': []} for day in
            ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']]})
        self.assertEqual(self.client.post('/api/generate_workout', json=details).status_code, 200)
        for bad in ['not JSON', '{}', '[1]', '{"workout":null}']:
            ask.return_value = bad
            self.assertEqual(self.client.post('/api/generate_workout', json=details).status_code, 503)
        self.assertEqual(self.client.post('/api/generate_workout', json={}).status_code, 400)


if __name__ == '__main__':
    unittest.main()
