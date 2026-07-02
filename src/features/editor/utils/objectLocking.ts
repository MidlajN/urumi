import type {
    FabricObject
} from "fabric";

export function isObjectInteractionLocked(
    object: FabricObject | null | undefined
) {
    return Boolean(
        object &&
        object.name !== "workspace" &&
        object.lockMovementX &&
        object.lockMovementY &&
        object.lockScalingX &&
        object.lockScalingY &&
        object.lockRotation
    );
}

export function setObjectInteractionLocked(
    object: FabricObject,
    locked: boolean
) {
    object.set({
        selectable:
            true,
        evented:
            true,
        hasControls:
            !locked,
        hasBorders:
            true,
        lockMovementX:
            locked,
        lockMovementY:
            locked,
        lockScalingX:
            locked,
        lockScalingY:
            locked,
        lockRotation:
            locked,
        lockSkewingX:
            locked,
        lockSkewingY:
            locked,
        editable:
            !locked,
        hoverCursor:
            locked
                ? "not-allowed"
                : "move"
    });
    object.setCoords();
}
