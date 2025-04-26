# AI Fitness Trainer Backend

This directory contains the backend components of the AI Fitness Trainer application.

## Proper Directory Structure

The backend should be organized as follows:

```
backend/
├── app.py              # Main Flask application
├── forms.py            # Form definitions for Flask-WTF
├── models.py           # SQLAlchemy database models
├── __init__.py         # Package initialization
├── exercises/          # Exercise processing modules
│   ├── __init__.py
│   ├── utils.py        # Shared utilities for exercise processing
│   ├── bicepcurls.py   # Bicep curl exercise processing
│   ├── deadlifts.py    # Deadlift exercise processing
│   ├── hammercurls.py  # Hammer curl exercise processing
│   ├── lunges.py       # Lunge exercise processing
│   ├── plank.py        # Plank exercise processing
│   ├── pullups.py      # Pull-ups exercise processing
│   ├── pushups.py      # Push-ups exercise processing
│   ├── shoulderpress.py # Shoulder press exercise processing
│   └── squats.py       # Squat exercise processing
├── templates/          # Flask HTML templates
│   ├── base.html       # Base template with common elements
│   ├── index.html      # Main page template
│   ├── login.html      # Login page template
│   ├── register.html   # Registration page template
│   ├── profile.html    # User profile template
│   ├── history.html    # Workout history template
│   └── camera_test.html # Camera test page template
└── yoga_pose_detection/ # Yoga pose detection module
    ├── __init__.py
    ├── api.py          # API endpoints for yoga pose detection
    ├── utils.py        # Utilities for yoga pose detection
    ├── yoga_detector.py # Yoga pose detection implementation
    └── models/         # Machine learning models for yoga pose detection
```

## Setup Instructions

1. Move the exercise files from the main directory to `backend/exercises/`
2. Move the templates from the main directory to `backend/templates/`
3. Move the yoga_pose_detection module to `backend/yoga_pose_detection/`
4. Update the import paths in all affected files

## Running the Application

The application can be run using:

```bash
python run.py
```

Or for development:

```bash
python run.py --host 127.0.0.1 --port 5000
``` 