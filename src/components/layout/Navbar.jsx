import { AppBar, Toolbar, Typography, IconButton, Box, Chip, Avatar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onMenuClick }) => {
    const { user } = useAuth();

    return (
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={onMenuClick}
                    sx={{ mr: 2, display: { sm: 'none' } }}
                >
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    Pharmacy Management System
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </Typography>

                    {user && (
                        <Chip
                            avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}><AccountCircle /></Avatar>}
                            label={
                                <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1, textAlign: 'left' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        {user.username}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'capitalize' }}>
                                        {user.role}
                                    </Typography>
                                </Box>
                            }
                            color="default"
                            sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.15)',
                                color: 'white',
                                height: 'auto',
                                py: 0.5,
                                '& .MuiChip-label': { paddingRight: 2 },
                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
                            }}
                        />
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
