import { util } from "fabric";

import type {
    Circle,
    Ellipse,
    FabricObject,
    Line,
    Path,
    Polyline,
    TMat2D,
} from "fabric";

import {
    escapeXml,
    formatSvgNumber,
} from "./SvgBuilder";

/**
 * urumi-toolpath's SVG ingest applies only the root viewport transform —
 * element/group transform attributes are ignored ("pre-normalised input").
 * Fabric's own toSVG() wraps every object in <g transform="matrix(...)">,
 * which that consumer would silently mis-position. So each object is
 * flattened here to a single <path> with absolute scene coordinates and no
 * transform. Browsers render the result identically.
 */

type PointLike = {
    x: number;
    y: number;
};

/** Cubic-arc circle approximation constant (error < 0.03%). */
const KAPPA = 0.5522847498;

type PathDataBuilder = (
    object: FabricObject
) => string | null;

/**
 * Path data for the object in absolute scene coordinates (transforms baked
 * in). Also used by the editor's convert-to-path action, so a converted
 * object round-trips identically through the exporter.
 */
export function buildScenePathData(
    object: FabricObject
): string | null {
    const builder =
        PATH_BUILDERS[
            object.type.toLowerCase()
        ];

    return builder
        ? builder(object)
        : null;
}

export function serializeObject(
    object: FabricObject
): string | null {

    const d = buildScenePathData(
        object
    );

    if (!d) {
        return null;
    }

    return `<path d="${escapeXml(d)}" fill="none" stroke="${escapeXml(strokeColor(object))}" stroke-width="${formatSvgNumber(object.strokeWidth ?? 1)}" />`;
}

function pathData(
    object: FabricObject
): string {
    const path = object as Path;

    const transformed = util.transformPath(
        path.path,
        path.calcTransformMatrix(),
        path.pathOffset
    );

    return util.joinPath(
        transformed,
        3
    );
}

function rectPathData(
    object: FabricObject
): string {
    const halfWidth = object.width / 2;

    const halfHeight = object.height / 2;

    // Corner radii are not flattened; rounded rects would need arc segments.
    const corners = transformAll(
        [
            { x: -halfWidth, y: -halfHeight },
            { x: halfWidth, y: -halfHeight },
            { x: halfWidth, y: halfHeight },
            { x: -halfWidth, y: halfHeight },
        ],
        object.calcTransformMatrix()
    );

    return `M ${formatPoint(corners[0])} L ${formatPoint(corners[1])} L ${formatPoint(corners[2])} L ${formatPoint(corners[3])} Z`;
}

function trianglePathData(
    object: FabricObject
): string {
    const halfWidth = object.width / 2;

    const halfHeight = object.height / 2;

    const points = transformAll(
        [
            { x: 0, y: -halfHeight },
            { x: halfWidth, y: halfHeight },
            { x: -halfWidth, y: halfHeight },
        ],
        object.calcTransformMatrix()
    );

    return `M ${formatPoint(points[0])} L ${formatPoint(points[1])} L ${formatPoint(points[2])} Z`;
}

function circlePathData(
    object: FabricObject
): string {
    const circle = object as Circle;

    return ellipsePathData(
        circle.radius,
        circle.radius,
        circle.calcTransformMatrix()
    );
}

function fabricEllipsePathData(
    object: FabricObject
): string {
    const ellipse = object as Ellipse;

    return ellipsePathData(
        ellipse.rx,
        ellipse.ry,
        ellipse.calcTransformMatrix()
    );
}

function linePathData(
    object: FabricObject
): string {
    const line = object as Line;

    const centerX = (line.x1 + line.x2) / 2;

    const centerY = (line.y1 + line.y2) / 2;

    const points = transformAll(
        [
            { x: line.x1 - centerX, y: line.y1 - centerY },
            { x: line.x2 - centerX, y: line.y2 - centerY },
        ],
        line.calcTransformMatrix()
    );

    return `M ${formatPoint(points[0])} L ${formatPoint(points[1])}`;
}

function polylinePathData(
    object: FabricObject
): string | null {
    const polyline = object as Polyline;

    if (polyline.points.length < 2) {
        return null;
    }

    const points = transformAll(
        polyline.points.map(
            (point) => ({
                x: point.x - polyline.pathOffset.x,
                y: point.y - polyline.pathOffset.y,
            })
        ),
        polyline.calcTransformMatrix()
    );

    const joined = points
        .map(formatPoint)
        .join(" L ");

    return `M ${joined}${object.type.toLowerCase() === "polygon" ? " Z" : ""}`;
}

const PATH_BUILDERS: Record<string, PathDataBuilder> = {
    path: pathData,
    rect: rectPathData,
    triangle: trianglePathData,
    circle: circlePathData,
    ellipse: fabricEllipsePathData,
    line: linePathData,
    polyline: polylinePathData,
    polygon: polylinePathData,
    // Text is intentionally unsupported: the planner's ingest has no <text>
    // handling — machining text requires outlining to paths first.
};

function ellipsePathData(
    radiusX: number,
    radiusY: number,
    matrix: TMat2D
): string {

    const kappaX = radiusX * KAPPA;

    const kappaY = radiusY * KAPPA;

    const points = transformAll(
        [
            { x: radiusX, y: 0 },

            { x: radiusX, y: kappaY },
            { x: kappaX, y: radiusY },
            { x: 0, y: radiusY },

            { x: -kappaX, y: radiusY },
            { x: -radiusX, y: kappaY },
            { x: -radiusX, y: 0 },

            { x: -radiusX, y: -kappaY },
            { x: -kappaX, y: -radiusY },
            { x: 0, y: -radiusY },

            { x: kappaX, y: -radiusY },
            { x: radiusX, y: -kappaY },
            { x: radiusX, y: 0 },
        ],
        matrix
    );

    return (
        `M ${formatPoint(points[0])} ` +
        `C ${formatPoint(points[1])} ${formatPoint(points[2])} ${formatPoint(points[3])} ` +
        `C ${formatPoint(points[4])} ${formatPoint(points[5])} ${formatPoint(points[6])} ` +
        `C ${formatPoint(points[7])} ${formatPoint(points[8])} ${formatPoint(points[9])} ` +
        `C ${formatPoint(points[10])} ${formatPoint(points[11])} ${formatPoint(points[12])} Z`
    );
}

function transformAll(
    points: PointLike[],
    matrix: TMat2D
): PointLike[] {
    return points.map(
        (point) =>
            util.transformPoint(
                point,
                matrix
            )
    );
}

function formatPoint(
    point: PointLike
): string {
    return `${formatSvgNumber(point.x)} ${formatSvgNumber(point.y)}`;
}

function strokeColor(
    object: FabricObject
): string {
    return typeof object.stroke === "string" && object.stroke
        ? object.stroke
        : "#000000";
}
