# Exercise Posture Corrector

A full-stack fitness application that connects AI-assisted workout planning with webcam-based exercise tracking. Create a personalized weekly plan, save and edit workouts, launch supported exercises directly from a plan, count repetitions from pose landmarks, and review completed sessions in one interface.

## What the application does

### AI workout planning

- Generates a validated Monday-through-Sunday plan from height, weight, age, fitness level, goal, and other planning inputs.
- Includes recovery days and lets the user name and save each training day as an editable workout.
- Provides a fitness chat interface that uses the same explicitly selected AI provider.
- Supports Google Gemini, OpenAI, Anthropic, DeepSeek, and local Ollama through provider-specific server adapters.
- Keeps cloud API keys on the Flask server. Provider selection is explicit; requests never silently fall back to another service.

### Camera-based exercise tracking

- Uses OpenCV and MediaPipe Pose to process webcam frames and overlay detected landmarks.
- Includes exercise-specific processors for bicep curls, deadlifts, hammer curls, lunges, planks, pull-ups, push-ups, shoulder presses, and squats.
- Counts repetitions for supported movements and times plank holds. Exercise processors retain their own movement state and thresholds.
- Checks the visibility of joints used by the selected movement before counting. Partial poses can still be drawn while the tracker waits for sufficient visibility.
- Starts camera access only after the user chooses to begin. Frames are processed by the local Flask application and are not sent to a cloud AI provider or saved as images.

### One connected planning-to-training flow

1. Generate a weekly plan and review its exercise list.
2. Save a training day as a normal workout, then edit or reuse it.
3. Select a supported exercise from the saved workout to open the camera tracker with its exercise and plan context.
4. Keep unsupported exercises in the workout as **Plan only**; they are never guessed into a different movement.
5. Stop and save a session to record measured repetitions, duration, exercise, completion time, and optional source-workout details.
6. Review actual completed sessions in training history, separately from planned workouts.

A conservative exercise catalog maps exact known names and aliases to stable IDs—for example, “Push ups” maps to `push-up`. Unknown variants remain plan-only. Saved training history uses snapshots of plan names and IDs without a cascading workout foreign key, so deleting a plan does not erase completed-session history.

## Architecture

```text
React + Vite frontend
  Home, plan, generate, chat, train, history, settings
               │ /api
               ▼
Flask application ─────────── SQLAlchemy ── SQLite
  workout CRUD                  Workout / Exercise
  chat and plan generation      TrainingSession
  provider adapters             independent plan and activity records
  /api/training                 session and frame lifecycle
               │
       ┌───────┴────────┐
       │                │
 MediaPipe/OpenCV    Selected text model
 local camera frames Gemini / OpenAI / Anthropic /
                     DeepSeek / local Ollama
```

The React application uses React Router and Vite. Flask serves the built frontend and JSON API from one local server; Vite proxies API requests during development. SQLAlchemy owns workout plans, their exercises, and completed training sessions. The training API manages isolated, temporary pose-estimator instances for active sessions, releases them when sessions end or expire, and saves each completed session once.

## Technology

- **Frontend:** React, React Router, Vite, JavaScript, responsive CSS
- **Backend:** Python, Flask, Flask-SQLAlchemy, SQLAlchemy
- **Computer vision:** OpenCV, MediaPipe Pose Solutions API, NumPy
- **Storage:** SQLite by default; configurable through `DATABASE_URL`
- **AI:** Gemini `generateContent`, OpenAI Responses API, Anthropic Messages API, DeepSeek Chat Completions, Ollama Chat API
- **Verification:** Python `unittest`, ESLint, Vite production build, Playwright browser checks with synthetic or denied camera input

## Run locally

Requirements: Python 3.12 and Node.js 22.12+ or 24. MediaPipe dependencies are pinned in `flask-server/requirements.txt` for the existing Solutions-based exercise processors.

From the repository root in PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r flask-server\requirements.txt
npm ci --prefix frontend
npm run build --prefix frontend
.venv\Scripts\python flask-server/server.py
```

Open <http://127.0.0.1:5002>. For frontend development, leave Flask running, then run `npm run dev --prefix frontend` and open <http://127.0.0.1:5175>.

## Configure an AI provider

Open **Settings** in the application, select a provider, and enter a model ID supported by that provider. `gemini-3.5-flash-lite` is a low-cost Gemini testing option; availability, free-tier access, and quotas depend on the Google AI Studio project.

Copy `flask-server/.env.example` to `flask-server/.env`, add the key for the provider you choose, and restart Flask:

```env
GEMINI_API_KEY=your_key_here
# or OPENAI_API_KEY=your_key_here
# or ANTHROPIC_API_KEY=your_key_here
# or DEEPSEEK_API_KEY=your_key_here
```

Settings includes direct links to provider API documentation, key pages, and pricing. Never commit `.env` or put API keys in frontend code or browser storage. The settings API returns only whether a key is configured. Ollama uses a local server and does not need a cloud API key. Provider model choices are stored in the ignored `flask-server/instance/provider_settings.json` file.

## API overview

| Route | Purpose |
| --- | --- |
| `GET /api/health` | Application status |
| `GET /api/workouts` | List saved plans |
| `POST /api/create_workout` | Save a plan |
| `PATCH /api/update_workout/<id>` | Edit a plan |
| `DELETE /api/delete_workout/<id>` | Delete a plan |
| `POST /api/generate_workout` | Generate and validate a weekly plan |
| `POST /api/chat` | Send a chat prompt to the selected provider |
| `GET /api/settings`, `PUT /api/settings` | Read safe provider status and select provider/model |
| `GET /api/catalog` | Return stable supported exercise IDs |
| `GET /api/training/health` | Check tracker availability and exercise catalog |
| `POST /api/training/sessions` | Start an isolated exercise session |
| `POST /api/training/sessions/<token>/frame` | Process one base64 image frame and return annotated results |
| `POST /api/training/sessions/<token>/end` | Release tracking resources and save completed activity once |
| `GET /api/training/history` | Read completed training sessions |

JSON validation, bounded request sizes, structured error responses, conflict handling, model timeouts, provider quota errors, and incomplete responses are handled by the backend.

## Data migration

`flask-server/migrate_data.py` can make a one-time copy of an existing planner database and completed posture history into a new merged database. It reads source databases without modifying them, refuses to overwrite a destination database, and skips demonstration data. It is intended for initial migration rather than synchronization. See the script's help output before using it on other databases.

## Checks

```powershell
.venv\Scripts\python -m unittest discover -s flask-server -p "test_*.py" -v
npm run lint --prefix frontend
npm run build --prefix frontend
npm run test:e2e --prefix frontend
```

The backend suite covers planner validation, provider request/response handling, exercise matching, session lifecycle, history, and API errors. Browser tests cover navigation, workout editing, provider settings, plan-to-tracker linking, mobile layout, and camera permission/lifecycle behavior. They use synthetic video or simulated permission denial; they do not evaluate real movement accuracy or call live AI services.

## Scope and limitations

- Local, single-user application; authentication and multi-user hosting are not implemented.
- Pose-based repetition counts are estimates from 2D landmarks, not validated exercise-form or medical feedback. Camera framing, lighting, occlusion, and individual movement affect results.
- MediaPipe Solutions is pinned because the existing exercise processors depend on that API. Migration to MediaPipe Tasks is a separate update.
- Yoga remains outside the active feature set.

## Photo credit

See [`frontend/src/img/CREDITS.md`](frontend/src/img/CREDITS.md) for the homepage image source and license information.