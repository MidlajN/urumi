import {
    describe,
    expect,
    it
} from "vitest";
import { Point } from "fabric";

import {
    createCornerNode,
    type PathGeometry
} from "../../pathModel";
import {
    extractFeatures
} from "../extractFeatures";
import {
    isCircle
} from "./circleClassifier";
import {
    rebuildCircleGeometry
} from "../reconstruction/circleReconstruction";

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

function createLoop(
    count: number,
    getPoint: (
        angle: number,
        index: number
    ) => Point
) {
    return Array.from(
        {
            length:
                count
        },
        (_, index) =>
            getPoint(
                (index / count) *
                    Math.PI *
                    2,
                index
            )
    );
}

describe(
    "circleClassifier",
    () => {
        it(
            "recognizes a slightly imperfect circle",
            () => {
                const geometry =
                    createClosedGeometry(
                        createLoop(
                            32,
                            (angle, index) => {
                                const radius =
                                    50 +
                                    (index % 3) -
                                    1;

                                return new Point(
                                    Math.cos(angle) *
                                        radius,
                                    Math.sin(angle) *
                                        radius
                                );
                            }
                        )
                    );

                expect(
                    isCircle(
                        extractFeatures(
                            geometry
                        )
                    )
                ).toBe(true);
            }
        );

        it(
            "rejects ellipses instead of rebuilding them as circles",
            () => {
                const geometry =
                    createClosedGeometry(
                        createLoop(
                            32,
                            angle =>
                                new Point(
                                    Math.cos(angle) *
                                        80,
                                    Math.sin(angle) *
                                        40
                                )
                        )
                    );

                expect(
                    isCircle(
                        extractFeatures(
                            geometry
                        )
                    )
                ).toBe(false);
            }
        );

        it(
            "rejects lopsided closed loops",
            () => {
                const geometry =
                    createClosedGeometry(
                        createLoop(
                            40,
                            angle => {
                                const radius =
                                    50 *
                                    (
                                        1 +
                                        0.22 *
                                            Math.sin(
                                                angle * 3
                                            )
                                    );

                                return new Point(
                                    Math.cos(angle) *
                                        radius,
                                    Math.sin(angle) *
                                        radius
                                );
                            }
                        )
                    );

                expect(
                    isCircle(
                        extractFeatures(
                            geometry
                        )
                    )
                ).toBe(false);
            }
        );

        it(
            "reconstructs a detected circle as four smooth bezier nodes",
            () => {
                const geometry =
                    createClosedGeometry(
                        createLoop(
                            32,
                            angle =>
                                new Point(
                                    20 +
                                        Math.cos(angle) *
                                            50,
                                    30 +
                                        Math.sin(angle) *
                                            50
                                )
                        )
                    );

                const features =
                    extractFeatures(
                        geometry
                    );

                const rebuilt =
                    rebuildCircleGeometry(
                        geometry,
                        features
                    );

                expect(
                    rebuilt.closed
                ).toBe(true);

                expect(
                    rebuilt.nodes
                ).toHaveLength(4);

                expect(
                    rebuilt.nodes.every(
                        node =>
                            node.type === "smooth" &&
                            node.handleIn &&
                            node.handleOut
                    )
                ).toBe(true);

                expect(
                    rebuilt.nodes[0].x
                ).toBeCloseTo(
                    20,
                    1
                );

                expect(
                    rebuilt.nodes[0].y
                ).toBeCloseTo(
                    -20,
                    1
                );
            }
        );
    }
);
