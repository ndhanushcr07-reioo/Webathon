const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    exerciseType: {
        type: String,
        required: true,
        trim: true,
    },
    repsCompleted: {
        type: Number,
        default: 0,
    },
    accuracyScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
    },
    duration: {
        type: Number, // seconds
        default: 0,
    },
    improvementPercentage: {
        type: Number,
        default: 0,
    },
    feedbackSummary: {
        type: String,
        default: '',
    },
    // Streak data stored per session
    streakAtSession: {
        type: Number,
        default: 1,
    },
    date: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

// Index for efficient querying
sessionSchema.index({ userId: 1, date: -1 });
sessionSchema.index({ userId: 1, exerciseType: 1, date: -1 });

module.exports = mongoose.model('Session', sessionSchema);
