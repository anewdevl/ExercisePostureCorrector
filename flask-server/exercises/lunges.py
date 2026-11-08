import cv2
import numpy as np
from .utils import calculate_angle

def process_lunges(frame, results, mp_pose, counter, stage):
    landmarks = results.pose_landmarks.landmark
    
    # Get key points
    left_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP].x,
               landmarks[mp_pose.PoseLandmark.LEFT_HIP].y]
    left_knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE].x,
                landmarks[mp_pose.PoseLandmark.LEFT_KNEE].y]
    left_ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE].x,
                 landmarks[mp_pose.PoseLandmark.LEFT_ANKLE].y]
    
    right_hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP].x,
                landmarks[mp_pose.PoseLandmark.RIGHT_HIP].y]
    right_knee = [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE].x,
                 landmarks[mp_pose.PoseLandmark.RIGHT_KNEE].y]
    right_ankle = [landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE].x,
                  landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE].y]
    
    left_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].y]
    right_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].x,
                     landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].y]

    # Calculate angles
    left_knee_angle = calculate_angle(left_hip, left_knee, left_ankle)
    right_knee_angle = calculate_angle(right_hip, right_knee, right_ankle)
    torso_angle = calculate_angle(left_shoulder, left_hip, right_hip)

    # Lunge detection logic
    feedback = []
    valid_lunge = False
    if 75 < torso_angle < 105:  # Torso roughly vertical
        # Left leg forward lunge
        if left_knee_angle < 90 and right_knee_angle > 150:
            valid_lunge = True
        # Right leg forward lunge
        elif right_knee_angle < 90 and left_knee_angle > 150:
            valid_lunge = True

    if valid_lunge and stage != "down":
        stage = "down"
        counter += 1
        feedback.append("Good lunge!")
    elif not valid_lunge and stage == "down":
        stage = "up"
        
    # Form validation
    if torso_angle < 75:
        feedback.append("Lean forward less")
    if torso_angle > 105:
        feedback.append("Keep torso upright")
    if left_knee_angle < 90 and left_knee[0] < left_ankle[0]:
        feedback.append("Front knee over toes")
    if right_knee_angle < 90 and right_knee[0] > right_ankle[0]:
        feedback.append("Front knee over toes")

    # Visualization
    cv2.putText(frame, f"Count: {counter}", (20, 50), 
               cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    cv2.putText(frame, f"Stage: {stage}", (20, 90), 
               cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
    cv2.putText(frame, f"Left Knee: {left_knee_angle:.1f}°", (20, 130),
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    cv2.putText(frame, f"Right Knee: {right_knee_angle:.1f}°", (20, 160),
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    cv2.putText(frame, f"Torso: {torso_angle:.1f}°", (20, 190),
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
    
    for i, text in enumerate(feedback[:3]):
        cv2.putText(frame, text, (20, 230 + i*30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

    return frame, counter, stage