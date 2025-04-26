"""
Utility functions for exercise processing
Includes fallback for mediapipe if it's not installed
"""

import cv2
import numpy as np

# Try to import mediapipe, provide mock implementation if not available
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    # Create mock classes and functions for mediapipe
    MEDIAPIPE_AVAILABLE = False
    
    class MockPoseLandmark:
        """Mock class for pose landmarks"""
        NOSE = 0
        LEFT_EYE_INNER = 1
        LEFT_EYE = 2
        LEFT_EYE_OUTER = 3
        RIGHT_EYE_INNER = 4
        RIGHT_EYE = 5
        RIGHT_EYE_OUTER = 6
        LEFT_EAR = 7
        RIGHT_EAR = 8
        MOUTH_LEFT = 9
        MOUTH_RIGHT = 10
        LEFT_SHOULDER = 11
        RIGHT_SHOULDER = 12
        LEFT_ELBOW = 13
        RIGHT_ELBOW = 14
        LEFT_WRIST = 15
        RIGHT_WRIST = 16
        LEFT_PINKY = 17
        RIGHT_PINKY = 18
        LEFT_INDEX = 19
        RIGHT_INDEX = 20
        LEFT_THUMB = 21
        RIGHT_THUMB = 22
        LEFT_HIP = 23
        RIGHT_HIP = 24
        LEFT_KNEE = 25
        RIGHT_KNEE = 26
        LEFT_ANKLE = 27
        RIGHT_ANKLE = 28
        LEFT_HEEL = 29
        RIGHT_HEEL = 30
        LEFT_FOOT_INDEX = 31
        RIGHT_FOOT_INDEX = 32
    
    class MockPose:
        """Mock pose class"""
        def __init__(self, min_detection_confidence=0.5, min_tracking_confidence=0.5):
            self.min_detection_confidence = min_detection_confidence
            self.min_tracking_confidence = min_tracking_confidence
        
        def process(self, image):
            """Mock processing method"""
            class MockResult:
                def __init__(self):
                    self.pose_landmarks = None
            return MockResult()
    
    class MockDrawingUtils:
        """Mock drawing utils"""
        def draw_landmarks(self, image, landmarks, connections=None, *args, **kwargs):
            """Mock draw landmarks method"""
            return image
    
    class MockMp:
        """Mock mediapipe"""
        def __init__(self):
            self.solutions = MockSolutions()
    
    class MockSolutions:
        """Mock solutions"""
        def __init__(self):
            self.pose = MockSolutionsPose()
            self.drawing_utils = MockDrawingUtils()
    
    class MockSolutionsPose:
        """Mock solutions.pose"""
        def __init__(self):
            self.Pose = MockPose
            self.POSE_CONNECTIONS = []
            self.PoseLandmark = MockPoseLandmark
    
    # Create mock mp object
    mp = MockMp()

def initialize_pose():
    """Initialize MediaPipe Pose"""
    if MEDIAPIPE_AVAILABLE:
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
        mp_drawing = mp.solutions.drawing_utils
    else:
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose()
        mp_drawing = mp.solutions.drawing_utils
        print("WARNING: Mediapipe not available. Using mock implementation.")
        print("The application will run but pose detection will not work.")
        print("Please install mediapipe if you want real pose detection.")
    
    return mp_pose, pose, mp_drawing

def draw_landmarks(image, results, mp_pose, mp_drawing):
    """Draw the pose landmarks on the image"""
    if MEDIAPIPE_AVAILABLE and results.pose_landmarks:
        mp_drawing.draw_landmarks(
            image, 
            results.pose_landmarks, 
            mp_pose.POSE_CONNECTIONS,
            mp_drawing.DrawingSpec(color=(245, 117, 66), thickness=2, circle_radius=2),
            mp_drawing.DrawingSpec(color=(245, 66, 230), thickness=2, circle_radius=2)
        )
    return image

def calculate_angle(a, b, c):
    """Calculate angle between three points"""
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    
    if angle > 180.0:
        angle = 360 - angle
    
    return angle

def evaluate_form_quality(results, exercise_type, stage, landmarks=None):
    """
    Evaluate the quality of exercise form based on pose landmarks
    
    Args:
        results: MediaPipe pose detection results
        exercise_type: Type of exercise being performed
        stage: Current stage of the exercise (up/down)
        landmarks: Optional pre-extracted landmarks
        
    Returns:
        dict: Contains is_correct (boolean), message (string), and confidence (float)
    """
    # Default response for when no issues are detected
    good_form = {
        "is_correct": True,
        "message": "Correct Posture",
        "confidence": 90
    }
    
    # If MediaPipe is not available or no pose was detected, return default
    if not MEDIAPIPE_AVAILABLE or not results.pose_landmarks:
        return {
            "is_correct": True,
            "message": "Posture Undetected",
            "confidence": 50
        }
    
    # Extract landmarks if not provided
    if landmarks is None:
        landmarks = results.pose_landmarks.landmark
    
    # Calculate visibility - if key points aren't visible, don't evaluate
    key_landmarks = [11, 12, 13, 14, 23, 24, 25, 26] # shoulders, elbows, hips, knees
    visibility = np.mean([landmarks[i].visibility for i in key_landmarks])
    if visibility < 0.7:
        return {
            "is_correct": True,
            "message": "Move Into Frame",
            "confidence": 60
        }
    
    # Check form based on exercise type
    if exercise_type == "Squats":
        return evaluate_squat_form(landmarks, stage)
    elif exercise_type == "Push-ups":
        return evaluate_pushup_form(landmarks, stage)
    elif exercise_type == "Plank":
        return evaluate_plank_form(landmarks)
    elif exercise_type == "Lunges":
        return evaluate_lunge_form(landmarks, stage)
    elif exercise_type == "Bicep Curls" or exercise_type == "Hammer Curls":
        return evaluate_curl_form(landmarks, stage)
    elif exercise_type == "Deadlifts":
        return evaluate_deadlift_form(landmarks, stage)
    elif exercise_type == "Pull-ups":
        return evaluate_pullup_form(landmarks, stage)
    elif exercise_type == "Shoulder Press":
        return evaluate_shoulderpress_form(landmarks, stage)
    
    # Default to good form if exercise not specifically handled
    return good_form

def evaluate_squat_form(landmarks, stage):
    """Evaluate squat form quality"""
    # Extract key points
    left_hip = [landmarks[23].x, landmarks[23].y]
    right_hip = [landmarks[24].x, landmarks[24].y]
    left_knee = [landmarks[25].x, landmarks[25].y]
    right_knee = [landmarks[26].x, landmarks[26].y]
    left_ankle = [landmarks[27].x, landmarks[27].y]
    right_ankle = [landmarks[28].x, landmarks[28].y]
    left_shoulder = [landmarks[11].x, landmarks[11].y]
    right_shoulder = [landmarks[12].x, landmarks[12].y]
    
    # Calculate angles
    left_knee_angle = calculate_angle(left_hip, left_knee, left_ankle)
    right_knee_angle = calculate_angle(right_hip, right_knee, right_ankle)
    
    # Check form issues in down position
    if stage == 'down':
        # Check if knees are too far forward (knees passing toes)
        if landmarks[25].x < landmarks[27].x - 0.1 or landmarks[26].x < landmarks[28].x - 0.1:
            return {
                "is_correct": False,
                "message": "Wrong: Knees Past Toes",
                "confidence": 80
            }
        
        # Check if squat depth is sufficient (knee angle should be around 90 degrees)
        avg_knee_angle = (left_knee_angle + right_knee_angle) / 2
        if avg_knee_angle > 120:  # Not deep enough
            return {
                "is_correct": False,
                "message": "Wrong: Squat Deeper",
                "confidence": 85
            }
        
        # Check if back is straight
        # Calculate angle between shoulders and hips
        back_angle = calculate_angle(
            [(left_shoulder[0] + right_shoulder[0])/2, (left_shoulder[1] + right_shoulder[1])/2],
            [(left_hip[0] + right_hip[0])/2, (left_hip[1] + right_hip[1])/2],
            [landmarks[0].x, landmarks[0].y]  # Nose
        )
        if back_angle < 150:  # Back is leaning too far forward
            return {
                "is_correct": False,
                "message": "Wrong: Back Not Straight",
                "confidence": 85
            }
    
    # Default to good form
    return {
        "is_correct": True,
        "message": "Correct Posture",
        "confidence": 90
    }

def evaluate_pushup_form(landmarks, stage):
    """Evaluate push-up form quality"""
    # Extract key points
    left_shoulder = [landmarks[11].x, landmarks[11].y]
    right_shoulder = [landmarks[12].x, landmarks[12].y]
    left_elbow = [landmarks[13].x, landmarks[13].y]
    right_elbow = [landmarks[14].x, landmarks[14].y]
    left_wrist = [landmarks[15].x, landmarks[15].y]
    right_wrist = [landmarks[16].x, landmarks[16].y]
    left_hip = [landmarks[23].x, landmarks[23].y]
    right_hip = [landmarks[24].x, landmarks[24].y]
    left_ankle = [landmarks[27].x, landmarks[27].y]
    right_ankle = [landmarks[28].x, landmarks[28].y]
    
    # Check form during down position
    if stage == 'down':
        # Check if elbows are at correct angle (should be around 90 degrees)
        left_elbow_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
        right_elbow_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
        avg_elbow_angle = (left_elbow_angle + right_elbow_angle) / 2
        
        if avg_elbow_angle > 110:  # Not low enough
            return {
                "is_correct": False,
                "message": "Wrong: Lower Your Chest",
                "confidence": 85
            }
        
        # Check if body is aligned (hips shouldn't sag or pike)
        # Calculate alignment between shoulders, hips, and ankles
        shoulder_mid = [(left_shoulder[0] + right_shoulder[0])/2, (left_shoulder[1] + right_shoulder[1])/2]
        hip_mid = [(left_hip[0] + right_hip[0])/2, (left_hip[1] + right_hip[1])/2]
        ankle_mid = [(left_ankle[0] + right_ankle[0])/2, (left_ankle[1] + right_ankle[1])/2]
        
        body_angle = calculate_angle(shoulder_mid, hip_mid, ankle_mid)
        
        if body_angle < 160:  # Body not straight enough
            if hip_mid[1] > shoulder_mid[1] and hip_mid[1] > ankle_mid[1]:
                return {
                    "is_correct": False,
                    "message": "Wrong: Hips Too Low",
                    "confidence": 85
                }
            else:
                return {
                    "is_correct": False,
                    "message": "Wrong: Hips Too High",
                    "confidence": 85
                }
    
    # Default to good form
    return {
        "is_correct": True,
        "message": "Correct Posture",
        "confidence": 90
    }

def evaluate_plank_form(landmarks):
    """Evaluate plank form quality"""
    # Extract key points
    left_shoulder = [landmarks[11].x, landmarks[11].y]
    right_shoulder = [landmarks[12].x, landmarks[12].y]
    left_hip = [landmarks[23].x, landmarks[23].y]
    right_hip = [landmarks[24].x, landmarks[24].y]
    left_ankle = [landmarks[27].x, landmarks[27].y]
    right_ankle = [landmarks[28].x, landmarks[28].y]
    
    # Calculate midpoints
    shoulder_mid = [(left_shoulder[0] + right_shoulder[0])/2, (left_shoulder[1] + right_shoulder[1])/2]
    hip_mid = [(left_hip[0] + right_hip[0])/2, (left_hip[1] + right_hip[1])/2]
    ankle_mid = [(left_ankle[0] + right_ankle[0])/2, (left_ankle[1] + right_ankle[1])/2]
    
    # Check if body is aligned in a straight line
    body_angle = calculate_angle(shoulder_mid, hip_mid, ankle_mid)
    
    if body_angle < 160:  # Body not straight enough
        if hip_mid[1] > shoulder_mid[1] and hip_mid[1] > ankle_mid[1]:
            return {
                "is_correct": False,
                "message": "Wrong: Hips Too Low",
                "confidence": 85
            }
        else:
            return {
                "is_correct": False,
                "message": "Wrong: Hips Too High",
                "confidence": 85
            }
    
    # Check if hips are at the right height
    # Measure vertical distance between hips and shoulders/ankles
    hip_height = hip_mid[1]
    shoulder_height = shoulder_mid[1]
    ankle_height = ankle_mid[1]
    
    if hip_height < shoulder_height - 0.05 or hip_height < ankle_height - 0.05:
        return {
            "is_correct": False,
            "message": "Wrong: Keep Body Level",
            "confidence": 80
        }
    
    # Default to good form
    return {
        "is_correct": True,
        "message": "Correct Posture",
        "confidence": 90
    }

def evaluate_lunge_form(landmarks, stage):
    """Evaluate lunge form quality"""
    # For lunges we'll need to check knee alignment and torso position
    left_knee = [landmarks[25].x, landmarks[25].y]
    right_knee = [landmarks[26].x, landmarks[26].y]
    left_ankle = [landmarks[27].x, landmarks[27].y]
    right_ankle = [landmarks[28].x, landmarks[28].y]
    left_hip = [landmarks[23].x, landmarks[23].y]
    right_hip = [landmarks[24].x, landmarks[24].y]
    left_shoulder = [landmarks[11].x, landmarks[11].y]
    right_shoulder = [landmarks[12].x, landmarks[12].y]
    
    if stage == 'down':
        # Check if front knee is over ankle (not past toes)
        # This is approximate since we don't know which leg is forward
        if left_knee[0] < left_ankle[0] - 0.1 or right_knee[0] < right_ankle[0] - 0.1:
            return {
                "is_correct": False,
                "message": "Wrong: Knee Past Toes",
                "confidence": 80
            }
        
        # Check if torso is upright
        shoulder_mid = [(left_shoulder[0] + right_shoulder[0])/2, (left_shoulder[1] + right_shoulder[1])/2]
        hip_mid = [(left_hip[0] + right_hip[0])/2, (left_hip[1] + right_hip[1])/2]
        
        # Vertical alignment (smaller x-difference = more vertical)
        torso_lean = abs(shoulder_mid[0] - hip_mid[0])
        if torso_lean > 0.1:
            return {
                "is_correct": False,
                "message": "Wrong: Keep Torso Upright",
                "confidence": 85
            }
    
    # Default to good form
    return {
        "is_correct": True,
        "message": "Correct Posture",
        "confidence": 90
    }

def evaluate_curl_form(landmarks, stage):
    """Evaluate bicep/hammer curl form quality"""
    # Focus on elbow position and upper arm stability
    left_shoulder = [landmarks[11].x, landmarks[11].y]
    right_shoulder = [landmarks[12].x, landmarks[12].y]
    left_elbow = [landmarks[13].x, landmarks[13].y]
    right_elbow = [landmarks[14].x, landmarks[14].y]
    left_wrist = [landmarks[15].x, landmarks[15].y]
    right_wrist = [landmarks[16].x, landmarks[16].y]
    
    # Check if elbows are moving (they should stay fixed)
    if stage == 'up':
        # Calculate elbow position relative to shoulders
        left_elbow_to_shoulder = abs(left_elbow[0] - left_shoulder[0])
        right_elbow_to_shoulder = abs(right_elbow[0] - right_shoulder[0])
        
        # If elbows move too far forward, form is incorrect
        if left_elbow_to_shoulder > 0.15 or right_elbow_to_shoulder > 0.15:
            return {
                "is_correct": False,
                "message": "Wrong: Keep Elbows Fixed",
                "confidence": 85
            }
    
    # Default to good form
    return {
        "is_correct": True,
        "message": "Correct Posture",
        "confidence": 90
    }

def evaluate_deadlift_form(landmarks, stage):
    """Evaluate deadlift form quality"""
    # Check back position and knee/hip alignment
    left_shoulder = [landmarks[11].x, landmarks[11].y]
    right_shoulder = [landmarks[12].x, landmarks[12].y]
    left_hip = [landmarks[23].x, landmarks[23].y]
    right_hip = [landmarks[24].x, landmarks[24].y]
    left_knee = [landmarks[25].x, landmarks[25].y]
    right_knee = [landmarks[26].x, landmarks[26].y]
    
    if stage == 'down':
        # Check if back is straight
        shoulder_mid = [(left_shoulder[0] + right_shoulder[0])/2, (left_shoulder[1] + right_shoulder[1])/2]
        hip_mid = [(left_hip[0] + right_hip[0])/2, (left_hip[1] + right_hip[1])/2]
        
        # Calculate back angle
        back_angle = calculate_angle(
            shoulder_mid,
            hip_mid,
            [hip_mid[0], hip_mid[1] - 0.5]  # Point directly above hips
        )
        
        if back_angle > 45:  # Back is too rounded
            return {
                "is_correct": False,
                "message": "Wrong: Keep Back Straight",
                "confidence": 85
            }
        
        # Check if knees are in line with toes
        # This is simplified since we don't have foot width
        knee_width = abs(left_knee[0] - right_knee[0])
        hip_width = abs(left_hip[0] - right_hip[0])
        
        if knee_width < hip_width * 0.7:  # Knees too close together
            return {
                "is_correct": False,
                "message": "Wrong: Knees Too Close",
                "confidence": 80
            }
    
    # Default to good form
    return {
        "is_correct": True,
        "message": "Correct Posture",
        "confidence": 90
    }

def evaluate_pullup_form(landmarks, stage):
    """Evaluate pull-up form quality"""
    # Check chin position relative to hands and body alignment
    nose = [landmarks[0].x, landmarks[0].y]
    left_wrist = [landmarks[15].x, landmarks[15].y]
    right_wrist = [landmarks[16].x, landmarks[16].y]
    
    if stage == 'up':
        # Check if chin is above hands
        wrist_y_avg = (left_wrist[1] + right_wrist[1]) / 2
        if nose[1] > wrist_y_avg:  # Nose should be above or at wrist level
            return {
                "is_correct": False,
                "message": "Wrong: Pull Up Higher",
                "confidence": 85
            }
    
    # Default to good form
    return {
        "is_correct": True,
        "message": "Correct Posture",
        "confidence": 90
    }

def evaluate_shoulderpress_form(landmarks, stage):
    """Evaluate shoulder press form quality"""
    # Check back alignment and arm position
    left_shoulder = [landmarks[11].x, landmarks[11].y]
    right_shoulder = [landmarks[12].x, landmarks[12].y]
    left_hip = [landmarks[23].x, landmarks[23].y]
    right_hip = [landmarks[24].x, landmarks[24].y]
    left_wrist = [landmarks[15].x, landmarks[15].y]
    right_wrist = [landmarks[16].x, landmarks[16].y]
    
    if stage == 'up':
        # Check if arms are fully extended
        shoulder_mid = [(left_shoulder[0] + right_shoulder[0])/2, (left_shoulder[1] + right_shoulder[1])/2]
        wrist_mid = [(left_wrist[0] + right_wrist[0])/2, (left_wrist[1] + right_wrist[1])/2]
        
        # Vertical distance from shoulders to wrists should be significant
        vertical_extension = shoulder_mid[1] - wrist_mid[1]
        if vertical_extension < 0.2:  # Not extended enough
            return {
                "is_correct": False,
                "message": "Wrong: Extend Arms Fully",
                "confidence": 85
            }
        
        # Check for excessive back arch
        hip_mid = [(left_hip[0] + right_hip[0])/2, (left_hip[1] + right_hip[1])/2]
        back_alignment = abs(shoulder_mid[0] - hip_mid[0])
        
        if back_alignment > 0.1:  # Back is arching
            return {
                "is_correct": False,
                "message": "Wrong: Keep Back Straight",
                "confidence": 85
            }
    
    # Default to good form
    return {
        "is_correct": True,
        "message": "Correct Posture",
        "confidence": 90
    }