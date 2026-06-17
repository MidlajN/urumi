import type {
    DimensionOverlayConfig
} from "../config/dimensions";
import {
    DIMENSION_OVERLAY_CONFIG
} from "../config/dimensions";
import type {
    ViewportPoint
} from "../types";

export type MeasurementVisibility = {
    showGuide: boolean;
    showLabel: boolean;
};

export type MeasurementVisibilityState = {
    hovered?: boolean;
    selected?: boolean;
    pinned?: boolean;
    forceVisible?: boolean;
};

export const VISIBLE_MEASUREMENT: MeasurementVisibility = {
    showGuide: true,
    showLabel: true,
};

export function getViewportLength(
    start: ViewportPoint,
    end: ViewportPoint
) {
    return Math.hypot(
        end.x -
            start.x,
        end.y -
            start.y
    );
}

export function getMeasurementVisibility(
    screenLength: number,
    config: DimensionOverlayConfig = DIMENSION_OVERLAY_CONFIG,
    state: MeasurementVisibilityState = {}
): MeasurementVisibility {
    const forceVisible =
        state.forceVisible ||
        state.pinned ||
        (
            state.hovered &&
            config.alwaysShowHoveredSegment
        ) ||
        (
            state.selected &&
            config.alwaysShowSelectedSegment
        );

    if (forceVisible) {
        return VISIBLE_MEASUREMENT;
    }

    return {
        showGuide:
            screenLength >=
            config.segmentGuideThresholdPx,
        showLabel:
            screenLength >=
            config.segmentLabelThresholdPx,
    };
}

export function getSegmentMeasurementVisibility(
    start: ViewportPoint,
    end: ViewportPoint,
    config: DimensionOverlayConfig = DIMENSION_OVERLAY_CONFIG,
    state: MeasurementVisibilityState = {}
) {
    return getMeasurementVisibility(
        getViewportLength(
            start,
            end
        ),
        config,
        state
    );
}
