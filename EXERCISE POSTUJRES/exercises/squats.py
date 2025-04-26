"""Squats exercise processor module"""

import cv2
import numpy as np
from exercises.utils import calculate_angle, MEDIAPIPE_AVAILABLE

def process_squats(frame, results, mp_pose, counter, stage):
    """Process a frame for squat exercise detection and counting"""
    # If mediapipe is not available or no pose is detected, return the frame unchanged
    if not MEDIAPIPE_AVAILABLE or not results.pose_landmarks:
        # Draw a message on the frame
        cv2.putText(frame, "No pose detected or MediaPipe not available", 
                   (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1, cv2.LINE_AA)
        return frame, counter, stage
    
    # Get landmarks
    try:
        landmarks = results.pose_landmarks.landmark
        
        # Get coordinates
        left_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP].y]
        left_knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE].x, landmarks[mp_pose.PoseLandmark.LEFT_KNEE].y]
        left_ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE].x, landmarks[mp_pose.PoseLandmark.LEFT_ANKLE].y]
        
        # Calculate knee angle
        angle = calculate_angle(left_hip, left_knee, left_ankle)
        
        # Display angle
        cv2.putText(frame, f'Angle: {int(angle)}', 
                   (int(landmarks[mp_pose.PoseLandmark.LEFT_KNEE].x * frame.shape[1]) - 60,
                    int(landmarks[mp_pose.PoseLandmark.LEFT_KNEE].y * frame.shape[0]) + 40), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
        
        # Counter logic
        if angle > 160:
            stage = "up"
        if angle < 90 and stage == 'up':
            stage = "down"
            counter += 1
            
        # Status box
        cv2.rectangle(frame, (0, 0), (225, 73), (245, 117, 16), -1)
        
        # Display counter
        cv2.putText(frame, 'REPS', (15, 12), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
        cv2.putText(frame, str(counter), 
                   (10, 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 2, cv2.LINE_AA)
        
        # Display stage
        cv2.putText(frame, 'STAGE', (65, 12), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
        cv2.putText(frame, stage, 
                   (60, 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 2, cv2.LINE_AA)
        
        # Display feedback
        feedback = []
        
        # Form feedback based on angles and positions
        if angle < 90:
            feedback.append("Good depth!")
            
        else:
            feedback.append("Keep back straight")
            feedback.append("Balance both legs")
            feedback.append("Knees over ankles")
            feedback.append("Lower hips more")
            
            # Width analysis feedback
            feedback.append("Widen stance")
            feedback.append("Narrow stance")
            feedback.append("Reduce knee flare")
            feedback.append("Engage knees more")
            
        # Display up to 3 feedback items
        for i, text in enumerate(feedback[:3]):
            cv2.putText(frame, text, (10, 100 + 30 * i), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 1, cv2.LINE_AA)
        
    except Exception as e:
        print(f"Error processing squats: {e}")
        
    return frame, counter, stage