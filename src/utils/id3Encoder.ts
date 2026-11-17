
export interface CustomID3Frame {
    encoding: 'utf-8';
    key: string;
    value: string;
}

export interface ID3v2_3Tags {
    trackN?: number;
    title?: string;
    album?: string;
    artist?: string;

    releaseYear?: number;

    additionalData?: CustomID3Frame[];
}

const MAX_ID3_SIZE = 0b01111111_01111111_01111111_01111111;

const writeString = (view: DataView, offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
        view.setUint8(offset + i, text.charCodeAt(i));
    }
}

export class AppeleyID3Encoder {

    mp3Data: Uint8Array | null = null;
    versionMajor: 3;

    constructor(majorVersion: 3, inputMp3?: Uint8Array) {
        this.versionMajor = majorVersion;
        if (inputMp3) this.mp3Data = inputMp3 || null;
    }

    private _countId3SizeDynamically(data: ID3v2_3Tags, extraSize: number = 0) {
        let size = 0;

        for (const key in data) {
            const content = data[key as keyof ID3v2_3Tags];
            if (Array.isArray(content)) {
                content.forEach(({ key, value }) => {
                    size += (10 + (1 + key.length + 1 + value.length));
                });
            } else {
                if (content) {
                    size += (10 + String(content).length + 1);
                }
            }
        }

        return Math.min(size + extraSize, MAX_ID3_SIZE);
    }

    public encodeID3(data: ID3v2_3Tags, extraSize: number = 100 /* size: number = 0b00000000_00000000_01111111_01111111*/) {

        const id3Size = this._countId3SizeDynamically(data, extraSize);

        const id3buffer = new ArrayBuffer(10 + id3Size);
        const id3view = new DataView(id3buffer);

        // ID3 Tags Header

        writeString(id3view, 0, 'ID3'); // "ID3" Identifier
        id3view.setUint8(3, this.versionMajor); // Major version
        id3view.setUint8(4, 0); // Revision №
        id3view.setUint8(5, 0b00000000); // The flags
        id3view.setUint32(6, id3Size); // Size = 127

        // --- ID3 Frames ---

        let id3offset = 10;

        const encodeDefaultTextFrame = (identifier: string, content: string) => {
            if (!identifier.startsWith('T') || identifier === 'TXXX') return;

            /** Frame Header **/

            writeString(id3view, (id3offset + 0), identifier); // Frame Identifier (TIT2, TALB, ...)
            id3view.setUint32(id3offset + 4, content.length + 1); // ID3 Frame Size
            id3view.setUint16(id3offset + 8, 0b00000000_00000000); // Flags

            /** Frame Data Block **/

            id3view.setUint8(id3offset + 10, 0b11); // UTF-8 Encoding    
            writeString(id3view, id3offset + 11, content); // Text Content

            id3offset += ((content.length + 1) + 10);
        }

        const encodeTXXXFrame = (encoding: 'utf-8', key: string, value: string) => {
            if (!encoding || !key || !value) return;

            /** Frame Header **/

            const size = (1 + key.length + 1 + value.length);

            writeString(id3view, (id3offset + 0), 'TXXX'); // "TXXX" Identifier
            id3view.setUint32(id3offset + 4, size + 1); // ID3 Frame Size
            id3view.setUint16(id3offset + 8, 0b00000000_00000000); // Flags

            /** Frame Data Block **/

            id3view.setUint8(id3offset + 10, 0b11); // UTF-8 Encoding
            writeString(id3view, (id3offset + 11), key);
            id3view.setUint8((id3offset + 11) + key.length, 0b00); // null-terminator
            writeString(id3view, (id3offset + 11 + key.length + 1), value);

            id3offset += (size + 10);

        }

        if (data.trackN) encodeDefaultTextFrame('TRCK', String(data.trackN));

        if (data.title) encodeDefaultTextFrame('TIT2', data.title);
        if (data.album) encodeDefaultTextFrame('TALB', data.album);
        if (data.artist) encodeDefaultTextFrame('TPE1', data.artist);
        if (data.releaseYear) encodeDefaultTextFrame('TYER', String(data.releaseYear));

        if (data.additionalData) data.additionalData.forEach(block => {
            encodeTXXXFrame('utf-8', block.key, block.value);
        });

        const id3array = new Uint8Array(id3buffer);

        return id3array;
    }

}

// export const encodeID3v2 = () => {
//     const id3Size = 0b00000000_00000000_00000000_01111111;

//     const id3buffer = new ArrayBuffer(10 + id3Size);
//     const id3view = new DataView(id3buffer);

//     // ID3 Tags Header

//     writeString(id3view, 0, 'ID3'); // "ID3" Identifier
//     id3view.setUint8(3, 3); // Major version
//     id3view.setUint8(4, 0); // Revision №
//     id3view.setUint8(5, 0b00000000); // The flags
//     id3view.setUint32(6, id3Size); // Size = 127

//     // --- ID3 Frames ---

//     let id3offset = 10;

//     // 1. Track Title (TIT2 Frame)

//     /** Frame Header **/

//     const title = "Advert: - Live365 - Advertisement";

//     // const encodedTitle = new TextEncoder().encode(title);

//     writeString(id3view, (id3offset + 0), 'TIT2'); // "TIT2" Identifier
//     id3view.setUint32(id3offset + 4, title.length + 1); // ID3 Frame Size
//     id3view.setUint16(id3offset + 8, 0b00000000_00000000); // Flags

//     id3offset += 10;

//     /** Frame Data Block **/

//     id3view.setUint8(id3offset + 0, 0b11); // UTF-8 Encoding
//     writeString(id3view, id3offset + 1, title); // Track Title


//     const id3array = new Uint8Array(id3buffer);
// }