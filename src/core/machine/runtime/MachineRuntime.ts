import { CommandQueue }
from '../queue/CommandQueue'

import type { QueuedCommand }
from '../queue/types'

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

import { useMachineStore } from '@/stores/machine.store'

import type { RuntimeLog } from '@/stores/machine.store'
import { resolveMachineCommand } from '../commands/definitions'

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

interface DrainWaiter {
    resolve: () => void

    reject: (error: Error) => void
}

export class MachineRuntime {
    private driver: MachineDriver

    private queue: CommandQueue

    private profile: MachineProfile


    private drainWaiters: DrainWaiter[] = []

    constructor(options: MachineRuntimeOptions = {}) {
        this.profile =
            options.profile ?? URUMI_MACHINE_PROFILE

        const createDriver =
            options.createDriver ??
            ((callbacks: SerialCallbacks) =>
                new MockSerialDriver(callbacks))

        this.driver = createDriver({
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

            onQueueEmpty: this.handleQueueEmpty,

            onQueueError: this.handleError,
        })
    }

    getProfile(): MachineProfile {
        return this.profile
    }

    supports(command: MachineCommand): boolean {
        return supportsCommand(
            this.profile,
            command
        )
    }

    // -----------------------------------------------------------------------------
    // Machine Control API
    // -----------------------------------------------------------------------------

    /**
     * Queues a machine-level command. Returns false (and logs) when the
     * profiled machine lacks the capability.
     */
    executeCommand(command: MachineCommand): boolean {
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

        const resolved =
            resolveMachineCommand(command);

        this.queue.enqueueMany(
            resolved.payloads,
            resolved.timeoutMs
        );

        return true  
    }

    /**
     * Orchestrates one job run: prepare (home, tool, vacuum on), stream
     * the motion program, then tear down (vacuum off, park). Resolves
     * when the machine has acknowledged everything; rejects on a queue
     * timeout.
     */
    async executeJob(job: MachineJob): Promise<void> {
        const capabilities = this.profile.capabilities

        const zones = (job.vacuumZones ?? []).filter(
            (zone) =>
                zone >= 1 &&
                zone <= capabilities.vacuumZones
        )

        if (capabilities.homing) {
            this.executeCommand({ type: 'home' })
        }

        if (job.toolId && capabilities.toolChange) {
            this.executeCommand({
                type: 'tool-change',
                toolId: job.toolId,
            })
        }

        zones.forEach((zone) =>
            this.executeCommand({
                type: 'vacuum',
                zone,
                enabled: true,
            })
        )

        this.queue.enqueueMany([
            ...job.program,
        ])

        await this.waitForQueueDrain()

        zones.forEach((zone) =>
            this.executeCommand({
                type: 'vacuum',
                zone,
                enabled: false,
            })
        )

        if (capabilities.park) {
            this.executeCommand({ type: 'park' })
        }

        await this.waitForQueueDrain()
    }

    // -----------------------------------------------------------------------------
    // Runtime Lifecycle
    // -----------------------------------------------------------------------------

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

            this.log(
                'system',
                'Connected'
            )

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

    // -----------------------------------------------------------------------------
    // Queue Controls
    // -----------------------------------------------------------------------------

    pause() {
        this.queue.pause()
    }

    resume() {
        this.queue.resume()
    }

    retryCurrent() {
        this.queue.retryCurrent()
    }

    // -----------------------------------------------------------------------------
    // Debug API
    // -----------------------------------------------------------------------------


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

    private waitForQueueDrain(): Promise<void> {
        if (this.queue.isDrained()) {
            return Promise.resolve()
        }

        return new Promise((resolve, reject) => {
            this.drainWaiters.push({
                resolve,
                reject,
            })
        })
    }

    private handleQueueEmpty = () => {
        const waiters = this.drainWaiters

        this.drainWaiters = []

        waiters.forEach((waiter) => waiter.resolve())
    }

    private sendCommand = async (command: QueuedCommand) => {
        useMachineStore
            .getState()
            .setCurrentCommand(
                command.payload
            )

        this.log(
            'tx',
            command.payload
        )

        await this.driver.send(
            command.payload
        )
    }


    private handleMessage = (message: string) => {
        this.log(
            'rx',
            message
        )

        // if (this.protocol.isAcknowledgement(message)) {
            this.queue.acknowledge()
        // }
    }

    private handleError = () => {
        this.log(
            'error',
            'Queue timeout'
        )

        const waiters = this.drainWaiters

        this.drainWaiters = []

        waiters.forEach((waiter) =>
            waiter.reject(
                new Error('Queue timeout')
            )
        )
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
