"""Explicit Gemini / Ollama adapters. Credentials never leave the server."""
import json
import os
import re
import threading
from pathlib import Path
from urllib.parse import quote
import requests
from flask import current_app

_lock = threading.Lock()
PROVIDERS = ('gemini', 'ollama', 'openai', 'anthropic', 'deepseek')
KEYS = {name: name.upper() + '_API_KEY' for name in PROVIDERS if name != 'ollama'}


class AIUnavailable(Exception):
    pass


def settings():
    values = {
        "provider": os.environ.get("AI_PROVIDER", "gemini"),
        "geminiModel": os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite"),
        "ollamaModel": os.environ.get("OLLAMA_MODEL", "gemma:2b"),
        **{name + 'Model': os.environ.get(name.upper() + '_MODEL', '') for name in ('openai', 'anthropic', 'deepseek')},
    }
    path = Path(current_app.config["PROVIDER_SETTINGS_PATH"])
    if path.exists():
        try:
            saved = json.loads(path.read_text(encoding="utf-8"))
            validate_settings(saved)
            values.update(saved)
        except (OSError, ValueError, TypeError) as error:
            raise AIUnavailable("Provider settings could not be read. Check the server configuration.") from error
    return values


def validate_settings(data):
    allowed = {'provider', *(name + 'Model' for name in PROVIDERS)}
    if not isinstance(data, dict) or not {'provider', 'geminiModel', 'ollamaModel'} <= set(data) or set(data) - allowed:
        raise ValueError("Provide the provider and model fields; API keys belong in the server .env file.")
    if data["provider"] not in PROVIDERS:
        raise ValueError("Choose a supported provider.")
    for key in set(data) - {'provider'}:
        value = data[key]
        if not isinstance(value, str) or len(value) > 150 or (value and not re.fullmatch(r"[A-Za-z0-9._:/-]+", value)):
            raise ValueError("Use a valid model name.")


def save_settings(data):
    validate_settings(data)
    path = Path(current_app.config["PROVIDER_SETTINGS_PATH"])
    with _lock:
        data = {**settings(), **data}
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_suffix(".tmp")
        try:
            temporary.write_text(json.dumps(data, indent=2), encoding="utf-8")
            temporary.replace(path)
        except OSError as error:
            raise AIUnavailable("Could not save provider settings.") from error


def public_settings():
    values = settings()
    configured = {name + 'KeyConfigured': bool(os.environ.get(key)) for name, key in KEYS.items()}
    provider = values['provider']
    return {**values, **configured, 'envPath': './flask-server/.env',
            'ready': bool(values.get(provider + 'Model')) and
                     (provider == 'ollama' or configured.get(provider + 'KeyConfigured', False))}


def ask_model(messages, json_mode=False):
    selected = settings()
    provider = selected["provider"]
    if provider not in PROVIDERS:
        raise AIUnavailable("Select a supported provider in Settings.")
    model = selected[provider + 'Model']
    if not model or (provider in KEYS and not os.environ.get(KEYS[provider])):
        raise AIUnavailable(f"{provider.title()} needs a model in Settings" +
                            (f" and {KEYS[provider]} in the server .env file. Restart after adding the key." if provider in KEYS else '.'))
    if provider == "gemini":
        key = os.environ.get("GEMINI_API_KEY")
        model = selected["geminiModel"]
        if not key or not model:
            raise AIUnavailable("Gemini needs a server-side GEMINI_API_KEY and a model in Settings. You can explicitly choose Ollama instead.")
        contents = [{"role": "model" if item["role"] == "assistant" else "user",
                     "parts": [{"text": item["content"]}]}
                    for item in messages if item["role"] != "system"]
        data = {"contents": contents}
        system = "\n".join(item["content"] for item in messages if item["role"] == "system")
        if system:
            data["systemInstruction"] = {"parts": [{"text": system}]}
        if json_mode:
            data["generationConfig"] = {"responseMimeType": "application/json"}
        url = "https://generativelanguage.googleapis.com/v1beta/models/" + quote(model.removeprefix("models/"), safe="") + ":generateContent"
        headers = {"x-goog-api-key": key}
    elif provider == 'openai':
        url = 'https://api.openai.com/v1/responses'
        headers = {'Authorization': 'Bearer ' + os.environ[KEYS[provider]]}
        data = {'model': model, 'input': messages, 'store': False}
        if json_mode:
            data['text'] = {'format': {'type': 'json_object'}}
    elif provider == 'anthropic':
        url = 'https://api.anthropic.com/v1/messages'
        headers = {'x-api-key': os.environ[KEYS[provider]], 'anthropic-version': '2023-06-01'}
        data = {'model': model, 'max_tokens': 4096,
                'messages': [item for item in messages if item['role'] != 'system']}
        system = '\n'.join(item['content'] for item in messages if item['role'] == 'system')
        if json_mode:
            system += '\nReturn only a valid JSON object. No markdown fences or commentary.'
        if system:
            data['system'] = system
    elif provider == 'deepseek':
        url = 'https://api.deepseek.com/chat/completions'
        headers = {'Authorization': 'Bearer ' + os.environ[KEYS[provider]]}
        data = {'model': model, 'messages': messages, 'stream': False}
        if json_mode:
            data['response_format'] = {'type': 'json_object'}
    else:
        if not selected['ollamaModel']:
            raise AIUnavailable('Enter an Ollama model in Settings before sending a request.')
        data = {"model": selected["ollamaModel"], "messages": messages, "stream": False}
        if json_mode:
            data["format"] = "json"
        url = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/") + "/api/chat"
        headers = {}
    try:
        response = requests.post(url, json=data, headers=headers, timeout=(5, 120))
        if response.status_code in (401, 403):
            raise AIUnavailable("The provider rejected access. Check the server-side API key and model permissions.")
        if response.status_code == 429:
            raise AIUnavailable("The provider's rate or quota limit was reached. Try later or check your quota.")
        if response.status_code == 404:
            raise AIUnavailable("The selected model was not found. Check its name in Settings.")
        response.raise_for_status()
        result = response.json()
        if provider == "gemini":
            candidate = result.get("candidates", [{}])[0]
            if candidate.get("finishReason") not in (None, "STOP"):
                raise AIUnavailable("Gemini did not finish a usable response. Try revising the request.")
            content = "".join(part.get("text", "") for part in candidate.get("content", {}).get("parts", []) if not part.get("thought"))
        elif provider == 'openai':
            if result.get('status') != 'completed':
                raise AIUnavailable('OpenAI did not finish a usable response. Try again or choose another model.')
            content = ''.join(part.get('text', '') for item in result.get('output', [])
                              if item.get('type') == 'message' for part in item.get('content', [])
                              if part.get('type') == 'output_text')
        elif provider == 'anthropic':
            if result.get('stop_reason') not in ('end_turn', 'stop_sequence'):
                raise AIUnavailable('Anthropic did not finish a usable response. Try a shorter request.')
            content = ''.join(part.get('text', '') for part in result.get('content', []) if part.get('type') == 'text')
        elif provider == 'deepseek':
            choice = result['choices'][0]
            if choice.get('finish_reason') != 'stop':
                raise AIUnavailable('DeepSeek did not finish a usable response. Try a shorter request.')
            content = choice['message']['content']
        else:
            content = result["message"]["content"]
        if not isinstance(content, str) or not content.strip():
            raise AIUnavailable("The provider returned no usable text. Try revising the request.")
        return content
    except requests.Timeout as error:
        raise AIUnavailable("The model took too long. Try again or select a faster model.") from error
    except (requests.RequestException, KeyError, IndexError, TypeError, ValueError, AttributeError) as error:
        label = provider.title()
        raise AIUnavailable(label + " could not answer. Check the connection and selected model.") from error
