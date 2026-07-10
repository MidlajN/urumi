import {
    DEFAULT_OPERATIONS,
} from "./defaults";

import type {
    OperationDefinition,
} from "./types";

const operationMap =
    new Map(
        DEFAULT_OPERATIONS.map(
            (operation) => [
                operation.id,
                operation,
            ]
        )
    );

export function listOperations(): readonly OperationDefinition[] {
    return DEFAULT_OPERATIONS;
}

export function getOperation(
    id: string
): OperationDefinition | undefined {
    return operationMap.get(id);
}

export function hasOperation(
    id: string
): boolean {
    return operationMap.has(id);
}