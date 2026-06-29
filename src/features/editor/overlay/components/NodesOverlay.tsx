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
import {
    viewportPointerToScene
} from "../utils/viewport";

function SegmentMeasurement({
    segment,
    onCommit,
}: {
    segment: SelectionSegment;
    onCommit: OverlayCommit;
}) {
    if (
        segment.path.length > 2
    ) {
        return null;
    }

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
    geometry,
    overlayRef,
}: {
    segment: SelectionSegment;
    active: boolean;
    onSelect: () => void;
    onCommit: OverlayCommit;
    geometry: SelectionGeometry;
    overlayRef: OverlayRef;
}) {
    const pathData =
        segment.path
            .map(
                (
                    point,
                    index
                ) =>
                    `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
            )
            .join(" ");

    return (
        <g>
            {active && (
                <path
                    d={
                        pathData
                    }
                    fill="none"
                    stroke="rgba(8, 145, 178, 0.28)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={12}
                    vectorEffect="non-scaling-stroke"
                    pointerEvents="none"
                />
            )}
            <path
                d={
                    pathData
                }
                fill="none"
                stroke={
                    active
                        ? "rgba(8, 145, 178, 0.92)"
                        : "rgba(8, 145, 178, 0)"
                }
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={
                    active
                        ? 2
                        : 1
                }
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
            />
            <path
                aria-label="Select segment"
                d={
                    pathData
                }
                fill="none"
                stroke="transparent"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={18}
                className="pointer-events-auto cursor-pointer outline-none"
                pointerEvents="stroke"
                tabIndex={0}
                onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onSelect();
                }}
                onDoubleClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onSelect();

                    const scenePoint =
                        viewportPointerToScene(
                            geometry,
                            overlayRef,
                            event.nativeEvent
                        );

                    if (!scenePoint) {
                        return;
                    }

                    onCommit({
                        segmentAction: {
                            id:
                                segment.id,
                            action:
                                "add-node",
                            scenePoint: {
                                x:
                                    scenePoint.x,
                                y:
                                    scenePoint.y
                            }
                        }
                    });
                }}
            />
        </g>
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
            <svg
                className="
                    pointer-events-none
                    absolute
                    inset-0
                    h-full
                    w-full
                    overflow-visible
                "
            >
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
                            geometry={
                                geometry
                            }
                            overlayRef={
                                overlayRef
                            }
                        />
                    )
                )}
            </svg>

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
