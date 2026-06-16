import MeasurementGuide from "./MeasurementGuide";
import type {
    OverlayCommit,
    SelectionGeometry,
} from "../types";

export default function LineOverlay({
    geometry,
    onCommit,
}: {
    geometry: SelectionGeometry;
    onCommit: OverlayCommit;
}) {
    if (!geometry.line) {
        return null;
    }

    const {
        line,
    } = geometry;

    return (
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
            side={1}
            onCommit={(length) =>
                onCommit({
                    length,
                })
            }
        />
    );
}
