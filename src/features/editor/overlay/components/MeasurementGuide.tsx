import DimensionInput from "./DimensionInput";
import type {
    MeasurementCommit,
    ViewportPoint,
} from "../types";
import {
    createMeasurementGuide,
    lineStyle,
    MEASUREMENT_OFFSET,
} from "../utils/measurement";
import type {
    MeasurementVisibility
} from "../utils/measurementVisibility";
import {
    VISIBLE_MEASUREMENT
} from "../utils/measurementVisibility";

export default function MeasurementGuide({
    start,
    end,
    value,
    ariaLabel,
    side = 1,
    offset = MEASUREMENT_OFFSET,
    visibility = VISIBLE_MEASUREMENT,
    onCommit,
}: {
    start: ViewportPoint;
    end: ViewportPoint;
    value: number;
    ariaLabel: string;
    side?: 1 | -1;
    offset?: number;
    visibility?: MeasurementVisibility;
    onCommit: MeasurementCommit;
}) {
    const guide =
        createMeasurementGuide({
            start,
            end,
            side,
            offset,
        });

    if (!visibility.showGuide) {
        return null;
    }

    return (
        <>
            {guide.extensions.map(
                (
                    extension,
                    index
                ) => (
                    <div
                        key={
                            index
                        }
                        className="
                            absolute
                            h-px
                            origin-left
                            bg-zinc-500/55
                        "
                        style={
                            lineStyle(
                                extension.start,
                                extension.end
                            )
                        }
                    />
                )
            )}

            <div
                className="
                    absolute
                    h-px
                    origin-left
                    bg-zinc-700/70
                "
                style={
                    lineStyle(
                        guide.main.start,
                        guide.main.end
                    )
                }
            />

            {visibility.showLabel && (
                <div
                    className="
                        pointer-events-auto
                        absolute
                    "
                    style={{
                        left:
                            guide.label.point.x,
                        top:
                            guide.label.point.y,
                        transform:
                            `translate(-50%, -50%) rotate(${guide.label.angle}deg)`,
                    }}
                >
                    <DimensionInput
                        ariaLabel={
                            ariaLabel
                        }
                        value={
                            value
                        }
                        onCommit={
                            onCommit
                        }
                    />
                </div>
            )}
        </>
    );
}
