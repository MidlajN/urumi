import {
    MousePointer2,
    Type,
    Square,
    Circle,
    Triangle,
    PenLine,
    Pencil,
    Upload
} from "lucide-react";

import ToolButton
from "../toolbar/ToolButton";

import {
    useEditorStore
} from "../../store/editor.store";

export default function
LeftToolbar() {

    const {
        setTool,
        setShape
    } = useEditorStore();

    return (
        <div
            className="
                w-16
                bg-white
                border-r
                border-zinc-200
                flex
                flex-col
                items-center
                py-3
                gap-2
                z-50
            "
        >

            {/* SELECT */}
            <ToolButton
                tool="select"
                icon={
                    MousePointer2
                }
            />

            {/* PEN */}
            <ToolButton
                tool="pen"
                icon={
                    Pencil
                }
            />

            {/* LINE */}
            <ToolButton
                tool="line"
                icon={
                    PenLine
                }
            />

            {/* TEXT */}
            <ToolButton
                tool="text"
                icon={
                    Type
                }
            />

            {/* RECTANGLE */}
            <ToolButton
                tool="shape"
                icon={
                    Square
                }
                onClick={() => {
                    setShape(
                        "rectangle"
                    );

                    setTool(
                        "shape"
                    );
                }}
            />

            {/* CIRCLE */}
            <ToolButton
                tool="shape"
                icon={
                    Circle
                }
                onClick={() => {
                    setShape(
                        "circle"
                    );

                    setTool(
                        "shape"
                    );
                }}
            />

            {/* TRIANGLE */}
            <ToolButton
                tool="shape"
                icon={
                    Triangle
                }
                onClick={() => {
                    setShape(
                        "triangle"
                    );

                    setTool(
                        "shape"
                    );
                }}
            />

            {/* IMPORT */}
            <ToolButton
                tool="select"
                icon={
                    Upload
                }
            />
        </div>
    );
}