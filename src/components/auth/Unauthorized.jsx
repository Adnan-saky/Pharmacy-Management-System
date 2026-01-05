import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f8fafc'
            }}
        >
            <Typography variant="h1" sx={{ fontWeight: 700, color: '#ef4444' }}>403</Typography>
            <Typography variant="h4" sx={{ mb: 2, color: '#1e293b' }}>Access Denied</Typography>
            <Typography variant="body1" sx={{ mb: 4, color: '#64748b' }}>
                You do not have permission to access this page.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/')}>
                Go to Dashboard
            </Button>
        </Box>
    );
};

export default Unauthorized;
