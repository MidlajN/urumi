import type {
    PathGeometry
} from "../../pathModel";

import type { CornerAngle } from "../types";

function calculateAngle(
    prevX: number,
    prevY: number,

    currentX: number,
    currentY: number,

    nextX: number,
    nextY: number
) {
    const ax = prevX - currentX;
    const ay = prevY - currentY;

    const bx = nextX - currentX;
    const by = nextY - currentY;

    const magA = Math.hypot(ax, ay);
    const magB = Math.hypot(bx, by);

    if (
        magA === 0 ||
        magB === 0
    ) {
        return 180;
    }

    const dot =
        ax * bx +
        ay * by;

    const normalized = Math.max(
        -1,
        Math.min(
            1,
            dot / (magA * magB)
        )
    );

    return (
        Math.acos(normalized) *
        180
    ) / Math.PI;
}



export function calculateCornerAngles(
    geometry: PathGeometry,
    cornerIds: Set<string>
) {

    const cornerIndices =
        geometry.nodes
            .map(
                (node, index) =>
                    cornerIds.has(
                        node.id
                    )
                        ? index
                        : -1
            )
            .filter(
                index =>
                    index >= 0
            );

    const angles: CornerAngle[] = [];

    if (
        cornerIndices.length < 3
    ) {
        return angles;
    }

    const closed =
        geometry.closed;

    for (
        let i = 0;
        i < cornerIndices.length;
        i++
    ) {

        const currentIndex =
            cornerIndices[i];

        let prevCornerIndex: number;
        let nextCornerIndex: number;

        if (closed) {

            prevCornerIndex =
                cornerIndices[
                    (
                        i - 1 +
                        cornerIndices.length
                    ) %
                    cornerIndices.length
                ];

            nextCornerIndex =
                cornerIndices[
                    (
                        i + 1
                    ) %
                    cornerIndices.length
                ];

        } else {

            if (
                i === 0 ||
                i ===
                cornerIndices.length - 1
            ) {
                continue;
            }

            prevCornerIndex =
                cornerIndices[
                    i - 1
                ];

            nextCornerIndex =
                cornerIndices[
                    i + 1
                ];
        }

        const prev =
            geometry.nodes[
                prevCornerIndex
            ];

        const current =
            geometry.nodes[
                currentIndex
            ];

        const next =
            geometry.nodes[
                nextCornerIndex
            ];
        
        const angle = calculateAngle(
            prev.x,
            prev.y,

            current.x,
            current.y,

            next.x,
            next.y
        )

        angles.push({
            cornerId: current.id,
            angle: angle
        });
    }

    return angles;
}