import cv2
import numpy as np
from .utils import calculate_angle

def process_shoulderpress(frame, results, mp_pose, counter, stage):
    landmarks = results.pose_landmarks.landmark
    
    # Get key points for both arms
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

    # Shoulder press detection logic
    feedback = []
    if left_elbow_angle > 160 and right_elbow_angle > 160:
        stage = "down"
    if left_elbow_angle < 90 and right_elbow_angle < 90 and stage == "down":
        stage = "up"
        counter += 1
        feedback.append("Good rep!")
        
    # Form validation
    if left_elbow_angle > 160 and right_elbow_angle > 160:
        feedback.append("Lower the weights!")
    elif left_elbow_angle < 90 and right_elbow_angle < 90:
        feedback.append("Press upwards!")
    if abs(left_elbow_angle - right_elbow_angle) > 15:
        feedback.append("Balance both arms")
    if left_shoulder[1] > left_elbow[1] or right_shoulder[1] > right_elbow[1]:
        feedback.append("Don't shrug shoulders")

    # Visualization
    cv2.putText(frame, f"Count: {counter}", (20, 50), 
               cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    cv2.putText(frame, f"Stage: {stage}", (20, 90), 
               cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
    cv2.putText(frame, f"Left: {left_elbow_angle:.1f}°", (20, 130),
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    cv2.putText(frame, f"Right: {right_elbow_angle:.1f}°", (20, 160),
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    
    for i, text in enumerate(feedback[:3]):
        cv2.putText(frame, text, (20, 200 + i*30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

    return frame, counter, stage