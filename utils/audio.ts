class AudioEngine {
    private ctx: AudioContext | null = null;

    private init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
        try {
            this.init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.error("Audio playback failed", e);
        }
    }

    public playTick() {
        // High, short "pip" for countdown (3, 2, 1)
        this.playTone(880, 'sine', 0.1, 0.05);
    }

    public playStart() {
        // Higher, longer "ping" for step start / Go
        this.playTone(1760, 'sine', 0.4, 0.1);
    }

    public playComplete() {
        // Pleasant chime for finish
        try {
            this.init();
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            
            const playNote = (f: number, startTime: number) => {
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, startTime);
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.0);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(startTime);
                osc.stop(startTime + 1.0);
            };

            playNote(523.25, t); // C5
            playNote(659.25, t + 0.15); // E5
            playNote(783.99, t + 0.3); // G5
            playNote(1046.50, t + 0.45); // C6
        } catch (e) {
            console.error(e);
        }
    }
}

export const audioEngine = typeof window !== 'undefined' ? new AudioEngine() : null;
