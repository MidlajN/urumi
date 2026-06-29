import { Point } from "fabric";

import type { PathGeometry } from "../pathModel";
import type {
    CircleFitQuality,
    GeometryBounds
} from "./types";

type CircleFit = {
    center: Point;
    radius: number;
};

function solve3x3(
    matrix: number[][],
    values: number[]
) {
    const a =
        matrix.map(
            (row, index) => [
                ...row,
                values[index]
            ]
        );

    for (let column = 0; column < 3; column++) {
        let pivotRow =
            column;

        for (let row = column + 1; row < 3; row++) {
            if (
                Math.abs(a[row][column]) >
                Math.abs(a[pivotRow][column])
            ) {
                pivotRow =
                    row;
            }
        }

        if (
            Math.abs(a[pivotRow][column]) <
            1e-9
        ) {
            return null;
        }

        if (pivotRow !== column) {
            [
                a[column],
                a[pivotRow]
            ] = [
                a[pivotRow],
                a[column]
            ];
        }

        const pivot =
            a[column][column];

        for (let item = column; item < 4; item++) {
            a[column][item] /=
                pivot;
        }

        for (let row = 0; row < 3; row++) {
            if (row === column) {
                continue;
            }

            const factor =
                a[row][column];

            for (let item = column; item < 4; item++) {
                a[row][item] -=
                    factor *
                    a[column][item];
            }
        }
    }

    return [
        a[0][3],
        a[1][3],
        a[2][3]
    ] as const;
}

function calculateFallbackFit(
    geometry: PathGeometry
): CircleFit {
    const nodes =
        geometry.nodes;

    if (nodes.length === 0) {
        return {
            center:
                new Point(0, 0),
            radius:
                0
        };
    }

    const center =
        new Point(
            nodes.reduce(
                (sum, node) =>
                    sum + node.x,
                0
            ) / nodes.length,
            nodes.reduce(
                (sum, node) =>
                    sum + node.y,
                0
            ) / nodes.length
        );

    const radius =
        nodes.reduce(
            (sum, node) =>
                sum +
                Math.hypot(
                    node.x - center.x,
                    node.y - center.y
                ),
            0
        ) / nodes.length;

    return {
        center,
        radius
    };
}

export function estimateCircle(
    geometry: PathGeometry
): CircleFit {
    const nodes =
        geometry.nodes;

    if (nodes.length < 3) {
        return calculateFallbackFit(
            geometry
        );
    }

    const meanX =
        nodes.reduce(
            (sum, node) =>
                sum + node.x,
            0
        ) / nodes.length;

    const meanY =
        nodes.reduce(
            (sum, node) =>
                sum + node.y,
            0
        ) / nodes.length;

    let suu = 0;
    let suv = 0;
    let svv = 0;
    let su = 0;
    let sv = 0;
    let sr = 0;
    let sur = 0;
    let svr = 0;

    for (const node of nodes) {
        const u =
            node.x -
            meanX;

        const v =
            node.y -
            meanY;

        const r =
            u * u +
            v * v;

        suu +=
            u * u;
        suv +=
            u * v;
        svv +=
            v * v;
        su +=
            u;
        sv +=
            v;
        sr +=
            r;
        sur +=
            u * r;
        svr +=
            v * r;
    }

    const solution =
        solve3x3(
            [
                [
                    suu,
                    suv,
                    su
                ],
                [
                    suv,
                    svv,
                    sv
                ],
                [
                    su,
                    sv,
                    nodes.length
                ]
            ],
            [
                -sur,
                -svr,
                -sr
            ]
        );

    if (!solution) {
        return calculateFallbackFit(
            geometry
        );
    }

    const [
        a,
        b,
        c
    ] = solution;

    const center =
        new Point(
            meanX - a / 2,
            meanY - b / 2
        );

    const radiusSquared =
        (a * a + b * b) / 4 -
        c;

    if (
        !Number.isFinite(radiusSquared) ||
        radiusSquared <= 0
    ) {
        return calculateFallbackFit(
            geometry
        );
    }

    return {
        center,
        radius:
            Math.sqrt(
                radiusSquared
            )
    };
}

export function evaluateCircleFit(
    geometry: PathGeometry,
    bounds: GeometryBounds,
    pathLength: number
): CircleFitQuality {
    const {
        center,
        radius
    } = estimateCircle(
        geometry
    );

    const distances =
        geometry.nodes.map(
            node =>
                Math.hypot(
                    node.x - center.x,
                    node.y - center.y
                )
        );

    const errors =
        distances.map(
            distance =>
                Math.abs(
                    distance -
                    radius
                )
        );

    const rmsError =
        Math.sqrt(
            errors.reduce(
                (sum, error) =>
                    sum + error * error,
                0
            ) / Math.max(errors.length, 1)
        );

    const maxError =
        Math.max(
            0,
            ...errors
        );

    const minDistance =
        Math.min(
            ...distances
        );

    const maxDistance =
        Math.max(
            0,
            ...distances
        );

    const majorAxis =
        Math.max(
            bounds.width,
            bounds.height
        );

    const minorAxis =
        Math.min(
            bounds.width,
            bounds.height
        );

    const circumference =
        2 *
        Math.PI *
        radius;

    const safeRadius =
        Math.max(
            radius,
            1
        );

    return {
        center: {
            x:
                center.x,
            y:
                center.y
        },
        radius,
        valid:
            Number.isFinite(radius) &&
            radius > 1 &&
            geometry.nodes.length >= 3,
        rmsError,
        maxError,
        normalizedRmsError:
            rmsError / safeRadius,
        normalizedMaxError:
            maxError / safeRadius,
        radiusSpreadRatio:
            (maxDistance - minDistance) /
            safeRadius,
        aspectRatio:
            majorAxis > 0
                ? minorAxis / majorAxis
                : 0,
        circumferenceRatio:
            circumference > 0
                ? pathLength / circumference
                : 0
    };
}
