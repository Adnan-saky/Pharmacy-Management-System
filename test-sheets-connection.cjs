/**
 * Google Sheets Connection Test Script
 * 
 * This script tests the Google Sheets API connection and basic operations.
 * Run with: node test-sheets-connection.cjs
 */

const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Starting Google Sheets Connection Test...\n');

async function testConnection() {
    try {
        console.log('📋 Loading credentials...');
        const clientEmail = process.env.VITE_GOOGLE_SHEETS_CLIENT_EMAIL;
        const privateKey = process.env.VITE_GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
        const spreadsheetId = process.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID;

        // Validate credentials
        if (!clientEmail || !privateKey || !spreadsheetId) {
            throw new Error('Missing credentials in .env.local file');
        }

        console.log('✅ Client Email:', clientEmail);
        console.log('✅ Spreadsheet ID:', spreadsheetId);
        console.log('✅ Private Key:', privateKey ? 'Loaded (' + privateKey.length + ' chars)' : 'Missing');

        // Test 1: Authentication
        console.log('\n📡 Test 1: Testing authentication...');
        const auth = new google.auth.JWT({
            email: clientEmail,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        console.log('✅ Auth client created successfully');

        // Test 2: Get spreadsheet info
        console.log('\n📊 Test 2: Fetching spreadsheet information...');
        const response = await sheets.spreadsheets.get({
            spreadsheetId: spreadsheetId,
        });

        console.log(`✅ Connected to: "${response.data.properties.title}"`);
        console.log(`✅ Available sheets: ${response.data.sheets.map(s => s.properties.title).join(', ')}`);

        // Test 3: Read from Sales sheet
        console.log('\n📖 Test 3: Reading from "Sales" sheet...');
        const salesData = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Sales!A1:F',
        });

        const rows = salesData.data.values || [];
        console.log(`✅ Found ${rows.length} rows in Sales sheet`);
        if (rows.length > 0) {
            console.log(`✅ Headers: ${rows[0].join(', ')}`);
            console.log(`✅ Data rows: ${rows.length - 1}`);
        }

        // Test 4: Write test data
        console.log('\n✍️  Test 4: Writing test sale...');
        const testSaleData = [
            `test_${Date.now()}`,
            new Date().toISOString().split('T')[0],
            1000,
            'Cash',
            'Test sale - connection verification',
            new Date().toISOString(),
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetId,
            range: 'Sales!A:F',
            valueInputOption: 'RAW',
            requestBody: {
                values: [testSaleData],
            },
        });

        console.log('✅ Test sale created successfully!');
        console.log(`✅ Sale ID: ${testSaleData[0]}`);

        // Summary
        console.log('\n🎉 All tests passed! Google Sheets is working correctly.\n');
        console.log('✅ Authentication: Working');
        console.log('✅ Read Access: Working');
        console.log('✅ Write Access: Working');
        console.log('\n📝 Check your Google Spreadsheet to see the test sale that was added.');
        console.log('💡 You can now proceed with Phase 1 implementation!');

        return true;

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('\n🔧 Troubleshooting tips:');

        if (error.message.includes('invalid_grant') || error.message.includes('Invalid JWT')) {
            console.error('❌ Invalid credentials - check your service account email and private key');
            console.error('   Make sure the private key has \\n characters, not actual line breaks');
        } else if (error.message.includes('not found') || error.code === 404) {
            console.error('❌ Spreadsheet not found - check the spreadsheet ID');
        } else if (error.message.includes('permission') || error.code === 403) {
            console.error('❌ Permission denied - share the spreadsheet with your service account email');
            console.error('   Service account:', process.env.VITE_GOOGLE_SHEETS_CLIENT_EMAIL);
        } else if (error.message.includes('Missing credentials')) {
            console.error('❌ Check that .env.local has all required fields:');
            console.error('   VITE_GOOGLE_SHEETS_CLIENT_EMAIL');
            console.error('   VITE_GOOGLE_SHEETS_PRIVATE_KEY');
            console.error('   VITE_GOOGLE_SHEETS_SPREADSHEET_ID');
        } else {
            console.error('Error details:', error);
        }

        process.exit(1);
    }
}

// Run the test
testConnection();
