import React, { useState, useEffect } from "react"
import { Switch, Route, Redirect } from "react-router-dom"
import axios from "axios"
import {
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Paper,
  Typography,
  CircularProgress,
  Box,
  Button,
  Alert,
} from "@material-ui/core"
import Header from "./components/Header"

// Import our pages
import HomePage from "./pages/HomePage"
import ExercisePage from "./pages/ExercisePage"
import HistoryPage from "./pages/HistoryPage"
import ProfilePage from "./pages/ProfilePage"
import CameraTestPage from "./pages/CameraTestPage"
import HomeWorkoutsPage from "./pages/HomeWorkoutsPage"
import GymWorkoutsPage from "./pages/GymWorkoutsPage"
import PerformanceAnalysisPage from "./pages/PerformanceAnalysisPage"
import YogaPage from "./pages/YogaPage"

// API base URL - make sure this matches your backend
const API_URL = "http://localhost:5000"

// Configure Axios
axios.defaults.baseURL = API_URL
axios.defaults.headers.common["Content-Type"] = "application/json"
axios.defaults.headers.common["Access-Control-Allow-Origin"] = "*"
axios.defaults.withCredentials = true

// Create a theme
const theme = createTheme({
  palette: {
    type: "dark",
    primary: {
      main: "#2196f3",
    },
    secondary: {
      main: "#4caf50",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
    text: {
      primary: "#ffffff",
      secondary: "rgba(255, 255, 255, 0.7)",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 500,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 500,
    },
  },
  overrides: {
    MuiAppBar: {
      colorPrimary: {
        backgroundColor: "#1e1e1e",
      },
    },
    MuiPaper: {
      root: {
        backgroundColor: "#1e1e1e",
      },
    },
    MuiCard: {
      root: {
        backgroundColor: "#1e1e1e",
      },
    },
  },
})

function App() {
  const [serverRunning, setServerRunning] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if server is running
    const checkServer = async () => {
      try {
        setLoading(true)
        // Try several endpoints to check connection
        let success = false

        try {
          // Try the ping endpoint first
          const pingResponse = await fetch(`${API_URL}/api/ping`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            mode: "cors",
          })

          if (pingResponse.ok) {
            success = true
            console.log("Connected to server via /api/ping")
          }
        } catch (pingError) {
          console.error("Could not connect to /api/ping:", pingError)
          // Continue to next attempt
        }

        if (!success) {
          try {
            // Try the root endpoint
            const rootResponse = await fetch(`${API_URL}/`, {
              method: "GET",
              mode: "cors",
            })

            if (rootResponse.ok) {
              success = true
              console.log("Connected to server via root endpoint")
            }
          } catch (rootError) {
            console.error("Could not connect to root endpoint:", rootError)
            // Continue to next attempt
          }
        }

        if (!success) {
          try {
            // Try check-db endpoint as last resort
            const dbResponse = await fetch(`${API_URL}/api/check-db`, {
              method: "GET",
              mode: "cors",
            })

            if (dbResponse.ok) {
              success = true
              console.log("Connected to server via /api/check-db")
            }
          } catch (dbError) {
            console.error("Could not connect to /api/check-db:", dbError)
          }
        }

        setServerRunning(success)
      } catch (error) {
        console.error("General error checking server:", error)
        setServerRunning(false)
      } finally {
        setLoading(false)
      }
    }

    checkServer()
  }, [])

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <Box textAlign="center">
            <CircularProgress size={60} />
            <Typography variant="h6" style={{ marginTop: "20px" }}>
              Connecting to server...
            </Typography>
          </Box>
        </Container>
      </ThemeProvider>
    )
  }

  if (!serverRunning) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <Box textAlign="center" maxWidth="600px">
            <Typography variant="h4" color="error" gutterBottom>
              Connection Error
            </Typography>
            <Typography variant="body1" paragraph>
              Could not connect to the server. Is the backend running?
            </Typography>
            <Typography variant="body1" paragraph>
              Please make sure the Flask backend is running on
              http://localhost:5000
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.reload()}
              style={{ marginTop: "20px" }}
            >
              Retry Connection
            </Button>
          </Box>
        </Container>
      </ThemeProvider>
    )
  }

  // Simplified app content that uses Header component
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#121212",
        }}
      >
        <Header />

        <Container
          style={{ flex: 1, paddingTop: "20px", paddingBottom: "20px" }}
        >
          <Switch>
            {/* All routes are public */}
            <Route exact path="/" component={HomePage} />
            <Route path="/dashboard" component={ProfilePage} />
            <Route path="/home-workouts" component={HomeWorkoutsPage} />
            <Route path="/gym-workouts" component={GymWorkoutsPage} />
            <Route path="/yoga" component={YogaPage} />
            <Route path="/exercise/:name" component={ExercisePage} />
            <Route
              path="/performance/:exerciseId"
              component={PerformanceAnalysisPage}
            />
            <Route path="/history" component={HistoryPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/camera_test" component={CameraTestPage} />

            {/* Default redirect */}
            <Redirect to="/" />
          </Switch>
        </Container>

        <Paper
          style={{
            padding: "20px",
            marginTop: "auto",
            backgroundColor: "#1e1e1e",
            color: "rgba(255, 255, 255, 0.7)",
          }}
          component="footer"
          square
          variant="outlined"
        >
          <Typography variant="body2" align="center">
            © {new Date().getFullYear()} AIFitTrack. All rights reserved.
          </Typography>
        </Paper>
      </div>
    </ThemeProvider>
  )
}

export default App
