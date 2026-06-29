import { Point } from "fabric";
import { createCornerNode, type PathGeometry } from "../../pathModel";

import type {
    GeometryFeatures
} from "../types";

type Bounds = {

    minX: number;
    minY: number;

    maxX: number;
    maxY: number;
};

function calculateBounds(
    geometry: PathGeometry
): Bounds {

    const xs = geometry.nodes.map(
        node => node.x
    );

    const ys = geometry.nodes.map(
        node => node.y
    );

    return {

        minX: Math.min(...xs),

        minY: Math.min(...ys),

        maxX: Math.max(...xs),

        maxY: Math.max(...ys)
    };
}

export function rebuildRectangle(
    geometry: PathGeometry,
    _features: GeometryFeatures
) {

    const bounds = calculateBounds(geometry);

    return {

        ...geometry,

        closed: true,

        nodes: [

            createCornerNode(
                new Point(
                    bounds.minX,
                    bounds.minY
                )
            ),

            createCornerNode(
                new Point(
                    bounds.maxX,
                    bounds.minY
                )
            ),

            createCornerNode(
                new Point(
                    bounds.maxX,
                    bounds.maxY
                )
            ),

            createCornerNode(
                new Point(
                    bounds.minX,
                    bounds.maxY
                )
            )

        ]
    };
}
