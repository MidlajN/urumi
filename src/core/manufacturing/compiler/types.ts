import type {
    FabricObject,
} from "fabric";

import type {
    Material,
    MaterialToolConfiguration,
} from "../materials/types";

import type {
    ToolProfile,
} from "../tools/types";

/**
 * References the live Fabric object — Fabric remains the geometry source of
 * truth. Geometry is never cloned, extracted, or serialized here.
 */
export interface ExecutionObject {

    fabricObject: FabricObject;

}

export interface ExecutionOperation {

    operationId: string;

    tool: ToolProfile;

    materialToolConfiguration: MaterialToolConfiguration;

    objects: ExecutionObject[];

}

/**
 * The machine bed rect in canvas units (CSS px at 96 dpi; 1 mm = 96/25.4
 * units). Captured from the workspace at compile time so exporters never
 * need to read the canvas for machine context.
 */
export interface ExecutionBed {

    left: number;

    top: number;

    width: number;

    height: number;

}

/**
 * The canonical manufacturing representation of the current editor state.
 * Future exporters (SVG generator, toolpath planner) consume this document
 * instead of reading the Fabric canvas directly.
 */
export interface ExecutionDocument {

    material: Material;

    /** Null when the canvas has no workspace rect. */
    bed: ExecutionBed | null;

    operations: ExecutionOperation[];

}
