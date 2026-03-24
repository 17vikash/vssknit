import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vss_dc';

async function listUsers() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected.');
        console.log('Checking database:', mongoose.connection.name);

        const users = await User.find({});
        console.log('Query result count:', users.length);
        
        if (users.length === 0) {
            console.log('No users found in the database.');
        } else {
            console.log('\n--- Registered Users ---');
            users.forEach((u, i) => console.log(`${i + 1}. Username: ${u.username} (ID: ${u._id})`));
            console.log('------------------------\n');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

listUsers();
