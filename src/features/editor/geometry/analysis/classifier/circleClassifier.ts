import type {
    GeometryFeatures
} from "../types";

export function isCircle(
    features: GeometryFeatures
) {

    const {
        closed,
        metrics,
        cornerCount,
        circleFit
    } = features;

    if (!closed) {
        return false;
    }

    if (
        metrics.nodeCount < 6 ||
        cornerCount > 1 ||
        !circleFit.valid
    ) {
        return false;
    }

    return (
        metrics.closureRatio < 0.08 &&
        circleFit.aspectRatio >= 0.78 &&
        circleFit.normalizedRmsError <= 0.11 &&
        circleFit.normalizedMaxError <= 0.24 &&
        circleFit.radiusSpreadRatio <= 0.32 &&
        circleFit.circumferenceRatio >= 0.72 &&
        circleFit.circumferenceRatio <= 1.18
    );
}
