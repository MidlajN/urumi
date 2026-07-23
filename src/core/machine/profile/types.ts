/**
 * Feature switches for one machine build. The UI and runtime read these
 * to decide what to offer — never the controller type. New hardware
 * features (camera, clamps, spindle, ...) get a new field here plus a
 * MachineCommand variant; the manufacturing layer stays untouched.
 */
export interface MachineCapabilities {
    homing: boolean

    unlock: boolean

    probing: boolean

    /** Independently switchable vacuum hold-down zones (0 = none). */
    vacuumZones: number

    clamps: boolean

    toolChange: boolean

    park: boolean
}

/**
 * Runtime-facing machine identity. Deliberately separate from the
 * planner's calibration profile (steps/unit, kinematics) — that one
 * feeds urumi-toolpath and stays machine-command-free.
 */
export interface MachineProfile {
    id: string

    name: string

    capabilities: MachineCapabilities
}
