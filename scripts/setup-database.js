import { google } from 'googleapis';
import { config } from '../src/config/config.backend.js';

/**
 * Setup Database Script
 * Adds 'Suppliers' and 'MedicineCosts' sheets if they don't exist.
 */
const setupDatabase = async () => {
    console.log('🚀 Starting Database Setup...');

    try {
        // Initialize Auth
        const privateKey = config.googleSheets.privateKey?.replace(/\\n/g, '\n');
        const auth = new google.auth.JWT({
            email: config.googleSheets.clientEmail,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = config.googleSheets.spreadsheetId;

        // 1. Get current sheets
        const metadata = await sheets.spreadsheets.get({ spreadsheetId });
        const existingSheets = metadata.data.sheets.map(s => s.properties.title);

        console.log('📊 Current Sheets:', existingSheets.join(', '));

        const requests = [];

        // 2. Define 'Suppliers' Sheet
        if (!existingSheets.includes('Suppliers')) {
            console.log('➕ Adding "Suppliers" sheet...');
            requests.push({
                addSheet: {
                    properties: { title: 'Suppliers' }
                }
            });
            // Add Headers for Suppliers
            // We'll do this in a separate step after creation or assume it's created empty
        } else {
            console.log('✅ "Suppliers" sheet already exists.');
        }

        // 3. Define 'MedicineCosts' Sheet
        if (!existingSheets.includes('MedicineCosts')) {
            console.log('➕ Adding "MedicineCosts" sheet...');
            requests.push({
                addSheet: {
                    properties: { title: 'MedicineCosts' }
                }
            });
        } else {
            console.log('✅ "MedicineCosts" sheet already exists.');
        }

        // 4. Execute Add Sheet Requests
        if (requests.length > 0) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: { requests }
            });
            console.log('✅ New sheets created successfully.');

            // 5. Add Headers (Separate calls to be safe)
            console.log('📝 Adding headers...');

            // Suppliers Headers: id, name, contact_info, created_at
            if (!existingSheets.includes('Suppliers')) {
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: 'Suppliers!A1:D1',
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [['id', 'name', 'contact_info', 'created_at']]
                    }
                });
            }

            // MedicineCosts Headers: id, date, supplier_id, supplier_name, medicine_details, total_amount, payment_status, notes, created_at
            if (!existingSheets.includes('MedicineCosts')) {
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: 'MedicineCosts!A1:I1',
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [['id', 'date', 'supplier_id', 'supplier_name', 'medicine_details', 'total_amount', 'payment_status', 'notes', 'created_at']]
                    }
                });
            }
            console.log('✅ Headers added.');
        } else {
            console.log('🎉 Database is already up to date.');
        }

    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
};

setupDatabase();
