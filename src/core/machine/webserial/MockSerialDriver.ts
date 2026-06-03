import type {
  SerialCallbacks,
} from './types'

export class MockSerialDriver {
    private callbacks:
        SerialCallbacks

    constructor(
        callbacks:
        SerialCallbacks = {}
    ) {
        this.callbacks =
        callbacks
    }

    async connect() {
        console.log(
        'Mock connected'
        )
    }

    async disconnect() {
        console.log(
        'Mock disconnected'
        )
    }

    async send(
        command: string
    ) {
        console.log(
        'TX:',
        command
        )

        const shouldFail =
        Math.random() <
        0.15

        if (
        shouldFail
        ) {
        return
        }

        const delay =
        Math.random() *
            1000 +
        200

        setTimeout(() => {
        this.callbacks
            .onMessage?.(
            'ACK'
            )
        }, delay)
    }
}