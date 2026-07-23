import type { MachineCommand } from './types'

import type { MachineProfile } from '../profile/types'

/**
 * Whether the profiled machine can execute a command. The UI and the
 * runtime gate on this instead of checking controller types.
 */
export function supportsCommand(
    profile: MachineProfile,
    command: MachineCommand
): boolean {
    const capabilities = profile.capabilities

    switch (command.type) {
        case 'home':
            return capabilities.homing

        case 'unlock':
            return capabilities.unlock

        case 'pause':
        case 'resume':
            return true

        case 'vacuum':
            return (
                Number.isInteger(command.zone) &&
                command.zone >= 1 &&
                command.zone <= capabilities.vacuumZones
            )

        case 'probe':
            return capabilities.probing

        case 'tool-change':
            return capabilities.toolChange

        case 'park':
            return capabilities.park
    }
}
