import {
    describe,
    expect,
    it
} from "vitest";

import {
    fabricPathToGeometry
} from "./fabricPathToGeometry";

import {
    buildFabricPathData
} from "../pathBuilder";

describe(
    "fabricPathToGeometry",
    () => {
        it(
            "converts simple line path",
            () => {
                const commands = [
                    ["M", 0, 0],
                    ["L", 100, 0]
                ];

                const geometry =
                    fabricPathToGeometry(
                        commands as never
                    );

                expect(
                    geometry.closed
                ).toBe(false);

                expect(
                    geometry.nodes
                        .length
                ).toBe(2);

                expect(
                    geometry.nodes[0]
                        .type
                ).toBe(
                    "corner"
                );

                expect(
                    geometry.nodes[1]
                        .type
                ).toBe(
                    "corner"
                );

                expect(
                    buildFabricPathData(
                        geometry
                    )
                ).toEqual(
                    commands
                );
            }
        );

        it(
            "converts cubic bezier path",
            () => {
                const commands = [
                    ["M", 0, 0],
                    [
                        "C",
                        10,
                        0,
                        20,
                        10,
                        30,
                        10
                    ]
                ];

                const geometry =
                    fabricPathToGeometry(
                        commands as never
                    );

                expect(
                    geometry.closed
                ).toBe(false);

                expect(
                    geometry.nodes
                        .length
                ).toBe(2);

                expect(
                    geometry.nodes[0]
                        .handleOut
                ).toEqual({
                    x: 10,
                    y: 0
                });

                expect(
                    geometry.nodes[1]
                        .handleIn
                ).toEqual({
                    x: 20,
                    y: 10
                });

                expect(
                    geometry.nodes[0]
                        .type
                ).toBe(
                    "smooth"
                );

                expect(
                    geometry.nodes[1]
                        .type
                ).toBe(
                    "smooth"
                );

                expect(
                    buildFabricPathData(
                        geometry
                    )
                ).toEqual(
                    commands
                );
            }
        );

        it(
            "converts closed polygon",
            () => {
                const commands = [
                    ["M", 0, 0],
                    ["L", 100, 0],
                    ["L", 100, 100],
                    ["Z"]
                ];

                const geometry =
                    fabricPathToGeometry(
                        commands as never
                    );

                expect(
                    geometry.closed
                ).toBe(true);

                expect(
                    geometry.nodes
                        .length
                ).toBe(3);

                const rebuilt =
                    buildFabricPathData(
                        geometry
                    );

                expect(
                    rebuilt.at(-1)
                ).toEqual([
                    "Z"
                ]);
            }
        );

        it(
            "converts mixed line and cubic segments",
            () => {
                const commands = [
                    ["M", 0, 0],
                    ["L", 50, 0],
                    [
                        "C",
                        70,
                        0,
                        80,
                        20,
                        100,
                        20
                    ]
                ];

                const geometry =
                    fabricPathToGeometry(
                        commands as never
                    );

                expect(
                    geometry.nodes
                        .length
                ).toBe(3);

                expect(
                    geometry.nodes[1]
                        .handleOut
                ).toEqual({
                    x: 70,
                    y: 0
                });

                expect(
                    geometry.nodes[2]
                        .handleIn
                ).toEqual({
                    x: 80,
                    y: 20
                });

                const rebuilt =
                    buildFabricPathData(
                        geometry
                    );

                expect(
                    rebuilt[0]
                ).toEqual([
                    "M",
                    0,
                    0
                ]);

                expect(
                    rebuilt[2][0]
                ).toBe("C");
            }
        );

        it(
            "infers cusp nodes as corners while preserving handles",
            () => {
                const commands = [
                    ["M", 0, 0],
                    [
                        "C",
                        10,
                        0,
                        10,
                        10,
                        20,
                        10
                    ],
                    [
                        "C",
                        20,
                        -10,
                        30,
                        -10,
                        40,
                        0
                    ]
                ];

                const geometry =
                    fabricPathToGeometry(
                        commands as never
                    );

                expect(
                    geometry.nodes[1]
                        .type
                ).toBe(
                    "corner"
                );

                expect(
                    geometry.nodes[1]
                        .handleIn
                ).toEqual({
                    x: 10,
                    y: 10
                });

                expect(
                    geometry.nodes[1]
                        .handleOut
                ).toEqual({
                    x: 20,
                    y: -10
                });

                expect(
                    buildFabricPathData(
                        geometry
                    )
                ).toEqual(
                    commands
                );
            }
        );

        it(
            "preserves closed geometry for cubic loops",
            () => {
                const commands = [
                    ["M", 0, 0],
                    [
                        "C",
                        10,
                        0,
                        20,
                        10,
                        30,
                        10
                    ],
                    [
                        "C",
                        40,
                        20,
                        20,
                        40,
                        0,
                        0
                    ],
                    ["Z"]
                ];

                const geometry =
                    fabricPathToGeometry(
                        commands as never
                    );

                expect(
                    geometry.closed
                ).toBe(true);

                expect(
                    geometry.nodes
                        .length
                ).toBe(3);

                const rebuilt =
                    buildFabricPathData(
                        geometry
                    );

                expect(
                    rebuilt.at(-1)
                ).toEqual([
                    "Z"
                ]);

                expect(
                    rebuilt.length
                ).toBeGreaterThan(0);
            }
        );
    }
);
