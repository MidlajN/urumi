import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    formatMeasurement,
    parseMeasurement,
} from "../../hooks/useSelectionGeometry";
import type { MeasurementCommit } from "../types";

const MIN_DIMENSION =
    1;

export default function DimensionInput({
    ariaLabel,
    value,
    onCommit,
}: {
    ariaLabel: string;
    value: number;
    onCommit: MeasurementCommit;
}) {
    const skipBlurCommitRef =
        useRef(
            false
        );

    const [
        draft,
        setDraft,
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
        value,
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

            onCommit(
                parsed
            );
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
                    ariaLabel
                }
                value={
                    draft
                }
                onChange={(event) =>
                    setDraft(
                        event.target.value
                    )
                }
                onBlur={(event) => {
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
