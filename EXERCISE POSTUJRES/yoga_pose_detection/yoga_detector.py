import cv2
import mediapipe as mp
import numpy as np
import os
import time
from .utils import (
    load_model, 
    detect_pose, 
    compare_angles, 
    get_pose_feedback,
    load_reference_pose,
    save_reference_pose,
    YOGA_POSES
)

class YogaPoseDetector:
    """Main class for yoga pose detection and correction."""
    
    def __init__(self, model_type='svm_rbf'):
        """
        Initialize the yoga pose detector.
        
        Args:
            model_type (str): Type of model to use for classification
        """
        # Load MediaPipe Pose
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,      # Lower complexity for better performance
            enable_segmentation=False,  # Disable segmentation for better performance
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Load the trained model and scaler
        self.model, self.scaler = load_model(model_type)
        
        # Initialize variables to store current state
        self.current_pose = None
        self.current_confidence = 0.0
        self.current_angles = []
        self.reference_angles = {}
        
        # Load reference angles for all supported poses
        for pose_name in YOGA_POSES:
            self.reference_angles[pose_name] = load_reference_pose(pose_name)
        
        # Initialize feedback and correction variables
        self.last_feedback = {}
        self.correction_needed = False
        
        # Performance tracking
        self.fps = 0
        self.frame_time = 0
    
    def process_frame(self, frame):
        """
        Process a video frame for yoga pose detection.
        
        Args:
            frame: Input video frame
            
        Returns:
            processed_frame: Annotated frame with pose detection and feedback
            result_data: Dictionary containing detection results
        """
        # Track frame processing time for FPS calculation
        start_time = time.time()
        
        # Check if the frame is valid
        if frame is None or frame.size == 0:
            return None, {"error": "Invalid frame"}
            
        # Make a copy of the frame
        display_frame = frame.copy()
        
        # Process frame for pose detection
        result_frame, pose_name, confidence, angles = detect_pose(
            frame, self.pose, self.model, self.scaler
        )
        
        # Update current state
        self.current_pose = pose_name
        self.current_confidence = confidence
        self.current_angles = angles
        
        # Handle yoga pose correction if a valid pose is detected
        feedback = {}
        if pose_name != "unknown" and confidence > 30:  # Confidence threshold
            # Get reference angles for the detected pose
            reference = self.reference_angles.get(pose_name, [])
            
            if reference:
                # Compare user's pose with reference pose
                corrections, score = compare_angles(angles, reference, pose_name)
                
                # Generate feedback
                feedback = get_pose_feedback(pose_name, corrections, score)
                self.last_feedback = feedback
                
                # Add score to the display frame
                cv2.putText(result_frame, f'Score: {score:.1f}%', 
                           (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)
                
                # Add corrections to the display frame
                y_offset = 150
                for correction in feedback['detailed_corrections'][:3]:  # Show top 3 corrections
                    cv2.putText(result_frame, correction, 
                               (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 1, cv2.LINE_AA)
                    y_offset += 30
            else:
                # If reference pose doesn't exist, prompt user
                cv2.putText(result_frame, "Reference pose not available", 
                           (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2, cv2.LINE_AA)
        
        # Calculate FPS
        end_time = time.time()
        process_time = end_time - start_time
        self.frame_time = process_time
        self.fps = 1.0 / process_time if process_time > 0 else 0
        
        # Add FPS to the display frame
        cv2.putText(result_frame, f'FPS: {self.fps:.1f}', 
                   (frame.shape[1] - 150, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2, cv2.LINE_AA)
        
        # Prepare result data
        result_data = {
            "pose_name": pose_name,
            "confidence": confidence,
            "feedback": feedback,
            "fps": self.fps
        }
        
        return result_frame, result_data
    
    def save_current_pose_as_reference(self):
        """
        Save the current pose as a reference for future comparisons.
        
        Returns:
            success: Boolean indicating success
            message: Status message
        """
        if not self.current_pose or self.current_pose == "unknown":
            return False, "No valid pose detected to save as reference"
            
        if self.current_confidence < 70:
            return False, "Confidence too low to save as reference"
            
        if not self.current_angles:
            return False, "No angles detected to save as reference"
            
        # Save reference pose
        success = save_reference_pose(self.current_angles, self.current_pose)
        
        if success:
            # Update local reference
            self.reference_angles[self.current_pose] = self.current_angles
            return True, f"Successfully saved reference for {self.current_pose}"
        else:
            return False, f"Failed to save reference for {self.current_pose}"
    
    def get_available_poses(self):
        """
        Get list of available yoga poses.
        
        Returns:
            poses: List of available poses
            references: Dictionary indicating if reference angles exist
        """
        poses = YOGA_POSES
        references = {}
        
        for pose in poses:
            references[pose] = len(self.reference_angles.get(pose, [])) > 0
            
        return poses, references
    
    def release(self):
        """Release resources."""
        if self.pose:
            self.pose.close() 