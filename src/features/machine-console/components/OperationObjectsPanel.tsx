import {
    MousePointer2,
    MoveRight,
    X
} from "lucide-react";
import type {
    FabricObject
} from "fabric";

import type {
    ManufacturingOperationSummary
} from "@/core/manufacturing/analysis/types";
import {
    listOperations
} from "@/core/manufacturing/operations/registry";

const operations =
    listOperations().filter(
        (
            operation
        ) => operation.enabled
    );

export default function OperationObjectsPanel({
    summary,
    onClose,
    onSelectObject,
    onMoveObjectToOperation
}: {
    summary: ManufacturingOperationSummary;
    onClose: () => void;
    onSelectObject: (
        object: FabricObject
    ) => void;
    onMoveObjectToOperation: (
        object: FabricObject,
        operationId: string
    ) => void;
}) {
    return (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <div className="relative border-b border-zinc-200 bg-zinc-950 px-3 py-3 text-white">
                <div
                    className="absolute inset-y-0 left-0 w-1"
                    style={{
                        backgroundColor:
                            summary.operation.color
                    }}
                />

                <div className="flex items-start justify-between gap-3 pl-2">
                    <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                            Object List
                        </div>
                        <div className="mt-0.5 truncate text-[14px] font-semibold text-white">
                            {summary.operation.label}
                        </div>
                        <div className="mt-1 text-[11px] font-medium text-zinc-400">
                            {summary.objectCount}
                            {" "}
                            {summary.objectCount ===
                            1
                                ? "object"
                                : "objects"}
                            {" "}
                            assigned
                        </div>
                    </div>

                    <button
                        type="button"
                        aria-label="Close object panel"
                        onClick={
                            onClose
                        }
                        className="rounded-md p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                    >
                        <X size={15} />
                    </button>
                </div>
            </div>

            <div className="max-h-72 overflow-y-auto bg-zinc-50 p-2">
                {summary.objects.map(
                    (
                        object,
                        index
                    ) => (
                        <div
                            key={`${object.id ?? object.name ?? object.type}:${index}`}
                            className="
                                mb-2
                                rounded-md
                                border
                                border-zinc-200
                                bg-white
                                p-2.5
                                shadow-sm
                                last:mb-0
                            "
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    onSelectObject(
                                        object
                                    )
                                }
                                className="flex w-full min-w-0 items-center gap-2 text-left"
                            >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-white">
                                    <MousePointer2
                                        size={14}
                                    />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-[13px] font-semibold text-zinc-800">
                                        {getObjectLabel(
                                            object,
                                            index
                                        )}
                                    </div>
                                    <div className="truncate text-[11px] font-medium text-zinc-400">
                                        {object.type ??
                                            "object"}
                                    </div>
                                </div>
                            </button>

                            <label className="mt-2.5 block border-t border-zinc-100 pt-2">
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                                    <MoveRight
                                        size={11}
                                    />
                                    Move Operation
                                </span>
                                <select
                                    value={
                                        object.manufacturing?.operationId ??
                                        summary.operationId
                                    }
                                    onChange={(event) =>
                                        onMoveObjectToOperation(
                                            object,
                                            event.target.value
                                        )
                                    }
                                    className="
                                        mt-1
                                        h-8
                                        w-full
                                        rounded-md
                                        border
                                        border-zinc-200
                                        bg-zinc-50
                                        px-2
                                        text-[12px]
                                        font-medium
                                        text-zinc-800
                                        outline-none
                                        transition
                                        focus:border-zinc-400
                                        focus:bg-white
                                    "
                                >
                                    {operations.map(
                                        (
                                            operation
                                        ) => (
                                            <option
                                                key={
                                                    operation.id
                                                }
                                                value={
                                                    operation.id
                                                }
                                            >
                                                {operation.label}
                                            </option>
                                        )
                                    )}
                                </select>
                            </label>
                        </div>
                    )
                )}
            </div>
        </section>
    );
}

function getObjectLabel(
    object: FabricObject,
    index: number
) {
    if (
        object.name &&
        object.name !== "geometry-path" &&
        object.name !== "added-path"
    ) {
        return object.name;
    }

    const type =
        object.type
            ? object.type.replace(
                /-/g,
                " "
            )
            : "object";

    return `${type.charAt(0).toUpperCase()}${type.slice(1)} ${index + 1}`;
}
