import {
    useEffect
} from "react";
import type {
    Canvas,
    FabricObject
} from "fabric";

import {
    useEditorStore,
    type EditorInteractionMode
} from "../store/editor.store";
import {
    isNodeEditableObject
} from "../utils/nodeEditing";

type FabricTargetEvent = {
    target?: FabricObject | null;
};

type FabricTransformEvent = {
    target?: FabricObject | null;
};

const NODE_EDIT_TRANSFORM_SUPPRESSION_MS =
    400;

function getObjectId(
    object: FabricObject | null | undefined
) {
    return object?.id ??
        object?.name ??
        null;
}

function canEnterNodeEditFromMode(
    interactionMode: EditorInteractionMode,
    lastObjectTransformEndedAt: number | null
) {
    const transformJustEnded =
        lastObjectTransformEndedAt !== null &&
        performance.now() -
            lastObjectTransformEndedAt <
            NODE_EDIT_TRANSFORM_SUPPRESSION_MS;

    if (transformJustEnded) {
        return false;
    }

    return (
        interactionMode === "idle" ||
        interactionMode === "selecting" ||
        interactionMode === "object-selected" ||
        interactionMode === "node-editing"
    );
}

export function useEditorFabricEvents(
    canvas: Canvas | null
) {
    const activeTool =
        useEditorStore(
            (
                state
            ) =>
                state.activeTool
        );

    const selectionMode =
        useEditorStore(
            (
                state
            ) =>
                state.selectionMode
        );

    const enterNodeEditMode =
        useEditorStore(
            (
                state
            ) =>
                state.enterNodeEditMode
        );

    const exitNodeEditMode =
        useEditorStore(
            (
                state
            ) =>
                state.exitNodeEditMode
        );

    const setInteractionMode =
        useEditorStore(
            (
                state
            ) =>
                state.setInteractionMode
        );

    const setActiveObjectId =
        useEditorStore(
            (
                state
            ) =>
                state.setActiveObjectId
        );

    const setActiveNodeId =
        useEditorStore(
            (
                state
            ) =>
                state.setActiveNodeId
        );

    const setActiveSegmentId =
        useEditorStore(
            (
                state
            ) =>
                state.setActiveSegmentId
        );

    const setLastObjectTransformEndedAt =
        useEditorStore(
            (
                state
            ) =>
                state.setLastObjectTransformEndedAt
        );

    useEffect(() => {
        if (!canvas) return;

        const handleDoubleClick = (
            event: FabricTargetEvent
        ) => {
            const target =
                event.target;

            const editorState =
                useEditorStore.getState();

            if (
                editorState.activeTool !== "select" ||
                editorState.selectionMode !== "select" ||
                !canEnterNodeEditFromMode(
                    editorState.interactionMode,
                    editorState.lastObjectTransformEndedAt
                ) ||
                !isNodeEditableObject(
                    target
                )
            ) {
                return;
            }

            canvas.setActiveObject(
                target
            );
            enterNodeEditMode(
                getObjectId(
                    target
                )
            );
            canvas.requestRenderAll();
        };

        const handleSelectionCleared = () => {
            setActiveObjectId(
                null
            );
            setActiveNodeId(
                null
            );
            setActiveSegmentId(
                null
            );

            if (
                selectionMode ===
                "node-edit"
            ) {
                exitNodeEditMode();
                return;
            }

            setInteractionMode(
                "idle"
            );
        };

        const ensureNodeEditableSelection = () => {
            const activeObject =
                canvas.getActiveObject();

            setActiveNodeId(
                null
            );
            setActiveSegmentId(
                null
            );

            setActiveObjectId(
                getObjectId(
                    activeObject
                )
            );

            if (
                selectionMode === "node-edit" &&
                !isNodeEditableObject(
                    activeObject
                )
            ) {
                exitNodeEditMode();
                return;
            }

            if (
                selectionMode !== "node-edit" &&
                activeTool === "select"
            ) {
                setInteractionMode(
                    activeObject
                        ? "object-selected"
                        : "idle"
                );
            }
        };

        const handleMouseDown = () => {
            if (
                activeTool === "select" &&
                selectionMode !== "node-edit"
            ) {
                setInteractionMode(
                    "selecting"
                );
            }
        };

        const handleObjectMoving = (
            event: FabricTransformEvent
        ) => {
            setActiveObjectId(
                getObjectId(
                    event.target
                )
            );

            if (
                selectionMode !==
                "node-edit"
            ) {
                setInteractionMode(
                    "object-dragging"
                );
            }
        };

        const handleObjectTransforming = (
            event: FabricTransformEvent
        ) => {
            setActiveObjectId(
                getObjectId(
                    event.target
                )
            );

            if (
                selectionMode !==
                "node-edit"
            ) {
                setInteractionMode(
                    "object-transforming"
                );
            }
        };

        const handleObjectModified = (
            event: FabricTransformEvent
        ) => {
            const currentMode =
                useEditorStore.getState()
                    .interactionMode;

            if (
                currentMode ===
                    "object-dragging" ||
                currentMode ===
                    "object-transforming"
            ) {
                setLastObjectTransformEndedAt(
                    performance.now()
                );
            }

            setActiveObjectId(
                getObjectId(
                    event.target ??
                    canvas.getActiveObject()
                )
            );

            if (
                selectionMode !== "node-edit" &&
                activeTool === "select"
            ) {
                setInteractionMode(
                    "object-selected"
                );
            }
        };

        canvas.on(
            "mouse:dblclick",
            handleDoubleClick
        );
        canvas.on(
            "mouse:down",
            handleMouseDown
        );
        canvas.on(
            "selection:cleared",
            handleSelectionCleared
        );
        canvas.on(
            "selection:created",
            ensureNodeEditableSelection
        );
        canvas.on(
            "selection:updated",
            ensureNodeEditableSelection
        );
        canvas.on(
            "object:moving",
            handleObjectMoving
        );
        canvas.on(
            "object:scaling",
            handleObjectTransforming
        );
        canvas.on(
            "object:rotating",
            handleObjectTransforming
        );
        canvas.on(
            "object:modified",
            handleObjectModified
        );

        return () => {
            canvas.off(
                "mouse:dblclick",
                handleDoubleClick
            );
            canvas.off(
                "mouse:down",
                handleMouseDown
            );
            canvas.off(
                "selection:cleared",
                handleSelectionCleared
            );
            canvas.off(
                "selection:created",
                ensureNodeEditableSelection
            );
            canvas.off(
                "selection:updated",
                ensureNodeEditableSelection
            );
            canvas.off(
                "object:moving",
                handleObjectMoving
            );
            canvas.off(
                "object:scaling",
                handleObjectTransforming
            );
            canvas.off(
                "object:rotating",
                handleObjectTransforming
            );
            canvas.off(
                "object:modified",
                handleObjectModified
            );
        };
    }, [
        activeTool,
        canvas,
        enterNodeEditMode,
        exitNodeEditMode,
        setActiveObjectId,
        setActiveNodeId,
        setActiveSegmentId,
        setLastObjectTransformEndedAt,
        setInteractionMode,
        selectionMode
    ]);
}
