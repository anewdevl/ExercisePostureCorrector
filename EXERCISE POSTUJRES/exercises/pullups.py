import cv2
import numpy as np
from .utils import calculate_angle

def process_pullups(frame, results, mp_pose, counter, stage):
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

    # Calculate elbow angles
    left_elbow_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
    right_elbow_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)

    # Pull-up detection logic
    feedback = []
    if left_elbow_angle > 160 and right_elbow_angle > 160:
        stage = "down"
    if left_elbow_angle < 90 and right_elbow_angle < 90 and stage == "down":
        stage = "up"
        counter += 1
        feedback.append("Good rep!")
        
    # Form validation
    if left_elbow_angle > 160 and right_elbow_angle > 160:
        feedback.append("Fully extend arms!")
    elif left_elbow_angle < 90 and right_elbow_angle < 90:
        feedback.append("Chin above bar!")
    if abs(left_elbow_angle - right_elbow_angle) > 15:
        feedback.append("Balance both arms")

    # Visualization
    cv2.putText(frame, f"Count: {counter}", (20, 50), 
               cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    cv2.putText(frame, f"Stage: {stage}", (20, 90), 
               cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
    
    # Display angles (for debugging/form improvement)
    cv2.putText(frame, f'Left: {int(left_elbow_angle)}', (50, 130),
               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    cv2.putText(frame, f'Right: {int(right_elbow_angle)}', (50, 160),
               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    
    # Display feedback
    for i, text in enumerate(feedback):
        cv2.putText(frame, text, (20, 190 + i*30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

    return frame, counter, stage