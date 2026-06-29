import {
    describe,
    expect,
    it
} from "vitest";
import {
    Point
} from "fabric";

import {
    createCornerNode,
    type PathGeometry
} from "../../pathModel";
import {
    extractFeatures
} from "../extractFeatures";
import {
    isRectangle
} from "./rectangleClassifier";
import {
    rebuildRectangle
} from "../reconstruction/rectangleReconstruction";

function createClosedGeometry(
    points: Point[]
): PathGeometry {
    return {
        id:
            "test-geometry",
        closed:
            true,
        nodes:
            points.map(
                point =>
                    createCornerNode(
                        point
                    )
            )
    };
}

function createRotatedRectangle(
    width: number,
    height: number,
    rotationDeg: number
) {
    const angle =
        rotationDeg *
        Math.PI /
        180;

    const axisX = {
        x:
            Math.cos(angle),
        y:
            Math.sin(angle)
    };

    const axisY = {
        x:
            -Math.sin(angle),
        y:
            Math.cos(angle)
    };

    const halfWidth =
        width / 2;

    const halfHeight =
        height / 2;

    const fromSigns = (
        signX: number,
        signY: number
    ) =>
        new Point(
            axisX.x * signX * halfWidth +
                axisY.x * signY * halfHeight,
            axisX.y * signX * halfWidth +
                axisY.y * signY * halfHeight
        );

    return [
        fromSigns(
            -1,
            -1
        ),
        fromSigns(
            1,
            -1
        ),
        fromSigns(
            1,
            1
        ),
        fromSigns(
            -1,
            1
        )
    ];
}

function sideAngle(
    start: Point,
    end: Point
) {
    return (
        Math.atan2(
            end.y - start.y,
            end.x - start.x
        ) *
        180 /
        Math.PI
    );
}

describe(
    "rectangleClassifier",
    () => {
        it(
            "recognizes a slightly imperfect rotated rectangle",
            () => {
                const points =
                    createRotatedRectangle(
                        120,
                        70,
                        24
                    );

                points[1].x +=
                    2;
                points[2].y +=
                    1;
                points[3].x -=
                    1;

                const geometry =
                    createClosedGeometry(
                        points
                    );

                expect(
                    isRectangle(
                        extractFeatures(
                            geometry
                        )
                    )
                ).toBe(true);
            }
        );

        it(
            "rejects trapezoids",
            () => {
                const geometry =
                    createClosedGeometry([
                        new Point(
                            0,
                            0
                        ),
                        new Point(
                            110,
                            0
                        ),
                        new Point(
                            84,
                            70
                        ),
                        new Point(
                            16,
                            70
                        )
                    ]);

                expect(
                    isRectangle(
                        extractFeatures(
                            geometry
                        )
                    )
                ).toBe(false);
            }
        );

        it(
            "rejects quadrilaterals with poor right-angle fit",
            () => {
                const geometry =
                    createClosedGeometry([
                        new Point(
                            0,
                            0
                        ),
                        new Point(
                            100,
                            10
                        ),
                        new Point(
                            75,
                            85
                        ),
                        new Point(
                            -20,
                            55
                        )
                    ]);

                expect(
                    isRectangle(
                        extractFeatures(
                            geometry
                        )
                    )
                ).toBe(false);
            }
        );

        it(
            "rebuilds a rotated rectangle without forcing an axis-aligned box",
            () => {
                const geometry =
                    createClosedGeometry(
                        createRotatedRectangle(
                            120,
                            70,
                            30
                        )
                    );

                const features =
                    extractFeatures(
                        geometry
                    );

                const rebuilt =
                    rebuildRectangle(
                        geometry,
                        features
                    );

                const angle =
                    sideAngle(
                        new Point(
                            rebuilt.nodes[0].x,
                            rebuilt.nodes[0].y
                        ),
                        new Point(
                            rebuilt.nodes[1].x,
                            rebuilt.nodes[1].y
                        )
                    );

                expect(
                    rebuilt.nodes
                ).toHaveLength(4);

                expect(
                    angle
                ).toBeCloseTo(
                    30,
                    0
                );
            }
        );
    }
);
