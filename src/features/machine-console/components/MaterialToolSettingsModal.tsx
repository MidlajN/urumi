import {
    X,
    Wrench
} from "lucide-react";
import {
    useMemo
} from "react";
import {
    createPortal
} from "react-dom";
import {
    AnimatePresence,
    motion
} from "framer-motion";

import {
    listMaterials,
    getMaterial
} from "@/core/manufacturing/materials/registry";
import {
    listOperations
} from "@/core/manufacturing/operations/registry";
import {
    getToolProfile
} from "@/core/manufacturing/tools/registry";
import {
    useManufacturingStore
} from "@/stores/manufacturing.store";

const materials =
    listMaterials().filter(
        (
            material
        ) => material.enabled
    );

const operations =
    listOperations().filter(
        (
            operation
        ) => operation.enabled
    );

export default function MaterialToolSettingsModal({
    open,
    onClose
}: {
    open: boolean;
    onClose: () => void;
}) {
    const job =
        useManufacturingStore(
            (
                state
            ) => state.job
        );

    const selectedMaterialId =
        useManufacturingStore(
            (
                state
            ) => state.selectedMaterialId
        );

    const setMaterial =
        useManufacturingStore(
            (
                state
            ) => state.setMaterial
        );

    const selectTool =
        useManufacturingStore(
            (
                state
            ) => state.selectTool
        );

    const selectedMaterial =
        useMemo(
            () =>
                selectedMaterialId
                    ? getMaterial(
                        selectedMaterialId
                    ) ?? null
                    : null,
            [
                selectedMaterialId
            ]
        );

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    className="
                        fixed
                        inset-0
                        z-50
                        flex
                        items-center
                        justify-center
                        bg-zinc-950/35
                        px-4
                    "
                    initial={{
                        opacity:
                            0
                    }}
                    animate={{
                        opacity:
                            1
                    }}
                    exit={{
                        opacity:
                            0
                    }}
                    onMouseDown={
                        onClose
                    }
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Material tool settings"
                        className="
                            w-full
                            max-w-[640px]
                            overflow-hidden
                            rounded-lg
                            border
                            border-zinc-800
                            bg-zinc-950
                            text-white
                            shadow-2xl
                            shadow-zinc-950/30
                        "
                        initial={{
                            opacity:
                                0,
                            y:
                                18,
                            scale:
                                0.98
                        }}
                        animate={{
                            opacity:
                                1,
                            y:
                                0,
                            scale:
                                1
                        }}
                        exit={{
                            opacity:
                                0,
                            y:
                                14,
                            scale:
                                0.98
                        }}
                        transition={{
                            duration:
                                0.18,
                            ease:
                                "easeOut"
                        }}
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <header className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
                            <div>
                                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                                    <Wrench size={13} />
                                    Material Setup
                                </div>
                                <h2 className="mt-1 text-lg font-semibold text-white">
                                    Preset and Operation Tools
                                </h2>
                                <p className="mt-1 text-[12px] font-medium text-zinc-400">
                                    Configure tools once here; operation cards stay focused on document objects.
                                </p>
                            </div>

                            <button
                                type="button"
                                aria-label="Close material settings"
                                onClick={
                                    onClose
                                }
                                className="rounded-md p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                            >
                                <X size={17} />
                            </button>
                        </header>

                        <div className="max-h-[72vh] overflow-y-auto p-5">
                            <label className="block">
                                <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                                    Material Preset
                                </span>
                                <select
                                    value={
                                        selectedMaterialId ??
                                        ""
                                    }
                                    onChange={(event) =>
                                        setMaterial(
                                            event.target.value
                                        )
                                    }
                                    className="
                                        mt-2
                                        h-10
                                        w-full
                                        rounded-md
                                        border
                                        border-zinc-700
                                        bg-zinc-900
                                        px-3
                                        text-[14px]
                                        font-medium
                                        text-white
                                        outline-none
                                        transition
                                        focus:border-zinc-500
                                    "
                                >
                                    <option value="" disabled>
                                        Select material
                                    </option>
                                    {materials.map(
                                        (
                                            material
                                        ) => (
                                            <option
                                                key={
                                                    material.id
                                                }
                                                value={
                                                    material.id
                                                }
                                            >
                                                {material.name}
                                                {" "}
                                                {material.thickness}
                                                mm
                                            </option>
                                        )
                                    )}
                                </select>
                            </label>

                            <div className="mt-5 space-y-3">
                                {operations.map(
                                    (
                                        operation
                                    ) => {
                                        const materialOperation =
                                            selectedMaterial?.operations[
                                                operation.id
                                            ];

                                        const toolConfigurations =
                                            materialOperation
                                                ?.toolConfigurations
                                                .filter(
                                                    (
                                                        configuration
                                                    ) =>
                                                        configuration.enabled
                                                ) ?? [];

                                        const selectedToolId =
                                            job.operationSelections[
                                                operation.id
                                            ]?.toolId ??
                                            "";

                                        const selectedConfiguration =
                                            toolConfigurations.find(
                                                (
                                                    configuration
                                                ) =>
                                                    configuration.toolId ===
                                                    selectedToolId
                                            ) ??
                                            toolConfigurations[0];

                                        return (
                                            <section
                                                key={
                                                    operation.id
                                                }
                                                className="
                                                    rounded-lg
                                                    border
                                                    border-zinc-800
                                                    bg-zinc-900
                                                    p-3
                                                "
                                            >
                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <span
                                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    operation.color
                                                            }}
                                                        />
                                                        <div className="truncate text-[14px] font-semibold text-white">
                                                            {operation.label}
                                                        </div>
                                                    </div>

                                                    {selectedConfiguration
                                                        ?.isDefault && (
                                                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>

                                                <select
                                                    value={
                                                        selectedToolId
                                                    }
                                                    disabled={
                                                        !selectedMaterial ||
                                                        toolConfigurations.length ===
                                                            0
                                                    }
                                                    onChange={(event) =>
                                                        selectTool(
                                                            operation.id,
                                                            event.target.value
                                                        )
                                                    }
                                                    className="
                                                        h-9
                                                        w-full
                                                        rounded-md
                                                        border
                                                        border-zinc-700
                                                        bg-zinc-950
                                                        px-2
                                                        text-[13px]
                                                        font-medium
                                                        text-white
                                                        outline-none
                                                        transition
                                                        disabled:bg-zinc-900
                                                        disabled:text-zinc-600
                                                        focus:border-zinc-500
                                                    "
                                                >
                                                    {toolConfigurations.length ===
                                                    0 && (
                                                        <option value="">
                                                            No tool for this material
                                                        </option>
                                                    )}
                                                    {toolConfigurations.map(
                                                        (
                                                            configuration
                                                        ) => {
                                                            const tool =
                                                                getToolProfile(
                                                                    configuration.toolId
                                                                );

                                                            return (
                                                                <option
                                                                    key={
                                                                        configuration.toolId
                                                                    }
                                                                    value={
                                                                        configuration.toolId
                                                                    }
                                                                >
                                                                    {tool?.name ??
                                                                        configuration.toolId}
                                                                </option>
                                                            );
                                                        }
                                                    )}
                                                </select>

                                                <div className="mt-3 grid grid-cols-3 gap-2">
                                                    <Metric
                                                        label="Velocity"
                                                        value={
                                                            selectedConfiguration
                                                                ? `${selectedConfiguration.velocity} mm/s`
                                                                : "-"
                                                        }
                                                    />
                                                    <Metric
                                                        label="Accel"
                                                        value={
                                                            selectedConfiguration
                                                                ? `${selectedConfiguration.acceleration} mm/s2`
                                                                : "-"
                                                        }
                                                    />
                                                    <Metric
                                                        label="Passes"
                                                        value={
                                                            selectedConfiguration
                                                                ? String(
                                                                    selectedConfiguration.passes
                                                                )
                                                                : "-"
                                                        }
                                                    />
                                                </div>
                                            </section>
                                        );
                                    }
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

function Metric({
    label,
    value
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-600">
                {label}
            </div>
            <div className="mt-0.5 truncate text-[12px] font-semibold text-zinc-300">
                {value}
            </div>
        </div>
    );
}
