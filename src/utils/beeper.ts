'use client';

class Beeper {

    private audioContext: AudioContext | null = null;
    private gainNode: GainNode | null = null;
    private beepNode: OscillatorNode | null = null;

    private static instance: Beeper;

    private singleBeepAudio: HTMLAudioElement | null = null;
    private tripleBeepAudio: HTMLAudioElement | null = null;
    private scrollBeepAudio: HTMLAudioElement | null = null;

    constructor(audioContext?: AudioContext) {
        if (audioContext) {
            this.audioContext = audioContext;
            this.gainNode = audioContext.createGain();
            this.beepNode = audioContext.createOscillator();

            if (audioContext.state === 'suspended') audioContext.resume();

            this.beepNode.start();
            this.gainNode.gain.value = 0;
        }
    }

    _beep(frequency: number, type: OscillatorType, volume: number, beepCount: number = 1) {
        if (!this.audioContext || !this.beepNode || !this.gainNode) return;

        if (this.audioContext.state === 'suspended') this.audioContext.resume();

        const gain = (0.10 * volume);


        this.beepNode.frequency.value = frequency;
        this.beepNode.type = type;

        const current = this.audioContext.currentTime;

        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, current);
        this.gainNode.gain.linearRampToValueAtTime(gain, current + 0.005);

        for (let i = 0; i < beepCount; i++) {
            const current = (this.audioContext.currentTime + (i * 0.15));

            this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, current);
            this.gainNode.gain.linearRampToValueAtTime(gain, current + 0.005);

            const afterOffset = (current + 0.03)/* + (beepCount * 0.05)*/;

            this.gainNode.gain.setValueAtTime(gain, afterOffset);
            this.gainNode.gain.linearRampToValueAtTime(0, afterOffset + 0.005);

            //     const nextOffset = (afterOffset + 0.03) + (beepCount * 0.05);

            //     this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, nextOffset);
            //     this.gainNode.gain.linearRampToValueAtTime(gain, nextOffset + 0.005);
        }
        // const afterOffset = (current + 0.03);

        // this.gainNode.gain.setValueAtTime(gain, afterOffset);
        // this.gainNode.gain.linearRampToValueAtTime(0, afterOffset + 0.005);
    }

    singleBeep(count: number = 0 /* not-in-use! */, volume: number = 1, isBeeperOn?: boolean) {
        if (!isBeeperOn) return;


        if (this.audioContext && this.beepNode && this.gainNode) {

            this._beep(2100, 'square', volume);

            return true;
        }

        if (!this.singleBeepAudio) this.singleBeepAudio = new Audio('/audio/beep/beep_new_01.mp3');

        // this.singleBeepAudio.volume = 0.05;

        this.singleBeepAudio.volume = (0.1 * volume);

        this.singleBeepAudio.currentTime = 0;
        this.singleBeepAudio.play();

        return true;
    }

    tripleBeep(volume: number = 1, isBeeperOn?: boolean) {
        if (!isBeeperOn) return;

         if (this.audioContext && this.beepNode && this.gainNode) {

            this._beep(2100, 'square', volume, 3);

            return true;
        }

        if (!this.tripleBeepAudio) this.tripleBeepAudio = new Audio('/audio/beep/beep_new_03.mp3');

        // this.tripleBeepAudio.volume = 0.05;

        this.tripleBeepAudio.volume = (0.1 * volume);

        this.tripleBeepAudio.currentTime = 0;
        this.tripleBeepAudio.play();

        return true;
    }

    scrollBeep(volume: number = 1, isBeeperOn?: boolean) {
        if (!isBeeperOn) return;

        if (this.audioContext && this.beepNode && this.gainNode) {

            this._beep(1000, 'square', volume);

            return true;
        }

        if (!this.scrollBeepAudio) this.scrollBeepAudio = new Audio('/audio/beep/beep_new_scroll.mp3');

        // this.scrollBeepAudio.volume = 0.05;

        this.scrollBeepAudio.volume = (0.1 * volume);

        this.scrollBeepAudio.currentTime = 0;
        this.scrollBeepAudio.play();

        return true;
    }

    connectAudioContext(audioContext?: AudioContext, node?: AudioNode) {
        if (audioContext) {
            this.audioContext = audioContext;
            this.gainNode = this.audioContext.createGain();
            this.beepNode = this.audioContext.createOscillator();

            if (this.audioContext.state === 'suspended') this.audioContext.resume();

            this.beepNode.connect(this.gainNode);

            this.gainNode.connect(node || this.audioContext.destination);

            this.beepNode.start();
            this.gainNode.gain.value = 0;

            // return this.beepNode;

        }
        // console.log("Connected")
    }

    static getInstance() {
        if (!Beeper.instance) {
            Beeper.instance = new Beeper();
        }
        return Beeper.instance;
    }
}

export default Beeper.getInstance();