import dotenv from 'dotenv';
import { testConnection } from './services/googleSheetsService.backend.js';

// Load env vars
dotenv.config({ path: '.env.local' });

console.log('🔍 Checking Google Sheets...');

async function check() {
    try {
        const result = await testConnection();
        console.log('✅ Connection Successful!');
        console.log('Sheets found:', result.sheets);

        if (result.sheets.includes('OperationalCosts')) {
            console.log('✅ OperationalCosts sheet exists.');
        } else {
            console.error('❌ OperationalCosts sheet MISSING.');
        }
    } catch (error) {
        console.error('❌ Check failed:', error);
    }
}

check();
