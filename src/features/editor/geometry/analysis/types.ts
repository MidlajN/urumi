export type StrokeIntent =
    | "line"
    | "curve"
    | "freeform";


export type StrokeMetrics = {
    nodeCount: number;

    pathLength: number;

    directDistance: number;

    straightness: number;

    maxDeviation: number;

    averageDeviation: number;

    normalizedDeviation: number;
};

export type GeometryFamily =
    | "line"
    | "arc"
    | "closed-shape"
    | "freeform";


export type GeometryMetrics = {
    nodeCount: number;

    pathLength: number;

    closureRatio: number;

    curvatureSignChanges: number;
};

export type SegmentType =
    | "line"
    | "curve";

export type GeometrySegment = {

    startAnchorId: string;

    endAnchorId: string;

    startIndex: number;

    endIndex: number;

    nodeIndices: number[];

    type: SegmentType;

    maxDeviation: number;

    averageDeviation: number;

    deviationRatio: number

};

export type CornerAngle = {
    cornerId: string;
    angle: number;
};

export type GeometryFeatures = {

    closed: boolean;

    cornerIds: Set<string>;

    anchors: AnchorPoint[];

    cornerCount: number;

    segments: GeometrySegment[];

    metrics: GeometryMetrics;

    bounds: GeometryBounds;

    circleFit: CircleFitQuality;

    angles: CornerAngle[];
};

export type ShapeIntent =
    | "line"
    | "rectangle"
    | "triangle"
    | "circle"
    | "freeform";

export type AnchorType =
    | "start"
    | "end"
    | "corner";

export type AnchorPoint = {

    nodeId: string;

    index: number;

    type: AnchorType;
};

export type GeometryBounds = {

    minX: number;

    minY: number;

    maxX: number;

    maxY: number;

    width: number;

    height: number;

    centerX: number;

    centerY: number;
}

export type CircleFitQuality = {
    center: {
        x: number;
        y: number;
    };

    radius: number;

    valid: boolean;

    rmsError: number;

    maxError: number;

    normalizedRmsError: number;

    normalizedMaxError: number;

    radiusSpreadRatio: number;

    aspectRatio: number;

    circumferenceRatio: number;
};
