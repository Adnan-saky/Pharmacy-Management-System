import { initializeGoogleSheets, getPettyCashTransactions, addPettyCashTransaction } from './services/googleSheetsService.backend.js';

console.log('🚀 Testing Petty Cash Integration...');

async function test() {
    try {
        await initializeGoogleSheets();
        console.log('✅ Connected.');

        // 1. Check existing
        console.log('🔍 Fetching transactions...');
        const txns = await getPettyCashTransactions();
        console.log(`📊 Found ${txns.length} transactions.`);
        if (txns.length > 0) console.log('Last txn:', txns[txns.length - 1]);

        // 2. Add Test Transaction
        console.log('📝 Adding TEST transaction...');
        const newTxn = {
            date: new Date().toISOString().split('T')[0],
            type: 'IN',
            amount: 100,
            description: 'Test Script Deposit'
        };
        const result = await addPettyCashTransaction(newTxn);
        console.log('✅ Transaction Added:', result);

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

test();
