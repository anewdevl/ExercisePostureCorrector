# Yoga Pose Detection and Correction

This component integrates yoga pose detection capabilities with real-time feedback into the AIFitTrack platform.

Based on the project by [FPT-ThaiTuan/Detect-Yoga-Poses-And-Correction-In-Real-Time-Using-Machine-Learning-Algorithms](https://github.com/FPT-ThaiTuan/Detect-Yoga-Poses-And-Correction-In-Real-Time-Using-Machine-Learning-Algorithms).

## Features

- **Pose Classification**: Accurately detects and classifies yoga poses using machine learning algorithms
- **Real-time Posture Correction**: Provides immediate feedback to correct user's form
- **Multi-model Support**: Uses a combination of SVM (Support Vector Machines) and LSTM models
- **High Accuracy**: Achieves up to 98% accuracy in pose detection

## Usage

Access the yoga pose feature through the AIFitTrack platform, available at:
- http://localhost:5000/yoga_poses (API endpoints)
- http://localhost:3000/yoga (Frontend interface)

## Technical Details

This module integrates multiple classification approaches:
- SVM with Linear, Polynomial, and RBF kernels
- BlazePose for pose estimation
- Real-time angle correction algorithms

## Directory Structure

- `models/`: Contains trained ML models
- `utils.py`: Utility functions for pose detection and angle calculation
- `yoga_detector.py`: Main detection and correction logic
- `api.py`: Flask API integration with the main application 