import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Button,
  Box,
  Paper,
  Divider,
  CircularProgress,
  Fade,
  Grow,
  Chip
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FitnessCenter, SportsHandball, ArrowBack, Star, StarHalf, StarBorder } from '@material-ui/icons';

// API base URL
const API_URL = 'http://localhost:5000';

// Custom styles for enhanced visual effects
const useStyles = makeStyles((theme) => ({
  heroSection: {
    backgroundImage: 'linear-gradient(to right, #ff9800, #f57c00)',
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
      backgroundColor: theme.palette.secondary.main,
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

// Gym workout exercises with detailed information
const gymWorkouts = [
  { 
    id: 1,
    name: "Bench Press", 
    description: "A compound exercise that primarily targets the chest, shoulders, and triceps. Essential for building upper body strength.",
    longDescription: "The bench press is a staple compound movement in strength training that primarily targets the pectoral muscles (chest), with significant involvement from the anterior deltoids (front shoulders) and triceps. It's one of the most popular exercises for developing upper body pushing strength and muscle mass. The bench press is one of the three lifts in powerlifting competitions, along with the squat and deadlift.",
    image: "https://images.unsplash.com/photo-1534368786749-b63e05c90863?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    difficulty: 2, 
    muscleGroups: ["Chest", "Shoulders", "Triceps"],
    benefits: ["Builds upper body strength", "Increases chest muscle mass", "Improves pushing power", "Enhances bench press performance"],
    equipment: ["Barbell", "Bench", "Weight plates", "Safety racks"],
    steps: [
      "Lie on a flat bench with your feet firmly on the ground",
      "Grip the barbell slightly wider than shoulder-width apart",
      "Unrack the barbell and position it over your chest with arms fully extended",
      "Lower the barbell in a controlled manner to mid-chest",
      "Press the barbell back up to the starting position",
      "Repeat for the desired number of repetitions"
    ]
  },
  { 
    id: 2,
    name: "Deadlift", 
    description: "A compound exercise that works nearly every major muscle group. One of the most effective exercises for building overall strength.",
    longDescription: "The deadlift is considered one of the most complete full-body exercises, engaging multiple muscle groups simultaneously. It primarily targets the posterior chain—the hamstrings, glutes, lower back, and traps—while also requiring significant involvement from the core, forearms, and quadriceps. As a functional movement pattern, the deadlift mimics the everyday action of picking objects up from the ground, making it valuable for both athletic performance and daily life.",
    image: "https://images.unsplash.com/photo-1598268030450-7d214bcc240b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    difficulty: 3,
    muscleGroups: ["Lower Back", "Glutes", "Hamstrings", "Traps", "Forearms"],
    benefits: ["Develops overall strength", "Improves posture", "Enhances grip strength", "Builds posterior chain"],
    equipment: ["Barbell", "Weight plates"],
    steps: [
      "Stand with feet hip-width apart, toes under the barbell",
      "Bend at the hips and knees, grip the barbell just outside your legs",
      "Keeping your back flat and chest up, drive through your heels",
      "Extend your hips and knees to stand up with the weight",
      "Keep the barbell close to your body throughout the movement",
      "Return the weight to the floor by hinging at the hips first, then bending the knees"
    ]
  },
  { 
    id: 3,
    name: "Barbell Squat", 
    description: "A fundamental compound exercise for lower body development. Strengthens the quadriceps, hamstrings, and glutes.",
    longDescription: "Often called the king of all exercises, the barbell squat is a compound movement that targets the entire lower body while also engaging the core and back muscles for stability. It primarily works the quadriceps, hamstrings, and glutes, but also strengthens the lower back, core, and even the calves to a degree. Regular squat training can improve athletic performance, increase lower body strength and size, and enhance overall functional fitness.",
    image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    difficulty: 3,
    muscleGroups: ["Quadriceps", "Glutes", "Hamstrings", "Core", "Lower Back"],
    benefits: ["Builds lower body strength", "Increases leg muscle mass", "Boosts hormone production", "Improves core stability"],
    equipment: ["Barbell", "Weight plates", "Squat rack"],
    steps: [
      "Position the barbell on your upper back, across your trapezius muscles",
      "Stand with feet shoulder-width apart or slightly wider",
      "Brace your core and maintain a neutral spine",
      "Bend at the knees and hips to lower your body",
      "Lower until thighs are parallel to the floor (or as low as mobility allows)",
      "Drive through your heels to return to the starting position"
    ]
  },
  { 
    id: 4,
    name: "Lat Pulldown", 
    description: "An isolation exercise that targets the latissimus dorsi (lats). Great for building a wider back and improving pulling strength.",
    longDescription: "The lat pulldown is a machine-based exercise that primarily targets the latissimus dorsi (lats), the large muscles of the back that give the torso a V-shape. This exercise also engages the biceps, forearms, and rear deltoids as secondary muscle groups. The lat pulldown is an excellent option for those working toward pull-ups and chin-ups, as it trains similar movement patterns with adjustable resistance.",
    image: "https://images.unsplash.com/photo-1544033527-b192daee1f5b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    difficulty: 1,
    muscleGroups: ["Lats", "Biceps", "Rhomboids", "Rear Deltoids"],
    benefits: ["Builds back width", "Improves pulling strength", "Develops better posture", "Prepares for pull-ups"],
    equipment: ["Lat pulldown machine", "Cable attachment (bar or handles)"],
    steps: [
      "Sit at the lat pulldown machine with knees secured under the pad",
      "Grip the bar wider than shoulder-width apart",
      "Sit upright with chest out and shoulders back",
      "Pull the bar down toward your upper chest",
      "Squeeze your shoulder blades together at the bottom",
      "Slowly return the bar to the starting position with control"
    ]
  },
  { 
    id: 5,
    name: "Dumbbell Shoulder Press", 
    description: "A compound exercise that primarily targets the shoulders and triceps. Essential for building strong, well-rounded shoulders.",
    longDescription: "The dumbbell shoulder press is a key exercise for developing the deltoid muscles (shoulders) and triceps. Using dumbbells instead of a barbell allows for a greater range of motion and helps correct strength imbalances between the left and right sides. This exercise builds both strength and size in the shoulders while also improving overhead pressing power, which has functional carryover to many daily activities and sports.",
    image: "https://images.unsplash.com/photo-1585152968992-d2b9444408cc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    difficulty: 2,
    muscleGroups: ["Shoulders", "Triceps", "Upper Chest", "Traps"],
    benefits: ["Builds shoulder strength", "Corrects muscle imbalances", "Improves overhead stability", "Develops well-rounded delts"],
    equipment: ["Dumbbells", "Bench (optional)"],
    steps: [
      "Sit or stand with a dumbbell in each hand at shoulder height",
      "Position elbows at approximately 90 degrees",
      "Press the dumbbells upward until arms are fully extended",
      "Briefly pause at the top of the movement",
      "Lower the dumbbells back to the starting position with control",
      "Repeat for the desired number of repetitions"
    ]
  },
  { 
    id: 6,
    name: "Leg Press", 
    description: "A machine-based compound exercise that targets the quadriceps, hamstrings, and glutes. Alternative to squats for lower body development.",
    longDescription: "The leg press is a machine-based exercise that primarily targets the quadriceps, with secondary emphasis on the hamstrings and glutes. It's often used as an alternative or complement to squats, especially for those with back issues, as it allows for heavy lower body training without loading the spine. The leg press machine supports your back and core, enabling you to focus solely on pushing with your legs.",
    image: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    difficulty: 2,
    muscleGroups: ["Quadriceps", "Glutes", "Hamstrings", "Calves"],
    benefits: ["Builds leg strength", "Allows heavy training with reduced back stress", "Targets specific leg muscles", "Suitable for rehabilitation"],
    equipment: ["Leg press machine"],
    steps: [
      "Sit in the leg press machine with your back against the pad",
      "Place feet on the platform at shoulder-width apart",
      "Release the safety catches and lower the platform",
      "Bend your knees until they reach about 90 degrees",
      "Press through your heels to extend your legs (without locking knees)",
      "Control the weight as you return to the starting position"
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
          return <Star key={index} fontSize="small" color="secondary" />;
        } else if (index < level && level % 1 !== 0) {
          return <StarHalf key={index} fontSize="small" color="secondary" />;
        } else {
          return <StarBorder key={index} fontSize="small" color="secondary" />;
        }
      })}
    </div>
  );
};

function GymWorkoutsPage() {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  if (loading) {
    return (
      <Container maxWidth="lg" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress color="secondary" />
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
        color="secondary"
        className={classes.backButton}
      >
        Back to Home
      </Button>
      
      {/* Hero Section */}
      <Box className={classes.heroSection}>
        <Typography variant="h3" component="h1" gutterBottom>
          <SportsHandball style={{ marginRight: '10px', verticalAlign: 'middle' }} />
          Gym Workouts
        </Typography>
        <Typography variant="h6" paragraph style={{ maxWidth: '70%' }}>
          Equipment-based exercises designed to maximize your strength gains and muscle development at the gym.
        </Typography>
      </Box>
      
      {/* Workout List */}
      <Box mb={4}>
        <Typography variant="h4" component="h2" gutterBottom className={classes.categoryTitle}>
          Available Gym Workouts
        </Typography>
        <Typography variant="body1" paragraph color="textSecondary">
          Explore these equipment-based exercises designed for gym settings. Each workout includes detailed instructions and equipment requirements.
        </Typography>
      </Box>
      
      <Grid container spacing={4}>
        {gymWorkouts.map((workout, index) => (
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
                          color="secondary" 
                          variant="outlined" 
                        />
                      ))}
                    </Box>
                    
                    <Divider style={{ margin: '16px 0' }} />
                    
                    <Typography variant="body2" paragraph>
                      <strong>Equipment:</strong> {workout.equipment.slice(0, 2).join(', ')}
                      {workout.equipment.length > 2 ? ', and more...' : ''}
                    </Typography>
                    
                    <Button 
                      variant="contained" 
                      color="secondary" 
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

export default GymWorkoutsPage; 