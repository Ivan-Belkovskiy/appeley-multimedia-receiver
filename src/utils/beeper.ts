'use client';

class Beeper {

    private static instance: Beeper;

    private singleBeepAudio: HTMLAudioElement | null = null;
    private tripleBeepAudio: HTMLAudioElement | null = null;

    constructor() {

    }

    singleBeep(count?: number /* not-in-use! */) {
        if (!this.singleBeepAudio) this.singleBeepAudio = new Audio('/audio/beep/beep_new_01.mp3');

        this.singleBeepAudio.volume = 0.05;
        this.singleBeepAudio.currentTime = 0;
        this.singleBeepAudio.play();

        return true;
    }

     tripleBeep() {
        if (!this.tripleBeepAudio) this.tripleBeepAudio = new Audio('/audio/beep/beep_new_03.mp3');

        this.tripleBeepAudio.volume = 0.05;
        this.tripleBeepAudio.currentTime = 0;
        this.tripleBeepAudio.play();

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