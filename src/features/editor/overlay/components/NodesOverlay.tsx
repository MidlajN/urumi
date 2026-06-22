import MeasurementGuide from "./MeasurementGuide";
import NodeHandle from "./NodeHandle";
import {
    useEditorStore
} from "../../store/editor.store";
import type {
    OverlayCommit,
    OverlayRef,
    SelectionGeometry,
    SelectionSegment,
} from "../types";
import {
    getSegmentMeasurementVisibility
} from "../utils/measurementVisibility";

function SegmentMeasurement({
    segment,
    onCommit,
}: {
    segment: SelectionSegment;
    onCommit: OverlayCommit;
}) {
    const visibility =
        getSegmentMeasurementVisibility(
            segment.start,
            segment.end
        );

    return (
        <MeasurementGuide
            ariaLabel="Segment length"
            start={
                segment.start
            }
            end={
                segment.end
            }
            value={
                segment.length
            }
            visibility={
                visibility
            }
            side={1}
            onCommit={(length) =>
                onCommit({
                    segment: {
                        endNodeId:
                            segment.endNodeId,
                        length,
                    },
                })
            }
        />
    );
}

function SegmentEditor({
    segment,
    active,
    onSelect,
    onCommit,
}: {
    segment: SelectionSegment;
    active: boolean;
    onSelect: () => void;
    onCommit: OverlayCommit;
}) {
    const setActiveNodeId =
        useEditorStore(
            (
                state
            ) =>
                state.setActiveNodeId
        );

    const width =
        Math.hypot(
            segment.end.x -
                segment.start.x,
            segment.end.y -
                segment.start.y
        );

    return (
        <>
            <button
                aria-label="Select segment"
                className="
                    pointer-events-auto
                    absolute
                    h-3
                    rounded-full
                    outline-none
                    focus-visible:ring-2
                    focus-visible:ring-cyan-400
                "
                style={{
                    left:
                        segment.start.x,
                    top:
                        segment.start.y,
                    width:
                        Math.max(
                            width,
                            8
                        ),
                    transform:
                        `translateY(-50%) rotate(${segment.angle}deg)`,
                    transformOrigin:
                        "left center",
                    backgroundColor:
                        active
                            ? "rgba(8, 145, 178, 0.26)"
                            : "transparent",
                    border:
                        active
                            ? "1px solid rgba(8, 145, 178, 0.72)"
                            : "1px solid transparent"
                }}
                onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onSelect();
                }}
            />

            {active && (
                <div
                    className="
                        pointer-events-auto
                        absolute
                        flex
                        -translate-x-1/2
                        -translate-y-[calc(100%+10px)]
                        gap-1
                        rounded-md
                        border
                        border-zinc-200
                        bg-white
                        p-1
                        text-[11px]
                        shadow-sm
                    "
                    style={{
                        left:
                            segment.midpoint.x,
                        top:
                            segment.midpoint.y
                    }}
                >
                    <button
                        className="rounded px-2 py-1 hover:bg-zinc-100"
                        onClick={() => {
                            onCommit({
                                segmentAction: {
                                    id:
                                        segment.id,
                                    action:
                                        "convert-curve"
                                }
                            });
                            setActiveNodeId(
                                segment.startNodeId
                            );
                        }}
                    >
                        Curve
                    </button>
                    <button
                        className="rounded px-2 py-1 hover:bg-zinc-100"
                        onClick={() =>
                            onCommit({
                                segmentAction: {
                                    id:
                                        segment.id,
                                    action:
                                        "add-node"
                                }
                            })
                        }
                    >
                        + Node
                    </button>
                    <button
                        className="rounded px-2 py-1 hover:bg-zinc-100"
                        onClick={() =>
                            onCommit({
                                segmentAction: {
                                    id:
                                        segment.id,
                                    action:
                                        "split"
                                }
                            })
                        }
                    >
                        Split
                    </button>
                </div>
            )}
        </>
    );
}

export default function NodesOverlay({
    geometry,
    overlayRef,
    measurementsEnabled,
    onCommit,
}: {
    geometry: SelectionGeometry;
    overlayRef: OverlayRef;
    measurementsEnabled: boolean;
    onCommit: OverlayCommit;
}) {
    const segments =
        geometry.segments ??
        [];

    const nodes =
        geometry.nodes ??
        [];

    const activeNodeId =
        useEditorStore(
            (
                state
            ) =>
                state.activeNodeId
        );

    const activeSegmentId =
        useEditorStore(
            (
                state
            ) =>
                state.activeSegmentId
        );

    const setActiveSegmentId =
        useEditorStore(
            (
                state
            ) =>
                state.setActiveSegmentId
        );

    const activeNode =
        nodes.find(
            (
                node
            ) =>
                node.id ===
                activeNodeId
        );

    const activeOwnerNodeId =
        activeNode?.ownerNodeId;

    const visibleNodes =
        nodes.filter(
            (
                node
            ) =>
                node.role !== "handle-in" &&
                node.role !== "handle-out"
                    ? true
                    : Boolean(
                        activeOwnerNodeId &&
                        node.ownerNodeId ===
                            activeOwnerNodeId
                    )
        );

    const handleGuides =
        visibleNodes
            .filter(
                (
                    node
                ) =>
                    node.role ===
                        "handle-in" ||
                    node.role ===
                        "handle-out"
            )
            .map(
                (
                    handle
                ) => {
                    const owner =
                        nodes.find(
                            (
                                node
                            ) =>
                                node.role ===
                                    "node" &&
                                node.ownerNodeId ===
                                    handle.ownerNodeId
                        );

                    if (!owner) {
                        return null;
                    }

                    const dx =
                        handle.viewport.x -
                        owner.viewport.x;

                    const dy =
                        handle.viewport.y -
                        owner.viewport.y;

                    const length =
                        Math.hypot(
                            dx,
                            dy
                        );

                    const angle =
                        (
                            Math.atan2(
                                dy,
                                dx
                            ) *
                            180
                        ) /
                        Math.PI;

                    return (
                        <div
                            key={
                                `guide:${handle.id}`
                            }
                            className="
                                pointer-events-none
                                absolute
                                h-px
                                bg-cyan-600/70
                            "
                            style={{
                                left:
                                    owner.viewport.x,
                                top:
                                    owner.viewport.y,
                                width:
                                    length,
                                transform:
                                    `rotate(${angle}deg)`,
                                transformOrigin:
                                    "left center"
                            }}
                        />
                    );
                }
            );

    return (
        <>
            {segments.map(
                (
                    segment
                ) => (
                    <SegmentEditor
                        key={
                            `editor:${segment.id}`
                        }
                        segment={
                            segment
                        }
                        active={
                            activeSegmentId ===
                            segment.id
                        }
                        onSelect={() =>
                            setActiveSegmentId(
                                segment.id
                            )
                        }
                        onCommit={
                            onCommit
                        }
                    />
                )
            )}

            {measurementsEnabled && segments.map(
                (
                    segment
                ) => (
                    <SegmentMeasurement
                        key={
                            segment.id
                        }
                        segment={
                            segment
                        }
                        onCommit={
                            onCommit
                        }
                    />
                )
            )}

            {handleGuides}

            {visibleNodes.map(
                (
                    node
                ) => (
                    <NodeHandle
                        key={
                            node.id
                        }
                        node={
                            node
                        }
                        geometry={
                            geometry
                        }
                        overlayRef={
                            overlayRef
                        }
                        onCommit={
                            onCommit
                        }
                    />
                )
            )}
        </>
    );
}
