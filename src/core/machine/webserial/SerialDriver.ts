import type {
    ConnectOptions,
    SerialCallbacks,
} from './types';

export class SerialDriver {
    private port: 
        SerialPort | null = null

    private reader: 
        ReadableStreamDefaultReader<string> | null = null

    private writer: 
        WritableStreamDefaultWriter<Uint8Array> | null = null

    private keepReading = false

    private callbacks: 
        SerialCallbacks

    constructor(
        callbacks: SerialCallbacks = {}
    ) {
        this.callbacks = callbacks
    }

    async connect(
        options: ConnectOptions = {}
    ) {
        if (!('serial' in navigator)) {
            throw new Error('Web Serial API not supported in this browser.')
        }

        const baudRate = options.baudRate ?? 115200

        this.port = await navigator.serial.requestPort();

        await this.port.open({
            baudRate
        })

        const textDecoder = new TextDecoderStream()

        void this.port.readable?.pipeTo(
            textDecoder.writable as WritableStream<Uint8Array>
        )

        this.reader = textDecoder.readable.getReader()

        this.writer = this.port.writable?.getWriter() ?? null

        this.keepReading = true

        void this.startReading()
    }

    private async startReading() {
        if (!this.reader) return

        try {
            while (this.keepReading) {
                const { value, done, } = await this.reader.read()

                if (done) break

                if (value) {
                    const message = value.trim()

                    if (message) {
                        this.callbacks.onMessage?.(message)
                    }
                }
            }

        } catch (error) {
            this.callbacks.onError?.(
                error
            )
        }
    }  
    
    async send(command: string) {
        if (!this.writer) {
            throw new Error(
                'Writer not initialized'
            )
        }

        console.log(
            'TX:',
            command
        )

        const encoder = new TextEncoder()

        await this.writer.write(
            encoder.encode(
                `${command}\n`
            )
        )

        console.log(
            'TX complete'
        )
    }

    async disconnect() {

        this.keepReading = false

        await this.reader?.cancel()
        await this.writer?.close()

        await this.port?.close()

        this.port = null
        this.reader = null
        this.writer = null
    }


}