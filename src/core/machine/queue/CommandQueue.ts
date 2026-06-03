import type {
  QueueCallbacks,
  QueueState,
  QueuedCommand,
} from './types'

export class CommandQueue {
    private queue:
        QueuedCommand[] = []

    private currentCommand:
        QueuedCommand | null = null

    private timeoutId:
        ReturnType<typeof setTimeout> | null = null

    private state:
        QueueState = 'idle'

    private callbacks:
        QueueCallbacks

    constructor(callbacks: QueueCallbacks) {
        this.callbacks = callbacks
    }

    enqueue(payload: string, timeoutMs = 1000) {
        const command: QueuedCommand = {
            id: crypto.randomUUID(),

            payload,

            timeoutMs,

            createdAt: Date.now(),
        }

        this.queue.push(
            command
        )

        if (this.state === 'idle') {
            void this.processNext()
        }
    }

    enqueueMany(commands: string[], timeoutMs = 1000) {
        commands.forEach((command) => {
            this.enqueue(
                command,
                timeoutMs
            )
        })
    }

    async processNext() {
        if (this.state === 'paused') {
            return
        }

        const command = this.queue.shift()

        if (!command) {
            this.currentCommand = null

            this.setState('idle')

            this.callbacks
                .onQueueEmpty?.()

            return
        }

        this.currentCommand = command

        this.setState('waiting_ack')

        this.startTimeout(command)

        await this.callbacks.send(command)
    }

    acknowledge() {
        this.clearTimeout()

        this.currentCommand = null

        this.setState('running')

        void this.processNext()
    }

    pause() {
        this.setState(
            'paused'
        )
    }

    resume() {
        if (this.state !== 'paused') {
            return
        }

        this.setState('running')

        void this.processNext()
    }

    retryCurrent() {
        if (!this.currentCommand) {
            return
        }

        this.clearTimeout()

        this.queue.unshift(
            this.currentCommand
        )

        this.currentCommand = null

        this.setState('running')

        void this.processNext()
    }

    clear() {
        this.queue = []

        this.currentCommand = null

        this.clearTimeout()

        this.setState(
            'idle'
        )
    }

    private startTimeout(command: QueuedCommand) {
        this.timeoutId = setTimeout(() => {
            this.setState(
                'error'
            )

            this.callbacks.onQueueError?.({
                command,
                reason:
                'timeout',
            })
        }, command.timeoutMs)
    }

    private clearTimeout() {
        if (this.timeoutId) {
            clearTimeout(
                this.timeoutId
            )

            this.timeoutId = null
        }
    }

    private setState(state: QueueState) {
        this.state = state

        this.callbacks.onStateChange?.(
            state
        )
    }
}