"""
Yoga Pose Detection and Correction package for AIFitTrack.

This package provides functionality for detecting and correcting yoga poses
using computer vision and machine learning techniques.
"""

from .api import init_app, yoga_bp
from .yoga_detector import YogaPoseDetector

__all__ = ['init_app', 'yoga_bp', 'YogaPoseDetector'] 