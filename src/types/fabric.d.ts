import type { ManufacturingMetadata } from "@/core/manufacturing/metadata/types";
import "fabric";

declare module "fabric" {

    interface FabricObject {
        id?: string;
        name?: string;
        isFreeDraw?: boolean;

        manufacturing: ManufacturingMetadata;
    }

    interface SerializedObjectProps {
        id?: string;
        name?: string;
        isFreeDraw?: boolean;
        
        manufacturing: ManufacturingMetadata;
    }
}