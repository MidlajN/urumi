import {
    Point,
    type Canvas,
    type FabricObject
} from "fabric";

import type {
    ScenePoint
} from "./types";

export function toPoint(
    point: ScenePoint | Point
) {
    return point instanceof Point
        ? point
        : new Point(
            point.x,
            point.y
        );
}

export function midpoint(
    start: Point,
    end: Point
) {
    return new Point(
        (
            start.x +
            end.x
        ) /
            2,
        (
            start.y +
            end.y
        ) /
            2
    );
}

export function distance(
    start: Point,
    end: Point
) {
    return Math.hypot(
        end.x -
            start.x,
        end.y -
            start.y
    );
}

export function sceneToViewport(
    point: Point,
    canvas: Canvas
) {
    return point.transform(
        canvas.viewportTransform
    );
}

export function viewportDistance(
    start: Point,
    end: Point,
    canvas: Canvas
) {
    return distance(
        sceneToViewport(
            start,
            canvas
        ),
        sceneToViewport(
            end,
            canvas
        )
    );
}

export function objectLocalToScene(
    object: FabricObject,
    point: Point
) {
    return point.transform(
        object.calcTransformMatrix()
    );
}

export function constrainAngle(
    point: Point,
    anchor: Point,
    incrementDeg: number
) {
    const dx =
        point.x -
        anchor.x;

    const dy =
        point.y -
        anchor.y;

    const length =
        Math.hypot(
            dx,
            dy
        );

    if (
        length === 0 ||
        incrementDeg <= 0
    ) {
        return point;
    }

    const angle =
        Math.atan2(
            dy,
            dx
        );

    const increment =
        (
            incrementDeg *
            Math.PI
        ) /
        180;

    const constrainedAngle =
        Math.round(
            angle /
                increment
        ) *
        increment;

    return new Point(
        anchor.x +
            Math.cos(
                constrainedAngle
            ) *
                length,
        anchor.y +
            Math.sin(
                constrainedAngle
            ) *
                length
    );
}

export function createRafScheduler<T>(
    callback: (
        value: T
    ) => void
) {
    let frame: number | null =
        null;

    let latest: T | null =
        null;

    const cancel =
        () => {
            if (
                frame !==
                null
            ) {
                window.cancelAnimationFrame(
                    frame
                );
            }

            frame =
                null;
            latest =
                null;
        };

    const schedule =
        (
            value: T
        ) => {
            latest =
                value;

            if (
                frame !==
                null
            ) {
                return;
            }

            frame =
                window.requestAnimationFrame(
                    () => {
                        frame =
                            null;

                        if (
                            latest !==
                            null
                        ) {
                            callback(
                                latest
                            );
                        }

                        latest =
                            null;
                    }
                );
        };

    return {
        schedule,
        cancel
    };
}
