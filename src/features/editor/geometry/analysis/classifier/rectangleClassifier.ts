import type {
    GeometryFeatures
} from "../types";

export function isRectangle(
    features: GeometryFeatures
) {

    if (!features.closed) {
        return false;
    }

    if (
        features.cornerCount !== 4
    ) {
        return false;
    }

    const rightAngles =
        features.angles.filter(
            angle =>
                angle.angle > 60 &&
                angle.angle < 120
        );

    return (
        rightAngles.length === 4
    );
}