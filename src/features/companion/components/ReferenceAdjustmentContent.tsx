import {
    Check,
    RotateCcw
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import type {
    CompanionManager
} from "../CompanionManager";
import type {
    CompanionReferenceImageMessage
} from "../types";
import {
    applyReferenceImageAdjustments,
    defaultReferenceCorners,
    type ReferencePerspectiveCorners
} from "../referenceImageProcessing";

type CornerKey =
    keyof ReferencePerspectiveCorners;

const cornerKeys: CornerKey[] = [
    "topLeft",
    "topRight",
    "bottomRight",
    "bottomLeft"
];

const cornerLabels: Record<
    CornerKey,
    string
> = {
    topLeft:
        "Top left",
    topRight:
        "Top right",
    bottomRight:
        "Bottom right",
    bottomLeft:
        "Bottom left"
};

export default function ReferenceAdjustmentContent({
    manager,
    onClose,
    cancelLabel = "Cancel",
    applyLabel = "Apply"
}: {
    manager: CompanionManager | null;
    onClose: () => void;
    cancelLabel?: string;
    applyLabel?: string;
}) {
    const imageRef =
        useRef<HTMLImageElement | null>(
            null
        );

    const [
        source,
        setSource
    ] = useState<CompanionReferenceImageMessage | null>(
        null
    );

    const [
        previewUrl,
        setPreviewUrl
    ] = useState(
        ""
    );

    const [
        corners,
        setCorners
    ] = useState<ReferencePerspectiveCorners>(
        defaultReferenceCorners
    );

    const [
        activeCorner,
        setActiveCorner
    ] = useState<CornerKey | null>(
        null
    );

    const [
        applying,
        setApplying
    ] = useState(
        false
    );

    const [
        error,
        setError
    ] = useState<string | null>(
        null
    );

    useEffect(() => {
        if (
            !manager
        ) {
            return;
        }

        setSource(
            manager.getReferenceSource()
        );
        setCorners(
            defaultReferenceCorners
        );
        setError(
            null
        );
    }, [
        manager
    ]);

    useEffect(() => {
        if (
            !source
        ) {
            setPreviewUrl(
                ""
            );
            return;
        }

        const blob =
            new Blob(
                [
                    source.data
                ],
                {
                    type:
                        source.mime
                }
            );
        const url =
            URL.createObjectURL(
                blob
            );

        setPreviewUrl(
            url
        );

        return () => {
            URL.revokeObjectURL(
                url
            );
        };
    }, [
        source
    ]);

    useEffect(() => {
        if (
            !activeCorner
        ) {
            return;
        }

        const handleMove = (
            event: PointerEvent
        ) => {
            updateCornerFromPointer(
                activeCorner,
                event.clientX,
                event.clientY
            );
        };

        const handleUp = () => {
            setActiveCorner(
                null
            );
        };

        window.addEventListener(
            "pointermove",
            handleMove
        );
        window.addEventListener(
            "pointerup",
            handleUp
        );

        return () => {
            window.removeEventListener(
                "pointermove",
                handleMove
            );
            window.removeEventListener(
                "pointerup",
                handleUp
            );
        };
    }, [
        activeCorner
    ]);

    const cornerPolygon =
        useMemo(
            () =>
                cornerKeys
                    .map(
                        (
                            key
                        ) =>
                            `${corners[key].x * 100},${corners[key].y * 100}`
                    )
                    .join(
                        " "
                    ),
            [
                corners
            ]
        );

    function updateCornerFromPointer(
        key: CornerKey,
        clientX: number,
        clientY: number
    ) {
        const image =
            imageRef.current;

        if (
            !image
        ) {
            return;
        }

        const rect =
            image.getBoundingClientRect();

        setCorners(
            (
                previous
            ) => ({
                ...previous,
                [key]: {
                    x:
                        clamp(
                            (clientX -
                                rect.left) /
                                rect.width,
                            0,
                            1
                        ),
                    y:
                        clamp(
                            (clientY -
                                rect.top) /
                                rect.height,
                            0,
                            1
                        )
                }
            })
        );
    }

    async function applyAdjustments() {
        if (
            !source ||
            !manager
        ) {
            return;
        }

        setApplying(
            true
        );
        setError(
            null
        );

        try {
            const adjusted =
                await applyReferenceImageAdjustments(
                    source,
                    {
                        corners,
                        rotation:
                            0,
                        flipHorizontal:
                            false,
                        flipVertical:
                            false
                    }
                );

            await manager.replaceReferenceSource(
                adjusted
            );
            onClose();
        } catch (adjustmentError) {
            setError(
                adjustmentError instanceof Error
                    ? adjustmentError.message
                    : "Unable to correct reference image"
            );
        } finally {
            setApplying(
                false
            );
        }
    }

    return (
        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1fr_220px]">
            <div className="min-h-0 overflow-auto bg-zinc-100 p-4">
                {previewUrl ? (
                    <div className="flex min-h-[320px] items-center justify-center">
                        <div className="relative inline-block max-h-[68vh] max-w-full select-none">
                            <img
                                ref={
                                    imageRef
                                }
                                src={
                                    previewUrl
                                }
                                alt="Reference"
                                draggable={false}
                                className="block max-h-[68vh] max-w-full rounded-md border border-zinc-300 bg-white object-contain"
                            />
                            <svg
                                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                            >
                                <polygon
                                    points={
                                        cornerPolygon
                                    }
                                    fill="rgba(20, 184, 166, 0.16)"
                                    stroke="rgb(20, 184, 166)"
                                    strokeWidth="0.7"
                                />
                            </svg>
                            {cornerKeys.map(
                                (
                                    key
                                ) => (
                                    <button
                                        key={
                                            key
                                        }
                                        type="button"
                                        aria-label={
                                            cornerLabels[
                                                key
                                            ]
                                        }
                                        onPointerDown={(event) => {
                                            event.preventDefault();
                                            setActiveCorner(
                                                key
                                            );
                                            updateCornerFromPointer(
                                                key,
                                                event.clientX,
                                                event.clientY
                                            );
                                        }}
                                        className="
                                            absolute
                                            h-5
                                            w-5
                                            -translate-x-1/2
                                            -translate-y-1/2
                                            rounded-full
                                            border-2
                                            border-white
                                            bg-teal-500
                                            shadow
                                            ring-1
                                            ring-teal-700/30
                                        "
                                        style={{
                                            left:
                                                `${corners[key].x * 100}%`,
                                            top:
                                                `${corners[key].y * 100}%`
                                        }}
                                    />
                                )
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white text-[13px] font-medium text-zinc-500">
                        No reference image available
                    </div>
                )}
            </div>

            <div className="border-t border-zinc-200 p-4 lg:border-l lg:border-t-0">
                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={() =>
                            setCorners(
                                defaultReferenceCorners
                            )
                        }
                        className="
                            flex
                            h-9
                            w-full
                            items-center
                            justify-center
                            gap-2
                            rounded-md
                            border
                            border-zinc-200
                            text-[13px]
                            font-semibold
                            text-zinc-700
                            hover:bg-zinc-50
                        "
                    >
                        <RotateCcw size={14} />
                        Reset Corners
                    </button>
                </div>

                {error && (
                    <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600">
                        {error}
                    </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        className="
                            h-9
                            rounded-md
                            border
                            border-zinc-200
                            text-[13px]
                            font-semibold
                            text-zinc-700
                            hover:bg-zinc-50
                        "
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        disabled={
                            !source ||
                            applying
                        }
                        onClick={() => {
                            void applyAdjustments();
                        }}
                        className="
                            flex
                            h-9
                            items-center
                            justify-center
                            gap-2
                            rounded-md
                            bg-zinc-950
                            text-[13px]
                            font-semibold
                            text-white
                            hover:bg-zinc-800
                            disabled:cursor-not-allowed
                            disabled:bg-zinc-300
                        "
                    >
                        <Check size={14} />
                        {applying
                            ? "Applying"
                            : applyLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

function clamp(
    value: number,
    min: number,
    max: number
) {
    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
}
