import { google } from 'googleapis';
import { config } from '../config/config.backend.js';

let sheets = null;
let isInitialized = false;

// Helper to ensure required sheets exist with headers
const ensureSheetsExist = async (api) => {
    try {
        const spreadsheetId = config.googleSheets.spreadsheetId;
        const requiredSheets = ['Sales', 'Suppliers', 'MedicineCosts', 'OperationalCosts', 'PettyCash', 'Investments', 'Users'];
        const sheetHeaders = {
            'Sales': ['ID', 'Date', 'Total Amount', 'Payment Method', 'Notes', 'Created At', 'Customer Name', 'Paid Amount', 'Due Amount', 'Status', 'Created By'],
            'Suppliers': ['ID', 'Name', 'Contact Info', 'Created At', 'Created By'],
            'MedicineCosts': ['ID', 'Date', 'Supplier ID', 'Supplier Name', 'Medicine Details', 'Total Amount', 'Payment Status', 'Notes', 'Created At', 'Created By'],
            'OperationalCosts': ['ID', 'Date', 'Cost Type', 'Amount', 'Recipient', 'Notes', 'Created At', 'Created By'],
            'PettyCash': ['ID', 'Date', 'Type', 'Amount', 'Description', 'Balance', 'Created At', 'Created By'],
            'Investments': ['ID', 'Date', 'Investor Name', 'Amount', 'Contact', 'Notes', 'Created At', 'Created By'],
            'Users': ['ID', 'Username', 'Password', 'Role', 'Full Name', 'Created At']
        };

        const metadata = await api.spreadsheets.get({ spreadsheetId });
        const existingSheets = metadata.data.sheets.map(s => s.properties.title);

        for (const sheetName of requiredSheets) {
            // 1. Create sheet if missing
            if (!existingSheets.includes(sheetName)) {
                await api.spreadsheets.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        requests: [{ addSheet: { properties: { title: sheetName } } }]
                    }
                });
                console.log(`✅ Created sheet: ${sheetName}`);
            }

            // 2. Check for headers
            const headerRange = `${sheetName}!A1:Z1`;
            const headerCheck = await api.spreadsheets.values.get({
                spreadsheetId,
                range: headerRange
            });

            if (!headerCheck.data.values || headerCheck.data.values.length === 0) {
                // Add headers
                await api.spreadsheets.values.update({
                    spreadsheetId,
                    range: `${sheetName}!A1`,
                    valueInputOption: 'RAW',
                    requestBody: { values: [sheetHeaders[sheetName]] }
                });
                console.log(`✅ Added headers to: ${sheetName}`);
            }
        }
    } catch (error) {
        console.error('⚠️ Failed to check/create sheets:', error.message);
    }
};

/**
 * Initialize Google Sheets API client
 */
export const initializeGoogleSheets = async () => {
    if (isInitialized) {
        return sheets;
    }

    try {
        // Parse the private key - handle escaped newlines
        // Parse and clean the private key (Handle Vercel/Env formatting issues)
        let privateKey = config.googleSheets.privateKey;
        if (privateKey) {
            // 1. Remove surrounding double quotes if present (common env var artifact)
            if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
                privateKey = privateKey.slice(1, -1);
            }
            // 2. Convert literal \n to actual newlines
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        // Create JWT auth client
        const auth = new google.auth.JWT({
            email: config.googleSheets.clientEmail,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        // Initialize sheets API
        sheets = google.sheets({ version: 'v4', auth });

        // Ensure sheets exist
        await ensureSheetsExist(sheets);

        isInitialized = true;

        console.log('✅ Google Sheets API initialized successfully');
        return sheets;
    } catch (error) {
        console.error('❌ Failed to initialize Google Sheets API:', error);
        throw new Error(`Google Sheets initialization failed: ${error.message}`);
    }
};

/**
 * Test connection to Google Sheets
 */
export const testConnection = async () => {
    try {
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;

        // Try to get spreadsheet metadata
        const response = await api.spreadsheets.get({
            spreadsheetId: spreadsheetId,
        });

        console.log('✅ Successfully connected to Google Sheets!');
        console.log(`📊 Spreadsheet: "${response.data.properties.title}"`);
        console.log(`📄 Sheets found: ${response.data.sheets.map(s => s.properties.title).join(', ')}`);

        return {
            success: true,
            spreadsheetTitle: response.data.properties.title,
            sheets: response.data.sheets.map(s => s.properties.title),
        };
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);

        // Provide helpful error messages
        if (error.message.includes('invalid_grant')) {
            throw new Error('Invalid credentials. Please check your service account email and private key.');
        } else if (error.message.includes('not found')) {
            throw new Error('Spreadsheet not found. Please check the spreadsheet ID.');
        } else if (error.message.includes('permission')) {
            throw new Error('Permission denied. Make sure the spreadsheet is shared with the service account email.');
        }

        throw error;
    }
};

/**
 * Read all sales from Google Sheets
 */
export const readSales = async () => {
    try {
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;

        const response = await api.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Sales!A2:K', // Updated range to include new columns
        });

        const rows = response.data.values || [];

        // Transform rows to objects
        const sales = rows.map((row, index) => ({
            id: row[0] || `sale_${index + 1}`,
            sale_date: row[1] || '',
            total_amount: parseFloat(row[2]) || 0,
            payment_method: row[3] || '',
            notes: row[4] || '',
            created_at: row[5] || new Date().toISOString(),
            customer_name: row[6] || '',
            paid_amount: parseFloat(row[7]) || 0,
            due_amount: parseFloat(row[8]) || 0,
            status: row[9] || 'Paid',
            created_by: row[10] || 'System',
        }));

        console.log(`📊 Fetched ${sales.length} sales from Google Sheets`);
        return sales;
    } catch (error) {
        console.error('❌ Failed to read sales:', error);
        throw error;
    }
};

/**
 * Create a new sale record
 */
export const createSale = async (saleData) => {
    try {
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;

        // Generate unique ID
        const id = `sale_${Date.now()}`;
        const created_at = new Date().toISOString();

        // Prepare row data
        const rowData = [
            id,
            saleData.sale_date,
            saleData.total_amount,
            saleData.payment_method,
            saleData.notes || '',
            created_at,
            saleData.customer_name || '',
            saleData.paid_amount !== undefined && saleData.paid_amount !== null ? saleData.paid_amount : saleData.total_amount,
            saleData.due_amount !== undefined && saleData.due_amount !== null ? saleData.due_amount : 0,
            saleData.status || 'Paid',
            saleData.createdBy || 'System',
        ];

        // Append to sheet
        const response = await api.spreadsheets.values.append({
            spreadsheetId: spreadsheetId,
            range: 'Sales!A:K',
            valueInputOption: 'RAW',
            requestBody: {
                values: [rowData],
            },
        });

        console.log('✅ Sale created successfully:', id);

        return {
            id,
            ...saleData,
            created_at,
        };
    } catch (error) {
        console.error('❌ Failed to create sale:', error);
        throw error;
    }
};

/**
 * Test write operation (creates a test sale)
 */
export const testWrite = async () => {
    try {
        const testSale = {
            sale_date: new Date().toISOString().split('T')[0], // Today's date
            total_amount: 1000,
            payment_method: 'Cash',
            notes: 'Test sale - connection verification',
        };

        const result = await createSale(testSale);
        console.log('✅ Test sale created successfully!');
        console.log('📝 Sale ID:', result.id);

        return result;
    } catch (error) {
        console.error('❌ Test write failed:', error);
        throw error;
    }
};

/**
 * Update an existing sale
 */
export const updateSale = async (id, saleData) => {
    try {
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;

        // First, find the row with this ID
        const allSales = await readSales();
        const saleIndex = allSales.findIndex(sale => sale.id === id);

        if (saleIndex === -1) {
            throw new Error(`Sale with ID ${id} not found`);
        }

        // Row number in sheet (adding 2 because: 1 for header, 1 for 0-index)
        const rowNumber = saleIndex + 2;

        // Update the row
        const rowData = [
            id,
            saleData.sale_date,
            saleData.total_amount,
            saleData.payment_method,
            saleData.notes || '',
            allSales[saleIndex].created_at,
            saleData.customer_name || '',
            saleData.paid_amount,
            saleData.due_amount,
            saleData.status,
            allSales[saleIndex].created_by // Preserve original creator
        ];

        await api.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: `Sales!A${rowNumber}:K${rowNumber}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [rowData],
            },
        });

        console.log('✅ Sale updated successfully:', id);
        return { id, ...saleData };
    } catch (error) {
        console.error('❌ Failed to update sale:', error);
        throw error;
    }
};

/**
 * Delete a sale
 */
export const deleteSale = async (id) => {
    try {
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;

        // Find the row
        const allSales = await readSales();
        const saleIndex = allSales.findIndex(sale => sale.id === id);

        if (saleIndex === -1) {
            throw new Error(`Sale with ID ${id} not found`);
        }

        const rowNumber = saleIndex + 2;

        // Delete the row
        await api.spreadsheets.batchUpdate({
            spreadsheetId: spreadsheetId,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: 0, // Assumes Sales is the first sheet
                            dimension: 'ROWS',
                            startIndex: rowNumber - 1,
                            endIndex: rowNumber,
                        },
                    },
                }],
            },
        });

        console.log('✅ Sale deleted successfully:', id);
        return { id };
    } catch (error) {
        console.error('❌ Failed to delete sale:', error);
        throw error;
    }
};

// ... (previous imports and existing methods)

/**
 * Get all Suppliers
 */
export const getSuppliers = async () => {
    try {
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;

        const response = await api.spreadsheets.values.get({
            spreadsheetId,
            range: 'Suppliers!A2:E',
        });

        const rows = response.data.values || [];
        return rows.map(row => ({
            id: row[0],
            name: row[1],
            contact_info: row[2],
            created_at: row[3],
            created_by: row[4] || 'System',
        }));
    } catch (error) {
        console.error('❌ Failed to get suppliers:', error);
        throw error;
    }
};

/**
 * Add a new Supplier
 */
export const addSupplier = async (supplier) => {
    try {
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;
        const id = `sup_${Date.now()}`;
        const created_at = new Date().toISOString();

        const rowData = [id, supplier.name, supplier.contact_info || '', created_at, supplier.createdBy || 'System'];

        await api.spreadsheets.values.append({
            spreadsheetId,
            range: 'Suppliers!A:E',
            valueInputOption: 'RAW',
            requestBody: { values: [rowData] },
        });

        return { id, ...supplier, created_at };
    } catch (error) {
        console.error('❌ Failed to add supplier:', error);
        throw error;
    }
};

/**
 * Get Medicine Costs
 */
export const getMedicineCosts = async () => {
    try {
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;

        const response = await api.spreadsheets.values.get({
            spreadsheetId,
            range: 'MedicineCosts!A2:J',
        });

        const rows = response.data.values || [];
        return rows.map(row => ({
            id: row[0],
            date: row[1],
            supplier_id: row[2],
            supplier_name: row[3],
            medicine_details: row[4],
            total_amount: parseFloat(row[5]) || 0,
            payment_status: row[6],
            notes: row[7],
            created_at: row[8],
            created_by: row[9] || 'System'
        }));
    } catch (error) {
        console.error('❌ Failed to get medicine costs:', error);
        throw error;
    }
};

/**
 * Add Medicine Cost
 */
export const addMedicineCost = async (cost) => {
    try {
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;
        const id = `cost_${Date.now()}`;
        const created_at = new Date().toISOString();

        const rowData = [
            id,
            cost.date,
            cost.supplier_id,
            cost.supplier_name,
            cost.medicine_details,
            cost.total_amount,
            cost.payment_status,
            cost.notes || '',
            created_at,
            cost.createdBy || 'System'
        ];

        await api.spreadsheets.values.append({
            spreadsheetId,
            range: 'MedicineCosts!A:J',
            valueInputOption: 'RAW',
            requestBody: { values: [rowData] },
        });

        return { id, ...cost, created_at };
    } catch (error) {
        console.error('❌ Failed to add medicine cost:', error);
        throw error;
    }
};

/**
 * Get Operational Costs
 */
export const getOperationalCosts = async () => {
    try {
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;

        const response = await api.spreadsheets.values.get({
            spreadsheetId,
            range: 'OperationalCosts!A2:H',
        });

        const rows = response.data.values || [];
        return rows.map(row => ({
            id: row[0],
            date: row[1],
            cost_type: row[2],
            amount: parseFloat(row[3]) || 0,
            recipient: row[4],
            notes: row[5],
            created_at: row[6],
        }));
    } catch (error) {
        console.error('❌ Failed to get operational costs:', error);
        throw error;
    }
};

/**
 * Add Operational Cost
 */
export const addOperationalCost = async (cost) => {
    try {
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;
        const id = `op_cost_${Date.now()}`;
        const created_at = new Date().toISOString();

        const rowData = [
            id,
            cost.date,
            cost.cost_type,
            cost.amount,
            cost.recipient || '',
            cost.notes || '',
            created_at,
            cost.createdBy || 'System'
        ];

        await api.spreadsheets.values.append({
            spreadsheetId,
            range: 'OperationalCosts!A:I',
            valueInputOption: 'RAW',
            requestBody: { values: [rowData] },
        });

        return { id, ...cost, created_at };
    } catch (error) {
        console.error('❌ Failed to add operational cost:', error);
        throw error;
    }
};

/**
 * Get Petty Cash Transactions
 */
export const getPettyCashTransactions = async () => {
    try {
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;

        const response = await api.spreadsheets.values.get({
            spreadsheetId,
            range: 'PettyCash!A2:H',
        });

        const rows = response.data.values || [];
        return rows.map(row => ({
            id: row[0],
            date: row[1],
            type: row[2], // 'IN' or 'OUT'
            amount: parseFloat(row[3]) || 0,
            description: row[4],
            balance: parseFloat(row[5]) || 0,
            created_at: row[6],
            created_by: row[7] || 'System'
        }));
    } catch (error) {
        console.error('❌ Failed to get petty cash:', error);
        throw error;
    }
};

/**
 * Add Petty Cash Transaction
 */
export const addPettyCashTransaction = async (transaction) => {
    try {
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;
        const id = `pc_${Date.now()}`;
        const created_at = new Date().toISOString();

        // Calculate new balance
        const allTxns = await getPettyCashTransactions();
        let currentBalance = 0;
        if (allTxns.length > 0) {
            currentBalance = allTxns[allTxns.length - 1].balance;
        }

        const amount = parseFloat(transaction.amount);
        let newBalance = currentBalance;

        if (transaction.type === 'IN') {
            newBalance += amount;
        } else {
            newBalance -= amount;
        }

        const rowData = [
            id,
            transaction.date,
            transaction.type,
            amount,
            transaction.description || '',
            newBalance,
            created_at,
            transaction.createdBy || 'System'
        ];

        await api.spreadsheets.values.append({
            spreadsheetId,
            range: 'PettyCash!A:H',
            valueInputOption: 'RAW',
            requestBody: { values: [rowData] },
        });

        return { id, ...transaction, balance: newBalance, created_at };
    } catch (error) {
        console.error('❌ Failed to add petty cash transaction:', error);
        throw error;
    }
};

/**
 * Get Investments
 */
export const getInvestments = async () => {
    try {
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;

        const response = await api.spreadsheets.values.get({
            spreadsheetId,
            range: 'Investments!A2:H',
        });

        const rows = response.data.values || [];
        return rows.map(row => ({
            id: row[0],
            date: row[1],
            investor_name: row[2],
            amount: parseFloat(row[3]) || 0,
            contact: row[4],
            notes: row[5],
            created_at: row[6],
            created_by: row[7] || 'System'
        }));
    } catch (error) {
        console.error('❌ Failed to get investments:', error);
        throw error;
    }
};

/**
 * Add Investment
 */
export const addInvestment = async (investment) => {
    try {
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;
        const id = `inv_${Date.now()}`;
        const created_at = new Date().toISOString();

        const rowData = [
            id,
            investment.date,
            investment.investor_name,
            investment.amount,
            investment.contact || '',
            investment.notes || '',
            created_at,
            investment.createdBy || 'System'
        ];

        await api.spreadsheets.values.append({
            spreadsheetId,
            range: 'Investments!A:H',
            valueInputOption: 'RAW',
            requestBody: { values: [rowData] },
        });

        return { id, ...investment, created_at };
    } catch (error) {
        console.error('❌ Failed to add investment:', error);
        throw error;
    }
};

/**
 * Get all Users
 */
export const getUsers = async () => {
    try {
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;

        const response = await api.spreadsheets.values.get({
            spreadsheetId,
            range: 'Users!A2:F',
        });

        const rows = response.data.values || [];
        return rows.map(row => ({
            id: row[0],
            username: row[1],
            password: row[2], // In a real app, this would be hashed
            role: row[3],
            full_name: row[4],
            created_at: row[5],
        }));
    } catch (error) {
        console.error('❌ Failed to get users:', error);
        throw error;
    }
};

/**
 * Add a new User
 */
export const addUser = async (user) => {
    try {
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;
        const id = `user_${Date.now()}`;
        const created_at = new Date().toISOString();

        const rowData = [
            id,
            user.username,
            user.password, // Hash this before sending if managing on frontend, or hash in backend controller
            user.role,
            user.full_name || '',
            created_at
        ];

        await api.spreadsheets.values.append({
            spreadsheetId,
            range: 'Users!A:F',
            valueInputOption: 'RAW',
            requestBody: { values: [rowData] },
        });

        return { id, ...user, created_at };
    } catch (error) {
        console.error('❌ Failed to add user:', error);
        throw error;
    }
};

/**
 * Update a User
 */
export const updateUser = async (id, userData) => {
    try {
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;

        const allUsers = await getUsers();
        const userIndex = allUsers.findIndex(u => u.id === id);

        if (userIndex === -1) {
            throw new Error(`User with ID ${id} not found`);
        }

        const rowNumber = userIndex + 2;
        const currentUser = allUsers[userIndex];

        const rowData = [
            id,
            userData.username || currentUser.username,
            userData.password || currentUser.password,
            userData.role || currentUser.role,
            userData.full_name || currentUser.full_name,
            currentUser.created_at
        ];

        await api.spreadsheets.values.update({
            spreadsheetId,
            range: `Users!A${rowNumber}:F${rowNumber}`,
            valueInputOption: 'RAW',
            requestBody: { values: [rowData] },
        });

        return { id, ...userData };
    } catch (error) {
        console.error('❌ Failed to update user:', error);
        throw error;
    }
};

/**
 * Delete a User
 */
export const deleteUser = async (id) => {
    try {
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;

        const allUsers = await getUsers();
        const userIndex = allUsers.findIndex(u => u.id === id);

        if (userIndex === -1) {
            throw new Error(`User with ID ${id} not found`);
        }

        const rowNumber = userIndex + 2;

        await api.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: await getSheetIdByTitle(api, spreadsheetId, 'Users'),
                            dimension: 'ROWS',
                            startIndex: rowNumber - 1,
                            endIndex: rowNumber,
                        },
                    },
                }],
            },
        });

        return { id };
    } catch (error) {
        console.error('❌ Failed to delete user:', error);
        throw error;
    }
};

// Helper to get sheet ID by title
const getSheetIdByTitle = async (api, spreadsheetId, title) => {
    const metadata = await api.spreadsheets.get({ spreadsheetId });
    const sheet = metadata.data.sheets.find(s => s.properties.title === title);
    return sheet ? sheet.properties.sheetId : 0;
};

export default {
    initializeGoogleSheets,
    testConnection,
    testWrite,
    readSales,
    createSale,
    updateSale,
    deleteSale,
    getSuppliers,
    addSupplier,
    getMedicineCosts,
    addMedicineCost,
    getOperationalCosts,
    addOperationalCost,
    getPettyCashTransactions,
    addPettyCashTransaction,
    getInvestments,
    addInvestment,
    getUsers,
    addUser,
    updateUser,
    deleteUser
};
