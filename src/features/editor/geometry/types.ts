import type {
    Canvas,
    FabricObject,
    Point
} from "fabric";

export type SnapTargetType =
    | "endpoint"
    | "midpoint"
    | "center"
    | "quadrant";

export type SnapContext =
    | "OBJECT_MOVE"
    | "NODE_EDIT"
    | "POLYLINE_DRAW"
    | "DIMENSION_EDIT";

export type ScenePoint = {
    x: number;
    y: number;
};

export type SnapTarget = {
    id: string;
    point: Point;
    type: SnapTargetType;
    sourceId?: string;
    nodeId?: string;
};

export type SnapResult = {
    snapped: boolean;
    point: Point;
    context?: SnapContext;
    targetType: SnapTargetType | null;
    targetId?: string;
    distancePx?: number;
};

export type SnapOptions = {
    canvas: Canvas;
    context: SnapContext;
    excludeObjects?: FabricObject[];
    excludeTargetIds?: string[];
    excludeNodeIds?: string[];
    extraTargets?: SnapTarget[];
    maxDistancePx?: number;
    allowedTargetTypes?: SnapTargetType[];
};

export type ObjectSnapResult = SnapResult & {
    offset: Point;
    sourceTargetId?: string;
};
