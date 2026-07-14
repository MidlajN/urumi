import {
    useCallback,
    useEffect,
    useState
} from "react";
import type {
    Canvas,
    FabricObject
} from "fabric";

import {
    summarizeOperations
} from "@/core/manufacturing/analysis/summarizeOperations";
import type {
    ManufacturingDocumentSummary
} from "@/core/manufacturing/analysis/types";
import {
    ensureManufacturingMetadata
} from "@/core/manufacturing/metadata/objectMetadata";
import {
    useCanvas
} from "@/features/editor/canvas/CanvasProvider";

const EMPTY_SUMMARY: ManufacturingDocumentSummary = {
    totalObjectCount:
        0,
    operations:
        []
};

export function useManufacturingSummary() {
    const {
        canvas
    } = useCanvas();

    const [
        summary,
        setSummary
    ] = useState<ManufacturingDocumentSummary>(
        EMPTY_SUMMARY
    );

    const refreshSummary =
        useCallback(() => {
            setSummary(
                canvas
                    ? summarizeOperations(
                        canvas
                    )
                    : EMPTY_SUMMARY
            );
        }, [
            canvas
        ]);

    useEffect(() => {
        if (
            !canvas
        ) {
            setSummary(
                EMPTY_SUMMARY
            );
            return;
        }

        refreshSummary();

        const events = [
            "object:added",
            "object:removed",
            "object:modified",
            "selection:created",
            "selection:updated",
            "selection:cleared"
        ] as const;

        events.forEach(
            (
                event
            ) =>
                canvas.on(
                    event,
                    refreshSummary
                )
        );

        return () => {
            events.forEach(
                (
                    event
                ) =>
                    canvas.off(
                        event,
                        refreshSummary
                    )
            );
        };
    }, [
        canvas,
        refreshSummary
    ]);

    const selectObject =
        useCallback(
            (
                object: FabricObject
            ) => {
                if (
                    !canvas
                ) {
                    return;
                }

                canvas.setActiveObject(
                    object
                );
                object.setCoords();
                focusObjectIfNeeded(
                    canvas,
                    object
                );
                canvas.requestRenderAll();
            },
            [
                canvas
            ]
        );

    const moveObjectToOperation =
        useCallback(
            (
                object: FabricObject,
                operationId: string
            ) => {
                if (
                    !canvas
                ) {
                    return;
                }

                const metadata =
                    ensureManufacturingMetadata(
                        object
                    );

                metadata.operationId =
                    operationId;

                canvas.fire(
                    "object:modified",
                    {
                        target:
                            object
                    }
                );
                canvas.requestRenderAll();
                refreshSummary();
            },
            [
                canvas,
                refreshSummary
            ]
        );

    return {
        summary,
        selectObject,
        moveObjectToOperation
    };
}

function focusObjectIfNeeded(
    canvas: Canvas,
    object: FabricObject
) {
    const viewportTransform =
        canvas.viewportTransform;

    if (
        !viewportTransform ||
        !canvas.width ||
        !canvas.height
    ) {
        return;
    }

    const center =
        object.getCenterPoint();
    const viewportX =
        center.x *
            viewportTransform[0] +
        viewportTransform[4];
    const viewportY =
        center.y *
            viewportTransform[3] +
        viewportTransform[5];

    const margin =
        48;

    const visible =
        viewportX >= margin &&
        viewportY >= margin &&
        viewportX <= canvas.width - margin &&
        viewportY <= canvas.height - margin;

    if (
        visible
    ) {
        return;
    }

    const nextTransform =
        [
            ...viewportTransform
        ] as typeof viewportTransform;

    nextTransform[4] =
        canvas.width / 2 -
        center.x *
            nextTransform[0];
    nextTransform[5] =
        canvas.height / 2 -
        center.y *
            nextTransform[3];

    canvas.setViewportTransform(
        nextTransform
    );
}
