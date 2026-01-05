// Google Sheets Service - Frontend API Client
// Connects to our local Express backend (server.js)
const API_URL = 'http://localhost:3000/api';

/**
 * Helper to get Auth Headers
 */
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

/**
 * Helper for handling fetch responses
 */
const handleResponse = async (response) => {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
    }
    return response.json();
};

/**
 * Initialize - Check backend health
 */
export const initializeGoogleSheets = async () => {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await handleResponse(response);
        console.log('✅ Backend API connected:', data);
        return true;
    } catch (error) {
        console.error('❌ Failed to connect to backend API:', error);
        return false;
    }
};

/**
 * Read all sales from Backend
 */
export const readSales = async () => {
    try {
        const response = await fetch(`${API_URL}/sales`, {
            headers: getAuthHeaders()
        });
        const sales = await handleResponse(response);
        return sales.sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
    } catch (error) {
        console.error('Error reading sales:', error);
        throw error;
    }
};

/**
 * Create a new sale
 */
export const createSale = async (saleData) => {
    try {
        const response = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(saleData),
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error creating sale:', error);
        throw error;
    }
};

/**
 * Update a sale
 */
export const updateSale = async (id, saleData) => {
    try {
        const response = await fetch(`${API_URL}/sales/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(saleData),
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error updating sale:', error);
        throw error;
    }
};

/**
 * Delete a sale
 */
export const deleteSale = async (id) => {
    try {
        const response = await fetch(`${API_URL}/sales/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error deleting sale:', error);
        throw error;
    }
};

// ... (existing sales methods)

// --- SUPPLIERS ---
export const getSuppliers = async () => {
    const response = await fetch(`${API_URL}/suppliers`, {
        headers: getAuthHeaders()
    });
    return await handleResponse(response);
};

export const addSupplier = async (supplier) => {
    const response = await fetch(`${API_URL}/suppliers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(supplier)
    });
    return await handleResponse(response);
};

// --- MEDICINE COSTS ---
export const getMedicineCosts = async () => {
    const response = await fetch(`${API_URL}/medicine-costs`, {
        headers: getAuthHeaders()
    });
    return await handleResponse(response);
};

export const addMedicineCost = async (cost) => {
    const response = await fetch(`${API_URL}/medicine-costs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(cost)
    });
    return await handleResponse(response);
};

// --- OPERATIONAL COSTS ---
export const getOperationalCosts = async () => {
    const response = await fetch(`${API_URL}/operational-costs`, {
        headers: getAuthHeaders()
    });
    return await handleResponse(response);
};

export const addOperationalCost = async (cost) => {
    const response = await fetch(`${API_URL}/operational-costs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(cost)
    });
    return await handleResponse(response);
};

// --- PETTY CASH ---
export const getPettyCashTransactions = async () => {
    const response = await fetch(`${API_URL}/petty-cash`, {
        headers: getAuthHeaders()
    });
    return await handleResponse(response);
};

export const addPettyCashTransaction = async (txn) => {
    const response = await fetch(`${API_URL}/petty-cash`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(txn)
    });
    return await handleResponse(response);
};

// --- INVESTMENTS ---
export const getInvestments = async () => {
    const response = await fetch(`${API_URL}/investments`, {
        headers: getAuthHeaders()
    });
    return await handleResponse(response);
};

export const addInvestment = async (investment) => {
    const response = await fetch(`${API_URL}/investments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(investment)
    });
    return await handleResponse(response);
};

export default {
    initializeGoogleSheets,
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
    addInvestment
};
