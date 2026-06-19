import type {
    SnapTargetType
} from "./types";

export const SNAP_DISTANCE_PX = 12;

export const SNAP_PRIORITY_ORDER: SnapTargetType[] = [
    "endpoint"
];

export const ANGLE_CONSTRAINT_INCREMENT_DEG = 45;

export const SNAP_MARKER = {
    radius: 5,
    activeRadius: 7,
    stroke: "#0891b2",
    fill: "rgba(8, 145, 178, 0.16)",
    lineWidth: 1.5
} as const;
