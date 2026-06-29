import type {
    PathGeometry
} from "../pathModel";

import {
    detectCorners
} from "./cornerDetection";

import {
    analyzeSegments
} from "./segmentAnalysis";

import {
    calculateGeometryMetrics
} from "./metrics";
import {
    evaluateCircleFit
} from "./circleFit";
import {
    calculateGeometryBounds
} from "./geometryMath";

import type {
    GeometryFeatures
} from "./types";

import { calculateCornerAngles } from "./featureExtractors/cornerAngles";
import { extractAnchors } from "./anchorExtraction";

export function extractFeatures(
    geometry: PathGeometry
): GeometryFeatures {

    const cornerIds = detectCorners(geometry);

    const segments = analyzeSegments(geometry, cornerIds);

    const metrics = calculateGeometryMetrics(geometry);

    const bounds =
        calculateGeometryBounds(
            geometry.nodes
        );

    const circleFit =
        evaluateCircleFit(
            geometry,
            bounds,
            metrics.pathLength
        );

    const angles = calculateCornerAngles(
        geometry,
        cornerIds
    );

    const anchors = extractAnchors(
        geometry,
        cornerIds
    )

    return {

        closed: geometry.closed,

        cornerIds,

        anchors,

        cornerCount: cornerIds.size,

        segments,

        metrics,

        bounds,

        circleFit,

        angles
    };
}
