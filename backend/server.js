require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ── Route Imports ─────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/session');
const progressRoutes = require('./routes/progress');
const nutritionRoutes = require('./routes/nutrition');
const motivationRoutes = require('./routes/motivation');

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Diagnostic middleware
app.use((req, res, next) => {
    if (req.method === 'POST') {
        console.log(`📡 [${req.method}] ${req.url} | Body:`, req.body);
    }
    next();
});

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Adaptive Fitness API is running 🏋️', timestamp: new Date() });
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/motivation', motivationRoutes);

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── MongoDB Connection + Server Start ─────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/adaptive_fitness';

const startServer = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected successfully');
    } catch (err) {
        console.warn('⚠️ Local MongoDB connection failed, attempting to start in-memory database...');
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            const uri = mongod.getUri();
            await mongoose.connect(uri);
            console.log('✅ In-memory MongoDB started and connected');
        } catch (memErr) {
            console.error('❌ Failed to start in-memory MongoDB:', memErr.message);
            process.exit(1);
        }
    }

    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📡 API Base: http://localhost:${PORT}/api`);
    });
};

startServer();

module.exports = app;
