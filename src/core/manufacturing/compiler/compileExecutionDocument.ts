import type {
    Canvas,
} from "fabric";

import type {
    ManufacturingDocumentSummary,
} from "../analysis/types";

import type {
    ResolvedManufacturingJob,
} from "../job/resolver";

import type {
    ExecutionBed,
    ExecutionDocument,
    ExecutionObject,
    ExecutionOperation,
} from "./types";

/**
 * Assembles the execution-ready manufacturing document from the manufacturing
 * summary (what is on the canvas) and the resolved job (how it should be
 * manufactured). Performs no registry lookups, no geometry work, and no
 * Fabric mutations — objects are referenced, never cloned.
 */
export function compileExecutionDocument(
    canvas: Canvas,
    summary: ManufacturingDocumentSummary,
    resolvedJob: ResolvedManufacturingJob
): ExecutionDocument {

    const canvasObjects =
        new Set(
            canvas.getObjects()
        );

    const operations: ExecutionOperation[] = [];

    for (const operationSummary of summary.operations) {

        if (!operationSummary.enabled) {
            continue;
        }

        const resolvedOperation =
            resolvedJob.operations[
                operationSummary.operationId
            ];

        if (!resolvedOperation) {
            continue;
        }

        const objects: ExecutionObject[] =
            operationSummary.objects
                .filter(
                    (object) =>
                        canvasObjects.has(object) &&
                        object.manufacturing?.enabled
                )
                .map(
                    (fabricObject) => ({
                        fabricObject,
                    })
                );

        if (objects.length === 0) {
            continue;
        }

        operations.push({

            operationId:
                resolvedOperation.operationId,

            tool:
                resolvedOperation.tool,

            materialToolConfiguration:
                resolvedOperation.materialToolConfiguration,

            objects,

        });

    }

    return {

        material:
            resolvedJob.material,

        bed:
            findBed(canvas),

        operations,

    };

}

function findBed(
    canvas: Canvas
): ExecutionBed | null {

    const workspace = canvas
        .getObjects()
        .find(
            (object) =>
                object.name === "workspace"
        );

    if (!workspace) {
        return null;
    }

    // The workspace rect is axis-aligned with a left/top origin, so its raw
    // geometry is the exact bed rect (getBoundingRect would add the stroke).
    return {
        left: workspace.left,
        top: workspace.top,
        width: workspace.width,
        height: workspace.height,
    };
}
