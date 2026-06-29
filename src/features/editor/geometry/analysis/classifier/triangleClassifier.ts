import type {
    GeometryFeatures
} from "../types";

export function isTriangle(
    features: GeometryFeatures
) {

    const {
        closed,
        cornerCount,
        segments
    } = features;

    if (!closed) return false;

    if (cornerCount !== 3) return false

    const allSegmentAreLines = segments.every(segment => segment.type == "line")

    return allSegmentAreLines
}