import type {
    FabricObject,
} from "fabric";

import {
    DEFAULT_MANUFACTURING_METADATA,
    type ManufacturingMetadata,
} from "./types";

function cloneMetadata(
    metadata: ManufacturingMetadata
): ManufacturingMetadata {
    
    return {
        ...metadata,
    };
}

export function ensureManufacturingMetadata(
    object: FabricObject
): ManufacturingMetadata {

    if (!object.manufacturing) {
        object.manufacturing = cloneMetadata(
            DEFAULT_MANUFACTURING_METADATA
        );
    }

    return object.manufacturing;
}

export function getManufacturingMetadata(
    object: FabricObject
): ManufacturingMetadata {

    return ensureManufacturingMetadata(
        object
    );
}

export function setManufacturingMetadata(
    object: FabricObject,
    metadata: ManufacturingMetadata
): void {

    object.manufacturing =
        cloneMetadata(
            metadata
        );
}