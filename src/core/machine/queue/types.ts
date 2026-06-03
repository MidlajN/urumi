export type QueueState =
    | 'idle'
    | 'running'
    | 'waiting_ack'
    | 'paused'
    | 'error'

export interface QueuedCommand {
    id: string
    payload: string

    timeoutMs: number

    createdAt: number
}

export interface QueueError {
    command: QueuedCommand
    reason: 'timeout'
}

export interface QueueCallbacks {
    send: (
        command: QueuedCommand
    ) => Promise<void>

    onStateChange?: (
        state: QueueState
    ) => void

    onQueueEmpty?: () => void

    onQueueError?: (
        error: QueueError
    ) => void
}