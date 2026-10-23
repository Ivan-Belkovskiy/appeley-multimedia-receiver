class RingBufferProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        const { bufferSize, numChannels = 2 } = options.processorOptions;

        this.bufferSize = bufferSize;
        this.numChannels = numChannels;
        this.buffers = [];
        for (let ch = 0; ch < numChannels; ch++) {
            this.buffers.push(new Float32Array(bufferSize));
        }
        this.writePos = 0;

        this.port.onmessage = (e) => {
            const msg = e.data;
            if (msg.type === 'read') {
                const length = Math.min(msg.length, this.bufferSize);
                const startPos = (this.writePos - length + this.bufferSize) % this.bufferSize;

                const result = [];
                for (let ch = 0; ch < this.numChannels; ch++) {
                    const buf = this.buffers[ch];
                    const out = new Float32Array(length);
                    for (let i = 0; i < length; i++) {
                        out[i] = buf[(startPos + i) % this.bufferSize];
                    }
                    result.push(out);
                }

                const transferables = result.map(a => a.buffer);
                this.port.postMessage({ type: 'slice', id: msg.id, channels: result }, transferables);
            } else if (msg.type === 'reset') {
                for (const b of this.buffers) b.fill(0);
                this.writePos = 0;
                this.port.postMessage({ type: 'reset-done', id: msg.id });
            }
        };
    }

    process(inputs) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const len = input[0].length;
        const chCount = Math.min(input.length, this.numChannels);

        for (let ch = 0; ch < this.numChannels; ch++) {
            const buf = this.buffers[ch];
            const data = ch < chCount ? input[ch] : input[0];
            for (let i = 0; i < len; i++) {
                buf[(this.writePos + i) % this.bufferSize] = data[i];
            }
        }

        this.writePos = (this.writePos + len) % this.bufferSize;
        return true;
    }
}

registerProcessor('ring-buffer', RingBufferProcessor);