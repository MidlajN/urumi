import type {
    PipelineConfig,
    Plan,
} from "urumi-toolpath";

import type {
    SvgViewBox,
} from "../exporters/svg";

export interface PlanOptions {

    /**
     * Overrides the SVG view box (canvas units). Normally omitted — the
     * document's bed anchors the machine coordinates.
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
