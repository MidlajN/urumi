import type { PathGeometry } from "../../pathModel";

import type {
    GeometryFeatures
} from "../types";

export function rebuildTriangle(
    geometry: PathGeometry,
    features: GeometryFeatures
): PathGeometry {

    const cornerAnchors = features.anchors.filter(
        anchor => anchor.type === 'corner'
    );

    if (cornerAnchors.length !== 3) return geometry;

    return {

        ...geometry,

        closed: true,

        nodes: cornerAnchors.map(anchor => {

            const node = geometry.nodes[anchor.index];

            return {

                ...node,

                type: "corner",

                handleIn: undefined,

                handleOut: undefined
            };
        })
    };
}