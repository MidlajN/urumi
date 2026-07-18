import {
    getMaterial,
} from "../materials/registry";

import {
    getToolProfile,
} from "../tools/registry";

import type {
    Material,
    MaterialToolConfiguration,
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

    materialToolConfiguration: MaterialToolConfiguration;

}

export interface ResolvedManufacturingJob {

    material: Material;

    operations:
        Record<
            string,
            ResolvedJobOperation
        >;

}

/**
 * Resolves a manufacturing job into concrete registry entries. After this
 * returns, downstream code never needs getMaterial(), getToolProfile(), or
 * material.operations lookups — the resolved job carries everything.
 */
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

        const materialOperation =
            material.operations[
                operationId as keyof typeof material.operations
            ];

        if (!materialOperation?.enabled) {
            continue;
        }

        const materialToolConfiguration =
            materialOperation.toolConfigurations.find(
                (configuration) =>
                    configuration.toolId === selection.toolId
            );

        if (!materialToolConfiguration?.enabled) {
            continue;
        }

        operations[
            operationId
        ] = {

            operationId,

            tool,

            materialToolConfiguration,

        };

    }

    return {

        material,

        operations,

    };

}
