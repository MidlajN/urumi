import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MachineRuntime } from './MachineRuntime'
import type { MachineDriver, SerialCallbacks } from '../webserial/types'
import type { MachineProfile } from '../profile/types'

const PROFILE: MachineProfile = {
    id: 'test',
    name: 'Test',
    capabilities: {
        homing: true,
        unlock: true,
        probing: true,
        vacuumZones: 6,
        clamps: false,
        toolChange: true,
        park: true,
    },
}

/** Fake transport: record TX, drive ACK / error / disconnect by hand. */
class FakeDriver implements MachineDriver {
    sent: string[] = []
    private cb: SerialCallbacks

    constructor(cb: SerialCallbacks) {
        this.cb = cb
    }

    async connect() {}
    async disconnect() {}
    send(command: string) {
        this.sent.push(command)
    }

    ack() {
        this.cb.onMessage?.('ACK')
    }
    error(message: string) {
        this.cb.onMessage?.(message)
    }
    drop() {
        this.cb.onDisconnect?.()
    }
}

function makeRuntime() {
    let driver!: FakeDriver

    const runtime = new MachineRuntime({
        profile: PROFILE,
        createDriver: (cb) => {
            driver = new FakeDriver(cb)
            return driver
        },
    })

    return { runtime, driver: () => driver }
}

describe('MachineRuntime state machine', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('starts disconnected and goes idle on connect', async () => {
        const { runtime } = makeRuntime()

        expect(runtime.getState()).toBe('disconnected')

        await runtime.connect()

        expect(runtime.getState()).toBe('idle')
    })

    it('rejects manual commands unless idle', async () => {
        const { runtime, driver } = makeRuntime()

        // disconnected → rejected
        expect(runtime.executeCommand({ type: 'home' })).toBe(false)

        await runtime.connect()

        // idle → accepted, enters executing
        expect(runtime.executeCommand({ type: 'home' })).toBe(true)
        expect(runtime.getState()).toBe('executing')

        // executing → a second command is rejected
        expect(runtime.executeCommand({ type: 'park' })).toBe(false)
        expect(driver().sent).toEqual(['HOME'])
    })

    it('streams one segment at a time, ACK-gated', async () => {
        const { runtime, driver } = makeRuntime()
        await runtime.connect()

        const done = runtime.executeJob({ program: ['MOVE X10', 'MOVE X20'] })

        // Only the first segment (HOME prep) is outstanding.
        expect(driver().sent).toEqual(['HOME'])

        driver().ack() // HOME → next
        driver().ack() // MOVE X10 → next
        expect(driver().sent).toEqual(['HOME', 'MOVE X10', 'MOVE X20'])

        driver().ack() // MOVE X20 → next
        driver().ack() // VACUUM/PARK teardown...
        // Drain remaining teardown segments.
        while (runtime.getState() === 'executing') {
            driver().ack()
        }

        await expect(done).resolves.toBeUndefined()
        expect(runtime.getState()).toBe('idle')
    })

    it('pause is deferred until the current ACK, then Paused', async () => {
        const { runtime, driver } = makeRuntime()
        await runtime.connect()

        runtime.sendMany(['A', 'B', 'C'])
        expect(driver().sent).toEqual(['A'])

        runtime.pause() // intent only — A still outstanding
        expect(runtime.getState()).toBe('executing')
        expect(driver().sent).toEqual(['A'])

        driver().ack() // A done → honour pause
        expect(runtime.getState()).toBe('paused')
        expect(driver().sent).toEqual(['A']) // B not sent

        runtime.resume()
        expect(runtime.getState()).toBe('executing')
        expect(driver().sent).toEqual(['A', 'B'])
    })

    it('stop discards remaining segments after the current ACK', async () => {
        const { runtime, driver } = makeRuntime()
        await runtime.connect()

        runtime.sendMany(['A', 'B', 'C'])

        runtime.stop()
        expect(driver().sent).toEqual(['A']) // A not interrupted

        driver().ack() // A done → stopped, B/C discarded
        expect(runtime.getState()).toBe('idle')
        expect(driver().sent).toEqual(['A'])
    })

    it('firmware error halts and enters Error', async () => {
        const { runtime, driver } = makeRuntime()
        await runtime.connect()

        const done = runtime.executeJob({ program: ['MOVE X10'] })

        driver().error('ERROR:9 hard limit')

        await expect(done).rejects.toThrow('ERROR:9 hard limit')
        expect(runtime.getState()).toBe('error')
    })

    it('ACK timeout enters Error, no resend', async () => {
        const { runtime, driver } = makeRuntime()
        await runtime.connect()

        runtime.send('MOVE X10')
        expect(driver().sent).toEqual(['MOVE X10'])

        vi.advanceTimersByTime(2000)

        expect(runtime.getState()).toBe('error')
        expect(driver().sent).toEqual(['MOVE X10']) // not resent
    })

    it('disconnect during job fails it and goes Disconnected', async () => {
        const { runtime, driver } = makeRuntime()
        await runtime.connect()

        const done = runtime.executeJob({ program: ['MOVE X10'] })

        driver().drop()

        await expect(done).rejects.toThrow('Disconnected during job')
        expect(runtime.getState()).toBe('disconnected')
    })
})
