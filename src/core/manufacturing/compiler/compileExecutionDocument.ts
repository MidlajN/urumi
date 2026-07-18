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

        operations,

    };

}
