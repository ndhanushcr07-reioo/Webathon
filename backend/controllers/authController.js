const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

// ─── SIGNUP ─────────────────────────────────────────────────
// POST /api/auth/signup
exports.signup = async (req, res) => {
    try {
        const { name, email, password, goal, dietType, budgetLevel } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Email already in use.' });
        }

        const user = await User.create({
            name,
            email,
            passwordHash: password, // pre-save hook will hash it
            goal: goal || 'general_fitness',
            dietType: dietType || 'any',
            budgetLevel: budgetLevel || 'medium',
            profileComplete: !!(goal && dietType && budgetLevel),
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    goal: user.goal,
                    dietType: user.dietType,
                    budgetLevel: user.budgetLevel,
                    profileComplete: user.profileComplete,
                },
            },
        });
    } catch (err) {
        console.error('Signup error details:', {
            message: err.message,
            stack: err.stack,
            body: req.body
        });
        res.status(500).json({ success: false, message: `Server error during signup: ${err.message}` });
    }
};

// ─── LOGIN ──────────────────────────────────────────────────
// POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful.',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    goal: user.goal,
                    dietType: user.dietType,
                    budgetLevel: user.budgetLevel,
                    profileComplete: user.profileComplete,
                },
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

// ─── UPDATE PROFILE ─────────────────────────────────────────
// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
    try {
        const { goal, dietType, budgetLevel } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { goal, dietType, budgetLevel, profileComplete: true },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Profile updated.',
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                goal: user.goal,
                dietType: user.dietType,
                budgetLevel: user.budgetLevel,
                profileComplete: user.profileComplete,
            },
        });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ success: false, message: 'Server error updating profile.' });
    }
};

// ─── GET ME ─────────────────────────────────────────────────
// GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash');
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
