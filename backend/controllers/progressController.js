const Session = require('../models/Session');

// ─── PROGRESS SUMMARY ────────────────────────────────────────
// GET /api/progress/summary
exports.getSummary = async (req, res) => {
    try {
        const userId = req.user.id;

        const sessions = await Session.find({ userId }).sort({ date: -1 });

        if (!sessions.length) {
            return res.json({
                success: true,
                data: {
                    consistencyStreak: 0,
                    averageAccuracy: 0,
                    bestSessionScore: 0,
                    totalWorkoutsCompleted: 0,
                },
            });
        }

        const totalWorkoutsCompleted = sessions.length;
        const consistencyStreak = sessions[0]?.streakAtSession || 0;
        const averageAccuracy = parseFloat(
            (sessions.reduce((sum, s) => sum + s.accuracyScore, 0) / totalWorkoutsCompleted).toFixed(1)
        );
        const bestSessionScore = Math.max(...sessions.map((s) => s.accuracyScore));

        res.json({
            success: true,
            data: {
                consistencyStreak,
                averageAccuracy,
                bestSessionScore,
                totalWorkoutsCompleted,
            },
        });
    } catch (err) {
        console.error('Progress summary error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ─── PROGRESS CHARTS ─────────────────────────────────────────
// GET /api/progress/charts
exports.getCharts = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;

        const sessions = await Session.find({ userId })
            .sort({ date: 1 }) // ascending for chart ordering
            .limit(limit);

        const accuracyTrend = sessions.map((s) => s.accuracyScore);
        const repsTrend = sessions.map((s) => s.repsCompleted);
        const dates = sessions.map((s) => new Date(s.date).toISOString().split('T')[0]);
        const exercises = sessions.map((s) => s.exerciseType);

        res.json({
            success: true,
            data: {
                accuracyTrend,
                repsTrend,
                dates,
                exercises,
            },
        });
    } catch (err) {
        console.error('Progress charts error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
