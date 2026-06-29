import type {
    PathGeometry
} from "../../pathModel";

import type {
    GeometryFeatures
} from "../types";

export function rebuildFreeformGeometry(
    geometry: PathGeometry,
    features: GeometryFeatures
): PathGeometry {

    return {

        ...geometry,

        closed: features.closed,

        nodes: geometry.nodes.map(
            node => ({

                ...node,

                handleIn:
                    node.handleIn
                        ? {
                            ...node.handleIn
                        }
                        : undefined,

                handleOut:
                    node.handleOut
                        ? {
                            ...node.handleOut
                        }
                        : undefined
            })
        )
    };
}