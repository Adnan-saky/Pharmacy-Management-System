// Environment configuration
export const config = {
    // Google Sheets API (will be configured later)
    googleSheets: {
        clientEmail: import.meta.env.VITE_GOOGLE_SHEETS_CLIENT_EMAIL,
        privateKey: import.meta.env.VITE_GOOGLE_SHEETS_PRIVATE_KEY,
        spreadsheetId: import.meta.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID,
    },

    // Cloudinary (for file uploads - will be configured later)
    cloudinary: {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
    },

    // App settings
    app: {
        name: 'Pharmacy Management System',
        version: '1.0.0',
    },
};
