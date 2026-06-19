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

export const OPERATION_COLORS = [
    {
        id: "cut",
        label: "Cut",
        color: "#111827"
    },
    {
        id: "score",
        label: "Score",
        color: "#38bdf8"
    },
    {
        id: "draw",
        label: "Draw",
        color: "#f97316"
    },
    {
        id: "guide",
        label: "Guide",
        color: "#94a3b8"
    }
] as const;

type EditorStore = {
    activeTool: ToolType;
    selectedShape: ShapeType;

    strokeColor: string;
    fontFamily: string;
    fontSize: number;
    dimensionsOverlayEnabled: boolean;
    selectionMode: EditorSelectionMode;
    interactionMode: EditorInteractionMode;
    activeObjectId: string | null;
    activeEditingObjectId: string | null;
    activeNodeId: string | null;
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

        strokeColor: "#000000",
        fontFamily: "BobaMilky",
        fontSize: 40,
        dimensionsOverlayEnabled: true,
        selectionMode: "select",
        interactionMode: "idle",
        activeObjectId: null,
        activeEditingObjectId: null,
        activeNodeId: null,
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
                activeNodeId
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
                lastObjectTransformEndedAt: null
            }),

        exitNodeEditMode: () =>
            set({
                selectionMode: "select",
                interactionMode: "idle",
                activeEditingObjectId: null,
                activeNodeId: null,
                lastObjectTransformEndedAt: null
            }),

        setShape: (shape) =>
            set({
                selectedShape: shape
            }),

        setStrokeColor: (
            strokeColor
        ) =>
            set({
                strokeColor
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
