import { create } from 'zustand'

export type ConnectionState =
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'error'

export type QueueState =
    | 'idle'
    | 'running'
    | 'waiting_ack'
    | 'paused'
    | 'error'

export interface RuntimeLog {
    id: string
    type:
        | 'tx'
        | 'rx'
        | 'system'
        | 'error'

    message: string

    timestamp: number
}

interface MachineStore {
    connectionState: ConnectionState

    queueState: QueueState

    currentCommand: string | null

    logs: RuntimeLog[]

    setConnectionState: (
        state: ConnectionState
    ) => void

    setQueueState: (
        state: QueueState
    ) => void

    setCurrentCommand: (
        command: string | null
    ) => void

    addLog: (
        log: RuntimeLog
    ) => void

    clearLogs: () => void
}

export const useMachineStore = create<MachineStore>((set) => ({
    connectionState: 'disconnected',

    queueState: 'idle',

    currentCommand: null,

    logs: [],

    setConnectionState:
        (connectionState) => set({
            connectionState,
        }),

    setQueueState:
        (queueState) => set({
            queueState,
        }),

    setCurrentCommand:
        (currentCommand) => set({
            currentCommand,
        }),

    addLog:
        (log) => set((state) => ({
            logs: [
                ...state.logs,
                log,
            ],
        })),

    clearLogs:
        () => set({
            logs: [],
        }),
    })
  )