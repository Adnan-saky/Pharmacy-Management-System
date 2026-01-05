import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { InputAdornment, IconButton } from '@mui/material';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const success = await login(username, password);
            if (success) {
                navigate('/');
            } else {
                setError('Invalid username or password');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: 'white'
            }}
        >
            <Card sx={{ maxWidth: 400, width: '100%', m: 2, background: 'rgba(255,255,255,0.9)' }}>
                <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                    <Box sx={{
                        bgcolor: '#ef4444',
                        p: 1.5,
                        borderRadius: '50%',
                        mb: 2,
                        color: 'white'
                    }}>
                        <LockOutlinedIcon />
                    </Box>

                    <Typography variant="h5" component="h1" gutterBottom sx={{ color: '#1e293b', fontWeight: 600 }}>
                        Pharmacy Management
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                        Sign in to access your dashboard
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={isSubmitting}
                            sx={{ mt: 3, mb: 2, bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' }, py: 1.5 }}
                        >
                            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Login;
