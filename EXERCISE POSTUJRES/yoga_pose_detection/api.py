from flask import Blueprint, jsonify, request, render_template, Response
import cv2
import numpy as np
import base64
import time
import os
import json
from .yoga_detector import YogaPoseDetector

# Create Flask Blueprint for yoga pose detection
yoga_bp = Blueprint('yoga', __name__, url_prefix='/yoga_poses')

# Global yoga pose detector instance
yoga_detector = YogaPoseDetector()

@yoga_bp.route('/')
def index():
    """Render the yoga pose detection page."""
    # Get available poses
    poses, references = yoga_detector.get_available_poses()
    
    # Check if the camera is available and mediapipe is available
    return render_template(
        'yoga_poses.html',
        poses=poses,
        references=references
    )

@yoga_bp.route('/api/available_poses', methods=['GET'])
def get_available_poses():
    """API endpoint to get available yoga poses."""
    poses, references = yoga_detector.get_available_poses()
    return jsonify({
        'success': True,
        'poses': poses,
        'references': references
    })

@yoga_bp.route('/api/detect', methods=['POST'])
def detect_pose():
    """API endpoint to detect yoga pose from an image."""
    if 'image' not in request.json:
        return jsonify({
            'success': False,
            'error': 'No image provided'
        }), 400
    
    try:
        # Decode the base64 image
        image_data = request.json['image'].split(',')[1]
        image_bytes = base64.b64decode(image_data)
        image_array = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        
        # Process the frame
        _, result_data = yoga_detector.process_frame(image)
        
        return jsonify({
            'success': True,
            'result': result_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@yoga_bp.route('/api/save_reference', methods=['POST'])
def save_reference():
    """API endpoint to save current pose as reference."""
    if 'image' not in request.json:
        return jsonify({
            'success': False,
            'error': 'No image provided'
        }), 400
    
    try:
        # Decode the base64 image
        image_data = request.json['image'].split(',')[1]
        image_bytes = base64.b64decode(image_data)
        image_array = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        
        # Process the frame to detect pose
        _, result_data = yoga_detector.process_frame(image)
        
        # Save the pose as reference if valid
        success, message = yoga_detector.save_current_pose_as_reference()
        
        return jsonify({
            'success': success,
            'message': message,
            'pose': result_data.get('pose_name', 'unknown')
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def gen_frames():
    """Generate frames for video streaming."""
    # Initialize camera
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open camera.")
        return
    
    while True:
        success, frame = cap.read()
        if not success:
            break
        
        # Process the frame
        processed_frame, _ = yoga_detector.process_frame(frame)
        
        # Encode the frame
        ret, buffer = cv2.imencode('.jpg', processed_frame)
        frame_bytes = buffer.tobytes()
        
        # Yield the frame in the byte format
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    
    # Release resources
    cap.release()

@yoga_bp.route('/video_feed')
def video_feed():
    """Video streaming route for yoga pose detection."""
    return Response(gen_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

def init_app(app):
    """Initialize the yoga pose detection module with the Flask app."""
    app.register_blueprint(yoga_bp)
    
    # Create necessary template directory if it doesn't exist
    template_dir = os.path.join(app.root_path, 'templates')
    if not os.path.exists(template_dir):
        os.makedirs(template_dir)
    
    # Return the blueprint for direct access if needed
    return yoga_bp 