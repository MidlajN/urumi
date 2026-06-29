import { isCircle } from "./classifier/circleClassifier";
import { isLine } from "./classifier/lineClassifier";
import { isRectangle } from "./classifier/rectangleClassifier";
import { isTriangle } from "./classifier/triangleClassifier";

import type {
    GeometryFeatures,
    ShapeIntent
} from "./types";

export function classifyShape(
    features: GeometryFeatures
): ShapeIntent {

    if (
        isLine(features)
    ) {
        return "line";
    }

    if (
        isRectangle(features)
    ) {
        return "rectangle";
    }

    if (
        isTriangle(features)
    ) {
        return "triangle";
    }

    if (
        isCircle(features)
    ) {
        return "circle";
    }

    return "freeform";
}