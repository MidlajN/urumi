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
    editable = true,
    onCommit,
}: {
    ariaLabel: string;
    value: number;
    editable?: boolean;
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

    const [
        editing,
        setEditing
    ] = useState(false);

    const inputRef =
        useRef<HTMLInputElement>(
            null
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

    useEffect(() => {
        if (!editing) {
            return;
        }

        inputRef.current?.focus();
        inputRef.current?.select();
    }, [
        editing
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
                setEditing(
                    false
                );
                return;
            }

            onCommit(
                parsed
            );
            setEditing(
                false
            );
        };

    if (
        !editing ||
        !editable
    ) {
        return (
            <button
                type="button"
                aria-label={
                    ariaLabel
                }
                className="
                    rounded-md
                    bg-transparent
                    px-2
                    py-1
                    text-[11px]
                    font-semibold
                    tabular-nums
                    text-zinc-900
                    outline-none
                    focus-visible:ring-2
                    focus-visible:ring-cyan-400
                    backdrop-blur-[2px] 
                    transition-all duration-200
                    disabled:cursor-default
                    disabled:text-zinc-500
                    enabled:cursor-text
                    enabled:hover:bg-white
                    enabled:hover:shadow-sm
                "
                disabled={
                    !editable
                }
                onPointerDown={(event) =>
                    event.stopPropagation()
                }
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
                onClick={(event) => {
                    event.stopPropagation();
                    if (!editable) {
                        return;
                    }
                    setEditing(
                        true
                    );
                }}
            >
                {formatMeasurement(
                    value
                )}
                <span className="ml-1 text-zinc-500">
                    mm
                </span>
            </button>
        );
    }

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
                ref={
                    inputRef
                }
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
                        setEditing(
                            false
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
