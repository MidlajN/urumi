import type { MachineProfile } from './types'

export const URUMI_MACHINE_PROFILE: MachineProfile = {
    id: 'urumi-cutter',

    name: 'Urumi Digital Cutter',

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
