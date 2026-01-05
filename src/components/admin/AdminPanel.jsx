import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    Chip,
    IconButton,
    InputAdornment
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const AdminPanel = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        full_name: '',
        role: 'sales-man'
    });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/users');
            setUsers(response.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        }
    };

    const handleCreateUser = async () => {
        setError('');
        try {
            await axios.post('http://localhost:3000/api/auth/register', newUser);
            setSuccess('User created successfully');
            setOpen(false);
            setNewUser({ username: '', password: '', full_name: '', role: 'sales-man' });
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create user');
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await axios.delete(`http://localhost:3000/api/users/${id}`);
                setSuccess('User deleted');
                fetchUsers();
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                setError('Failed to delete user');
            }
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'error';
            case 'owner': return 'warning';
            case 'investor': return 'info';
            default: return 'success';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    User Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setOpen(true)}
                    sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}
                >
                    Add User
                </Button>
            </Box>

            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell>Full Name</TableCell>
                            <TableCell>Username</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Created At</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>{row.full_name}</TableCell>
                                <TableCell>{row.username}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={row.role.toUpperCase()}
                                        size="small"
                                        color={getRoleColor(row.role)}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        color="error"
                                        onClick={() => handleDeleteUser(row.id)}
                                        disabled={row.id === user.id} // Can't delete yourself
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Add New User</DialogTitle>
                <DialogContent sx={{ pt: 2, minWidth: 400 }}>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Full Name"
                        fullWidth
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Username"
                        fullWidth
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
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
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Role</InputLabel>
                        <Select
                            value={newUser.role}
                            label="Role"
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        >
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="owner">Owner</MenuItem>
                            <MenuItem value="sales-man">Sales-Man</MenuItem>
                            <MenuItem value="investor">Investor</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateUser} variant="contained" color="error">Create</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminPanel;
