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
  Grow,
  Chip,
  Divider
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { HomeWork, ArrowBack, Star, StarHalf, StarBorder } from '@material-ui/icons';

// API base URL
const API_URL = 'http://localhost:5000';

// Custom styles for enhanced visual effects
const useStyles = makeStyles((theme) => ({
  heroSection: {
    backgroundImage: 'linear-gradient(to right, #5c6bc0, #3f51b5)',
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
  actionButton: {
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
    },
  },
  chip: {
    margin: theme.spacing(0.5),
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.05)',
    },
  },
  difficultyRating: {
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing(1),
  },
  backButton: {
    marginBottom: theme.spacing(3),
  }
}));

// Home workout exercises with detailed information
const homeWorkouts = [
  { 
    id: 1,
    name: "Push-ups", 
    description: "A bodyweight exercise that works the chest, shoulders, and triceps. Push-ups develop upper body strength and endurance.",
    longDescription: "Push-ups are a classic bodyweight exercise that target multiple muscle groups simultaneously. They primarily work your chest (pectorals), shoulders (deltoids), and arms (triceps), while also engaging your core for stability. Regular push-ups can improve upper body strength, posture, and even help with everyday functional movements.",
    image: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    difficulty: 2, 
    muscleGroups: ["Chest", "Shoulders", "Triceps", "Core"],
    benefits: ["Builds upper body strength", "Improves posture", "Engages multiple muscle groups", "No equipment needed"],
    steps: [
      "Start in a plank position with hands slightly wider than shoulder-width apart",
      "Keep your body in a straight line from head to heels",
      "Lower your body until your chest nearly touches the floor",
      "Push back up to the starting position",
      "Repeat for the desired number of repetitions"
    ]
  },
  { 
    id: 2,
    name: "Plank", 
    description: "An isometric core exercise that improves stability and core strength. Great for beginners and advanced athletes alike.",
    longDescription: "The plank is a foundational isometric exercise that primarily targets your core muscles. Unlike dynamic exercises, planks require you to hold a position for a period of time, creating tension in your muscles without movement. This exercise strengthens your entire core, including your abdominals, obliques, and lower back, while also engaging your shoulders, chest, and quadriceps.",
    image: "https://images.unsplash.com/photo-1566241142659-2d2372e3a4a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    difficulty: 1,
    muscleGroups: ["Core", "Shoulders", "Back", "Glutes"],
    benefits: ["Strengthens core muscles", "Improves posture", "Reduces risk of back pain", "Increases stability"],
    steps: [
      "Start in a forearm position with elbows directly under shoulders",
      "Keep your body in a straight line from head to heels",
      "Engage your core and glutes",
      "Hold the position for as long as possible",
      "Start with 20-30 second holds and gradually increase"
    ]
  },
  { 
    id: 3,
    name: "Squats", 
    description: "A compound exercise that primarily works the quadriceps, glutes, and hamstrings. Essential for lower body strength.",
    longDescription: "Squats are often referred to as the king of leg exercises. This compound movement targets nearly every muscle in your lower body, including your quadriceps, hamstrings, and glutes. Beyond building leg strength and muscle, squats also improve mobility in your hips and ankles while enhancing core stability. As a functional exercise, squats mimic movements we perform in daily life, making them essential for overall fitness.",
    image: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    difficulty: 1,
    muscleGroups: ["Quadriceps", "Glutes", "Hamstrings", "Core"],
    benefits: ["Builds lower body strength", "Improves mobility", "Burns calories efficiently", "Functional movement pattern"],
    steps: [
      "Stand with feet shoulder-width apart",
      "Keep chest up and back straight",
      "Lower your body as if sitting back in a chair",
      "Ensure knees track over toes, not caving inward",
      "Lower until thighs are parallel to the ground (or as low as comfortable)",
      "Push through heels to return to standing position"
    ]
  },
  { 
    id: 4,
    name: "Lunges", 
    description: "A unilateral exercise that works the quadriceps, hamstrings, and glutes. Great for improving balance and coordination.",
    longDescription: "Lunges are a single-leg exercise that train each side of your body independently, helping to correct muscle imbalances and improve coordination. They target your quadriceps, hamstrings, and glutes while also engaging your core for stability. Because lunges require balance, they help develop proprioception (awareness of body position) and can translate to better performance in sports and daily activities.",
    image: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    difficulty: 1,
    muscleGroups: ["Quadriceps", "Glutes", "Hamstrings", "Core"],
    benefits: ["Improves balance", "Corrects muscle imbalances", "Enhances coordination", "Builds unilateral strength"],
    steps: [
      "Stand with feet hip-width apart",
      "Take a step forward with one leg",
      "Lower your body until both knees form approximately 90-degree angles",
      "Keep front knee aligned with ankle",
      "Push through the front heel to return to starting position",
      "Repeat with the other leg"
    ]
  },
  { 
    id: 5,
    name: "Mountain Climbers", 
    description: "A dynamic exercise that combines cardio and strength training. Works the core, shoulders, and legs.",
    longDescription: "Mountain climbers are a high-intensity, full-body exercise that combines elements of cardio and strength training. The movement primarily engages your core muscles, but also works your shoulders, chest, and legs. The rapid pace makes this exercise excellent for increasing your heart rate and burning calories, while the plank position maintains constant tension on your core muscles.",
    image: "https://images.unsplash.com/photo-1581009137042-c552e485697a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    difficulty: 2,
    muscleGroups: ["Core", "Shoulders", "Chest", "Quadriceps"],
    benefits: ["Combines cardio and strength", "Burns calories efficiently", "Improves coordination", "Enhances core stability"],
    steps: [
      "Start in a plank position with hands directly under shoulders",
      "Keep your body in a straight line from head to heels",
      "Drive one knee toward your chest",
      "Quickly switch legs, bringing the other knee forward",
      "Continue alternating legs at a rapid pace",
      "Maintain a tight core throughout the movement"
    ]
  },
  { 
    id: 6,
    name: "Burpees", 
    description: "A full-body exercise that combines a squat, plank, push-up, and jump. Great for building endurance and burning calories.",
    longDescription: "Burpees are often considered one of the most challenging bodyweight exercises because they require strength, coordination, and cardiovascular endurance. This full-body movement combines multiple exercises—a squat, plank, push-up, and jump—into one fluid sequence. Burpees elevate your heart rate quickly, making them extremely effective for burning calories and improving cardiovascular fitness in a short amount of time.",
    image: "https://images.unsplash.com/photo-1593476123526-61c458075a8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    difficulty: 3,
    muscleGroups: ["Full Body", "Core", "Chest", "Legs"],
    benefits: ["Maximizes calorie burn", "Improves cardiovascular fitness", "Builds full-body strength", "Enhances explosiveness"],
    steps: [
      "Stand with feet shoulder-width apart",
      "Lower into a squat position and place hands on the floor",
      "Kick feet back into a plank position",
      "Perform a push-up (optional for added difficulty)",
      "Jump feet back toward hands",
      "Explosively jump up with arms overhead",
      "Land softly and immediately begin the next repetition"
    ]
  }
];

// Function to render difficulty stars
const DifficultyStars = ({ level }) => {
  const classes = useStyles();
  return (
    <div className={classes.difficultyRating}>
      <Typography variant="body2" color="textSecondary" style={{ marginRight: '8px' }}>
        Difficulty:
      </Typography>
      {[...Array(3)].map((_, index) => {
        if (index < Math.floor(level)) {
          return <Star key={index} fontSize="small" color="primary" />;
        } else if (index < level && level % 1 !== 0) {
          return <StarHalf key={index} fontSize="small" color="primary" />;
        } else {
          return <StarBorder key={index} fontSize="small" color="primary" />;
        }
      })}
    </div>
  );
};

function HomeWorkoutsPage() {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  if (loading) {
    return (
      <Container maxWidth="lg" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Typography variant="h6" color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
      <Button 
        component={Link} 
        to="/" 
        startIcon={<ArrowBack />} 
        variant="outlined" 
        color="primary"
        className={classes.backButton}
      >
        Back to Home
      </Button>
      
      {/* Hero Section */}
      <Box className={classes.heroSection}>
        <Typography variant="h3" component="h1" gutterBottom>
          <HomeWork style={{ marginRight: '10px', verticalAlign: 'middle' }} />
          Home Workouts
        </Typography>
        <Typography variant="h6" paragraph style={{ maxWidth: '70%' }}>
          No equipment needed - exercises you can do anywhere. Perfect for beginners and those working out at home.
        </Typography>
      </Box>
      
      {/* Workout List */}
      <Box mb={4}>
        <Typography variant="h4" component="h2" gutterBottom className={classes.categoryTitle}>
          Available Home Workouts
        </Typography>
        <Typography variant="body1" paragraph color="textSecondary">
          Explore these equipment-free exercises designed for all fitness levels. Each workout includes detailed instructions and benefits.
        </Typography>
      </Box>
      
      <Grid container spacing={4}>
        {homeWorkouts.map((workout, index) => (
          <Grow in={true} key={workout.id} timeout={(index + 1) * 200}>
            <Grid item xs={12} sm={6} md={4}>
              <Card className={classes.exerciseCard}>
                <CardActionArea component={Link} to={`/exercise/${workout.name}`}>
                  <CardMedia
                    className={classes.cardMedia}
                    image={workout.image}
                    title={workout.name}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="h2">
                      {workout.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {workout.description}
                    </Typography>
                    
                    <DifficultyStars level={workout.difficulty} />
                    
                    <Box mt={2}>
                      {workout.muscleGroups.map((muscle) => (
                        <Chip 
                          key={muscle} 
                          label={muscle} 
                          size="small" 
                          className={classes.chip} 
                          color="primary" 
                          variant="outlined" 
                        />
                      ))}
                    </Box>
                    
                    <Divider style={{ margin: '16px 0' }} />
                    
                    <Typography variant="body2" paragraph>
                      <strong>Benefits:</strong> {workout.benefits[0]}, {workout.benefits[1]}, and more...
                    </Typography>
                    
                    <Button 
                      variant="contained" 
                      color="primary" 
                      fullWidth
                      component={Link}
                      to={`/exercise/${workout.name}`}
                      className={classes.actionButton}
                    >
                      Start Workout
                    </Button>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          </Grow>
        ))}
      </Grid>
    </Container>
  );
}

export default HomeWorkoutsPage; 