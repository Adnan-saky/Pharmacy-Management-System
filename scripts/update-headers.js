import { initializeGoogleSheets } from '../src/services/googleSheetsService.backend.js';
import { config } from '../src/config/config.backend.js';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

const updateHeaders = async () => {
    try {
        console.log('🔌 Connecting to Google Sheets...');
        const api = await initializeGoogleSheets();
        const spreadsheetId = config.googleSheets.spreadsheetId;

        console.log('📝 Updating Sales sheet headers...');

        // The new headers we want
        const newHeaders = ['ID', 'Date', 'Total Amount', 'Payment Method', 'Notes', 'Created At', 'Customer Name', 'Paid Amount', 'Due Amount', 'Status'];

        // Update just the first row
        await api.spreadsheets.values.update({
            spreadsheetId,
            range: 'Sales!A1:J1',
            valueInputOption: 'RAW',
            requestBody: {
                values: [newHeaders]
            }
        });

        console.log('✅ Successfully updated Sales sheet headers!');
        console.log('Headers are now:', newHeaders.join(' | '));

    } catch (error) {
        console.error('❌ Failed to update headers:', error);
    }
};

updateHeaders();
