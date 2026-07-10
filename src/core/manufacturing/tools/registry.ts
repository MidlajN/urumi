import {
    BUILTIN_TOOL_PROFILES,
} from "./builtin";

import type {
    ToolProfile,
} from "./types";

const toolMap = new Map(
    BUILTIN_TOOL_PROFILES.map(
        (tool) => [
            tool.id,
            tool,
        ]
    )
);

export function listToolProfiles(): readonly ToolProfile[] {
    return BUILTIN_TOOL_PROFILES;
}

export function getToolProfile(
    id: string
): ToolProfile | undefined {
    return toolMap.get(id);
}

export function hasToolProfile(
    id: string
): boolean {
    return toolMap.has(id);
}