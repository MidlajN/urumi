import { ChevronRight, Wrench } from "lucide-react";

import type {
    ManufacturingOperationSummary
} from "@/core/manufacturing/analysis/types";
import { getToolProfile } from "@/core/manufacturing/tools/registry";
import { useManufacturingStore } from "@/stores/manufacturing.store";

/**
 * Compact cut-list row for one document operation: color chip, label,
 * object count and the assigned tool. Clicking opens the objects panel.
 */
export default function OperationCard({
    summary,
    onOpenObjects
}: {
    summary: ManufacturingOperationSummary;
    onOpenObjects: (
        operationId: string,
        anchorRect: DOMRect
    ) => void;
}) {
    const job = useManufacturingStore((state) => state.job);

    const selectedToolId =
        job.operationSelections[summary.operationId]?.toolId ?? "";

    const selectedTool = selectedToolId
        ? getToolProfile(selectedToolId)
        : null;

    return (
        <button
            type="button"
            title={`View ${summary.operation.label} objects`}
            onClick={(event) =>
                onOpenObjects(
                    summary.operationId,
                    event.currentTarget.getBoundingClientRect()
                )
            }
            className="group flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-zinc-50"
        >
            <span
                className="h-3.5 w-3.5 shrink-0 rounded-[4px] border border-black/10"
                style={{
                    backgroundColor: summary.operation.color
                }}
            />

            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-semibold text-zinc-900">
                        {summary.operation.label}
                    </span>
                    <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                        {summary.objectCount}
                    </span>
                </span>

                <span className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium">
                    <Wrench
                        size={11}
                        className="shrink-0 text-zinc-400"
                    />
                    {selectedTool ? (
                        <span className="truncate text-zinc-500">
                            {selectedTool.name}
                        </span>
                    ) : (
                        <span className="truncate text-amber-600">
                            No tool assigned
                        </span>
                    )}
                </span>
            </span>

            <ChevronRight
                size={14}
                className="shrink-0 text-zinc-300 transition group-hover:text-zinc-500"
            />
        </button>
    );
}
