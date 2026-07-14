import { create } from "zustand";

import {
    EMPTY_JOB,
} from "@/core/manufacturing/job/defaults";

import type {
    JobOperationSelection,
    ManufacturingJob,
} from "@/core/manufacturing/job/types";

import {
    getMaterial,
} from "@/core/manufacturing/materials/registry";

interface ManufacturingStore {

    job: ManufacturingJob;

    selectedMaterialId: string | null;

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

    updateOperationSelection: (
        operationId: string,
        selection: Partial<JobOperationSelection>
    ) => void;
}

function mergeOperationSelection(
    current: JobOperationSelection | undefined,
    next: Partial<JobOperationSelection>
) {
    const toolId =
        next.toolId ??
        current?.toolId;

    if (!toolId) {
        return null;
    }

    return {
        toolId,
        enabled:
            next.enabled ??
            current?.enabled ??
            true,
    };
}

export const useManufacturingStore =
create<ManufacturingStore>(
    (set) => ({

        job: {
            ...EMPTY_JOB,
        },

        selectedMaterialId:
            EMPTY_JOB.materialId,

        initializeJob: (
            job = EMPTY_JOB
        ) =>
            set({
                job: {
                    ...job,
                },
                selectedMaterialId:
                    job.materialId,
            }),

        resetJob: () =>
            set({
                job: {
                    ...EMPTY_JOB,
                },
                selectedMaterialId:
                    EMPTY_JOB.materialId,
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

                    selectedMaterialId:
                        materialId,

                })
            );

        },

        selectTool: (
            operationId,
            toolId
        ) =>
            set(
                state => {
                    const selection =
                        mergeOperationSelection(
                            state.job.operationSelections[
                                operationId
                            ],
                            {
                                toolId,
                            }
                        );

                    if (!selection) {
                        return state;
                    }

                    return {

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

                                ...selection,

                            },

                        },

                    },

                    };
                }
            ),

        setOperationEnabled: (
            operationId,
            enabled
        ) =>
            set(
                state => {
                    const selection =
                        mergeOperationSelection(
                            state.job.operationSelections[
                                operationId
                            ],
                            {
                                enabled,
                            }
                        );

                    if (!selection) {
                        return state;
                    }

                    return {

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

                                ...selection,

                            },

                        },

                    },

                    };
                }
            ),

        updateOperationSelection: (
            operationId,
            selection
        ) =>
            set(
                state => {
                    const nextSelection =
                        mergeOperationSelection(
                            state.job.operationSelections[
                                operationId
                            ],
                            selection
                        );

                    if (!nextSelection) {
                        return state;
                    }

                    return {

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

                                ...nextSelection,

                            },

                        },

                    },

                    };
                }
            ),

    })
);
