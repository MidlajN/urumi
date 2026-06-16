import MeasurementGuide from "./MeasurementGuide";
import NodeHandle from "./NodeHandle";
import type {
    OverlayCommit,
    OverlayRef,
    SelectionGeometry,
    SelectionSegment,
} from "../types";

function SegmentMeasurement({
    segment,
    onCommit,
}: {
    segment: SelectionSegment;
    onCommit: OverlayCommit;
}) {
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

export default function NodesOverlay({
    geometry,
    overlayRef,
    onCommit,
}: {
    geometry: SelectionGeometry;
    overlayRef: OverlayRef;
    onCommit: OverlayCommit;
}) {
    const segments =
        geometry.segments ??
        [];

    const nodes =
        geometry.nodes ??
        [];

    return (
        <>
            {segments.map(
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

            {nodes.map(
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
