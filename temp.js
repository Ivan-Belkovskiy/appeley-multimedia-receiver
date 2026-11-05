const inp = document.querySelector('#fileInput');

const parseWAVHeadersSimple = async (file) => {
    if (!(file instanceof File)) return { error: true };
    let result = {};
    const decoder = new TextDecoder('utf-8');
    const buffer = await file.arrayBuffer();

    const view = new DataView(buffer);

    const readString = (offset, length) => decoder.decode(new Uint8Array(buffer, offset, length));

    result.FileTypeBlockId = readString(0, 4);
    result.fileSize = view.getUint32(4, true);
    result.fileFormatID = readString(8, 4);
    result.formatBlockID = readString(12, 4);
    result.blockSize = view.getUint32(16, true);

    result.audioFormat = view.getUint16(20, true);

    result.channels = view.getUint16(22, true);
    result.sampleRate = view.getUint32(24, true);
    result.bytesPerSecond = view.getUint32(28, true);
    result.bytesPerBlock = view.getUint16(32, true);
    result.bitsPerSample = view.getUint16(34, true);
    result.dataBlockID = readString(36, 4);

    const dataSize = view.getUint32(40, true);
    result.dataSize = dataSize;


    result.audioFormatName =
        result.audioFormat === 1 ? 'PCM Integer'
            : result.audioFormat === 3 ? 'IEEE 754 float'
                : `Unknown (${result.audioFormat})`;

    document.querySelector('#output').innerHTML = (JSON.stringify(result, null, 4));

};

const stringifyJSON = (obj) => JSON.stringify(obj, (key, value) => {
    if (value instanceof Int16Array) return `[Int16Array(${value.length} samples)]`;
    if (value instanceof Float32Array) return `[Float32Array(${value.length} samples)]`;
    return value;
}, 4);

const parseWAVHeadersNew = async (file) => {
    if (!(file instanceof File)) return { error: true };

    let result = {};

    const buffer = await file.arrayBuffer();

    const decoder = new TextDecoder('utf-8');

    const view = new DataView(buffer);

    const readString = (off, len) => decoder.decode(new Uint8Array(buffer, off, len));

    let offset = 0;

    const parseChunk = (start) => {
        let data = {};
        data.chunkID = readString((start + 0), 4);
        data.chunkSize = view.getUint32(start + 4, true);

        switch (data.chunkID) {
            case "fmt ":
                result.fmtInfo = {
                    audioFormat: view.getUint16(start + 8, true)
                };
                data.audioFormatName =
                    result.fmtInfo.audioFormat === 1 ? 'PCM Integer'
                        : result.fmtInfo.audioFormat === 3 ? 'IEEE 754 float'
                            : `Unknown (${result.fmtInfo.audioFormat})`;
                data.channels = view.getUint16(start + 10, true);
                data.sampleRate = view.getUint32(start + 12, true);
                data.bytesPerSecond = view.getUint32(start + 16, true);
                data.bytesPerBlock = view.getUint16(start + 20, true);
                data.bitsPerSample = view.getUint16(start + 22, true);

                result.sampleRate = data.sampleRate;
                result.channels = data.channels;
                result.fmtInfo.bitsPerSample = data.bitsPerSample;


                // offset += (14 + 2);
                break;

            case "data":

                if (!result.fmtInfo) return { data, nextOffset: start + 8 + data.chunkSize + (data.chunkSize % 2) };

                const bytesPerSample = result.fmtInfo.bitsPerSample / 8;
                let samples;
                if (result.fmtInfo.audioFormat === 1 && bytesPerSample === 2) {
                    samples = new Int16Array(buffer, (start + 8), Math.floor(data.chunkSize / 2));
                } else if (result.fmtInfo.audioFormat === 3) {
                    samples = new Float32Array(buffer, (start + 8), Math.floor(data.chunkSize / 4));
                }
                // offset += (4 + 4);
                // alert(samples.byteLength);
                result.audioData = {
                    samples,
                    offset,
                    size: data.chunkSize,
                };
                break;

        }

        return { data, nextOffset: start + 8 + data.chunkSize + (data.chunkSize % 2) };
        // offset += (data.chunkSize + (data.chunkSize % 2));
        // return data;
    }

    let processingChunkID = null;

    processingChunkID = readString((offset + 0), 4);

    if (processingChunkID !== "RIFF") {
        return {
            error: true,
            details: "Input file is not valid WAV audio file!",
        };
    }

    result.fileSize = view.getUint32(offset + 4, true);
    result.fileFormatID = readString(offset + 8, 4);

    result.chunks = [];

    offset = 12;


    while ((offset + 8) <= buffer.byteLength) {
        const processed = parseChunk(offset);
        processingChunkID = processed.chunkID;
        result.chunks.push(processed);

        offset = processed.nextOffset;

    }


    return {
        error: false,
        result
    }
}

const audioContext = new AudioContext();

let audioBufferSource = null;

const gainNode = audioContext.createGain();

gainNode.connect(audioContext.destination);

const playAudioFromSamples = async (samples) => {

    if (audioContext.state === 'suspended') await audioContext.resume();

    if (audioBufferSource) {
        try {
            audioBufferSource.stop();
        } catch (err) {};

        audioBufferSource.disconnect();
    }

    audioBufferSource = audioContext.createBufferSource();

    const audioBuffer = await audioContext.decodeAudioData(samples.buffer.slice(0));

    gainNode.gain.value = 0.1;

    audioBufferSource.buffer = audioBuffer;

    audioBufferSource.connect(gainNode);


    audioBufferSource.start();

}


const output = document.querySelector('#output');

inp.onchange = async (e) => {
    const file = e.target.files[0];

    if (file instanceof File) {
        const data = await parseWAVHeadersNew(file);

        output.innerHTML = 'Reading...';

        if (data.result) {
            try {
                if (data.result.audioData.samples) await playAudioFromSamples(data.result.audioData.samples);
                // output.innerHTML = '123'
                output.innerHTML = `DATA:\n\n${stringifyJSON(data)}`
            } catch (err) {
                output.innerHTML = 'Error: ' + err;
            }
        }
        //  document.querySelector('#output').innerHTML = (JSON.stringify(data, null, 4));
    }
};

