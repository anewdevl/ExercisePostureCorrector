from config import db
from catalog import tracking_id

class Workout(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    exercises = db.relationship('Exercise', back_populates='workout', cascade='all, delete-orphan')

    def to_json(self):
        return {
            "id": self.id,
            "name": self.name,
            "exercises": [exercise.to_json() for exercise in self.exercises]
        }

class Exercise(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=False, nullable=False)
    sets = db.Column(db.Integer, nullable=False)
    repetitions = db.Column(db.Integer, nullable=False)
    workout_id = db.Column(db.Integer, db.ForeignKey('workout.id'), nullable=False)
    workout = db.relationship('Workout', back_populates='exercises')

    def to_json(self):
        return {
            "id": self.id,
            "name": self.name,
            "sets": self.sets,
            "repetitions": self.repetitions,
            "trackingId": tracking_id(self.name)
        }

class TrainingSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    exercise_type = db.Column(db.String(100), nullable=False)
    tracking_id = db.Column(db.String(40), nullable=True)
    reps_completed = db.Column(db.Integer, default=0)
    duration = db.Column(db.Float, default=0)
    feedback = db.Column(db.String(256))
    completed_at = db.Column(db.DateTime, nullable=False)
    source_workout_id = db.Column(db.Integer, nullable=True)
    source_workout_name = db.Column(db.String(100), nullable=True)
    source_exercise_id = db.Column(db.Integer, nullable=True)
    import_key = db.Column(db.String(256), unique=True, nullable=True)
