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

import MaterialSection from "./MaterialSection";
import MaterialToolSettingsModal from "./MaterialToolSettingsModal";
import OperationCard from "./OperationCard";
import OperationObjectsPanel from "./OperationObjectsPanel";
import {
    useManufacturingSummary
} from "../hooks/useManufacturingSummary";

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

                if (
                    panel?.contains(
                        event.target as Node
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
                bg-white
            "
        >
            <div className="border-b border-zinc-100 p-5">
                <h2 className="text-lg font-semibold text-zinc-950">
                    Manufacturing
                </h2>
                <div className="mt-1 text-[12px] font-medium text-zinc-500">
                    {summary.totalObjectCount}
                    {" "}
                    manufacturing
                    {" "}
                    {summary.totalObjectCount ===
                    1
                        ? "object"
                        : "objects"}
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <MaterialSection
                    onOpenSettings={() =>
                        setMaterialSettingsOpen(
                            true
                        )
                    }
                />

                <div className="mt-6">
                    <div className="mb-2 text-[12px] font-semibold uppercase text-zinc-500">
                        Operations
                    </div>

                    {summary.operations.length ===
                    0 ? (
                        <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-6 text-center text-[13px] font-medium text-zinc-500">
                            No manufacturing objects found.
                        </div>
                    ) : (
                        <div className="space-y-3">
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
