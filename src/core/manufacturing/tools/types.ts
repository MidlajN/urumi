export interface ToolOffsets {
    x: number;
    y: number;
    z: number;
    a: number;
}

export interface ToolMotionDefaults {
    velocity: number;
    acceleration: number;
}

export interface ToolProfile {
    id: string;

    name: string;

    enabled: boolean;

    offsets: ToolOffsets;

    defaults: ToolMotionDefaults;
}