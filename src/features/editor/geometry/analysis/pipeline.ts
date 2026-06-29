import type {
    PathGeometry
} from "../pathModel";
import { classifyShape } from "./classifyShape";
import { extractFeatures } from "./extractFeatures";

import {
    simplifyGeometry
} from "./fitter";

import { reconstructShape } from "./reconstruction";

import {
    repairClosedGeometry
} from "./topology";

export function cleanupGeometry(
    geometry: PathGeometry
): PathGeometry {

    const simplified = simplifyGeometry(
        geometry,
        4
    );

    return repairClosedGeometry(
        simplified
    );
}


export function analyzeFreeDrawIntent(
    geometry: PathGeometry
) {

    const cleaned = cleanupGeometry(geometry);

    const features = extractFeatures(cleaned);

    const intent = classifyShape(features);

    const reconstructed = reconstructShape(
        cleaned,
        features,
        intent,
    )

    return {

        geometry: reconstructed,
        features,
        intent
    };
}