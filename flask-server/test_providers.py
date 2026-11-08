import os
import tempfile
import unittest
from unittest.mock import patch, Mock
from server import app
from providers import ask_model, save_settings, public_settings, AIUnavailable


class ProviderTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.config = patch.dict(app.config, PROVIDER_SETTINGS_PATH=self.temp.name + '/settings.json')
        self.config.start()
        self.addCleanup(self.config.stop)
        self.context = app.app_context()
        self.context.push()
        self.addCleanup(self.context.pop)

    def choose(self, provider):
        save_settings({'provider': provider, 'geminiModel': 'test', 'ollamaModel': 'test', provider + 'Model': 'test-model'})

    @patch('providers.requests.post')
    def test_cloud_transports_chat_and_json(self, post):
        cases = {
            'openai': ('https://api.openai.com/v1/responses', {'status': 'completed', 'output': [{'type': 'message', 'content': [{'type': 'output_text', 'text': '{"workout":[]}'}]}]}),
            'anthropic': ('https://api.anthropic.com/v1/messages', {'stop_reason': 'end_turn', 'content': [{'type': 'text', 'text': '{"workout":[]}'}]}),
            'deepseek': ('https://api.deepseek.com/chat/completions', {'choices': [{'finish_reason': 'stop', 'message': {'content': '{"workout":[]}'}}]}),
        }
        for provider, (url, result) in cases.items():
            with self.subTest(provider=provider), patch.dict(os.environ, {provider.upper() + '_API_KEY': 'secret-test-key'}):
                self.choose(provider)
                self.assertTrue(public_settings()['ready'])
                self.assertNotIn('secret-test-key', str(public_settings()))
                for json_mode in (False, True):
                    post.return_value = Mock(status_code=200, json=lambda: result)
                    self.assertEqual(ask_model([{'role': 'system', 'content': 'Be helpful'}, {'role': 'user', 'content': 'Return JSON'}], json_mode), '{"workout":[]}')
                    self.assertEqual(post.call_args.args[0], url)
                    body = post.call_args.kwargs['json']
                    if provider == 'openai':
                        self.assertFalse(body['store'])
                        self.assertEqual('text' in body, json_mode)
                    elif provider == 'anthropic':
                        self.assertEqual(post.call_args.kwargs['headers']['anthropic-version'], '2023-06-01')
                        self.assertEqual(body['messages'][0]['role'], 'user')
                        self.assertEqual('JSON object' in body['system'], json_mode)
                    else:
                        self.assertEqual('response_format' in body, json_mode)

    @patch('providers.requests.post')
    def test_missing_keys_do_not_send_or_fallback(self, post):
        for provider in ('openai', 'anthropic', 'deepseek'):
            with self.subTest(provider=provider), patch.dict(os.environ, {provider.upper() + '_API_KEY': ''}):
                self.choose(provider)
                self.assertFalse(public_settings()['ready'])
                with self.assertRaises(AIUnavailable):
                    ask_model([{'role': 'user', 'content': 'Hi'}])
        post.assert_not_called()

    @patch('providers.requests.post')
    def test_truncated_or_malformed_results_rejected(self, post):
        for provider, result in [('openai', {'status': 'incomplete'}), ('anthropic', {'stop_reason': 'max_tokens'}), ('deepseek', {'choices': [{'finish_reason': 'length'}]}), ('openai', [])]:
            with self.subTest(provider=provider, result=result), patch.dict(os.environ, {provider.upper() + '_API_KEY': 'test-key'}):
                self.choose(provider)
                post.return_value = Mock(status_code=200, json=lambda: result)
                with self.assertRaises(AIUnavailable):
                    ask_model([{'role': 'user', 'content': 'Hi'}])

    def test_legacy_settings_preserve_other_models(self):
        self.choose('openai')
        save_settings({'provider': 'gemini', 'geminiModel': 'test', 'ollamaModel': 'test'})
        self.assertEqual(public_settings()['openaiModel'], 'test-model')
        with self.assertRaises(ValueError):
            save_settings({'provider': 'gemini', 'geminiModel': 'test', 'ollamaModel': 'test', 'apiKey': 'never-save'})
