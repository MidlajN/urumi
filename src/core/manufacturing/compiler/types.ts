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
 * The canonical manufacturing representation of the current editor state.
 * Future exporters (SVG generator, toolpath planner) consume this document
 * instead of reading the Fabric canvas directly.
 */
export interface ExecutionDocument {

    material: Material;

    operations: ExecutionOperation[];

}
