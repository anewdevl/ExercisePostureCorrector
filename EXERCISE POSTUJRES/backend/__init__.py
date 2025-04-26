"""
Backend module for AI Fitness Trainer
This module contains the Flask app and other backend components
"""

import sys
import os

# Add the parent directory to the Python path to allow importing modules
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Import exercises and other modules to make them available through the backend package
import exercises

# Don't initialize the database here to avoid multiple initializations
# The database should be initialized by run.py when the application starts 