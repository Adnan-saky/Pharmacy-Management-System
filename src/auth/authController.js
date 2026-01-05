import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import sheetsService from '../services/googleSheetsService.backend.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-sales';

export const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const users = await sheetsService.getUsers();
        const user = users.find(u => u.username === username);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const register = async (req, res) => {
    const { username, password, role, full_name } = req.body;

    try {
        const users = await sheetsService.getUsers();
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            username,
            password: hashedPassword,
            role: role || 'sales-man',
            full_name
        };

        const createdUser = await sheetsService.addUser(newUser);
        res.status(201).json({
            id: createdUser.id,
            username: createdUser.username,
            role: createdUser.role,
            full_name: createdUser.full_name
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUsers = async (req, res) => {
    try {
        const users = await sheetsService.getUsers();
        // Remove passwords from response
        const safeUsers = users.map(u => ({
            id: u.id,
            username: u.username,
            role: u.role,
            full_name: u.full_name,
            created_at: u.created_at
        }));
        res.json(safeUsers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const deleteUser = async (req, res) => {
    try {
        await sheetsService.deleteUser(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
