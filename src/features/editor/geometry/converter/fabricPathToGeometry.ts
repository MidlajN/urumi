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

                previous.type = "smooth";

                const nextNode: PathNode = {
                    id: createPathNodeId(),

                    type: "smooth",

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

    return {
        id: createPathNodeId(),
        nodes,
        closed,
    }
}