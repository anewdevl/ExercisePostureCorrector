from flask import Flask, Response, render_template, jsonify, redirect, url_for, flash, request, session, send_from_directory
from flask_cors import CORS  # Import CORS
import cv2
import numpy as np
# Try to import mediapipe, but handle case when not available
try:
    import mediapipe as mp
except ImportError:
    mp = None
import os
import json
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
from flask_login import LoginManager, login_user, logout_user, current_user, login_required
from datetime import datetime, timedelta
import math
import time
import traceback
import random

# Import database models and forms
from backend.models import User, WorkoutHistory, ExerciseForm, init_db, get_session
from backend.forms import LoginForm, RegistrationForm, ProfileForm

# Import the yoga pose detection module
from yoga_pose_detection import init_app as init_yoga

# Initialize Flask app
app = Flask(__name__, 
           template_folder='../templates',  # Templates are still in the main directory for now
           static_folder='../frontend/build/static')  # Static files from React build
           
# Enable CORS for all routes with more permissive settings
CORS(app, 
     resources={r"/*": {"origins": "*"}}, 
     supports_credentials=True, 
     allow_headers=["Content-Type", "Authorization"])

# Application configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///exercise.db'
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Important for cross-site cookie access
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS

# Threading and request handling configuration
app.config['PRESERVE_CONTEXT_ON_EXCEPTION'] = False
app.config['TESTING'] = False
app.config['PROPAGATE_EXCEPTIONS'] = True

# Check if a production build of the React app exists
react_build_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend/build')
has_react_build = os.path.exists(react_build_dir)

# Initialize database
init_db()

# Setup Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(id):
    session = get_session()
    user = session.query(User).get(int(id))
    session.close()
    return user

# Global variables to maintain state
exercise_state = {
    'counter': 0,
    'stage': 'up',
    'plank_state': {'start_time': None, 'best_duration': 0, 'current_duration': 0},
    'workout_id': None
}

# Initialize MediaPipe
mp_pose, pose, mp_drawing = initialize_pose()

# Initialize the yoga pose detection module
init_yoga(app)

def generate_frames(exercise_name):
    try:
        # Try to open the camera with more explicit error handling
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            # If camera fails to open, yield an error frame
            error_img = np.zeros((480, 640, 3), np.uint8)
            cv2.putText(error_img, "ERROR: Could not access camera", (50, 240), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            cv2.putText(error_img, "Please check if camera is in use by another app", (50, 280), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            
            ret, buffer = cv2.imencode('.jpg', error_img)
            error_frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + error_frame + b'\r\n')
            return
    
        # Create a new workout record with demo user
        try:
            db_session = get_session()
            # Get or create demo user
            user = db_session.query(User).filter_by(username="demo").first()
            if not user:
                user = User(username="demo", email="demo@example.com")
                user.set_password("demopassword")
                db_session.add(user)
                db_session.commit()
                
            workout = WorkoutHistory(
                user_id=user.id,
                exercise_type=exercise_name,
                completed_at=datetime.utcnow()
            )
            db_session.add(workout)
            db_session.commit()
            exercise_state['workout_id'] = workout.id
            db_session.close()
        except Exception as e:
            print(f"Error creating workout record: {e}")
        
        # Store the exercise name in the state - don't use Flask session
        exercise_state['exercise_name'] = exercise_name
        
        # Store pose landmarks locally instead of in session
        pose_landmarks_data = None
        
        # Continue with the normal frame processing
        while True:
            ret, frame = cap.read()
            if not ret:
                # If frame reading fails, yield an error frame
                error_img = np.zeros((480, 640, 3), np.uint8)
                cv2.putText(error_img, "ERROR: Lost camera connection", (50, 240), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                
                ret, buffer = cv2.imencode('.jpg', error_img)
                error_frame = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + error_frame + b'\r\n')
                break
                
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb)
            
            # Store the pose landmarks locally instead of in session
            if results is not None and hasattr(results, 'pose_landmarks') and results.pose_landmarks:
                pose_landmarks_data = results
            else:
                pose_landmarks_data = None
            
            # Check if we have landmarks or if results is None
            has_landmarks = results is not None and hasattr(results, 'pose_landmarks') and results.pose_landmarks
            
            if has_landmarks:
                if exercise_name == "Plank":
                    frame, exercise_state['counter'], exercise_state['stage'], exercise_state['plank_state'] = process_plank(
                        frame, results, mp_pose,
                        exercise_state['counter'],
                        exercise_state['stage'],
                        exercise_state['plank_state']
                    )
                else:
                    process_func = {
                        "Bicep Curls": process_bicepcurls,
                        "Deadlifts": process_deadlifts,
                        "Hammer Curls": process_hammercurls,
                        "Lunges": process_lunges,
                        "Pull-ups": process_pullups,
                        "Push-ups": process_pushups,
                        "Shoulder Press": process_shoulderpress,
                        "Squats": process_squats
                    }[exercise_name]
                    
                    frame, exercise_state['counter'], exercise_state['stage'] = process_func(
                        frame, results, mp_pose,
                        exercise_state['counter'],
                        exercise_state['stage']
                    )
                
                frame = draw_landmarks(frame, results, mp_pose, mp_drawing)
            else:
                # If mediapipe is not available or no pose detected, show a message
                cv2.putText(frame, "No pose detected - Stand in view of camera", 
                          (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
            
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
    
    except Exception as e:
        # Handle any unexpected errors
        print(f"Camera error: {e}")
        error_img = np.zeros((480, 640, 3), np.uint8)
        cv2.putText(error_img, f"Camera error: {e}", (50, 240), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        
        ret, buffer = cv2.imencode('.jpg', error_img)
        error_frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + error_frame + b'\r\n')
    
    finally:
        # Always properly close the camera
        if 'cap' in locals() and cap is not None:
            cap.release()

def save_workout_progress():
    if exercise_state.get('workout_id'):
        try:
            db_session = get_session()
            workout = db_session.query(WorkoutHistory).get(exercise_state['workout_id'])
            if workout:
                workout.reps_completed = exercise_state['counter']
                if workout.exercise_type == "Plank":
                    workout.duration = exercise_state['plank_state']['best_duration']
                
                # Calculate calories (simple estimation)
                # MET values: Plank=3.5, Others=5
                met = 3.5 if workout.exercise_type == "Plank" else 5
                duration_hours = workout.duration / 3600 if workout.duration else 0.01
                if not workout.duration and workout.reps_completed > 0:
                    # Estimate 3 seconds per rep if duration not tracked
                    duration_hours = (workout.reps_completed * 3) / 3600
                
                # Use default weight if user has none
                user = db_session.query(User).filter_by(username="demo").first()
                if user and user.weight:
                    workout.calories_burned = met * user.weight * duration_hours
                else:
                    # Default weight of 70kg if no user or weight not set
                    workout.calories_burned = met * 70 * duration_hours
                
                db_session.commit()
            db_session.close()
        except Exception as e:
            print(f"Error saving workout progress: {e}")

@app.route('/')
def index():
    exercises_data = [
        {
            "name": "Bicep Curls",
            "description": "Targets bicep muscles in your arms",
            "instructions": "1. Stand with feet shoulder-width apart, arms fully extended\n2. Hold dumbbells with palms facing forward\n3. Flex at the elbow to curl the weights up\n4. Slowly lower back to starting position\n5. Keep upper arms stationary throughout"
        },
        {
            "name": "Deadlifts",
            "description": "Full-body exercise focusing on posterior chain",
            "instructions": "1. Stand with feet hip-width apart, toes under bar\n2. Bend at hips and knees, grab bar shoulder-width\n3. Keep back flat, chest up, shoulders back\n4. Push through heels and stand up straight\n5. Return weight to floor with controlled movement"
        },
        {
            "name": "Hammer Curls",
            "description": "Works biceps and forearms for improved grip strength",
            "instructions": "1. Stand with feet shoulder-width apart\n2. Hold dumbbells with palms facing inward\n3. Raise the weights by flexing at the elbow\n4. Pause at the top, then slowly lower\n5. Keep shoulders back and stable throughout"
        },
        {
            "name": "Lunges",
            "description": "Strengthens legs and improves balance",
            "instructions": "1. Stand up straight with feet together\n2. Step forward with one leg\n3. Lower your body until both knees form 90° angles\n4. Push back up to starting position\n5. Alternate between legs for full workout"
        },
        {
            "name": "Plank",
            "description": "Core stabilizing exercise that builds endurance",
            "instructions": "1. Start in push-up position, elbows bent 90°\n2. Rest weight on forearms, elbows under shoulders\n3. Form straight line from head to heels\n4. Keep abs tight and look down at the floor\n5. Hold position as long as possible with proper form"
        },
        {
            "name": "Pull-ups",
            "description": "Upper body exercise targeting back and arms",
            "instructions": "1. Grip bar with hands wider than shoulder-width\n2. Hang with arms fully extended\n3. Pull yourself up until chin is over bar\n4. Lower back down with control\n5. Keep shoulder blades down and back"
        },
        {
            "name": "Push-ups",
            "description": "Classic exercise for chest, shoulders, and triceps",
            "instructions": "1. Start in plank position, hands shoulder-width apart\n2. Keep body in straight line from head to heels\n3. Lower chest toward floor by bending elbows\n4. Push back up to starting position\n5. Keep core tight throughout movement"
        },
        {
            "name": "Shoulder Press",
            "description": "Builds shoulder strength and stability",
            "instructions": "1. Sit or stand with back straight\n2. Hold weights at shoulder height, palms forward\n3. Press weights up until arms are fully extended\n4. Slowly lower back to starting position\n5. Keep core engaged to protect lower back"
        },
        {
            "name": "Squats",
            "description": "Compound movement targeting legs and glutes",
            "instructions": "1. Stand with feet shoulder-width apart\n2. Keep chest up, back straight\n3. Lower hips back and down as if sitting\n4. Keep knees aligned over toes, not past them\n5. Push through heels to return to standing"
        }
    ]
    
    # Extract just the names for backward compatibility
    exercise_names = [ex["name"] for ex in exercises_data]
    
    return render_template('index.html', 
                           exercises=exercise_names,
                           exercises_data=exercises_data,
                           user=current_user)

@app.route('/check_mediapipe')
def check_mediapipe():
    """Route to check if MediaPipe is available"""
    return jsonify({"available": MEDIAPIPE_AVAILABLE})

@app.route('/video_feed/<exercise>')
def video_feed(exercise):
    """Stream video feed with exercise form detection"""
    # Reset exercise state for new session
    exercise_state['counter'] = 0
    exercise_state['stage'] = 'up'
    exercise_state['plank_state'] = {'start_time': None, 'best_duration': 0, 'current_duration': 0}
    
    # Create a response with the generator function
    try:
        # Force the response to use application context
        with app.app_context():
            response = Response(
                generate_frames(exercise),
                mimetype='multipart/x-mixed-replace; boundary=frame'
            )
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
            return response
    except Exception as e:
        print(f"Error in video feed: {e}")
        # Create an error image if stream generation fails
        error_img = np.zeros((480, 640, 3), np.uint8)
        cv2.putText(error_img, f"Camera error: {str(e)}", (50, 240), 
                  cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        ret, buffer = cv2.imencode('.jpg', error_img)
        return Response(buffer.tobytes(), mimetype='image/jpeg')

@app.route('/get_metrics')
def get_metrics():
    # Define default form quality metrics
    form_quality = {
        "is_correct": True,
        "message": "Posture Undetected",
        "confidence": 50
    }
    
    # We can't access pose landmarks from another thread, so just return the current state
    response_data = {**exercise_state, 'form_quality': form_quality}
    
    return jsonify(response_data)

@app.route('/reset_counter')
def reset_counter():
    exercise_state['counter'] = 0
    exercise_state['stage'] = 'up'
    exercise_state['plank_state'] = {'start_time': None, 'best_duration': 0, 'current_duration': 0}
    return jsonify({"status": "success"})

@app.route('/end_workout')
def end_workout():
    save_workout_progress()
    
    # Generate enhanced performance data
    performance_data = {
        "status": "workout saved", 
        "metrics": exercise_state,
        "performance": {
            "score": min(exercise_state.get('counter', 0) * 3.5, 100),
            "calories": exercise_state.get('counter', 0) * 5,
            "duration": random.randint(5, 15)  # Mock duration in minutes
        },
        "tips": get_exercise_tips(exercise_state.get('exercise_name', ''))
    }
    
    return jsonify(performance_data)

def get_exercise_tips(exercise_name):
    """Return exercise-specific tips"""
    tips = {
        "Squats": [
            "Keep your back straight throughout the movement",
            "Make sure knees track over toes, not inward",
            "Try to reach parallel depth on each rep"
        ],
        "Push-ups": [
            "Maintain a straight line from head to heels",
            "Keep elbows at a 45-degree angle to your body",
            "Lower your chest all the way to the ground"
        ],
        "Situps": [
            "Engage your core throughout the movement",
            "Try to maintain a smooth, controlled pace",
            "Avoid pulling on your neck with your hands"
        ],
        "Plank": [
            "Keep your hips level with your shoulders",
            "Engage your glutes and core throughout",
            "Focus on quality rather than duration"
        ]
    }
    
    return tips.get(exercise_name, [
        "Focus on maintaining proper form",
        "Take breaks when needed to maintain quality",
        "Stay consistent with your workouts"
    ])

@app.route('/login', methods=['GET', 'POST'])
def login():
    # For API requests
    if request.is_json:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'success': False, 'message': 'Username and password are required'}), 400
            
        db_session = get_session()
        user = db_session.query(User).filter_by(username=username).first()
        db_session.close()
        
        if user is None or not user.check_password(password):
            return jsonify({'success': False, 'message': 'Invalid username or password'}), 401
        
        login_user(user)
        return jsonify({'success': True, 'message': 'Login successful', 'user': {'username': user.username, 'email': user.email}})
    
    # For browser requests
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        db_session = get_session()
        user = db_session.query(User).filter_by(username=form.username.data).first()
        db_session.close()
        
        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password')
            return redirect(url_for('login'))
        
        login_user(user)
        return redirect(url_for('index'))
    
    return render_template('login.html', form=form)

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    # For API requests
    if request.is_json:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        # Validate input
        if not username or not email or not password:
            return jsonify({'success': False, 'message': 'Username, email and password are required'}), 400
            
        if len(username) < 3:
            return jsonify({'success': False, 'message': 'Username must be at least 3 characters long'}), 400
            
        if len(password) < 8:
            return jsonify({'success': False, 'message': 'Password must be at least 8 characters long'}), 400
        
        # Check for existing username or email
        db_session = get_session()
        existing_user = db_session.query(User).filter_by(username=username).first()
        if existing_user:
            db_session.close()
            return jsonify({'success': False, 'message': 'Username already exists'}), 400
            
        existing_email = db_session.query(User).filter_by(email=email).first()
        if existing_email:
            db_session.close()
            return jsonify({'success': False, 'message': 'Email already exists'}), 400
        
        # Create new user
        user = User(username=username, email=email)
        user.set_password(password)
        db_session.add(user)
        db_session.commit()
        db_session.close()
        
        return jsonify({'success': True, 'message': 'Registration successful'}), 201
    
    # For browser requests
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    form = RegistrationForm()
    if form.validate_on_submit():
        db_session = get_session()
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db_session.add(user)
        db_session.commit()
        db_session.close()
        
        flash('Congratulations, you are now registered!')
        return redirect(url_for('login'))
    
    return render_template('register.html', form=form)

@app.route('/profile', methods=['GET', 'POST'])
def profile():
    form = ProfileForm()
    
    if form.validate_on_submit():
        db_session = get_session()
        # Create a mock user if none exists
        user = db_session.query(User).filter_by(username="demo").first()
        if not user:
            user = User(username="demo", email="demo@example.com")
            user.set_password("demopassword")
            db_session.add(user)
            
        user.first_name = form.first_name.data
        user.last_name = form.last_name.data
        user.height = form.height.data
        user.weight = form.weight.data
        user.age = form.age.data
        
        # Save new fields
        user.fitness_goals = form.fitness_goals.data
        user.experience_level = form.experience_level.data
        user.preferred_workout_days = form.preferred_workout_days.data
        user.profile_picture_url = form.profile_picture_url.data
        
        db_session.commit()
        db_session.close()
        
        flash('Your profile has been updated.')
        return redirect(url_for('profile'))
    elif request.method == 'GET':
        db_session = get_session()
        # Use demo user
        user = db_session.query(User).filter_by(username="demo").first()
        if user:
            form.first_name.data = user.first_name
            form.last_name.data = user.last_name
            form.height.data = user.height
            form.weight.data = user.weight
            form.age.data = user.age
            
            # Load new fields
            form.fitness_goals.data = user.fitness_goals
            form.experience_level.data = user.experience_level
            form.preferred_workout_days.data = user.preferred_workout_days
            form.profile_picture_url.data = user.profile_picture_url
        
        db_session.close()
    
    return render_template('profile.html', form=form)

@app.route('/history')
def history():
    db_session = get_session()
    # Get demo user or create one
    user = db_session.query(User).filter_by(username="demo").first()
    if not user:
        user = User(username="demo", email="demo@example.com")
        user.set_password("demopassword")
        db_session.add(user)
        db_session.commit()
        
    workouts = db_session.query(WorkoutHistory).filter_by(
        user_id=user.id
    ).order_by(WorkoutHistory.completed_at.desc()).all()
    db_session.close()
    
    return render_template('history.html', workouts=workouts)

@app.route('/check_camera')
def check_camera():
    """Test camera availability without starting a stream"""
    try:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            return jsonify({
                'camera_available': False,
                'error_message': 'Could not open camera. Please check if it is in use by another application.'
            })
        
        # Try to read a frame to confirm camera is working
        ret, frame = cap.read()
        if not ret:
            return jsonify({
                'camera_available': False,
                'error_message': 'Could not read frame from camera. Camera may be disconnected.'
            })
            
        # Release the camera immediately after testing
        cap.release()
        
        return jsonify({
            'camera_available': True,
            'message': 'Camera is available and working properly.'
        })
    except Exception as e:
        print(f"Camera test error: {e}")
        return jsonify({
            'camera_available': False,
            'error_message': f'Error testing camera: {str(e)}'
        })

@app.route('/camera_test')
def camera_test():
    """Route to test the camera with detailed diagnostics"""
    camera_info = {}
    
    try:
        # Try to initialize the camera
        cap = cv2.VideoCapture(0)
        camera_info['initialized'] = True
        
        # Check if camera opened successfully
        camera_info['opened'] = cap.isOpened()
        
        if camera_info['opened']:
            # Try to read a frame
            ret, frame = cap.read()
            camera_info['frame_read'] = ret
            
            if ret:
                # Get frame properties
                camera_info['frame_width'] = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                camera_info['frame_height'] = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                camera_info['frame_fps'] = cap.get(cv2.CAP_PROP_FPS)
                
                # Try to encode the frame
                ret, buffer = cv2.imencode('.jpg', frame)
                camera_info['encode_success'] = ret
        
        # Always release the camera
        cap.release()
        
    except Exception as e:
        camera_info['error'] = str(e)
        camera_info['success'] = False
    
    camera_info['success'] = camera_info.get('opened', False) and camera_info.get('frame_read', False)
    
    return render_template('camera_test.html', camera_info=camera_info)

# Routes to serve React frontend in production
@app.route('/static/<path:path>')
def serve_static(path):
    if has_react_build:
        return send_from_directory(os.path.join(react_build_dir, 'static'), path)
    return redirect(url_for('index'))

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if has_react_build:
        # For API routes, let Flask handle them
        if path.startswith('api/') or path in [
            'login', 'logout', 'register', 'profile', 'history', 
            'check_camera', 'camera_test', 'video_feed', 'get_metrics', 
            'reset_counter', 'end_workout', 'check_mediapipe'
        ] or path.startswith('video_feed/'):
            return redirect(url_for(path))
        
        # Otherwise, serve the React app
        return send_from_directory(react_build_dir, 'index.html')
    
    # If no React build, serve the Flask templates
    if path in ['', 'index', 'home']:
        return redirect(url_for('index'))
    return redirect(url_for('index'))

@app.route('/api/check-auth')
def check_auth():
    """Always returns authenticated to avoid login redirects"""
    return jsonify({"authenticated": True})

@app.route('/api/check-db')
def check_db():
    """Check database connectivity and user accounts"""
    try:
        db_session = get_session()
        users = db_session.query(User).all()
        user_count = len(users)
        user_list = [{'id': user.id, 'username': user.username, 'email': user.email} for user in users]
        db_session.close()
        
        return jsonify({
            'status': 'success',
            'message': f'Database connection successful. Found {user_count} users.',
            'user_count': user_count,
            'users': user_list
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Database connection failed: {str(e)}'
        }), 500

@app.route('/api/ping')
def ping():
    """Simple endpoint to test connectivity"""
    return jsonify({"status": "success", "message": "API is running"})