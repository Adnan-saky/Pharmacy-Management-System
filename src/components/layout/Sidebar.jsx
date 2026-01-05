import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Divider,
    Box
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PeopleIcon from '@mui/icons-material/People';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonIcon from '@mui/icons-material/Person';

import AssessmentIcon from '@mui/icons-material/Assessment';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', roles: ['admin', 'owner', 'investor', 'sales-man'] },
    { text: 'Sales', icon: <ShoppingCartIcon />, path: '/sales', roles: ['admin', 'owner', 'sales-man'] },
    { text: 'Due Sales', icon: <PersonIcon />, path: '/due-sales', roles: ['admin', 'owner', 'sales-man'] },
    { text: 'Suppliers', icon: <PeopleIcon />, path: '/suppliers', roles: ['admin', 'owner'] },
    { text: 'Costs', icon: <LocalPharmacyIcon />, path: '/costs', roles: ['admin', 'owner'] },
    { text: 'Petty Cash', icon: <AccountBalanceWalletIcon />, path: '/petty-cash', roles: ['admin', 'owner', 'sales-man'] },
    { text: 'Investments', icon: <TrendingUpIcon />, path: '/investments', roles: ['admin', 'owner', 'investor'] },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports', roles: ['admin', 'owner', 'investor'] },
    { text: 'User Management', icon: <SupervisorAccountIcon />, path: '/admin', roles: ['admin', 'owner'] },
];

// In Sidebar declaration
const Sidebar = ({ mobileOpen, onDrawerToggle, window }) => {
    const location = useLocation();
    const { user, logout, hasRole } = useAuth(); // Destructure hasRole

    const drawer = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Toolbar />
            <Divider />
            <List sx={{ flexGrow: 1 }}>
                {menuItems.map((item) => {
                    if (!user || (item.roles && !item.roles.includes(user.role))) return null;

                    return (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                component={Link}
                                to={item.path}
                                selected={location.pathname === item.path}
                                sx={{
                                    '&.Mui-selected': {
                                        backgroundColor: 'primary.light',
                                        color: 'primary.contrastText',
                                        '&:hover': {
                                            backgroundColor: 'primary.main',
                                        },
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.contrastText' : 'inherit' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
                    )
                })}
            </List>
            <Divider />
            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={logout} sx={{ color: 'error.main' }}>
                        <ListItemIcon sx={{ color: 'error.main' }}>
                            <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText primary="Logout" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );

    const container = window !== undefined ? () => window().document.body : undefined;

    return (
        <Box
            component="nav"
            sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
            {/* Mobile drawer */}
            <Drawer
                container={container}
                variant="temporary"
                open={mobileOpen}
                onClose={onDrawerToggle}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
            >
                {drawer}
            </Drawer>

            {/* Desktop drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
                open
            >
                {drawer}
            </Drawer>
        </Box >
    );
};

export default Sidebar;
