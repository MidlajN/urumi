import {
    Point,
    type Canvas,
    type FabricObject
} from "fabric";

import {
    SNAP_DISTANCE_PX,
    SNAP_MARKER,
    SNAP_PRIORITY_ORDER
} from "./snapConfig";
import {
    getCanvasSnapTargets,
    getObjectSnapTargets
} from "./snapTargets";
import {
    sceneToViewport,
    toPoint,
    viewportDistance
} from "./geometryUtils";
import type {
    ObjectSnapResult,
    ScenePoint,
    SnapContext,
    SnapOptions,
    SnapResult,
    SnapTargetType
} from "./types";

function getPriority(
    type: SnapTargetType
) {
    const index =
        SNAP_PRIORITY_ORDER.indexOf(
            type
        );

    return index === -1
        ? SNAP_PRIORITY_ORDER.length
        : index;
}

function isAllowedTarget(
    type: SnapTargetType,
    allowedTargetTypes?: SnapTargetType[]
) {
    return (
        !allowedTargetTypes ||
        allowedTargetTypes.includes(
            type
        )
    );
}

function compareSnapCandidates(
    context: SnapContext,
    a: {
        target: {
            type: SnapTargetType;
        };
        distancePx: number;
    },
    b: {
        target: {
            type: SnapTargetType;
        };
        distancePx: number;
    }
) {
    if (
        context === "OBJECT_MOVE" ||
        context === "DIMENSION_EDIT"
    ) {
        return (
            a.distancePx -
                b.distancePx ||
            getPriority(
                a.target.type
            ) -
                getPriority(
                    b.target.type
                )
        );
    }

    return (
        getPriority(
            a.target.type
        ) -
            getPriority(
                b.target.type
            ) ||
        a.distancePx -
            b.distancePx
    );
}

function getCandidateTargets(
    options: SnapOptions
) {
    const excludedTargetIds =
        new Set(
            options.excludeTargetIds ??
                []
        );

    const excludedNodeIds =
        new Set(
            options.excludeNodeIds ??
                []
        );

    return [
        ...getCanvasSnapTargets(
            options.canvas,
            options.excludeObjects,
            options.context,
            options.allowedTargetTypes
        ),
        ...(options.extraTargets ?? [])
    ].filter(
        (
            target
        ) => {
            if (
                excludedTargetIds.has(
                    target.id
                )
            ) {
                return false;
            }

            if (
                target.nodeId &&
                excludedNodeIds.has(
                    target.nodeId
                )
            ) {
                return false;
            }

            return (
            isAllowedTarget(
                target.type,
                options.allowedTargetTypes
            )
            );
        }
    );
}

export function getSnappedPoint(
    pointer: ScenePoint | Point,
    options: SnapOptions
): SnapResult {
    const point =
        toPoint(
            pointer
        );

    const maxDistancePx =
        options.maxDistancePx ??
        SNAP_DISTANCE_PX;

    const best =
        getCandidateTargets(
            options
        )
            .map(
                (
                    target
                ) => ({
                    target,
                    distancePx:
                        viewportDistance(
                            point,
                            target.point,
                            options.canvas
                        )
                })
            )
            .filter(
                (
                    candidate
                ) =>
                    candidate.distancePx <=
                    maxDistancePx
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    compareSnapCandidates(
                        options.context,
                        a,
                        b
                    )
            )[0];

    if (!best) {
        return {
            snapped:
                false,
            point,
            context:
                options.context,
            targetType:
                null
        };
    }

    return {
        snapped:
            true,
        point:
            best.target.point,
        context:
            options.context,
        targetType:
            best.target.type,
        targetId:
            best.target.id,
        distancePx:
            best.distancePx
    };
}

export function getSnappedObjectOffset(
    object: FabricObject,
    options: SnapOptions
): ObjectSnapResult {
    const maxDistancePx =
        options.maxDistancePx ??
        SNAP_DISTANCE_PX;

    const sourceTargets =
        getObjectSnapTargets(
            object,
            0,
            options.context,
            options.allowedTargetTypes
        );

    const candidates =
        sourceTargets.flatMap(
            (
                sourceTarget
            ) =>
                getCandidateTargets(
                    options
                ).map(
                    (
                        target
                    ) => ({
                        sourceTarget,
                        target,
                        distancePx:
                            viewportDistance(
                                sourceTarget.point,
                                target.point,
                                options.canvas
                            )
                    })
                )
        )
            .filter(
                (
                    candidate
                ) =>
                    candidate.distancePx <=
                    maxDistancePx
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    compareSnapCandidates(
                        options.context,
                        a,
                        b
                    )
            );

    const best =
        candidates[0];

    if (!best) {
        return {
            snapped:
                false,
            point:
                object.getCenterPoint(),
            context:
                options.context,
            targetType:
                null,
            offset:
                new Point(
                    0,
                    0
                )
        };
    }

    return {
        snapped:
            true,
        point:
            best.target.point,
        context:
            options.context,
        targetType:
            best.target.type,
        targetId:
            best.target.id,
        sourceTargetId:
            best.sourceTarget.id,
        distancePx:
            best.distancePx,
        offset:
            best.target.point.subtract(
                best.sourceTarget.point
            )
    };
}

export class SnapFeedback {
    private canvas: Canvas;

    private result: SnapResult | null =
        null;

    constructor(
        canvas: Canvas
    ) {
        this.canvas =
            canvas;

        this.canvas.on(
            "after:render",
            this.render
        );
    }

    update(
        result: SnapResult
    ) {
        this.result =
            result.snapped
                ? result
                : null;

        this.canvas.requestRenderAll();
    }

    clear() {
        this.result =
            null;

        this.canvas.requestRenderAll();
    }

    destroy() {
        this.canvas.off(
            "after:render",
            this.render
        );
    }

    private render =
        () => {
            if (
                !this.result
            ) {
                return;
            }

            const ctx =
                this.canvas
                    .getElement()
                    .getContext(
                        "2d"
                    );

            if (!ctx) {
                return;
            }

            const viewportPoint =
                sceneToViewport(
                    this.result.point,
                    this.canvas
                );

            const radius =
                this.result.snapped
                    ? SNAP_MARKER.activeRadius
                    : SNAP_MARKER.radius;

            const context =
                this.result.context ??
                "POLYLINE_DRAW";

            ctx.save();
            ctx.strokeStyle =
                getContextStroke(
                    context
                );
            ctx.fillStyle =
                getContextFill(
                    context
                );
            ctx.lineWidth =
                SNAP_MARKER.lineWidth;

            if (
                context ===
                "OBJECT_MOVE"
            ) {
                ctx.beginPath();
                ctx.rect(
                    viewportPoint.x -
                        radius,
                    viewportPoint.y -
                        radius,
                    radius * 2,
                    radius * 2
                );
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(
                    viewportPoint.x,
                    viewportPoint.y,
                    radius,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.moveTo(
                viewportPoint.x -
                    radius -
                    3,
                viewportPoint.y
            );
            ctx.lineTo(
                viewportPoint.x +
                    radius +
                    3,
                viewportPoint.y
            );
            ctx.moveTo(
                viewportPoint.x,
                viewportPoint.y -
                    radius -
                    3
            );
            ctx.lineTo(
                viewportPoint.x,
                viewportPoint.y +
                    radius +
                    3
            );
            ctx.stroke();
            ctx.restore();
        };
}

function getContextStroke(
    context: SnapContext
) {
    if (
        context === "OBJECT_MOVE"
    ) {
        return "#2563eb";
    }

    if (
        context === "NODE_EDIT"
    ) {
        return "#dc2626";
    }

    return SNAP_MARKER.stroke;
}

function getContextFill(
    context: SnapContext
) {
    if (
        context === "OBJECT_MOVE"
    ) {
        return "rgba(37, 99, 235, 0.14)";
    }

    if (
        context === "NODE_EDIT"
    ) {
        return "rgba(220, 38, 38, 0.14)";
    }

    return SNAP_MARKER.fill;
}
