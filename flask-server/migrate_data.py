"""One-time, non-destructive import from the cleaned standalone applications."""
import argparse
from pathlib import Path
import sqlite3
import os


def migrate(planner_path, posture_path):
    destination = Path(__file__).resolve().parent / "instance" / "workouts.db"
    if destination.exists():
        raise SystemExit("Destination already exists. Refusing to overwrite merged data.")
    for source in (planner_path, posture_path):
        if not source.is_file():
            raise SystemExit(f"Source is missing: {source}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    # SQLite backup provides a consistent snapshot even if the source app is open.
    with sqlite3.connect(planner_path.as_uri() + "?mode=ro", uri=True) as source:
        with sqlite3.connect(destination) as target:
            source.backup(target)
    os.environ["DATABASE_URL"] = "sqlite:///" + destination.as_posix()
    from server import app, db
    from models import TrainingSession, Workout
    from catalog import tracking_id
    from datetime import datetime
    with sqlite3.connect(posture_path.as_uri() + "?mode=ro", uri=True) as source:
        source.row_factory = sqlite3.Row
        rows = source.execute("SELECT * FROM workout_history").fetchall()
    with app.app_context():
        for row in rows:
            db.session.add(TrainingSession(
                exercise_type=row["exercise_type"], tracking_id=tracking_id(row["exercise_type"]),
                reps_completed=row["reps_completed"] or 0, duration=row["duration"] or 0,
                feedback=row["feedback"],
                completed_at=datetime.fromisoformat(row["completed_at"]),
                import_key=posture_path.as_posix() + ":" + str(row["id"])))
        db.session.commit()
        print(f"Imported {db.session.query(Workout).count()} saved workouts and {len(rows)} recorded sessions.")
    print("Standalone databases were not changed. Historical demo databases were not imported.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--planner", type=Path, required=True)
    parser.add_argument("--posture", type=Path, required=True)
    args = parser.parse_args()
    migrate(args.planner.resolve(), args.posture.resolve())
