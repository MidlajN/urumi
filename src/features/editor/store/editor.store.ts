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

    setTool: (
        tool: ToolType
    ) => void;

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
};

export const useEditorStore =
    create<EditorStore>((set) => ({
        activeTool: "select",
        selectedShape: "rectangle",

        strokeColor: "#000000",
        fontFamily: "BobaMilky",
        fontSize: 40,

        setTool: (tool) =>
            set({
                activeTool: tool
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
    }));
