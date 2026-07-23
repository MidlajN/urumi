import {
    ChevronDown,
    Circle,
    CircleCheck,
    Copy,
    EyeOff,
    FlipHorizontal2,
    FlipVertical2,
    Lock,
    LockOpen,
    Pentagon,
    RotateCcw,
    Spline,
    Square,
    Trash2,
    Triangle,
    Type
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import type { FabricObject } from "fabric";
import { ActiveSelection, Path } from "fabric";

import { useCanvas } from "../../../canvas/CanvasProvider";
import { useEditorStore } from "../../../store/editor.store";
import { ensureManufacturingMetadata } from "@/core/manufacturing/metadata/objectMetadata";
import { buildScenePathData } from "@/core/manufacturing/exporters/svg/serializeObject";
import { attachGeometryToImportedPath } from "../../../canvas/engine/Workspace";
import {
    getPathGeometry,
    setPathGeometry
} from "../../../geometry/pathModel";
import {
    isObjectInteractionLocked,
    setObjectInteractionLocked
} from "../../../utils/objectLocking";
import {
    PanelSection,
    applyOperationColor,
    getObjectOperationColor,
    isTextObject
} from "./shared";

const TYPE_LABELS: Record<string, string> = {
    rect: "Rectangle",
    circle: "Circle",
    ellipse: "Ellipse",
    triangle: "Triangle",
    polygon: "Polygon",
    polyline: "Polyline",
    line: "Line",
    path: "Path",
    "i-text": "Text",
    text: "Text",
    textbox: "Text"
};

const TYPE_ICONS: Record<string, LucideIcon> = {
    rect: Square,
    circle: Circle,
    ellipse: Circle,
    triangle: Triangle,
    polygon: Pentagon,
    polyline: Spline,
    line: Spline,
    path: Spline,
    "i-text": Type,
    text: Type,
    textbox: Type
};

/**
 * Custom props that must survive clone() — fabric drops unknown keys.
 * manufacturing/pathGeometry are intentionally absent: fabric copies
 * custom props by reference (mutating the clone would mutate the
 * source), so duplicateSelection deep-copies them explicitly.
 */
const CLONE_PROPS = ["name", "id", "isFreeDraw"];

/** Scene-unit nudge applied to duplicates so they don't stack invisibly. */
const DUPLICATE_OFFSET = 24;

function canConvertToPath(object: FabricObject) {
    const type = object.type.toLowerCase();

    if (type === "path") {
        return !getPathGeometry(object);
    }

    return Boolean(TYPE_ICONS[type] && !isTextObject(object));
}

function ActionTile({
    icon: Icon,
    label,
    onClick,
    danger = false,
    active = false,
    disabled = false
}: {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    danger?: boolean;
    active?: boolean;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`
                flex
                flex-col
                items-center
                justify-center
                gap-1.5
                rounded-md
                border
                px-2
                py-3
                text-center
                transition
                ${
                    danger
                        ? "border-zinc-200 text-red-600 hover:border-red-200 hover:bg-red-50"
                        : active
                            ? "border-zinc-900 bg-zinc-100 text-zinc-950"
                            : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }
                ${
                    disabled
                        ? "cursor-not-allowed opacity-40 hover:bg-transparent"
                        : ""
                }
            `}
        >
            <Icon size={16} />
            <span className="text-[11px] font-semibold leading-tight">
                {label}
            </span>
        </button>
    );
}

function SelectionOperationList({
    targets
}: {
    targets: FabricObject[];
}) {
    const { canvas } = useCanvas();

    const { operationColors } = useEditorStore();

    const colors = new Set(
        targets
            .map(getObjectOperationColor)
            .filter((color): color is string => Boolean(color))
            .map((color) => color.toLowerCase())
    );

    const currentColor =
        colors.size === 1 ? Array.from(colors)[0] : null;

    const applyToSelection = (
        color: string,
        operationId: string
    ) => {
        if (!canvas) return;

        targets.forEach((object) => {
            applyOperationColor(object, color);

            const metadata = ensureManufacturingMetadata(object);

            metadata.operationId = operationId;
            metadata.enabled = true;
        });

        canvas.fire("object:modified");
        canvas.requestRenderAll();
    };

    return (
        <div className="space-y-2">
            {operationColors.map((item) => {
                const selected =
                    currentColor === item.color.toLowerCase();

                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                            applyToSelection(item.color, item.id)
                        }
                        className={`
                            flex
                            w-full
                            items-center
                            justify-between
                            rounded-md
                            border
                            px-3
                            py-2.5
                            transition
                            ${
                                selected
                                    ? "border-sky-500 bg-sky-50/50"
                                    : "border-zinc-200 hover:bg-zinc-50"
                            }
                        `}
                    >
                        <span className="flex items-center gap-2.5 text-[13px] font-semibold text-zinc-900">
                            <span
                                className="h-4 w-4 rounded-full border border-black/10"
                                style={{
                                    backgroundColor: item.color
                                }}
                            />
                            {item.label}
                        </span>

                        {selected && (
                            <CircleCheck
                                size={18}
                                className="text-sky-500"
                            />
                        )}
                    </button>
                );
            })}

            <p className="pt-1 text-[11px] font-medium leading-relaxed text-zinc-400">
                Operation determines how this object will be
                processed during manufacturing.
            </p>
        </div>
    );
}

/** Contextual panel shown while objects are selected. */
export default function SelectionPanel({
    targets
}: {
    targets: FabricObject[];
}) {
    const { canvas, workspace } = useCanvas();

    const [collapsed, setCollapsed] = useState(false);

    const single = targets.length === 1;

    const type = single ? targets[0].type.toLowerCase() : null;

    const title = single
        ? TYPE_LABELS[type ?? ""] ?? "Object"
        : "Multiple objects";

    const HeaderIcon = single
        ? TYPE_ICONS[type ?? ""] ?? Square
        : Copy;

    const allInteractionLocked = targets.every(
        isObjectInteractionLocked
    );

    const allPositionLocked = targets.every(
        (object) => object.lockMovementX && object.lockMovementY
    );

    const allRotationLocked = targets.every(
        (object) => object.lockRotation
    );

    const anyConvertible = targets.some(canConvertToPath);

    const notifyModified = () => {
        canvas?.fire("object:modified");
        canvas?.requestRenderAll();
    };

    const duplicateSelection = async () => {
        if (!canvas) return;

        const sources = [...targets];

        // Discard first so ActiveSelection members regain absolute coords.
        canvas.discardActiveObject();

        workspace?.beginHistoryTransaction();

        const clones: FabricObject[] = [];

        for (const source of sources) {
            const clone = await source.clone(CLONE_PROPS);

            clone.set({
                left: (clone.left ?? 0) + DUPLICATE_OFFSET,
                top: (clone.top ?? 0) + DUPLICATE_OFFSET
            });

            clone.setCoords();

            clone.manufacturing = {
                ...ensureManufacturingMetadata(source)
            };

            if (clone instanceof Path) {
                const geometry = getPathGeometry(source);

                if (geometry) {
                    setPathGeometry(clone, geometry);
                } else {
                    attachGeometryToImportedPath(clone);
                }
            }

            canvas.add(clone);
            clones.push(clone);
        }

        workspace?.endHistoryTransaction();

        if (clones.length === 1) {
            canvas.setActiveObject(clones[0]);
        } else if (clones.length > 1) {
            canvas.setActiveObject(
                new ActiveSelection(clones, { canvas })
            );
        }

        canvas.requestRenderAll();
    };

    const deleteSelection = () => {
        workspace?.deleteSelection();
    };

    const toggleInteractionLock = () => {
        const next = !allInteractionLocked;

        targets.forEach((object) =>
            setObjectInteractionLocked(object, next)
        );

        notifyModified();
    };

    const mirror = (axis: "x" | "y") => {
        targets.forEach((object) => {
            object.set(
                axis === "x"
                    ? { flipX: !object.flipX }
                    : { flipY: !object.flipY }
            );
            object.setCoords();
        });

        notifyModified();
    };

    const convertToPath = () => {
        if (!canvas) return;

        const convertible = targets.filter(canConvertToPath);

        if (convertible.length === 0) return;

        canvas.discardActiveObject();

        workspace?.beginHistoryTransaction();

        const replacements: FabricObject[] = [];

        convertible.forEach((object) => {
            // Raw fabric paths just need geometry attached in place.
            if (object.type.toLowerCase() === "path") {
                attachGeometryToImportedPath(object);
                replacements.push(object);
                return;
            }

            const d = buildScenePathData(object);

            if (!d) return;

            const path = new Path(d, {
                name: "geometry-path",
                fill: "transparent",
                stroke:
                    typeof object.stroke === "string" &&
                    object.stroke
                        ? object.stroke
                        : "#111827",
                strokeWidth: object.strokeWidth ?? 2
            });

            const metadata = ensureManufacturingMetadata(path);

            const previous = object.manufacturing;

            if (previous) {
                metadata.operationId = previous.operationId;
                metadata.enabled = previous.enabled;
            }

            attachGeometryToImportedPath(path);

            canvas.remove(object);
            canvas.add(path);
            replacements.push(path);
        });

        workspace?.endHistoryTransaction();

        if (replacements.length === 1) {
            canvas.setActiveObject(replacements[0]);
        } else if (replacements.length > 1) {
            canvas.setActiveObject(
                new ActiveSelection(replacements, { canvas })
            );
        }

        canvas.requestRenderAll();
    };

    const togglePositionLock = () => {
        const next = !allPositionLocked;

        targets.forEach((object) => {
            object.set({
                lockMovementX: next,
                lockMovementY: next
            });
        });

        notifyModified();
    };

    const toggleRotationLock = () => {
        const next = !allRotationLocked;

        targets.forEach((object) => {
            object.set({ lockRotation: next });
        });

        notifyModified();
    };

    const hideSelection = () => {
        if (!canvas) return;

        targets.forEach((object) => {
            object.set({ visible: false });

            // Hidden objects must not reach the machine.
            ensureManufacturingMetadata(object).enabled = false;
        });

        canvas.discardActiveObject();
        notifyModified();
    };

    return (
        <>
            <div className="flex items-center gap-3 border-b border-zinc-200/80 bg-white px-4 py-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-700">
                    <HeaderIcon size={20} />
                </span>

                <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold text-zinc-950">
                        {title}
                    </div>
                    <div className="text-[12px] font-medium text-zinc-500">
                        {targets.length}
                        {" "}
                        {targets.length === 1 ? "object" : "objects"}
                        {" "}
                        selected
                    </div>
                </div>

                <button
                    type="button"
                    aria-label={
                        collapsed
                            ? "Expand object panel"
                            : "Collapse object panel"
                    }
                    onClick={() => setCollapsed((value) => !value)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50"
                >
                    <ChevronDown
                        size={16}
                        className={`transition-transform ${
                            collapsed ? "-rotate-90" : ""
                        }`}
                    />
                </button>
            </div>

            {!collapsed && (
                <>
                    <PanelSection title="Actions">
                        <div className="grid grid-cols-3 gap-2">
                            <ActionTile
                                icon={Copy}
                                label="Duplicate"
                                onClick={duplicateSelection}
                            />
                            <ActionTile
                                icon={Trash2}
                                label="Delete"
                                danger
                                onClick={deleteSelection}
                            />
                            <ActionTile
                                icon={
                                    allInteractionLocked
                                        ? LockOpen
                                        : Lock
                                }
                                label={
                                    allInteractionLocked
                                        ? "Unlock"
                                        : "Lock"
                                }
                                active={allInteractionLocked}
                                onClick={toggleInteractionLock}
                            />
                            <ActionTile
                                icon={FlipHorizontal2}
                                label="Mirror H"
                                onClick={() => mirror("x")}
                            />
                            <ActionTile
                                icon={FlipVertical2}
                                label="Mirror V"
                                onClick={() => mirror("y")}
                            />
                            <ActionTile
                                icon={Spline}
                                label="Convert to Path"
                                disabled={!anyConvertible}
                                onClick={convertToPath}
                            />
                        </div>
                    </PanelSection>

                    <PanelSection title="Constraints">
                        <div className="grid grid-cols-3 gap-2">
                            <ActionTile
                                icon={Lock}
                                label="Lock Position"
                                active={allPositionLocked}
                                onClick={togglePositionLock}
                            />
                            <ActionTile
                                icon={RotateCcw}
                                label="Lock Rotation"
                                active={allRotationLocked}
                                onClick={toggleRotationLock}
                            />
                            <ActionTile
                                icon={EyeOff}
                                label="Hide"
                                onClick={hideSelection}
                            />
                        </div>
                    </PanelSection>

                    <PanelSection title="Operation">
                        <SelectionOperationList targets={targets} />
                    </PanelSection>
                </>
            )}
        </>
    );
}
