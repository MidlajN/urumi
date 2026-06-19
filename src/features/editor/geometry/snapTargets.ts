import {
    Circle,
    Ellipse,
    Group,
    Line,
    Path,
    Point,
    Polygon,
    Polyline,
    Rect,
    type Canvas,
    type FabricObject
} from "fabric";

import {
    midpoint,
    objectLocalToScene
} from "./geometryUtils";

import type {
    SnapContext,
    SnapTarget,
    SnapTargetType
} from "./types";
import {
    getGeometryNodeId,
    getPathGeometry
} from "./pathModel";

function isTransientObject(
    object: FabricObject
) {
    return (
        object.name === "workspace" ||
        object.name === "grid" ||
        object.name === "snap-preview"
    );
}

function getSourceId(
    object: FabricObject,
    index: number
) {
    return (
        object.id ??
        object.name ??
        `${object.type ?? "object"}:${index}`
    );
}

function target(
    sourceId: string,
    type: SnapTargetType,
    id: string,
    point: Point,
    nodeId?: string
): SnapTarget {
    return {
        id:
            `${sourceId}:${type}:${id}`,
        sourceId,
        type,
        point,
        nodeId
    };
}

function getBoundingTargets(
    object: FabricObject,
    sourceId: string
) {
    const coords =
        object.getCoords();

    if (
        coords.length <
        4
    ) {
        const center =
            object.getCenterPoint();

        return [
            target(
                sourceId,
                "center",
                "center",
                center
            )
        ];
    }

    const [
        topLeft,
        topRight,
        bottomRight,
        bottomLeft
    ] = coords;

    return [
        target(
            sourceId,
            "endpoint",
            "top-left",
            topLeft
        ),
        target(
            sourceId,
            "endpoint",
            "top-right",
            topRight
        ),
        target(
            sourceId,
            "endpoint",
            "bottom-right",
            bottomRight
        ),
        target(
            sourceId,
            "endpoint",
            "bottom-left",
            bottomLeft
        ),
        target(
            sourceId,
            "midpoint",
            "top",
            midpoint(
                topLeft,
                topRight
            )
        ),
        target(
            sourceId,
            "midpoint",
            "right",
            midpoint(
                topRight,
                bottomRight
            )
        ),
        target(
            sourceId,
            "midpoint",
            "bottom",
            midpoint(
                bottomRight,
                bottomLeft
            )
        ),
        target(
            sourceId,
            "midpoint",
            "left",
            midpoint(
                bottomLeft,
                topLeft
            )
        ),
        target(
            sourceId,
            "center",
            "center",
            object.getCenterPoint()
        )
    ];
}

function getLineTargets(
    line: Line,
    sourceId: string
) {
    const points =
        line.calcLinePoints();

    const start =
        objectLocalToScene(
            line,
            new Point(
                points.x1,
                points.y1
            )
        );

    const end =
        objectLocalToScene(
            line,
            new Point(
                points.x2,
                points.y2
            )
        );

    return [
        target(
            sourceId,
            "endpoint",
            "start",
            start,
            "line:start"
        ),
        target(
            sourceId,
            "endpoint",
            "end",
            end,
            "line:end"
        ),
        target(
            sourceId,
            "midpoint",
            "middle",
            midpoint(
                start,
                end
            )
        )
    ];
}

function getPolylineTargets(
    polyline: Polyline,
    sourceId: string,
    includeSegmentMidpoints = true
) {
    const scenePoints =
        polyline.points.map(
            (
                point
            ) =>
                objectLocalToScene(
                    polyline,
                    new Point(
                        point.x -
                            polyline.pathOffset.x,
                        point.y -
                            polyline.pathOffset.y
                    )
                )
        );

    const targets =
        scenePoints.map(
            (
                point,
                index
            ) =>
                target(
                    sourceId,
                    "endpoint",
                    `vertex-${index}`,
                    point,
                    `poly:${index}`
                )
        );

    if (!includeSegmentMidpoints) {
        return targets;
    }

    const segmentCount =
        polyline instanceof Polygon
            ? scenePoints.length
            : Math.max(
                0,
                scenePoints.length -
                    1
            );

    for (
        let index = 0;
        index < segmentCount;
        index += 1
    ) {
        const start =
            scenePoints[index];

        const end =
            scenePoints[
                (
                    index +
                    1
                ) %
                    scenePoints.length
            ];

        if (
            !start ||
            !end
        ) {
            continue;
        }

        targets.push(
            target(
                sourceId,
                "midpoint",
                `segment-${index}`,
                midpoint(
                    start,
                    end
                )
            )
        );
    }

    return targets;
}

function getPathPointIndex(
    command: unknown[]
) {
    return command.length - 2;
}

function getPathTargets(
    path: Path,
    sourceId: string
) {
    const geometry =
        getPathGeometry(
            path
        );

    if (geometry) {
        return geometry.nodes.map(
            (
                node
            ) =>
                target(
                    sourceId,
                    "endpoint",
                    node.id,
                    objectLocalToScene(
                        path,
                        new Point(
                            node.x -
                                path.pathOffset.x,
                            node.y -
                                path.pathOffset.y
                        )
                    ),
                    getGeometryNodeId(
                        node
                    )
                )
        );
    }

    return path.path
        .map(
            (
                command,
                commandIndex
            ) => {
                if (
                    command[0] === "Z" ||
                    command.length < 3
                ) {
                    return null;
                }

                const pointIndex =
                    getPathPointIndex(
                        command
                    );

                const x =
                    Number(
                        command[
                            pointIndex
                        ]
                    );

                const y =
                    Number(
                        command[
                            pointIndex +
                                1
                        ]
                    );

                if (
                    !Number.isFinite(x) ||
                    !Number.isFinite(y)
                ) {
                    return null;
                }

                return target(
                    sourceId,
                    "endpoint",
                    `command-${commandIndex}`,
                    objectLocalToScene(
                        path,
                        new Point(
                            x -
                                path.pathOffset.x,
                            y -
                                path.pathOffset.y
                        )
                    ),
                    `path:${commandIndex}:${pointIndex}`
                );
            }
        )
        .filter(
            (
                snapTarget
            ): snapTarget is SnapTarget =>
                Boolean(
                    snapTarget
                )
        );
}

function getEllipseTargets(
    ellipse: Ellipse | Circle,
    sourceId: string
) {
    const bounds =
        ellipse.getBoundingRect();

    const center =
        ellipse.getCenterPoint();

    return [
        target(
            sourceId,
            "center",
            "center",
            center
        ),
        target(
            sourceId,
            "quadrant",
            "top",
            new Point(
                center.x,
                bounds.top
            )
        ),
        target(
            sourceId,
            "quadrant",
            "right",
            new Point(
                bounds.left +
                    bounds.width,
                center.y
            )
        ),
        target(
            sourceId,
            "quadrant",
            "bottom",
            new Point(
                center.x,
                bounds.top +
                    bounds.height
            )
        ),
        target(
            sourceId,
            "quadrant",
            "left",
            new Point(
                bounds.left,
                center.y
            )
        )
    ];
}

function getEndpointTargets(
    object: FabricObject,
    sourceId: string
) {
    if (
        object instanceof Line
    ) {
        return getLineTargets(
            object,
            sourceId
        ).filter(
            (
                snapTarget
            ) =>
                snapTarget.type ===
                "endpoint"
        );
    }

    if (
        object instanceof Polyline
    ) {
        return getPolylineTargets(
            object,
            sourceId,
            false
        );
    }

    if (
        object instanceof Path
    ) {
        return getPathTargets(
            object,
            sourceId
        );
    }

    if (
        object instanceof Rect ||
        object instanceof Group
    ) {
        return getBoundingTargets(
            object,
            sourceId
        ).filter(
            (
                snapTarget
            ) =>
                snapTarget.type ===
                "endpoint"
        );
    }

    return [];
}

function getNodeEditTargets(
    object: FabricObject,
    sourceId: string
) {
    if (
        object instanceof Line
    ) {
        return getEndpointTargets(
            object,
            sourceId
        );
    }

    if (
        object instanceof Polyline
    ) {
        return getPolylineTargets(
            object,
            sourceId,
            false
        );
    }

    if (
        object instanceof Path
    ) {
        return getPathTargets(
            object,
            sourceId
        );
    }

    if (
        object instanceof Rect
    ) {
        return getBoundingTargets(
            object,
            sourceId
        ).filter(
            (
                snapTarget
            ) =>
                snapTarget.type ===
                "endpoint"
        );
    }

    if (
        object instanceof Ellipse ||
        object instanceof Circle
    ) {
        return getEllipseTargets(
            object,
            sourceId
        ).filter(
            (
                snapTarget
            ) =>
                snapTarget.type ===
                "quadrant"
        );
    }

    return getEndpointTargets(
        object,
        sourceId
    );
}

export function getObjectSnapTargets(
    object: FabricObject,
    index = 0,
    context: SnapContext = "OBJECT_MOVE",
    allowedTargetTypes?: SnapTargetType[]
) {
    const sourceId =
        getSourceId(
            object,
            index
        );

    const onlyAllowed =
        (
            targets: SnapTarget[]
        ) =>
            allowedTargetTypes
                ? targets.filter(
                    (
                        snapTarget
                    ) =>
                        allowedTargetTypes.includes(
                            snapTarget.type
                        )
                )
                : targets;

    if (
        context === "OBJECT_MOVE" ||
        context === "DIMENSION_EDIT"
    ) {
        return onlyAllowed(
            getBoundingTargets(
                object,
                sourceId
            )
        );
    }

    if (
        context === "NODE_EDIT"
    ) {
        return onlyAllowed(
            getNodeEditTargets(
                object,
                sourceId
            )
        );
    }

    if (
        context === "POLYLINE_DRAW"
    ) {
        return onlyAllowed(
            getEndpointTargets(
                object,
                sourceId
            )
        );
    }

    if (
        object instanceof Line
    ) {
        return onlyAllowed(
            getLineTargets(
                object,
                sourceId
            )
        );
    }

    if (
        object instanceof Polyline
    ) {
        return onlyAllowed(
            getPolylineTargets(
                object,
                sourceId
            )
        );
    }

    if (
        object instanceof Ellipse ||
        object instanceof Circle
    ) {
        return onlyAllowed(
            getEllipseTargets(
                object,
                sourceId
            )
        );
    }

    if (
        object instanceof Rect ||
        object instanceof Group
    ) {
        return onlyAllowed(
            getBoundingTargets(
                object,
                sourceId
            )
        );
    }

    return onlyAllowed(
        getBoundingTargets(
            object,
            sourceId
        )
    );
}

export function getCanvasSnapTargets(
    canvas: Canvas,
    excludeObjects: FabricObject[] = [],
    context: SnapContext = "OBJECT_MOVE",
    allowedTargetTypes?: SnapTargetType[]
) {
    const excluded =
        new Set(
            excludeObjects
        );

    return canvas
        .getObjects()
        .filter(
            (
                object
            ) =>
                !excluded.has(
                    object
                ) &&
                !isTransientObject(
                    object
                )
        )
        .flatMap(
            (
                object,
                index
            ) =>
                getObjectSnapTargets(
                    object,
                    index,
                    context,
                    allowedTargetTypes
                )
        );
}
