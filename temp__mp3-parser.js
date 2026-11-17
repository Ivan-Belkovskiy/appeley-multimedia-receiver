

const input = document.querySelector('#fileInput');

const getBits = (value, offset, count) => ((value >>> offset) & ((1 << count) - 1));


const getBit = (value, pos) => (value >> pos) & 1;

const clearOutput = () => document.querySelector('#output').innerHTML = '';
const output = (data) => document.querySelector('#output').innerHTML += data;


const parseMP3 = (buffer) => {
    clearOutput();

    const readString = (offset, length, encoding) => new TextDecoder(encoding ?? 'utf-8').decode(new Uint8Array(buffer, offset, length));

    const view = new DataView(buffer);

    const ID3_ENCODING_VALUES = {
        0x00: 'iso-8859-1',
        0x01: 'utf-16',
        0x02: 'utf-16be',
        0x03: 'utf-8',
    };

    const parseFrameSize = (off, versionMajor) => {
        if (versionMajor === 4) {
            return (
                (view.getUint8(off) << 21) |
                (view.getUint8(off + 1) << 14) |
                (view.getUint8(off + 2) << 7) |
                view.getUint8(off + 3)
            );
        }
        return view.getUint32(off, false);
    };

    const parseTXXX = (bodyBytes, encodingName) => {
        const encoding = bodyBytes[0];
        const decoder = ID3_ENCODING_VALUES[encoding] ?? 'iso-8859-1';

        const text = new TextDecoder(decoder).decode(bodyBytes.subarray(1));

        const nullIdx = text.indexOf('\u0000');
        if (nullIdx === -1) {
            return { encoding: decoder, description: text, value: '' };
        }

        const description = text.slice(0, nullIdx);
        const value = text.slice(nullIdx + 1).replace(/\u0000+$/, '');

        return { encoding: decoder, description, value };
    }

    const parseID3Frame = (id3V, startOffset) => {
        const identifier = readString(startOffset, 4);
        const size = parseFrameSize(startOffset + 4, id3V);
        const flags = view.getUint16(startOffset + 8, false);

        let information = {};

        if (id3V === 3 || id3V === 4) {
            if (identifier.startsWith('T') && identifier !== 'TXXX') {
                const encodingIdx = view.getUint8(startOffset + 10);
                const decoder = ID3_ENCODING_VALUES[encodingIdx] ?? 'iso-8859-1';
                const raw = readString(startOffset + 11, size - 1, decoder);

                const contents = raw.replace(/\u0000+$/, '');
                information = { encoding: decoder, contents };
            } else if (identifier === 'TXXX') {

                const encodingIdx = view.getUint8(startOffset + 10);
                const decoder = ID3_ENCODING_VALUES[encodingIdx] ?? 'iso-8859-1';
                const raw = readString(startOffset + 11, size - 1, decoder);
                const [description, ...rest] = raw.split('\u0000');
                information = {
                    encoding: decoder,
                    description,
                    value: rest.join('\u0000').replace(/\u0000+$/, ''),
                };
            } else if (identifier === 'COMM') {
                const encodingIdx = view.getUint8(startOffset + 10);
                const decoder = ID3_ENCODING_VALUES[encodingIdx] ?? 'iso-8859-1';
                const language = readString(startOffset + 11, 3, 'iso-8859-1');
                const rest = readString(startOffset + 14, size - 4, decoder);
                const [description, ...textParts] = rest.split('\u0000');
                information = {
                    encoding: decoder,
                    language,
                    description: description.replace(/\u0000+$/, ''),
                    text: textParts.join('\u0000').replace(/\u0000+$/, ''),
                };
            }
        }

        return {
            data: { header: { identifier, size, flags }, information },
            nextOffset: size + 10,
        };
    };

    const parseID3Tags = (startOffset = 0) => {


        const versions = [
            view.getUint8(startOffset + 3),
            view.getUint8(startOffset + 4)
        ];
        const flags = view.getUint8(startOffset + 5);

        const b0 = view.getUint8(startOffset + 6);
        const b1 = view.getUint8(startOffset + 7);
        const b2 = view.getUint8(startOffset + 8);
        const b3 = view.getUint8(startOffset + 9);
        const id3Size = (b0 << 21) | (b1 << 14) | (b2 << 7) | b3;

        const id3End = startOffset + 10 + id3Size;

        const frames = [];

        let innerOffset = startOffset + 10;

        // alert(`
        // buffer's byteLength: ${buffer.byteLength}
        // current innerOffset: ${innerOffset}
        // `);

        let iteration = 0;
        while (innerOffset < id3End) {

            const idByte0 = view.getUint8(innerOffset);
            if (idByte0 === 0x00) break;

            const { data, nextOffset } = parseID3Frame(versions[0], innerOffset);
            frames.push(data);
            innerOffset += nextOffset;

            iteration++;
            if (iteration > 999999) {
                alert('ERROR: Infinite loop detected!');
                break;
            }
        }

        return {
            data: {
                version: `ID3v2.${versions.join('.')}`,
                flags,
                size: id3Size,
                frames,
            },
            nextOffset: startOffset + 10 + id3Size
        };
    }

    const parseFrame = (startOffset) => {
        const header = view.getUint32(startOffset + 0, false);

        const syncWord = getBits(header, 21, 11);

        const mpegVersionId = getBits(header, 19, 2);
        const layer = getBits(header, 17, 2);
        const protection = getBit(header, 16);
        const bitrateIdx = getBits(header, 12, 4);
        const sampleRateIdx = getBits(header, 10, 2);
        const padding = getBit(header, 9);
        const private = getBit(header, 8);
        const channelModeIdx = getBits(header, 6, 2);
        const modeExt = getBits(header, 4, 2);
        const copyright = getBit(header, 3);
        const original = getBit(header, 2);

        const emphasis = getBits(header, 0, 2);

        const mpegVersionValues = {
            0b00: 2.5,
            0b10: 2,
            0b11: 1
        };

        const channelModeValues = {
            0b00: 'STEREO',
            0b11: 'MONO',
            0b10: 'DUAL',
            0b01: 'JOINT STEREO'
        };

        const sampleRateValues = {
            0b00: 44100,
            0b01: 48000,
            0b10: 32000,
        };

        const bitrateValues = {
            0b0001: 32,
            0b0010: 40,
            0b0011: 48,
            0b0100: 56,
            0b0101: 64,
            0b0110: 80,
            0b0111: 96,
            0b1000: 112,
            0b1001: 128,
            0b1010: 160,
            0b1011: 192,
            0b1100: 224,
            0b1101: 256,
            0b1110: 320
        };


        const mpegVersion = mpegVersionValues[mpegVersionId];
        const channelMode = channelModeValues[channelModeIdx];
        const sampleRate = sampleRateValues[sampleRateIdx];
        const bitrate = (bitrateValues[bitrateIdx] * 1000);

        const coefficient = (mpegVersion === 1) ? 144 : (layer === 3 ? 72 : 144);
        const frameSize = Math.floor((coefficient * bitrate / sampleRate) + padding);
        // const frameSize = Math.floor(((144 * bitrate) / sampleRate) + padding);
        // const mpegVersion = getBits(header, 19, 2);

        return {
            data: {
                syncWord: syncWord.toString(16),
                mpegVersion,
                layer: layer === 0b01 ? 3 : null,
                crcProtection: !protection,
                bitrate,
                sampleRate,
                padding,
                unusedPrivateBit: private,
                channelMode: channelMode,
                modeExtension: modeExt,
                isCopyrightProtected: !!(copyright),
                isOriginal: !!(original),
                emphasis,
            },

            nextOffset: (frameSize)
        }
    };

    let offset = 0;

    const firstIdentifier = readString(0, 3);

    let tags = {};
    let frames = [];

    if (firstIdentifier === 'ID3') {
        tags = parseID3Tags(offset);
        offset += tags.nextOffset;
    }

    let iteration = 0;

    while (offset < buffer.byteLength) {

        const header = view.getUint32(offset + 0, false);
        const syncWord = getBits(header, 21, 11);

        if (syncWord !== 0x7FF) break;


        const data = parseFrame(offset);
        offset += data.nextOffset;
        frames.push(data);
        iteration++;

        if (iteration > 999999) {
            alert('ERROR: Infinite loop detected!');
            break;
        }
    }

    return {
        tags,
        frames: frames.length,
    };

}

input.onchange = async (e) => {
    const file = e.target.files[0];

    if (file instanceof File) {
        const buffer = await file.arrayBuffer();
        const parsed = parseMP3(buffer);

        output(
            JSON.stringify(parsed, null, 4)
        );
    }
}