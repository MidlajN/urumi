export type MachineConnectionState =
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'error'

export type QueueState =
    | 'idle'
    | 'running'
    | 'waiting_ack'
    | 'paused'

export interface SerialMessage {
    id: string
    direction: 'rx' | 'tx'
    message: string
    timestamp: number
}

export interface MachineState {
    connectionState: MachineConnectionState

    queueState: QueueState

    logs: SerialMessage[]
}