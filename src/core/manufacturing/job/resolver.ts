import {
    getMaterial,
} from "../materials/registry";

import {
    getToolProfile,
} from "../tools/registry";

import type {
    Material,
} from "../materials/types";

import type {
    ToolProfile,
} from "../tools/types";

import type {
    ManufacturingJob,
} from "./types";

export interface ResolvedJobOperation {

    operationId: string;

    tool: ToolProfile;

}

export interface ResolvedManufacturingJob {

    material: Material;

    operations:
        Record<
            string,
            ResolvedJobOperation
        >;

}

export function resolveJob(
    job: ManufacturingJob
): ResolvedManufacturingJob | null {

    if (!job.materialId) {
        return null;
    }

    const material =
        getMaterial(
            job.materialId
        );

    if (!material) {
        return null;
    }

    const operations:
        Record<
            string,
            ResolvedJobOperation
        > = {};

    for (const [
        operationId,
        selection,
    ] of Object.entries(
        job.operationSelections
    )) {

        if (!selection?.enabled) {
            continue;
        }

        const tool =
            getToolProfile(
                selection.toolId
            );

        if (!tool) {
            continue;
        }

        operations[
            operationId
        ] = {

            operationId,

            tool,

        };

    }

    return {

        material,

        operations,

    };

}