import { useState, useRef, useCallback } from 'react';
import { analyseSquat, analysePushup, analyseLunge } from '../utils/angles';

// ── Thresholds ────────────────────────────────────────────────
const THRESHOLDS = {
    squat: { down: 90, up: 160, deep: 65 },
    pushup: { down: 90, up: 150, deep: 70 },
    lunge: { down: 100, up: 160, deep: 80 },
};

/**
 * useRepCounter — Multi-exercise rep counter state machine
 * Supports: 'squat' | 'pushup' | 'lunge'
 */
export function useRepCounter(exerciseType = 'squat') {
    const [reps, setReps] = useState(0);
    const [accuracy, setAccuracy] = useState(100);
    const [feedback, setFeedback] = useState('Get into position…');
    const [phase, setPhase] = useState('IDLE');

    const stateRef = useRef('IDLE');
    const repAccuracies = useRef([]);

    const processLandmarks = useCallback((landmarks) => {
        if (!landmarks || landmarks.length === 0) return;

        const config = THRESHOLDS[exerciseType] || THRESHOLDS.squat;
        let mainAngle = 0;
        let alignmentAngle = 180;
        let currentFeedback = '';
        let repAccuracy = 100;

        // ── Exercise Specific Analysis ───────────────────────────
        if (exerciseType === 'squat') {
            const { kneeAngle, backAngle } = analyseSquat(landmarks);
            mainAngle = kneeAngle;
            alignmentAngle = backAngle;
            if (alignmentAngle < 140) {
                currentFeedback = '⚠ Keep your back straight!';
                repAccuracy -= 20;
            }
        } else if (exerciseType === 'pushup') {
            const { elbowAngle, bodyAlignment } = analysePushup(landmarks);
            mainAngle = elbowAngle;
            alignmentAngle = bodyAlignment;
            if (alignmentAngle < 150) {
                currentFeedback = '⚠ Keep your body level!';
                repAccuracy -= 20;
            }
        } else if (exerciseType === 'lunge') {
            const { kneeAngle } = analyseLunge(landmarks);
            mainAngle = kneeAngle;
            // Alignment check less critical for basic lunge tracking
        }

        // ── Phase detection ──────────────────────────────────────
        const currentPhase = stateRef.current;

        if (mainAngle > config.up) {
            if (currentPhase === 'DOWN') {
                stateRef.current = 'UP';
                setPhase('UP');

                // Depth check
                const depth = Math.max(0, Math.min(100, ((config.up - mainAngle) / (config.up - config.deep)) * 100));
                repAccuracy = Math.max(0, repAccuracy - (depth < 30 ? 20 : 0));

                repAccuracies.current.push(repAccuracy);
                const avgAccuracy = Math.round(
                    repAccuracies.current.reduce((a, b) => a + b, 0) / repAccuracies.current.length
                );

                setReps((prev) => prev + 1);
                setAccuracy(avgAccuracy);
                setFeedback('✔ Good rep! Keep going!');
                return;
            }
            if (currentPhase === 'IDLE') {
                stateRef.current = 'UP';
                setPhase('UP');
                setFeedback(`Ready! Start your ${exerciseType}s ⬇`);
            }
        } else if (mainAngle < config.down) {
            if (currentPhase !== 'DOWN') {
                stateRef.current = 'DOWN';
                setPhase('DOWN');
                setFeedback(currentFeedback || '✔ Lower! Now push up ⬆');
                return;
            }
        } else {
            if (!currentFeedback) {
                setFeedback(mainAngle < (config.down + 20) ? '⬇ Go a bit lower' : 'Moving…');
            }
        }

        if (currentFeedback) setFeedback(currentFeedback);
    }, [exerciseType]);

    const reset = useCallback(() => {
        setReps(0);
        setAccuracy(100);
        setFeedback('Get into position…');
        setPhase('IDLE');
        stateRef.current = 'IDLE';
        repAccuracies.current = [];
    }, []);

    return { reps, accuracy, feedback, phase, processLandmarks, reset };
}
