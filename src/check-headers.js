import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

// Manually parse env file
const envConfig = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
            envConfig[key.trim()] = value;
        }
    });
    console.log('✅ Loaded env keys:', Object.keys(envConfig));
} else {
    console.error('❌ .env.local file not found at:', envPath);
}

const privateKey = envConfig.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = envConfig.GOOGLE_SHEETS_CLIENT_EMAIL;
const spreadsheetId = envConfig.GOOGLE_SHEETS_SPREADSHEET_ID;

console.log('🔍 Checking Sheet Headers...');

async function check() {
    try {
        const auth = new google.auth.JWT({
            email: clientEmail,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const sheetName = 'OperationalCosts';

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A1:Z1`,
        });

        const headers = response.data.values ? response.data.values[0] : [];
        console.log(`\n📋 Current Headers for '${sheetName}':`);
        console.log(headers.length > 0 ? headers.join(' | ') : '⚠️ No headers found (Row 1 is empty)');

    } catch (error) {
        console.error('❌ Check failed:', error.message);
    }
}

check();
