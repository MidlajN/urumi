import {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import {
    createPortal
} from "react-dom";
import {
    AnimatePresence,
    motion
} from "framer-motion";
import {
    ArrowLeft,
    Boxes,
    FileCode2,
    Layers3
} from "lucide-react";

import ExecutionDocumentModal from "./ExecutionDocumentPanel";
import MaterialSection from "./MaterialSection";
import MaterialToolSettingsModal from "./MaterialToolSettingsModal";
import OperationCard from "./OperationCard";
import OperationObjectsPanel from "./OperationObjectsPanel";
import {
    useManufacturingSummary
} from "../hooks/useManufacturingSummary";
import {
    useWorkspaceStore
} from "@/stores/workspace.store";

const OBJECT_PANEL_WIDTH =
    320;

const OBJECT_PANEL_MAX_HEIGHT =
    420;

const OBJECT_PANEL_GAP =
    12;

const VIEWPORT_MARGIN =
    16;

type FloatingPanelPosition = {
    left: number;
    top: number;
};

export default function ManufacturingSidebar() {
    const setMode =
        useWorkspaceStore(
            (
                state
            ) => state.setMode
        );

    const {
        summary,
        selectObject,
        moveObjectToOperation
    } = useManufacturingSummary();

    const panelRef =
        useRef<HTMLDivElement | null>(
            null
        );

    const [
        selectedOperationId,
        setSelectedOperationId
    ] = useState<string | null>(
        null
    );

    const [
        floatingPanelPosition,
        setFloatingPanelPosition
    ] = useState<FloatingPanelPosition | null>(
        null
    );

    const [
        materialSettingsOpen,
        setMaterialSettingsOpen
    ] = useState(
        false
    );

    const [
        executionDocumentOpen,
        setExecutionDocumentOpen
    ] = useState(
        false
    );

    const selectedOperation =
        useMemo(
            () =>
                summary.operations.find(
                    (
                        operation
                    ) =>
                        operation.operationId ===
                        selectedOperationId
                ) ?? null,
            [
                selectedOperationId,
                summary.operations
            ]
        );

    useEffect(() => {
        if (
            !selectedOperationId ||
            selectedOperation
        ) {
            return;
        }

        setSelectedOperationId(
            null
        );
        setFloatingPanelPosition(
            null
        );
    }, [
        selectedOperation,
        selectedOperationId
    ]);

    useEffect(() => {
        if (
            !selectedOperation
        ) {
            return;
        }

        const handlePointerDown =
            (
                event: PointerEvent
            ) => {
                const panel =
                    panelRef.current;

                const target =
                    event.target as Node;

                if (
                    panel?.contains(
                        target
                    ) ||
                    (
                        target instanceof
                            Element &&
                        target.closest(
                            "[data-machine-select-menu]"
                        )
                    )
                ) {
                    return;
                }

                setSelectedOperationId(
                    null
                );
                setFloatingPanelPosition(
                    null
                );
            };

        window.addEventListener(
            "pointerdown",
            handlePointerDown
        );

        return () => {
            window.removeEventListener(
                "pointerdown",
                handlePointerDown
            );
        };
    }, [
        selectedOperation
    ]);

    const openObjectsPanel =
        (
            operationId: string,
            anchorRect: DOMRect
        ) => {
            setSelectedOperationId(
                operationId
            );
            setFloatingPanelPosition(
                getFloatingPanelPosition(
                    anchorRect
                )
            );
        };

    const closeObjectsPanel =
        () => {
            setSelectedOperationId(
                null
            );
            setFloatingPanelPosition(
                null
            );
        };

    return (
        <aside
            className="
                flex
                h-screen
                w-[336px]
                shrink-0
                flex-col
                border-l
                border-zinc-200
                bg-[#f4f5f7]
            "
        >
            <header className="border-b border-zinc-200 bg-white">
                <div className="flex h-[78px] items-center gap-3 px-4">
                    <button
                        type="button"
                        aria-label="Back to design"
                        title="Back to design"
                        onClick={() =>
                            setMode(
                                "design"
                            )
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950"
                    >
                        <ArrowLeft size={17} />
                    </button>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="truncate text-[15px] font-semibold text-zinc-950">
                                Manufacturing
                            </h2>
                            <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[9px] font-bold uppercase text-cyan-700">
                                Setup
                            </span>
                        </div>
                        <div className="mt-1 text-[11px] font-medium text-zinc-500">
                            Read-only document preparation
                        </div>
                    </div>

                    <button
                        type="button"
                        aria-label="View execution document"
                        title="View execution document"
                        onClick={() =>
                            setExecutionDocumentOpen(
                                true
                            )
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-white transition hover:bg-zinc-800"
                    >
                        <FileCode2 size={17} />
                    </button>
                </div>

                <div className="flex items-center gap-4 border-t border-zinc-100 bg-zinc-50/60 px-4 py-2.5">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-700">
                        <Boxes size={13} className="text-zinc-400" />
                        {summary.totalObjectCount}
                        <span className="font-medium text-zinc-400">
                            {summary.totalObjectCount === 1
                                ? "object"
                                : "objects"}
                        </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-700">
                        <Layers3 size={13} className="text-zinc-400" />
                        {summary.operations.length}
                        <span className="font-medium text-zinc-400">
                            {summary.operations.length === 1
                                ? "operation"
                                : "operations"}
                        </span>
                    </span>
                </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <MaterialSection
                    onOpenSettings={() =>
                        setMaterialSettingsOpen(
                            true
                        )
                    }
                />

                <div className="mt-5">
                    <div className="mb-2.5 flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-bold uppercase text-zinc-500">
                                Document operations
                            </div>
                            <div className="mt-0.5 text-[10px] font-medium text-zinc-400">
                                Grouped by assigned operation
                            </div>
                        </div>
                        <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[10px] font-bold text-zinc-500">
                            {summary.operations.length}
                        </span>
                    </div>

                    {summary.operations.length ===
                    0 ? (
                        <div className="rounded-md border border-dashed border-zinc-300 bg-white px-5 py-8 text-center">
                            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-400">
                                <Layers3 size={18} />
                            </span>
                            <div className="mt-3 text-[13px] font-semibold text-zinc-700">
                                No operations yet
                            </div>
                            <div className="mt-1 text-[11px] font-medium leading-4 text-zinc-500">
                                Assign operation colors to design objects before manufacturing.
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-100 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
                            {summary.operations.map(
                                (
                                    operation
                                ) => (
                                    <OperationCard
                                        key={
                                            operation.operationId
                                        }
                                        summary={
                                            operation
                                        }
                                        onOpenObjects={
                                            openObjectsPanel
                                        }
                                    />
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {createPortal(
                <AnimatePresence>
                    {selectedOperation &&
                        floatingPanelPosition && (
                            <motion.div
                                ref={
                                    panelRef
                                }
                                initial={{
                                    opacity:
                                        0,
                                    x:
                                        10,
                                    scale:
                                        0.98
                                }}
                                animate={{
                                    opacity:
                                        1,
                                    x:
                                        0,
                                    scale:
                                        1
                                }}
                                exit={{
                                    opacity:
                                        0,
                                    x:
                                        8,
                                    scale:
                                        0.98
                                }}
                                transition={{
                                    duration:
                                        0.16,
                                    ease:
                                        "easeOut"
                                }}
                                style={{
                                    left:
                                        floatingPanelPosition.left,
                                    top:
                                        floatingPanelPosition.top,
                                    width:
                                        OBJECT_PANEL_WIDTH
                                }}
                                className="
                                    fixed
                                    z-50
                                    rounded-lg
                                    bg-white
                                    shadow-xl
                                    shadow-zinc-900/15
                                "
                            >
                                <OperationObjectsPanel
                                    summary={
                                        selectedOperation
                                    }
                                    onClose={
                                        closeObjectsPanel
                                    }
                                    onSelectObject={
                                        selectObject
                                    }
                                    onMoveObjectToOperation={
                                        moveObjectToOperation
                                    }
                                />
                            </motion.div>
                        )}
                </AnimatePresence>,
                document.body
            )}

            <MaterialToolSettingsModal
                open={
                    materialSettingsOpen
                }
                onClose={() =>
                    setMaterialSettingsOpen(
                        false
                    )
                }
            />

            <ExecutionDocumentModal
                summary={
                    summary
                }
                open={
                    executionDocumentOpen
                }
                onClose={() =>
                    setExecutionDocumentOpen(
                        false
                    )
                }
            />
        </aside>
    );
}

function getFloatingPanelPosition(
    anchorRect: DOMRect
): FloatingPanelPosition {
    const preferredLeft =
        anchorRect.right +
        OBJECT_PANEL_GAP;

    const hasRoomOnRight =
        preferredLeft +
            OBJECT_PANEL_WIDTH <=
        window.innerWidth -
            VIEWPORT_MARGIN;

    const left =
        hasRoomOnRight
            ? preferredLeft
            : Math.max(
                VIEWPORT_MARGIN,
                anchorRect.left -
                    OBJECT_PANEL_WIDTH -
                    OBJECT_PANEL_GAP
            );

    const maxTop =
        Math.max(
            VIEWPORT_MARGIN,
            window.innerHeight -
                OBJECT_PANEL_MAX_HEIGHT -
                VIEWPORT_MARGIN
        );

    const top =
        Math.min(
            Math.max(
                VIEWPORT_MARGIN,
                anchorRect.top -
                    12
            ),
            maxTop
        );

    return {
        left,
        top
    };
}
