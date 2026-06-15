import type {
    LucideIcon
} from "lucide-react";

import {
    type ToolType,
    type ShapeType,
    useEditorStore
} from "../../store/editor.store";

type Props = {
    tool: ToolType;

    icon: LucideIcon;

    onClick?: () => void;

    shape?: ShapeType;
};

export default function ToolButton({
    tool,
    icon: Icon,
    onClick,
    shape
}: Props) {

    const {
        activeTool,
        selectedShape,
        setTool
    } = useEditorStore();

    const isShapeTool =
        tool === "shape";

    const isActive =
        isShapeTool
            ? (
                activeTool ===
                    "shape" &&
                selectedShape ===
                    shape
            )
            : (
                activeTool ===
                tool
            );

    const handleClick =
        () => {

            if (onClick) {
                onClick();
                return;
            }

            setTool(tool);
        };

    return (
        <button
            onClick={
                handleClick
            }
            className={`
                w-11
                h-11
                rounded-xl
                flex
                items-center
                justify-center
                transition-all
                duration-200
                border

                ${
                    isActive
                        ? `
                            bg-zinc-900
                            text-white
                            border-zinc-900
                          `
                        : `
                            bg-white
                            text-zinc-600
                            border-transparent
                            hover:bg-zinc-100
                          `
                }
            `}
        >
            <Icon
                size={20}
            />
        </button>
    );
}