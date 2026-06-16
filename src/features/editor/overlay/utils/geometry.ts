import type { ViewportPoint } from "../types";

export function distanceBetween(
    start: ViewportPoint,
    end: ViewportPoint
) {
    return Math.hypot(
        end.x -
            start.x,
        end.y -
            start.y
    );
}

export function midpointBetween(
    start: ViewportPoint,
    end: ViewportPoint
): ViewportPoint {
    return {
        x:
            (
                start.x +
                end.x
            ) /
            2,
        y:
            (
                start.y +
                end.y
            ) /
            2,
    };
}

export function angleBetween(
    start: ViewportPoint,
    end: ViewportPoint
) {
    return (
        Math.atan2(
            end.y -
                start.y,
            end.x -
                start.x
        ) *
        180
    ) /
        Math.PI;
}

export function readableAngle(
    angle: number
) {
    if (
        angle >
            90 ||
        angle <
            -90
    ) {
        return angle +
            180;
    }

    return angle;
}

export function perpendicularOffset(
    start: ViewportPoint,
    end: ViewportPoint,
    distance: number
) {
    const dx =
        end.x -
        start.x;

    const dy =
        end.y -
        start.y;

    const length =
        Math.hypot(
            dx,
            dy
        );

    if (length === 0) {
        return {
            x:
                0,
            y:
                0,
        };
    }

    return {
        x:
            (-dy /
                length) *
            distance,
        y:
            (dx /
                length) *
            distance,
    };
}

export function translatePoint(
    point: ViewportPoint,
    offset: ViewportPoint
): ViewportPoint {
    return {
        x:
            point.x +
            offset.x,
        y:
            point.y +
            offset.y,
    };
}
