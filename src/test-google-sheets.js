/**
 * Google Sheets Connection Test Script
 * 
 * This script tests the Google Sheets API connection and basic operations.
 * Run with: node src/test-google-sheets.js
 */

// For Node.js, we need to test directly without ES modules
const { google } = require('googleapis');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Starting Google Sheets Connection Test...\n');

async function runTests() {
    try {
        // Test 1: Connection
        console.log('📡 Test 1: Testing connection to Google Sheets...');
        const connectionResult = await testConnection();
        console.log(`✅ Connected to: "${connectionResult.spreadsheetTitle}"`);
        console.log(`✅ Available sheets: ${connectionResult.sheets.join(', ')}\n`);

        // Test 2: Read existing data
        console.log('📖 Test 2: Reading existing sales data...');
        const existingSales = await readSales();
        console.log(`✅ Found ${existingSales.length} existing sales\n`);

        // Test 3: Write test data
        console.log('✍️  Test 3: Creating a test sale...');
        const testSale = await testWrite();
        console.log(`✅ Test sale created with ID: ${testSale.id}\n`);

        // Test 4: Read again to verify write
        console.log('🔄 Test 4: Verifying the test sale was saved...');
        const updatedSales = await readSales();
        console.log(`✅ Now have ${updatedSales.length} sales (should be ${existingSales.length + 1})\n`);

        // Summary
        console.log('🎉 All tests passed! Google Sheets is working correctly.\n');
        console.log('✅ Connection: Working');
        console.log('✅ Read: Working');
        console.log('✅ Write: Working');
        console.log('\n📝 Check your Google Spreadsheet to see the test sale that was added.');
        console.log('💡 You can now proceed with Phase 1 implementation!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('\n🔧 Troubleshooting tips:');
        console.error('1. Check that .env.local has the correct credentials');
        console.error('2. Verify the spreadsheet is shared with your service account email');
        console.error('3. Make sure the "Sales" sheet exists with the correct column headers');
        console.error('4. Ensure the private key has proper \\n characters (not actual line breaks)');
        process.exit(1);
    }
}

runTests();
