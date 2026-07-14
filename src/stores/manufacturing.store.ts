import { create } from "zustand";

import {
    EMPTY_JOB,
} from "@/core/manufacturing/job/defaults";

import type {
    ManufacturingJob,
} from "@/core/manufacturing/job/types";

import {
    getMaterial,
} from "@/core/manufacturing/materials/registry";

interface ManufacturingStore {

    job: ManufacturingJob;

    initializeJob: (
        job?: ManufacturingJob
    ) => void;

    resetJob: () => void;

    setMaterial: (
        materialId: string
    ) => void;

    selectTool: (
        operationId: string,
        toolId: string
    ) => void;

    setOperationEnabled: (
        operationId: string,
        enabled: boolean
    ) => void;
}

export const useManufacturingStore =
create<ManufacturingStore>(
    (set) => ({

        job: {
            ...EMPTY_JOB,
        },

        initializeJob: (
            job = EMPTY_JOB
        ) =>
            set({
                job: {
                    ...job,
                },
            }),

        resetJob: () =>
            set({
                job: {
                    ...EMPTY_JOB,
                },
            }),

        setMaterial: (
            materialId
        ) => {

            const material =
                getMaterial(
                    materialId
                );

            if (!material) {
                return;
            }

            const operationSelections:
                ManufacturingJob["operationSelections"] = {};

            Object.entries(
                material.operations
            ).forEach(
                ([
                    operationId,
                    operation,
                ]) => {

                    if (!operation) {
                        return;
                    }

                    const defaultTool =
                        operation.toolConfigurations.find(
                            tool =>
                                tool.enabled &&
                                tool.isDefault
                        );

                    if (!defaultTool) {
                        return;
                    }

                    operationSelections[
                        operationId
                    ] = {

                        toolId:
                            defaultTool.toolId,

                        enabled: true,

                    };

                }
            );

            set(
                state => ({

                    job: {

                        ...state.job,

                        materialId,

                        operationSelections,

                    },

                })
            );

        },

        selectTool: (
            operationId,
            toolId
        ) =>
            set(
                state => ({

                    job: {

                        ...state.job,

                        operationSelections: {

                            ...state.job.operationSelections,

                            [operationId]: {

                                ...state
                                    .job
                                    .operationSelections[
                                        operationId
                                    ],

                                toolId,

                            },

                        },

                    },

                })
            ),

        setOperationEnabled: (
            operationId,
            enabled
        ) =>
            set(
                state => ({

                    job: {

                        ...state.job,

                        operationSelections: {

                            ...state.job.operationSelections,

                            [operationId]: {

                                ...state
                                    .job
                                    .operationSelections[
                                        operationId
                                    ],

                                enabled,

                            },

                        },

                    },

                })
            ),

    })
);