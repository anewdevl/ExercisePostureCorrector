import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button, Typography, Paper, List, ListItem, ListItemIcon, ListItemText, Box, Container, Grid } from '@material-ui/core';
import { CheckCircle, Error, ArrowBack, Videocam, Warning, SettingsApplications, Computer } from '@material-ui/icons';

const CameraTestPage = () => {
  const videoRef = useRef(null);
  const [cameraStatus, setCameraStatus] = useState('loading');
  const [errorDetails, setErrorDetails] = useState(null);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [testResults, setTestResults] = useState({
    permissionGranted: null,
    deviceFound: null,
    streamActive: null,
    videoDisplaying: null
  });

  const collectSystemInfo = useCallback(() => {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      browserName: getBrowserName(),
      isHttps: window.location.protocol === 'https:',
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    };
    setSystemInfo(info);
  }, []);

  const getBrowserName = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf("Chrome") > -1) return "Chrome";
    if (userAgent.indexOf("Safari") > -1) return "Safari";
    if (userAgent.indexOf("Firefox") > -1) return "Firefox";
    if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) return "Internet Explorer";
    if (userAgent.indexOf("Edge") > -1) return "Edge";
    return "Unknown";
  };

  const testCameraAccess = useCallback(async () => {
    setCameraStatus('loading');
    setErrorDetails(null);
    
    // Reset test results
    setTestResults({
      permissionGranted: null,
      deviceFound: null,
      streamActive: null,
      videoDisplaying: null
    });

    try {
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MEDIA_DEVICES_NOT_SUPPORTED');
      }
      
      // Step 1: Get permission to access media devices
      await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      setTestResults(prev => ({ ...prev, permissionGranted: true }));

      // Step 2: Enumerate devices to check camera availability
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameraDevices(videoDevices);
      
      if (videoDevices.length === 0) {
        throw new Error('NO_CAMERA_DEVICE');
      }
      setTestResults(prev => ({ ...prev, deviceFound: true }));

      // Step 3: Access specific camera if selected, otherwise use default
      const constraints = {
        audio: false,
        video: selectedDevice ? { deviceId: { exact: selectedDevice } } : true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setTestResults(prev => ({ ...prev, streamActive: true }));
      
      // Step 4: Connect stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
            .then(() => {
              setCameraStatus('active');
              setTestResults(prev => ({ ...prev, videoDisplaying: true }));
            })
            .catch(err => {
              setErrorDetails({
                message: 'Failed to play video stream',
                errorName: err.name,
                errorMessage: err.message
              });
              setCameraStatus('error');
              setTestResults(prev => ({ ...prev, videoDisplaying: false }));
            });
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraStatus('error');
      let parsedError = parseError(err);
      setErrorDetails(parsedError);
      
      // Update specific test results based on error
      if (parsedError.errorType === 'permission') {
        setTestResults(prev => ({ ...prev, permissionGranted: false }));
      } else if (parsedError.errorType === 'device') {
        setTestResults(prev => ({ ...prev, deviceFound: false }));
      } else if (parsedError.errorType === 'stream') {
        setTestResults(prev => ({ ...prev, streamActive: false }));
      }
    }
  }, [selectedDevice, videoRef]);

  useEffect(() => {
    collectSystemInfo();
    testCameraAccess();
    
    // Cleanup function
    return () => {
      stopCamera();
    };
  }, [selectedDevice, collectSystemInfo, testCameraAccess]);

  const parseError = (err) => {
    const details = {
      message: 'An unknown error occurred',
      errorName: err.name || 'Unknown',
      errorMessage: err.message || 'No error details available',
      errorType: 'unknown'
    };

    // Custom error
    if (err.message === 'MEDIA_DEVICES_NOT_SUPPORTED') {
      details.message = 'Your browser doesn\'t support camera access';
      details.errorType = 'browser';
      return details;
    }

    if (err.message === 'NO_CAMERA_DEVICE') {
      details.message = 'No camera device was detected on your system';
      details.errorType = 'device';
      return details;
    }

    // Standard errors
    switch (err.name) {
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        details.message = 'No camera device was detected on your system';
        details.errorType = 'device';
        break;
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        details.message = 'Camera access permission was denied';
        details.errorType = 'permission';
        break;
      case 'NotReadableError':
      case 'TrackStartError':
        details.message = 'Camera is in use by another application';
        details.errorType = 'device';
        break;
      case 'OverconstrainedError':
        details.message = 'No camera matching the requested constraints was found';
        details.errorType = 'constraint';
        break;
      case 'TypeError':
        details.message = 'Improper constraints or invalid parameter';
        details.errorType = 'parameter';
        break;
      case 'AbortError':
        details.message = 'Camera access was aborted';
        details.errorType = 'abort';
        break;
      case 'NotSupportedError':
        details.message = 'The requested operation is not supported';
        details.errorType = 'support';
        break;
      case 'SecurityError':
        details.message = 'Camera access was blocked due to security reasons';
        details.errorType = 'security';
        break;
      default:
        details.message = 'Failed to access camera';
        details.errorType = 'unknown';
    }

    return details;
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const changeCamera = (deviceId) => {
    stopCamera();
    setSelectedDevice(deviceId);
  };

  const renderTroubleshooting = () => {
    if (!errorDetails) return null;

    const generalTips = [
      { 
        text: 'Refresh the page and try again', 
        icon: <Computer />,
        details: 'Sometimes a simple page refresh can clear temporary issues with the camera'
      },
      {
        text: 'Try using Google Chrome browser',
        icon: <Computer />,
        details: 'Chrome has better support for camera access than some other browsers'
      }
    ];

    let specificTips = [];

    switch (errorDetails.errorType) {
      case 'permission':
        specificTips = [
          {
            text: 'Check browser permissions',
            icon: <SettingsApplications />,
            details: 'Click the camera icon in your browser address bar and allow access'
          },
          {
            text: 'Check system camera permissions',
            icon: <SettingsApplications />,
            details: 'On Windows: Go to Settings > Privacy > Camera and enable camera access for your browser'
          }
        ];
        break;
      case 'device':
        specificTips = [
          {
            text: 'Check if camera is in use by another app',
            icon: <Warning />,
            details: 'Close applications that might be using your camera (like Zoom, Teams, Skype)'
          },
          {
            text: 'Check camera drivers',
            icon: <Computer />,
            details: 'Update your camera drivers or check Device Manager for issues with the camera device'
          },
          {
            text: 'Check physical camera connection',
            icon: <Videocam />,
            details: 'For external cameras, try reconnecting the USB cable or try a different USB port'
          }
        ];
        break;
      case 'browser':
        specificTips = [
          {
            text: 'Use a modern browser',
            icon: <Computer />,
            details: 'Try Chrome, Firefox, or Edge instead of Internet Explorer or older browsers'
          },
          {
            text: 'Update your browser',
            icon: <SettingsApplications />,
            details: 'Using the latest version ensures better compatibility with camera features'
          }
        ];
        break;
      default:
        specificTips = [
          {
            text: 'Restart your computer',
            icon: <Computer />,
            details: 'A system restart can resolve many camera-related issues'
          }
        ];
    }

    return (
      <Paper elevation={3} style={{ padding: 16, marginTop: 16, backgroundColor: '#fff9c4' }}>
        <Typography variant="h6" gutterBottom>
          <Warning style={{ marginRight: 8, verticalAlign: 'middle', color: '#ff9800' }} />
          Troubleshooting Steps
        </Typography>
        
        <Typography variant="subtitle1" gutterBottom style={{ fontWeight: 'bold' }}>
          Specific recommendations for this error:
        </Typography>
        <List dense>
          {specificTips.map((tip, index) => (
            <ListItem key={`specific-${index}`}>
              <ListItemIcon>{tip.icon}</ListItemIcon>
              <ListItemText 
                primary={tip.text}
                secondary={tip.details}
              />
            </ListItem>
          ))}
        </List>
        
        <Typography variant="subtitle1" gutterBottom style={{ fontWeight: 'bold', marginTop: 16 }}>
          General tips:
        </Typography>
        <List dense>
          {generalTips.map((tip, index) => (
            <ListItem key={`general-${index}`}>
              <ListItemIcon>{tip.icon}</ListItemIcon>
              <ListItemText 
                primary={tip.text}
                secondary={tip.details}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  };

  const renderTestResults = () => {
    return (
      <Paper elevation={3} style={{ padding: 16, marginTop: 16 }}>
        <Typography variant="h6" gutterBottom>Diagnostic Test Results</Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>
              {testResults.permissionGranted === null ? <Warning style={{ color: '#757575' }} /> :
               testResults.permissionGranted ? <CheckCircle style={{ color: 'green' }} /> : 
               <Error style={{ color: 'red' }} />}
            </ListItemIcon>
            <ListItemText 
              primary="Camera Permission" 
              secondary={
                testResults.permissionGranted === null ? "Not tested" :
                testResults.permissionGranted ? "Granted" : "Denied"
              }
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              {testResults.deviceFound === null ? <Warning style={{ color: '#757575' }} /> :
               testResults.deviceFound ? <CheckCircle style={{ color: 'green' }} /> : 
               <Error style={{ color: 'red' }} />}
            </ListItemIcon>
            <ListItemText 
              primary="Camera Device" 
              secondary={
                testResults.deviceFound === null ? "Not tested" :
                testResults.deviceFound ? `Found (${cameraDevices.length} device${cameraDevices.length !== 1 ? 's' : ''})` : "Not found"
              }
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              {testResults.streamActive === null ? <Warning style={{ color: '#757575' }} /> :
               testResults.streamActive ? <CheckCircle style={{ color: 'green' }} /> : 
               <Error style={{ color: 'red' }} />}
            </ListItemIcon>
            <ListItemText 
              primary="Camera Stream" 
              secondary={
                testResults.streamActive === null ? "Not tested" :
                testResults.streamActive ? "Active" : "Failed"
              }
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              {testResults.videoDisplaying === null ? <Warning style={{ color: '#757575' }} /> :
               testResults.videoDisplaying ? <CheckCircle style={{ color: 'green' }} /> : 
               <Error style={{ color: 'red' }} />}
            </ListItemIcon>
            <ListItemText 
              primary="Video Display" 
              secondary={
                testResults.videoDisplaying === null ? "Not tested" :
                testResults.videoDisplaying ? "Working" : "Failed"
              }
            />
          </ListItem>
        </List>
      </Paper>
    );
  };

  const renderSystemInfo = () => {
    if (!systemInfo) return null;
    
    return (
      <Paper elevation={3} style={{ padding: 16, marginTop: 16 }}>
        <Typography variant="h6" gutterBottom>System Information</Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="Browser" secondary={systemInfo.browserName} />
          </ListItem>
          <ListItem>
            <ListItemText primary="User Agent" secondary={systemInfo.userAgent} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Platform" secondary={systemInfo.platform} />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Connection Security" 
              secondary={systemInfo.isHttps ? "Secure (HTTPS)" : "Not Secure (HTTP)"} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Screen Resolution" 
              secondary={`${systemInfo.screenWidth} x ${systemInfo.screenHeight}`} 
            />
          </ListItem>
        </List>
      </Paper>
    );
  };

  return (
    <Container maxWidth="md" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <Paper elevation={3} style={{ padding: 24, marginBottom: 16 }}>
        <Typography variant="h4" gutterBottom style={{ display: 'flex', alignItems: 'center' }}>
          <Videocam style={{ marginRight: 8 }} /> Camera Diagnostic Tool
        </Typography>
        <Typography variant="body1" paragraph>
          This tool helps diagnose camera-related issues by testing your camera connection and providing troubleshooting steps.
        </Typography>
        
        <Box mb={3}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<ArrowBack />}
            >
              Back to Main Page
            </Button>
          </Link>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={2} 
              style={{ 
                height: 320, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                backgroundColor: '#f5f5f5',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {cameraStatus === 'loading' && (
                <Typography variant="body1">Loading camera...</Typography>
              )}
              
              {cameraStatus === 'error' && (
                <Box textAlign="center" p={2}>
                  <Error style={{ fontSize: 48, color: '#f44336', marginBottom: 16 }} />
                  <Typography variant="h6" gutterBottom color="error">
                    Camera Error
                  </Typography>
                  <Typography variant="body2">
                    {errorDetails?.message || 'Failed to access camera'}
                  </Typography>
                  {errorDetails?.errorName && (
                    <Typography variant="caption" display="block" color="textSecondary">
                      Error: {errorDetails.errorName} - {errorDetails.errorMessage}
                    </Typography>
                  )}
                </Box>
              )}
              
              <video 
                ref={videoRef} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  display: cameraStatus === 'active' ? 'block' : 'none'
                }} 
                autoPlay 
                playsInline
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={testCameraAccess}
              style={{ marginBottom: 16 }}
            >
              Run Camera Test
            </Button>
            
            {cameraDevices.length > 1 && (
              <Paper elevation={1} style={{ padding: 16, marginBottom: 16 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Available Cameras ({cameraDevices.length})
                </Typography>
                <List dense>
                  {cameraDevices.map((device, index) => (
                    <ListItem 
                      button 
                      key={device.deviceId}
                      onClick={() => changeCamera(device.deviceId)}
                      selected={selectedDevice === device.deviceId}
                    >
                      <ListItemIcon>
                        <Videocam />
                      </ListItemIcon>
                      <ListItemText 
                        primary={device.label || `Camera ${index + 1}`} 
                        secondary={selectedDevice === device.deviceId ? 'Currently selected' : 'Click to select'}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
            
            {renderTestResults()}
          </Grid>
        </Grid>
      </Paper>
      
      {cameraStatus === 'error' && renderTroubleshooting()}
      {renderSystemInfo()}
    </Container>
  );
};

export default CameraTestPage; 