import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect to local MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/vss_dc', {
    serverSelectionTimeoutMS: 5000,
    family: 4
})
    .then(() => console.log('✅ Connected to MongoDB (vss_dc)'))
    .catch(err => console.error('MongoDB connection error:', err));

// Test Home Route
app.get('/', (req, res) => {
    res.send('VSS DC Auth Server Running');
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Success
        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Admin Initial Registration Endpoint (Development Use Only)
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // See if any user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
