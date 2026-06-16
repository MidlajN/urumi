import type { RefObject } from "react";

import type {
    SelectionGeometry,
    SelectionGeometryPatch,
    SelectionNode,
    SelectionSegment,
    ViewportPoint,
} from "../hooks/useSelectionGeometry";

export type OverlayRef = RefObject<HTMLDivElement | null>;

export type OverlayCommit = (
    patch: SelectionGeometryPatch
) => void;

export type MeasurementCommit = (
    value: number
) => void;

export type MeasurementGuideModel = {
    main: {
        start: ViewportPoint;
        end: ViewportPoint;
    };
    extensions: Array<{
        start: ViewportPoint;
        end: ViewportPoint;
    }>;
    label: {
        point: ViewportPoint;
        angle: number;
    };
};

export type {
    SelectionGeometry,
    SelectionGeometryPatch,
    SelectionNode,
    SelectionSegment,
    ViewportPoint,
};
