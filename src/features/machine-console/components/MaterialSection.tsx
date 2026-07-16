import {
    Layers3,
    Settings2
} from "lucide-react";

import {
    listMaterials
} from "@/core/manufacturing/materials/registry";
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

export default function MaterialSection({
    onOpenSettings
}: {
    onOpenSettings: () => void;
}) {
    const selectedMaterialId =
        useManufacturingStore(
            (
                state
            ) =>
                state.selectedMaterialId
        );

    const setMaterial =
        useManufacturingStore(
            (
                state
            ) =>
                state.setMaterial
        );

    return (
        <section className="rounded-md bg-zinc-950 p-3 text-white shadow-[0_8px_24px_rgba(24,24,27,0.16)]">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-cyan-300">
                        <Layers3 size={15} />
                    </span>
                    <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase text-zinc-500">
                            Job preset
                        </div>
                        <div className="mt-0.5 truncate text-[13px] font-semibold text-white">
                            Material setup
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    aria-label="Configure material tools"
                    title="Configure material tools"
                    onClick={
                        onOpenSettings
                    }
                    className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-md
                        border
                        border-white/10
                        bg-white/10
                        text-zinc-300
                        transition
                        hover:bg-white/15
                        hover:text-white
                    "
                >
                    <Settings2 size={15} />
                </button>
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
                variant="dark"
            />

            <div className="mt-2.5 flex items-center justify-between gap-2 text-[9px] font-semibold uppercase text-zinc-500">
                <span className="flex items-center gap-1.5">
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${
                            selectedMaterialId
                                ? "bg-emerald-400"
                                : "bg-amber-400"
                        }`}
                    />
                    {selectedMaterialId
                        ? "Ready"
                        : "Required"}
                </span>
                <span>
                    Configure tools
                </span>
            </div>
        </section>
    );
}
