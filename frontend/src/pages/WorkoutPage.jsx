import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePose } from '../hooks/usePose';
import { useRepCounter } from '../hooks/useRepCounter';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import api from '../api/axios';
import Navbar from '../components/Navbar';

export default function WorkoutPage() {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const [exerciseType, setExerciseType] = useState('squat');
    const [isActive, setIsActive] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [sessionDone, setSessionDone] = useState(false);
    const [sessionResult, setSessionResult] = useState(null);

    const { reps, accuracy, feedback, phase, processLandmarks, reset } = useRepCounter(exerciseType);
    const { speak } = useVoiceAssistant();

    // Voice triggers for reps and significant feedback
    useEffect(() => {
        if (reps > 0) speak(reps.toString(), true);
    }, [reps, speak]);

    useEffect(() => {
        if (feedback && feedback.includes('⚠')) {
            speak(feedback.replace('⚠', ''), false);
        } else if (feedback && feedback.includes('✔')) {
            // speak(feedback.replace('✔', ''), false); // Optional: speak success cues
        }
    }, [feedback, speak]);

    // Live elapsed timer
    useEffect(() => {
        let interval;
        if (isActive && sessionStartTime) {
            interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, sessionStartTime]);

    // Handle each MediaPipe pose result frame
    const handlePoseResults = useCallback(
        (results) => {
            if (results?.poseLandmarks) {
                processLandmarks(results.poseLandmarks);
            }
        },
        [processLandmarks]
    );

    // Initialise camera + pose
    usePose(videoRef, canvasRef, handlePoseResults, isActive);

    // Start camera manually via getUserMedia
    const startCamera = async () => {
        setCameraError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' },
                audio: false,
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setIsActive(true);
            setSessionStartTime(Date.now());
            speak(`Starting ${exerciseType} session. Good luck!`, true);
        } catch (err) {
            setCameraError(
                err.name === 'NotAllowedError'
                    ? '🚫 Camera permission denied. Please allow camera access in your browser settings.'
                    : `❌ Camera error: ${err.message}`
            );
        }
    };

    // Stop camera tracks
    const stopCamera = () => {
        setIsActive(false);
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
            videoRef.current.srcObject = null;
        }
    };

    // Generate feedback summary
    const generateSummary = (acc, r) => {
        const type = exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1);
        if (acc >= 90) return `Excellent ${type} form! ${r} perfect reps completed.`;
        if (acc >= 75) return `Good work! ${r} ${type}s with solid form.`;
        return `${r} ${type}s completed. Keep practicing your form!`;
    };

    // End session and submit to backend
    const handleEndSession = async () => {
        stopCamera();
        setSubmitting(true);
        const duration = elapsedTime;
        speak('Session complete. Great work today!', true);

        try {
            const payload = {
                exerciseType,
                repsCompleted: reps,
                accuracyScore: accuracy,
                duration,
                feedbackSummary: generateSummary(accuracy, reps),
            };

            const { data } = await api.post('/session/complete', payload);
            setSessionResult({
                ...payload,
                improvement: data.data.improvementPercentage,
                streak: data.data.currentStreak,
            });
            setSessionDone(true);
        } catch (err) {
            console.error('Session submit error:', err);
            setSessionDone(true);
            setSessionResult({ exerciseType, repsCompleted: reps, accuracyScore: accuracy, duration, improvement: 0, streak: 0 });
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const getPhaseColor = () => {
        if (phase === 'DOWN') return '#ff4d6d';
        if (phase === 'UP') return '#00f5ff';
        return '#94a3b8';
    };

    // ── Session Complete Summary ─────────────────────────────────
    if (sessionDone && sessionResult) {
        return (
            <div className="page-shell">
                <Navbar />
                <main className="session-result">
                    <div className="result-card">
                        <div className="result-icon">🎉</div>
                        <h1>{exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)} Session Result</h1>
                        <p className="result-summary">{generateSummary(sessionResult.accuracyScore, sessionResult.repsCompleted)}</p>

                        <div className="result-stats">
                            <div className="result-stat"><span className="rs-value">{sessionResult.repsCompleted}</span><span className="rs-label">Reps</span></div>
                            <div className="result-stat"><span className="rs-value">{sessionResult.accuracyScore}%</span><span className="rs-label">Accuracy</span></div>
                            <div className="result-stat"><span className="rs-value">{formatTime(sessionResult.duration)}</span><span className="rs-label">Duration</span></div>
                            <div className="result-stat">
                                <span className="rs-value" style={{ color: sessionResult.improvement >= 0 ? '#22c55e' : '#ef4444' }}>
                                    {sessionResult.improvement >= 0 ? '+' : ''}{sessionResult.improvement}%
                                </span>
                                <span className="rs-label">Improvement</span>
                            </div>
                            <div className="result-stat"><span className="rs-value">🔥 {sessionResult.streak}</span><span className="rs-label">Day Streak</span></div>
                        </div>

                        <div className="result-actions">
                            <button className="btn btn-primary" onClick={() => { reset(); setSessionDone(false); setElapsedTime(0); }}>
                                🔄 New Session
                            </button>
                            <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                                📊 View Dashboard
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // ── Main Workout UI ──────────────────────────────────────────
    return (
        <div className="page-shell">
            <Navbar />
            <main className="workout-page">
                <div className="workout-header">
                    <div className="header-left">
                        <h1>🏋️ Tracking: {exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)}</h1>
                        {isActive && <span className="live-badge">● LIVE</span>}
                    </div>

                    {!isActive && (
                        <div className="exercise-selector">
                            <button
                                className={`selector-btn ${exerciseType === 'squat' ? 'active' : ''}`}
                                onClick={() => setExerciseType('squat')}
                            >
                                Squats
                            </button>
                            <button
                                className={`selector-btn ${exerciseType === 'pushup' ? 'active' : ''}`}
                                onClick={() => setExerciseType('pushup')}
                            >
                                Pushups
                            </button>
                            <button
                                className={`selector-btn ${exerciseType === 'lunge' ? 'active' : ''}`}
                                onClick={() => setExerciseType('lunge')}
                            >
                                Lunges
                            </button>
                        </div>
                    )}
                </div>

                <div className="workout-layout">
                    {/* Webcam + Canvas */}
                    <div className="camera-container">
                        {!isActive && !cameraError && (
                            <div className="camera-placeholder">
                                <div className="camera-icon">📷</div>
                                <p>Ready to track your {exerciseType}s?</p>
                                <p className="camera-hint">Ensure your full body is visible in the frame</p>
                            </div>
                        )}
                        {cameraError && (
                            <div className="camera-error">
                                <p>{cameraError}</p>
                            </div>
                        )}
                        <video
                            ref={videoRef}
                            className="workout-video"
                            playsInline
                            muted
                            style={{ display: isActive ? 'block' : 'none', transform: 'scaleX(-1)' }}
                        />
                        <canvas
                            ref={canvasRef}
                            className="pose-canvas"
                            style={{ display: isActive ? 'block' : 'none', transform: 'scaleX(-1)' }}
                        />

                        <div className="camera-controls">
                            {!isActive ? (
                                <button className="btn btn-primary btn-lg" onClick={startCamera}>
                                    🎥 Start Workout
                                </button>
                            ) : (
                                <button
                                    className="btn btn-danger btn-lg"
                                    onClick={handleEndSession}
                                    disabled={submitting}
                                >
                                    {submitting ? <span className="spinner" /> : '⏹ End Session'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Feedback Panel */}
                    <div className="feedback-panel">
                        <div className="panel-card timer-card">
                            <div className="timer-display">{formatTime(elapsedTime)}</div>
                            <div className="timer-label">Session Time</div>
                        </div>

                        {isActive && (
                            <div className="panel-card phase-card" style={{ borderColor: getPhaseColor() }}>
                                <div className="phase-indicator" style={{ color: getPhaseColor() }}>
                                    {phase === 'DOWN' ? '⬇ DOWN' : phase === 'UP' ? '⬆ UP' : '⏸ READY'}
                                </div>
                            </div>
                        )}

                        <div className="panel-card reps-card">
                            <div className="big-number">{reps}</div>
                            <div className="panel-label">REPS</div>
                        </div>

                        <div className="panel-card accuracy-card">
                            <div
                                className="big-number"
                                style={{ color: accuracy >= 80 ? '#22c55e' : accuracy >= 60 ? '#f59e0b' : '#ef4444' }}
                            >
                                {accuracy}%
                            </div>
                            <div className="panel-label">ACCURACY</div>
                            <div className="accuracy-bar">
                                <div
                                    className="accuracy-fill"
                                    style={{
                                        width: `${accuracy}%`,
                                        background: accuracy >= 80 ? '#22c55e' : accuracy >= 60 ? '#f59e0b' : '#ef4444',
                                    }}
                                />
                            </div>
                        </div>

                        <div className="panel-card feedback-card">
                            <div className="feedback-message">{feedback}</div>
                            <div className="panel-label">ASSISTANT FEEDBACK</div>
                        </div>

                        {!isActive && (
                            <div className="panel-card instructions-card">
                                <h4>Voice Assistant Active 🔊</h4>
                                <p>The assistant will count your reps and help with form corrections in real-time.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* MediaPipe CDN Scripts */}
                {isActive && (
                    <>
                        <script
                            key="mp-pose"
                            src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js"
                            crossOrigin="anonymous"
                            async
                        />
                        <script
                            key="mp-drawing"
                            src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
                            crossOrigin="anonymous"
                            async
                        />
                        <script
                            key="mp-camera"
                            src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
                            crossOrigin="anonymous"
                            async
                        />
                    </>
                )}
            </main>
        </div>
    );
}
