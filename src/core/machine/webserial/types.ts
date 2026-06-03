export interface ConnectOptions {
    baudRate?: number
}

export interface SerialCallbacks {

    onMessage?: (message: string) => void

    onDisconnect?: () => void

    onError?: (error: unknown) => void

}