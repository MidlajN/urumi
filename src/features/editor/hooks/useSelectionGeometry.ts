import { useCallback, useEffect, useState } from "react";
import {
    Line,
    Path,
    Point,
    Polygon,
    Polyline,
    util,
    type Canvas,
    type FabricObject,
    type TMat2D,
} from "fabric";
import type {
    EditorSelectionMode
} from "../store/editor.store";
import {
    isNodeEditableObject
} from "../utils/nodeEditing";

type ViewportRect = {
    left: number;
    top: number;
    width: number;
    height: number;
};

export type ViewportPoint = {
    x: number;
    y: number;
};

export type SelectionMode = "bbox" | "line" | "nodes";

export type SelectionNode = {
    id: string;
    index: number;
    viewport: ViewportPoint;
};

export type SelectionSegment = {
    id: string;
    startNodeId: string;
    endNodeId: string;
    length: number;
    start: ViewportPoint;
    end: ViewportPoint;
    midpoint: ViewportPoint;
    angle: number;
};

export type LineMeasurement = {
    length: number;
    start: ViewportPoint;
    end: ViewportPoint;
    midpoint: ViewportPoint;
    angle: number;
};

export type SelectionGeometry = {
    mode: SelectionMode;
    object: FabricObject;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    viewport: ViewportRect;
    viewportTransform: TMat2D;
    line?: LineMeasurement;
    nodes?: SelectionNode[];
    segments?: SelectionSegment[];
};

type BaseGeometryPatch = Partial<
  Pick<SelectionGeometry, "x" | "y" | "width" | "height" | "rotation">
>;

export type SelectionGeometryPatch = BaseGeometryPatch & {
    length?: number;
    node?: {
        id: string;
        x: number;
        y: number;
    };
    segment?: {
        endNodeId: string;
        length: number;
    };
};

const MIN_DIMENSION = 1;

const DEFAULT_SCENE_UNITS_PER_MM = 96 / 25.4;

const SCENE_UNITS_PER_MM =
    typeof util.parseUnit === "function"
        ? util.parseUnit("1mm")
        : DEFAULT_SCENE_UNITS_PER_MM;

function sceneToMm(value: number) {
    return value / SCENE_UNITS_PER_MM;
}

function mmToScene(value: number) {
    return value * SCENE_UNITS_PER_MM;
}

function distance(start: Point, end: Point) {
    return Math.hypot(end.x - start.x, end.y - start.y);
}

function scenePointToViewport(point: Point, canvas: Canvas): ViewportPoint {

    const viewportPoint = point.transform(canvas.viewportTransform);

    return {
        x: viewportPoint.x,
        y: viewportPoint.y,
    };
}

function objectLocalToScene(object: FabricObject, point: Point) {
    return point.transform(object.calcTransformMatrix());
}

function sceneToObjectLocal(object: FabricObject, point: Point) {
    return util.sendPointToPlane(point, undefined, object.calcTransformMatrix());
}

function toViewportRect(rect: ViewportRect, canvas: Canvas): ViewportRect {
    const points = [
        new Point(rect.left, rect.top),
        new Point(rect.left + rect.width, rect.top),
        new Point(rect.left + rect.width, rect.top + rect.height),
        new Point(rect.left, rect.top + rect.height),
    ].map((point) => point.transform(canvas.viewportTransform));

    const xs = points.map((point) => point.x);

    const ys = points.map((point) => point.y);

    const left = Math.min(...xs);

    const top = Math.min(...ys);

    return {
        left,
        top,
        width: Math.max(...xs) - left,
        height: Math.max(...ys) - top,
    };
}

function isLineObject(object: FabricObject): object is Line {

    return object instanceof Line;
}

function isPathObject(object: FabricObject): object is Path {

    return object instanceof Path;
}

function isPolylineObject(object: FabricObject): object is Polyline {

    return object instanceof Polyline;
}

function isPolygonObject(object: FabricObject): object is Polygon {

    return object instanceof Polygon;
}

function getLineScenePoints(line: Line) {
    const points = line.calcLinePoints();

    return {
        start: objectLocalToScene(line, new Point(points.x1, points.y1)),
        end: objectLocalToScene(line, new Point(points.x2, points.y2)),
    };
}

function getLineMeasurement(line: Line, canvas: Canvas): LineMeasurement {
    const { start, end } = getLineScenePoints(line);

    const midpoint = start.midPointFrom(end);

    const angle = (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI;

    return {
        length: sceneToMm(distance(start, end)),
        start: scenePointToViewport(start, canvas),
        end: scenePointToViewport(end, canvas),
        midpoint: scenePointToViewport(midpoint, canvas),
        angle,
    };
}

function getLineNodes(line: Line, canvas: Canvas): SelectionNode[] {
    const {
        start,
        end
    } = getLineScenePoints(
        line
    );

    return [
        {
            id: "line:start",
            index: 0,
            viewport: scenePointToViewport(
                start,
                canvas
            )
        },
        {
            id: "line:end",
            index: 1,
            viewport: scenePointToViewport(
                end,
                canvas
            )
        }
    ];
}

type SceneNode = {
    id: string;
    index: number;
    scene: Point;
};

function getPolylineSceneNodes(object: Polyline): SceneNode[] {
    return object.points.map((point, index) => ({
        id: `poly:${index}`,
        index,
        scene: objectLocalToScene(
            object,
            new Point(point.x - object.pathOffset.x, point.y - object.pathOffset.y),
        ),
    }));
}

function getPathPointIndex(command: unknown[]) {
    return command.length - 2;
}

function getPathSceneNodes(object: Path): SceneNode[] {
    return object.path
        .map((command, commandIndex) => {
            if (command[0] === "Z" || command.length < 3) {
                return null;
            }

            const pointIndex = getPathPointIndex(command);

            const x = Number(command[pointIndex]);

            const y = Number(command[pointIndex + 1]);

            if (!Number.isFinite(x) || !Number.isFinite(y)) {
                return null;
            }

            return {
                id: `path:${commandIndex}:${pointIndex}`,
                index: commandIndex,
                scene: objectLocalToScene(
                object,
                new Point(x - object.pathOffset.x, y - object.pathOffset.y),
                ),
            };
        })
        .filter((node): node is SceneNode => Boolean(node));
}

function getSceneNodes(object: FabricObject) {
    if (isPathObject(object)) {
        return getPathSceneNodes(object);
    }

    if (isPolylineObject(object)) {
        return getPolylineSceneNodes(object);
    }

    return [];
}

function isClosedNodeObject(object: FabricObject) {
    if (isPolygonObject(object)) {
        return true;
    }

    if (isPathObject(object)) {
        return object.path.some((command) => command[0] === "Z");
    }

    return false;
}

function getNodeGeometry(object: FabricObject, canvas: Canvas) {
    const sceneNodes = getSceneNodes(object);

    const nodes = sceneNodes.map((node) => ({
        id: node.id,
        index: node.index,
        viewport: scenePointToViewport(node.scene, canvas),
    }));

    const segments: SelectionSegment[] = [];

    const segmentCount = 
        isClosedNodeObject(object)
            ? sceneNodes.length
            : Math.max(0, sceneNodes.length - 1);

    for (let index = 0; index < segmentCount; index += 1) {
        const start = sceneNodes[index];

        const end = sceneNodes[(index + 1) % sceneNodes.length];

        if (!start || !end) {
            continue;
        }

        const midpoint = start.scene.midPointFrom(end.scene);

        segments.push({
            id: `${start.id}:${end.id}`,
            startNodeId: start.id,
            endNodeId: end.id,
            length: sceneToMm(distance(start.scene, end.scene)),
            start: scenePointToViewport(start.scene, canvas),
            end: scenePointToViewport(end.scene, canvas),
            midpoint: scenePointToViewport(midpoint, canvas),
            angle:
                (Math.atan2(end.scene.y - start.scene.y, end.scene.x - start.scene.x) * 180) / Math.PI,
        });
    }

    return {
        nodes,
        segments,
    };
}

function getLineNodeId(
    id: string
) {
    if (
        id === "line:start" ||
        id === "line:end"
    ) {
        return id;
    }

    return null;
}

function readSelectionGeometry(
    canvas: Canvas,
    selectionMode: EditorSelectionMode
): SelectionGeometry | null {
    const object = canvas.getActiveObject();

    if (!object) {
        return null;
    }

    const bounds = object.getBoundingRect();

    const mode: SelectionMode =
        selectionMode === "node-edit" &&
        isNodeEditableObject(object)
            ? isLineObject(object)
                ? "line"
                : "nodes"
            : "bbox";

    const nodeGeometry = mode === "nodes" ? getNodeGeometry(object, canvas) : null;

    return {
        mode,
        object,
        x: sceneToMm(bounds.left),
        y: sceneToMm(bounds.top),
        width: sceneToMm(object.getScaledWidth()),
        height: sceneToMm(object.getScaledHeight()),
        rotation: object.angle ?? 0,
        viewport: toViewportRect(
            {
                left: bounds.left,
                top: bounds.top,
                width: bounds.width,
                height: bounds.height,
            },
            canvas,
        ),
        viewportTransform: [...canvas.viewportTransform],
        line:
            mode === "line" ? getLineMeasurement(object as Line, canvas) : undefined,
        nodes:
            mode === "line"
                ? getLineNodes(object as Line, canvas)
                : nodeGeometry?.nodes,
        segments: nodeGeometry?.segments,
    };
}

function cleanNumber(value: number | undefined) {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return undefined;
    }

    return value;
}

function parseNodeId(id: string) {
    const [kind, first, second] = id.split(":");

    if (kind === "poly") {
        return {
            kind,
            pointIndex: Number(first),
        };
    }

    if (kind === "path") {
        return {
            kind,
            commandIndex: Number(first),
            pointIndex: Number(second),
        };
    }

    return null;
}

function movePolylineNode(
    object: Polyline,
    pointIndex: number,
    scenePoint: Point,
) {
    if (pointIndex < 0 || pointIndex >= object.points.length) {
        return false;
    }

    const anchorIndex = (pointIndex > 0 ? pointIndex : object.points.length) - 1;

    const anchorPoint = new Point(object.points[anchorIndex]);

    const anchorBefore = objectLocalToScene(
        object,
        anchorPoint.subtract(object.pathOffset),
    );

    const local = sceneToObjectLocal(object, scenePoint);

    object.points[pointIndex] = local.add(object.pathOffset);

    object.setDimensions();

    const anchorAfter = objectLocalToScene(
        object,
        anchorPoint.subtract(object.pathOffset),
    );

    const diff = anchorAfter.subtract(anchorBefore);

    object.set({
        left: (object.left ?? 0) - diff.x,
        top: (object.top ?? 0) - diff.y,
        dirty: true,
    });

    return true;
}

function getPathAnchorCommand(
    object: Path,
    commandIndex: number,
    currentPointIndex: number,
) {
    let index = commandIndex > 0 ? commandIndex - 1 : object.path.length - 1;

    for (let checked = 0; checked < object.path.length; checked += 1) {
        const command = object.path[index];

        const anchorPointIndex = command ? getPathPointIndex(command) : -1;

        if (
            command &&
            index !== commandIndex &&
            command[0] !== "Z" &&
            command.length > anchorPointIndex + 1
        ) {
            return {
                command,
                pointIndex: anchorPointIndex,
            };
        }

        index = index > 0 ? index - 1 : object.path.length - 1;
    }

    return {
        command: object.path[commandIndex],
        pointIndex: currentPointIndex,
    };
}

function movePathNode(
    object: Path,
    commandIndex: number,
    pointIndex: number,
    scenePoint: Point,
) {
    const command = object.path[commandIndex];

    if (!command || command[0] === "Z" || command.length <= pointIndex + 1) {
        return false;
    }

    const anchorCommand = getPathAnchorCommand(object, commandIndex, pointIndex);

    const anchorPoint = new Point(
        Number(anchorCommand.command[anchorCommand.pointIndex]),
        Number(anchorCommand.command[anchorCommand.pointIndex + 1]),
    );

    const anchorBefore = objectLocalToScene(
        object,
        anchorPoint.subtract(object.pathOffset),
    );

    const local = sceneToObjectLocal(object, scenePoint);

    command[pointIndex] = local.x + object.pathOffset.x;

    command[pointIndex + 1] = local.y + object.pathOffset.y;

    object.setDimensions();

    const anchorAfter = objectLocalToScene(
        object,
        anchorPoint.subtract(object.pathOffset),
    );

    const diff = anchorAfter.subtract(anchorBefore);

    object.set({
        left: (object.left ?? 0) - diff.x,
        top: (object.top ?? 0) - diff.y,
        dirty: true,
    });

    return true;
}

function setLineScenePoints(
    object: Line,
    start: Point,
    end: Point
) {
    object.set({
        angle: 0,
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        skewY: 0,
        flipX: false,
        flipY: false,
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
        dirty: true,
    });

    object.setCoords();
}

function moveLineNode(
    object: Line,
    nodeId: string,
    scenePoint: Point
) {
    const lineNodeId =
        getLineNodeId(
            nodeId
        );

    if (!lineNodeId) {
        return false;
    }

    const {
        start,
        end
    } = getLineScenePoints(
        object
    );

    setLineScenePoints(
        object,
        lineNodeId === "line:start"
            ? scenePoint
            : start,
        lineNodeId === "line:end"
            ? scenePoint
            : end
    );

    return true;
}

function moveNodeToScenePoint(
    object: FabricObject,
    nodeId: string,
    scenePoint: Point,
) {
    if (isLineObject(object)) {
        return moveLineNode(
            object,
            nodeId,
            scenePoint
        );
    }

    const parsed = parseNodeId(nodeId);

    if (!parsed) {
        return false;
    }

    if (
        parsed.kind === "poly" &&
        isPolylineObject(object) &&
        Number.isFinite(parsed.pointIndex)
    ) {
        return movePolylineNode(object, parsed.pointIndex, scenePoint);
    }

    if (
        parsed.kind === "path" &&
        isPathObject(object) &&
        Number.isFinite(parsed.commandIndex) &&
        Number.isFinite(parsed.pointIndex)
    ) {
        return movePathNode(
            object,
            Number(parsed.commandIndex),
            Number(parsed.pointIndex),
            scenePoint,
        );
    }

    return false;
}

export function formatMeasurement(value: number) {
    const rounded = Math.round(value * 100) / 100;

    const normalized = Object.is(rounded, -0) ? 0 : rounded;

    return normalized
        .toFixed(2)
        .replace(/(\.\d*?)0+$/, "$1")
        .replace(/\.$/, ".0");
}

export function parseMeasurement(value: string) {
    const normalized = value.replace(/mm|deg/gi, "").trim();

    if (!normalized) {
        return null;
    }

    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : null;
}

export function useSelectionGeometry(
    canvas: Canvas | null,
    selectionMode: EditorSelectionMode = "select"
) {

    const [
        geometry, 
        setGeometry
    ] = useState<SelectionGeometry | null>(null);

    const syncGeometry = useCallback(() => {

        setGeometry(
            canvas ? readSelectionGeometry(canvas, selectionMode) : null
        );

    }, [canvas, selectionMode]);

    useEffect(() => {
        if (!canvas) {
            setGeometry(null);
            return;
        }

        syncGeometry();

        canvas.on("selection:created", syncGeometry);
        canvas.on("selection:updated", syncGeometry);
        canvas.on("selection:cleared", syncGeometry);
        canvas.on("object:moving", syncGeometry);
        canvas.on("object:scaling", syncGeometry);
        canvas.on("object:rotating", syncGeometry);
        canvas.on("object:modified", syncGeometry);
        canvas.on("after:render", syncGeometry);

        return () => {
            canvas.off("selection:created", syncGeometry);
            canvas.off("selection:updated", syncGeometry);
            canvas.off("selection:cleared", syncGeometry);
            canvas.off("object:moving", syncGeometry);
            canvas.off("object:scaling", syncGeometry);
            canvas.off("object:rotating", syncGeometry);
            canvas.off("object:modified", syncGeometry);
            canvas.off("after:render", syncGeometry);
        };
    }, [canvas, syncGeometry]);

    const updateGeometry = useCallback((patch: SelectionGeometryPatch) => {
        if (!canvas) {
            return;
        }

        const object = canvas.getActiveObject();

        if (!object) {
            return;
        }

        const nextWidth = cleanNumber(patch.width);

        const nextHeight = cleanNumber(patch.height);

        const nextLength = cleanNumber(patch.length);

        const nextRotation = cleanNumber(patch.rotation);

        const nextX = cleanNumber(patch.x);

        const nextY = cleanNumber(patch.y);

        const finishUpdate = () => {
            object.setCoords();

            canvas.fire("object:modified", {
                target: object,
            });

            canvas.requestRenderAll();
            setGeometry(readSelectionGeometry(canvas, selectionMode));
        };

        if (patch.node) {
            moveNodeToScenePoint(
                object,
                patch.node.id,
                new Point(patch.node.x, patch.node.y),
            );

            finishUpdate();

            return;
        }

        if (patch.segment) {
            const nextSegmentLength = cleanNumber(patch.segment.length);

            if (
            nextSegmentLength !== undefined &&
            nextSegmentLength > MIN_DIMENSION
            ) {
            const sceneNodes = getSceneNodes(object);

            const nodeGeometry = getNodeGeometry(object, canvas);

            const segment = nodeGeometry.segments.find(
                (item) => item.endNodeId === patch.segment?.endNodeId,
            );

            const startNode = sceneNodes.find(
                (node) => node.id === segment?.startNodeId,
            );

            const endNode = sceneNodes.find(
                (node) => node.id === patch.segment?.endNodeId,
            );

            if (segment && startNode && endNode) {
                const currentLength = distance(startNode.scene, endNode.scene);

                if (currentLength > MIN_DIMENSION) {
                const targetLength = mmToScene(nextSegmentLength);

                const ratio = targetLength / currentLength;

                const nextScenePoint = new Point(
                    startNode.scene.x +
                    (endNode.scene.x - startNode.scene.x) * ratio,
                    startNode.scene.y +
                    (endNode.scene.y - startNode.scene.y) * ratio,
                );

                moveNodeToScenePoint(object, endNode.id, nextScenePoint);
                }
            }
            }

            finishUpdate();
            return;
        }

        const preserveCenter =
            nextWidth !== undefined ||
            nextHeight !== undefined ||
            nextLength !== undefined ||
            nextRotation !== undefined;

        const center = preserveCenter ? object.getCenterPoint() : null;

        if (
            nextLength !== undefined &&
            nextLength > MIN_DIMENSION &&
            isLineObject(object)
        ) {
            const targetLength = mmToScene(nextLength);

            const { start, end } = getLineScenePoints(object);

            const currentLength = distance(start, end);

            if (currentLength > MIN_DIMENSION) {
            const ratio = targetLength / currentLength;

            object.set({
                scaleX: (object.scaleX ?? 1) * ratio,
                scaleY: (object.scaleY ?? 1) * ratio,
            });
            }
        }

        if (nextWidth !== undefined && nextWidth > MIN_DIMENSION) {
            const targetWidth = mmToScene(nextWidth);

            const currentWidth = object.getScaledWidth();

            if (currentWidth > MIN_DIMENSION) {
            object.set({
                scaleX: (object.scaleX ?? 1) * (targetWidth / currentWidth),
            });
            }
        }

        if (nextHeight !== undefined && nextHeight > MIN_DIMENSION) {
            const targetHeight = mmToScene(nextHeight);

            const currentHeight = object.getScaledHeight();

            if (currentHeight > MIN_DIMENSION) {
            object.set({
                scaleY: (object.scaleY ?? 1) * (targetHeight / currentHeight),
            });
            }
        }

        if (nextRotation !== undefined) {
            object.set({
            angle: nextRotation,
            });
        }

        if (center) {
            object.setPositionByOrigin(center, "center", "center");
        }

        object.setCoords();

        if (nextX !== undefined || nextY !== undefined) {
            const bounds = object.getBoundingRect();

            const targetX = nextX === undefined ? bounds.left : mmToScene(nextX);

            const targetY = nextY === undefined ? bounds.top : mmToScene(nextY);

            object.set({
            left: (object.left ?? 0) + targetX - bounds.left,
            top: (object.top ?? 0) + targetY - bounds.top,
            });

            object.setCoords();
        }

        canvas.fire("object:modified", {
            target: object,
        });

        canvas.requestRenderAll();
        setGeometry(readSelectionGeometry(canvas, selectionMode));

    },[
        canvas,
        selectionMode
    ]);

    return {
        geometry,
        updateGeometry,
    };
}
