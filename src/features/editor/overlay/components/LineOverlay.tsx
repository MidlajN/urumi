import MeasurementGuide from "./MeasurementGuide";
import NodeHandle from "./NodeHandle";
import type {
    OverlayCommit,
    OverlayRef,
    SelectionGeometry,
} from "../types";
import {
    getSegmentMeasurementVisibility
} from "../utils/measurementVisibility";

export default function LineOverlay({
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
    if (!geometry.line) {
        return null;
    }

    const {
        line,
    } = geometry;

    const nodes =
        geometry.nodes ??
        [];

    const visibility =
        getSegmentMeasurementVisibility(
            line.start,
            line.end
        );

    return (
        <>
            {measurementsEnabled && (
                <MeasurementGuide
                    ariaLabel="Line length"
                    start={
                        line.start
                    }
                    end={
                        line.end
                    }
                    value={
                        line.length
                    }
                    visibility={
                        visibility
                    }
                    side={1}
                    onCommit={(length) =>
                        onCommit({
                            length,
                        })
                    }
                />
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
