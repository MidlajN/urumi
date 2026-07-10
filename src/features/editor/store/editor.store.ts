import { listOperations } from "@/core/manufacturing/operations/registry";
import { create } from "zustand";

export type ToolType =
    | "select"
    | "pen"
    | "line"
    | "shape"
    | "text";

export type ShapeType =
    | "rectangle"
    | "circle"
    | "triangle"
    | "polygon";

export type PenType =
    | "magic"
    | "normal";

export type EditorSelectionMode =
    | "select"
    | "node-edit";

export type EditorInteractionMode =
    | "idle"
    | "selecting"
    | "object-selected"
    | "object-dragging"
    | "object-transforming"
    | "node-editing"
    | "polyline-drawing"
    | "dimension-editing";

export const OPERATION_COLORS = listOperations();

export type OperationColor =
    typeof OPERATION_COLORS[number];

export type OperationColorId =
    OperationColor["id"];

const DEFAULT_OPERATION_COLOR =
    OPERATION_COLORS[0].color;

export function resolveOperationColor(
    color: string
) {
    return (
        OPERATION_COLORS.find(
            (
                operation
            ) =>
                operation.color.toLowerCase() ===
                color.toLowerCase()
        )?.color ??
        DEFAULT_OPERATION_COLOR
    );
}

type EditorStore = {
    activeTool: ToolType;
    selectedShape: ShapeType;
    selectedPen: PenType;

    strokeColor: string;
    operationColors: readonly OperationColor[];
    fontFamily: string;
    fontSize: number;
    dimensionsOverlayEnabled: boolean;
    selectionMode: EditorSelectionMode;
    interactionMode: EditorInteractionMode;
    activeObjectId: string | null;
    activeEditingObjectId: string | null;
    activeNodeId: string | null;
    activeSegmentId: string | null;
    lastObjectTransformEndedAt: number | null;

    setTool: (
        tool: ToolType
    ) => void;

    setSelectionMode: (
        mode: EditorSelectionMode
    ) => void;

    setInteractionMode: (
        mode: EditorInteractionMode
    ) => void;

    setActiveObjectId: (
        id: string | null
    ) => void;

    setActiveNodeId: (
        id: string | null
    ) => void;

    setActiveSegmentId: (
        id: string | null
    ) => void;

    setLastObjectTransformEndedAt: (
        timestamp: number | null
    ) => void;

    enterNodeEditMode: (
        objectId?: string | null
    ) => void;

    exitNodeEditMode: () => void;

    setShape: (
        shape: ShapeType
    ) => void;

    setPen: (
        pen: PenType
    ) => void;

    setStrokeColor: (
        color: string
    ) => void;

    setFontFamily: (
        font: string
    ) => void;

    setFontSize: (
        size: number
    ) => void;

    toggleDimensionsOverlay: () => void;
};

export const useEditorStore =
    create<EditorStore>((set) => ({
        activeTool: "select",
        selectedShape: "rectangle",
        selectedPen: "magic",

        strokeColor: DEFAULT_OPERATION_COLOR,
        operationColors: OPERATION_COLORS,
        fontFamily: "BobaMilky",
        fontSize: 40,
        dimensionsOverlayEnabled: true,
        selectionMode: "select",
        interactionMode: "idle",
        activeObjectId: null,
        activeEditingObjectId: null,
        activeNodeId: null,
        activeSegmentId: null,
        lastObjectTransformEndedAt: null,

        setTool: (tool) =>
            set({
                activeTool: tool,
                selectionMode: "select",
                interactionMode:
                    tool === "line"
                        ? "polyline-drawing"
                        : "idle",
                activeEditingObjectId: null,
                activeNodeId: null,
                activeSegmentId: null,
                lastObjectTransformEndedAt: null
            }),

        setSelectionMode: (
            selectionMode
        ) =>
            set({
                selectionMode
            }),

        setInteractionMode: (
            interactionMode
        ) =>
            set({
                interactionMode
            }),

        setActiveObjectId: (
            activeObjectId
        ) =>
            set({
                activeObjectId
            }),

        setActiveNodeId: (
            activeNodeId
        ) =>
            set({
                activeNodeId,
                activeSegmentId: null
            }),

        setActiveSegmentId: (
            activeSegmentId
        ) =>
            set({
                activeSegmentId,
                activeNodeId: null
            }),

        setLastObjectTransformEndedAt: (
            lastObjectTransformEndedAt
        ) =>
            set({
                lastObjectTransformEndedAt
            }),

        enterNodeEditMode: (
            objectId = null
        ) =>
            set({
                activeTool: "select",
                selectionMode: "node-edit",
                interactionMode: "node-editing",
                activeEditingObjectId: objectId,
                activeNodeId: null,
                activeSegmentId: null,
                lastObjectTransformEndedAt: null
            }),

        exitNodeEditMode: () =>
            set({
                selectionMode: "select",
                interactionMode: "idle",
                activeEditingObjectId: null,
                activeNodeId: null,
                activeSegmentId: null,
                lastObjectTransformEndedAt: null
            }),

        setShape: (shape) =>
            set({
                selectedShape: shape
            }),

        setPen: (pen) =>
            set({
                selectedPen: pen
            }),

        setStrokeColor: (
            strokeColor
        ) =>
            set({
                strokeColor:
                    resolveOperationColor(
                        strokeColor
                    )
            }),

        setFontFamily: (
            fontFamily
        ) =>
            set({
                fontFamily
            }),

        setFontSize: (
            fontSize
        ) =>
            set({
                fontSize
            }),

        toggleDimensionsOverlay: () =>
            set((state) => ({
                dimensionsOverlayEnabled:
                    !state.dimensionsOverlayEnabled
            })),
    }));
