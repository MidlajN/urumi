import {
    CREASE,
    KNIFE,
    PEN,
    parseConfig,
} from "urumi-toolpath";

import type {
    PipelineConfig,
    ToolProfile as PlannerToolProfile,
} from "urumi-toolpath";

import type {
    ExecutionDocument,
    ExecutionOperation,
} from "../compiler";

/**
 * Machine calibration in urumi-toolpath's config.json format. Placeholder
 * values for the Urumi cutter (RP2350 @ 150 MHz, GT2 belt X/Y) — replace
 * with the real machine's calibration once measured.
 */
export const DEFAULT_MACHINE_PROFILE = JSON.stringify({

    machine: {
        fCpu: 150000000,

        jogFeed: 80,

        zFeed: 20,

        x: { stepsPerUnit: 26.5, node: { nodeId: 1 } },

        y: { stepsPerUnit: 26.5, node: { nodeId: 2 } },
    },

    heads: [
        {
            tool: "knife",

            z: { stepsPerUnit: 400, node: { nodeId: 3 } },

            a: { stepsPerUnit: 8.889, node: { nodeId: 4 }, rotary: true },
        },
    ],

});

/**
 * Base planner presets keyed by URUMI tool id. An operation's profile is
 * derived from the preset for its resolved tool.
 */
const BASE_PROFILES_BY_TOOL_ID: Readonly<Record<string, PlannerToolProfile>> = {
    "tangential-knife": KNIFE,
    "oscillating-knife": KNIFE,
    "pen": PEN,
    "creasing-wheel": CREASE,
};

/**
 * Merges the machine profile with per-operation tool profiles derived from
 * the ExecutionDocument. Profiles are keyed by operationId so bakePlan
 * resolves the exporter's <g id="…"> operation groups directly — no layer
 * renaming needed. Translation only: the document's resolved values are
 * mapped onto planner fields, never re-derived.
 */
export function buildPlannerConfig(
    document: ExecutionDocument,
    machineProfileJson: string
): PipelineConfig {

    const parsed = parseConfig(machineProfileJson);

    if (!parsed.ok) {
        throw new Error(
            `Invalid machine profile:\n${parsed.errors.join("\n")}`
        );
    }

    const toolProfiles: Record<string, PlannerToolProfile> = {
        ...parsed.config.toolProfiles,
    };

    for (const operation of document.operations) {
        toolProfiles[operation.operationId] =
            buildOperationProfile(operation);
    }

    return {
        ...parsed.config,
        toolProfiles,
    };
}

function buildOperationProfile(
    operation: ExecutionOperation
): PlannerToolProfile {

    const base =
        BASE_PROFILES_BY_TOOL_ID[
            operation.tool.id
        ];

    if (!base) {
        throw new Error(
            `No planner preset for tool '${operation.tool.id}' (operation '${operation.operationId}')`
        );
    }

    const configuration =
        operation.materialToolConfiguration;

    return {
        ...base,

        name: operation.operationId,

        feedMax: configuration.velocity,

        accel: configuration.acceleration,

        toolOffset: {
            xOffset: operation.tool.offsets.x,
            yOffset: operation.tool.offsets.y,
        },
    };
}
