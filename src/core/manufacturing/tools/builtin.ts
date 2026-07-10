import type {
    ToolProfile,
} from "./types";

export const BUILTIN_TOOL_PROFILES: readonly ToolProfile[] = [
    {
        id: "tangential-knife",

        name: "Tangential Knife",

        enabled: true,

        offsets: {
            x: 0,
            y: 0,
            z: 0,
            a: 0,
        },

        defaults: {
            velocity: 800,
            acceleration: 1200,
        },
    },

    {
        id: "oscillating-knife",

        name: "Oscillating Knife",

        enabled: true,

        offsets: {
            x: 0,
            y: 0,
            z: 0,
            a: 0,
        },

        defaults: {
            velocity: 500,
            acceleration: 800,
        },
    },

    {
        id: "creasing-wheel",

        name: "Creasing Wheel",

        enabled: true,

        offsets: {
            x: 0,
            y: 0,
            z: 0,
            a: 0,
        },

        defaults: {
            velocity: 300,
            acceleration: 500,
        },
    },

    {
        id: "pen",

        name: "Pen",

        enabled: true,

        offsets: {
            x: 0,
            y: 0,
            z: 0,
            a: 0,
        },

        defaults: {
            velocity: 1000,
            acceleration: 1500,
        },
    },
] as const;