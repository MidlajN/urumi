export type OperationId =
    | "cut"
    | "score"
    | "draw"
    | "guide";

export interface ManufacturingMetadata {
    operationId: OperationId;

    enabled: boolean;
}

export const DEFAULT_MANUFACTURING_METADATA: ManufacturingMetadata = {
    operationId: "cut",
    enabled: true,
};