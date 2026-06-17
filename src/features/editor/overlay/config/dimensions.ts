export const DIMENSION_OVERLAY_CONFIG = {
    segmentGuideThresholdPx: 60,
    segmentLabelThresholdPx: 120,
    alwaysShowHoveredSegment: true,
    alwaysShowSelectedSegment: true,
} as const;

export type DimensionOverlayConfig =
    typeof DIMENSION_OVERLAY_CONFIG;
