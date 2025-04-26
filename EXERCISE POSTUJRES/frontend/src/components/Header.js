import React, { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Hidden,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
} from "@material-ui/core"
import { makeStyles } from "@material-ui/core/styles"
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  FitnessCenter,
  History as HistoryIcon,
  Dashboard as DashboardIcon,
  ExitToApp as LogoutIcon,
  Person as ProfileIcon,
  Accessibility as YogaIcon,
} from "@material-ui/icons"

const useStyles = makeStyles((theme) => ({
  appBar: {
    backgroundColor: "#1a1a1a",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    zIndex: theme.zIndex.drawer + 1,
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    padding: theme.spacing(0, 2),
  },
  logo: {
    color: "#2196f3",
    fontSize: 22,
    marginRight: theme.spacing(1),
  },
  logoText: {
    fontWeight: 700,
    fontSize: "1.3rem",
    letterSpacing: 0.5,
    color: "#fff",
    textDecoration: "none",
    "&:hover": {
      textDecoration: "none",
    },
  },
  navButtons: {
    display: "flex",
    alignItems: "center",
  },
  navButton: {
    margin: theme.spacing(0, 1),
    borderRadius: 20,
    textTransform: "none",
    fontWeight: 500,
    padding: theme.spacing(0.5, 2),
    "&.active": {
      backgroundColor: "rgba(33, 150, 243, 0.1)",
      color: "#2196f3",
    },
  },
  mobileMenuButton: {
    marginRight: theme.spacing(1),
  },
  drawerPaper: {
    width: 240,
    backgroundColor: "#1e1e1e",
    boxShadow: "0 0 15px rgba(0, 0, 0, 0.2)",
  },
  drawerHeader: {
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
    color: "#ffffff",
  },
  drawerItem: {
    color: "rgba(255, 255, 255, 0.9)",
    transition: "background-color 0.3s",
    "&:hover": {
      backgroundColor: "rgba(33, 150, 243, 0.08)",
    },
    "&.active": {
      backgroundColor: "rgba(33, 150, 243, 0.1)",
      "& .MuiListItemIcon-root": {
        color: "#2196f3",
      },
      "& .MuiListItemText-primary": {
        fontWeight: 600,
        color: "#2196f3",
      },
    },
  },
  drawerIcon: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  drawerDivider: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
}))

function Header() {
  const classes = useStyles()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  const navigationItems = [
    { name: "Workouts", path: "/", icon: <HomeIcon /> },
    { name: "Yoga", path: "/yoga", icon: <YogaIcon /> },
    { name: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    { name: "History", path: "/history", icon: <HistoryIcon /> },
  ]

  const drawer = (
    <div>
      <Box className={classes.drawerHeader}>
        <FitnessCenter style={{ marginRight: 8 }} />
        <Typography variant="h6">AIFitTrack</Typography>
      </Box>
      <Divider className={classes.drawerDivider} />
      <List>
        {navigationItems.map((item) => (
          <ListItem
            button
            key={item.name}
            component={Link}
            to={item.path}
            className={`${classes.drawerItem} ${
              isActive(item.path) ? "active" : ""
            }`}
            onClick={() => setDrawerOpen(false)}
          >
            <ListItemIcon className={classes.drawerIcon}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.name} />
          </ListItem>
        ))}
      </List>
      <Divider className={classes.drawerDivider} />
      <List>
        <ListItem
          button
          component={Link}
          to="/profile"
          className={`${classes.drawerItem} ${
            isActive("/profile") ? "active" : ""
          }`}
          onClick={() => setDrawerOpen(false)}
        >
          <ListItemIcon className={classes.drawerIcon}>
            <ProfileIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItem>
      </List>
    </div>
  )

  return (
    <AppBar position="static" className={classes.appBar}>
      <Toolbar className={classes.toolbar}>
        <Box display="flex" alignItems="center">
          <Hidden mdUp>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setDrawerOpen(true)}
              className={classes.mobileMenuButton}
            >
              <MenuIcon />
            </IconButton>
          </Hidden>

          <Box
            display="flex"
            alignItems="center"
            component={Link}
            to="/"
            className={classes.logoText}
          >
            <FitnessCenter className={classes.logo} />
            AIFitTrack
          </Box>
        </Box>

        <Hidden smDown>
          <Box className={classes.navButtons}>
            {navigationItems.map((item) => (
              <Button
                key={item.name}
                component={Link}
                to={item.path}
                color="inherit"
                className={`${classes.navButton} ${
                  isActive(item.path) ? "active" : ""
                }`}
                startIcon={item.icon}
              >
                {item.name}
              </Button>
            ))}
          </Box>
        </Hidden>

        <Box>
          <Button
            color="inherit"
            className={classes.navButton}
            component={Link}
            to="/profile"
          >
            Profile
          </Button>
        </Box>

        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          classes={{
            paper: classes.drawerPaper,
          }}
        >
          {drawer}
        </Drawer>
      </Toolbar>
    </AppBar>
  )
}

export default Header
