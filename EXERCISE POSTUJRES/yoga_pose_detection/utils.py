import cv2
import mediapipe as mp
import numpy as np
import pandas as pd
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
import pickle
import os
import math

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# List of yoga poses supported
YOGA_POSES = [
    'downdog', 
    'goddess', 
    'plank', 
    'tree', 
    'warrior2'
]

# Defined angle indices for each pose
POSE_ANGLES = {
    'downdog': [3, 5, 6, 9, 10, 13, 14, 15, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    'goddess': [3, 5, 6, 9, 10, 13, 14, 15, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    'plank': [3, 5, 6, 9, 10, 13, 14, 15, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    'tree': [3, 5, 6, 9, 10, 13, 14, 15, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    'warrior2': [3, 5, 6, 9, 10, 13, 14, 15, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]
}

# Threshold values for angle differences
ANGLE_THRESHOLDS = {
    'downdog': 15,
    'goddess': 15,
    'plank': 10,
    'tree': 12,
    'warrior2': 15
}

# Important keypoints for specific poses
CRITICAL_ANGLES = {
    'downdog': [5, 13, 15, 23, 25],
    'goddess': [13, 14, 23, 24], 
    'plank': [5, 6, 13, 14],
    'tree': [13, 23, 25, 26],
    'warrior2': [13, 14, 15, 23, 24, 25]
}

# Load trained models
def load_model(model_type='svm_rbf'):
    """
    Load a pre-trained model for yoga pose classification.
    
    Args:
        model_type (str): Type of model to load ('svm_rbf', 'svm_linear', 'svm_poly', 'lstm')
        
    Returns:
        model: The loaded classification model
        scaler: The StandardScaler for preprocessing data
    """
    try:
        # Default to RBF kernel if not specified
        if model_type not in ['svm_rbf', 'svm_linear', 'svm_poly', 'lstm']:
            model_type = 'svm_rbf'
            
        model_path = os.path.join(MODELS_DIR, f"yoga_{model_type}.pkl")
        scaler_path = os.path.join(MODELS_DIR, "yoga_scaler.pkl")
        
        # If model doesn't exist yet, create a simple one
        if not os.path.exists(model_path):
            print(f"Model {model_path} not found. Using a default model.")
            # Create a simple SVM model
            model = SVC(kernel='rbf', probability=True)
            scaler = StandardScaler()
            # Return empty model and scaler that will need to be trained
            return model, scaler
        
        # Load the model and scaler
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        
        with open(scaler_path, 'rb') as f:
            scaler = pickle.load(f)
            
        return model, scaler
    
    except Exception as e:
        print(f"Error loading model: {e}")
        # Return simple models in case of error
        model = SVC(kernel='rbf', probability=True)
        scaler = StandardScaler()
        return model, scaler

def calculate_angle(a, b, c):
    """
    Calculate the angle between three points.
    
    Args:
        a, b, c: Points in the format [x, y]
        
    Returns:
        angle: The angle in degrees
    """
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    
    # Calculate vectors from point b
    ba = a - b
    bc = c - b
    
    # Calculate dot product
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    
    # Handle numerical errors
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    
    # Calculate angle in degrees
    angle = np.arccos(cosine_angle)
    angle = np.degrees(angle)
    
    return angle

def extract_angles(landmarks, pose_name=None):
    """
    Extract relevant angles from pose landmarks.
    
    Args:
        landmarks: MediaPipe pose landmarks
        pose_name: The name of the yoga pose (optional)
        
    Returns:
        angles: List of angle values
    """
    # Convert to numpy array for easier manipulation
    lm_array = np.zeros((33, 3))
    for i, lm in enumerate(landmarks.landmark):
        lm_array[i] = [lm.x, lm.y, lm.visibility]
    
    # Check visibility of key landmarks
    key_landmarks = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26]  # Shoulders, elbows, wrists, hips, knees
    visibility_threshold = 0.5
    
    # Calculate average visibility of key points
    avg_visibility = np.mean([lm_array[i][2] for i in key_landmarks])
    
    # Debug the visibility
    print(f"Average visibility of key landmarks: {avg_visibility}")
    
    if avg_visibility < visibility_threshold:
        print(f"Low visibility detected: {avg_visibility}")
        # Return empty angles if visibility is too low
        return []
    
    # Define all angles to be computed
    angles = []
    
    # Compute angles based on human body structure
    
    # Right shoulder angle
    right_shoulder = calculate_angle(
        [lm_array[12][0], lm_array[12][1]],  # Right hip
        [lm_array[11][0], lm_array[11][1]],  # Right shoulder
        [lm_array[13][0], lm_array[13][1]]   # Right elbow
    )
    angles.append(right_shoulder)
    
    # Left shoulder angle
    left_shoulder = calculate_angle(
        [lm_array[11][0], lm_array[11][1]],  # Left hip
        [lm_array[12][0], lm_array[12][1]],  # Left shoulder
        [lm_array[14][0], lm_array[14][1]]   # Left elbow
    )
    angles.append(left_shoulder)
    
    # Right elbow angle
    right_elbow = calculate_angle(
        [lm_array[11][0], lm_array[11][1]],  # Right shoulder
        [lm_array[13][0], lm_array[13][1]],  # Right elbow
        [lm_array[15][0], lm_array[15][1]]   # Right wrist
    )
    angles.append(right_elbow)
    
    # Left elbow angle
    left_elbow = calculate_angle(
        [lm_array[12][0], lm_array[12][1]],  # Left shoulder
        [lm_array[14][0], lm_array[14][1]],  # Left elbow
        [lm_array[16][0], lm_array[16][1]]   # Left wrist
    )
    angles.append(left_elbow)
    
    # Right hip angle
    right_hip = calculate_angle(
        [lm_array[23][0], lm_array[23][1]],  # Right knee
        [lm_array[24][0], lm_array[24][1]],  # Right hip
        [lm_array[12][0], lm_array[12][1]]   # Right shoulder
    )
    angles.append(right_hip)
    
    # Left hip angle
    left_hip = calculate_angle(
        [lm_array[24][0], lm_array[24][1]],  # Left knee
        [lm_array[23][0], lm_array[23][1]],  # Left hip
        [lm_array[11][0], lm_array[11][1]]   # Left shoulder
    )
    angles.append(left_hip)
    
    # Right knee angle
    right_knee = calculate_angle(
        [lm_array[24][0], lm_array[24][1]],  # Right hip
        [lm_array[26][0], lm_array[26][1]],  # Right knee
        [lm_array[28][0], lm_array[28][1]]   # Right ankle
    )
    angles.append(right_knee)
    
    # Left knee angle
    left_knee = calculate_angle(
        [lm_array[23][0], lm_array[23][1]],  # Left hip
        [lm_array[25][0], lm_array[25][1]],  # Left knee
        [lm_array[27][0], lm_array[27][1]]   # Left ankle
    )
    angles.append(left_knee)
    
    return angles

def detect_pose(image, pose, model, scaler):
    """
    Detect yoga pose in an image.
    
    Args:
        image: Input image
        pose: MediaPipe pose instance
        model: Trained classification model
        scaler: StandardScaler for preprocessing
        
    Returns:
        result_image: Annotated image
        pose_name: Predicted pose name
        confidence: Prediction confidence
    """
    # Convert to RGB for MediaPipe
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    h, w, _ = image.shape
    
    # Process the image and get pose landmarks
    results = pose.process(image_rgb)
    
    # Create a copy of the input image for drawing
    result_image = image.copy()
    
    pose_name = "unknown"
    confidence = 0.0
    angles = []
    
    # Check if pose landmarks are detected
    if results.pose_landmarks:
        # Draw the pose landmarks on the image
        mp_drawing.draw_landmarks(
            result_image,
            results.pose_landmarks,
            mp_pose.POSE_CONNECTIONS,
            landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style()
        )
        
        # Extract angles from landmarks
        angles = extract_angles(results.pose_landmarks)
        
        # Debug the number of angles
        print(f"Number of extracted angles: {len(angles)}")
        
        # Ensure we have the expected number of angles
        if len(angles) == 8:  # Using 8 key angles
            # Preprocess the data
            angles_array = np.array(angles).reshape(1, -1)
            
            try:
                scaled_angles = scaler.transform(angles_array)
                
                # Make prediction
                prediction = model.predict(scaled_angles)[0]
                
                # Get prediction probabilities
                try:
                    proba = model.predict_proba(scaled_angles)[0]
                    confidence = max(proba) * 100  # Convert to percentage
                except:
                    confidence = 0.0
                
                # Map prediction to pose name
                if 0 <= prediction < len(YOGA_POSES):
                    pose_name = YOGA_POSES[int(prediction)]
            except Exception as e:
                print(f"Error during prediction: {e}")
                # If there's an error during prediction, still draw landmarks but don't try to predict
                pass
        else:
            # If we don't have enough angles, display a message
            cv2.putText(result_image, 'Move your full body into frame', 
                      (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2, cv2.LINE_AA)
    else:
        # If no landmarks are detected, display a message
        cv2.putText(result_image, 'No body detected', 
                   (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2, cv2.LINE_AA)
            
    # Display the prediction
    if pose_name != "unknown":
        cv2.putText(result_image, f'Pose: {pose_name.title()}', 
                   (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2, cv2.LINE_AA)
        cv2.putText(result_image, f'Confidence: {confidence:.1f}%', 
                   (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2, cv2.LINE_AA)
    
    return result_image, pose_name, confidence, angles

def compare_angles(user_angles, reference_angles, pose_name):
    """
    Compare user's pose angles with reference pose angles.
    
    Args:
        user_angles: List of user's pose angles
        reference_angles: List of reference pose angles
        pose_name: Name of the yoga pose
        
    Returns:
        corrections: List of angle corrections needed
        score: Overall pose accuracy score (0-100)
    """
    if not user_angles or not reference_angles or len(user_angles) != len(reference_angles):
        return [], 0
    
    corrections = []
    critical_indices = CRITICAL_ANGLES.get(pose_name, [])
    threshold = ANGLE_THRESHOLDS.get(pose_name, 15)
    
    total_error = 0
    max_possible_error = 0
    
    for i, (user_angle, ref_angle) in enumerate(zip(user_angles, reference_angles)):
        diff = abs(user_angle - ref_angle)
        is_critical = i in critical_indices
        
        # Calculate weighted error
        weight = 2.0 if is_critical else 1.0
        max_possible_error += 180 * weight  # Maximum possible angle difference
        total_error += min(diff, 180) * weight
        
        if diff > threshold:
            # Determine direction of correction
            direction = "increase" if user_angle < ref_angle else "decrease"
            
            # Map angle index to body part
            body_part = get_body_part_from_index(i)
            
            corrections.append({
                "body_part": body_part,
                "difference": diff,
                "direction": direction,
                "is_critical": is_critical
            })
    
    # Calculate overall score (0-100)
    score = 100 - (total_error / max_possible_error * 100) if max_possible_error > 0 else 0
    
    # Sort corrections by importance (critical ones first, then by difference)
    corrections.sort(key=lambda x: (-1 if x["is_critical"] else 0, -x["difference"]))
    
    return corrections, max(0, min(100, score))

def get_body_part_from_index(angle_index):
    """
    Map angle index to human-readable body part name.
    
    Args:
        angle_index: Index of the angle
        
    Returns:
        body_part: Name of the body part
    """
    body_parts = {
        0: "right shoulder",
        1: "left shoulder",
        2: "right elbow",
        3: "left elbow",
        4: "right hip",
        5: "left hip",
        6: "right knee",
        7: "left knee"
    }
    
    return body_parts.get(angle_index, f"angle_{angle_index}")

def get_pose_feedback(pose_name, corrections, score):
    """
    Generate human-readable feedback based on pose corrections.
    
    Args:
        pose_name: Name of the yoga pose
        corrections: List of angle corrections
        score: Overall pose accuracy score
        
    Returns:
        feedback: Structured feedback dictionary
    """
    feedback = {
        "pose_name": pose_name,
        "score": score,
        "level": "",
        "summary": "",
        "detailed_corrections": []
    }
    
    # Determine level based on score
    if score >= 90:
        feedback["level"] = "excellent"
        feedback["summary"] = "Your pose is excellent! Keep it up!"
    elif score >= 75:
        feedback["level"] = "good"
        feedback["summary"] = "Good job! A few minor adjustments needed."
    elif score >= 60:
        feedback["level"] = "moderate"
        feedback["summary"] = "Getting there! Focus on the suggested corrections."
    else:
        feedback["level"] = "needs_improvement"
        feedback["summary"] = "Keep practicing! Focus on the key elements of the pose."
    
    # Add detailed corrections
    for i, correction in enumerate(corrections):
        if i >= 3:  # Limit to top 3 corrections
            break
            
        body_part = correction["body_part"]
        direction = correction["direction"]
        
        instruction = ""
        if direction == "increase":
            instruction = f"Extend your {body_part} more"
        else:
            instruction = f"Reduce the angle of your {body_part}"
            
        if correction["is_critical"]:
            instruction += " (important!)"
            
        feedback["detailed_corrections"].append(instruction)
    
    return feedback

def save_reference_pose(pose_angles, pose_name):
    """
    Save reference angles for a yoga pose.
    
    Args:
        pose_angles: List of angles
        pose_name: Name of the yoga pose
        
    Returns:
        success: Boolean indicating success
    """
    if pose_name not in YOGA_POSES:
        return False
        
    try:
        reference_path = os.path.join(MODELS_DIR, f"{pose_name}_reference.pkl")
        with open(reference_path, 'wb') as f:
            pickle.dump(pose_angles, f)
        return True
    except Exception as e:
        print(f"Error saving reference pose: {e}")
        return False

def load_reference_pose(pose_name):
    """
    Load reference angles for a yoga pose.
    
    Args:
        pose_name: Name of the yoga pose
        
    Returns:
        pose_angles: List of reference angles
    """
    if pose_name not in YOGA_POSES:
        # Return empty list if pose not recognized
        return []
        
    try:
        reference_path = os.path.join(MODELS_DIR, f"{pose_name}_reference.pkl")
        
        # If reference doesn't exist, return empty list
        if not os.path.exists(reference_path):
            return []
            
        with open(reference_path, 'rb') as f:
            pose_angles = pickle.load(f)
        return pose_angles
    except Exception as e:
        print(f"Error loading reference pose: {e}")
        return [] 