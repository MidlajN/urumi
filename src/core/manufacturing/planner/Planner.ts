import {
    bakePlan,
    savePlan,
} from "urumi-toolpath";

import type {
    Plan,
} from "urumi-toolpath";

import type {
    ExecutionDocument,
} from "../compiler";

import {
    SvgExporter,
} from "../exporters/svg";

import {
    buildPlannerConfig,
    DEFAULT_MACHINE_PROFILE,
} from "./PlannerConfigBuilder";

import type {
    PlanOptions,
    PlannerResult,
} from "./types";

/**
 * Public planner entry point: ExecutionDocument → MotionPlan.
 *
 * Coordinates the existing pipeline — SvgExporter for geometry,
 * PlannerConfigBuilder for configuration — and hands both to
 * urumi-toolpath's bakePlan. Nothing upstream knows the planner exists.
 */
export class Planner {

    private machineProfile: string;

    private exporter = new SvgExporter();

    constructor(
        machineProfile: string = DEFAULT_MACHINE_PROFILE
    ) {
        this.machineProfile = machineProfile;
    }

    plan(
        document: ExecutionDocument,
        options: PlanOptions = {}
    ): PlannerResult {

        const config = buildPlannerConfig(
            document,
            this.machineProfile
        );

        // The exporter anchors the SVG to the document's bed and stamps its
        // physical size in mm, so the bake needs no extra scale context.
        const svg = this.exporter.export(
            document,
            {
                viewBox: options.viewBox,
            }
        );

        const baked = bakePlan(
            config,
            svg
        );

        const plan = applyPasses(
            baked.plan,
            document
        );

        if (plan === baked.plan) {
            return {
                plan: baked.plan,
                bytes: baked.bytes,
                config,
            };
        }

        return {
            plan,
            bytes: savePlan(plan),
            config,
        };
    }
}

/**
 * urumi-toolpath has no multi-pass concept; passes are realised by
 * repeating an operation's compiled block. Blocks are self-contained by
 * design, so repetition is safe. Returns the input plan unchanged when
 * every operation is single-pass.
 */
function applyPasses(
    plan: Plan,
    document: ExecutionDocument
): Plan {

    const passesByOperation = new Map(
        document.operations.map(
            (operation) => [
                operation.operationId,
                operation.materialToolConfiguration.passes,
            ]
        )
    );

    let repeated = false;

    const blocks = plan.blocks.flatMap(
        (block) => {

            const passes = Math.max(
                1,
                Math.floor(
                    passesByOperation.get(
                        block.profile.name
                    ) ?? 1
                )
            );

            if (passes === 1) {
                return [block];
            }

            repeated = true;

            return Array.from(
                { length: passes },
                () => block
            );
        }
    );

    return repeated
        ? { blocks }
        : plan;
}
