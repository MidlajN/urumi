import type {
    PathGeometry
} from "../pathModel";
import { ANALYSIS_CONFIG } from "./config";

import {
    calculateGeometryMetrics
} from "./metrics";


export function shouldCloseGeometry(
    geometry: PathGeometry
): boolean {

    if (geometry.closed) {
        return true;
    }

    if (
        geometry.nodes.length <
        ANALYSIS_CONFIG.minClosedShapeNodes
    ) {
        return false;
    }

    const metrics =
        calculateGeometryMetrics(
            geometry
        );

    return (
        metrics.closureRatio <
        ANALYSIS_CONFIG.closureRatioThreshold
    );
}

export function repairClosedGeometry(
    geometry: PathGeometry
): PathGeometry {

    if (
        !shouldCloseGeometry(
            geometry
        )
    ) {
        return geometry;
    }

    if (
        geometry.nodes.length < 2
    ) {
        return geometry;
    }

    const nodes =
        geometry.nodes.map(
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
        );

    const first =
        nodes[0];

    const last =
        nodes[
            nodes.length - 1
        ];

    const seamX =
        (
            first.x +
            last.x
        ) / 2;

    const seamY =
        (
            first.y +
            last.y
        ) / 2;

    // nodes[0] = {
    //     ...first,

    //     x: seamX,
    //     y: seamY
    // };

    // nodes[
    //     nodes.length - 1
    // ] = {
    //     ...last,

    //     x: seamX,
    //     y: seamY
    // };

    const mergedFirst = {
        ...first,
        x: seamX,
        y: seamY
    };

    const repairedNodes = [
        mergedFirst,
        ...nodes.slice(1, -1)
    ];

    return {
        ...geometry,

        closed: true,

        nodes: repairedNodes
    };
}