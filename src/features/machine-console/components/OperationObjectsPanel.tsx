import {
    Boxes,
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
import AnimatedSelect from "./AnimatedSelect";
import ObjectPreview from "./ObjectPreview";

const operations =
    listOperations().filter(
        (
            operation
        ) => operation.enabled
    );

const operationOptions =
    operations.map(
        (
            operation
        ) => ({
            value:
                operation.id,
            label:
                operation.label,
            color:
                operation.color
        })
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
        <section className="overflow-hidden rounded-md border border-zinc-200 bg-white">
            <div className="relative border-b border-zinc-200 bg-white px-4 py-3.5">
                <div
                    className="absolute inset-y-0 left-0 w-0.5"
                    style={{
                        backgroundColor:
                            summary.operation.color
                    }}
                />

                <div className="flex items-start justify-between gap-3 pl-1">
                    <div className="flex min-w-0 items-start gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600">
                            <Boxes size={15} />
                        </span>
                        <div className="min-w-0">
                        <div className="text-[9px] font-bold uppercase text-zinc-400">
                            Operation objects
                        </div>
                        <div className="mt-0.5 truncate text-[14px] font-semibold text-zinc-950">
                            {summary.operation.label}
                        </div>
                        <div className="mt-1 text-[10px] font-medium text-zinc-500">
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
                    </div>

                    <button
                        type="button"
                        aria-label="Close object panel"
                        onClick={
                            onClose
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950"
                    >
                        <X size={15} />
                    </button>
                </div>
            </div>

            <div className="max-h-80 overflow-y-auto bg-white">
                {summary.objects.map(
                    (
                        object,
                        index
                    ) => (
                        <div
                            key={`${object.id ?? object.name ?? object.type}:${index}`}
                            className="
                                group
                                relative
                                bg-white
                                px-3
                                py-2.5
                                border-b
                                border-zinc-100
                                transition
                                duration-150
                                hover:bg-zinc-50
                                focus-within:bg-zinc-50
                                last:border-b-0
                            "
                        >
                            <span
                                className="absolute inset-y-2 left-0 w-0.5 rounded-r-full opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
                                style={{
                                    backgroundColor:
                                        summary.operation.color
                                }}
                            />

                            <div className="flex min-w-0 items-center gap-2">
                                <button
                                    type="button"
                                    aria-label={`Select ${getObjectLabel(
                                        object,
                                        index
                                    )} on canvas`}
                                    onClick={() =>
                                        onSelectObject(
                                            object
                                        )
                                    }
                                    className="flex min-w-0 flex-1 items-center gap-2 rounded-[5px] text-left outline-none focus:ring-2 focus:ring-cyan-100"
                                >
                                    <ObjectPreview
                                        object={
                                            object
                                        }
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[12px] font-semibold text-zinc-900">
                                            {getObjectLabel(
                                                object,
                                                index
                                            )}
                                        </span>
                                        <span className="mt-0.5 block truncate text-[9px] font-bold uppercase text-zinc-400">
                                            {object.type ??
                                                "object"}
                                        </span>
                                    </span>
                                </button>

                                <div className="w-[132px] shrink-0">
                                <AnimatedSelect
                                    ariaLabel={`Move ${getObjectLabel(
                                        object,
                                        index
                                    )} to operation`}
                                    value={
                                        object.manufacturing?.operationId ??
                                        summary.operationId
                                    }
                                    onChange={(operationId) =>
                                        onMoveObjectToOperation(
                                            object,
                                            operationId
                                        )
                                    }
                                    options={
                                        operationOptions
                                    }
                                    placeholder="Select operation"
                                    compact
                                />
                                </div>
                            </div>
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
