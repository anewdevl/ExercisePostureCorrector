import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Fade,
  LinearProgress,
  Snackbar
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  Accessibility as YogaIcon,
  Videocam as CameraIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Save,
  ArrowForward
} from '@material-ui/icons';
import Alert from '../components/Alert';

const API_URL = 'http://localhost:5000';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(4, 0),
    minHeight: 'calc(100vh - 64px)',
  },
  title: {
    marginBottom: theme.spacing(1),
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      marginRight: theme.spacing(2),
      fontSize: 40,
      color: theme.palette.primary.main,
    },
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: theme.spacing(4),
  },
  controlsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  formControl: {
    minWidth: 200,
    flexGrow: 1,
  },
  videoContainer: {
    position: 'relative',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
    marginBottom: theme.spacing(4),
    '&::before': {
      content: '""',
      paddingTop: '75%', // 4:3 aspect ratio
      display: 'block',
    },
  },
  videoFeed: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  statusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: theme.spacing(1),
    display: 'flex',
    justifyContent: 'space-between',
  },
  actionButton: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 24,
    padding: theme.spacing(1, 3),
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
    },
  },
  buttonStart: {
    backgroundColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  buttonStop: {
    backgroundColor: theme.palette.error.main,
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
    },
  },
  buttonSave: {
    backgroundColor: theme.palette.success.main,
    '&:hover': {
      backgroundColor: theme.palette.success.dark,
    },
  },
  poseCard: {
    backgroundColor: '#1e1e1e',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: 12,
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 12px 20px rgba(0, 0, 0, 0.2)',
    },
  },
  poseCardMedia: {
    height: 0,
    paddingTop: '56.25%', // 16:9
    position: 'relative',
  },
  poseCardContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  poseStatus: {
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
  },
  feedbackContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: theme.spacing(3),
    marginBottom: theme.spacing(4),
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 700,
    textAlign: 'center',
    color: theme.palette.primary.main,
  },
  scoreLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: theme.spacing(1),
  },
  correctionItem: {
    backgroundColor: 'rgba(33, 150, 243, 0.08)',
    padding: theme.spacing(1.5),
    borderRadius: 8,
    marginBottom: theme.spacing(1),
    borderLeft: `4px solid ${theme.palette.primary.main}`,
  },
  criticalCorrection: {
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
    borderLeft: `4px solid ${theme.palette.error.main}`,
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  noDataContainer: {
    textAlign: 'center',
    padding: theme.spacing(4),
  },
}));

// Sample yoga pose images and descriptions for UI display
const YOGA_POSES_INFO = {
  'downdog': {
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
    description: 'Downward Dog pose strengthens arms and legs while stretching the shoulders, hamstrings, calves, and feet.',
    difficulty: 'Beginner'
  },
  'goddess': {
    image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&w=800&q=80',
    description: 'Goddess pose builds strength in the legs and opens the hips and chest.',
    difficulty: 'Intermediate'
  },
  'plank': {
    image: 'https://images.unsplash.com/photo-1566241142659-2d2372e3a4a2?auto=format&fit=crop&w=800&q=80',
    description: 'Plank pose builds core strength and stability while toning the arms and shoulders.',
    difficulty: 'Beginner'
  },
  'tree': {
    image: 'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?auto=format&fit=crop&w=800&q=80',
    description: 'Tree pose improves balance, focus, and strengthens the legs and core.',
    difficulty: 'Beginner'
  },
  'warrior2': {
    image: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?auto=format&fit=crop&w=800&q=80',
    description: 'Warrior II pose builds strength in the legs and opens the hips and chest.',
    difficulty: 'Intermediate'
  }
};

function YogaPage() {
  const classes = useStyles();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  
  const [availablePoses, setAvailablePoses] = useState([]);
  const [poseReferences, setPoseReferences] = useState({});
  const [selectedPose, setSelectedPose] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [bodyDetected, setBodyDetected] = useState(true);
  const [detectionIssues, setDetectionIssues] = useState({
    hasIssue: false,
    message: ''
  });
  
  // Function to initialize the video feed
  const initCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        // Stop any existing stream
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please check permissions and try again.');
    }
  }, []);
  
  // Function to load available poses
  const loadAvailablePoses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/yoga_poses/api/available_poses`);
      const data = await response.json();
      
      if (data.success) {
        setAvailablePoses(data.poses || []);
        setPoseReferences(data.references || {});
      } else {
        throw new Error(data.error || 'Failed to load poses');
      }
    } catch (err) {
      console.error('Error loading poses:', err);
      setError('Failed to load yoga poses. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Function to get a frame from the video
  const getVideoFrame = useCallback(() => {
    if (!videoRef.current) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg');
  }, [videoRef]);
  
  // Function to detect poses
  const detectPose = useCallback(async () => {
    if (!isDetecting || !videoRef.current) return;
    
    try {
      const videoFrame = getVideoFrame();
      
      if (!videoFrame) return;
      
      const response = await fetch(`${API_URL}/yoga_poses/api/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: videoFrame,
          pose: selectedPose
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.result.error) {
          // Handle error from backend
          setDetectionIssues({
            hasIssue: true,
            message: data.result.error
          });
          setBodyDetected(false);
        } else if (data.result.pose_name === 'unknown') {
          // Handle case where no pose is detected
          setDetectionIssues({
            hasIssue: true,
            message: 'Move your full body into frame'
          });
          setBodyDetected(false);
        } else {
          // Valid detection
          setDetectionIssues({
            hasIssue: false,
            message: ''
          });
          setBodyDetected(true);
          
          // Update feedback
          if (data.result.feedback) {
            setFeedback(data.result);
          }
        }
      } else {
        setDetectionIssues({
          hasIssue: true,
          message: data.error || 'Error during pose detection'
        });
        setBodyDetected(false);
      }
    } catch (err) {
      console.error('Error during pose detection:', err);
      setDetectionIssues({
        hasIssue: true,
        message: 'Connection error'
      });
      setBodyDetected(false);
    }
    
    // Continue detection loop if still active
    if (isDetecting) {
      requestAnimationFrame(detectPose);
    }
  }, [isDetecting, selectedPose, getVideoFrame, setDetectionIssues, setBodyDetected, setFeedback]);
  
  // Function to save reference pose
  const saveReference = async () => {
    try {
      const videoFrame = getVideoFrame();
      
      if (!videoFrame) {
        setNotification({
          open: true,
          message: 'Could not capture video frame',
          severity: 'error'
        });
        return;
      }
      
      const response = await fetch(`${API_URL}/yoga_poses/api/save_reference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: videoFrame
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotification({
          open: true,
          message: `Successfully saved reference for ${data.pose}`,
          severity: 'success'
        });
        
        // Update pose references
        setPoseReferences(prev => ({
          ...prev,
          [data.pose]: true
        }));
      } else {
        setNotification({
          open: true,
          message: data.message || 'Failed to save reference',
          severity: 'error'
        });
      }
    } catch (err) {
      console.error('Error saving reference:', err);
      setNotification({
        open: true,
        message: 'Error saving reference',
        severity: 'error'
      });
    }
  };
  
  // Toggle pose detection
  const toggleDetection = () => {
    setIsDetecting(prev => !prev);
  };
  
  // Load available poses on component mount
  useEffect(() => {
    loadAvailablePoses();
    
    // Initialize camera on mount
    initCamera();
    
    // Cleanup function to stop camera on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [initCamera]);

  // Handle pose detection when isDetecting changes
  useEffect(() => {
    if (isDetecting) {
      detectPose();
    }
  }, [isDetecting, detectPose]);
  
  // Handle pose selection change
  const handlePoseChange = (event) => {
    setSelectedPose(event.target.value);
    setFeedback(null); // Reset feedback when changing pose
  };
  
  // Handle notification close
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  // Render loading state
  if (loading) {
    return (
      <Container maxWidth="lg" className={classes.root}>
        <Box className={classes.loadingContainer}>
          <CircularProgress size={60} />
          <Typography variant="h6" style={{ marginTop: 20 }}>
            Loading yoga pose detection...
          </Typography>
        </Box>
      </Container>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Container maxWidth="lg" className={classes.root}>
        <Box className={classes.noDataContainer}>
          <Typography variant="h5" color="error" gutterBottom>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.location.reload()}
            style={{ marginTop: 16 }}
          >
            Try Again
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" className={classes.root}>
      <Typography variant="h3" component="h1" className={classes.title}>
        <YogaIcon /> Yoga Pose Detection
      </Typography>
      <Typography variant="subtitle1" className={classes.subtitle}>
        Practice yoga poses with real-time AI feedback and posture correction
      </Typography>
      
      <Box className={classes.videoContainer}>
        <video 
          ref={videoRef} 
          className={classes.videoFeed} 
          autoPlay 
          playsInline 
          muted
        />
        
        <Box className={classes.statusOverlay}>
          <Chip 
            label={isDetecting ? "Detecting" : "Camera Ready"} 
            color={isDetecting ? "secondary" : "default"}
            size="small"
          />
          <Chip 
            label={selectedPose ? selectedPose.toUpperCase() : "No Pose Selected"} 
            color={selectedPose ? "primary" : "default"}
            size="small"
          />
        </Box>
        
        {isDetecting && detectionIssues.hasIssue && (
          <Box 
            position="absolute" 
            bottom={0} 
            left={0} 
            right={0} 
            bgcolor="rgba(0,0,0,0.7)"
            p={2}
          >
            <Alert severity="warning">
              <Typography variant="subtitle2">
                {detectionIssues.message}
              </Typography>
              <Typography variant="body2">
                Make sure your full body is visible in the frame and there is good lighting.
              </Typography>
            </Alert>
          </Box>
        )}
      </Box>
      
      <Box className={classes.controlsContainer}>
        <FormControl variant="outlined" className={classes.formControl}>
          <InputLabel id="pose-select-label">Select Yoga Pose</InputLabel>
          <Select
            labelId="pose-select-label"
            id="pose-select"
            value={selectedPose}
            onChange={handlePoseChange}
            label="Select Yoga Pose"
          >
            <MenuItem value=""><em>Select a pose</em></MenuItem>
            {availablePoses.map((pose) => (
              <MenuItem key={pose} value={pose}>
                {pose.charAt(0).toUpperCase() + pose.slice(1)}
                {!poseReferences[pose] && " (No reference)"}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button
          variant="contained"
          color={isDetecting ? "secondary" : "primary"}
          className={`${classes.actionButton} ${isDetecting ? classes.buttonStop : classes.buttonStart}`}
          startIcon={isDetecting ? <CloseIcon /> : <CameraIcon />}
          onClick={toggleDetection}
        >
          {isDetecting ? "Stop Detection" : "Start Detection"}
        </Button>
        
        <Button
          variant="contained"
          className={`${classes.actionButton} ${classes.buttonSave}`}
          startIcon={<Save />}
          onClick={saveReference}
        >
          Save as Reference
        </Button>
      </Box>
      
      {feedback && (
        <Fade in={!!feedback}>
          <Box className={classes.feedbackContainer}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Typography variant="h6" className={classes.scoreLabel}>
                  Your Score
                </Typography>
                <Typography className={classes.scoreValue}>
                  {Math.round(feedback.feedback.score)}%
                </Typography>
                <Box mt={2} width="100%">
                  <LinearProgress 
                    variant="determinate" 
                    value={feedback.feedback.score} 
                    color={
                      feedback.feedback.score >= 80 ? "primary" : 
                      feedback.feedback.score >= 60 ? "secondary" : "secondary"
                    }
                    style={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={8}>
                <Typography variant="h6" gutterBottom>
                  {feedback.pose_name.charAt(0).toUpperCase() + feedback.pose_name.slice(1)} Pose
                </Typography>
                <Typography variant="body1" paragraph>
                  {feedback.feedback.summary}
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom>
                  Suggested Corrections:
                </Typography>
                
                {feedback.feedback.detailed_corrections && 
                 feedback.feedback.detailed_corrections.length > 0 ? (
                  feedback.feedback.detailed_corrections.map((correction, index) => (
                    <Box 
                      key={index}
                      className={`${classes.correctionItem} ${correction.includes('important') ? classes.criticalCorrection : ''}`}
                    >
                      <Typography variant="body2">
                        {correction}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body1">
                    Your pose looks great! Keep it up.
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        </Fade>
      )}
      
      <Typography variant="h4" gutterBottom style={{ marginTop: 40 }}>
        Available Yoga Poses
      </Typography>
      
      <Grid container spacing={3}>
        {availablePoses.map((pose) => (
          <Grid item xs={12} sm={6} md={4} key={pose}>
            <Card className={classes.poseCard}>
              <CardMedia
                className={classes.poseCardMedia}
                image={YOGA_POSES_INFO[pose] ? YOGA_POSES_INFO[pose].image : 'https://source.unsplash.com/random'}
                title={pose}
              >
                <Chip
                  className={classes.poseStatus}
                  size="small"
                  label={
                    poseReferences[pose] ? "Reference Available" : "No Reference"
                  }
                  color={poseReferences[pose] ? "primary" : "default"}
                />
              </CardMedia>
              <CardContent className={classes.poseCardContent}>
                <Typography variant="h6" gutterBottom>
                  {pose.charAt(0).toUpperCase() + pose.slice(1)}
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {YOGA_POSES_INFO[pose] ? YOGA_POSES_INFO[pose].description : 
                   "Practice this pose to improve flexibility and strength."}
                </Typography>
                <Chip
                  className={classes.chip}
                  size="small"
                  label={YOGA_POSES_INFO[pose] ? YOGA_POSES_INFO[pose].difficulty : "Intermediate"}
                  color="primary"
                  variant="outlined"
                />
                <Box mt="auto" pt={2}>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    fullWidth
                    endIcon={<ArrowForward />}
                    onClick={() => {
                      setSelectedPose(pose);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Practice This Pose
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default YogaPage; 