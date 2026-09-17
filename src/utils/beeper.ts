'use client';

class Beeper {

    private static instance: Beeper;

    private singleBeepAudio: HTMLAudioElement | null = null;
    private tripleBeepAudio: HTMLAudioElement | null = null;
    private scrollBeepAudio: HTMLAudioElement | null = null;

    constructor() {

    }

    singleBeep(count: number = 0 /* not-in-use! */, volume: number = 1, isBeeperOn?: boolean) {
        if (!isBeeperOn) return;

        if (!this.singleBeepAudio) this.singleBeepAudio = new Audio('/audio/beep/beep_new_01.mp3');

        // this.singleBeepAudio.volume = 0.05;

        this.singleBeepAudio.volume = (0.1 * volume);

        this.singleBeepAudio.currentTime = 0;
        this.singleBeepAudio.play();

        return true;
    }

    tripleBeep(volume: number = 1, isBeeperOn?: boolean) {
        if (!isBeeperOn) return;

        if (!this.tripleBeepAudio) this.tripleBeepAudio = new Audio('/audio/beep/beep_new_03.mp3');

        // this.tripleBeepAudio.volume = 0.05;

        this.tripleBeepAudio.volume = (0.1 * volume);

        this.tripleBeepAudio.currentTime = 0;
        this.tripleBeepAudio.play();

        return true;
    }

    scrollBeep(volume: number = 1, isBeeperOn?: boolean) {
        if (!isBeeperOn) return;

        if (!this.scrollBeepAudio) this.scrollBeepAudio = new Audio('/audio/beep/beep_new_scroll.mp3');

        // this.scrollBeepAudio.volume = 0.05;

        this.scrollBeepAudio.volume = (0.1 * volume);

        this.scrollBeepAudio.currentTime = 0;
        this.scrollBeepAudio.play();

        return true;
    }

    static getInstance() {
        if (!Beeper.instance) {
            Beeper.instance = new Beeper();
        }
        return Beeper.instance;
    }
}

export default Beeper.getInstance();