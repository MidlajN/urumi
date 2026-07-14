import {
    BUILTIN_MATERIALS,
} from "./builtin";

import type {
    Material,
} from "./types";

const materialMap =
    new Map(
        BUILTIN_MATERIALS.map(
            material => [
                material.id,
                material,
            ]
        )
    );

export function listMaterials():
readonly Material[] {

    return BUILTIN_MATERIALS;
}

export function getMaterial(
    id: string
): Material | undefined {

    return materialMap.get(id);
}

export function hasMaterial(
    id: string
): boolean {

    return materialMap.has(id);
}