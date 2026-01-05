import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Backend Environment Configuration (Node.js compatible)
export const config = {
    // Google Sheets API
    googleSheets: {
        clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.VITE_GOOGLE_SHEETS_CLIENT_EMAIL,
        privateKey: process.env.GOOGLE_PRIVATE_KEY || process.env.VITE_GOOGLE_SHEETS_PRIVATE_KEY,
        spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || process.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID,
    },

    // Cloudinary
    cloudinary: {
        cloudName: process.env.VITE_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.VITE_CLOUDINARY_UPLOAD_PRESET,
    },

    // App settings
    app: {
        name: 'Pharmacy Management System (Backend)',
        version: '1.0.0',
    },
};
