import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../database/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vss_dc';

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const users = ['kannan', 'vikash'];
        const password = 'admin';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        for (const username of users) {
            const existing = await User.findOne({ username });
            if (!existing) {
                const newUser = new User({ username, password: hashedPassword });
                await newUser.save();
                console.log(`User ${username} created`);
            } else {
                console.log(`User ${username} already exists`);
            }
        }

        console.log('Seeding completed');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seed();
