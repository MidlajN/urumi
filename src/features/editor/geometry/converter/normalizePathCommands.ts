import type { CanonicalPathCommand, PathCommand } from "./types";


type PointState = {
    x: number;
    y: number;
};

export function quadraticToCubic(
    sx: number,
    sy: number,
    cx: number,
    cy: number,
    ex: number,
    ey: number
) {
    return {
        c1x:
            sx +
            (2 / 3) *
                (cx - sx),

        c1y:
            sy +
            (2 / 3) *
                (cy - sy),

        c2x:
            ex +
            (2 / 3) *
                (cx - ex),

        c2y:
            ey +
            (2 / 3) *
                (cy - ey),

        ex,
        ey
    };
}

export function normalizePathCommands(
    commands: readonly PathCommand[]
): CanonicalPathCommand[] {
    const normalizedCommands: CanonicalPathCommand[] = [];

    let current: PointState = {
        x: 0,
        y: 0
    }

    let subPathStart: PointState = {
        x: 0,
        y: 0
    }

    for (const command of commands) {
        switch (command[0]) {
            case "M": {
                const [, x, y] = command;

                normalizedCommands.push([
                    "M", x, y
                ])

                current = {
                    x,
                    y
                }

                subPathStart = {
                    x,
                    y
                }

                break;
            }

            case "L": {
                const [, x, y] = command;

                normalizedCommands.push([
                    "L", x, y
                ])

                current = {
                    x,
                    y
                }

                break;
            }

            case "H": {
                const [, x] = command;

                normalizedCommands.push([
                    "L", x, current.y
                ])

                current = {
                    x,
                    y: current.y
                }

                break;
            }

            case "V": {
                const [, y] = command;

                normalizedCommands.push([
                    "L", current.x, y
                ])

                current = {
                    x: current.x,
                    y
                }

                break;
            }

            case "Q": {
                const [, cx, cy, ex, ey] = command;

                const cubic = quadraticToCubic(
                    current.x, current.y,
                    cx, cy,
                    ex, ey
                );

                normalizedCommands.push([
                    "C", 
                    cubic.c1x, 
                    cubic.c1y, 
                    cubic.c2x, 
                    cubic.c2y, 
                    cubic.ex, 
                    cubic.ey
                ]);

                current = {
                    x: ex,
                    y: ey
                }

                break;
            }

            case "C": {
                const [ , c1x, c1y, c2x, c2y, ex, ey ] = command;

                normalizedCommands.push([
                    "C",
                    c1x,
                    c1y,
                    c2x,
                    c2y,
                    ex,
                    ey
                ]);

                current = {
                    x: ex,
                    y: ey
                };

                break;
            }

            case "Z": {
                normalizedCommands.push([
                    "Z"
                ]);

                current = {
                    ...subPathStart
                };

                break;
            }

            default: {
                throw new Error(
                    `Unsupported path command: ${String(
                        command[0]
                    )}`
                );
            }
        }
    }

    return normalizedCommands;
}