import type {
    PathGeometry,
    PathNode
} from "../pathModel";
import { ANALYSIS_CONFIG } from "./config";

function calculateNodeAngle(
    prev: PathNode,
    current: PathNode,
    next: PathNode
) {
    const ax = prev.x - current.x;

    const ay = prev.y - current.y;

    const bx = next.x - current.x;

    const by = next.y - current.y;

    const magA = Math.hypot(ax, ay);

    const magB = Math.hypot(bx, by);

    if (
        magA === 0 ||
        magB === 0
    ) {
        return 180;
    }

    const dot = ax * bx + ay * by;

    const normalized = Math.max(
        -1,
        Math.min(
            1,
            dot / (magA * magB)
        )
    );

    return (Math.acos(normalized) * 180) / Math.PI;
}

export function detectCorners(
    geometry: PathGeometry,
    threshold = ANALYSIS_CONFIG.cornerThreshold
): Set<string> {

    const corners = new Set<string>();

    const nodes = geometry.nodes;

    if (nodes.length < 3) {
        return corners
    }

    const startIndex = geometry.closed ? 0 : 1;

    const endIndex = geometry.closed ? nodes.length : nodes.length - 1;

    for (let i = startIndex; i < endIndex; i++) {

        let prevIndex = i - 1;

        let nextIndex = i + 1;

        if (geometry.closed) {

            prevIndex = (i - 1 + nodes.length) % nodes.length;

            nextIndex = (i + 1) % nodes.length;
        } 
        const prev = nodes[prevIndex];

        const current = nodes[i];

        const next = nodes[nextIndex];

        // const prev = nodes[i - 1];

        // const current = nodes[i];

        // const next = nodes[i + 1];

        const angle = calculateNodeAngle(
            prev,
            current,
            next
        );

        if (angle < threshold) {
            corners.add(current.id);
        }
    }

    return corners;
}