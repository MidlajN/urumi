import {
    useCallback,
    useEffect,
    useRef
} from "react";
import type {
    Canvas,
    FabricObject
} from "fabric";

import type {
    EditorSelectionMode
} from "../store/editor.store";
import {
    isNodeEditableObject
} from "../utils/nodeEditing";

type NodeEditControlState = Pick<
    FabricObject,
    "hasControls" |
    "hasBorders" |
    "lockMovementX" |
    "lockMovementY"
>;

export function useNodeEditLifecycle({
    canvas,
    object,
    selectionMode
}: {
    canvas: Canvas | null;
    object: FabricObject | null | undefined;
    selectionMode: EditorSelectionMode;
}) {
    const nodeEditObjectRef =
        useRef<FabricObject | null>(
            null
        );

    const nodeEditControlStateRef =
        useRef<NodeEditControlState | null>(
            null
        );

    const restoreNodeEditControls =
        useCallback(() => {
            const nodeEditObject =
                nodeEditObjectRef.current;

            const controls =
                nodeEditControlStateRef.current;

            if (
                nodeEditObject &&
                controls
            ) {
                nodeEditObject.set(
                    controls
                );
                nodeEditObject.setCoords();
                canvas?.requestRenderAll();
            }

            nodeEditObjectRef.current =
                null;
            nodeEditControlStateRef.current =
                null;
        }, [
            canvas
        ]);

    useEffect(() => {
        const editableObject =
            object ??
            null;

        if (
            selectionMode !== "node-edit" ||
            !isNodeEditableObject(
                editableObject
            )
        ) {
            restoreNodeEditControls();
            return;
        }

        if (
            nodeEditObjectRef.current &&
            nodeEditObjectRef.current !==
                editableObject
        ) {
            restoreNodeEditControls();
        }

        if (
            !nodeEditObjectRef.current
        ) {
            nodeEditObjectRef.current =
                editableObject;
            nodeEditControlStateRef.current = {
                hasControls:
                    editableObject.hasControls,
                hasBorders:
                    editableObject.hasBorders,
                lockMovementX:
                    editableObject.lockMovementX,
                lockMovementY:
                    editableObject.lockMovementY
            };
        }

        editableObject.set({
            hasControls:
                false,
            hasBorders:
                false,
            lockMovementX:
                true,
            lockMovementY:
                true
        });
        editableObject.setCoords();
        canvas?.requestRenderAll();

        return restoreNodeEditControls;
    }, [
        canvas,
        object,
        restoreNodeEditControls,
        selectionMode
    ]);
}
