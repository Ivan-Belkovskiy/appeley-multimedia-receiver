import { fingerprintFromSamples } from 'rusty-chromaprint-wasm';

export async function blobToFingerprint(blob: Blob): Promise<{ compressed: string; duration: number } | null> {
    const arrayBuffer = await blob.arrayBuffer();

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    let audioBuffer: AudioBuffer;
    try {
        audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch (err) {
        console.error('decodeAudioData failed:', err);
        await audioCtx.close();
        return null;
    }

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const channels = 1;

    const samples = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
        samples[i] = Math.max(-32768, Math.min(32767, Math.round(channelData[i] * 32768)));
    }

    const { compressed } = fingerprintFromSamples(sampleRate, channels, samples);

    const duration = Math.round(audioBuffer.duration);

    await audioCtx.close();

    if (!compressed || !duration || duration < 1) {
        console.warn('Invalid fingerprint data:', { compressed: !!compressed, duration });
        return null;
    }

    return { compressed, duration };
}