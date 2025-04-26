import React from 'react';
import { Paper, Typography, Box } from '@material-ui/core';
import { 
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon 
} from '@material-ui/icons';

// Custom Alert component to replace Material-UI Lab's Alert component
const Alert = ({ children, severity = 'info', style = {}, ...props }) => {
  const getColor = () => {
    switch (severity) {
      case 'error':
        return { bg: '#ffebee', text: '#c62828', icon: <ErrorIcon style={{ color: '#c62828', marginRight: 8 }} /> };
      case 'warning':
        return { bg: '#fff8e1', text: '#e65100', icon: <WarningIcon style={{ color: '#e65100', marginRight: 8 }} /> };
      case 'success':
        return { bg: '#e8f5e9', text: '#2e7d32', icon: <CheckCircleIcon style={{ color: '#2e7d32', marginRight: 8 }} /> };
      case 'info':
      default:
        return { bg: '#e3f2fd', text: '#0d47a1', icon: <InfoIcon style={{ color: '#0d47a1', marginRight: 8 }} /> };
    }
  };

  const colors = getColor();

  return (
    <Paper 
      elevation={0}
      style={{ 
        backgroundColor: colors.bg, 
        color: colors.text,
        padding: '8px 16px',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        ...style
      }}
      {...props}
    >
      <Box display="flex" alignItems="center">
        {colors.icon}
        <Typography variant="body2">{children}</Typography>
      </Box>
    </Paper>
  );
};

export default Alert; 