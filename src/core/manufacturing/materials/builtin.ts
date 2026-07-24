import type {
    Material,
} from "./types";

export const BUILTIN_MATERIALS: readonly Material[] = [

    {
        id: "cardboard-3mm",

        name: "Cardboard",

        thickness: 3,

        enabled: true,

        operations: {

            knife: {

                enabled: true,

                toolConfigurations: [

                    {
                        toolId:
                            "tangential-knife",

                        enabled: true,

                        isDefault: true,

                        velocity: 700,

                        acceleration: 1200,

                        passes: 1,
                    },

                    {
                        toolId:
                            "oscillating-knife",

                        enabled: true,

                        isDefault: false,

                        velocity: 450,

                        acceleration: 900,

                        passes: 1,
                    },

                ],

            },

            crease: {

                enabled: true,

                toolConfigurations: [

                    {
                        toolId:
                            "creasing-wheel",

                        enabled: true,

                        isDefault: true,

                        velocity: 300,

                        acceleration: 500,

                        passes: 1,
                    },

                ],

            },

            draw: {

                enabled: true,

                toolConfigurations: [

                    {
                        toolId:
                            "pen",

                        enabled: true,

                        isDefault: true,

                        velocity: 900,

                        acceleration: 1500,

                        passes: 1,
                    },

                ],

            },

        },

    },

    {
        id: "paper",

        name: "Paper",

        thickness: 0.2,

        enabled: true,

        operations: {

            draw: {

                enabled: true,

                toolConfigurations: [

                    {
                        toolId: "pen",

                        enabled: true,

                        isDefault: true,

                        velocity: 1200,

                        acceleration: 1800,

                        passes: 1,
                    },

                ],

            },

        },

    },

] as const;