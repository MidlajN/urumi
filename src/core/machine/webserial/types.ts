export interface ConnectOptions {
    baudRate?: number
}

/**
 * What the runtime needs from a transport. SerialDriver and
 * MockSerialDriver conform structurally; tests inject fakes.
 */
export interface MachineDriver {
    connect(options?: ConnectOptions): Promise<void>

    disconnect(): Promise<void>

    send(command: string): Promise<void> | void
}

export interface SerialCallbacks {

    onMessage?: (message: string) => void

    onDisconnect?: () => void

    onError?: (error: unknown) => void

}