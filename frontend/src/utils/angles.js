/**
 * Calculate the angle at point B formed by vectors BA and BC
 * Uses dot product formula for 2D/3D vectors
 * @param {Object} a - {x, y} landmark A
 * @param {Object} b - {x, y} landmark B (vertex)
 * @param {Object} c - {x, y} landmark C
 * @returns {number} angle in degrees (0–180)
 */
export function calculateAngle(a, b, c) {
    const radians =
        Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360.0 - angle;
    return angle;
}

/**
 * Get normalized landmark coordinates from MediaPipe results
 * @param {Array} landmarks - MediaPipe pose landmarks array
 * @param {number} index - landmark index
 * @returns {{x: number, y: number, visibility: number}}
 */
export function getLandmark(landmarks, index) {
    if (!landmarks || !landmarks[index]) return { x: 0, y: 0, visibility: 0 };
    return {
        x: landmarks[index].x,
        y: landmarks[index].y,
        visibility: landmarks[index].visibility || 0,
    };
}

/**
 * MediaPipe Pose landmark indices reference
 */
export const POSE_LANDMARKS = {
    NOSE: 0,
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28,
};

/**
 * Analyse squat form:
 *  - Knee angle: hip-knee-ankle
 *  - Back alignment: shoulder-hip angle from vertical
 */
export function analyseSquat(landmarks) {
    const leftHip = getLandmark(landmarks, POSE_LANDMARKS.LEFT_HIP);
    const leftKnee = getLandmark(landmarks, POSE_LANDMARKS.LEFT_KNEE);
    const leftAnkle = getLandmark(landmarks, POSE_LANDMARKS.LEFT_ANKLE);
    const leftShoulder = getLandmark(landmarks, POSE_LANDMARKS.LEFT_SHOULDER);

    const rightHip = getLandmark(landmarks, POSE_LANDMARKS.RIGHT_HIP);
    const rightKnee = getLandmark(landmarks, POSE_LANDMARKS.RIGHT_KNEE);
    const rightAnkle = getLandmark(landmarks, POSE_LANDMARKS.RIGHT_ANKLE);
    const rightShoulder = getLandmark(landmarks, POSE_LANDMARKS.RIGHT_SHOULDER);

    // Average left and right for stability
    const kneeAngle =
        (calculateAngle(leftHip, leftKnee, leftAnkle) +
            calculateAngle(rightHip, rightKnee, rightAnkle)) /
        2;

    // Back angle: shoulder vs hip vertical alignment
    const backAngle =
        (calculateAngle(leftShoulder, leftHip, leftKnee) +
            calculateAngle(rightShoulder, rightHip, rightKnee)) /
        2;

    return { kneeAngle, backAngle };
}

/**
 * Analyse pushup form:
 *  - Elbow angle: shoulder-elbow-wrist
 *  - Body alignment: shoulder-hip-knee (should be close to 180)
 */
export function analysePushup(landmarks) {
    const leftShoulder = getLandmark(landmarks, POSE_LANDMARKS.LEFT_SHOULDER);
    const leftElbow = getLandmark(landmarks, POSE_LANDMARKS.LEFT_ELBOW);
    const leftWrist = getLandmark(landmarks, POSE_LANDMARKS.LEFT_WRIST);
    const leftHip = getLandmark(landmarks, POSE_LANDMARKS.LEFT_HIP);
    const leftKnee = getLandmark(landmarks, POSE_LANDMARKS.LEFT_KNEE);

    const rightShoulder = getLandmark(landmarks, POSE_LANDMARKS.RIGHT_SHOULDER);
    const rightElbow = getLandmark(landmarks, POSE_LANDMARKS.RIGHT_ELBOW);
    const rightWrist = getLandmark(landmarks, POSE_LANDMARKS.RIGHT_WRIST);
    const rightHip = getLandmark(landmarks, POSE_LANDMARKS.RIGHT_HIP);
    const rightKnee = getLandmark(landmarks, POSE_LANDMARKS.RIGHT_KNEE);

    const elbowAngle =
        (calculateAngle(leftShoulder, leftElbow, leftWrist) +
            calculateAngle(rightShoulder, rightElbow, rightWrist)) /
        2;

    const bodyAlignment =
        (calculateAngle(leftShoulder, leftHip, leftKnee) +
            calculateAngle(rightShoulder, rightHip, rightKnee)) /
        2;

    return { elbowAngle, bodyAlignment };
}

/**
 * Analyse lunge form:
 *  - Front knee angle: hip-knee-ankle (should reach ~90)
 */
export function analyseLunge(landmarks) {
    const leftHip = getLandmark(landmarks, POSE_LANDMARKS.LEFT_HIP);
    const leftKnee = getLandmark(landmarks, POSE_LANDMARKS.LEFT_KNEE);
    const leftAnkle = getLandmark(landmarks, POSE_LANDMARKS.LEFT_ANKLE);

    const rightHip = getLandmark(landmarks, POSE_LANDMARKS.RIGHT_HIP);
    const rightKnee = getLandmark(landmarks, POSE_LANDMARKS.RIGHT_KNEE);
    const rightAnkle = getLandmark(landmarks, POSE_LANDMARKS.RIGHT_ANKLE);

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    // For lunges, we track whichever knee is bending more (the forward one)
    const kneeAngle = Math.min(leftKneeAngle, rightKneeAngle);

    return { kneeAngle };
}

/**
 * Pairwise skeleton connections for drawing
 */
export const SKELETON_CONNECTIONS = [
    [11, 12], // shoulders
    [11, 13], [13, 15], // left arm
    [12, 14], [14, 16], // right arm
    [11, 23], [12, 24], // torso
    [23, 24], // hips
    [23, 25], [25, 27], // left leg
    [24, 26], [26, 28], // right leg
];
