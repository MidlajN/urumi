import { Point } from "fabric";

import { 
    createCornerNode, 
    createPathNodeId,  
    type PathGeometry,
    type PathNode
} from "../pathModel";

type FabricCommand = 
    | ["M", number, number]
    | ["L", number, number]
    | ["C", number, number, number, number, number, number]
    | ["Z"];

const SMOOTH_TANGENT_TOLERANCE_DEG =
    12;

const HANDLE_EPSILON =
    0.001;

function handleVectorLength(
    x: number,
    y: number
) {
    return Math.hypot(
        x,
        y
    );
}

function isSmoothTangentNode(
    node: PathNode
) {
    if (
        !node.handleIn ||
        !node.handleOut
    ) {
        return Boolean(
            node.handleIn ||
            node.handleOut
        );
    }

    const inX =
        node.x -
        node.handleIn.x;

    const inY =
        node.y -
        node.handleIn.y;

    const outX =
        node.handleOut.x -
        node.x;

    const outY =
        node.handleOut.y -
        node.y;

    const inLength =
        handleVectorLength(
            inX,
            inY
        );

    const outLength =
        handleVectorLength(
            outX,
            outY
        );

    if (
        inLength < HANDLE_EPSILON ||
        outLength < HANDLE_EPSILON
    ) {
        return false;
    }

    const dot =
        (
            inX * outX +
            inY * outY
        ) /
        (
            inLength *
            outLength
        );

    const tolerance =
        Math.cos(
            (
                SMOOTH_TANGENT_TOLERANCE_DEG *
                Math.PI
            ) /
            180
        );

    return dot >= tolerance;
}

function inferNodeTypes(
    nodes: PathNode[]
) {
    nodes.forEach(
        (
            node
        ) => {
            node.type =
                isSmoothTangentNode(
                    node
                )
                    ? "smooth"
                    : "corner";
        }
    );
}

export function fabricPathToGeometry(
    commands: FabricCommand[]
): PathGeometry {

    const nodes: PathNode[] = [];

    let closed = false;

    for (const command of commands) {
        switch (command[0]) {
            case "M": {
                const [, x, y] = command;

                nodes.push(
                    createCornerNode(
                        new Point(x, y)
                    )
                );

                break;
            }

            case "L": {
                const [, x, y] = command;

                nodes.push(
                    createCornerNode(
                        new Point(x, y)
                    )
                );

                break;
            }

            case "C": {
                const [, c1x, c1y, c2x, c2y, ex, ey ] = command;

                const previous = nodes[nodes.length - 1];

                if (!previous) break;

                previous.handleOut = {
                    x: c1x,
                    y: c1y
                };

                const nextNode: PathNode = {
                    id: createPathNodeId(),

                    type: "corner",

                    x: ex,
                    y: ey,

                    handleIn: {
                        x: c2x,
                        y: c2y
                    }
                };

                nodes.push(nextNode);

                break;
            }
            case "Z": {
                closed = true;
                break;
            }
        }
    }

    inferNodeTypes(
        nodes
    );

    return {
        id: createPathNodeId(),
        nodes,
        closed,
    }
}
