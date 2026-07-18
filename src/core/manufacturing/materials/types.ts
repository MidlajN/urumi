import type {
    OperationDefinition,
} from "../operations/types";

import type {
    ToolProfile,
} from "../tools/types";

export interface MaterialToolConfiguration {

    toolId: ToolProfile["id"];

    enabled: boolean;

    isDefault: boolean;

    velocity: number;

    acceleration: number;

    passes: number;
}

export interface MaterialOperation {
    enabled: boolean;

    toolConfigurations:
        MaterialToolConfiguration[];
}

export type MaterialOperations =
    Partial<
        Record<
            OperationDefinition["id"],
            MaterialOperation
        >
    >;

export interface Material {

    id: string;

    name: string;

    thickness: number;

    enabled: boolean;

    operations: MaterialOperations;
}