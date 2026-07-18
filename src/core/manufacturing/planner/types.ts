import type {
    PipelineConfig,
    Plan,
} from "urumi-toolpath";

import type {
    SvgViewBox,
} from "../exporters/svg";

export interface PlanOptions {

    /**
     * Bed rect in canvas units, used as the SVG view box so machine
     * coordinates are anchored to the bed. Falls back to the content
     * bounds when omitted.
     */
    viewBox?: SvgViewBox;

}

export interface PlannerResult {

    /** In-memory motion plan: one block per operation (× passes). */
    plan: Plan;

    /** Serialized .plan file bytes. */
    bytes: Uint8Array;

    /**
     * The pipeline config the plan was baked with. The run phase needs it
     * (walkSchedule takes the machine), and inspection tools use it to
     * convert steps back to physical units.
     */
    config: PipelineConfig;

}
