import "fabric";

declare module "fabric" {

    interface FabricObject {
        id?: string;
        name?: string;
        isFreeDraw?: boolean;
    }

    interface SerializedObjectProps {
        id?: string;
        name?: string;
        isFreeDraw?: boolean;
    }
}