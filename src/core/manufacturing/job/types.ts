import type {
    OperationDefinition,
} from "../operations/types";

import type {
    ToolProfile,
} from "../tools/types";

export interface JobOperationSelection {

    toolId: ToolProfile["id"];

    enabled: boolean;

}

export type JobOperationSelections =
    Partial<
        Record<
            OperationDefinition["id"],
            JobOperationSelection
        >
    >;

export interface ManufacturingJob {

    name: string;

    materialId: string | null;

    operationSelections:
        JobOperationSelections;

}