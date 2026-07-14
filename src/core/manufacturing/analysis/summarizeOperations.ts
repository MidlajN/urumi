import type {
    Canvas,
    FabricObject
} from "fabric";

import {
    getOperation
} from "../operations/registry";
import type {
    OperationDefinition
} from "../operations/types";
import type {
    ManufacturingBoundingBox,
    ManufacturingDocumentSummary,
    ManufacturingOperationSummary
} from "./types";

type MutableOperationSummary =
    ManufacturingOperationSummary;

const IGNORED_OBJECT_NAMES =
    new Set([
        "workspace",
        "snap-preview",
        "reference-layer"
    ]);

export function summarizeOperations(
    canvas: Canvas
): ManufacturingDocumentSummary {
    const operationSummaries =
        new Map<
            OperationDefinition["id"],
            MutableOperationSummary
        >();

    let totalObjectCount =
        0;

    canvas.getObjects().forEach(
        (
            object
        ) => {
            if (
                shouldIgnoreObject(
                    object
                )
            ) {
                return;
            }

            const metadata =
                object.manufacturing;

            if (
                !metadata
            ) {
                return;
            }

            const operation =
                getOperation(
                    metadata.operationId
                );

            if (
                !operation
            ) {
                return;
            }

            totalObjectCount +=
                1;

            const summary =
                getOrCreateOperationSummary(
                    operationSummaries,
                    operation,
                    operation.enabled &&
                        metadata.enabled
                );

            summary.objects.push(
                object
            );
            summary.objectCount +=
                1;
            summary.enabled =
                operation.enabled &&
                (
                    summary.enabled ||
                    metadata.enabled
                );
            summary.boundingBox =
                mergeBoundingBoxes(
                    summary.boundingBox,
                    getObjectBoundingBox(
                        object
                    )
                );
        }
    );

    return {
        totalObjectCount,
        operations:
            Array.from(
                operationSummaries.values()
            )
    };
}

function shouldIgnoreObject(
    object: FabricObject
) {
    return Boolean(
        object.name &&
        IGNORED_OBJECT_NAMES.has(
            object.name
        )
    );
}

function getOrCreateOperationSummary(
    operationSummaries: Map<
        OperationDefinition["id"],
        MutableOperationSummary
    >,
    operation: OperationDefinition,
    enabled: boolean
) {
    const existing =
        operationSummaries.get(
            operation.id
        );

    if (
        existing
    ) {
        return existing;
    }

    const summary: MutableOperationSummary = {
        operationId:
            operation.id,
        operation,
        objectCount:
            0,
        objects:
            [],
        enabled,
        boundingBox:
            null
    };

    operationSummaries.set(
        operation.id,
        summary
    );

    return summary;
}

function getObjectBoundingBox(
    object: FabricObject
): ManufacturingBoundingBox {
    const bounds =
        object.getBoundingRect();

    return {
        left:
            bounds.left,
        top:
            bounds.top,
        width:
            bounds.width,
        height:
            bounds.height
    };
}

function mergeBoundingBoxes(
    current: ManufacturingBoundingBox | null,
    next: ManufacturingBoundingBox
): ManufacturingBoundingBox {
    if (
        !current
    ) {
        return next;
    }

    const left =
        Math.min(
            current.left,
            next.left
        );
    const top =
        Math.min(
            current.top,
            next.top
        );
    const right =
        Math.max(
            current.left +
                current.width,
            next.left +
                next.width
        );
    const bottom =
        Math.max(
            current.top +
                current.height,
            next.top +
                next.height
        );

    return {
        left,
        top,
        width:
            right -
            left,
        height:
            bottom -
            top
    };
}
