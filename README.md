# Exercise Posture Corrector

Exercise Posture Corrector helps you plan workouts, organize routines, and track selected exercises with your camera. Choose Gemini, OpenAI, Anthropic, DeepSeek, or a local Ollama model for workout planning and fitness chat.

## Features

- Generate a seven-day workout plan from your fitness details.
- Save, edit, and organize workout plans.
- Track nine supported exercises using camera-based pose landmarks.
- Review completed training sessions in your local history.
- Choose an AI provider; API keys remain in the server environment.
- Keep camera frames on your computer during tracking.

## Requirements

- Windows, Python 3.12, and Node.js 22.12+ or 24.
- MediaPipe-compatible environment listed in `flask-server/requirements.txt`.

## Run locally

From the repository root:

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r flask-server\requirements.txt
npm ci --prefix frontend
npm run build --prefix frontend
.venv\Scripts\python flask-server/server.py
```

Open <http://127.0.0.1:5002>. For frontend development, leave Flask running, start `npm run dev --prefix frontend`, and open <http://127.0.0.1:5175>.

## Configure an AI provider

Open Settings in the app and choose a provider and model. For Gemini, `gemini-3.5-flash-lite` is a low-cost testing option; availability and free-tier limits depend on your Google AI Studio project.

Copy `flask-server/.env.example` to `flask-server/.env`. Add only the API key for the provider you use, then restart Flask:

```env
GEMINI_API_KEY=your_key_here
# or OPENAI_API_KEY=your_key_here
# or ANTHROPIC_API_KEY=your_key_here
# or DEEPSEEK_API_KEY=your_key_here
```

Never commit `.env` or put API keys in frontend code. Ollama runs locally and does not need a cloud API key. Settings has direct links to provider key pages, API docs, and pricing.

## Exercise tracking

The tracker estimates reps from 2D pose landmarks. Keep the joints needed for the chosen exercise visible, with good lighting and enough room to move. Stop and save a session to add it to local history. These estimates are not a clinical or validated form assessment.

## Checks

```powershell
.venv\Scripts\python -m unittest discover -s flask-server -p "test_*.py" -v
npm run lint --prefix frontend
npm run build --prefix frontend
npm run test:e2e --prefix frontend
```

## License and photo credit

See `frontend/src/img/CREDITS.md` for homepage photography attribution. Add the project license here when one is selected.
