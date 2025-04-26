# AI Fitness Trainer

An AI-powered fitness application that uses computer vision to detect exercises, count repetitions, and provide real-time feedback on form.

## Project Structure

The application is organized into two main components:

### Backend (Flask)

The backend is located in the `backend/` directory and handles:
- Camera input processing with OpenCV and MediaPipe
- Exercise detection, counting, and form evaluation
- User authentication and session management
- Workout history tracking
- Yoga pose detection

### Frontend (React)

The frontend is located in the `frontend/` directory and provides:
- Modern, responsive user interface
- Real-time exercise feedback display
- Workout history visualization
- User profile management
- Camera integration

## Directory Structure

```
AI-Fitness-Trainer/
├── backend/               # Backend Flask application
│   ├── app.py             # Main Flask application
│   ├── forms.py           # Form definitions
│   ├── models.py          # Database models
│   ├── __init__.py        # Package initialization
│   ├── exercises/         # Exercise processing modules
│   ├── templates/         # Flask HTML templates
│   └── yoga_pose_detection/ # Yoga pose detection module
├── frontend/              # React frontend application
│   ├── public/            # Static assets
│   ├── src/               # React source code
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── App.js         # Main React component
│   │   └── index.js       # React entry point
│   ├── package.json       # NPM package configuration
│   └── README.md          # Frontend documentation
├── run.py                 # Script to run the application
├── setup.py               # Setup script for the application
├── start_app.bat          # Windows batch script to start the app
├── requirements.txt       # Python dependencies
└── README.md              # This file
```

## Setup and Installation

### Prerequisites
- Python 3.6+
- Node.js and npm
- Camera device

### Backend Setup
1. Create a virtual environment:
   ```
   python -m venv venv
   ```
2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Build the production version (optional):
   ```
   npm run build
   ```

## Running the Application

### Development Mode
1. Start the backend server:
   ```
   python run.py
   ```
2. In a separate terminal, start the frontend development server:
   ```
   cd frontend
   npm start
   ```
3. Open your browser and navigate to `http://localhost:3000`

### Production Mode
1. Build the frontend:
   ```
   cd frontend
   npm run build
   ```
2. Start the application in production mode:
   ```
   python run.py --production
   ```
3. Open your browser and navigate to `http://localhost:5000`

### Windows Quick Start
1. Double-click `start_app.bat` to start both the backend and frontend servers

## Features

- Real-time exercise detection and counting
- Form evaluation and feedback
- Multiple exercise support (squats, push-ups, planks, etc.)
- Yoga pose detection and guidance
- User accounts and workout history
- Camera diagnostics and troubleshooting

## Project Organization

- **Backend Code**: Located in the `backend/` directory
- **Frontend Code**: Located in the `frontend/` directory
- **Exercise Processing**: Located in `backend/exercises/`
- **Yoga Detection**: Located in `backend/yoga_pose_detection/`

## Prerequisites

- Python 3.7+
- Node.js 14+
- npm or yarn
- A webcam

## Quick Start (Windows)

1. **Using PowerShell Script (Recommended)**:
   ```
   cd "EXERCISE POSTUJRES"
   .\start_powershell.ps1
   ```
   This will start both servers properly in separate PowerShell windows.

2. **Using Batch File**:
   ```
   cd "EXERCISE POSTUJRES"
   .\start_app.bat
   ```

## Manual Setup

### Backend (Flask)

1. Set up a virtual environment (recommended):
   ```
   python -m venv fitness_env
   .\fitness_env\Scripts\activate  # Windows PowerShell/CMD
   source fitness_env/bin/activate  # Linux/Mac
   ```

2. Install the required packages:
   ```
   cd "EXERCISE POSTUJRES"
   pip install -r requirements.txt
   pip install flask-cors
   pip install mediapipe
   ```

3. Run the Flask application:
   ```
   cd "EXERCISE POSTUJRES"
   python run.py
   ```
   The Flask backend will run on http://localhost:5000

### Frontend (React)

1. Navigate to the frontend directory:
   ```
   cd "EXERCISE POSTUJRES\frontend"
   ```

2. Install the required packages:
   ```
   npm install
   ```

3. Start the React development server:
   ```
   npm start
   ```
   The React frontend will run on http://localhost:3000

## Using the Application

1. **Home Page**: Select an exercise or test your camera
2. **Exercise Page**: Start the camera and perform exercises to track repetitions
3. **Profile Page**: Update your personal information for better calorie calculations
4. **History Page**: View your workout history and statistics
5. **Camera Test**: Run diagnostics if you encounter camera issues

## Troubleshooting Camera Issues

If you encounter camera issues:

1. Ensure your browser has camera permissions (check the lock icon in your address bar)
2. Close other applications that might be using your camera (Zoom, Teams, etc.)
3. Check if your camera is enabled in system settings (Windows Privacy Settings)
4. Try a different browser (Chrome works best)
5. Visit the Camera Test page for detailed diagnostics
6. Make sure MediaPipe is installed: `pip install mediapipe`

## Common Issues

1. **PowerShell Command Issues**: Windows PowerShell doesn't support the `&&` operator. Use the start_powershell.ps1 script instead.
2. **MediaPipe Not Available**: Run `pip install mediapipe` and restart the Flask server.
3. **Camera Not Working**: Check Windows Privacy Settings and browser permissions.
4. **Wrong Directory**: Make sure you're running commands from the correct directory:
   - Flask backend: Run from EXERCISE POSTUJRES directory
   - React frontend: Run from EXERCISE POSTUJRES\frontend directory

## License

MIT License 