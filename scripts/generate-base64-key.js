
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const privateKey = envConfig.VITE_GOOGLE_SHEETS_PRIVATE_KEY || envConfig.GOOGLE_PRIVATE_KEY;

if (!privateKey) {
    console.error('❌ Could not find private key in .env.local');
    process.exit(1);
}

// Clean it up first (remove quotes, fix newlines) just to be sure we have the raw key
let cleanKey = privateKey;
if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
    cleanKey = cleanKey.slice(1, -1);
}
cleanKey = cleanKey.replace(/\\n/g, '\n');

// Convert to Base64
const base64Key = Buffer.from(cleanKey).toString('base64');

console.log('\n✅ GENERATED BASE64 KEY FOR VERCEL:');
console.log('================================================================');
console.log(base64Key);
console.log('================================================================');
console.log('\n📋 INSTRUCTIONS:');
console.log('1. Copy the long string between the lines above.');
console.log('2. Go to Vercel -> Settings -> Environment Variables.');
console.log('3. Edit GOOGLE_PRIVATE_KEY.');
console.log('4. Paste this new value.');
