
import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    MousePointer2,
    Type,
    Square,
    PenLine,
    Pencil,
    Upload
} from "lucide-react";

import ToolButton
from "../toolbar/ToolButton";

import ToolMenu
from "../toolbar/ToolMenu";

import {
    useEditorStore,
    type ShapeType,
    type ToolType
} from "../../store/editor.store";

import {
    shapeTools
} from "../toolbar/tool.config";
import { useCanvas } from "../../canvas/CanvasProvider";


type MenuType =
    | "shape"
    | null;

export default function LeftToolbar() {

    const { workspace } = useCanvas()
    
    const toolbarRef = useRef<HTMLDivElement>(null);

    const fileRef = useRef<HTMLInputElement>(null);

    const [ hoveredMenu, setHoveredMenu ] = useState<MenuType>(null);

    const [ pinnedMenu, setPinnedMenu ] = useState<MenuType>(null);

    const {
        activeTool: tool,
        selectedShape: shape,
        setTool,
        setShape
    } = useEditorStore();

    const clearMenus = () => {

        setPinnedMenu(null);

        setHoveredMenu(null);
    };

    const openMenu = (menu: MenuType) => {

        setHoveredMenu(
            menu
        );
    };

    const closeMenu = () => {

        if (pinnedMenu) return;

        setHoveredMenu(null);
    };

    const toggleMenu = (menu: MenuType) => {

        if (pinnedMenu === menu) {

            setPinnedMenu(null);

            setHoveredMenu(null);

            return;
        }

        setPinnedMenu(menu);

        setHoveredMenu(menu);
    };

    const selectShape = (selectedShape: ShapeType) => {

        setShape(selectedShape);

        setTool("shape");

        clearMenus();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        
        const file = e.target.files?.[0];

        if (!file) return;

        console.log(file)

        workspace?.loadFromFiles(file, "#000000")

    }

    // click outside close
    useEffect(() => {

        const handleClickOutside = (e: MouseEvent) => {

            if (
                toolbarRef.current &&
                !toolbarRef.current.contains(e.target as Node)
            ) {
                clearMenus();
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () =>
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );

    }, []);

    const handleToolSelect = (selectedTool: ToolType) => {

        clearMenus();

        setTool(selectedTool);
    };

    return (
        <div
            ref={toolbarRef}
            className="
                relative
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
                label="Select"
                icon={
                    MousePointer2
                }
                active={
                    tool ===
                    "select"
                }
                onMouseEnter={() => {

                    if (
                        !pinnedMenu
                    ) {
                        setHoveredMenu(
                            null
                        );
                    }
                }}
                onClick={() =>
                    handleToolSelect(
                        "select"
                    )
                }
            />

            {/* PEN */}
            <ToolButton
                tool="pen"
                label="Pen"
                icon={
                    Pencil
                }
                active={
                    tool ===
                    "pen"
                }
                onMouseEnter={() => {

                    if (
                        !pinnedMenu
                    ) {
                        setHoveredMenu(
                            null
                        );
                    }
                }}
                onClick={() =>
                    handleToolSelect(
                        "pen"
                    )
                }
            />

            {/* LINE */}
            <ToolButton
                tool="line"
                label="Line"
                icon={
                    PenLine
                }
                active={
                    tool ===
                    "line"
                }
                onMouseEnter={() => {

                    if (
                        !pinnedMenu
                    ) {
                        setHoveredMenu(
                            null
                        );
                    }
                }}
                onClick={() =>
                    handleToolSelect(
                        "line"
                    )
                }
            />

            {/* TEXT */}
            <ToolButton
                tool="text"
                label="Text"
                icon={Type}
                active={
                    tool ===
                    "text"
                }
                onMouseEnter={() => {

                    if (
                        !pinnedMenu
                    ) {
                        setHoveredMenu(
                            null
                        );
                    }
                }}
                onClick={() =>
                    handleToolSelect(
                        "text"
                    )
                }
            />

            <div
                className="
                    w-8
                    h-px
                    bg-zinc-200
                    my-1
                "
            />

            {/* SHAPES */}
            <ToolButton
                tool="shape"
                label="Shapes"
                icon={
                    shapeTools.find(
                        (
                            item
                        ) =>
                            item.id ===
                            shape
                    )?.icon ??
                    Square
                }
                active={
                    tool ===
                    "shape"
                }
                onMouseEnter={() =>
                    openMenu(
                        "shape"
                    )
                }
                onMouseLeave={
                    closeMenu
                }
                onClick={() =>
                    toggleMenu(
                        "shape"
                    )
                }
            />

            <ToolMenu
                open={
                    hoveredMenu ===
                    "shape"
                }
                items={
                    shapeTools
                }
                selected={
                    shape
                }
                onSelect={
                    selectShape
                }
                onMouseEnter={() =>
                    openMenu(
                        "shape"
                    )
                }
                onMouseLeave={
                    closeMenu
                }
            />

            <div
                className="
                    w-8
                    h-px
                    bg-zinc-200
                    my-1
                "
            />

            {/* IMPORT */}
            <ToolButton
                tool="import"
                label="Import SVG"
                icon={Upload}
                onMouseEnter={() => {

                    if (
                        !pinnedMenu
                    ) {
                        setHoveredMenu(
                            null
                        );
                    }
                }}
                onClick={() =>
                    fileRef.current?.click()
                }
            />

            <input
                hidden
                ref={fileRef}
                type="file"
                accept=".svg"
                onChange={ handleImport }
            />
        </div>
    );
}
