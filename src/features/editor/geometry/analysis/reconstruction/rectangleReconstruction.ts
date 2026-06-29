import { Point } from "fabric";
import { createCornerNode, type PathGeometry } from "../../pathModel";

import type {
    GeometryFeatures
} from "../types";

export function rebuildRectangle(
    geometry: PathGeometry,
    features: GeometryFeatures
) {

    const rebuiltCorners =
        features.rectangleFit.rebuiltCorners;

    if (
        rebuiltCorners.length !== 4
    ) {
        return geometry;
    }

    return {

        ...geometry,

        closed: true,

        nodes: [

            createCornerNode(
                new Point(
                    rebuiltCorners[0].x,
                    rebuiltCorners[0].y
                )
            ),

            createCornerNode(
                new Point(
                    rebuiltCorners[1].x,
                    rebuiltCorners[1].y
                )
            ),

            createCornerNode(
                new Point(
                    rebuiltCorners[2].x,
                    rebuiltCorners[2].y
                )
            ),

            createCornerNode(
                new Point(
                    rebuiltCorners[3].x,
                    rebuiltCorners[3].y
                )
            )

        ]
    };
}
