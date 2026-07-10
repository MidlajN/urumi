import type { OperationDefinition } from "./types";

export const DEFAULT_OPERATIONS: readonly OperationDefinition[] = [

    {
        id: "cut",
        label: "Cut",
        color: "#111827",
        enabled: true,
    },

    {
        id: "crease",
        label: "Crease",
        color: "#3b82f6",
        enabled: true,
    },

    {
        id: "draw",
        label: "Draw",
        color: "#f97316",
        enabled: true,
    },
    
    {
        id: "guide",
        label: "Guide",
        color: "#94a3b8",
        enabled: true,
    },

] as const;