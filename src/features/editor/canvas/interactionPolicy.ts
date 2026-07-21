import type {
    Canvas,
    FabricObject
} from "fabric";

import type {
    WorkspaceMode
} from "@/stores/workspace.store";

type EditableFabricObject =
    FabricObject & {
        editable?: boolean;
    };

type ObjectInteractionState = {
    selectable: FabricObject["selectable"];
    evented: FabricObject["evented"];
    hasControls: FabricObject["hasControls"];
    hasBorders: FabricObject["hasBorders"];
    lockMovementX: FabricObject["lockMovementX"];
    lockMovementY: FabricObject["lockMovementY"];
    lockScalingX: FabricObject["lockScalingX"];
    lockScalingY: FabricObject["lockScalingY"];
    lockRotation: FabricObject["lockRotation"];
    lockSkewingX: FabricObject["lockSkewingX"];
    lockSkewingY: FabricObject["lockSkewingY"];
    hoverCursor: FabricObject["hoverCursor"];
    opacity: FabricObject["opacity"];
    editable?: boolean;
};

/** Display opacity for objects excluded from manufacturing (off the bed). */
const OFF_BED_OPACITY = 0.25;

type CanvasInteractionState = {
    mode: WorkspaceMode;
    objectStates: WeakMap<
        FabricObject,
        ObjectInteractionState
    >;
};

const canvasStates =
    new WeakMap<
        Canvas,
        CanvasInteractionState
    >();

export function canModifyCanvas(
    canvas: Canvas | null | undefined
) {
    return (
        !canvas ||
        canvasStates.get(
            canvas
        )?.mode !== "manufacturing"
    );
}

export function applyCanvasInteractionPolicy(
    canvas: Canvas,
    mode: WorkspaceMode,
    options?: {
        /**
         * Drawing tools own canvas.selection / isDrawingMode while
         * active; re-applying the policy mid-draw (object:added fires
         * for every created object) must not clobber them.
         */
        preserveToolState?: boolean;
    }
) {
    const state =
        getCanvasState(
            canvas
        );

    state.mode =
        mode;

    if (
        !options?.preserveToolState
    ) {
        canvas.selection =
            true;
        canvas.isDrawingMode =
            false;
    }

    canvas.getObjects().forEach(
        (
            object
        ) => {
            if (
                object.name ===
                "workspace"
            ) {
                object.set({
                    selectable:
                        false,
                    evented:
                        false,
                    hasControls:
                        false
                });
                return;
            }

            if (
                mode ===
                "manufacturing"
            ) {
                storeObjectState(
                    state,
                    object
                );
                applyReadOnlyObjectState(
                    object
                );

                if (
                    object.onBed ===
                    false
                ) {
                    applyOffBedObjectState(
                        object
                    );
                }
                return;
            }

            restoreObjectState(
                state,
                object
            );
        }
    );

    if (
        mode ===
        "design"
    ) {
        state.objectStates =
            new WeakMap();
    }

    const activeObject =
        canvas.getActiveObject();

    if (
        activeObject
    ) {
        if (
            mode ===
            "manufacturing"
        ) {
            activeObject.set({
                hasControls:
                    false,
                lockMovementX:
                    true,
                lockMovementY:
                    true,
                lockScalingX:
                    true,
                lockScalingY:
                    true,
                lockRotation:
                    true,
                lockSkewingX:
                    true,
                lockSkewingY:
                    true
            });
        } else {
            activeObject.setCoords();
        }
    }

    canvas.requestRenderAll();
}

function getCanvasState(
    canvas: Canvas
) {
    let state =
        canvasStates.get(
            canvas
        );

    if (
        !state
    ) {
        state = {
            mode:
                "design",
            objectStates:
                new WeakMap()
        };

        canvasStates.set(
            canvas,
            state
        );
    }

    return state;
}

function storeObjectState(
    state: CanvasInteractionState,
    object: FabricObject
) {
    if (
        state.objectStates.has(
            object
        )
    ) {
        return;
    }

    state.objectStates.set(
        object,
        {
            selectable:
                object.selectable,
            evented:
                object.evented,
            hasControls:
                object.hasControls,
            hasBorders:
                object.hasBorders,
            lockMovementX:
                object.lockMovementX,
            lockMovementY:
                object.lockMovementY,
            lockScalingX:
                object.lockScalingX,
            lockScalingY:
                object.lockScalingY,
            lockRotation:
                object.lockRotation,
            lockSkewingX:
                object.lockSkewingX,
            lockSkewingY:
                object.lockSkewingY,
            editable:
                (
                    object as EditableFabricObject
                ).editable,
            hoverCursor:
                object.hoverCursor,
            opacity:
                object.opacity
        }
    );
}

/**
 * Off-bed objects are excluded from the manufacturing document: not
 * selectable, not interactive, and dimmed so the exclusion is visible.
 * Their original state is restored on returning to design mode.
 */
function applyOffBedObjectState(
    object: FabricObject
) {
    object.set({
        selectable:
            false,
        evented:
            false,
        hasBorders:
            false,
        opacity:
            OFF_BED_OPACITY,
        hoverCursor:
            "default"
    });
}

function applyReadOnlyObjectState(
    object: FabricObject
) {
    object.set({
        selectable:
            true,
        evented:
            true,
        hasControls:
            false,
        hasBorders:
            true,
        lockMovementX:
            true,
        lockMovementY:
            true,
        lockScalingX:
            true,
        lockScalingY:
            true,
        lockRotation:
            true,
        lockSkewingX:
            true,
        lockSkewingY:
            true,
        editable:
            false,
        hoverCursor:
            "default"
    });
    object.setCoords();
}

function restoreObjectState(
    state: CanvasInteractionState,
    object: FabricObject
) {
    const previous =
        state.objectStates.get(
            object
        );

    if (
        previous
    ) {
        object.set(
            previous
        );
    }

    object.setCoords();
}
