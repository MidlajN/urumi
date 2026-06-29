import { type PathGeometry } from "../../pathModel";

import type {
    GeometryFeatures
} from "../types";

export function rebuildLine(
    geometry: PathGeometry,
    features: GeometryFeatures
): PathGeometry {

    const start = features.anchors.find(
        anchor => anchor.type === 'start'
    );

    const end = features.anchors.find(
        anchor => anchor.type === 'end'
    );

    if (!start || !end) return geometry;

    const first = geometry.nodes[start.index];

    const last = geometry.nodes[end.index];

    if (!first || !last) return geometry;

    return {
        ...geometry,

        // nodes: [
        //     createCornerNode(
        //         new Point(first.x, first.y)
        //     ),

        //     createCornerNode(
        //         new Point(last.x, last.y)
        //     ),
        // ]

        nodes: [
            {
                ...first,
                type: "corner",
                handleIn: undefined,
                handleOut: undefined
            },

            {
                ...last,
                type: "corner",
                handleIn: undefined,
                handleOut: undefined
            },
        ]
    }
}