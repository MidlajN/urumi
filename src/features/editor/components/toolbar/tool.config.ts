import {
    MousePointer2,
    Pencil,
    PenLine,
    Type,
    Square,
    Circle,
    Triangle,
    Pentagon,
    WandSparkles,
    Upload
} from "lucide-react";

export const primaryTools = [
    {
        id: "select",
        label: "Select",
        icon: MousePointer2
    },
    {
        id: "pen",
        label: "Pen",
        icon: Pencil
    },
    {
        id: "line",
        label: "Line",
        icon: PenLine
    },
    {
        id: "text",
        label: "Text",
        icon: Type
    }
] as const;

export const shapeTools = [
    {
        id: "rectangle",
        label: "Rectangle",
        icon: Square
    },
    {
        id: "circle",
        label: "Circle",
        icon: Circle
    },
    {
        id: "triangle",
        label: "Triangle",
        icon: Triangle
    },
    {
        id: "polygon",
        label: "Polygon",
        icon: Pentagon
    }
] as const;

export const penTools = [
    {
        id: "magic",
        label: "Magical Pen",
        icon: WandSparkles
    },
    {
        id: "normal",
        label: "Normal Pen",
        icon: Pencil
    }
] as const;

export const utilityTools = [
    {
        id: "import",
        label: "Import",
        icon: Upload
    }
] as const;
