const Session = require('../models/Session');

// ─── COMPLETE SESSION ────────────────────────────────────────
// POST /api/session/complete
exports.completeSession = async (req, res) => {
    try {
        const { exerciseType, repsCompleted, accuracyScore, duration, feedbackSummary } = req.body;
        const userId = req.user.id;

        if (!exerciseType) {
            return res.status(400).json({ success: false, message: 'exerciseType is required.' });
        }

        // ── Improvement Calculation ──────────────────────────────
        const previousSession = await Session.findOne({ userId, exerciseType })
            .sort({ date: -1 })
            .limit(1);

        let improvementPercentage = 0;
        if (previousSession) {
            improvementPercentage = parseFloat(
                (accuracyScore - previousSession.accuracyScore).toFixed(2)
            );
        }

        // ── Streak Calculation ───────────────────────────────────
        // Get the most recent session (any exercise) to check consecutive days
        const lastAnySession = await Session.findOne({ userId })
            .sort({ date: -1 })
            .limit(1);

        let streak = 1;
        if (lastAnySession) {
            const lastDate = new Date(lastAnySession.date);
            const today = new Date();

            // Normalize to date-only (strip time)
            const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
            const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

            const diffDays = Math.round((todayDay - lastDay) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                // Same day — keep existing streak
                streak = lastAnySession.streakAtSession;
            } else if (diffDays === 1) {
                // Consecutive day — increment streak
                streak = lastAnySession.streakAtSession + 1;
            } else {
                // Skipped a day — reset streak to 1
                streak = 1;
            }
        }

        // ── Save Session ─────────────────────────────────────────
        const session = await Session.create({
            userId,
            exerciseType,
            repsCompleted: repsCompleted || 0,
            accuracyScore: accuracyScore || 0,
            duration: duration || 0,
            improvementPercentage,
            feedbackSummary: feedbackSummary || '',
            streakAtSession: streak,
        });

        res.status(201).json({
            success: true,
            message: 'Session saved successfully.',
            data: {
                sessionId: session._id,
                improvementPercentage,
                currentStreak: streak,
            },
        });
    } catch (err) {
        console.error('Session error:', err);
        res.status(500).json({ success: false, message: 'Server error saving session.' });
    }
};

// ─── GET SESSION HISTORY ─────────────────────────────────────
// GET /api/session/history
exports.getHistory = async (req, res) => {
    try {
        const sessions = await Session.find({ userId: req.user.id })
            .sort({ date: -1 })
            .limit(20);

        res.json({ success: true, data: sessions });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error fetching history.' });
    }
};
