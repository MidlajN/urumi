import { Point } from "fabric";

import type { PathGeometry } from "../pathModel";

import type { GeometryMetrics } from "./types";
import { distance } from "./geometryMath";


function cross(
    ax: number,
    ay: number,
    bx: number,
    by: number
) {
    return ( ax * by - ay * bx )
}

export function calculateGeometryMetrics(
    geometry: PathGeometry
): GeometryMetrics {

    const nodes = geometry.nodes;

    const nodeCount = nodes.length;

    if (nodeCount < 2) {
        return {
            nodeCount,
            pathLength: 0,
            curvatureSignChanges: 0,
            closureRatio: 0
        };
    }

    const start = new Point(
        nodes[0].x,
        nodes[0].y
    );

    const end = new Point(
        nodes[nodes.length - 1].x,
        nodes[nodes.length - 1].y
    );

    const closureDist = geometry.closed ? 0 : distance(start, end);

    const xs = nodes.map(node => node.x);
    const ys = nodes.map(node => node.y);

    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);

    const diagonal = Math.hypot(width, height);

    const closureRatio = geometry.closed ? 0 : closureDist / Math.max(diagonal, 1);

    let curvatureSignChanges = 0;

    let prevSign = 0;

    for (let i = 1; i < nodes.length - 1; i++) {

        const a = nodes[i - 1];
        const b = nodes[i];
        const c = nodes[i + 1];

        const abx = b.x - a.x;

        const aby = b.y - a.y;

        const bcx = c.x - b.x;

        const bcy = c.y - b.y;

        const curvature = cross(abx, aby, bcx, bcy);

        const sign = curvature > 0 ? 1 : curvature < 0 ? -1 : 0;

        if (
            sign !== 0 &&
            prevSign !== 0 &&
            sign !== prevSign
        ) {
            curvatureSignChanges++
        }

        if (sign !== 0) {
            prevSign = sign;
        }
    }


    let pathLength = 0;

    for (let i = 1; i < nodes.length; i++) {

        const previous = new Point(
            nodes[i - 1].x,
            nodes[i - 1].y
        );

        const current = new Point(
            nodes[i].x,
            nodes[i].y
        );

        pathLength += distance(
            previous,
            current
        );
    }

    if (
        geometry.closed &&
        nodes.length > 2
    ) {
        pathLength += distance(
            new Point(
                nodes[nodes.length - 1].x,
                nodes[nodes.length - 1].y
            ),
            new Point(
                nodes[0].x,
                nodes[0].y
            )
        );
    }

    return {
        nodeCount,

        pathLength,

        closureRatio: closureRatio,

        curvatureSignChanges
    };
}
