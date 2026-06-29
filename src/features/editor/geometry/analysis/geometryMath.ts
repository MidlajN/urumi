import { Point } from "fabric";

import type {
    GeometryBounds
} from "./types";

export function distance(
    a: Point,
    b: Point
) {
    return Math.hypot(
        b.x - a.x,
        b.y - a.y
    );
}

export function distanceToLine(
    point: Point,
    lineStart: Point,
    lineEnd: Point
) {
    
    const dx = lineEnd.x - lineStart.x;

    const dy = lineEnd.y - lineStart.y;

    const lenSquared = dx * dx + dy * dy;

    if (lenSquared === 0) {
        return distance(
            point,
            lineStart
        )
    }

    const numerator = Math.abs(
        dy * point.x - dx * point.y + 
        lineEnd.x * lineStart.y - lineEnd.y * lineStart.x
    )

    return (
        numerator / Math.sqrt(lenSquared)
    )
}

export function calculateGeometryBounds(
    points: Array<{
        x: number;
        y: number;
    }>
): GeometryBounds {
    if (points.length === 0) {
        return {
            minX:
                0,
            minY:
                0,
            maxX:
                0,
            maxY:
                0,
            width:
                0,
            height:
                0,
            centerX:
                0,
            centerY:
                0
        };
    }

    const xs =
        points.map(
            point =>
                point.x
        );

    const ys =
        points.map(
            point =>
                point.y
        );

    const minX =
        Math.min(
            ...xs
        );

    const minY =
        Math.min(
            ...ys
        );

    const maxX =
        Math.max(
            ...xs
        );

    const maxY =
        Math.max(
            ...ys
        );

    const width =
        maxX -
        minX;

    const height =
        maxY -
        minY;

    return {
        minX,
        minY,
        maxX,
        maxY,
        width,
        height,
        centerX:
            minX + width / 2,
        centerY:
            minY + height / 2
    };
}
