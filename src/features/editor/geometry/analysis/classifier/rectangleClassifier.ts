import type {
    GeometryFeatures
} from "../types";

export function isRectangle(
    features: GeometryFeatures
) {

    if (
        !features.closed ||
        features.cornerCount !== 4 ||
        !features.rectangleFit.valid
    ) {
        return false;
    }

    return (
        features.segments.every(
            segment =>
                segment.type === "line"
        )
    );
}
