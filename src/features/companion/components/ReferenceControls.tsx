import {
    Eye,
    EyeOff,
    RefreshCcw,
    SwitchCamera,
    Trash2
} from "lucide-react";
import {
    useEffect,
    useRef,
    useState
} from "react";

import type {
    CompanionManager
} from "../CompanionManager";
import {
    createInitialCompanionState
} from "../types";

const initialState = createInitialCompanionState();

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
        open,
        setOpen
    ] = useState(
        false
    );

    const containerRef =
        useRef<HTMLDivElement | null>(
            null
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

    const exists = state.reference.exists;

    // A freshly added reference always starts with the panel closed.
    useEffect(() => {
        if (!exists) {
            setOpen(false);
        }
    }, [
        exists
    ]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (
                containerRef.current?.contains(
                    event.target as Node
                )
            ) {
                return;
            }

            setOpen(false);
        };

        window.addEventListener(
            "pointerdown",
            handlePointerDown
        );

        return () => {
            window.removeEventListener(
                "pointerdown",
                handlePointerDown
            );
        };
    }, [
        open
    ]);

    if (
        !manager ||
        !exists
    ) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className="pointer-events-auto absolute right-4 top-8 z-40 flex flex-col items-end gap-2"
        >
            <button
                type="button"
                aria-label="Reference layer controls"
                title="Reference layer"
                aria-expanded={open}
                onClick={() =>
                    setOpen(
                        (value) => !value
                    )
                }
                className={`
                    flex
                    px-4 py-2
                    items-center
                    justify-center
                    rounded-md
                    border
                    shadow-md
                    backdrop-blur
                    transition
                    ${
                        open
                            ? "border-zinc-900 bg-zinc-950 text-white"
                            : "border-zinc-200 bg-white/95 text-zinc-600 hover:border-zinc-300 hover:text-zinc-950"
                    }
                `}
            >
                <SwitchCamera size={18} />
            </button>

            {open && (
                <div
                    className="
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

                    <div className="mt-3 grid grid-cols-3 gap-1">
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
            )}
        </div>
    );
}
