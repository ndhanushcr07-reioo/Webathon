import { useEffect, useRef, useCallback } from 'react';

/**
 * usePose — Initialises MediaPipe Pose via CDN and runs inference on each video frame
 * @param {React.RefObject} videoRef - ref to <video> element
 * @param {React.RefObject} canvasRef - ref to <canvas> overlay element
 * @param {Function} onResults - callback(results) called per frame
 * @param {boolean} active - whether pose detection should run
 */
export function usePose(videoRef, canvasRef, onResults, active) {
    const poseRef = useRef(null);
    const cameraRef = useRef(null);
    const animRef = useRef(null);

    const drawResults = useCallback(
        (results) => {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            if (!canvas || !video) return;

            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (!results.poseLandmarks) return;

            // Draw skeleton connections
            const CONNECTIONS = window.POSE_CONNECTIONS || [];
            ctx.strokeStyle = '#00f5ff';
            ctx.lineWidth = 2;

            CONNECTIONS.forEach(([startIdx, endIdx]) => {
                const start = results.poseLandmarks[startIdx];
                const end = results.poseLandmarks[endIdx];
                if (!start || !end) return;
                ctx.beginPath();
                ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
                ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
                ctx.stroke();
            });

            // Draw landmark dots
            results.poseLandmarks.forEach((lm) => {
                ctx.beginPath();
                ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 5, 0, 2 * Math.PI);
                ctx.fillStyle = '#ff4d6d';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        },
        [videoRef, canvasRef]
    );

    useEffect(() => {
        if (!active) {
            if (cameraRef.current) {
                cameraRef.current.stop();
                cameraRef.current = null;
            }
            return;
        }

        // MediaPipe is loaded via CDN script tags in index.html
        const initPose = () => {
            if (!window.Pose || !window.Camera) {
                setTimeout(initPose, 200);
                return;
            }

            const pose = new window.Pose({
                locateFile: (file) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
            });

            pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            pose.onResults((results) => {
                drawResults(results);
                onResults(results);
            });

            poseRef.current = pose;

            const camera = new window.Camera(videoRef.current, {
                onFrame: async () => {
                    if (poseRef.current && videoRef.current) {
                        await poseRef.current.send({ image: videoRef.current });
                    }
                },
                width: 640,
                height: 480,
            });

            camera.start();
            cameraRef.current = camera;
        };

        initPose();

        return () => {
            if (cameraRef.current) {
                cameraRef.current.stop();
                cameraRef.current = null;
            }
            if (poseRef.current) {
                poseRef.current.close();
                poseRef.current = null;
            }
        };
    }, [active, drawResults, onResults, videoRef]);
}
