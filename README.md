# AI Fitness Trainer

This repository contains the AI Fitness Trainer application, which includes both backend and frontend components. Follow the instructions below to set up the project on a new system.

---

## Prerequisites

1. **Python**: Ensure Python 3.8 or higher is installed.
2. **Node.js**: Install Node.js (for the frontend).
3. **Git**: Ensure Git is installed for version control.
4. **Virtual Environment**: Recommended for Python dependency isolation.

---

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Backend Setup

#### a. Create a Python Virtual Environment
```bash
python -m venv fitness_env
```

#### b. Activate the Virtual Environment
- **Windows**:
  ```bash
  fitness_env\Scripts\activate
  ```
- **Mac/Linux**:
  ```bash
  source fitness_env/bin/activate
  ```

#### c. Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### d. Move Required Files
Follow the instructions in the backend's [README.md](EXERCISE%20POSTUJRES/backend/README.md):
1. Move exercise files to `backend/exercises/`.
2. Move templates to `backend/templates/`.
3. Move the `yoga_pose_detection` module to `backend/yoga_pose_detection/`.

#### e. Update Import Paths
Ensure all affected files have updated import paths.

---

### 3. Frontend Setup

#### a. Navigate to the Frontend Directory
```bash
cd frontend
```

#### b. Install Node.js Dependencies
```bash
npm install
```

#### c. Build the Frontend (Production)
```bash
npm run build
```

#### d. Run the Frontend (Development)
```bash
npm start
```

---

### 4. Running the Application

#### a. Backend
Run the backend server:
```bash
python run.py
```

For development mode:
```bash
python run.py --host 127.0.0.1 --port 5000
```

#### b. Frontend
Access the frontend at `http://localhost:3000` (if running in development mode).

---

## Additional Notes

- **Environment Activation**: Always activate the virtual environment before running backend commands.
- **Frontend Build**: Ensure the frontend is built before deploying the application.
- **Scripts**: Use `setup.py` for additional setup options like `--setup`, `--build`, `--dev`, and `--prod`.

---

## Troubleshooting

- If dependencies fail to install, ensure you have the correct Python and Node.js versions.
- For Windows users, ensure `pip` and `npm` are added to your system's PATH.

---

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
