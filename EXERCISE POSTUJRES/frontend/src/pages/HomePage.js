import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActionArea, 
  Button,
  Container,
  Box,
  Paper,
  CircularProgress,
  Tabs,
  Tab,
  Grow,
  Zoom,
  Fade
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { 
  FitnessCenterOutlined as Fitness, 
  HomeWork, 
  SportsHandball 
} from '@material-ui/icons';

// API base URL
const API_URL = 'http://localhost:5000';

// Custom styles for enhanced visual effects
const useStyles = makeStyles((theme) => ({
  exerciseCard: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-8px)',
      boxShadow: '0 12px 20px rgba(0, 0, 0, 0.2)',
    },
  },
  cardMedia: {
    paddingTop: '56.25%', // 16:9 aspect ratio
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.5s ease',
    '&:hover': {
      transform: 'scale(1.05)',
    },
  },
  categoryTitle: {
    position: 'relative',
    '&:after': {
      content: '""',
      position: 'absolute',
      bottom: -8,
      left: 0,
      width: 60,
      height: 4,
      backgroundColor: theme.palette.primary.main,
      borderRadius: 2,
    },
  },
  tabRoot: {
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      transform: 'scale(1.05)',
    },
  },
  welcomeSection: {
    backgroundImage: 'linear-gradient(to right, #0077c2, #42a5f5)',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(6, 4),
    color: '#fff',
    marginBottom: theme.spacing(4),
    position: 'relative',
    overflow: 'hidden',
    '&:before': {
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      width: '40%',
      height: '100%',
      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
      opacity: 0.6,
    },
  },
  actionButton: {
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
    },
  },
  root: {
    flexGrow: 1,
    padding: theme.spacing(3, 0),
    minHeight: 'calc(100vh - 64px)',
  },
  welcomeTitle: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    color: '#fff',
  },
  welcomeSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: theme.spacing(2),
  },
  statCard: {
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#1e1e1e',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(2),
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
    },
  },
  statIcon: {
    fontSize: 48,
    marginBottom: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: theme.palette.primary.main,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: 500,
  },
  categoryCard: {
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#1e1e1e',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-6px)',
      boxShadow: '0 12px 30px rgba(33, 150, 243, 0.2)',
    },
  },
  categoryContent: {
    height: '100%',
    padding: theme.spacing(3),
    display: 'flex',
    flexDirection: 'column',
  },
  categoryIcon: {
    fontSize: 56,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(2),
  },
  categoryDesc: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: theme.spacing(2),
    flex: 1,
  },
  tab: {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '1rem',
    minWidth: 120,
  },
  tabIcon: {
    marginRight: theme.spacing(1),
  },
  recentActivity: {
    padding: theme.spacing(3),
    borderRadius: 12,
    backgroundColor: '#1e1e1e',
    marginBottom: theme.spacing(3),
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    marginBottom: theme.spacing(3),
    position: 'relative',
    paddingBottom: theme.spacing(1),
    '&:after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.palette.primary.main,
    },
  },
  noActivity: {
    textAlign: 'center',
    padding: theme.spacing(4),
    color: 'rgba(255, 255, 255, 0.5)',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  }
}));

// Exercise list with categories, images and descriptions
const exercises = {
  home: [
    { 
      name: "Push-ups", 
      description: "A bodyweight exercise that works the chest, shoulders, and triceps.",
      image: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      difficulty: "Medium" 
    },
    { 
      name: "Plank", 
      description: "An isometric core exercise that improves stability and core strength.",
      image: "https://images.unsplash.com/photo-1566241142659-2d2372e3a4a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      difficulty: "Beginner" 
    },
    { 
      name: "Squats", 
      description: "A compound exercise that primarily works the quadriceps, glutes, and hamstrings.",
      image: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      difficulty: "Beginner" 
    },
    { 
      name: "Lunges", 
      description: "A unilateral exercise that works the quadriceps, hamstrings, and glutes.",
      image: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      difficulty: "Beginner" 
    },
  ],
  gym: [
    { 
      name: "Bicep Curls", 
      description: "Works the biceps muscles at the front of your upper arm.",
      image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      difficulty: "Beginner" 
    },
    { 
      name: "Deadlifts", 
      description: "A compound exercise that works multiple muscle groups including the back, glutes, and hamstrings.",
      image: "https://images.unsplash.com/photo-1598268030500-e5991bb989d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      difficulty: "Advanced" 
    },
    { 
      name: "Shoulder Press", 
      description: "An overhead press that targets the deltoid muscles in the shoulders.",
      image: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      difficulty: "Medium" 
    },
    { 
      name: "Pull-ups", 
      description: "A compound exercise that targets the back, shoulders, and arms.",
      image: "https://images.unsplash.com/photo-1598266663439-2056e6900339?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      difficulty: "Advanced" 
    },
    { 
      name: "Hammer Curls", 
      description: "A variation of bicep curls that also engages the brachialis and forearms.",
      image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      difficulty: "Medium" 
    },
  ]
};

function HomePage() {
  const classes = useStyles();
  const [mediapipeAvailable, setMediapipeAvailable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [animateCards, setAnimateCards] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalReps: 0,
    favoriteExercise: 'N/A',
    formAccuracy: 87
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Check if MediaPipe is available
    const checkMediaPipe = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/check_mediapipe`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("MediaPipe check response:", data);
        setMediapipeAvailable(data.available);
      } catch (error) {
        console.error('Error checking MediaPipe:', error);
        setMediapipeAvailable(false);
        setError('Could not connect to the server. Is the backend running?');
      } finally {
        setLoading(false);
        // Trigger card animation after loading
        setTimeout(() => setAnimateCards(true), 300);
      }
    };
    
    checkMediaPipe();
  }, []);

  useEffect(() => {
    // Normally you would fetch this data from the backend
    // For now, we're just using mock data
    setLoading(true);
    setTimeout(() => {
      setStats({
        totalWorkouts: 0,
        totalReps: 0,
        favoriteExercise: 'N/A',
        formAccuracy: 87
      });
      setRecentActivity([]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleTabChange = (event, newValue) => {
    setAnimateCards(false);
    setActiveTab(newValue);
    setTabValue(newValue);
    // Re-trigger animation when changing tabs
    setTimeout(() => setAnimateCards(true), 100);
  };

  if (loading) {
    return (
      <Container maxWidth="md" style={{ textAlign: 'center', padding: '100px 0' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" style={{ marginTop: '20px' }}>
          Connecting to fitness server...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Paper 
          style={{ 
            padding: '20px', 
            backgroundColor: '#ffebee', 
            margin: '20px 0'
          }}
        >
          <Typography variant="h5" gutterBottom>
            Connection Error
          </Typography>
          <Typography variant="body1" paragraph>
            {error}
          </Typography>
          <Typography variant="body2">
            Please make sure the Flask backend is running on http://localhost:5000
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.location.reload()}
            style={{ marginTop: '10px' }}
            className={classes.actionButton}
          >
            Try Again
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <div className={classes.root}>
      <Container>
        <Zoom in={true} timeout={800}>
          <Box className={classes.welcomeSection}>
            <Typography variant="h2" component="h1" gutterBottom className={classes.welcomeTitle}>
              AI Fitness Trainer
            </Typography>
            <Typography variant="h5" component="p" paragraph className={classes.welcomeSubtitle} style={{ maxWidth: '70%' }}>
              Real-time exercise tracking with posture detection and instant feedback
            </Typography>
            
            <Box mt={3} display="flex" flexWrap="wrap">
              <Button 
                variant="contained" 
                color="secondary" 
                size="large" 
                className={classes.actionButton}
                component={Link} 
                to="/camera_test"
                style={{ marginRight: '16px', marginBottom: '16px', backgroundColor: '#fff', color: '#0077c2' }}
                startIcon={<Fitness />}
              >
                Test Your Camera
              </Button>
              
              {!mediapipeAvailable && (
                <Button 
                  variant="outlined" 
                  size="large" 
                  className={classes.actionButton}
                  style={{ borderColor: '#fff', color: '#fff' }}
                  component={Link} 
                  to="/camera_test"
                >
                  Fix Camera Issues
                </Button>
              )}
            </Box>
          </Box>
        </Zoom>

        {mediapipeAvailable ? (
          <Paper 
            style={{ 
              padding: '10px', 
              backgroundColor: '#e8f5e9', 
              maxWidth: '600px', 
              margin: '0 auto 24px',
              borderLeft: '4px solid #4caf50'
            }}
          >
            <Typography variant="body1">
              <span role="img" aria-label="checkmark">✅</span> MediaPipe is available - full pose detection is enabled!
            </Typography>
          </Paper>
        ) : (
          <Paper 
            style={{ 
              padding: '16px', 
              backgroundColor: '#ffebee', 
              maxWidth: '600px', 
              margin: '0 auto 24px',
              borderLeft: '4px solid #f44336'
            }}
          >
            <Typography variant="body1" gutterBottom>
              <span role="img" aria-label="warning">⚠️</span> MediaPipe is not available. Camera will work but pose detection will be limited.
            </Typography>
            <Button 
              variant="contained" 
              color="secondary" 
              component={Link} 
              to="/camera_test"
              size="small"
              className={classes.actionButton}
            >
              Run Camera Diagnostic
            </Button>
          </Paper>
        )}

        <Box mb={4}>
          <Paper>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              indicatorColor="primary" 
              textColor="primary"
              centered
            >
              <Tab 
                label={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <HomeWork className={classes.tabIcon} />
                    Home Workouts
                  </div>
                } 
                className={classes.tab} 
              />
              <Tab 
                label={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Fitness className={classes.tabIcon} />
                    Gym Workouts
                  </div>
                } 
                className={classes.tab} 
              />
            </Tabs>
          </Paper>
        </Box>

        <Box p={3} mb={4}>
          <Typography variant="h4" component="h2" gutterBottom className={classes.categoryTitle}>
            {tabValue === 0 ? "Home Workouts - No Equipment Needed" : "Gym Workouts"}
          </Typography>
          <Typography variant="body1" paragraph color="textSecondary">
            {tabValue === 0 
              ? "Perfect for beginners and those working out at home. These exercises require minimal or no equipment."
              : "These exercises utilize gym equipment for maximum results. Suitable for all fitness levels."
            }
          </Typography>
          
          <Box display="flex" justifyContent="flex-end" mb={3}>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to={tabValue === 0 ? "/home-workouts" : "/gym-workouts"}
              className={classes.actionButton}
            >
              View All {tabValue === 0 ? "Home" : "Gym"} Workouts
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {(tabValue === 0 ? exercises.home : exercises.gym).map((exercise, index) => (
              <Grid item xs={12} sm={6} md={4} key={exercise.name}>
                <Grow 
                  in={animateCards} 
                  timeout={(index + 1) * 200}
                  style={{ transformOrigin: '0 0 0' }}
                >
                  <Card className={classes.exerciseCard}>
                    <CardActionArea 
                      component={Link} 
                      to={`/exercise/${encodeURIComponent(exercise.name)}`}
                      style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                    >
                      <CardMedia
                        className={classes.cardMedia}
                        image={exercise.image}
                        title={exercise.name}
                      />
                      <CardContent style={{ flexGrow: 1 }}>
                        <Typography gutterBottom variant="h5" component="h2">
                          {exercise.name}
                        </Typography>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Typography 
                            variant="caption" 
                            component="span" 
                            style={{ 
                              padding: '3px 8px', 
                              borderRadius: '4px', 
                              backgroundColor: exercise.difficulty === 'Beginner' 
                                ? '#e8f5e9' 
                                : exercise.difficulty === 'Medium' 
                                  ? '#fff3e0' 
                                  : '#ffebee',
                              color: exercise.difficulty === 'Beginner' 
                                ? '#2e7d32' 
                                : exercise.difficulty === 'Medium' 
                                  ? '#e65100' 
                                  : '#c62828',
                            }}
                          >
                            {exercise.difficulty}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary" component="p">
                          {exercise.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grow>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Welcome Section with User Stats */}
        <Box className={classes.welcomeSection}>
          <Typography variant="h4" className={classes.welcomeTitle}>
            Welcome, Kolikapogu
          </Typography>
          <Typography variant="subtitle1" className={classes.welcomeSubtitle}>
            Here's your AI-powered fitness overview and insights
          </Typography>
          
          <Grid container spacing={3} style={{ marginTop: 20 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper className={classes.statCard}>
                <Box display="flex" alignItems="center" flexDirection="column">
                  <Box display="flex" alignItems="center" justifyContent="center" 
                    bgcolor="rgba(33, 150, 243, 0.1)" 
                    width={80} height={80} borderRadius="50%" mb={2}>
                    <SportsHandball style={{ fontSize: 40, color: '#2196f3' }} />
                  </Box>
                  <Typography variant="h3" className={classes.statValue}>
                    {stats.totalWorkouts}
                  </Typography>
                  <Typography variant="body1" className={classes.statLabel}>
                    Total Workouts
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper className={classes.statCard}>
                <Box display="flex" alignItems="center" flexDirection="column">
                  <Box display="flex" alignItems="center" justifyContent="center" 
                    bgcolor="rgba(33, 150, 243, 0.1)" 
                    width={80} height={80} borderRadius="50%" mb={2}>
                    <Fitness style={{ fontSize: 40, color: '#2196f3' }} />
                  </Box>
                  <Typography variant="h3" className={classes.statValue}>
                    {stats.totalReps}
                  </Typography>
                  <Typography variant="body1" className={classes.statLabel}>
                    Total Repetitions
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper className={classes.statCard}>
                <Box display="flex" alignItems="center" flexDirection="column">
                  <Box display="flex" alignItems="center" justifyContent="center" 
                    bgcolor="rgba(33, 150, 243, 0.1)" 
                    width={80} height={80} borderRadius="50%" mb={2}>
                    <HomeWork style={{ fontSize: 40, color: '#2196f3' }} />
                  </Box>
                  <Typography variant="h3" className={classes.statValue}>
                    {stats.favoriteExercise}
                  </Typography>
                  <Typography variant="body1" className={classes.statLabel}>
                    Favorite Exercise
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper className={classes.statCard}>
                <Box position="relative" display="flex" alignItems="center" justifyContent="center" mb={1}>
                  <CircularProgress 
                    variant="determinate" 
                    value={stats.formAccuracy} 
                    size={90} 
                    thickness={4} 
                    style={{ color: '#4caf50' }} 
                  />
                  <Box
                    position="absolute"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Typography variant="h5" style={{ fontWeight: 'bold' }}>
                      {stats.formAccuracy}%
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body1" className={classes.statLabel}>
                  Form Accuracy
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        
        {/* Recent Activity */}
        <Box className={classes.recentActivity}>
          <Typography variant="h5" className={classes.sectionTitle}>
            Recent Activity
          </Typography>
          
          {loading ? (
            <Box className={classes.loadingContainer}>
              <CircularProgress />
            </Box>
          ) : recentActivity.length > 0 ? (
            <Grid container spacing={3}>
              {/* Activity items would go here */}
            </Grid>
          ) : (
            <Box className={classes.noActivity}>
              <Typography variant="body1" gutterBottom>
                No recent activities
              </Typography>
              <Typography variant="body2">
                Start tracking your workouts to see your activity here
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* Weekly Goals */}
        <Box className={classes.recentActivity} mb={4}>
          <Typography variant="h5" className={classes.sectionTitle}>
            Weekly Goals
          </Typography>
          
          <Box p={2} display="flex" alignItems="center">
            <Typography variant="body1" style={{ marginRight: 'auto' }}>
              4 Workouts Per Week
            </Typography>
            <Typography variant="body2" color="textSecondary">
              0/4
            </Typography>
          </Box>
        </Box>
        
        {/* Workout Categories */}
        <Paper style={{ marginBottom: 24, borderRadius: 12 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            centered
            style={{ marginBottom: 24 }}
          >
            <Tab 
              label={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <HomeWork className={classes.tabIcon} />
                  Home Workouts
                </div>
              } 
              className={classes.tab} 
            />
            <Tab 
              label={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Fitness className={classes.tabIcon} />
                  Gym Workouts
                </div>
              } 
              className={classes.tab} 
            />
          </Tabs>
          
          <Box p={3}>
            {tabValue === 0 ? (
              // Home Workouts Tab
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Card className={classes.categoryCard}>
                    <CardContent className={classes.categoryContent}>
                      <HomeWork className={classes.categoryIcon} />
                      <Typography variant="h5" className={classes.categoryTitle}>
                        Home Workouts
                      </Typography>
                      <Typography variant="body1" className={classes.categoryDesc}>
                        Simple bodyweight exercises you can do anywhere without special equipment. Perfect for beginners or when you can't make it to the gym.
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        className={classes.actionButton}
                        component={Link}
                        to="/home-workouts"
                      >
                        View Exercises
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              // Gym Workouts Tab
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Card className={classes.categoryCard}>
                    <CardContent className={classes.categoryContent}>
                      <Fitness className={classes.categoryIcon} />
                      <Typography variant="h5" className={classes.categoryTitle}>
                        Gym Workouts
                      </Typography>
                      <Typography variant="body1" className={classes.categoryDesc}>
                        Build strength and muscle with these equipment-based exercises that AI tracks to optimize results and prevent injury.
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        className={classes.actionButton}
                        component={Link}
                        to="/gym-workouts"
                      >
                        View Exercises
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        </Paper>
      </Container>
    </div>
  );
}

export default HomePage; 