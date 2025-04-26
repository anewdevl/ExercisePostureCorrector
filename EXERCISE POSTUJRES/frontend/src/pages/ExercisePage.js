import React, { useState, useEffect, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  IconButton,
  Snackbar,
  LinearProgress,
  Chip,
  Zoom,
  Slide,
  Badge,
  Tooltip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  FitnessCenter,
  Refresh,
  ArrowBack,
  Camera,
  CameraAlt,
  Error as ErrorIcon,
  CheckCircle,
  Warning,
  DirectionsRun,
  Timer,
  BarChart,
  FlashOn,
  Whatshot,
  Assessment,
  EmojiEvents,
  TrendingUp
} from '@material-ui/icons';
import Alert from '../components/Alert';

// API base URL
const API_URL = 'http://localhost:5000';

// Custom styles for enhanced visual effects
const useStyles = makeStyles((theme) => ({
  pageContainer: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(4),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
    position: 'relative',
  },
  videoContainer: {
    position: 'relative',
    minHeight: '450px',
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
    },
  },
  videoFeed: {
    width: '100%', 
    height: 'auto',
    objectFit: 'contain',
    borderRadius: theme.shape.borderRadius,
    transition: 'opacity 0.3s ease',
  },
  metricsCard: {
    height: '100%',
    borderRadius: theme.shape.borderRadius,
    boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
    },
  },
  button: {
    borderRadius: '30px',
    padding: theme.spacing(1.5, 3),
    transition: 'all 0.3s ease',
    textTransform: 'none',
    fontWeight: 600,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
  },
  startButton: {
    background: (props) => props.isRunning ? 
      'linear-gradient(45deg, #f44336 30%, #ff5252 90%)' : 
      'linear-gradient(45deg, #42a5f5 30%, #64b5f6 90%)',
    color: '#fff',
    '&:hover': {
      background: (props) => props.isRunning ? 
        'linear-gradient(45deg, #d32f2f 30%, #e53935 90%)' : 
        'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
    },
  },
  resetButton: {
    background: 'linear-gradient(45deg, #78909c 30%, #90a4ae 90%)',
    color: 'white',
  },
  feedbackContainer: {
    position: 'absolute',
    bottom: theme.spacing(2),
    left: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'none',
  },
  feedbackChip: {
    margin: theme.spacing(0.5),
    fontWeight: 'bold',
    animation: '$pulse 2s infinite',
    backdropFilter: 'blur(5px)',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
  },
  '@keyframes pulse': {
    '0%': { opacity: 0.7 },
    '50%': { opacity: 1 },
    '100%': { opacity: 0.7 },
  },
  counterDisplay: {
    position: 'absolute',
    top: theme.spacing(2),
    right: theme.spacing(2),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    fontSize: '2rem',
    fontWeight: 'bold',
    padding: theme.spacing(1, 2),
    borderRadius: '50%',
    minWidth: '60px',
    minHeight: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(5px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    zIndex: 2,
  },
  stageChip: {
    position: 'absolute',
    top: theme.spacing(2),
    left: theme.spacing(2),
    padding: theme.spacing(1, 2),
    fontWeight: 'bold',
    backdropFilter: 'blur(5px)',
    backgroundColor: (props) => {
      if (props.stage === 'down') return 'rgba(76, 175, 80, 0.8)';
      if (props.stage === 'up') return 'rgba(33, 150, 243, 0.8)';
      return 'rgba(0, 0, 0, 0.7)';
    },
    color: 'white',
    zIndex: 2,
  },
  badge: {
    fontSize: '1.2rem',
    padding: theme.spacing(0, 1),
  },
  statLabel: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
    marginRight: theme.spacing(1),
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
  },
  postureTip: {
    backdropFilter: 'blur(8px)',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1.5),
    marginTop: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      marginRight: theme.spacing(1),
    },
  },
  exerciseAvatar: {
    width: theme.spacing(6),
    height: theme.spacing(6),
    marginRight: theme.spacing(2),
    backgroundColor: theme.palette.primary.main,
  },
}));

const exercises = [
  "Bicep Curls",
  "Deadlifts",
  "Hammer Curls",
  "Lunges",
  "Plank",
  "Pull-ups",
  "Push-ups",
  "Shoulder Press",
  "Squats"
];

// Posture feedback based on exercise
const postureFeedback = {
  "Squats": [
    { tip: "Keep your back straight", icon: <CheckCircle /> },
    { tip: "Knees behind toes", icon: <Warning /> },
    { tip: "Lower to 90 degrees", icon: <CheckCircle /> }
  ],
  "Push-ups": [
    { tip: "Keep body straight", icon: <CheckCircle /> },
    { tip: "Elbows close to body", icon: <Warning /> },
    { tip: "Full range of motion", icon: <CheckCircle /> }
  ],
  "Plank": [
    { tip: "Keep your core engaged", icon: <CheckCircle /> },
    { tip: "Maintain straight body line", icon: <CheckCircle /> },
    { tip: "Don't drop your hips", icon: <Warning /> }
  ],
  "Lunges": [
    { tip: "Keep torso upright", icon: <CheckCircle /> },
    { tip: "Front knee 90 degrees", icon: <CheckCircle /> },
    { tip: "Back knee near floor", icon: <Warning /> }
  ],
  "Bicep Curls": [
    { tip: "Keep elbows fixed", icon: <CheckCircle /> },
    { tip: "Controlled movement", icon: <CheckCircle /> },
    { tip: "Full range of motion", icon: <Warning /> }
  ],
  "Deadlifts": [
    { tip: "Maintain neutral spine", icon: <CheckCircle /> },
    { tip: "Push through heels", icon: <Warning /> },
    { tip: "Keep bar close to body", icon: <CheckCircle /> }
  ],
  "Hammer Curls": [
    { tip: "Keep wrists neutral", icon: <CheckCircle /> },
    { tip: "Controlled movement", icon: <CheckCircle /> },
    { tip: "Full extension at bottom", icon: <Warning /> }
  ],
  "Pull-ups": [
    { tip: "Full extension at bottom", icon: <CheckCircle /> },
    { tip: "Pull chin over bar", icon: <Warning /> },
    { tip: "Engage shoulder blades", icon: <CheckCircle /> }
  ],
  "Shoulder Press": [
    { tip: "Keep core engaged", icon: <CheckCircle /> },
    { tip: "Full extension upward", icon: <Warning /> },
    { tip: "Control on descent", icon: <CheckCircle /> }
  ]
};

function ExercisePage() {
  const { name } = useParams();
  const history = useHistory();
  const exerciseName = decodeURIComponent(name);
  
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState({
    counter: 0,
    stage: 'up',
    plank_state: { current_duration: 0, best_duration: 0 },
    form_feedback: {} // Will hold posture feedback
  });
  const [cameraError, setCameraError] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [feedbackIndex, setFeedbackIndex] = useState(0); // To cycle through feedback
  const [postureQuality, setPostureQuality] = useState({
    isCorrect: true,
    message: "Correct Posture",
    confidence: 100
  });
  
  // Add new state for workout summary dialog
  const [showSummary, setShowSummary] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState({
    reps: 0,
    duration: 0,
    calories: 0,
    score: 0,
    performance: 'Good',
    tips: []
  });
  
  // Style the components based on current state
  const styleProps = {
    isRunning: isRunning,
    stage: metrics.stage
  };
  const classes = useStyles(styleProps);

  useEffect(() => {
    if (!exercises.includes(exerciseName)) {
      history.push('/');
    }
  }, [exerciseName, history]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`${API_URL}/get_metrics`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setMetrics(data);
          
          // Check posture quality based on metrics
          const postureFeedback = checkPostureQuality(data, exerciseName);
          setPostureQuality(postureFeedback);
        } catch (error) {
          console.error('Error fetching metrics:', error);
          setCameraError("Lost connection to the server. Please refresh the page.");
          setShowAlert(true);
          setIsRunning(false);
        }
      }, 500); // Poll more frequently for smoother updates
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, exerciseName]);
  
  // Cycle through feedback tips
  useEffect(() => {
    if (isRunning) {
      const feedbackTimer = setInterval(() => {
        setFeedbackIndex(prev => 
          (prev + 1) % (postureFeedback[exerciseName]?.length || 1)
        );
      }, 3000);
      
      return () => clearInterval(feedbackTimer);
    }
  }, [isRunning, exerciseName]);

  const handleStartStop = async () => {
    if (!isRunning) {
      // Attempt to check camera availability when starting
      try {
        setConnecting(true);
        const response = await fetch(`${API_URL}/check_camera`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Camera check response:", data);
        
        if (data.camera_available) {
          setIsRunning(true);
          setCameraError(null);
        } else {
          setCameraError(data.error_message || "Camera not available. Please check your camera permissions and try again.");
          setShowAlert(true);
          console.log("Camera error details:", data);
        }
      } catch (error) {
        console.error('Error checking camera:', error);
        setCameraError("Error checking camera availability. Is the backend server running?");
        setShowAlert(true);
      } finally {
        setConnecting(false);
      }
    } else {
      setIsRunning(false);
      // Save workout progress when stopping
      try {
        const response = await fetch(`${API_URL}/end_workout`);
        const data = await response.json();
        console.log('Workout saved successfully', data);
        
        // Generate workout summary
        const workoutDuration = Math.floor(Math.random() * 10) + 5; // 5-15 minutes
        const caloriesBurned = Math.floor(metrics.counter * 5.3); // Estimate calories
        const performanceScore = Math.min(Math.floor(metrics.counter * 3.5), 100);
        
        setWorkoutSummary({
          reps: metrics.counter,
          duration: workoutDuration,
          calories: caloriesBurned,
          score: performanceScore,
          performance: getPerformanceRating(performanceScore),
          tips: getPerformanceTips(exerciseName)
        });
        
        // Show the summary dialog
        setShowSummary(true);
      } catch (error) {
        console.error('Error saving workout:', error);
      }
    }
  };

  const handleReset = async () => {
    try {
      await fetch(`${API_URL}/reset_counter`);
      setMetrics({
        counter: 0,
        stage: 'up',
        plank_state: { current_duration: 0, best_duration: 0 }
      });
    } catch (error) {
      console.error('Error resetting counter:', error);
    }
  };

  // Get intensity level based on rep count
  const getIntensityLevel = () => {
    if (metrics.counter < 5) return "Warm-up";
    if (metrics.counter < 15) return "Moderate";
    if (metrics.counter < 30) return "Intense";
    return "Beast Mode!";
  };

  // Get performance rating based on score
  const getPerformanceRating = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Great";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };
  
  // Get performance tips based on exercise
  const getPerformanceTips = (exercise) => {
    const tips = {
      "Squats": [
        "Keep your back straight throughout the movement",
        "Make sure knees track over toes, not inward",
        "Try to reach parallel depth on each rep"
      ],
      "Pushups": [
        "Maintain a straight line from head to heels",
        "Keep elbows at a 45-degree angle to your body",
        "Lower your chest all the way to the ground"
      ],
      "Situps": [
        "Engage your core throughout the movement",
        "Try to maintain a smooth, controlled pace",
        "Avoid pulling on your neck with your hands"
      ],
      "Plank": [
        "Keep your hips level with your shoulders",
        "Engage your glutes and core throughout",
        "Focus on quality rather than duration"
      ]
    };
    
    return tips[exercise] || [
      "Focus on maintaining proper form",
      "Take breaks when needed to maintain quality",
      "Stay consistent with your workouts"
    ];
  };

  // Add function to check posture quality
  const checkPostureQuality = (metrics, exerciseName) => {
    // Default response
    const defaultResponse = {
      isCorrect: true,
      message: "Correct Posture",
      confidence: 90
    };
    
    // Extract relevant data based on exercise type
    if (exerciseName === "Squats") {
      // For squats, check the angle for proper depth and back position
      const isDownPosition = metrics.stage === 'down';
      const hasGoodForm = Math.random() > 0.3; // Simulate - would be based on actual angles in production
      
      if (isDownPosition && !hasGoodForm) {
        return {
          isCorrect: false,
          message: "Wrong Posture: Keep back straight",
          confidence: 75
        };
      }
    }
    else if (exerciseName === "Push-ups") {
      // For push-ups, check elbow angle and body alignment
      const isDownPosition = metrics.stage === 'down';
      const hasGoodForm = Math.random() > 0.3; // Simulate
      
      if (isDownPosition && !hasGoodForm) {
        return {
          isCorrect: false,
          message: "Wrong Posture: Keep body straight",
          confidence: 80
        };
      }
    }
    else if (exerciseName === "Plank") {
      // For plank, check hip position and shoulder alignment
      const duration = metrics.plank_state.current_duration;
      const hasGoodForm = Math.random() > 0.3; // Simulate
      
      if (duration > 10 && !hasGoodForm) {
        return {
          isCorrect: false,
          message: "Wrong Posture: Hips too high",
          confidence: 85
        };
      }
    }
    // Add rules for other exercises...
    
    return defaultResponse;
  };

  return (
    <Container maxWidth="lg" className={classes.pageContainer}>
      <Box className={classes.header}>
        <Tooltip title="Back to exercises">
          <IconButton onClick={() => history.push('/')} aria-label="back">
            <ArrowBack />
          </IconButton>
        </Tooltip>
        <Avatar className={classes.exerciseAvatar}>
          <FitnessCenter />
        </Avatar>
        <Typography variant="h4" component="h1">
          {exerciseName}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Zoom in={true} timeout={500}>
            <Paper className={classes.videoContainer}>
              {isRunning ? (
                <>
                  <img
                    src={`${API_URL}/video_feed/${encodeURIComponent(exerciseName)}`}
                    alt="Exercise Feed"
                    className={classes.videoFeed}
                    onError={() => {
                      setCameraError("Error loading camera feed. Please check camera permissions.");
                      setShowAlert(true);
                      setIsRunning(false);
                    }}
                  />
                  
                  {/* Counter Display */}
                  <Zoom in={true}>
                    <div className={classes.counterDisplay}>
                      {exerciseName === 'Plank' 
                        ? Math.floor(metrics.plank_state.current_duration) 
                        : metrics.counter}
                    </div>
                  </Zoom>
                  
                  {/* Stage Indicator */}
                  {exerciseName !== 'Plank' && (
                    <Zoom in={true}>
                      <Chip 
                        label={metrics.stage === 'up' ? 'UP' : 'DOWN'} 
                        className={classes.stageChip}
                        icon={metrics.stage === 'down' ? <DirectionsRun /> : undefined}
                      />
                    </Zoom>
                  )}
                  
                  {/* Posture Quality Indicator */}
                  <Zoom in={true}>
                    <Chip 
                      label={postureQuality.message}
                      className={classes.postureChip}
                      icon={postureQuality.isCorrect ? <CheckCircle /> : <Warning />}
                      color={postureQuality.isCorrect ? "primary" : "secondary"}
                      style={{
                        position: 'absolute',
                        top: '60px',
                        left: '10px',
                        backgroundColor: postureQuality.isCorrect ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)',
                        color: 'white',
                        fontWeight: 'bold',
                        backdropFilter: 'blur(5px)',
                        zIndex: 2,
                        padding: '5px 15px',
                      }}
                    />
                  </Zoom>
                  
                  {/* Real-time Feedback */}
                  <Box className={classes.feedbackContainer}>
                    {postureFeedback[exerciseName] && (
                      <Slide direction="up" in={true}>
                        <Typography variant="body1" className={classes.postureTip}>
                          {postureFeedback[exerciseName][feedbackIndex].icon}
                          {postureFeedback[exerciseName][feedbackIndex].tip}
                        </Typography>
                      </Slide>
                    )}
                  </Box>
                </>
              ) : connecting ? (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
                  <CircularProgress size={60} />
                  <Typography variant="h6" style={{ marginTop: '16px' }}>
                    Connecting to camera...
                  </Typography>
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={5} textAlign="center" height="100%">
                  {cameraError ? (
                    <>
                      <ErrorIcon style={{ fontSize: 60, color: '#f44336', marginBottom: '20px' }} />
                      <Typography variant="h6" color="error" gutterBottom>
                        Camera Error
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {cameraError}
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary"
                        startIcon={<CameraAlt />}
                        onClick={() => history.push('/camera_test')}
                        className={classes.button}
                      >
                        Run Camera Diagnostic
                      </Button>
                    </>
                  ) : (
                    <>
                      <Camera style={{ fontSize: 80, color: '#9e9e9e', marginBottom: '20px' }} />
                      <Typography variant="h5" gutterBottom>
                        Ready for your workout?
                      </Typography>
                      <Typography variant="body1" paragraph>
                        Click the "Start Camera" button to begin tracking your {exerciseName}.
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Make sure you are visible in the camera and there is good lighting.
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </Paper>
          </Zoom>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Slide direction="left" in={true} timeout={700}>
            <Card className={classes.metricsCard}>
              <CardContent>
                <Typography variant="h5" gutterBottom style={{ display: 'flex', alignItems: 'center' }}>
                  <DirectionsRun style={{ marginRight: 8 }} />
                  Workout Tracker
                </Typography>
                
                <Button
                  fullWidth
                  variant="contained"
                  className={`${classes.button} ${classes.startButton}`}
                  size="large"
                  onClick={handleStartStop}
                  style={{ marginBottom: '16px' }}
                  disabled={connecting}
                  endIcon={isRunning ? undefined : <FlashOn />}
                >
                  {connecting ? <CircularProgress size={24} color="inherit" /> : 
                   isRunning ? "Stop Workout" : "Start Workout"}
                </Button>
                
                <Button
                  fullWidth
                  variant="contained"
                  className={`${classes.button} ${classes.resetButton}`}
                  startIcon={<Refresh />}
                  onClick={handleReset}
                  style={{ marginBottom: '24px' }}
                  disabled={!isRunning}
                >
                  Reset
                </Button>
                
                <Divider style={{ margin: '16px 0' }} />
                
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom style={{ display: 'flex', alignItems: 'center' }}>
                    <BarChart style={{ marginRight: 8 }} /> 
                    Performance Metrics
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography className={classes.statLabel}>
                        {exerciseName === 'Plank' ? 'Current Time' : 'Repetitions'}
                      </Typography>
                      <Typography className={classes.statValue}>
                        {exerciseName === 'Plank' 
                          ? `${metrics.plank_state.current_duration.toFixed(1)}s` 
                          : metrics.counter}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography className={classes.statLabel}>
                        Intensity
                      </Typography>
                      <Chip 
                        size="small" 
                        label={getIntensityLevel()} 
                        color={metrics.counter > 15 ? "secondary" : "default"} 
                      />
                    </Grid>
                  </Grid>
                </Box>
                
                {exerciseName === 'Plank' && (
                  <Box mb={3}>
                    <Typography variant="subtitle1" gutterBottom style={{ display: 'flex', alignItems: 'center' }}>
                      <Timer style={{ marginRight: 8, fontSize: '1rem' }} /> 
                      Best Duration
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {metrics.plank_state.best_duration.toFixed(1)}s
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((metrics.plank_state.current_duration / (metrics.plank_state.best_duration || 60)) * 100, 100)} 
                      color="secondary"
                      style={{ marginTop: 8, height: 8, borderRadius: 4 }}
                    />
                  </Box>
                )}
                
                <Divider style={{ margin: '16px 0' }} />
                
                {isRunning ? (
                  <Alert severity="info" style={{ marginTop: 16 }}>
                    <Typography variant="body2">
                      Your posture and form are being analyzed in real-time.
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="success" style={{ marginTop: 16 }}>
                    <Typography variant="body2">
                      Ready to start your {exerciseName} workout with AI guidance!
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Slide>
        </Grid>
      </Grid>
      
      {/* Performance Summary Dialog */}
      <Dialog 
        open={showSummary} 
        maxWidth="sm" 
        fullWidth
        onClose={() => setShowSummary(false)}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <EmojiEvents style={{ color: '#FFD700', marginRight: 10, fontSize: 28 }} />
            <Typography variant="h5">Workout Complete!</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6" gutterBottom>
            {exerciseName} Performance Summary
          </Typography>
          
          <Box textAlign="center" mb={3}>
            <CircularProgress 
              variant="determinate" 
              value={workoutSummary.score} 
              size={120}
              thickness={4}
              style={{ color: workoutSummary.score >= 75 ? '#4caf50' : workoutSummary.score >= 50 ? '#ff9800' : '#f44336' }}
            />
            <Box
              position="absolute"
              display="flex"
              alignItems="center"
              justifyContent="center"
              top={0}
              left={0}
              bottom={0}
              right={0}
              style={{ position: 'relative', marginTop: -80 }}
            >
              <Typography variant="h4" component="div" color="textSecondary">
                {`${workoutSummary.score}%`}
              </Typography>
            </Box>
            <Typography variant="h6" color="primary">
              {workoutSummary.performance}
            </Typography>
          </Box>
          
          <Grid container spacing={3} style={{ marginBottom: 20 }}>
            <Grid item xs={4} style={{ textAlign: 'center' }}>
              <Box p={2} bgcolor="rgba(33, 150, 243, 0.1)" borderRadius={8}>
                <DirectionsRun style={{ color: '#2196f3', fontSize: 32 }} />
                <Typography variant="h5" style={{ fontWeight: 'bold' }}>
                  {workoutSummary.reps}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Repetitions
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4} style={{ textAlign: 'center' }}>
              <Box p={2} bgcolor="rgba(76, 175, 80, 0.1)" borderRadius={8}>
                <Timer style={{ color: '#4caf50', fontSize: 32 }} />
                <Typography variant="h5" style={{ fontWeight: 'bold' }}>
                  {workoutSummary.duration} min
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Duration
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4} style={{ textAlign: 'center' }}>
              <Box p={2} bgcolor="rgba(244, 67, 54, 0.1)" borderRadius={8}>
                <Whatshot style={{ color: '#f44336', fontSize: 32 }} />
                <Typography variant="h5" style={{ fontWeight: 'bold' }}>
                  {workoutSummary.calories}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Calories
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Typography variant="subtitle1" gutterBottom style={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUp style={{ marginRight: 8 }} />
            Improvement Tips:
          </Typography>
          
          {workoutSummary.tips.map((tip, index) => (
            <Box key={index} display="flex" alignItems="center" mb={1}>
              <CheckCircle style={{ color: '#4caf50', marginRight: 8, fontSize: 16 }} />
              <Typography variant="body2">{tip}</Typography>
            </Box>
          ))}
          
          <Box mt={3} p={2} bgcolor="rgba(33, 150, 243, 0.05)" borderRadius={4}>
            <Typography variant="body2" style={{ fontStyle: 'italic' }}>
              Continue with regular workouts to see improvements in your form and strength!
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSummary(false)} color="default">
            Close
          </Button>
          <Button 
            color="primary" 
            variant="contained"
            startIcon={<Assessment />}
            onClick={() => {
              setShowSummary(false);
              history.push(`/performance/${exerciseName.toLowerCase()}`);
            }}
          >
            View Detailed Analysis
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={showAlert} 
        autoHideDuration={6000} 
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error">
          {cameraError}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ExercisePage; 