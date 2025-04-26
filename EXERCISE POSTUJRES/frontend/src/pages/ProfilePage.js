import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Typography,
  Container,
  Paper,
  TextField,
  Button,
  Grid,
  Box,
  CircularProgress,
  Snackbar,
  Divider
} from '@material-ui/core';
import { AccountCircle, Save } from '@material-ui/icons';

// API base URL
const API_URL = 'http://localhost:5000';

function ProfilePage() {
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    age: '',
    height: '',
    weight: ''
  });

  // Check authentication and load profile
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/api/check-auth`, {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (!data.authenticated) {
          setIsAuthenticated(false);
          setLoading(false);
          history.push('/login');
          return;
        }
        
        setIsAuthenticated(true);
        loadProfile();
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
        setLoading(false);
        history.push('/login');
      }
    };
    
    const loadProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/profile`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to load profile');
        }
        
        const contentType = response.headers.get('content-type');
        
        // Check if the response is JSON
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setProfile(data);
        } else {
          // If not JSON, it's likely an HTML login page (user not authenticated)
          setIsAuthenticated(false);
          history.push('/login');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setMessage('Error loading profile. Please try again.');
        setShowMessage(true);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [history]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(profile)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      setMessage('Profile updated successfully!');
      setShowMessage(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile. Please try again.');
      setShowMessage(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" style={{ textAlign: 'center', padding: '100px 0' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" style={{ marginTop: '20px' }}>
          Loading profile...
        </Typography>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md">
        <Paper style={{ padding: '20px', margin: '20px 0', textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Please log in to view your profile
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => history.push('/login')}
          >
            Go to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper style={{ padding: '24px', marginTop: '20px' }}>
        <Box display="flex" alignItems="center" mb={3}>
          <AccountCircle style={{ fontSize: 40, marginRight: '16px' }} />
          <Typography variant="h4" component="h1">
            Your Profile
          </Typography>
        </Box>
        
        <Divider style={{ margin: '16px 0' }} />
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={profile.username}
                disabled
                variant="outlined"
                helperText="Username cannot be changed"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={profile.email}
                disabled
                variant="outlined"
                helperText="Email cannot be changed"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="first_name"
                value={profile.first_name || ''}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="last_name"
                value={profile.last_name || ''}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Age"
                name="age"
                type="number"
                value={profile.age || ''}
                onChange={handleChange}
                variant="outlined"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Height (cm)"
                name="height"
                type="number"
                value={profile.height || ''}
                onChange={handleChange}
                variant="outlined"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Weight (kg)"
                name="weight"
                type="number"
                value={profile.weight || ''}
                onChange={handleChange}
                variant="outlined"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<Save />}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      <Snackbar
        open={showMessage}
        autoHideDuration={6000}
        onClose={() => setShowMessage(false)}
        message={message}
      />
    </Container>
  );
}

export default ProfilePage; 