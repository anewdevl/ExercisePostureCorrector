#!/usr/bin/env python
"""
Setup script for the AI Fitness Trainer application
This script helps with building and running the application
"""

import os
import sys
import subprocess
import argparse

def setup_environment():
    """Setup the Python virtual environment if it doesn't exist"""
    if not os.path.exists("../fitness_env"):
        print("Setting up virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", "../fitness_env"])
        print("Virtual environment created.")
    
    # Determine the activation script based on platform
    if sys.platform == "win32":
        activate_script = "../fitness_env/Scripts/activate"
    else:
        activate_script = "../fitness_env/bin/activate"
    
    print(f"To activate the environment, run: {activate_script}")
    return activate_script

def install_requirements():
    """Install Python requirements"""
    print("Installing Python requirements...")
    pip_cmd = [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"]
    subprocess.run(pip_cmd)
    print("Python requirements installed.")

def setup_frontend():
    """Setup the React frontend"""
    if not os.path.exists("frontend/node_modules"):
        print("Installing frontend dependencies...")
        os.chdir("frontend")
        subprocess.run(["npm", "install"])
        os.chdir("..")
        print("Frontend dependencies installed.")

def build_frontend():
    """Build the React frontend for production"""
    print("Building frontend for production...")
    os.chdir("frontend")
    subprocess.run(["npm", "run", "build"])
    os.chdir("..")
    print("Frontend built for production.")

def run_dev():
    """Run the application in development mode"""
    print("Starting the Flask backend...")
    backend_process = subprocess.Popen([sys.executable, "run.py"])
    
    print("Starting the React development server...")
    os.chdir("frontend")
    frontend_process = subprocess.Popen(["npm", "start"])
    os.chdir("..")
    
    try:
        # Wait for processes to complete (or Ctrl+C)
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        backend_process.terminate()
        frontend_process.terminate()
        backend_process.wait()
        frontend_process.wait()
        print("Servers shut down.")

def run_prod():
    """Run the application in production mode"""
    # Check if frontend build exists
    if not os.path.exists("frontend/build"):
        build_frontend()
    
    print("Starting the Flask backend in production mode...")
    subprocess.run([sys.executable, "run.py", "--production"])

def main():
    parser = argparse.ArgumentParser(description="AI Fitness Trainer setup and run script")
    parser.add_argument("--setup", action="store_true", help="Setup the environment")
    parser.add_argument("--build", action="store_true", help="Build the frontend for production")
    parser.add_argument("--dev", action="store_true", help="Run in development mode")
    parser.add_argument("--prod", action="store_true", help="Run in production mode")
    
    args = parser.parse_args()
    
    if args.setup:
        setup_environment()
        install_requirements()
        setup_frontend()
    elif args.build:
        build_frontend()
    elif args.dev:
        run_dev()
    elif args.prod:
        run_prod()
    else:
        parser.print_help()

if __name__ == "__main__":
    main() 