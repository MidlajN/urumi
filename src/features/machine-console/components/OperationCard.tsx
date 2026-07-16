import {
    FileSearch,
    Wrench
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
                rounded-md
                border
                border-zinc-200
                bg-white
                shadow-sm
                transition
                hover:border-zinc-300
                hover:shadow-[0_8px_24px_rgba(24,24,27,0.08)]
            "
        >
            <div
                className="absolute inset-x-0 top-0 h-0.5"
                style={{
                    backgroundColor:
                        summary.operation.color
                }}
            />

            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                    <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-zinc-50"
                        style={{
                            backgroundColor:
                                summary.operation.color
                        }}
                    />
                    <h3 className="truncate text-[13px] font-semibold text-zinc-950">
                        {summary.operation.label}
                    </h3>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                        {summary.objectCount}
                    </span>
                </div>

                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                </span>
            </div>

            <div className="flex gap-3 p-3">
                <OperationPreview
                    summary={
                        summary
                    }
                />

                <div className="min-w-0 flex-1">
                    <div className="flex h-full flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="text-[10px] font-bold uppercase text-zinc-400">
                                    Geometry
                                </div>
                                <div className="mt-1 text-[12px] font-semibold text-zinc-700">
                                    {summary.objectCount}
                                    {" "}
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
                                flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-md
                                border
                                border-zinc-200
                                bg-white
                                text-zinc-500
                                transition
                                hover:border-zinc-300
                                hover:bg-zinc-100
                                hover:text-zinc-950
                            "
                        >
                            <FileSearch size={16} />
                        </button>
                        </div>

                        <div className="mt-2 flex items-center gap-2 rounded-md bg-zinc-50 px-2.5 py-2">
                            <Wrench size={13} className="shrink-0 text-zinc-400" />
                            <div className="min-w-0">
                                <div className="text-[9px] font-bold uppercase text-zinc-400">
                                    Assigned tool
                                </div>
                                <div className="mt-0.5 truncate text-[11px] font-semibold text-zinc-700">
                            {selectedTool
                                ? selectedTool.name
                                : "Not configured"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
