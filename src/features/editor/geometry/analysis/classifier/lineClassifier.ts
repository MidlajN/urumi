import type {
    GeometryFeatures
} from "../types";

export function isLine(
    features: GeometryFeatures
) {

    if (features.closed) return false;

    if (features.cornerCount > 0) return false;

    if (features.segments.length !== 1) return false;

    return (
        features.segments[0].type === 'line'
    )
}