import cv2
import numpy as np
from .utils import calculate_angle

def process_deadlifts(frame, results, mp_pose, counter, stage):
    landmarks = results.pose_landmarks.landmark
    
    # Get key points
    left_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP].x,
               landmarks[mp_pose.PoseLandmark.LEFT_HIP].y]
    left_knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE].x,
                landmarks[mp_pose.PoseLandmark.LEFT_KNEE].y]
    left_ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE].x,
                 landmarks[mp_pose.PoseLandmark.LEFT_ANKLE].y]
    left_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].x,
                    landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].y]

    # Calculate angles
    knee_angle = calculate_angle(left_hip, left_knee, left_ankle)
    back_angle = calculate_angle(left_shoulder, left_hip, left_knee)

    # Deadlift detection logic
    feedback = []
    if back_angle > 160 and knee_angle > 160:
        stage = "up"
    if back_angle < 120 and knee_angle < 140 and stage == "up":
        stage = "down"
        counter += 1
        feedback.append("Good rep!")
        
    # Form validation
    if back_angle < 100:
        feedback.append("Keep back straight!")
    if knee_angle < 80:
        feedback.append("Don't bend knees too much!")
    if abs(back_angle - 140) > 20:  # Ideal back angle range
        feedback.append("Adjust back angle")

    # Visualization
    cv2.putText(frame, f"Count: {counter}", (20, 50), 
               cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    cv2.putText(frame, f"Stage: {stage}", (20, 90), 
               cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
    cv2.putText(frame, f"Knee: {knee_angle:.1f}°", (20, 130),
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    cv2.putText(frame, f"Back: {back_angle:.1f}°", (20, 160),
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
    
    for i, text in enumerate(feedback[:3]):
        cv2.putText(frame, text, (20, 200 + i*30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

    return frame, counter, stage