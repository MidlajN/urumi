
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
    SplinePointer,
    Upload,
    Camera
} from "lucide-react";

import ToolButton
from "../toolbar/ToolButton";

import ToolMenu
from "../toolbar/ToolMenu";

import {
    useEditorStore,
    type PenType,
    type ShapeType,
    type ToolType
} from "../../store/editor.store";

import {
    penTools,
    shapeTools
} from "../toolbar/tool.config";
import { useCanvas } from "../../canvas/CanvasProvider";
import { isNodeEditableObject } from "../../utils/nodeEditing";
import CompanionQrModal from "../../../companion/components/CompanionQrModal";


type MenuType =
    | "pen"
    | "shape"
    | null;

export default function LeftToolbar() {

    const { canvas, workspace, companion } = useCanvas()
    
    const toolbarRef = useRef<HTMLDivElement>(null);

    const fileRef = useRef<HTMLInputElement>(null);

    const [ hoveredMenu, setHoveredMenu ] = useState<MenuType>(null);

    const [ pinnedMenu, setPinnedMenu ] = useState<MenuType>(null);

    const [
        companionModalOpen,
        setCompanionModalOpen
    ] = useState(
        false
    );

    const {
        activeTool: tool,
        selectedPen: pen,
        selectedShape: shape,
        selectionMode,
        setTool,
        setPen,
        setShape,
        enterNodeEditMode
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

    const selectPen = (selectedPen: PenType) => {

        setPen(selectedPen);

        setTool("pen");

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

    const handleNodeEditSelect = () => {
        clearMenus();

        const object =
            canvas?.getActiveObject();

        if (!isNodeEditableObject(object)) {
            setTool(
                "select"
            );
            return;
        }

        enterNodeEditMode(
            object.id ??
            object.name ??
            null
        );
        canvas?.requestRenderAll();
    };

    const handleCompanionReferenceSelect = () => {
        clearMenus();
        setTool(
            "select"
        );
        setCompanionModalOpen(
            true
        );
        void companion?.createReferenceSession();
    };

    return (
        <>
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

            {/* EDIT NODES */}
            <ToolButton
                tool="node-edit"
                label="Edit Nodes"
                icon={
                    SplinePointer
                }
                active={
                    selectionMode ===
                    "node-edit"
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
                onClick={
                    handleNodeEditSelect
                }
            />

            {/* PEN */}
            <ToolButton
                tool="pen"
                label="Pen"
                icon={
                    penTools.find(
                        (
                            item
                        ) =>
                            item.id ===
                            pen
                    )?.icon ??
                    Pencil
                }
                active={
                    tool ===
                    "pen"
                }
                hasMenu
                onMouseEnter={() => {
                    openMenu(
                        "pen"
                    )
                }}
                onMouseLeave={
                    closeMenu
                }
                onClick={() =>
                    handleToolSelect(
                        "pen"
                    )
                }
                onNotchClick={() =>
                    toggleMenu(
                        "pen"
                    )
                }
            />

            <ToolMenu
                open={
                    hoveredMenu ===
                    "pen"
                }
                items={
                    penTools
                }
                selected={
                    pen
                }
                top={112}
                onSelect={
                    selectPen
                }
                onMouseEnter={() =>
                    openMenu(
                        "pen"
                    )
                }
                onMouseLeave={
                    closeMenu
                }
            />

            {/* PATH */}
            <ToolButton
                tool="line"
                label="Path"
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

            {/* COMPANION CAMERA */}
            <ToolButton
                tool="companion-reference"
                label="Capture Bed"
                icon={
                    Camera
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
                onClick={
                    handleCompanionReferenceSelect
                }
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
                hasMenu
                onMouseEnter={() =>
                    openMenu(
                        "shape"
                    )
                }
                onMouseLeave={
                    closeMenu
                }
                onClick={() =>
                    handleToolSelect(
                        "shape"
                    )
                }
                onNotchClick={() =>
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

            <CompanionQrModal
                manager={
                    companion
                }
                open={
                    companionModalOpen
                }
                onClose={() => {
                    companion?.closeReferenceSession();
                    setCompanionModalOpen(
                        false
                    );
                }}
            />
        </>
    );
}
