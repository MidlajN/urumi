import type {
    MeasurementGuideModel,
    ViewportPoint,
} from "../types";
import {
    angleBetween,
    distanceBetween,
    midpointBetween,
    perpendicularOffset,
    readableAngle,
    translatePoint,
} from "./geometry";

export const MEASUREMENT_OFFSET =
    22;

export const MEASUREMENT_LABEL_OFFSET =
    0;

export function createMeasurementGuide({
    start,
    end,
    offset = MEASUREMENT_OFFSET,
    side = 1,
    labelOffset = MEASUREMENT_LABEL_OFFSET,
}: {
    start: ViewportPoint;
    end: ViewportPoint;
    offset?: number;
    side?: 1 | -1;
    labelOffset?: number;
}): MeasurementGuideModel {
    const guideOffset =
        perpendicularOffset(
            start,
            end,
            offset *
                side
        );

    const labelGuideOffset =
        perpendicularOffset(
            start,
            end,
            (
                offset +
                labelOffset
            ) *
                side
        );

    const guideStart =
        translatePoint(
            start,
            guideOffset
        );

    const guideEnd =
        translatePoint(
            end,
            guideOffset
        );

    return {
        main: {
            start:
                guideStart,
            end:
                guideEnd,
        },
        extensions: [
            {
                start,
                end:
                    guideStart,
            },
            {
                start:
                    end,
                end:
                    guideEnd,
            },
        ],
        label: {
            point:
                translatePoint(
                    midpointBetween(
                        start,
                        end
                    ),
                    labelGuideOffset
                ),
            angle:
                readableAngle(
                    angleBetween(
                        guideStart,
                        guideEnd
                    )
                ),
        },
    };
}

export function lineStyle(
    start: ViewportPoint,
    end: ViewportPoint
) {
    return {
        left:
            start.x,
        top:
            start.y,
        width:
            distanceBetween(
                start,
                end
            ),
        transform:
            `rotate(${angleBetween(
                start,
                end
            )}deg)`,
    };
}
