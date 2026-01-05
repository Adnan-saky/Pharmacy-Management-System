import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sheetsService from './src/services/googleSheetsService.backend.js';
import * as authController from './src/auth/authController.js';
import { authenticateToken, requireRole } from './src/auth/authMiddleware.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// --- AUTH ROUTES ---
app.post('/api/auth/login', authController.login);
// Only Admin/Owner can register new users
app.post('/api/auth/register', authenticateToken, requireRole(['admin', 'owner']), authController.register);
app.get('/api/users', authenticateToken, requireRole(['admin', 'owner']), authController.getUsers);
app.delete('/api/users/:id', authenticateToken, requireRole(['admin', 'owner']), authController.deleteUser);

// GET /api/sales - Read all sales
// GET /api/sales - Read all sales
app.get('/api/sales', authenticateToken, requireRole(['admin', 'owner', 'sales-man', 'investor']), async (req, res) => {
    try {
        const sales = await sheetsService.readSales();
        res.json(sales);
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
});

// POST /api/sales - Create new sale
// POST /api/sales - Create new sale
app.post('/api/sales', authenticateToken, requireRole(['admin', 'owner', 'sales-man']), async (req, res) => {
    try {
        const newSale = await sheetsService.createSale({ ...req.body, createdBy: req.user.username });
        res.status(201).json(newSale);
    } catch (error) {
        console.error('Error creating sale:', error);
        res.status(500).json({ error: 'Failed to create sale' });
    }
});

// PUT /api/sales/:id - Update sale
// PUT /api/sales/:id - Update sale
app.put('/api/sales/:id', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
    try {
        const updatedSale = await sheetsService.updateSale(req.params.id, req.body);
        res.json(updatedSale);
    } catch (error) {
        console.error('Error updating sale:', error);
        res.status(500).json({ error: 'Failed to update sale' });
    }
});

// ... (existing routes for sales)

// --- SUPPLIERS ROUTES ---
app.get('/api/suppliers', authenticateToken, requireRole(['admin', 'owner', 'sales-man', 'investor']), async (req, res) => {
    try {
        const suppliers = await sheetsService.getSuppliers();
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
});

app.post('/api/suppliers', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
    try {
        const supplier = await sheetsService.addSupplier({ ...req.body, createdBy: req.user.username });
        res.status(201).json(supplier);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add supplier' });
    }
});

// --- MEDICINE COSTS ROUTES ---
app.get('/api/medicine-costs', authenticateToken, requireRole(['admin', 'owner', 'sales-man', 'investor']), async (req, res) => {
    try {
        const costs = await sheetsService.getMedicineCosts();
        res.json(costs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch costs' });
    }
});

app.post('/api/medicine-costs', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
    try {
        const cost = await sheetsService.addMedicineCost({ ...req.body, createdBy: req.user.username });
        res.status(201).json(cost);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add cost' });
    }
});

// --- OPERATIONAL COSTS ROUTES ---
app.get('/api/operational-costs', authenticateToken, requireRole(['admin', 'owner', 'sales-man', 'investor']), async (req, res) => {
    try {
        const costs = await sheetsService.getOperationalCosts();
        res.json(costs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch operational costs' });
    }
});

app.post('/api/operational-costs', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
    try {
        const cost = await sheetsService.addOperationalCost({ ...req.body, createdBy: req.user.username });
        res.status(201).json(cost);
    } catch (error) {
        console.error('Error adding operational cost:', error);
        res.status(500).json({ error: error.message || 'Failed to add operational cost' });
    }
});

// --- PETTY CASH ROUTES ---
app.get('/api/petty-cash', authenticateToken, requireRole(['admin', 'owner', 'sales-man', 'investor']), async (req, res) => {
    try {
        const txns = await sheetsService.getPettyCashTransactions();
        res.json(txns);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch petty cash' });
    }
});

app.post('/api/petty-cash', authenticateToken, requireRole(['admin', 'owner', 'sales-man']), async (req, res) => {
    try {
        const txn = await sheetsService.addPettyCashTransaction({ ...req.body, createdBy: req.user.username });
        res.status(201).json(txn);
    } catch (error) {
        console.error('Error adding petty cash:', error);
        res.status(500).json({ error: error.message || 'Failed to add transaction' });
    }
});

// --- INVESTMENT ROUTES ---
app.get('/api/investments', authenticateToken, requireRole(['admin', 'owner', 'investor']), async (req, res) => {
    try {
        const investments = await sheetsService.getInvestments();
        res.json(investments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch investments' });
    }
});

app.post('/api/investments', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
    try {
        const investment = await sheetsService.addInvestment({ ...req.body, createdBy: req.user.username });
        res.status(201).json(investment);
    } catch (error) {
        console.error('Error adding investment:', error);
        res.status(500).json({ error: error.message || 'Failed to add investment' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`✅ Backend Server running on http://localhost:${PORT}`);

    // Initialize Sheets connection on start
    sheetsService.initializeGoogleSheets()
        .then(() => console.log('✅ Google Sheets Service connected'))
        .catch(err => console.error('❌ Google Sheets Service failed to connect:', err));
});

// FORCE KEEP-ALIVE: Ensure process doesn't exit for empty event loop
setInterval(() => { }, 1000 * 60 * 60);

// Debug Exit
process.on('exit', (code) => console.log(`Server process exiting with code ${code}`));
process.on('SIGINT', () => { console.log('Server caught SIGINT'); process.exit(); });
process.on('SIGTERM', () => { console.log('Server caught SIGTERM'); process.exit(); });
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
