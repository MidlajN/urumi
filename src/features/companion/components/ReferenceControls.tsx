import {
    Eye,
    EyeOff,
    RefreshCcw,
    SlidersHorizontal,
    Trash2
} from "lucide-react";
import {
    useEffect,
    useState
} from "react";

import type {
    CompanionManager
} from "../CompanionManager";
import type {
    CompanionState
} from "../types";
import ReferenceAdjustmentModal from "./ReferenceAdjustmentModal";

const initialState: CompanionState = {
    status:
        "idle",
    peerId:
        null,
    connected:
        false,
    error:
        null,
    reference: {
        exists:
            false,
        visible:
            true,
        opacity:
            0.5
    }
};

export default function ReferenceControls({
    manager,
    onReplace
}: {
    manager: CompanionManager | null;
    onReplace: () => void;
}) {
    const [
        state,
        setState
    ] = useState(
        initialState
    );

    const [
        adjustmentOpen,
        setAdjustmentOpen
    ] = useState(
        false
    );

    useEffect(() => {
        if (
            !manager
        ) {
            return;
        }

        return manager.subscribe(
            setState
        );
    }, [
        manager
    ]);

    if (
        !manager ||
        !state.reference.exists
    ) {
        return null;
    }

    return (
        <>
            <div
                className="
                    pointer-events-auto
                    absolute
                    right-4
                    top-4
                    z-40
                    w-56
                    rounded-lg
                    border
                    border-zinc-200
                    bg-white/95
                    p-3
                    shadow-lg
                    backdrop-blur
                "
            >
                <div className="mb-3 flex items-center justify-between">
                    <div className="text-[13px] font-semibold text-zinc-900">
                        Reference Layer
                    </div>
                    <button
                        type="button"
                        aria-label="Toggle reference visibility"
                        title="Toggle visibility"
                        onClick={() =>
                            manager.toggleReferenceVisibility()
                        }
                        className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    >
                        {state.reference.visible ? (
                            <Eye size={15} />
                        ) : (
                            <EyeOff size={15} />
                        )}
                    </button>
                </div>

                <label className="block">
                    <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase text-zinc-400">
                        <span>Opacity</span>
                        <span>
                            {Math.round(
                                state.reference.opacity *
                                    100
                            )}
                            %
                        </span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={
                            state.reference.opacity
                        }
                        onChange={(event) =>
                            manager.setReferenceOpacity(
                                Number(
                                    event.target.value
                                )
                            )
                        }
                        className="w-full accent-zinc-900"
                    />
                </label>

                <button
                    type="button"
                    onClick={() =>
                        setAdjustmentOpen(
                            true
                        )
                    }
                    className="
                        mt-3
                        flex
                        h-8
                        w-full
                        items-center
                        justify-center
                        gap-2
                        rounded-md
                        border
                        border-zinc-200
                        text-[12px]
                        font-semibold
                        text-zinc-700
                        hover:bg-zinc-50
                    "
                >
                    <SlidersHorizontal size={14} />
                    Adjust
                </button>

                <div className="mt-2 grid grid-cols-3 gap-1">
                    <button
                        type="button"
                        onClick={
                            onReplace
                        }
                        className="h-8 rounded-md border border-zinc-200 text-[12px] font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                        Replace
                    </button>
                    <button
                        type="button"
                        aria-label="Reset reference"
                        title="Reset reference"
                        onClick={() =>
                            manager.resetReference()
                        }
                        className="flex h-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                    >
                        <RefreshCcw size={14} />
                    </button>
                    <button
                        type="button"
                        aria-label="Remove reference"
                        title="Remove reference"
                        onClick={() =>
                            manager.removeReference()
                        }
                        className="flex h-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
            <ReferenceAdjustmentModal
                manager={
                    manager
                }
                open={
                    adjustmentOpen
                }
                onClose={() =>
                    setAdjustmentOpen(
                        false
                    )
                }
            />
        </>
    );
}
