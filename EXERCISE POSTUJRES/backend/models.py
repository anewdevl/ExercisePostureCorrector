from flask_login import UserMixin
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import os

Base = declarative_base()

class User(Base, UserMixin):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    username = Column(String(64), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(128))
    first_name = Column(String(64))
    last_name = Column(String(64))
    height = Column(Float)  # in cm
    weight = Column(Float)  # in kg
    age = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # New user details fields
    fitness_goals = Column(String(256))  # e.g. "weight loss, muscle gain, endurance"
    experience_level = Column(String(32))  # e.g. "beginner", "intermediate", "advanced"
    preferred_workout_days = Column(String(64))  # e.g. "Monday,Wednesday,Friday"
    profile_picture_url = Column(String(256))  # URL or path to profile picture
    
    # Relationship to workouts
    workouts = relationship("WorkoutHistory", back_populates="user")
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f"<User {self.username}>"

class WorkoutHistory(Base):
    __tablename__ = "workout_history"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    exercise_type = Column(String(64), nullable=False)
    reps_completed = Column(Integer, default=0)
    duration = Column(Float, default=0)  # in seconds
    calories_burned = Column(Float, default=0)
    feedback = Column(String(256))
    completed_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to user
    user = relationship("User", back_populates="workouts")
    
    def __repr__(self):
        return f"<Workout {self.exercise_type} by User {self.user_id}>"

class ExerciseForm(Base):
    __tablename__ = "exercise_form"
    
    id = Column(Integer, primary_key=True)
    workout_id = Column(Integer, ForeignKey("workout_history.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    form_score = Column(Float, default=0)  # 0-100 scoring of form
    issues_detected = Column(String(512))  # JSON string of issues
    
    def __repr__(self):
        return f"<ExerciseForm for Workout {self.workout_id}>"

# Initialize database
def init_db():
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "exercise.db")
    engine = create_engine(f"sqlite:///{db_path}")
    Base.metadata.create_all(engine)
    return engine

def get_session():
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "exercise.db")
    engine = create_engine(f"sqlite:///{db_path}")
    Session = sessionmaker(bind=engine)
    return Session() 