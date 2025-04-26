import cv2
import time
import numpy as np
from .utils import calculate_angle

def process_plank(frame, results, mp_pose, counter, stage, plank_state=None):
    """
    Process plank exercise frame with improved visibility checks.
    Returns: (frame, counter, stage, plank_state)
    """
    if not results.pose_landmarks:
        return frame, counter, stage, plank_state or {
            'start_time': None,
            'best_duration': 0,
            'current_duration': 0
        }

    landmarks = results.pose_landmarks.landmark
    plank_state = plank_state or {
        'start_time': None,
        'best_duration': 0,
        'current_duration': 0
    }

    # Visibility parameters
    VISIBILITY_THRESHOLD = 0.5
    REQUIRED_LANDMARKS = [
        mp_pose.PoseLandmark.LEFT_SHOULDER,
        mp_pose.PoseLandmark.RIGHT_SHOULDER,
        mp_pose.PoseLandmark.LEFT_HIP,
        mp_pose.PoseLandmark.RIGHT_HIP,
        mp_pose.PoseLandmark.LEFT_KNEE,
        mp_pose.PoseLandmark.RIGHT_KNEE,
        mp_pose.PoseLandmark.LEFT_ANKLE,
        mp_pose.PoseLandmark.RIGHT_ANKLE
    ]

    # Check visibility of all required landmarks
    for lm in REQUIRED_LANDMARKS:
        if landmarks[lm.value].visibility < VISIBILITY_THRESHOLD:
            cv2.putText(frame, "BODY NOT FULLY VISIBLE", 
                       (20, frame.shape[0]-30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            return frame, counter, stage, plank_state

    # Get key points with visibility checks
    try:
        left_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                         landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
        left_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
        left_knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
        left_ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x,
                      landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]

        right_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                          landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
        right_hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x,
                     landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
        right_knee = [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x,
                      landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y]
        right_ankle = [landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x,
                       landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y]
    except AttributeError:
        return frame, counter, stage, plank_state

    # Calculate angles with error handling
    try:
        left_body_angle = calculate_angle(left_shoulder, left_hip, left_knee)
        right_body_angle = calculate_angle(right_shoulder, right_hip, right_knee)
        avg_body_angle = (left_body_angle + right_body_angle) / 2

        left_knee_angle = calculate_angle(left_hip, left_knee, left_ankle)
        right_knee_angle = calculate_angle(right_hip, right_knee, right_ankle)
    except:
        return frame, counter, stage, plank_state

    # Check plank criteria
    knees_bent = left_knee_angle < 160 or right_knee_angle < 160
    hips_level = abs(left_hip[1] - right_hip[1]) < 0.05  # Stricter hip alignment
    body_straight = 160 < avg_body_angle < 190  # Adjusted angle range

    in_plank_position = not knees_bent and hips_level and body_straight

    # Timer and feedback logic
    feedback = []
    if in_plank_position:
        if stage != "planking":
            stage = "planking"
            plank_state['start_time'] = time.time()
            feedback.append("Plank started!")

        current_duration = time.time() - plank_state['start_time']
        plank_state['current_duration'] = current_duration

        if current_duration > plank_state['best_duration']:
            plank_state['best_duration'] = current_duration

        # Form feedback
        if avg_body_angle < 165:
            feedback.append("Engage core - hips sagging")
        elif avg_body_angle > 185:
            feedback.append("Lower hips slightly")
    else:
        if stage == "planking":
            if time.time() - plank_state['start_time'] > 2:
                stage = "resting"
                feedback.append("Get back in plank position")
        else:
            feedback.append("Assume plank position")

    # Visualization
    MAX_TIME_GOAL = 60
    progress = min(plank_state['current_duration'] / MAX_TIME_GOAL, 1.0) if in_plank_position else 0

    # Progress bar
    cv2.rectangle(frame, (20, 100), (220, 125), (0, 0, 0), -1)
    if in_plank_position:
        cv2.rectangle(frame, (20, 100), 
                     (20 + int(200 * progress), 125), 
                     (0, 255, 0), -1)

    # Metrics display
    cv2.putText(frame, f"Current: {plank_state['current_duration']:.1f}s", 
               (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
    cv2.putText(frame, f"Best: {plank_state['best_duration']:.1f}s", 
               (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 0), 2)

    # Feedback display
    for i, text in enumerate(feedback[:3]):
        cv2.putText(frame, text, (20, 150 + i * 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

    # Goal achievement
    if in_plank_position and plank_state['current_duration'] >= MAX_TIME_GOAL:
        cv2.putText(frame, "GOAL ACHIEVED!", (frame.shape[1]//2 - 150, frame.shape[0]//2),
                   cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)

    return frame, counter, stage, plank_state