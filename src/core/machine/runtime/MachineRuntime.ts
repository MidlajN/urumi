import { MockSerialDriver }
from '../webserial/MockSerialDriver'

import type {
    MachineDriver,
    SerialCallbacks,
} from '../webserial/types'

import type { MachineCommand }
from '../commands/types'

import { describeMachineCommand }
from '../commands/types'

import { supportsCommand }
from '../commands/support'

import type { MachineProfile }
from '../profile/types'

import { URUMI_MACHINE_PROFILE }
from '../profile/defaults'

import { resolveMachineCommand }
from '../commands/definitions'

import { useMachineStore } from '@/stores/machine.store'

import type {
    QueueState,
    RuntimeLog,
} from '@/stores/machine.store'

/**
 * Explicit runtime states. Transitions are deterministic and are the
 * single source of truth — no scattered `if (busy)` flags.
 */
export type RuntimeState =
    | 'disconnected'
    | 'idle'
    | 'executing'
    | 'paused'
    | 'completed'
    | 'stopped'
    | 'error'

/**
 * Internal runtime events. The state machine reacts to these; nothing
 * outside the runtime drives execution directly.
 */
export type RuntimeEvent =
    | { type: 'state-changed'; state: RuntimeState }
    | { type: 'job-started'; segments: number }
    | { type: 'segment-ack'; index: number }
    | { type: 'pause-requested' }
    | { type: 'stop-requested' }
    | { type: 'firmware-error'; message: string }
    | { type: 'timeout' }
    | { type: 'disconnected' }

export type RuntimeEventListener = (event: RuntimeEvent) => void

/**
 * One prepared job for the machine. The motion program is opaque wire
 * payload produced by the toolpath pipeline — the runtime sequences it
 * between preparation and teardown commands but never interprets it.
 */
export interface MachineJob {
    program: readonly string[]

    /** Vacuum zones holding the material down during the job. */
    vacuumZones?: readonly number[]

    /** Tool to load before motion starts. */
    toolId?: string
}

interface MachineRuntimeOptions {
    profile?: MachineProfile

    createDriver?: (
        callbacks: SerialCallbacks
    ) => MachineDriver
}

/** One outstanding wire line plus how long to wait for its ACK. */
interface Segment {
    payload: string

    timeoutMs: number
}

/** How a run reports back to executeJob's awaiter. */
interface RunResult {
    resolve: () => void

    reject: (error: Error) => void
}

const DEFAULT_TIMEOUT_MS = 1000

/** Motion segments can run for seconds before acknowledging. */
const MOTION_TIMEOUT_MS = 30000

const ACK_TOKEN = 'ACK'

function isFirmwareError(line: string): boolean {
    const upper = line.trim().toUpperCase()

    return (
        upper.startsWith('ERROR') ||
        upper.startsWith('ALARM')
    )
}

export class MachineRuntime {
    // -----------------------------------------------------------------------------
    // State
    // -----------------------------------------------------------------------------

    private driver: MachineDriver

    private profile: MachineProfile

    private state: RuntimeState = 'disconnected'

    private listeners = new Set<RuntimeEventListener>()

    // Streaming: exactly one segment outstanding at a time.
    private segments: Segment[] = []

    private index = 0

    private timeoutId: ReturnType<typeof setTimeout> | null = null

    private pauseRequested = false

    private stopRequested = false

    /** Terminal state a completed run lands in ('completed' for jobs). */
    private runTerminal: RuntimeState = 'idle'

    private runResult: RunResult | null = null

    constructor(options: MachineRuntimeOptions = {}) {
        this.profile =
            options.profile ?? URUMI_MACHINE_PROFILE

        const createDriver =
            options.createDriver ??
            ((callbacks: SerialCallbacks) =>
                new MockSerialDriver(callbacks))

        this.driver = createDriver({
            onMessage: this.handleMessage,
            onDisconnect: this.handleDisconnect,
        })
    }

    // -----------------------------------------------------------------------------
    // State Machine
    // -----------------------------------------------------------------------------

    getState(): RuntimeState {
        return this.state
    }

    getProfile(): MachineProfile {
        return this.profile
    }

    on(listener: RuntimeEventListener): () => void {
        this.listeners.add(listener)

        return () => {
            this.listeners.delete(listener)
        }
    }

    private emit(event: RuntimeEvent) {
        this.listeners.forEach((listener) => listener(event))
    }

    private transition(state: RuntimeState) {
        this.state = state

        const store = useMachineStore.getState()

        store.setRuntimeState(state)
        store.setQueueState(toQueueState(state))

        this.emit({ type: 'state-changed', state })
    }

    // -----------------------------------------------------------------------------
    // Connection
    // -----------------------------------------------------------------------------

    async connect() {
        const store = useMachineStore.getState()

        try {
            store.setConnectionState('connecting')

            await this.driver.connect()

            store.setConnectionState('connected')

            this.transition('idle')

            this.log('system', 'Connected')

        } catch {
            store.setConnectionState('error')

            this.transition('error')
        }
    }

    async disconnect() {
        await this.driver.disconnect()

        this.abortRun('Disconnected')

        useMachineStore
            .getState()
            .setConnectionState('disconnected')

        this.transition('disconnected')
    }

    // -----------------------------------------------------------------------------
    // Machine Command API
    // -----------------------------------------------------------------------------

    supports(command: MachineCommand): boolean {
        return supportsCommand(this.profile, command)
    }

    /**
     * Runs a single machine command. Allowed only when Idle; rejected
     * (logged, returns false) in any other state. Not queued.
     */
    executeCommand(command: MachineCommand): boolean {
        if (!this.requireIdle(describeMachineCommand(command))) {
            return false
        }

        if (!this.supports(command)) {
            this.log(
                'error',
                `Unsupported on ${this.profile.name}: ${describeMachineCommand(command)}`
            )

            return false
        }

        this.log(
            'system',
            `→ ${describeMachineCommand(command)}`
        )

        this.beginRun(
            this.resolveSegments(command),
            'idle'
        )

        return true
    }

    /**
     * Streams one job as a single run: prepare (home, tool, vacuum on),
     * the motion program, then tear down (vacuum off, park). Resolves once
     * the machine has acknowledged the last segment; rejects on stop,
     * firmware error, timeout or disconnect.
     */
    executeJob(job: MachineJob): Promise<void> {
        if (!this.requireIdle('job')) {
            return Promise.reject(
                new Error(`Cannot start job while ${this.state}`)
            )
        }

        const capabilities = this.profile.capabilities

        const zones = (job.vacuumZones ?? []).filter(
            (zone) =>
                zone >= 1 &&
                zone <= capabilities.vacuumZones
        )

        const segments: Segment[] = []

        if (capabilities.homing) {
            segments.push(
                ...this.resolveSegments({ type: 'home' })
            )
        }

        if (job.toolId && capabilities.toolChange) {
            segments.push(
                ...this.resolveSegments({
                    type: 'tool-change',
                    toolId: job.toolId,
                })
            )
        }

        zones.forEach((zone) =>
            segments.push(
                ...this.resolveSegments({
                    type: 'vacuum',
                    zone,
                    enabled: true,
                })
            )
        )

        job.program.forEach((payload) =>
            segments.push({
                payload,
                timeoutMs: MOTION_TIMEOUT_MS,
            })
        )

        zones.forEach((zone) =>
            segments.push(
                ...this.resolveSegments({
                    type: 'vacuum',
                    zone,
                    enabled: false,
                })
            )
        )

        if (capabilities.park) {
            segments.push(
                ...this.resolveSegments({ type: 'park' })
            )
        }

        this.log('system', `→ job (${segments.length} segments)`)

        return new Promise<void>((resolve, reject) => {
            this.runResult = { resolve, reject }

            this.beginRun(segments, 'completed')
        })
    }

    // -----------------------------------------------------------------------------
    // Execution Control (only valid while Executing / Paused)
    // -----------------------------------------------------------------------------

    /**
     * Requests a graceful pause. The current segment finishes; no further
     * segment is sent once its ACK arrives.
     */
    pause() {
        if (this.state !== 'executing') {
            this.log('error', `Cannot pause while ${this.state}`)

            return
        }

        this.pauseRequested = true

        this.emit({ type: 'pause-requested' })

        this.log('system', 'Pause requested')
    }

    resume() {
        if (this.state !== 'paused') {
            this.log('error', `Cannot resume while ${this.state}`)

            return
        }

        this.transition('executing')

        this.sendCurrentSegment()
    }

    /**
     * Requests a graceful stop. Remaining segments are discarded once the
     * current segment's ACK arrives. While Paused there is no outstanding
     * segment, so the stop finalizes immediately.
     */
    stop() {
        if (this.state === 'paused') {
            this.finalizeStopped()

            return
        }

        if (this.state !== 'executing') {
            this.log('error', `Cannot stop while ${this.state}`)

            return
        }

        this.stopRequested = true

        this.emit({ type: 'stop-requested' })

        this.log('system', 'Stop requested')
    }

    // -----------------------------------------------------------------------------
    // Debug API
    // -----------------------------------------------------------------------------

    send(command: string) {
        if (!this.requireIdle(command)) {
            return
        }

        this.beginRun(
            [{ payload: command, timeoutMs: DEFAULT_TIMEOUT_MS }],
            'idle'
        )
    }

    sendMany(commands: string[]) {
        if (!this.requireIdle('batch')) {
            return
        }

        this.beginRun(
            commands.map((payload) => ({
                payload,
                timeoutMs: DEFAULT_TIMEOUT_MS,
            })),
            'idle'
        )
    }

    /**
     * Retained for API compatibility. The locked runtime contract forbids
     * retry/recovery, so this is intentionally a no-op.
     */
    retryCurrent() {
        this.log('error', 'Retry is not supported')
    }

    // -----------------------------------------------------------------------------
    // Streaming Engine
    // -----------------------------------------------------------------------------

    private beginRun(
        segments: Segment[],
        terminal: RuntimeState
    ) {
        this.segments = segments
        this.index = 0
        this.pauseRequested = false
        this.stopRequested = false
        this.runTerminal = terminal

        this.transition('executing')

        this.emit({
            type: 'job-started',
            segments: segments.length,
        })

        if (segments.length === 0) {
            this.finalizeCompleted()

            return
        }

        this.sendCurrentSegment()
    }

    private sendCurrentSegment() {
        const segment = this.segments[this.index]

        useMachineStore
            .getState()
            .setCurrentCommand(segment.payload)

        this.log('tx', segment.payload)

        this.startTimeout(segment.timeoutMs)

        void this.driver.send(segment.payload)
    }

    /**
     * ACK: the outstanding segment completed and the machine is ready for
     * the next one. Pause/stop intents are honoured here, at the boundary.
     */
    private handleAck() {
        if (this.state !== 'executing') {
            return
        }

        this.clearTimeout()

        this.emit({ type: 'segment-ack', index: this.index })

        if (this.stopRequested) {
            this.finalizeStopped()

            return
        }

        this.index += 1

        if (this.pauseRequested) {
            this.pauseRequested = false

            this.transition('paused')

            return
        }

        if (this.index >= this.segments.length) {
            this.finalizeCompleted()

            return
        }

        this.sendCurrentSegment()
    }

    private finalizeCompleted() {
        this.clearTimeout()

        useMachineStore.getState().setCurrentCommand(null)

        this.resolveRun()

        if (this.runTerminal === 'completed') {
            this.transition('completed')

            this.log('system', 'Job completed')
        }

        // Ready for the next command.
        this.transition('idle')

        this.resetRun()
    }

    private finalizeStopped() {
        this.clearTimeout()

        useMachineStore.getState().setCurrentCommand(null)

        this.transition('stopped')

        this.log('system', 'Stopped')

        this.rejectRun(new Error('Stopped by operator'))

        this.transition('idle')

        this.resetRun()
    }

    // -----------------------------------------------------------------------------
    // Incoming Message / Fault Handling
    // -----------------------------------------------------------------------------

    private handleMessage = (message: string) => {
        this.log('rx', message)

        if (message.trim() === ACK_TOKEN) {
            this.handleAck()

            return
        }

        if (isFirmwareError(message)) {
            this.handleFirmwareError(message)
        }

        // Anything else is an informational status line; ignore.
    }

    /**
     * Firmware reported an execution fault. Motion is already stopped per
     * the firmware contract — halt streaming, surface the error, no
     * recovery.
     */
    private handleFirmwareError(message: string) {
        this.clearTimeout()

        this.emit({ type: 'firmware-error', message })

        this.log('error', message)

        this.transition('error')

        this.rejectRun(new Error(message))

        this.resetRun()
    }

    private handleTimeout() {
        this.clearTimeout()

        this.emit({ type: 'timeout' })

        this.log('error', 'ACK timeout — operator intervention required')

        this.transition('error')

        this.rejectRun(new Error('ACK timeout'))

        this.resetRun()
    }

    private handleDisconnect = () => {
        const wasRunning =
            this.state === 'executing' ||
            this.state === 'paused'

        this.clearTimeout()

        this.emit({ type: 'disconnected' })

        useMachineStore
            .getState()
            .setConnectionState('disconnected')

        this.transition('disconnected')

        if (wasRunning) {
            this.log('error', 'Connection lost during job')
        }

        this.abortRun('Disconnected during job')
    }

    // -----------------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------------

    private resolveSegments(command: MachineCommand): Segment[] {
        const resolved = resolveMachineCommand(command)

        return resolved.payloads.map((payload) => ({
            payload,
            timeoutMs: resolved.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        }))
    }

    /** Gate for commands that may only start from Idle. */
    private requireIdle(label: string): boolean {
        if (this.state === 'idle') {
            return true
        }

        this.log(
            'error',
            `Rejected "${label}": runtime is ${this.state}`
        )

        return false
    }

    private startTimeout(timeoutMs: number) {
        this.timeoutId = setTimeout(() => {
            this.handleTimeout()
        }, timeoutMs)
    }

    private clearTimeout() {
        if (this.timeoutId !== null) {
            clearTimeout(this.timeoutId)

            this.timeoutId = null
        }
    }

    private resetRun() {
        this.segments = []
        this.index = 0
        this.pauseRequested = false
        this.stopRequested = false
        this.runResult = null
    }

    private resolveRun() {
        const result = this.runResult

        this.runResult = null

        result?.resolve()
    }

    private rejectRun(error: Error) {
        const result = this.runResult

        this.runResult = null

        result?.reject(error)
    }

    /** Fail an in-flight run without a state transition (caller sets state). */
    private abortRun(reason: string) {
        this.clearTimeout()

        useMachineStore.getState().setCurrentCommand(null)

        this.rejectRun(new Error(reason))

        this.resetRun()
    }

    private log(
        type: RuntimeLog['type'],
        message: string
    ) {
        useMachineStore
            .getState()
            .addLog({
                id: crypto.randomUUID(),
                type,
                message,
                timestamp: Date.now(),
            })
    }
}

/** Runtime state → the store's coarser queue badge. */
function toQueueState(state: RuntimeState): QueueState {
    switch (state) {
        case 'executing':
            return 'running'

        case 'paused':
            return 'paused'

        case 'error':
            return 'error'

        default:
            return 'idle'
    }
}
