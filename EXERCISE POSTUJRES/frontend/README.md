# AI Fitness Trainer Frontend

This directory contains the React frontend for the AI Fitness Trainer application.

## Directory Structure

```
frontend/
├── public/                # Static assets
│   ├── index.html         # HTML template
│   ├── favicon.ico        # Favicon
│   └── ...                # Other static assets
├── src/                   # React source code
│   ├── components/        # Reusable React components
│   │   ├── Alert.js       # Custom Alert component
│   │   ├── Header.js      # Application header
│   │   └── ...            # Other reusable components
│   ├── pages/             # Page components
│   │   ├── HomePage.js             # Home page
│   │   ├── LoginPage.js            # Login page
│   │   ├── RegisterPage.js         # Registration page
│   │   ├── ExercisePage.js         # Exercise tracking page
│   │   ├── ProfilePage.js          # User profile page
│   │   ├── HistoryPage.js          # Workout history page
│   │   ├── CameraTestPage.js       # Camera diagnostics page
│   │   ├── YogaPage.js             # Yoga detection page
│   │   ├── HomeWorkoutsPage.js     # Home workouts list
│   │   ├── GymWorkoutsPage.js      # Gym workouts list
│   │   └── PerformanceAnalysisPage.js # Workout analysis page
│   ├── App.js             # Main React component
│   ├── index.js           # React entry point
│   └── ...                # Other files
├── package.json           # NPM package configuration
└── README.md              # This file
```

## Component Organization

The frontend code is organized following these principles:

1. **Separation of Concerns**:
   - `components/` contains reusable UI components
   - `pages/` contains full page components that use the reusable components

2. **Component Structure**:
   - Each component is self-contained with its own styles
   - Material-UI is used for consistent styling
   - useState and useEffect hooks manage component state

3. **Data Flow**:
   - API calls to the backend retrieve exercise data, metrics, and user info
   - React state manages UI updates in response to backend data

## Key Pages

- **HomePage**: Entry point with exercise selection
- **ExercisePage**: Main exercise tracking with camera integration
- **CameraTestPage**: Diagnostics for camera issues
- **YogaPage**: Yoga pose detection and guidance
- **ProfilePage**: User information management
- **HistoryPage**: Past workout visualization

## Running the Frontend

### Development Mode
```bash
npm start
```

### Production Build
```bash
npm run build
```

## API Integration

The frontend communicates with the backend through these endpoints:

- `/api/check-auth` - Authentication status check
- `/video_feed/<exercise>` - Camera stream for exercise detection
- `/get_metrics` - Real-time exercise metrics
- `/reset_counter` - Reset exercise counter
- `/end_workout` - Save workout and get performance summary
- `/check_camera` - Diagnostic information about camera status

## Features

- Modern Material UI based interface
- Real-time exercise tracking visualization
- User authentication and profile management
- Workout history tracking
- Comprehensive camera diagnostics

## Getting Started

### Prerequisites

- Node.js 14+
- npm or yarn

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

3. Build for production:
   ```
   npm run build
   ```

## Development

The frontend is organized as follows:

- `/src/pages` - Main application pages
- `/src/components` - Reusable UI components
- `/src/api` - API client code
- `/public` - Static assets

## Working with the Backend

The frontend communicates with the Flask backend API. In development mode, the React app proxies requests to http://localhost:5000 (where the Flask app should be running).

Make sure the Flask backend is running when developing the frontend.

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Runs the test suite
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App

## Technologies Used

- React 17
- React Router 6
- Material UI 4
- Axios

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request 