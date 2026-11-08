"""
Utility functions for exercise processing
Fails clearly if the required pose engine is unavailable
"""

import numpy as np

# The existing exercise processors use the MediaPipe Solutions API.
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = hasattr(mp, "solutions")
except ImportError:
    mp = None
    MEDIAPIPE_AVAILABLE = False


def initialize_pose():
    if not MEDIAPIPE_AVAILABLE:
        raise RuntimeError("Pose detection is unavailable. Install the pinned MediaPipe requirements.")
    mp_pose = mp.solutions.pose
    return mp_pose, mp_pose.Pose(min_detection_confidence=0.6, min_tracking_confidence=0.6), mp.solutions.drawing_utils


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
