import cv2
import numpy as np
from .utils import calculate_angle

def process_bicepcurls(frame, results, mp_pose, counter, stage):
    landmarks = results.pose_landmarks.landmark
    
    # Get key points for right arm (can add left arm too)
    right_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].x,
                     landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].y]
    right_elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW].x,
                  landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW].y]
    right_wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST].x,
                  landmarks[mp_pose.PoseLandmark.RIGHT_WRIST].y]

    # Calculate elbow angle
    elbow_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)

    # Bicep curl detection logic
    feedback = []
    if elbow_angle > 160:
        stage = "down"
    if elbow_angle < 30 and stage == "down":
        stage = "up"
        counter += 1
        feedback.append("Good rep!")
        
    # Form validation
    if elbow_angle > 160:
        feedback.append("Lower your arm!")
    elif elbow_angle < 30:
        feedback.append("Curl up!")
    if abs(right_elbow[0] - right_shoulder[0]) > 0.1:  # Elbow flaring out
        feedback.append("Keep elbow close to body")

    # Visualization
    cv2.putText(frame, f"Count: {counter}", (20, 50), 
               cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    cv2.putText(frame, f"Stage: {stage}", (20, 90), 
               cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
    cv2.putText(frame, f"Angle: {elbow_angle:.1f}°", (20, 130),
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    
    for i, text in enumerate(feedback[:3]):
        cv2.putText(frame, text, (20, 170 + i*30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

    return frame, counter, stage