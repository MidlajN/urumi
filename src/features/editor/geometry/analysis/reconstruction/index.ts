import type { PathGeometry } from "../../pathModel";

import type {
    GeometryFeatures,
    ShapeIntent
} from "../types";

import { rebuildLine } from "./lineReconstruction";
import { rebuildRectangle } from "./rectangleReconstruction";
import { rebuildTriangle } from "./triangleReconstruction";
import { rebuildCircleGeometry } from "./circleReconstruction";
import { rebuildFreeformGeometry } from "./freeformReconstruction";

export function reconstructShape(
    geometry: PathGeometry,
    features: GeometryFeatures,
    intent: ShapeIntent
): PathGeometry {

    switch (intent) {

        case "line":
            return rebuildLine(
                geometry,
                features
            );

        case "rectangle":
            return rebuildRectangle(
                geometry,
                features
            );

        case "triangle":
            return rebuildTriangle(
                geometry,
                features
            );

        case "circle":
            return rebuildCircleGeometry(
                geometry,
                features
            );

        default:
            return rebuildFreeformGeometry(
                geometry,
                features
            );
    }
}