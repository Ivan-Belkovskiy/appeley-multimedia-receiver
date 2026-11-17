import { createMp3Encoder } from 'wasm-media-encoders';

export async function encodeMp3(inputData: Float32Array[], sampleRate: number) {
    const encoder = await createMp3Encoder();

    encoder.configure({
        bitrate: 320,
        channels: 2,
        sampleRate,
    });

    const mp3Part01 = encoder.encode(inputData);

    const mp3Part02 = encoder.finalize();

    const fullLength = mp3Part01.length + mp3Part02.length;
    const outputMp3 = new Uint8Array(fullLength);

    outputMp3.set(mp3Part01, 0);
    outputMp3.set(mp3Part02, mp3Part01.length);

    return outputMp3;
}


// export async function encodeID3v2(mp3: Uint8Array, data: {
//     trackN?: number;
//     title?: string;
//     album?: string;
//     artist?: string;
// }) {

// }