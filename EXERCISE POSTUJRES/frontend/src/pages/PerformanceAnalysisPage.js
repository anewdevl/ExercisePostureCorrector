import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Box,
  Divider,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Timeline, Assessment, TrendingUp, FitnessCenter } from '@material-ui/icons';

const API_URL = 'http://localhost:5000';

const useStyles = makeStyles((theme) => ({
  root: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  title: {
    marginBottom: theme.spacing(4),
    position: 'relative',
    '&:after': {
      content: '""',
      position: 'absolute',
      bottom: -10,
      left: 0,
      width: 80,
      height: 4,
      backgroundColor: theme.palette.primary.main,
      borderRadius: 2,
    },
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)',
    },
  },
  cardHeader: {
    background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
    color: 'white',
    padding: theme.spacing(2),
    borderTopLeftRadius: theme.shape.borderRadius,
    borderTopRightRadius: theme.shape.borderRadius,
    display: 'flex',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: theme.spacing(1),
    fontSize: 24,
  },
  chartContainer: {
    height: 300,
    padding: theme.spacing(2),
  },
  summaryGrid: {
    marginBottom: theme.spacing(4),
  },
  metricValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: theme.palette.primary.main,
  },
  metricLabel: {
    color: theme.palette.text.secondary,
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
  },
}));

// Mock data for demonstration - would be replaced with actual API data
const mockPerformanceData = {
  exerciseName: "Squats",
  totalSessions: 12,
  totalReps: 324,
  averageScore: 87,
  improvementRate: 15,
  sessionHistory: [
    { date: "2023-06-01", score: 72, reps: 15, duration: 120 },
    { date: "2023-06-05", score: 75, reps: 18, duration: 130 },
    { date: "2023-06-10", score: 79, reps: 20, duration: 145 },
    { date: "2023-06-15", score: 80, reps: 22, duration: 150 },
    { date: "2023-06-20", score: 82, reps: 25, duration: 160 },
    { date: "2023-06-25", score: 85, reps: 25, duration: 155 },
    { date: "2023-06-30", score: 87, reps: 30, duration: 180 },
  ],
  repProgress: [
    { week: "Week 1", reps: 45 },
    { week: "Week 2", reps: 62 },
    { week: "Week 3", reps: 78 },
    { week: "Week 4", reps: 94 },
    { week: "Week 5", reps: 120 },
  ],
  formImprovement: [
    { month: "Jan", score: 65 },
    { month: "Feb", score: 68 },
    { month: "Mar", score: 72 },
    { month: "Apr", score: 77 },
    { month: "May", score: 82 },
    { month: "Jun", score: 87 },
  ],
};

function PerformanceAnalysisPage() {
  const classes = useStyles();
  const { exerciseId } = useParams();
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        // In a real app, we would fetch from API
        // const response = await fetch(`${API_URL}/api/performance/${exerciseId}`);
        // const data = await response.json();
        
        // Using mock data for now
        setTimeout(() => {
          setPerformanceData(mockPerformanceData);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching performance data:', error);
        setError('Failed to load performance data. Please try again later.');
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [exerciseId]);

  if (loading) {
    return (
      <Container className={classes.loadingContainer}>
        <CircularProgress size={60} />
        <Typography variant="h6" style={{ marginTop: 20 }}>
          Loading performance data...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className={classes.root}>
        <Paper elevation={3} style={{ padding: 24, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {error}
          </Typography>
          <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container className={classes.root}>
      <Typography variant="h4" className={classes.title} gutterBottom>
        Performance Analysis: {performanceData.exerciseName}
      </Typography>

      {/* Summary metrics */}
      <Grid container spacing={3} className={classes.summaryGrid}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.card}>
            <Box className={classes.cardHeader}>
              <FitnessCenter className={classes.cardIcon} />
              <Typography variant="h6">Total Sessions</Typography>
            </Box>
            <CardContent>
              <Typography variant="h3" className={classes.metricValue} align="center">
                {performanceData.totalSessions}
              </Typography>
              <Typography variant="body2" className={classes.metricLabel} align="center">
                completed workouts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.card}>
            <Box className={classes.cardHeader}>
              <Timeline className={classes.cardIcon} />
              <Typography variant="h6">Total Reps</Typography>
            </Box>
            <CardContent>
              <Typography variant="h3" className={classes.metricValue} align="center">
                {performanceData.totalReps}
              </Typography>
              <Typography variant="body2" className={classes.metricLabel} align="center">
                repetitions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.card}>
            <Box className={classes.cardHeader}>
              <Assessment className={classes.cardIcon} />
              <Typography variant="h6">Average Score</Typography>
            </Box>
            <CardContent>
              <Typography variant="h3" className={classes.metricValue} align="center">
                {performanceData.averageScore}%
              </Typography>
              <Typography variant="body2" className={classes.metricLabel} align="center">
                form quality
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className={classes.card}>
            <Box className={classes.cardHeader}>
              <TrendingUp className={classes.cardIcon} />
              <Typography variant="h6">Improvement</Typography>
            </Box>
            <CardContent>
              <Typography variant="h3" className={classes.metricValue} align="center">
                +{performanceData.improvementRate}%
              </Typography>
              <Typography variant="body2" className={classes.metricLabel} align="center">
                since first session
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Form score progress chart */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3}>
            <Box className={classes.cardHeader}>
              <Assessment className={classes.cardIcon} />
              <Typography variant="h6">Form Quality Progress</Typography>
            </Box>
            <Box className={classes.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={performanceData.formImprovement}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[50, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2196f3"
                    strokeWidth={2}
                    dot={{ stroke: '#2196f3', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Reps progress chart */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3}>
            <Box className={classes.cardHeader}>
              <Timeline className={classes.cardIcon} />
              <Typography variant="h6">Weekly Repetition Progress</Typography>
            </Box>
            <Box className={classes.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={performanceData.repProgress}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="reps"
                    fill="#4caf50"
                    radius={[4, 4, 0, 0]}
                    barSize={35}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Recent sessions */}
        <Grid item xs={12}>
          <Paper elevation={3}>
            <Box className={classes.cardHeader}>
              <FitnessCenter className={classes.cardIcon} />
              <Typography variant="h6">Recent Sessions History</Typography>
            </Box>
            <Box p={3}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Score</TableCell>
                    <TableCell align="right">Reps</TableCell>
                    <TableCell align="right">Duration (sec)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {performanceData.sessionHistory.map((session, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{session.date}</TableCell>
                      <TableCell align="right">{session.score}%</TableCell>
                      <TableCell align="right">{session.reps}</TableCell>
                      <TableCell align="right">{session.duration}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default PerformanceAnalysisPage; 