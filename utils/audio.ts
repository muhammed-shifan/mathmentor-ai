// utils/audio.ts
let audioContext: AudioContext | null = null;

// Initialize AudioContext on the first user gesture
const getAudioContext = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

const playTone = (
    ctx: AudioContext,
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    startTime: number = ctx.currentTime
) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, startTime);

    const attackTime = 0.01;
    gainNode.gain.setValueAtTime(0.001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.4, startTime + attackTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.01);
};


export const playCorrectSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    playTone(ctx, 600, 0.1, 'triangle', ctx.currentTime);
    playTone(ctx, 800, 0.1, 'triangle', ctx.currentTime + 0.05);
};

export const playIncorrectSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    playTone(ctx, 200, 0.15, 'square');
};

export const playTickSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    playTone(ctx, 1000, 0.05, 'triangle');
};

export const playGameOverSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    playTone(ctx, 400, 0.1, 'sine', ctx.currentTime);
    playTone(ctx, 300, 0.1, 'sine', ctx.currentTime + 0.1);
    playTone(ctx, 200, 0.15, 'sine', ctx.currentTime + 0.2);
};

export const playHighScoreSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const startTime = ctx.currentTime;
    playTone(ctx, 523.25, 0.1, 'sine', startTime); // C5
    playTone(ctx, 659.25, 0.1, 'sine', startTime + 0.1); // E5
    playTone(ctx, 783.99, 0.1, 'sine', startTime + 0.2); // G5
    playTone(ctx, 1046.50, 0.2, 'sine', startTime + 0.3); // C6
};
