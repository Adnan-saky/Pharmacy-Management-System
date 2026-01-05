import sheetsService from '../src/services/googleSheetsService.backend.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const createAdmin = async () => {
    try {
        console.log('🔄 Connecting to Google Sheets...');
        await sheetsService.initializeGoogleSheets();

        // Check if users exist
        let users = [];
        try {
            users = await sheetsService.getUsers();
        } catch (e) {
            console.log('⚠️ Users sheet might be empty or missing, continuing...');
        }

        if (users.length > 0) {
            console.log('ℹ️ Users already exist in the database.');
            const admin = users.find(u => u.username === 'admin');
            if (admin) {
                console.log('✅ Admin user "admin" already exists.');
                process.exit(0);
            }
        }

        console.log('🆕 Creating initial Admin user...');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const adminUser = {
            username: 'admin',
            password: hashedPassword,
            role: 'admin',
            full_name: 'System Administrator'
        };

        await sheetsService.addUser(adminUser);
        console.log('✅ Admin user created successfully!');
        console.log('👤 Username: admin');
        console.log('🔑 Password: admin123');

    } catch (error) {
        console.error('❌ Failed to create admin user:', error);
        process.exit(1);
    }
};

createAdmin();
