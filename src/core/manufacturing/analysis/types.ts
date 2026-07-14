import type {
    FabricObject
} from "fabric";

import type {
    OperationDefinition
} from "../operations/types";

export interface ManufacturingBoundingBox {
    left: number;
    top: number;
    width: number;
    height: number;
}

export interface ManufacturingOperationSummary {
    operationId: OperationDefinition["id"];
    operation: OperationDefinition;
    objectCount: number;
    objects: FabricObject[];
    enabled: boolean;
    boundingBox: ManufacturingBoundingBox | null;
}

export interface ManufacturingDocumentSummary {
    totalObjectCount: number;
    operations: ManufacturingOperationSummary[];
}
