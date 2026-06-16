import MeasurementGuide from "./MeasurementGuide";
import type {
    OverlayCommit,
    SelectionGeometry,
} from "../types";

const DIMENSION_OFFSET =
    22;

const LABEL_OFFSET =
    10;

const HEIGHT_LABEL_WIDTH =
    84;

export default function BboxOverlay({
    geometry,
    overlayWidth,
    onCommit,
}: {
    geometry: SelectionGeometry;
    overlayWidth: number;
    onCommit: OverlayCommit;
}) {
    const {
        viewport,
    } = geometry;

    const rightGuideLeft =
        viewport.left +
        viewport.width +
        DIMENSION_OFFSET;

    const hasRightSpace =
        overlayWidth ===
            0 ||
        rightGuideLeft +
            LABEL_OFFSET +
            HEIGHT_LABEL_WIDTH <=
            overlayWidth;

    const topLeft = {
        x:
            viewport.left,
        y:
            viewport.top,
    };

    const topRight = {
        x:
            viewport.left +
            viewport.width,
        y:
            viewport.top,
    };

    const bottomRight = {
        x:
            viewport.left +
            viewport.width,
        y:
            viewport.top +
            viewport.height,
    };

    const bottomLeft = {
        x:
            viewport.left,
        y:
            viewport.top +
            viewport.height,
    };

    return (
        <>
            <MeasurementGuide
                ariaLabel="Object width"
                start={
                    topLeft
                }
                end={
                    topRight
                }
                value={
                    geometry.width
                }
                side={-1}
                offset={
                    DIMENSION_OFFSET
                }
                onCommit={(width) =>
                    onCommit({
                        width,
                    })
                }
            />

            <MeasurementGuide
                ariaLabel="Object height"
                start={
                    hasRightSpace
                        ? topRight
                        : topLeft
                }
                end={
                    hasRightSpace
                        ? bottomRight
                        : bottomLeft
                }
                value={
                    geometry.height
                }
                side={
                    hasRightSpace
                        ? -1
                        : 1
                }
                offset={
                    DIMENSION_OFFSET
                }
                onCommit={(height) =>
                    onCommit({
                        height,
                    })
                }
            />
        </>
    );
}
