import type {
    OverlayCommit,
    OverlayRef,
    SelectionGeometry,
    SelectionNode,
} from "../types";
import { viewportPointerToScene } from "../utils/viewport";
import { useEditorStore } from "../../store/editor.store";
import {
    useCanvas
} from "../../canvas/CanvasProvider";
import {
    SnapFeedback,
    getSnappedPoint
} from "../../geometry/snapEngine";

export default function NodeHandle({
    node,
    geometry,
    overlayRef,
    onCommit,
}: {
    node: SelectionNode;
    geometry: SelectionGeometry;
    overlayRef: OverlayRef;
    onCommit: OverlayCommit;
}) {
    const {
        canvas
    } = useCanvas();

    const activeNodeId =
        useEditorStore(
            (
                state
            ) =>
                state.activeNodeId
        );

    const setActiveNodeId =
        useEditorStore(
            (
                state
            ) =>
                state.setActiveNodeId
        );

    const active =
        activeNodeId ===
        node.id;

    const isHandle =
        node.role === "handle-in" ||
        node.role === "handle-out";

    const handlePointerDown =
        (
            event: React.PointerEvent<HTMLButtonElement>
        ) => {
            event.preventDefault();
            event.stopPropagation();

            setActiveNodeId(
                node.id
            );

            const snapFeedback =
                canvas
                    ? new SnapFeedback(
                        canvas
                    )
                    : null;

            const move =
                (
                    pointerEvent: PointerEvent
                ) => {
                    const scenePoint =
                        viewportPointerToScene(
                            geometry,
                            overlayRef,
                            pointerEvent
                        );

                    if (!scenePoint) {
                        return;
                    }

                    const snapped =
                        canvas &&
                        node.role !==
                            "handle-in" &&
                        node.role !==
                            "handle-out"
                            ? getSnappedPoint(
                                scenePoint,
                                {
                                    canvas,
                                    context:
                                        "NODE_EDIT",
                                    excludeNodeIds:
                                        [
                                            node.id
                                        ]
                                }
                            )
                            : null;

                    const commitPoint =
                        snapped?.point ??
                        scenePoint;

                    onCommit({
                        node: {
                            id:
                                node.id,
                            x:
                                commitPoint.x,
                            y:
                                commitPoint.y,
                            altKey:
                                pointerEvent.altKey,
                            shiftKey:
                                pointerEvent.shiftKey,
                        },
                    });

                    if (snapped) {
                        snapFeedback?.update(
                            snapped
                        );
                    }
                };

            const up =
                () => {
                    snapFeedback?.clear();
                    snapFeedback?.destroy();

                    window.removeEventListener(
                        "pointermove",
                        move
                    );
                    window.removeEventListener(
                        "pointerup",
                        up
                    );
                };

            window.addEventListener(
                "pointermove",
                move
            );
            window.addEventListener(
                "pointerup",
                up
            );
        };

    const handleDoubleClick =
        (
            event: React.MouseEvent<HTMLButtonElement>
        ) => {
            event.preventDefault();
            event.stopPropagation();

            if (
                node.role === "handle-in" ||
                node.role === "handle-out"
            ) {
                return;
            }

            onCommit({
                toggleNodeType: {
                    id:
                        node.id
                }
            });
        };

    return (
        <button
            aria-label={
                isHandle
                    ? "Edit bezier handle"
                    : "Edit node"
            }
            className="
                pointer-events-auto
                absolute
                h-2
                w-2
                -translate-x-1/2
                -translate-y-1/2
                rounded-full
                border
                border-zinc-950
                bg-white
                shadow-sm
                outline-none
                hover:bg-zinc-900
                focus-visible:ring-2
                focus-visible:ring-cyan-400
            "
            style={{
                left:
                    node.viewport.x,
                top:
                    node.viewport.y,
                width:
                    isHandle
                        ? 9
                        : 8,
                height:
                    isHandle
                        ? 9
                        : 8,
                borderRadius:
                    isHandle
                        ? 2
                        : 9999,
                backgroundColor:
                    active
                        ? "#0891b2"
                        : isHandle
                            ? "#ecfeff"
                            : "#ffffff",
                borderColor:
                    active
                        ? "#0891b2"
                        : isHandle
                            ? "#0891b2"
                            : "#18181b",
            }}
            onPointerDown={
                handlePointerDown
            }
            onDoubleClick={
                handleDoubleClick
            }
        />
    );
}
