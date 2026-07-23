import { Eye, EyeOff } from "lucide-react";
import type { FabricObject } from "fabric";
import { ActiveSelection } from "fabric";

import { useCanvas } from "../../../canvas/CanvasProvider";
import { useEditorStore } from "../../../store/editor.store";
import { ensureManufacturingMetadata } from "@/core/manufacturing/metadata/objectMetadata";
import { useManufacturingSummary } from "@/features/machine-console/hooks/useManufacturingSummary";
import { PanelSection } from "./shared";

/**
 * Compact per-operation layer list (cut-list style, as in xTool
 * Studio / LightBurn): color chip, label, count, per-layer visibility.
 * Clicking a row selects every visible object of that operation.
 */
export default function OperationObjectsSection() {
    const { canvas } = useCanvas();

    const { summary } = useManufacturingSummary();

    const { setTool, exitNodeEditMode } = useEditorStore();

    const selectOperationObjects = (objects: FabricObject[]) => {
        const visibleObjects = objects.filter(
            (object) => object.visible !== false
        );

        if (!canvas || visibleObjects.length === 0) return;

        exitNodeEditMode();
        setTool("select");

        canvas.discardActiveObject();

        if (visibleObjects.length === 1) {
            canvas.setActiveObject(visibleObjects[0]);
        } else {
            canvas.setActiveObject(
                new ActiveSelection(visibleObjects, { canvas })
            );
        }

        canvas.requestRenderAll();
    };

    const toggleOperationVisibility = (objects: FabricObject[]) => {
        if (!canvas) return;

        // Hide while anything is visible; show all once fully hidden.
        const anyVisible = objects.some(
            (object) => object.visible !== false
        );

        objects.forEach((object) => {
            object.set({ visible: !anyVisible });

            // Hidden objects must not reach the machine.
            ensureManufacturingMetadata(object).enabled =
                !anyVisible;
        });

        canvas.fire("object:modified");
        canvas.requestRenderAll();
    };

    if (summary.operations.length === 0) {
        return (
            <PanelSection title="Objects">
                <div className="rounded-md bg-zinc-50 px-3 py-3 text-[12px] font-medium text-zinc-500">
                    No objects on the canvas yet.
                </div>
            </PanelSection>
        );
    }

    return (
        <PanelSection
            title="Objects"
            meta={`${summary.totalObjectCount} ${
                summary.totalObjectCount === 1
                    ? "object"
                    : "objects"
            }`}
        >
            <div className="divide-y divide-zinc-100 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
                {summary.operations.map((item) => {
                    const hiddenCount = item.objects.filter(
                        (object) => object.visible === false
                    ).length;

                    const allHidden =
                        hiddenCount === item.objectCount;

                    return (
                        <div
                            key={item.operationId}
                            title={
                                allHidden
                                    ? undefined
                                    : `Select all ${item.operation.label} objects`
                            }
                            onClick={() =>
                                selectOperationObjects(
                                    item.objects
                                )
                            }
                            className={`
                                group
                                flex
                                h-10
                                items-center
                                gap-2.5
                                px-3
                                transition
                                ${
                                    allHidden
                                        ? ""
                                        : "cursor-pointer hover:bg-zinc-50"
                                }
                            `}
                        >
                            <span
                                className={`h-3.5 w-3.5 shrink-0 rounded-[4px] border border-black/10 transition ${
                                    allHidden ? "opacity-30" : ""
                                }`}
                                style={{
                                    backgroundColor:
                                        item.operation.color
                                }}
                            />

                            <span
                                className={`min-w-0 flex-1 truncate text-[13px] font-semibold transition ${
                                    allHidden
                                        ? "text-zinc-400"
                                        : "text-zinc-900"
                                }`}
                            >
                                {item.operation.label}
                            </span>

                            {hiddenCount > 0 && !allHidden && (
                                <span className="shrink-0 text-[10px] font-medium text-zinc-400">
                                    {hiddenCount} hidden
                                </span>
                            )}

                            <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold transition ${
                                    allHidden
                                        ? "bg-zinc-50 text-zinc-400"
                                        : "bg-zinc-100 text-zinc-600"
                                }`}
                            >
                                {item.objectCount}
                            </span>

                            <button
                                type="button"
                                aria-label={
                                    allHidden
                                        ? `Show ${item.operation.label} objects`
                                        : `Hide ${item.operation.label} objects`
                                }
                                title={
                                    allHidden
                                        ? "Show objects"
                                        : "Hide objects"
                                }
                                onClick={(event) => {
                                    event.stopPropagation();
                                    toggleOperationVisibility(
                                        item.objects
                                    );
                                }}
                                className={`
                                    flex
                                    h-6
                                    w-6
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded
                                    transition
                                    hover:bg-zinc-100
                                    ${
                                        allHidden
                                            ? "text-zinc-400 hover:text-zinc-600"
                                            : "text-zinc-300 hover:text-zinc-600 group-hover:text-zinc-400"
                                    }
                                `}
                            >
                                {allHidden ? (
                                    <EyeOff size={14} />
                                ) : (
                                    <Eye size={14} />
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </PanelSection>
    );
}
