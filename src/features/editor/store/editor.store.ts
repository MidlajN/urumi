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
    | "triangle";

type EditorStore = {
    activeTool: ToolType;
    selectedShape: ShapeType;

    strokeColor: string;
    fontFamily: string;

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
};

export const useEditorStore =
    create<EditorStore>((set) => ({
        activeTool: "select",
        selectedShape: "rectangle",

        strokeColor: "#000000",
        fontFamily: "Arial",

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
    }));