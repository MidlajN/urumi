import MeasurementGuide from "./MeasurementGuide";
import {
    Lock,
    Unlock
} from "lucide-react";
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
        locked
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
            <div
                className={`
                    pointer-events-none
                    absolute
                    border
                    ${locked
                        ? "border-zinc-900/70"
                        : "border-cyan-700/45"}
                `}
                style={{
                    left:
                        viewport.left,
                    top:
                        viewport.top,
                    width:
                        viewport.width,
                    height:
                        viewport.height
                }}
            />

            <button
                type="button"
                aria-label={
                    locked
                        ? "Unlock object"
                        : "Lock object"
                }
                title={
                    locked
                        ? "Unlock object"
                        : "Lock object"
                }
                className={`
                    pointer-events-auto
                    absolute
                    flex
                    h-7
                    w-7
                    items-center
                    justify-center
                    rounded-md
                    border
                    shadow-sm
                    transition-colors
                    ${locked
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"}
                `}
                style={{
                    left:
                        viewport.left +
                        viewport.width +
                        8,
                    top:
                        viewport.top -
                        34
                }}
                onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                }}
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onCommit({
                        locked:
                            !locked
                    });
                }}
            >
                {locked ? (
                    <Lock size={14} />
                ) : (
                    <Unlock size={14} />
                )}
            </button>

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
                editable={
                    !locked
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
                editable={
                    !locked
                }
            />
        </>
    );
}
