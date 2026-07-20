import type { ManufacturingMetadata } from "@/core/manufacturing/metadata/types";
import "fabric";

declare module "fabric" {

    interface FabricObject {
        id?: string;
        name?: string;
        isFreeDraw?: boolean;

        manufacturing: ManufacturingMetadata;

        /**
         * Whether the object lies on the machine bed. Set by bed-placement
         * validation when entering manufacturing mode; false excludes the
         * object from the manufacturing summary. Unset = not yet validated.
         */
        onBed?: boolean;
    }

    interface SerializedObjectProps {
        id?: string;
        name?: string;
        isFreeDraw?: boolean;
        
        manufacturing: ManufacturingMetadata;
    }
}