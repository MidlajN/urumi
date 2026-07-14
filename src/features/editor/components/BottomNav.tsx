import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";
import {
    AnimatePresence,
    motion
} from "framer-motion";
import {
    Layers,
    Lock,
    MousePointer2,
    Redo,
    Ruler,
    Trash2,
    Undo,
    Unlock
} from "lucide-react";
import type {
    FabricObject
} from "fabric";

import {
    DragIcon,
    ResetIcon,
    ZoomIn,
    ZoomOut
} from "@/features/editor/components/Icons";
import {
    useCanvas
} from "../canvas/CanvasProvider";
import {
    useEditorStore
} from "../store/editor.store";
import {
    isObjectInteractionLocked,
    setObjectInteractionLocked
} from "../utils/objectLocking";
import { useWorkspaceStore } from "@/stores/workspace.store";

export default function BottomNav() {
    const {
        canvas,
        workspace
    } = useCanvas();

    const { mode } = useWorkspaceStore();

    const showEditorOptions = mode === "design"

    const layersNavRef =
        useRef<HTMLDivElement>(
            null
        );

    const [
        dragMode,
        setDragMode
    ] = useState(
        workspace?.getDragMode() ??
        false
    );

    const [
        layersOpen,
        setLayersOpen
    ] = useState(false);

    const [
        layers,
        setLayers
    ] = useState<FabricObject[]>([]);

    const {
        dimensionsOverlayEnabled,
        toggleDimensionsOverlay
    } = useEditorStore();

    const refreshLayers =
        useCallback(() => {
            if (!canvas) {
                setLayers([]);
                return;
            }

            setLayers(
                canvas
                    .getObjects()
                    .filter(
                        (
                            object
                        ) =>
                            object.name !==
                                "workspace" &&
                            object.name !==
                                "snap-preview"
                    )
                    .reverse()
            );
        }, [
            canvas
        ]);

    useEffect(() => {
        if (!workspace) return;

        const handler = (
            value: unknown
        ) => {
            if (
                typeof value ===
                "boolean"
            ) {
                setDragMode(
                    value
                );
            }
        };

        workspace.on(
            "dragMode",
            handler
        );

        return () => {
            workspace.off(
                "dragMode",
                handler
            );
        };
    }, [
        workspace
    ]);

    useEffect(() => {
        if (!canvas) {
            return;
        }

        refreshLayers();

        const events = [
            "object:added",
            "object:removed",
            "object:modified",
            "selection:created",
            "selection:updated",
            "selection:cleared"
        ] as const;

        events.forEach(
            (
                event
            ) =>
                canvas.on(
                    event,
                    refreshLayers
                )
        );

        return () => {
            events.forEach(
                (
                    event
                ) =>
                    canvas.off(
                        event,
                        refreshLayers
                    )
            );
        };
    }, [
        canvas,
        refreshLayers
    ]);

    useEffect(() => {
        if (!layersOpen) {
            return;
        }

        const handlePointerDown = (
            event: PointerEvent
        ) => {
            if (
                layersNavRef.current?.contains(
                    event.target as Node
                )
            ) {
                return;
            }

            setLayersOpen(false);
        };

        document.addEventListener(
            "pointerdown",
            handlePointerDown
        );

        return () => {
            document.removeEventListener(
                "pointerdown",
                handlePointerDown
            );
        };
    }, [
        layersOpen
    ]);

    useEffect(() => {
        if (
            showEditorOptions
        ) {
            return;
        }

        setLayersOpen(
            false
        );
    }, [
        showEditorOptions
    ]);

    const getLayerLabel = (
        object: FabricObject,
        index: number
    ) => {
        if (
            object.name &&
            object.name !== "geometry-path" &&
            object.name !== "added-path"
        ) {
            return object.name;
        }

        const type =
            object.type
                ? object.type.replace(
                    /-/g,
                    " "
                )
                : "object";

        return `${type.charAt(0).toUpperCase()}${type.slice(1)} ${layers.length - index}`;
    };

    const isLayerLocked = (
        object: FabricObject
    ) =>
        isObjectInteractionLocked(
            object
        );

    const selectLayer = (
        object: FabricObject
    ) => {
        if (!canvas) return;

        canvas.setActiveObject(
            object
        );
        canvas.requestRenderAll();
        refreshLayers();
    };

    const toggleLayerLock = (
        object: FabricObject
    ) => {
        if (!canvas || !workspace) return;

        const nextLocked =
            !isLayerLocked(
                object
            );

        workspace.beginHistoryTransaction();

        setObjectInteractionLocked(
            object,
            nextLocked
        );

        canvas.fire(
            "object:modified",
            {
                target:
                    object
            }
        );
        workspace.endHistoryTransaction();
        canvas.requestRenderAll();
        refreshLayers();
    };

    const deleteLayer = (
        object: FabricObject
    ) => {
        if (!canvas || !workspace) return;

        workspace.beginHistoryTransaction();
        canvas.remove(
            object
        );
        canvas.discardActiveObject();
        canvas.fire(
            "object:removed",
            {
                target:
                    object
            }
        );
        workspace.endHistoryTransaction();
        canvas.requestRenderAll();
        refreshLayers();
    };

    const syncAfterHistoryChange = () => {
        window.setTimeout(
            refreshLayers,
            0
        );
    };

    return (
        <>
            <motion.div
                ref={layersNavRef}
                className="absolute bottom-5 right-5 z-10 flex flex-col items-end gap-3"
                initial={{ opacity: 0, translateY: 40 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: 40 }}
                transition={{ duration: 0.5 }}
            >
                <AnimatePresence>
                    {showEditorOptions &&
                        layersOpen && (
                        <motion.div
                            key="layers-panel"
                            initial={{
                                opacity: 0,
                                y: 14,
                                scale: 0.96
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                scale: 1
                            }}
                            exit={{
                                opacity: 0,
                                y: 10,
                                scale: 0.96
                            }}
                            transition={{
                                duration: 0.18,
                                ease: "easeOut"
                            }}
                            className="
                                w-72
                                overflow-hidden
                                rounded-xl
                                border
                                border-zinc-200
                                bg-white
                                shadow-2xl
                            "
                        >
                            <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-zinc-800">
                                    <Layers size={15} />
                                    Objects
                                </div>
                                <span className="text-xs text-zinc-400">
                                    {layers.length}
                                </span>
                            </div>

                            <div className="max-h-72 overflow-y-auto p-1.5">
                                {layers.length === 0 ? (
                                    <div className="px-3 py-6 text-center text-sm text-zinc-400">
                                        No objects
                                    </div>
                                ) : (
                                    layers.map(
                                        (
                                            object,
                                            index
                                        ) => {
                                            const locked =
                                                isLayerLocked(
                                                    object
                                                );

                                            const active =
                                                canvas?.getActiveObject() ===
                                                object;

                                            return (
                                                <motion.div
                                                    key={`${object.id ?? object.name ?? object.type}:${index}`}
                                                    layout
                                                    className={`
                                                        flex
                                                        items-center
                                                        gap-2
                                                        rounded-lg
                                                        px-2
                                                        py-1.5
                                                        text-sm
                                                        ${active
                                                            ? "bg-cyan-50 text-cyan-900"
                                                            : "text-zinc-700 hover:bg-zinc-50"}
                                                    `}
                                                >
                                                    <button
                                                        type="button"
                                                        className="
                                                            flex
                                                            min-w-0
                                                            flex-1
                                                            items-center
                                                            gap-2
                                                            text-left
                                                        "
                                                        onClick={() =>
                                                            selectLayer(
                                                                object
                                                            )
                                                        }
                                                    >
                                                        <MousePointer2
                                                            size={14}
                                                            className={
                                                                active
                                                                    ? "text-cyan-600"
                                                                    : "text-zinc-400"
                                                            }
                                                        />
                                                        <span className="truncate">
                                                            {getLayerLabel(
                                                                object,
                                                                index
                                                            )}
                                                        </span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        aria-label={
                                                            locked
                                                                ? "Unlock object"
                                                                : "Lock object"
                                                        }
                                                        title={
                                                            locked
                                                                ? "Unlock object"
                                                                : "Lock object"
                                                        }
                                                        className={`
                                                            rounded-md
                                                            p-1.5
                                                            transition-colors
                                                            ${locked
                                                                ? "bg-zinc-900 text-white"
                                                                : "text-zinc-500 hover:bg-zinc-100"}
                                                        `}
                                                        onClick={() =>
                                                            toggleLayerLock(
                                                                object
                                                            )
                                                        }
                                                    >
                                                        {locked ? (
                                                            <Lock size={14} />
                                                        ) : (
                                                            <Unlock size={14} />
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        aria-label="Delete object"
                                                        title="Delete object"
                                                        className="
                                                            rounded-md
                                                            p-1.5
                                                            text-zinc-500
                                                            transition-colors
                                                            hover:bg-red-50
                                                            hover:text-red-600
                                                        "
                                                        onClick={() =>
                                                            deleteLayer(
                                                                object
                                                            )
                                                        }
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </motion.div>
                                            );
                                        }
                                    )
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                { showEditorOptions && 
                    <div className="flex gap-3">
                        <div className="flex rounded-lg p-1 bg-white gap-0.5 shadow-xl">
                            <motion.button
                                className="px-4 py-2 bg-zinc-100 transition-all duration-300 border border-transparent hover:border-[#1c809681]"
                                whileTap={{ scale: 0.95, background: "#f3f4f6" }}
                                onClick={() => {
                                    if (!workspace) return;

                                    workspace.undo();
                                    syncAfterHistoryChange();
                                }}
                            >
                                <Undo width={16} height={16} />
                            </motion.button>
                            <motion.button
                                className="px-4 py-2 bg-zinc-100 transition-all duration-300 rounded-e-md border border-transparent hover:border-[#1c809681]"
                                whileTap={{ scale: 0.95, background: "#f3f4f6" }}
                                onClick={() => {
                                    if (!workspace) return;

                                    workspace.redo();
                                    syncAfterHistoryChange();
                                }}
                            >
                                <Redo width={16} height={16} />
                            </motion.button>
                        </div>

                        <motion.button
                            aria-label={layersOpen ? "Hide object stack" : "Show object stack"}
                            title={layersOpen ? "Hide object stack" : "Show object stack"}
                            className="px-4 py-2 bg-white shadow-xl transition-all duration-300 border border-transparent rounded-lg hover:border-[#1c809681]"
                            style={{
                                background:
                                    layersOpen
                                        ? "#0891b2"
                                        : "#ffffff"
                            }}
                            whileTap={{ scale: 0.95, background: "#f3f4f6" }}
                            onClick={() =>
                                setLayersOpen(
                                    (
                                        open
                                    ) =>
                                        !open
                                )
                            }
                        >
                            <Layers
                                width={16}
                                height={16}
                                style={{
                                    stroke:
                                        layersOpen
                                            ? "#ffffff"
                                            : "#18181b"
                                }}
                            />
                        </motion.button>
                    </div>
                }
            </motion.div>

            <motion.div
                className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-4 items-center"
                initial={{ opacity: 0, translateY: 40 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: 40 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex h-fit shadow-xl rounded-md">
                    <motion.button
                        className="px-5 py-3 bg-white transition-all duration-300 rounded-s-lg border border-transparent hover:border-[#1c809681]"
                        whileTap={{ scale: 0.98, background: "#f3f4f6" }}
                        style={{ background: dragMode ? "#22c55e" : "#ffffff" }}
                        onClick={() => {
                            if (!workspace) return;

                            if (!dragMode) {
                                workspace.startDrag();
                            } else {
                                workspace.endDrag();
                            }
                        }}
                    >
                        <DragIcon
                            width={16}
                            height={16}
                            style={{
                                stroke:
                                    dragMode
                                        ? "#ffffff"
                                        : "#22c55e"
                            }}
                        />
                    </motion.button>
                    { showEditorOptions && 
                        <motion.button
                            aria-label={
                                dimensionsOverlayEnabled
                                    ? "Hide dimensions overlay"
                                    : "Show dimensions overlay"
                            }
                            title={
                                dimensionsOverlayEnabled
                                    ? "Hide dimensions overlay"
                                    : "Show dimensions overlay"
                            }
                            className="px-5 py-3 bg-white transition-all duration-300 border border-transparent hover:border-[#1c809681]"
                            whileTap={{ scale: 0.98, background: "#f3f4f6" }}
                            style={{ background: dimensionsOverlayEnabled ? "#0891b2" : "#ffffff" }}
                            onClick={toggleDimensionsOverlay}
                        >
                            <Ruler
                                width={16}
                                height={16}
                                style={{
                                    stroke:
                                        dimensionsOverlayEnabled
                                            ? "#ffffff"
                                            : "#0891b2"
                                }}
                            />
                        </motion.button>
                    }
                    <motion.button
                        className="px-5 py-3 bg-white transition-all duration-300 border border-transparent hover:border-[#1c809681]"
                        whileTap={{ scale: 0.95, background: "#f3f4f6" }}
                        onClick={() => {
                            if (!workspace) return;

                            workspace.zoomIn();
                        }}
                    >
                        <ZoomIn width={16} height={16} />
                    </motion.button>
                    <motion.button
                        className="px-5 py-3 bg-white transition-all duration-300 border border-transparent hover:border-[#1c809681]"
                        whileTap={{ scale: 0.95, background: "#f3f4f6" }}
                        onClick={() => {
                            if (!workspace) return;

                            workspace.zoomOut();
                        }}
                    >
                        <ZoomOut width={16} height={16} />
                    </motion.button>
                    <motion.button
                        className="px-5 py-3 bg-white transition-all duration-300 border border-transparent hover:border-[#1c809681] rounded-e-lg"
                        whileTap={{ scale: 0.95, background: "#f3f4f6" }}
                        onClick={() => {
                            if (!workspace) return;

                            workspace.setZoomAuto();
                        }}
                    >
                        <ResetIcon width={18} height={18} />
                    </motion.button>
                </div>
            </motion.div>
        </>
    );
}
