"""Local browser-camera API with isolated, bounded workout sessions."""
import base64
import binascii
import secrets
import threading
import time
from datetime import datetime, timezone

import cv2
import numpy as np
from flask import Blueprint, jsonify, request, current_app
from sqlalchemy import select
from config import db
from models import TrainingSession as WorkoutHistory, Exercise
from catalog import tracking_id, tracking_name
from exercises.utils import initialize_pose, draw_landmarks, MEDIAPIPE_AVAILABLE
from exercises.bicepcurls import process_bicepcurls
from exercises.deadlifts import process_deadlifts
from exercises.hammercurls import process_hammercurls
from exercises.lunges import process_lunges
from exercises.plank import process_plank
from exercises.pullups import process_pullups
from exercises.pushups import process_pushups
from exercises.shoulderpress import process_shoulderpress
from exercises.squats import process_squats
from exercises.visibility import joints_visible

training = Blueprint("training", __name__)
PROCESSORS = {"Bicep Curls": process_bicepcurls, "Deadlifts": process_deadlifts,
              "Hammer Curls": process_hammercurls, "Lunges": process_lunges,
              "Plank": process_plank, "Pull-ups": process_pullups, "Push-ups": process_pushups,
              "Shoulder Press": process_shoulderpress, "Squats": process_squats}
sessions = {}
guard = threading.RLock()
SESSION_TTL = 300


def payload():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ValueError("A JSON object is required.")
    return data


def close_pose(state):
    pose = state.get("pose")
    if pose is not None:
        pose.close()
        state["pose"] = None


def prune():
    now = time.monotonic()
    for token, state in list(sessions.items()):
        if now - state["touched"] > SESSION_TTL:
            with state["lock"]:
                close_pose(state)
                del sessions[token]


def serialize(workout):
    return {"id": workout.id, "exercise": workout.exercise_type,
            "repetitions": workout.reps_completed, "duration": round(workout.duration or 0, 1),
            "completedAt": workout.completed_at.isoformat() + "Z",
            "feedback": workout.feedback, "trackingId": workout.tracking_id,
            "workoutName": workout.source_workout_name, "workoutId": workout.source_workout_id}


@training.get("/health")
def health():
    with guard:
        prune()
    return jsonify(status="ok", poseAvailable=MEDIAPIPE_AVAILABLE, exercises=list(PROCESSORS))


@training.post("/sessions")
def start_session():
    data = payload()
    name = tracking_name(data.get("trackingId")) if data.get("trackingId") else data.get("exercise")
    source = None
    if data.get("planExerciseId") is not None:
        identifier = data["planExerciseId"]
        if isinstance(identifier, bool) or not isinstance(identifier, int):
            raise ValueError("Invalid planned exercise.")
        source = db.session.get(Exercise, identifier)
        if source is None or tracking_id(source.name) != tracking_id(name):
            raise ValueError("This planned exercise no longer matches. Reopen it from your saved workout.")

    if not isinstance(name, str) or name not in PROCESSORS:
        raise ValueError("Choose a supported exercise.")
    if not MEDIAPIPE_AVAILABLE:
        return jsonify(error="Pose detection is unavailable. Install the project's pinned requirements."), 503
    with guard:
        prune()
        if sum(s["summary"] is None for s in sessions.values()) >= 4:
            return jsonify(error="Too many active sessions. Stop another session and try again."), 409
        try:
            mp_pose, pose, drawing = initialize_pose()
        except Exception:
            current_app.logger.exception("Pose initialization failed")
            return jsonify(error="Could not initialize pose detection."), 503
        token = secrets.token_urlsafe(24)
        sessions[token] = {
            "source_workout_id": source.workout_id if source else None,
            "source_workout_name": source.workout.name if source else None,
            "source_exercise_id": source.id if source else None,
            "exercise": name, "pose": pose, "mp_pose": mp_pose, "drawing": drawing,
            "counter": 0, "stage": "ready", "started": time.monotonic(), "touched": time.monotonic(),
            "plank": {"start_time": None, "best_duration": 0, "current_duration": 0},
            "lock": threading.RLock(), "summary": None, "frames": 0, "tracked": 0,
        }
    return jsonify(token=token), 201


def lookup(token):
    with guard:
        state = sessions.get(token)
        if state and time.monotonic() - state['touched'] > SESSION_TTL:
            with state['lock']:
                close_pose(state)
                del sessions[token]
            return None
        if state:
            state["touched"] = time.monotonic()
        return state


def decode_frame(value):
    if not isinstance(value, str) or not value.startswith("data:image/jpeg;base64,"):
        raise ValueError("A JPEG camera frame is required.")
    try:
        raw = base64.b64decode(value.split(",", 1)[1], validate=True)
    except (binascii.Error, ValueError):
        raise ValueError("Invalid image encoding.") from None
    frame = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR) if raw else None
    if frame is None or max(frame.shape[:2]) > 1920:
        raise ValueError("Invalid camera frame or resolution above 1920 pixels.")
    return frame


@training.post("/sessions/<token>/frame")
def process_frame(token):
    state = lookup(token)
    if state is None:
        return jsonify(error="Session expired. Start a new workout."), 404
    frame = decode_frame(payload().get("image"))
    with state["lock"]:
        if state["summary"] is not None or state["pose"] is None:
            return jsonify(error="This session has ended."), 409
        try:
            results = state["pose"].process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            state["frames"] += 1
            landmarks = getattr(results, "pose_landmarks", None)
            visible = joints_visible(landmarks, state['exercise'])
            if visible:
                state["tracked"] += 1
                args = (frame, results, state["mp_pose"], state["counter"], state["stage"])
                if state["exercise"] == "Plank":
                    frame, state["counter"], state["stage"], state["plank"] = process_plank(*args, state["plank"])
                else:
                    frame, state["counter"], state["stage"] = PROCESSORS[state["exercise"]](*args)
            else:
                # Lost landmarks must not count a repetition or extend a plank timer.
                state["stage"] = "ready"
                state["plank"]["start_time"] = None
                state["plank"]["current_duration"] = 0
            # Show detected landmarks immediately, even before all joints needed
            # for this exercise are confident enough to count movement.
            if landmarks is not None:
                frame = draw_landmarks(frame, results, state["mp_pose"], state["drawing"])
            ok, encoded = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
            if not ok:
                raise RuntimeError("Frame encoding failed")
            return jsonify(image="data:image/jpeg;base64," + base64.b64encode(encoded).decode(),
                           repetitions=int(state["counter"]), stage=state["stage"],
                           elapsed=round(time.monotonic() - state["started"], 1),
                           hold=round(state["plank"]["current_duration"], 1),
                           bestHold=round(state["plank"]["best_duration"], 1),
                           tracking=visible, message="Pose tracked" if visible else
                           "Pose detected — keep the joints needed for this exercise clearly in view" if landmarks is not None else
                           "Move your whole body into view")
        except Exception:
            current_app.logger.exception("Frame processing failed")
            return jsonify(error="Could not process this camera frame. Stop and restart the session."), 500


@training.post("/sessions/<token>/end")
def end_session(token):
    payload()
    state = lookup(token)
    if state is None:
        return jsonify(error="Session expired. No workout was saved."), 404
    with state["lock"]:
        if state["summary"] is not None:
            return jsonify(state["summary"])
        duration = time.monotonic() - state["started"]
        # Do not create history entries for camera failures or empty sessions.
        if not state["tracked"]:
            state["summary"] = {"saved": False, "message": "No tracked movement was recorded."}
        else:
            workout = WorkoutHistory(
                exercise_type=state["exercise"], tracking_id=tracking_id(state["exercise"]),
                reps_completed=int(state["counter"]), duration=duration,
                source_workout_id=state["source_workout_id"],
                source_workout_name=state["source_workout_name"],
                source_exercise_id=state["source_exercise_id"],
                feedback=f"Best hold: {state['plank']['best_duration']:.1f}s" if state["exercise"] == "Plank" else "Repetitions estimated from pose landmarks",
                completed_at=datetime.now(timezone.utc).replace(tzinfo=None))
            db.session.add(workout)
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()
                current_app.logger.exception("Could not save workout")
                return jsonify(error="Could not save this session. Try stopping again."), 500
            state["summary"] = {"saved": True, "workout": serialize(workout)}
        close_pose(state)
        return jsonify(state["summary"])


@training.get("/history")
def history():
    workouts = db.session.scalars(select(WorkoutHistory).order_by(WorkoutHistory.completed_at.desc()).limit(500)).all()
    return jsonify(workouts=[serialize(w) for w in workouts])
