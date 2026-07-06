import {
    MoreHorizontal,
    Settings
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useState
} from "react";

import type { ReactNode } from "react";
import type { FabricObject } from "fabric";

import { useEditorStore } from "../../store/editor.store";
import { useCanvas } from "../../canvas/CanvasProvider";


const fontOptions = [
    "BobaMilky",
    "Arial",
    "Inter",
    "Helvetica"
];

type OperationObject =
    FabricObject & {
        getObjects?: () => FabricObject[];
    };

function getOperationTargets(
    object: FabricObject | null | undefined
): FabricObject[] {
    if (!object) {
        return [];
    }

    const maybeCollection =
        object as OperationObject;

    if (
        typeof maybeCollection.getObjects ===
        "function"
    ) {
        return maybeCollection
            .getObjects()
            .flatMap(
                getOperationTargets
            );
    }

    return [
        object
    ];
}

function isTextObject(
    object: FabricObject
) {
    return [
        "i-text",
        "text",
        "textbox"
    ].includes(
        object.type
    );
}

function getObjectOperationColor(
    object: FabricObject
) {
    const value =
        isTextObject(
            object
        )
            ? object.get(
                "fill"
            )
            : object.get(
                "stroke"
            );

    return typeof value ===
        "string"
        ? value
        : null;
}

function applyOperationColor(
    object: FabricObject,
    color: string
) {
    object.set(
        isTextObject(
            object
        )
            ? {
                fill:
                    color
            }
            : {
                stroke:
                    color
            }
    );

    object.setCoords();
}

function PanelSection({
    title,
    children
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="border-b border-zinc-200 px-5 py-4">
            <h3 className="mb-3 text-[13px] font-semibold text-zinc-500">
                {title}
            </h3>
            {children}
        </section>
    );
}

function OperationSwatches() {
    const {
        canvas
    } = useCanvas();

    const {
        operationColors,
        strokeColor,
        setStrokeColor
    } = useEditorStore();

    const [
        selectedColors,
        setSelectedColors
    ] = useState<string[]>(
        []
    );

    useEffect(() => {
        if (!canvas) {
            setSelectedColors(
                []
            );
            return;
        }

        const syncSelection =
            () => {
                const colors =
                    getOperationTargets(
                        canvas.getActiveObject()
                    )
                        .map(
                            getObjectOperationColor
                        )
                        .filter(
                            (
                                color
                            ): color is string =>
                                Boolean(
                                    color
                                )
                        )
                        .map(
                            (
                                color
                            ) =>
                                color.toLowerCase()
                        );

                setSelectedColors(
                    Array.from(
                        new Set(
                            colors
                        )
                    )
                );
            };

        syncSelection();

        canvas.on(
            "selection:created",
            syncSelection
        );
        canvas.on(
            "selection:updated",
            syncSelection
        );
        canvas.on(
            "selection:cleared",
            syncSelection
        );
        canvas.on(
            "object:modified",
            syncSelection
        );

        return () => {
            canvas.off(
                "selection:created",
                syncSelection
            );
            canvas.off(
                "selection:updated",
                syncSelection
            );
            canvas.off(
                "selection:cleared",
                syncSelection
            );
            canvas.off(
                "object:modified",
                syncSelection
            );
        };
    }, [
        canvas
    ]);

    const selectedOperationColor =
        useMemo(
            () =>
                selectedColors.length ===
                1
                    ? selectedColors[0]
                    : null,
            [
                selectedColors
            ]
        );

    const selectedOperationLabel =
        useMemo(() => {
            if (
                selectedColors.length ===
                0
            ) {
                return "Default for new objects";
            }

            if (
                selectedColors.length >
                1
            ) {
                return "Mixed selection";
            }

            return (
                operationColors.find(
                    (
                        item
                    ) =>
                        item.color.toLowerCase() ===
                        selectedColors[0]
                )?.label ??
                "Custom operation"
            );
        }, [
            selectedColors,
            operationColors
        ]);

    const applyOperation =
        (
            color: string
        ) => {
            setStrokeColor(
                color
            );

            if (!canvas) {
                return;
            }

            const activeObject =
                canvas.getActiveObject();

            const targets =
                getOperationTargets(
                    activeObject
                );

            if (
                targets.length ===
                0
            ) {
                return;
            }

            targets.forEach(
                (
                    object
                ) =>
                    applyOperationColor(
                        object,
                        color
                    )
            );

            if (
                activeObject
            ) {
                activeObject.setCoords();
                canvas.fire(
                    "object:modified",
                    {
                        target:
                            activeObject
                    }
                );
            }

            canvas.requestRenderAll();
            setSelectedColors([
                color.toLowerCase()
            ]);
        };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 text-[12px] font-semibold text-zinc-600">
                <span>Selected operation</span>
                <span className="text-zinc-900">
                    {selectedOperationLabel}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {operationColors.map((item) => {
                    const activeColor =
                        selectedOperationColor ??
                        strokeColor.toLowerCase();

                    const active =
                        activeColor ===
                        item.color.toLowerCase();

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                                applyOperation(
                                    item.color
                                )
                            }
                            className={`
                                flex
                                h-9
                                items-center
                                gap-2
                                rounded-md
                                border
                                px-2
                                text-[13px]
                                font-medium
                                ${
                                    active
                                        ? "border-zinc-900 bg-zinc-100 text-zinc-950"
                                        : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                                }
                            `}
                        >
                            <span
                                className="h-4 w-4 rounded-full border border-black/10"
                                style={{
                                    backgroundColor:
                                        item.color
                                }}
                            />
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function SelectControls() {
    return null;
}

function ShapeControls() {
    const {
        selectedShape
    } = useEditorStore();

    return (
        <>
            <PanelSection title="Shape">
                <div className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 text-[13px] font-medium text-zinc-800">
                    <span>Current shape</span>
                    <span className="capitalize">
                        {selectedShape}
                    </span>
                </div>
            </PanelSection>

        </>
    );
}

function TextControls() {
    const {
        fontFamily,
        fontSize,
        setFontFamily,
        setFontSize
    } = useEditorStore();

    return (
        <PanelSection title="Text">
            <div className="space-y-3">
                <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-zinc-500">
                        Font
                    </span>
                    <select
                        value={fontFamily}
                        onChange={(event) =>
                            setFontFamily(
                                event.target.value
                            )
                        }
                        className="
                            h-9
                            w-full
                            rounded-md
                            border
                            border-zinc-200
                            bg-white
                            px-2
                            text-[13px]
                            font-medium
                            text-zinc-800
                            outline-none
                        "
                    >
                        {fontOptions.map((font) => (
                            <option
                                key={font}
                                value={font}
                            >
                                {font}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-zinc-500">
                        Font size
                    </span>
                    <input
                        type="number"
                        min={8}
                        max={160}
                        step={1}
                        value={fontSize}
                        onChange={(event) =>
                            setFontSize(
                                Number(
                                    event.target.value
                                )
                            )
                        }
                        className="
                            h-9
                            w-full
                            rounded-md
                            border
                            border-zinc-200
                            px-2
                            text-[13px]
                            font-medium
                            text-zinc-800
                            outline-none
                        "
                    />
                </label>
            </div>
        </PanelSection>
    );
}

function ToolSpecificControls() {
    const {
        activeTool
    } = useEditorStore();

    if (
        activeTool ===
        "select"
    ) {
        return <SelectControls />;
    }

    if (
        activeTool ===
        "shape"
    ) {
        return <ShapeControls />;
    }

    if (
        activeTool ===
        "text"
    ) {
        return <TextControls />;
    }

    return (
        <PanelSection title="Tool">
            <div className="rounded-md bg-zinc-50 px-3 py-2 text-[13px] font-medium capitalize text-zinc-700">
                {activeTool}
            </div>
        </PanelSection>
    );
}

export default function RightPanel() {
    return (
        <aside
            className="
                flex
                h-screen
                w-[336px]
                shrink-0
                flex-col
                border-l
                border-zinc-200
                bg-white
            "
        >
            <header className="flex h-[78px] items-center justify-between border-b border-zinc-200 px-5">
                <div className="flex min-w-0 items-center gap-3">
                    <div
                        className="
                            h-[31px]
                            w-[52px]
                            rounded-sm
                            border
                            border-zinc-200
                        "
                        style={{
                            background:
                                "linear-gradient(180deg, #59644e 0%, #171a18 52%, #7b8a70 53%, #495142 100%)"
                        }}
                    />

                    <div className="min-w-0">
                        <div className="truncate text-[15px] font-semibold text-zinc-900">
                            S1 40w
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-zinc-400">
                            <span className="h-3 w-3 rounded-full bg-zinc-300" />
                            Not connected
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-zinc-900">
                    <Settings size={18} />
                    <MoreHorizontal size={21} />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                <PanelSection title="Operation color">
                    <OperationSwatches />
                </PanelSection>

                <ToolSpecificControls />
            </div>
        </aside>
    );
}
