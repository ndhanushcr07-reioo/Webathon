const mongoose = require('mongoose');

const nutritionLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    items: [{
        name: { type: String, required: true },
        calories: { type: Number, default: 0 },
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fats: { type: Number, default: 0 }
    }]
}, { timestamps: true });

// Index for quick daily lookup
nutritionLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('NutritionLog', nutritionLogSchema);
