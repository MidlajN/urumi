import {
    Line,
    Path,
    Polyline,
    type FabricObject
} from "fabric";

export function isNodeEditableObject(
    object: FabricObject | null | undefined
): object is FabricObject {
    return Boolean(
        object &&
        (
            object instanceof Line ||
            object instanceof Path ||
            object instanceof Polyline
        )
    );
}
