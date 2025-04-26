import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  CircularProgress,
  withStyles
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { BarChart, Assessment, ArrowForward } from '@material-ui/icons';

const API_URL = 'http://localhost:5000';

// Custom styles for dark theme UI
const useStyles = makeStyles((theme) => ({
  root: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
    minHeight: 'calc(100vh - 64px)',
  },
  titleContainer: {
    marginBottom: theme.spacing(4),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#2196f3',
    fontWeight: 700,
    position: 'relative',
    paddingBottom: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
    '&:after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: 60,
      height: 4,
      backgroundColor: '#2196f3',
      borderRadius: 2,
    },
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(3),
  },
  tableContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
  },
  table: {
    minWidth: 650,
  },
  tableHeader: {
    backgroundColor: '#2196f3',
  },
  headerCell: {
    color: 'white',
    fontWeight: 600,
    textTransform: 'uppercase',
    fontSize: '0.9rem',
    letterSpacing: 1,
  },
  tableRow: {
    transition: 'background-color 0.3s',
    '&:nth-of-type(odd)': {
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    '&:hover': {
      backgroundColor: 'rgba(33, 150, 243, 0.08)',
    },
  },
  tableCell: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  noDataContainer: {
    textAlign: 'center',
    padding: theme.spacing(6),
  },
  noDataIcon: {
    fontSize: 64,
    color: 'rgba(255, 255, 255, 0.2)',
    marginBottom: theme.spacing(2),
  },
  analyzeButton: {
    textTransform: 'none',
    fontWeight: 500,
    borderRadius: 20,
    color: '#2196f3',
    '&:hover': {
      backgroundColor: 'rgba(33, 150, 243, 0.08)',
    }
  },
  chartIcon: {
    fontSize: 20,
    marginRight: theme.spacing(0.5),
  },
  dateCell: {
    width: '30%',
  },
  exerciseCell: {
    width: '25%',
  },
  performanceCell: {
    width: '20%',
  },
  actionCell: {
    width: '15%',
    textAlign: 'right',
  },
  weightCell: {
    width: '10%',
  }
}));

// Mock data for the history table
const mockWorkoutHistory = [
  { id: '56982353', date: '2025-04-05 19:17:01', exercise: 'Squats', performance: '85%', weight: null, exerciseId: '123' },
  { id: '48320112', date: '2025-04-05 19:16:41', exercise: 'Push Ups', performance: '90%', weight: null, exerciseId: '124' },
  { id: '34568423', date: '2025-04-05 19:08:54', exercise: 'Bicep Curl', performance: '78%', weight: '15kg', exerciseId: '125' },
  { id: '76943691', date: '2025-04-05 18:58:40', exercise: 'Shoulder Press', performance: '82%', weight: '20kg', exerciseId: '126' },
  { id: '09876543', date: '2025-04-05 17:00:17', exercise: 'Lunges', performance: '88%', weight: null, exerciseId: '127' },
  { id: '67895432', date: '2025-04-05 01:02:09', exercise: 'Sit Ups', performance: '95%', weight: null, exerciseId: '128' },
  { id: '18760954', date: '2025-04-05 16:32:20', exercise: 'Leg Press', performance: '80%', weight: '60kg', exerciseId: '129' },
];

function HistoryPage() {
  const classes = useStyles();
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Function to fetch workout history
    const fetchWorkoutHistory = async () => {
      setLoading(true);
      try {
        // In a real application, we would fetch from the API
        // const response = await fetch(`${API_URL}/api/history`, {
        //   credentials: 'include' // For cookies/session
        // });
        
        // if (!response.ok) {
        //   throw new Error('Failed to fetch workout history');
        // }
        
        // const data = await response.json();
        // setWorkoutHistory(data.history);
        
        // Using mock data for now
        setTimeout(() => {
          setWorkoutHistory(mockWorkoutHistory);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching workout history:', error);
        setError('Failed to load your workout history. Please try again later.');
        setLoading(false);
      }
    };

    fetchWorkoutHistory();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" className={classes.root}>
        <Box className={classes.loadingContainer}>
          <CircularProgress size={60} color="primary" />
          <Typography variant="body1" style={{ marginTop: 16, color: 'rgba(255, 255, 255, 0.7)' }}>
            Loading your workout history...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" className={classes.root}>
        <Box className={classes.noDataContainer}>
          <Typography variant="h6" color="error" gutterBottom>
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
      <Box className={classes.titleContainer}>
        <Box>
          <Typography variant="h4" component="h1" className={classes.title}>
            <BarChart style={{ marginRight: 12 }} /> Your Workout History
          </Typography>
          <Typography variant="subtitle1" className={classes.subtitle}>
            Track your progress over time
          </Typography>
        </Box>
      </Box>

      {workoutHistory.length === 0 ? (
        <Box className={classes.noDataContainer}>
          <Assessment className={classes.noDataIcon} />
          <Typography variant="h6" gutterBottom>
            No workout history found
          </Typography>
          <Typography variant="body1" style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: 16 }}>
            Complete some exercises to start building your workout history
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            to="/"
          >
            Start a Workout
          </Button>
        </Box>
      ) : (
        <TableContainer component={Paper} className={classes.tableContainer}>
          <Table className={classes.table} aria-label="workout history table">
            <TableHead className={classes.tableHeader}>
              <TableRow>
                <TableCell className={`${classes.headerCell} ${classes.dateCell}`}>Date</TableCell>
                <TableCell className={`${classes.headerCell} ${classes.exerciseCell}`}>Exercise</TableCell>
                <TableCell className={`${classes.headerCell} ${classes.performanceCell}`}>Performance</TableCell>
                <TableCell className={`${classes.headerCell} ${classes.weightCell}`}>Weight</TableCell>
                <TableCell className={`${classes.headerCell} ${classes.actionCell}`}>Analysis</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workoutHistory.map((workout) => (
                <TableRow key={workout.id} className={classes.tableRow}>
                  <TableCell className={`${classes.tableCell} ${classes.dateCell}`}>
                    {workout.date}
                  </TableCell>
                  <TableCell className={`${classes.tableCell} ${classes.exerciseCell}`}>
                    {workout.exercise}
                  </TableCell>
                  <TableCell className={`${classes.tableCell} ${classes.performanceCell}`}>
                    {workout.performance}
                  </TableCell>
                  <TableCell className={`${classes.tableCell} ${classes.weightCell}`}>
                    {workout.weight || '-'}
                  </TableCell>
                  <TableCell className={`${classes.tableCell} ${classes.actionCell}`}>
                    <Button
                      component={Link}
                      to={`/performance/${workout.exerciseId}`}
                      color="primary"
                      className={classes.analyzeButton}
                      endIcon={<ArrowForward />}
                    >
                      View Analysis
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}

export default HistoryPage; 