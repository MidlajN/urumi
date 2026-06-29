import {
    Point
} from "fabric";

import type {
    PathGeometry
} from "../pathModel";
import type {
    AnchorPoint,
    CornerAngle,
    GeometrySegment,
    RectangleFitQuality
} from "./types";

type Vector = {
    x: number;
    y: number;
};

function toPoint(
    vector: Vector
) {
    return {
        x:
            vector.x,
        y:
            vector.y
    };
}

function length(
    vector: Vector
) {
    return Math.hypot(
        vector.x,
        vector.y
    );
}

function normalize(
    vector: Vector
) {
    const magnitude =
        length(
            vector
        );

    if (magnitude === 0) {
        return {
            x:
                0,
            y:
                0
        };
    }

    return {
        x:
            vector.x / magnitude,
        y:
            vector.y / magnitude
    };
}

function add(
    a: Vector,
    b: Vector
) {
    return {
        x:
            a.x + b.x,
        y:
            a.y + b.y
    };
}

function subtract(
    a: Vector,
    b: Vector
) {
    return {
        x:
            a.x - b.x,
        y:
            a.y - b.y
    };
}

function multiply(
    vector: Vector,
    scalar: number
) {
    return {
        x:
            vector.x * scalar,
        y:
            vector.y * scalar
    };
}

function dot(
    a: Vector,
    b: Vector
) {
    return (
        a.x * b.x +
        a.y * b.y
    );
}

function cross(
    a: Vector,
    b: Vector
) {
    return (
        a.x * b.y -
        a.y * b.x
    );
}

function calculateParallelError(
    a: Vector,
    b: Vector
) {
    const normalizedA =
        normalize(
            a
        );

    const normalizedB =
        normalize(
            b
        );

    return (
        Math.asin(
            Math.min(
                1,
                Math.abs(
                    cross(
                        normalizedA,
                        normalizedB
                    )
                )
            )
        ) *
        180 /
        Math.PI
    );
}

function calculateRebuiltCorners(
    corners: Vector[]
) {
    const [
        p0,
        p1,
        p2,
        p3
    ] = corners;

    const side01 =
        subtract(
            p1,
            p0
        );

    const side12 =
        subtract(
            p2,
            p1
        );

    const side23 =
        subtract(
            p3,
            p2
        );

    const side30 =
        subtract(
            p0,
            p3
        );

    const width =
        (
            length(side01) +
            length(side23)
        ) / 2;

    const height =
        (
            length(side12) +
            length(side30)
        ) / 2;

    let axisX =
        normalize(
            add(
                normalize(side01),
                multiply(
                    normalize(side23),
                    -1
                )
            )
        );

    if (
        length(axisX) === 0
    ) {
        axisX =
            normalize(side01);
    }

    let axisY = {
        x:
            -axisX.y,
        y:
            axisX.x
    };

    if (
        dot(
            axisY,
            normalize(side12)
        ) < 0
    ) {
        axisY =
            multiply(
                axisY,
                -1
            );
    }

    const center =
        corners.reduce(
            (sum, point) =>
                add(
                    sum,
                    point
                ),
            {
                x:
                    0,
                y:
                    0
            }
        );

    center.x /=
        corners.length;
    center.y /=
        corners.length;

    const p0Offset =
        subtract(
            p0,
            center
        );

    const xSign =
        dot(
            p0Offset,
            axisX
        ) < 0
            ? -1
            : 1;

    const ySign =
        dot(
            p0Offset,
            axisY
        ) < 0
            ? -1
            : 1;

    const halfWidth =
        width / 2;

    const halfHeight =
        height / 2;

    const cornerFromSigns = (
        signX: number,
        signY: number
    ) =>
        add(
            add(
                center,
                multiply(
                    axisX,
                    signX * halfWidth
                )
            ),
            multiply(
                axisY,
                signY * halfHeight
            )
        );

    return [
        cornerFromSigns(
            xSign,
            ySign
        ),
        cornerFromSigns(
            -xSign,
            ySign
        ),
        cornerFromSigns(
            -xSign,
            -ySign
        ),
        cornerFromSigns(
            xSign,
            -ySign
        )
    ];
}

export function evaluateRectangleFit(
    geometry: PathGeometry,
    anchors: AnchorPoint[],
    angles: CornerAngle[],
    segments: GeometrySegment[]
): RectangleFitQuality {
    const cornerAnchors =
        anchors.filter(
            anchor =>
                anchor.type === "corner"
        );

    const emptyFit: RectangleFitQuality = {
        valid:
            false,
        corners:
            [],
        rebuiltCorners:
            [],
        maxAngleError:
            Number.POSITIVE_INFINITY,
        averageAngleError:
            Number.POSITIVE_INFINITY,
        maxSegmentDeviationRatio:
            Number.POSITIVE_INFINITY,
        oppositeParallelError:
            Number.POSITIVE_INFINITY,
        oppositeLengthError:
            Number.POSITIVE_INFINITY,
        minSideLength:
            0
    };

    if (
        !geometry.closed ||
        cornerAnchors.length !== 4 ||
        segments.length !== 4 ||
        angles.length !== 4
    ) {
        return emptyFit;
    }

    const corners =
        cornerAnchors.map(
            anchor => {
                const node =
                    geometry.nodes[
                        anchor.index
                    ];

                return new Point(
                    node.x,
                    node.y
                );
            }
        );

    const sideVectors =
        corners.map(
            (corner, index) =>
                subtract(
                    corners[
                        (index + 1) %
                        corners.length
                    ],
                    corner
                )
        );

    const sideLengths =
        sideVectors.map(
            vector =>
                length(
                    vector
                )
        );

    const minSideLength =
        Math.min(
            ...sideLengths
        );

    const maxSegmentDeviationRatio =
        Math.max(
            ...segments.map(
                segment =>
                    segment.deviationRatio
            )
        );

    const angleErrors =
        angles.map(
            angle =>
                Math.abs(
                    angle.angle -
                    90
                )
        );

    const maxAngleError =
        Math.max(
            ...angleErrors
        );

    const averageAngleError =
        angleErrors.reduce(
            (sum, error) =>
                sum + error,
            0
        ) / angleErrors.length;

    const oppositeParallelError =
        Math.max(
            calculateParallelError(
                sideVectors[0],
                sideVectors[2]
            ),
            calculateParallelError(
                sideVectors[1],
                sideVectors[3]
            )
        );

    const oppositeLengthError =
        Math.max(
            Math.abs(
                sideLengths[0] -
                sideLengths[2]
            ) /
                Math.max(
                    sideLengths[0],
                    sideLengths[2],
                    1
                ),
            Math.abs(
                sideLengths[1] -
                sideLengths[3]
            ) /
                Math.max(
                    sideLengths[1],
                    sideLengths[3],
                    1
                )
        );

    const valid =
        minSideLength >= 6 &&
        maxSegmentDeviationRatio <= 0.06 &&
        maxAngleError <= 22 &&
        averageAngleError <= 14 &&
        oppositeParallelError <= 14 &&
        oppositeLengthError <= 0.32;

    return {
        valid,
        corners:
            corners.map(
                toPoint
            ),
        rebuiltCorners:
            calculateRebuiltCorners(
                corners
            ).map(
                toPoint
            ),
        maxAngleError,
        averageAngleError,
        maxSegmentDeviationRatio,
        oppositeParallelError,
        oppositeLengthError,
        minSideLength
    };
}
