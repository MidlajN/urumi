import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    formatMeasurement,
    parseMeasurement,
    type SelectionGeometry,
    type SelectionGeometryPatch
} from "../hooks/useSelectionGeometry";

type DimensionKey =
    | "width"
    | "height";

type Props = {
    geometry: SelectionGeometry | null;
    onCommit: (
        patch: SelectionGeometryPatch
    ) => void;
};

const MIN_DIMENSION =
    1;

const DIMENSION_OFFSET =
    10;

const LABEL_OFFSET =
    10;

const HEIGHT_LABEL_WIDTH =
    84;

function DimensionInput({
    kind,
    value,
    onCommit
}: {
    kind: DimensionKey;
    value: number;
    onCommit: (
        patch: SelectionGeometryPatch
    ) => void;
}) {
    const skipBlurCommitRef =
        useRef(
            false
        );

    const [
        draft,
        setDraft
    ] = useState(
        formatMeasurement(
            value
        )
    );

    useEffect(() => {
        setDraft(
            formatMeasurement(
                value
            )
        );
    }, [
        value
    ]);

    const commit =
        (
            nextDraft =
                draft
        ) => {
            const parsed =
                parseMeasurement(
                    nextDraft
                );

            if (
                parsed ===
                    null ||
                parsed <
                    MIN_DIMENSION
            ) {
                setDraft(
                    formatMeasurement(
                        value
                    )
                );
                return;
            }

            onCommit({
                [kind]:
                    parsed
            });
        };

    return (
        <label
            className="
                flex
                h-7
                items-center
                rounded-md
                border
                border-zinc-300
                bg-white
                px-2
                text-[11px]
                font-semibold
                text-zinc-900
                shadow-sm
            "
            onPointerDown={(event) =>
                event.stopPropagation()
            }
            onMouseDown={(event) =>
                event.stopPropagation()
            }
            onClick={(event) =>
                event.stopPropagation()
            }
        >
            <input
                aria-label={
                    kind ===
                    "width"
                        ? "Object width"
                        : "Object height"
                }
                value={draft}
                onChange={(event) =>
                    setDraft(
                        event.target.value
                    )
                }
                onBlur={(event) =>
                {
                    if (
                        skipBlurCommitRef.current
                    ) {
                        skipBlurCommitRef.current =
                            false;
                        return;
                    }

                    commit(
                        event.currentTarget.value
                    );
                }}
                onKeyDown={(event) => {
                    if (
                        event.key ===
                        "Enter"
                    ) {
                        event.preventDefault();
                        commit(
                            event.currentTarget.value
                        );
                        event.currentTarget.blur();
                    }

                    if (
                        event.key ===
                        "Escape"
                    ) {
                        skipBlurCommitRef.current =
                            true;
                        setDraft(
                            formatMeasurement(
                                value
                            )
                        );
                        event.currentTarget.blur();
                    }
                }}
                className="
                    w-12
                    bg-transparent
                    text-right
                    tabular-nums
                    outline-none
                "
            />
            <span className="ml-1 text-zinc-500">
                mm
            </span>
        </label>
    );
}

export default function SelectionDimensionsOverlay({
    geometry,
    onCommit
}: Props) {
    const overlayRef =
        useRef<HTMLDivElement>(
            null
        );

    const [
        overlayWidth,
        setOverlayWidth
    ] = useState(
        0
    );

    useEffect(() => {
        const updateWidth =
            () =>
                setOverlayWidth(
                    overlayRef.current
                        ?.getBoundingClientRect()
                        .width ??
                        0
                );

        const frame =
            window.requestAnimationFrame(
                updateWidth
            );

        window.addEventListener(
            "resize",
            updateWidth
        );

        return () => {
            window.cancelAnimationFrame(
                frame
            );

            window.removeEventListener(
                "resize",
                updateWidth
            );
        };
    }, [
        geometry
    ]);

    if (!geometry) {
        return null;
    }

    const {
        viewport
    } = geometry;

    const widthTop =
        Math.max(
            8,
            viewport.top -
                34
        );

    const heightGuideLeft =
        viewport.left +
        viewport.width +
        DIMENSION_OFFSET;

    const hasRightSpace =
        overlayWidth ===
            0 ||
        heightGuideLeft +
            LABEL_OFFSET +
            HEIGHT_LABEL_WIDTH <=
            overlayWidth;

    const sideGuideLeft =
        hasRightSpace
            ? heightGuideLeft
            : Math.max(
                8,
                viewport.left -
                    DIMENSION_OFFSET -
                    12
            );

    const sideLabelLeft =
        hasRightSpace
            ? sideGuideLeft +
                LABEL_OFFSET
            : Math.max(
                8,
                sideGuideLeft -
                    LABEL_OFFSET -
                    HEIGHT_LABEL_WIDTH
            );

    const heightCenterTop =
        viewport.top +
        viewport.height /
            2;

    return (
        <div
            ref={overlayRef}
            className="pointer-events-none absolute inset-0 z-20"
        >
            <div
                className="
                    absolute
                    h-3
                    border-t
                    border-x
                    border-zinc-500/70
                "
                style={{
                    left:
                        viewport.left,
                    top:
                        widthTop +
                        12,
                    width:
                        viewport.width
                }}
            />

            <div
                className="
                    pointer-events-auto
                    absolute
                    -translate-x-1/2
                "
                style={{
                    left:
                        viewport.left +
                        viewport.width /
                            2,
                    top:
                        widthTop - 4
                }}
            >
                <DimensionInput
                    kind="width"
                    value={
                        geometry.width
                    }
                    onCommit={
                        onCommit
                    }
                />
            </div>

            <div
                className="
                    absolute
                    w-3
                    border-y
                    border-zinc-500/70
                "
                style={{
                    borderRightWidth:
                        hasRightSpace
                            ? 1
                            : 0,
                    borderLeftWidth:
                        hasRightSpace
                            ? 0
                            : 1,
                    left:
                        sideGuideLeft,
                    top:
                        viewport.top,
                    height:
                        viewport.height
                }}
            />

            <div
                className="
                    pointer-events-auto
                    absolute
                    -translate-y-1/2
                "
                style={{
                    left:
                        sideLabelLeft,
                    top:
                        heightCenterTop
                }}
            >
                <DimensionInput
                    kind="height"
                    value={
                        geometry.height
                    }
                    onCommit={
                        onCommit
                    }
                />
            </div>
        </div>
    );
}
