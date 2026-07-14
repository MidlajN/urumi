import {
    useEffect
} from "react";
import {
    ActiveSelection,
    type Canvas,
    type FabricObject
} from "fabric";

import {
    useEditorStore,
    type EditorInteractionMode
} from "../store/editor.store";
import {
    isNodeEditableObject
} from "../utils/nodeEditing";
import {
    isObjectInteractionLocked
} from "../utils/objectLocking";
import {
    canModifyCanvas
} from "../canvas/interactionPolicy";

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

        let isNormalizingSelection =
            false;

        const normalizeLockedActiveSelection = () => {
            const activeObject =
                canvas.getActiveObject();

            if (
                !canModifyCanvas(
                    canvas
                )
            ) {
                return activeObject;
            }

            if (
                !(activeObject instanceof ActiveSelection)
            ) {
                return activeObject;
            }

            const selectionObjects =
                activeObject.getObjects();

            const unlockedObjects =
                selectionObjects.filter(
                    (
                        object
                    ) =>
                        !isObjectInteractionLocked(
                            object
                        )
                );

            if (
                unlockedObjects.length ===
                selectionObjects.length
            ) {
                return activeObject;
            }

            isNormalizingSelection =
                true;

            try {
                canvas.discardActiveObject();

                if (
                    unlockedObjects.length === 1
                ) {
                    const nextObject =
                        unlockedObjects[0];

                    canvas.setActiveObject(
                        nextObject
                    );

                    return nextObject;
                }

                if (
                    unlockedObjects.length > 1
                ) {
                    const nextSelection =
                        new ActiveSelection(
                            unlockedObjects,
                            {
                                canvas
                            }
                        );

                    canvas.setActiveObject(
                        nextSelection
                    );

                    return nextSelection;
                }

                return null;
            } finally {
                isNormalizingSelection =
                    false;

                canvas.requestRenderAll();
            }
        };

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
                !canModifyCanvas(
                    canvas
                ) ||
                !canEnterNodeEditFromMode(
                    editorState.interactionMode,
                    editorState.lastObjectTransformEndedAt
                ) ||
                isObjectInteractionLocked(
                    target
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
            if (
                isNormalizingSelection
            ) {
                return;
            }

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
                normalizeLockedActiveSelection();

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
                (
                    isObjectInteractionLocked(
                        activeObject
                    ) ||
                    !isNodeEditableObject(
                        activeObject
                    )
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
