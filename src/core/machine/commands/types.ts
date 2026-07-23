export type MachineAxis = 'x' | 'y' | 'z' | 'a'

/**
 * High-level, machine-agnostic actions. Nothing here is wire format —
 * a ProtocolTranslator lowers these into the controller's own commands
 * (FluidNC, the urumi line protocol, ...). Extend the union to add new
 * machine features; the manufacturing layer never sees these.
 */
export type MachineCommand =
    | { type: 'home'; axes?: MachineAxis[] }
    | { type: 'unlock' }
    | { type: 'pause' }
    | { type: 'resume' }
    | { type: 'vacuum'; zone: number; enabled: boolean }
    | { type: 'probe' }
    | { type: 'tool-change'; toolId: string }
    | { type: 'park' }

export type MachineCommandType = MachineCommand['type']

/** Human-readable form for runtime logs. */
export function describeMachineCommand(
    command: MachineCommand
): string {
    switch (command.type) {
        case 'home':
            return command.axes?.length
                ? `home ${command.axes.join(' ')}`
                : 'home'

        case 'vacuum':
            return `vacuum zone ${command.zone} ${
                command.enabled ? 'on' : 'off'
            }`

        case 'tool-change':
            return `tool change → ${command.toolId}`

        default:
            return command.type
    }
}
