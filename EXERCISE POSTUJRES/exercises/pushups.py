import cv2
import numpy as np
from .utils import calculate_angle

def process_pushups(frame, results, mp_pose, counter, stage):
    landmarks = results.pose_landmarks.landmark
    
    # Get key points
    left_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].x, 
                    landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].y]
    left_elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW].x, 
                 landmarks[mp_pose.PoseLandmark.LEFT_ELBOW].y]
    left_wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST].x, 
                 landmarks[mp_pose.PoseLandmark.LEFT_WRIST].y]
    
    right_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].x, 
                     landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].y]
    right_elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW].x, 
                  landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW].y]
    right_wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST].x, 
                  landmarks[mp_pose.PoseLandmark.RIGHT_WRIST].y]
    
    left_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP].x, 
               landmarks[mp_pose.PoseLandmark.LEFT_HIP].y]
    right_hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP].x, 
                landmarks[mp_pose.PoseLandmark.RIGHT_HIP].y]

    # Calculate angles
    left_elbow_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
    right_elbow_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
    torso_angle = calculate_angle(left_shoulder, left_hip, right_hip)

    # Push-up logic
    feedback = []
    if left_elbow_angle > 165 and right_elbow_angle > 165:
        stage = "up"
    if left_elbow_angle < 90 and right_elbow_angle < 90 and stage == "up":
        stage = "down"
        counter += 1
        feedback.append("Full range achieved!")
        
    # Form validation
    if torso_angle > 10:
        feedback.append("Keep body straight")
    if abs(left_elbow_angle - right_elbow_angle) > 15:
        feedback.append("Balance arm movement")
    if left_elbow_angle < 70 or right_elbow_angle < 70:
        feedback.append("Lower more")

    # Visualization
    cv2.putText(frame, f"Count: {counter}", (20, 50), 
               cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    cv2.putText(frame, f"Stage: {stage}", (20, 90), 
               cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
    
    for i, text in enumerate(feedback[:3]):
        cv2.putText(frame, text, (20, 130 + i*30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

    return frame, counter, stage