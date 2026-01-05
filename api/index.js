import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sheetsService from '../src/services/googleSheetsService.backend.js';
import * as authController from '../src/auth/authController.js';
import { authenticateToken, requireRole } from '../src/auth/authMiddleware.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- DEBUG ROUTE (Remove in production if needed) ---
app.get('/api/debug-connection', async (req, res) => {
    try {
        const envCheck = {
            hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            hasKey: !!process.env.GOOGLE_PRIVATE_KEY,
            hasSheetId: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            keyLength: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.length : 0,
            keyStartsWithDash: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.trim().startsWith('-----BEGIN') : false,
            keyIncludesNewlines: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.includes('\n') || process.env.GOOGLE_PRIVATE_KEY.includes('\\n') : false
        };

        const connectionResult = await sheetsService.testConnection();

        res.json({
            status: 'success',
            message: 'Connection successful',
            envCheck,
            connectionResult
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
            envCheck: {
                hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                hasKey: !!process.env.GOOGLE_PRIVATE_KEY,
                hasSheetId: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
                keyLength: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.length : 0
            },
            stack: error.stack
        });
    }
});

// Routes

// --- AUTH ROUTES ---
app.post('/api/auth/login', authController.login);
// Only Admin/Owner can register new users
app.post('/api/auth/register', authenticateToken, requireRole(['admin', 'owner']), authController.register);
app.get('/api/users', authenticateToken, requireRole(['admin', 'owner']), authController.getUsers);
app.delete('/api/users/:id', authenticateToken, requireRole(['admin', 'owner']), authController.deleteUser);

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
app.put('/api/sales/:id', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
    try {
        const updatedSale = await sheetsService.updateSale(req.params.id, req.body);
        res.json(updatedSale);
    } catch (error) {
        console.error('Error updating sale:', error);
        res.status(500).json({ error: 'Failed to update sale' });
    }
});

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

// Initialize Google Sheets on cold start
let initialized = false;
const initializeSheets = async () => {
    if (!initialized) {
        try {
            await sheetsService.initializeGoogleSheets();
            console.log('✅ Google Sheets Service connected');
            initialized = true;
        } catch (err) {
            console.error('❌ Google Sheets Service failed to connect:', err);
        }
    }
};

// Export for Vercel serverless
export default async (req, res) => {
    await initializeSheets();
    return app(req, res);
};
