"""Local workout planner API."""
import json
import os
from flask import request, jsonify, send_from_directory
from pathlib import Path
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from config import app, db
from models import Exercise, Workout
from providers import AIUnavailable, ask_model, public_settings, save_settings
from catalog import catalog


def payload():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ValueError("A JSON object is required.")
    return data


def text(value, label, limit=100):
    if not isinstance(value, str) or not value.strip() or len(value.strip()) > limit:
        raise ValueError(f"{label} must contain 1–{limit} characters.")
    return value.strip()


def integer(value, label, maximum=1000):
    if isinstance(value, bool) or not isinstance(value, (int, str)):
        raise ValueError(f"{label} must be a whole number from 1 to {maximum}.")
    try:
        number = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{label} must be a whole number from 1 to {maximum}.") from None
    if not 1 <= number <= maximum:
        raise ValueError(f"{label} must be a whole number from 1 to {maximum}.")
    return number


def exercises(value):
    if not isinstance(value, list) or not 1 <= len(value) <= 50:
        raise ValueError("Add between 1 and 50 exercises.")
    result = []
    for item in value:
        if not isinstance(item, dict):
            raise ValueError("Each exercise must be an object.")
        result.append(dict(name=text(item.get("name"), "Exercise name"),
                           sets=integer(item.get("sets"), "Sets", 100),
                           repetitions=integer(item.get("repetitions"), "Repetitions")))
    return result


@app.errorhandler(ValueError)
def invalid_input(error):
    return jsonify(error=str(error)), 400


@app.errorhandler(IntegrityError)
def conflict(error):
    db.session.rollback()
    return jsonify(error="A workout with this name already exists."), 409


@app.errorhandler(SQLAlchemyError)
def database_error(error):
    db.session.rollback()
    app.logger.exception("Database operation failed")
    return jsonify(error="Could not save your changes. Please try again."), 500


@app.get("/api/health")
def health():
    return jsonify(status="ok")


@app.get("/api/workouts")
def get_workouts():
    return jsonify(workouts=[w.to_json() for w in db.session.scalars(db.select(Workout).order_by(Workout.id.desc()))])


@app.post("/api/create_workout")
def create_workout():
    data = payload()
    name = text(data.get("name"), "Workout name")
    items = exercises(data.get("exercises"))
    workout = Workout(name=name, exercises=[Exercise(**item) for item in items])
    db.session.add(workout)
    db.session.commit()
    return jsonify(workout.to_json()), 201


@app.patch("/api/update_workout/<int:workout_id>")
def update_workout(workout_id):
    workout = db.session.get(Workout, workout_id)
    if workout is None:
        return jsonify(error="Workout not found."), 404
    data = payload()
    if not data or not set(data).issubset({"name", "exercises"}):
        raise ValueError("Provide a workout name and/or exercises.")
    # Validate all fields before changing stored data.
    name = text(data["name"], "Workout name") if "name" in data else workout.name
    items = exercises(data["exercises"]) if "exercises" in data else None
    workout.name = name
    if items is not None:
        workout.exercises = [Exercise(**item) for item in items]
    db.session.commit()
    return jsonify(workout.to_json())


@app.delete("/api/delete_workout/<int:workout_id>")
def delete_workout(workout_id):
    workout = db.session.get(Workout, workout_id)
    if workout is None:
        return jsonify(error="Workout not found."), 404
    db.session.delete(workout)
    db.session.commit()
    return jsonify(message="Workout deleted.")


@app.errorhandler(AIUnavailable)
def ai_error(error):
    return jsonify(error=str(error)), 503


@app.get("/api/settings")
def get_settings():
    return jsonify(public_settings())


@app.put("/api/settings")
def update_settings():
    save_settings(payload())
    return jsonify(public_settings())


@app.get("/api/catalog")
def get_catalog():
    return jsonify(exercises=catalog())


@app.post("/api/chat")
def chat():
    data = payload()
    message = text(data.get("message"), "Message", 4000)
    history = data.get("history", [])
    if not isinstance(history, list) or len(history) > 20:
        raise ValueError("Chat history must contain at most 20 messages.")
    messages = [{"role": "system", "content": "You are a concise fitness planning assistant. Acknowledge uncertainty; do not diagnose medical conditions."}]
    for item in history:
        if not isinstance(item, dict) or item.get("role") not in ("user", "assistant"):
            raise ValueError("Invalid chat history.")
        messages.append({"role": item["role"], "content": text(item.get("content"), "History message", 8000)})
    messages.append({"role": "user", "content": message})
    return jsonify(response=ask_model(messages))


@app.post("/api/generate_workout")
def generate_workout():
    data = payload()
    details = {key: integer(data.get(key), key.capitalize(), limit)
               for key, limit in [("height", 300), ("weight", 500), ("age", 120)]}
    for key, choices in {"gender": ["female", "male", "prefer-not-to-say"],
                         "fitnessLevel": ["beginner", "intermediate", "advanced"],
                         "goal": ["weight-loss", "muscle-gain", "overall-fitness", "stress-reduction"]}.items():
        if data.get(key) not in choices:
            raise ValueError(f"Choose a valid {key}.")
        details[key] = data[key]
    prompt = ('Create a balanced seven-day workout plan, Monday through Sunday, including recovery days. '
              'Return only a JSON object {"workout": [{"day": "Monday", "exercises": '
              '[{"exercise": "Squats", "sets": 3, "repetitions": 10}]}]}. '
              'Use an empty exercises array for recovery days. Use positive integer sets and repetitions. '
              'User details: ' + json.dumps(details))
    answer = ask_model([{"role": "user", "content": prompt}], json_mode=True)
    try:
        result = json.loads(answer)
        days = result.get("workout") if isinstance(result, dict) else result
        expected = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        if not isinstance(days, list) or len(days) != 7:
            raise ValueError("Expected seven days")
        cleaned = []
        for item, day in zip(days, expected):
            if not isinstance(item, dict) or item.get("day") != day or not isinstance(item.get("exercises"), list):
                raise ValueError("Invalid day")
            values = item["exercises"]
            parsed = exercises([dict(name=e.get("exercise"), sets=e.get("sets"), repetitions=e.get("repetitions")) for e in values]) if values else []
            cleaned.append({"day": day, "exercises": [dict(exercise=e["name"], sets=e["sets"], repetitions=e["repetitions"]) for e in parsed]})
        return jsonify(workout=cleaned)
    except (ValueError, TypeError, AttributeError) as error:
        raise AIUnavailable("The model returned an invalid plan. Try generating again or select a different model in Settings.") from error


from training import training
app.register_blueprint(training, url_prefix="/api/training")

@app.before_request
def require_json():
    if request.method in ("POST", "PATCH", "PUT") and not request.is_json:
        return jsonify(error="Use application/json."), 415

@app.errorhandler(413)
def oversized(error):
    return jsonify(error="Request is too large."), 413

with app.app_context():
    db.create_all()



@app.get("/")
@app.get("/<path:path>")
def frontend(path=""):
    if path.startswith("api/"):
        return jsonify(error="Endpoint not found."), 404
    dist = Path(__file__).resolve().parents[1] / "frontend" / "dist"
    if path and (dist / path).is_file():
        # Windows registry MIME mappings can identify JS as text/plain.
        # Module scripts require a JavaScript MIME type in every browser.
        mime = {".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css"}.get(Path(path).suffix)
        return send_from_directory(dist, path, mimetype=mime, conditional=mime != "text/javascript")
    if (dist / "index.html").is_file():
        return send_from_directory(dist, "index.html")
    return jsonify(message="Build the frontend or start its development server."), 503

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", 5002)), debug=False)
