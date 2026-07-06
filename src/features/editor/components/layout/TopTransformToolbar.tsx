import {
    AlignCenterHorizontal,
    AlignCenterVertical,
    AlignEndHorizontal,
    AlignEndVertical,
    AlignStartHorizontal,
    AlignStartVertical,
    ChevronDown,
    Link,
    Unlink,
    type LucideIcon
} from "lucide-react";
import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    useCanvas
} from "../../canvas/CanvasProvider";
import {
    formatMeasurement,
    parseMeasurement,
    type SelectionGeometry,
    type SelectionGeometryPatch
} from "../../hooks/useSelectionGeometry";
import type {
    ObjectAlignment
} from "../../canvas/engine/modules/EditorActions";

type AlignmentItem = {
    id: ObjectAlignment;
    label: string;
    icon: LucideIcon;
};

const alignmentItems: AlignmentItem[] = [
    {
        id: "left",
        label: "Align Left",
        icon: AlignStartVertical
    },
    {
        id: "horizontal-center",
        label: "Align Horizontal Center",
        icon: AlignCenterVertical
    },
    {
        id: "right",
        label: "Align Right",
        icon: AlignEndVertical
    },
    {
        id: "top",
        label: "Align Top",
        icon: AlignStartHorizontal
    },
    {
        id: "vertical-center",
        label: "Align Vertical Center",
        icon: AlignCenterHorizontal
    },
    {
        id: "bottom",
        label: "Align Bottom",
        icon: AlignEndHorizontal
    }
];

function TransformField({
    label,
    value,
    unit,
    minValue,
    disabled,
    onCommit
}: {
    label: string;
    value: number;
    unit: "mm" | "deg";
    minValue?: number;
    disabled?: boolean;
    onCommit: (
        value: number
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
                parsed === null ||
                (
                    minValue !== undefined &&
                    parsed < minValue
                )
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
        <label className="flex h-8 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2">
            <span className="text-[11px] font-semibold uppercase text-zinc-400">
                {label}
            </span>
            <input
                disabled={
                    disabled
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
                        event.key === "Enter"
                    ) {
                        event.preventDefault();
                        commit(
                            event.currentTarget.value
                        );
                        event.currentTarget.blur();
                    }

                    if (
                        event.key === "Escape"
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
                    h-full
                    w-14
                    bg-transparent
                    text-right
                    text-[12px]
                    font-medium
                    tabular-nums
                    text-zinc-800
                    outline-none
                    disabled:text-zinc-300
                "
            />
            <span className="text-[11px] font-semibold text-zinc-400">
                {unit}
            </span>
        </label>
    );
}

function IconButton({
    label,
    icon: Icon,
    active,
    disabled,
    onClick
}: {
    label: string;
    icon: LucideIcon;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-label={
                label
            }
            title={
                label
            }
            disabled={
                disabled
            }
            onClick={
                onClick
            }
            className={`
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-md
                border
                border-zinc-200
                ${active
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-700 hover:bg-zinc-100"
                }
                disabled:pointer-events-none
                disabled:text-zinc-300
            `}
        >
            <Icon
                size={15}
                strokeWidth={2}
            />
        </button>
    );
}

function AlignmentDropdown({
    disabled,
    onAlign
}: {
    disabled?: boolean;
    onAlign: (
        alignment: ObjectAlignment
    ) => void;
}) {
    const [
        open,
        setOpen
    ] = useState(
        false
    );

    const menuRef =
        useRef<HTMLDivElement | null>(
            null
        );

    useEffect(() => {
        if (
            !open
        ) {
            return;
        }

        const closeOnOutsideClick =
            (
                event: MouseEvent
            ) => {
                if (
                    menuRef.current &&
                    !menuRef.current.contains(
                        event.target as Node
                    )
                ) {
                    setOpen(
                        false
                    );
                }
            };

        document.addEventListener(
            "mousedown",
            closeOnOutsideClick
        );

        return () =>
            document.removeEventListener(
                "mousedown",
                closeOnOutsideClick
            );
    }, [
        open
    ]);

    return (
        <div
            ref={
                menuRef
            }
            className="relative"
        >
            <button
                type="button"
                aria-label="Object alignment"
                title="Object alignment"
                disabled={
                    disabled
                }
                onClick={() =>
                    setOpen(
                        (
                            current
                        ) =>
                            !current
                    )
                }
                className="
                    flex
                    h-8
                    items-center
                    gap-1.5
                    rounded-md
                    border
                    border-zinc-200
                    bg-white
                    px-2
                    text-[12px]
                    font-medium
                    text-zinc-700
                    hover:bg-zinc-100
                    disabled:pointer-events-none
                    disabled:text-zinc-300
                "
            >
                <AlignCenterHorizontal
                    size={15}
                    strokeWidth={2}
                />
                Align
                <ChevronDown
                    size={13}
                    strokeWidth={2}
                />
            </button>

            {open && (
                <div
                    className="
                        absolute
                        right-0
                        top-10
                        z-50
                        w-56
                        rounded-lg
                        border
                        border-zinc-200
                        bg-white
                        p-1
                        shadow-xl
                    "
                >
                    {alignmentItems.map(
                        (
                            item
                        ) => {
                            const Icon =
                                item.icon;

                            return (
                                <button
                                    key={
                                        item.id
                                    }
                                    type="button"
                                    onClick={() => {
                                        onAlign(
                                            item.id
                                        );
                                        setOpen(
                                            false
                                        );
                                    }}
                                    className="
                                        flex
                                        h-9
                                        w-full
                                        items-center
                                        gap-3
                                        rounded-md
                                        px-2
                                        text-left
                                        text-[13px]
                                        font-medium
                                        text-zinc-800
                                        hover:bg-zinc-100
                                    "
                                >
                                    <Icon
                                        size={15}
                                        strokeWidth={2}
                                        className="text-zinc-500"
                                    />
                                    {item.label}
                                </button>
                            );
                        }
                    )}
                </div>
            )}
        </div>
    );
}

export default function TopTransformToolbar({
    geometry,
    preserveAspectRatio,
    onPreserveAspectRatioChange,
    onCommit
}: {
    geometry: SelectionGeometry | null;
    preserveAspectRatio: boolean;
    onPreserveAspectRatioChange: (
        locked: boolean
    ) => void;
    onCommit: (
        patch: SelectionGeometryPatch
    ) => void;
}) {
    const {
        workspace
    } = useCanvas();

    if (
        !geometry
    ) {
        return null;
    }

    const fieldsDisabled =
        geometry.locked ||
        geometry.mode !== "bbox";

    const actionsDisabled =
        geometry.mode !== "bbox";

    const canPreserveAspectRatio =
        Boolean(
            geometry.mode === "bbox"
        );

    const activePreserveAspectRatio =
        preserveAspectRatio &&
        canPreserveAspectRatio;

    const aspectRatio =
        canPreserveAspectRatio &&
        geometry.height > 0
            ? geometry.width /
                geometry.height
            : null;

    const commit =
        (
            patch: SelectionGeometryPatch
        ) => {
            if (
                !geometry
            ) {
                return;
            }

            onCommit(
                patch
            );
        };

    const commitWidth =
        (
            width: number
        ) => {
            commit(
                activePreserveAspectRatio &&
                aspectRatio
                    ? {
                        width,
                        height:
                            width / aspectRatio
                    }
                    : {
                        width
                    }
            );
        };

    const commitHeight =
        (
            height: number
        ) => {
            commit(
                activePreserveAspectRatio &&
                aspectRatio
                    ? {
                        height,
                        width:
                            height * aspectRatio
                    }
                    : {
                        height
                    }
            );
        };

    const align =
        (
            alignment: ObjectAlignment
        ) => {
            workspace?.alignObjects(
                alignment
            );
        };

    return (
        <div
            className="
                pointer-events-auto
                absolute
                left-1/2
                top-8
                z-40
                flex
                -translate-x-1/2
                items-center
                gap-2
                rounded-lg
                border
                border-zinc-200
                bg-white/95
                px-2
                py-2
                shadow-lg
                backdrop-blur
            "
        >
            <div className="flex items-center gap-1">
                <TransformField
                    label="X"
                    value={
                        geometry?.x ??
                        0
                    }
                    unit="mm"
                    disabled={
                        fieldsDisabled
                    }
                    onCommit={(x) =>
                        commit({
                            x
                        })
                    }
                />
                <TransformField
                    label="Y"
                    value={
                        geometry?.y ??
                        0
                    }
                    unit="mm"
                    disabled={
                        fieldsDisabled
                    }
                    onCommit={(y) =>
                        commit({
                            y
                        })
                    }
                />
                <TransformField
                    label="W"
                    value={
                        geometry?.width ??
                        0
                    }
                    unit="mm"
                    minValue={1}
                    disabled={
                        fieldsDisabled
                    }
                    onCommit={
                        commitWidth
                    }
                />
                <IconButton
                    label={
                        activePreserveAspectRatio
                            ? "Unlock aspect ratio"
                            : "Lock aspect ratio"
                    }
                    icon={
                        activePreserveAspectRatio
                            ? Link
                            : Unlink
                    }
                    active={
                        activePreserveAspectRatio
                    }
                    disabled={
                        fieldsDisabled ||
                        !canPreserveAspectRatio ||
                        !aspectRatio
                    }
                    onClick={() =>
                        onPreserveAspectRatioChange(
                            !preserveAspectRatio
                        )
                    }
                />
                <TransformField
                    label="H"
                    value={
                        geometry?.height ??
                        0
                    }
                    unit="mm"
                    minValue={1}
                    disabled={
                        fieldsDisabled
                    }
                    onCommit={
                        commitHeight
                    }
                />
                <TransformField
                    label="R"
                    value={
                        geometry?.rotation ??
                        0
                    }
                    unit="deg"
                    disabled={
                        fieldsDisabled
                    }
                    onCommit={(rotation) =>
                        commit({
                            rotation
                        })
                    }
                />
            </div>

            <div className="h-6 w-px bg-zinc-200" />

            <AlignmentDropdown
                disabled={
                    actionsDisabled
                }
                onAlign={
                    align
                }
            />
        </div>
    );
}
