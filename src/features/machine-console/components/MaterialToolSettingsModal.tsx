import {
    Check,
    Gauge,
    Layers3,
    X,
    Wrench
} from "lucide-react";
import {
    useEffect,
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
import AnimatedSelect from "./AnimatedSelect";

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

const materialOptions =
    materials.map(
        (
            material
        ) => ({
            value:
                material.id,
            label:
                material.name,
            description:
                `${material.thickness} mm material`
        })
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

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown =
            (
                event: KeyboardEvent
            ) => {
                if (
                    event.key ===
                    "Escape"
                ) {
                    if (
                        document.querySelector(
                            "[data-machine-select-menu]"
                        )
                    ) {
                        return;
                    }

                    onClose();
                }
            };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [
        onClose,
        open
    ]);

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
                        bg-zinc-950/45
                        backdrop-blur-[2px]
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
                            max-w-[780px]
                            overflow-hidden
                            rounded-md
                            border
                            border-zinc-300
                            bg-[#f6f7f8]
                            shadow-2xl
                            shadow-zinc-950/25
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
                        <header className="flex items-start justify-between gap-4 bg-zinc-950 px-5 py-4 text-white">
                            <div className="flex min-w-0 items-start gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-cyan-300">
                                    <Wrench size={17} />
                                </span>
                                <div className="min-w-0">
                                <div className="text-[10px] font-bold uppercase text-zinc-400">
                                    Manufacturing setup
                                </div>
                                <h2 className="mt-1 text-[17px] font-semibold text-white">
                                    Material and tools
                                </h2>
                                </div>
                            </div>

                            <button
                                type="button"
                                aria-label="Close material settings"
                                onClick={
                                    onClose
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-white/10 hover:text-white"
                            >
                                <X size={17} />
                            </button>
                        </header>

                        <div className="max-h-[68vh] overflow-y-auto p-5">
                            <section className="rounded-md border border-zinc-200 bg-white p-3 shadow-sm">
                                <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-zinc-500">
                                    <Layers3 size={13} />
                                    Material preset
                                </div>
                                <AnimatedSelect
                                    ariaLabel="Material preset"
                                    value={
                                        selectedMaterialId ??
                                        ""
                                    }
                                    options={
                                        materialOptions
                                    }
                                    placeholder="Select material"
                                    onChange={
                                        setMaterial
                                    }
                                />
                            </section>

                            <div className="mb-2 mt-5 flex items-center justify-between">
                                <div>
                                    <div className="text-[11px] font-bold uppercase text-zinc-500">
                                        Operation tools
                                    </div>
                                    <div className="mt-0.5 text-[10px] font-medium text-zinc-400">
                                        {operations.length} available operations
                                    </div>
                                </div>
                                <Gauge size={16} className="text-zinc-400" />
                            </div>

                            <div className="space-y-2.5">
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

                                        const toolOptions =
                                            toolConfigurations.map(
                                                (
                                                    configuration
                                                ) => {
                                                    const tool =
                                                        getToolProfile(
                                                            configuration.toolId
                                                        );

                                                    return {
                                                        value:
                                                            configuration.toolId,
                                                        label:
                                                            tool?.name ??
                                                            configuration.toolId
                                                    };
                                                }
                                            );

                                        return (
                                            <section
                                                key={
                                                    operation.id
                                                }
                                                className="
                                                    overflow-hidden
                                                    rounded-md
                                                    border
                                                    border-zinc-200
                                                    bg-white
                                                    shadow-sm
                                                "
                                            >
                                                <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-3 py-2.5">
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <span
                                                            className="h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-zinc-50"
                                                            style={{
                                                                backgroundColor:
                                                                    operation.color
                                                            }}
                                                        />
                                                        <div className="truncate text-[13px] font-semibold text-zinc-950">
                                                            {operation.label}
                                                        </div>
                                                    </div>

                                                    {selectedConfiguration
                                                        ?.isDefault && (
                                                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase text-emerald-700">
                                                            <Check size={10} />
                                                            Default
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-[minmax(0,1.55fr)_repeat(3,minmax(0,0.7fr))] gap-2 p-3">
                                                    <div className="min-w-0">
                                                        <div className="mb-1.5 text-[8px] font-bold uppercase text-zinc-400">
                                                            Tool
                                                        </div>
                                                        <AnimatedSelect
                                                            ariaLabel={`${operation.label} tool assignment`}
                                                            value={
                                                                selectedToolId ||
                                                                selectedConfiguration?.toolId ||
                                                                ""
                                                            }
                                                            disabled={
                                                                !selectedMaterial ||
                                                                toolConfigurations.length ===
                                                                    0
                                                            }
                                                            onChange={(toolId) =>
                                                                selectTool(
                                                                    operation.id,
                                                                    toolId
                                                                )
                                                            }
                                                            options={
                                                                toolOptions
                                                            }
                                                            placeholder="No tool available"
                                                            compact
                                                        />
                                                    </div>
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

                        <footer className="flex items-center justify-between border-t border-zinc-200 bg-white px-5 py-3">
                            <div className="text-[10px] font-medium text-zinc-500">
                                Changes are applied to the active job.
                            </div>
                            <button
                                type="button"
                                onClick={
                                    onClose
                                }
                                className="flex h-9 items-center gap-2 rounded-md bg-zinc-950 px-4 text-[12px] font-semibold text-white transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                            >
                                <Check size={14} />
                                Done
                            </button>
                        </footer>
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
        <div className="rounded-md border border-zinc-100 bg-zinc-50 px-2 py-2">
            <div className="text-[8px] font-bold uppercase text-zinc-400">
                {label}
            </div>
            <div className="mt-0.5 truncate text-[11px] font-semibold text-zinc-700">
                {value}
            </div>
        </div>
    );
}
