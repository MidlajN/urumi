import {
    FileSearch
} from "lucide-react";

import type {
    ManufacturingOperationSummary
} from "@/core/manufacturing/analysis/types";
import {
    getToolProfile
} from "@/core/manufacturing/tools/registry";
import {
    useManufacturingStore
} from "@/stores/manufacturing.store";
import OperationPreview from "./OperationPreview";

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
    const job =
        useManufacturingStore(
            (
                state
            ) =>
                state.job
        );

    const selectedToolId =
        job.operationSelections[
            summary.operationId
        ]?.toolId ??
        "";

    const selectedTool =
        selectedToolId
            ? getToolProfile(
                selectedToolId
            )
            : null;

    return (
        <article
            className="
                group
                relative
                overflow-hidden
                rounded-lg
                border
                border-zinc-200
                bg-white
                shadow-sm
                transition
                hover:border-zinc-300
                hover:shadow-md
            "
        >
            <div
                className="absolute inset-y-0 left-0 w-1"
                style={{
                    backgroundColor:
                        summary.operation.color
                }}
            />

            <div className="flex gap-3 p-3 pl-4">
                <OperationPreview
                    summary={
                        summary
                    }
                />

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                                Operation
                            </div>
                            <div className="flex min-w-0 items-center gap-2">
                                <h3 className="truncate text-[14px] font-semibold text-zinc-950">
                                    {summary.operation.label}
                                </h3>
                                <span
                                    className="
                                        shrink-0
                                        rounded-full
                                        bg-zinc-100
                                        px-2
                                        py-0.5
                                        text-[11px]
                                        font-semibold
                                        text-zinc-600
                                    "
                                >
                                    {summary.objectCount}
                                </span>
                            </div>

                            <div className="mt-1 text-[12px] font-medium text-zinc-500">
                                {summary.objectCount ===
                                1
                                    ? "object"
                                    : "objects"}
                            </div>
                        </div>

                        <button
                            type="button"
                            aria-label={`View ${summary.operation.label} objects`}
                            title="View objects"
                            onClick={(event) =>
                                onOpenObjects(
                                    summary.operationId,
                                    event.currentTarget.getBoundingClientRect()
                                )
                            }
                            className="
                                rounded-md
                                border
                                border-zinc-200
                                bg-white
                                p-1.5
                                text-zinc-500
                                shadow-sm
                                transition
                                hover:border-zinc-300
                                hover:bg-zinc-950
                                hover:text-white
                            "
                        >
                            <FileSearch size={16} />
                        </button>
                    </div>

                    <div className="mt-3 border-t border-zinc-100 pt-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                            Assigned Tool
                        </div>
                        <div className="mt-1 truncate text-[12px] font-semibold text-zinc-700">
                            {selectedTool
                                ? selectedTool.name
                                : "Configured in material settings"}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
