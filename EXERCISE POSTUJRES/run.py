#!/usr/bin/env python
"""
Run script for the AI Fitness Trainer application
This script initializes the database and starts the Flask server
"""

import os
import sys
import argparse

def setup_database():
    """Initialize the database and create admin user if it doesn't exist"""
    try:
        from backend.models import init_db, get_session, User
        
        # Initialize the database
        init_db()
        
        # Check if admin user exists, if not create one
        session = get_session()
        admin = session.query(User).filter_by(username='admin').first()
        if not admin:
            admin = User(username='admin', email='admin@example.com')
            admin.set_password('adminpassword')
            session.add(admin)
            session.commit()
            print("Admin user created with username: admin and password: adminpassword")
        else:
            # Reset admin password if user exists to ensure login always works
            admin.set_password('adminpassword')
            session.commit()
            print("Admin user password reset to: adminpassword")
            
        session.close()
        return True
    except ImportError as e:
        print(f"Error: {e}")
        print("Database setup failed. Make sure all required packages are installed.")
        print("Run: pip install flask flask-login flask-wtf sqlalchemy werkzeug")
        return False
    except Exception as e:
        print(f"Database setup error: {e}")
        return False

def check_requirements():
    """Check if the necessary packages are installed"""
    missing_packages = []
    try:
        import flask
    except ImportError:
        missing_packages.append("flask")
    
    try:
        import flask_login
    except ImportError:
        missing_packages.append("flask-login")
    
    try:
        import flask_wtf
    except ImportError:
        missing_packages.append("flask-wtf")
    
    try:
        import sqlalchemy
    except ImportError:
        missing_packages.append("sqlalchemy")
    
    try:
        import werkzeug
    except ImportError:
        missing_packages.append("werkzeug")
    
    try:
        import cv2
    except ImportError:
        missing_packages.append("opencv-python")
    
    try:
        import mediapipe
        print("MediaPipe is available - full functionality enabled.")
    except ImportError:
        missing_packages.append("mediapipe")
        print("WARNING: MediaPipe is not installed. The app will run but pose detection will not work.")
        print("If you want to use pose detection, try installing mediapipe:")
        print("pip install mediapipe")
    
    if missing_packages:
        print(f"Missing packages: {', '.join(missing_packages)}")
        print(f"Install them with: pip install {' '.join(missing_packages)}")
        if "mediapipe" in missing_packages:
            print("NOTE: The app can run without MediaPipe, but pose detection will not work.")
            missing_packages.remove("mediapipe")
        
        if missing_packages:  # If there are still missing packages other than mediapipe
            return False
    
    return True

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run the AI Fitness Trainer application')
    parser.add_argument('--production', action='store_true', help='Run in production mode')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Host to run the server on')
    parser.add_argument('--port', type=int, default=5000, help='Port to run the server on')
    args = parser.parse_args()
    
    # Check requirements
    if not check_requirements():
        print("Warning: Some required packages are missing.")
        choice = input("Do you want to continue anyway? (y/n): ")
        if choice.lower() != 'y':
            sys.exit(1)
    
    # Setup the database
    if not setup_database():
        print("Warning: Database setup failed.")
        choice = input("Do you want to continue anyway? (y/n): ")
        if choice.lower() != 'y':
            sys.exit(1)
    
    try:
        # Import app after checking requirements to avoid early import errors
        from backend.app import app
        
        # Run the application
        debug_mode = not args.production
        if args.production:
            print("Running in production mode")
        else:
            print("Running in development mode (debug enabled)")
        
        # Run the application - force host to 0.0.0.0 and port to 5000
        app.run(host='0.0.0.0', port=5000, debug=debug_mode)
    except Exception as e:
        print(f"Error starting the application: {e}")
        sys.exit(1) 