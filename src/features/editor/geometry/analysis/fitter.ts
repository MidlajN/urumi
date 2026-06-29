import type {
    PathGeometry,
    PathNode
} from "../pathModel";

function distanceToSegment(
    px: number,
    py: number,

    ax: number,
    ay: number,

    bx: number,
    by: number
) {

    const dx = bx - ax;
    const dy = by - ay;

    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
        return Math.hypot(
            px - ax,
            py - ay
        );
    }

    let t = ((px - ax) * dx + (py - ay) * dy) / lengthSquared;

    t = Math.max(
        0,
        Math.min(1, t)
    );

    const projX = ax + t * dx;

    const projY = ay + t * dy;

    return Math.hypot(
        px - projX,
        py - projY
    );
}

function simplifyIndices(
    nodes: PathNode[],
    startIndex: number,
    endIndex: number,
    tolerance: number,
    keep: Set<number>
) {

    let maxDistance = 0;

    let splitIndex = -1;

    const start = nodes[startIndex];

    const end = nodes[endIndex];

    for (let i = startIndex + 1; i < endIndex; i++) {

        const node = nodes[i];

        const distance = distanceToSegment(
            node.x,
            node.y,

            start.x,
            start.y,

            end.x,
            end.y
        );

        if (distance > maxDistance) {

            maxDistance = distance;

            splitIndex = i;
        }
    }

    if (
        maxDistance > tolerance &&
        splitIndex !== -1
    ) {

        keep.add(splitIndex);

        simplifyIndices(
            nodes,
            startIndex,
            splitIndex,
            tolerance,
            keep
        );

        simplifyIndices(
            nodes,
            splitIndex,
            endIndex,
            tolerance,
            keep
        );
    }
}

export function simplifyGeometry(
    geometry: PathGeometry,
    tolerance = 4
): PathGeometry {

    const nodes = geometry.nodes;

    if ( nodes.length <= 3 ) {
        return geometry;
    }

    const keep = new Set<number>();

    keep.add(0);

    keep.add(nodes.length - 1);

    simplifyIndices(
        nodes,
        0,
        nodes.length - 1,
        tolerance,
        keep
    );

    const nextNodes = nodes.filter(
        (_, index) => keep.has(index)
    );

    return {
        ...geometry,
        nodes: nextNodes
    };
}