import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState
} from "react";
import {
    createPortal
} from "react-dom";
import {
    AnimatePresence,
    motion
} from "framer-motion";
import {
    Check,
    ChevronDown
} from "lucide-react";

export type AnimatedSelectOption = {
    value: string;
    label: string;
    description?: string;
    color?: string;
};

type MenuPosition = {
    left: number;
    top: number;
    width: number;
    openAbove: boolean;
};

export default function AnimatedSelect({
    value,
    options,
    onChange,
    placeholder,
    ariaLabel,
    disabled = false,
    compact = false,
    variant = "light"
}: {
    value: string;
    options: AnimatedSelectOption[];
    onChange: (value: string) => void;
    placeholder: string;
    ariaLabel: string;
    disabled?: boolean;
    compact?: boolean;
    variant?: "light" | "dark";
}) {
    const listboxId =
        useId();

    const triggerRef =
        useRef<HTMLButtonElement | null>(
            null
        );

    const menuRef =
        useRef<HTMLDivElement | null>(
            null
        );

    const [
        open,
        setOpen
    ] = useState(
        false
    );

    const [
        position,
        setPosition
    ] = useState<MenuPosition | null>(
        null
    );

    const selectedOption =
        useMemo(
            () =>
                options.find(
                    (
                        option
                    ) =>
                        option.value ===
                        value
                ) ?? null,
            [
                options,
                value
            ]
        );

    const close =
        () => {
            setOpen(
                false
            );
            setPosition(
                null
            );
        };

    const toggle =
        () => {
            if (
                disabled
            ) {
                return;
            }

            if (
                open
            ) {
                close();
                return;
            }

            const trigger =
                triggerRef.current;

            if (
                !trigger
            ) {
                return;
            }

            const bounds =
                trigger.getBoundingClientRect();

            const menuHeight =
                Math.min(
                    options.length *
                        (compact
                            ? 38
                            : 48) +
                        8,
                    240
                );

            const roomBelow =
                window.innerHeight -
                bounds.bottom -
                12;

            const roomAbove =
                bounds.top -
                12;

            const openAbove =
                roomBelow <
                    Math.min(
                        menuHeight,
                        180
                    ) &&
                roomAbove >
                    roomBelow;

            setPosition({
                left:
                    bounds.left,
                top:
                    openAbove
                        ? Math.max(
                            8,
                            bounds.top -
                                menuHeight -
                                6
                        )
                        : bounds.bottom +
                            6,
                width:
                    bounds.width,
                openAbove
            });
            setOpen(
                true
            );
        };

    useEffect(() => {
        if (
            !open
        ) {
            return;
        }

        const handlePointerDown =
            (
                event: PointerEvent
            ) => {
                const target =
                    event.target as Node;

                if (
                    triggerRef.current?.contains(
                        target
                    ) ||
                    menuRef.current?.contains(
                        target
                    )
                ) {
                    return;
                }

                close();
            };

        const handleKeyDown =
            (
                event: KeyboardEvent
            ) => {
                if (
                    event.key ===
                    "Escape"
                ) {
                    close();
                    triggerRef.current?.focus();
                }
            };

        window.addEventListener(
            "pointerdown",
            handlePointerDown
        );
        window.addEventListener(
            "keydown",
            handleKeyDown
        );
        window.addEventListener(
            "resize",
            close
        );
        window.addEventListener(
            "scroll",
            close,
            true
        );

        return () => {
            window.removeEventListener(
                "pointerdown",
                handlePointerDown
            );
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
            window.removeEventListener(
                "resize",
                close
            );
            window.removeEventListener(
                "scroll",
                close,
                true
            );
        };
    }, [
        open
    ]);

    const dark =
        variant ===
        "dark";

    return (
        <>
            <button
                ref={
                    triggerRef
                }
                type="button"
                aria-label={
                    ariaLabel
                }
                aria-haspopup="listbox"
                aria-expanded={
                    open
                }
                aria-controls={
                    listboxId
                }
                disabled={
                    disabled
                }
                onClick={
                    toggle
                }
                className={`
                    flex
                    w-full
                    items-center
                    gap-2
                    rounded-md
                    border
                    px-3
                    text-left
                    outline-none
                    transition
                    focus:ring-2
                    focus:ring-cyan-500/30
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    ${
                        compact
                            ? "h-9"
                            : "h-11"
                    }
                    ${
                        dark
                            ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
                            : "border-zinc-200 bg-zinc-50 text-zinc-900 hover:border-zinc-300 hover:bg-white"
                    }
                `}
            >
                {selectedOption?.color && (
                    <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                            backgroundColor:
                                selectedOption.color
                        }}
                    />
                )}

                <span className="min-w-0 flex-1">
                    <span
                        className={`block truncate font-semibold ${
                            compact
                                ? "text-[11px]"
                                : "text-[13px]"
                        } ${
                            selectedOption
                                ? ""
                                : dark
                                    ? "text-zinc-400"
                                    : "text-zinc-500"
                        }`}
                    >
                        {selectedOption?.label ??
                            placeholder}
                    </span>
                    {!compact &&
                        selectedOption?.description && (
                            <span
                                className={`mt-0.5 block truncate text-[10px] font-medium ${
                                    dark
                                        ? "text-zinc-400"
                                        : "text-zinc-500"
                                }`}
                            >
                                {selectedOption.description}
                            </span>
                        )}
                </span>

                <ChevronDown
                    size={14}
                    className={`shrink-0 transition-transform ${
                        open
                            ? "rotate-180"
                            : ""
                    } ${
                        dark
                            ? "text-zinc-400"
                            : "text-zinc-500"
                    }`}
                />
            </button>

            {createPortal(
                <AnimatePresence>
                    {open &&
                        position && (
                            <motion.div
                                ref={
                                    menuRef
                                }
                                id={
                                    listboxId
                                }
                                role="listbox"
                                data-machine-select-menu="true"
                                aria-label={
                                    ariaLabel
                                }
                                initial={{
                                    opacity:
                                        0,
                                    y:
                                        position.openAbove
                                            ? 5
                                            : -5,
                                    scale:
                                        0.98
                                }}
                                animate={{
                                    opacity:
                                        1,
                                    y:
                                        0,
                                    scale:
                                        1
                                }}
                                exit={{
                                    opacity:
                                        0,
                                    y:
                                        position.openAbove
                                            ? 4
                                            : -4,
                                    scale:
                                        0.98
                                }}
                                transition={{
                                    duration:
                                        0.14,
                                    ease:
                                        "easeOut"
                                }}
                                onPointerDown={(event) =>
                                    event.stopPropagation()
                                }
                                style={{
                                    left:
                                        position.left,
                                    top:
                                        position.top,
                                    width:
                                        position.width
                                }}
                                className="fixed z-[80] max-h-60 overflow-y-auto rounded-md border border-zinc-200 bg-white p-1 shadow-xl shadow-zinc-950/15"
                            >
                                {options.map(
                                    (
                                        option
                                    ) => {
                                        const selected =
                                            option.value ===
                                            value;

                                        return (
                                            <button
                                                key={
                                                    option.value
                                                }
                                                type="button"
                                                role="option"
                                                aria-selected={
                                                    selected
                                                }
                                                onClick={() => {
                                                    onChange(
                                                        option.value
                                                    );
                                                    close();
                                                    triggerRef.current?.focus();
                                                }}
                                                className={`flex w-full items-center gap-2 rounded-[5px] px-2.5 text-left transition ${
                                                    compact
                                                        ? "min-h-9"
                                                        : "min-h-11"
                                                } ${
                                                    selected
                                                        ? "bg-zinc-950 text-white"
                                                        : "text-zinc-800 hover:bg-zinc-100"
                                                }`}
                                            >
                                                {option.color && (
                                                    <span
                                                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                option.color
                                                        }}
                                                    />
                                                )}
                                                <span className="min-w-0 flex-1">
                                                    <span className={`block truncate font-semibold ${
                                                        compact
                                                            ? "text-[11px]"
                                                            : "text-[12px]"
                                                    }`}>
                                                        {option.label}
                                                    </span>
                                                    {!compact &&
                                                        option.description && (
                                                            <span className={`mt-0.5 block truncate text-[10px] font-medium ${
                                                                selected
                                                                    ? "text-zinc-400"
                                                                    : "text-zinc-500"
                                                            }`}>
                                                                {option.description}
                                                            </span>
                                                        )}
                                                </span>
                                                {selected && (
                                                    <Check
                                                        size={13}
                                                        className="shrink-0 text-cyan-300"
                                                    />
                                                )}
                                            </button>
                                        );
                                    }
                                )}
                            </motion.div>
                        )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
