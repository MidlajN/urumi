import { CommandQueue }
from '../queue/CommandQueue'

import { SerialDriver }
from '../webserial/SerialDriver'

import { MockSerialDriver }
from '../webserial/MockSerialDriver'
import { useMachineStore } from '@/stores/machine.store'

const ACK_TOKEN = 'ACK'

export class MachineRuntime {
    private driver: MockSerialDriver | SerialDriver

    private queue: CommandQueue

    constructor() {
        this.driver = new MockSerialDriver({
            onMessage: this.handleMessage,
        })

        this.queue = new CommandQueue({
            send: this.sendCommand,

            onStateChange: (state) => {
                useMachineStore
                    .getState()
                    .setQueueState(
                        state
                    )
            },

            onQueueError: this.handleError,
        })
    }

    async connect() {
        const store = useMachineStore.getState()

        try {
            store.setConnectionState(
                'connecting'
            )

            await this.driver.connect()

            store.setConnectionState(
                'connected'
            )

            store.addLog({
                id: crypto.randomUUID(),

                type: 'system',

                message: 'Connected',

                timestamp: Date.now(),
            })

        } catch {
            store.setConnectionState(
                'error'
            )
        }
    }

    async disconnect() {
        await this.driver.disconnect()

        useMachineStore
            .getState()
            .setConnectionState(
                'disconnected'
            )
    }


    send(command: string) {
        this.queue.enqueue(
            command
        )
    }

    sendMany(commands: string[]) {
        this.queue.enqueueMany(
            commands
        )
    }

    retryCurrent() {
        this.queue.retryCurrent()
    }

    pause() {
        this.queue.pause()
    }

    resume() {
        this.queue.resume()
    }



    private sendCommand = async (command) => {
        const store = useMachineStore.getState()

        store.setCurrentCommand(
            command.payload
        )

        store.addLog({
            id: crypto.randomUUID(),

            type: 'tx',

            message: command.payload,

            timestamp: Date.now(),
        })

        await this.driver.send(
            command.payload
        )
    }


    private handleMessage = (message: string) => {
        const store = useMachineStore.getState()

        store.addLog({
            id: crypto.randomUUID(),

            type: 'rx',

            message,

            timestamp: Date.now(),
        })

        if (message === ACK_TOKEN) {
            this.queue.acknowledge()
        }
    }

    private handleError = () => {
        useMachineStore
            .getState()
            .addLog({
                id: crypto.randomUUID(),

                type: 'error',

                message: 'Queue timeout',

                timestamp: Date.now(),
            })
    }

}