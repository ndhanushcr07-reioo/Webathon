import { useCallback, useRef } from 'react';

/**
 * useVoiceAssistant — Provides audio feedback using Web Speech API
 */
export function useVoiceAssistant() {
    const lastSpokenRef = useRef('');
    const lastSpokenTime = useRef(0);

    const speak = useCallback((text, priority = false) => {
        if (!('speechSynthesis' in window)) return;

        // Throttling to prevent audio overlap/spam
        const now = Date.now();
        if (!priority && text === lastSpokenRef.current && now - lastSpokenTime.current < 3000) {
            return;
        }

        // Cancel previous speech if priority
        if (priority) {
            window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        window.speechSynthesis.speak(utterance);
        lastSpokenRef.current = text;
        lastSpokenTime.current = now;
    }, []);

    return { speak };
}
