import { Point } from "fabric";

import {
    createSmoothNode,
    type PathGeometry
} from "../../pathModel";

import type {
    GeometryFeatures
} from "../types";

import {
    estimateCircle
} from "../circleFit";

const KAPPA = 0.5522847498;

export function rebuildCircleGeometry(
    geometry: PathGeometry,
    _features: GeometryFeatures
): PathGeometry {

    const { center, radius } = estimateCircle(
        geometry
    );

    if (
        !Number.isFinite(radius) ||
        radius <= 0
    ) {
        return geometry;
    }

    const offset = radius * KAPPA;

    return {
        ...geometry,

        closed: true,

        nodes: [

            createSmoothNode(
                new Point(center.x, center.y - radius),
                new Point(center.x + offset, center.y - radius)
            ),

            createSmoothNode(
                new Point(center.x + radius, center.y),
                new Point(center.x + radius, center.y + offset)
            ),

            createSmoothNode(
                new Point(center.x, center.y + radius),
                new Point(center.x - offset, center.y + radius)
            ),

            createSmoothNode(
                new Point(center.x - radius, center.y),
                new Point(center.x - radius, center.y - offset)
            )

        ]
    };
}
