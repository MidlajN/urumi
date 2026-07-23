import type { MachineCommand } from "./types";

export interface ResolvedMachineCommand {
    payloads: string[];
    timeoutMs?: number;
}

const COMMAND_TIMEOUTS = {
    default: 1000,
    home: 30000,
    toolChange: 15000,
} as const;

export function resolveMachineCommand(
    command: MachineCommand
): ResolvedMachineCommand {
    switch (command.type) {
        case "home":
            return {
                payloads: ["HOME"],
                timeoutMs: COMMAND_TIMEOUTS.home,
            };

        case "unlock":
            return {
                payloads: ["UNLOCK"],
                timeoutMs: COMMAND_TIMEOUTS.default
            };

        case "park":
            return {
                payloads: ["PARK"],
                timeoutMs: COMMAND_TIMEOUTS.default
            };

        case "pause":
            return {
                payloads: ["PAUSE"],
            };

        case "resume":
            return {
                payloads: ["RESUME"],
                timeoutMs: COMMAND_TIMEOUTS.default
            };

        case "vacuum":
            return {
                payloads: [
                    `VACUUM ${command.zone} ${command.enabled ? "ON" : "OFF"}`
                ],
                timeoutMs: COMMAND_TIMEOUTS.default
            };

        case "tool-change":
            return {
                payloads: [
                    `TOOL_CHANGE ${command.toolId}`
                ],
                timeoutMs: COMMAND_TIMEOUTS.toolChange,
            };

        case "probe":
            return {
                payloads: ["PROBE"],
                timeoutMs: COMMAND_TIMEOUTS.home,
            };
    }
}