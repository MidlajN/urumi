import { ChevronRight, Settings2 } from "lucide-react";

import { listMaterials } from "@/core/manufacturing/materials/registry";
import { useManufacturingStore } from "@/stores/manufacturing.store";
import AnimatedSelect from "./AnimatedSelect";

const materials = listMaterials().filter(
    (material) => material.enabled
);

const materialOptions = materials.map((material) => ({
    value: material.id,
    label: material.name,
    description: `${material.thickness} mm material`
}));

export default function MaterialSection({
    onOpenSettings
}: {
    onOpenSettings: () => void;
}) {
    const selectedMaterialId = useManufacturingStore(
        (state) => state.selectedMaterialId
    );

    const setMaterial = useManufacturingStore(
        (state) => state.setMaterial
    );

    return (
        <section>
            <div className="mb-2.5 flex items-center justify-between">
                <div>
                    <div className="text-[11px] font-bold uppercase text-zinc-500">
                        Material
                    </div>
                    <div className="mt-0.5 text-[10px] font-medium text-zinc-400">
                        Job preset for this document
                    </div>
                </div>
                <span
                    className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${
                        selectedMaterialId
                            ? "text-emerald-600"
                            : "text-amber-600"
                    }`}
                >
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${
                            selectedMaterialId
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                        }`}
                    />
                    {selectedMaterialId ? "Ready" : "Required"}
                </span>
            </div>

            <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
                <div className="p-2">
                    <AnimatedSelect
                        ariaLabel="Material preset"
                        value={selectedMaterialId ?? ""}
                        options={materialOptions}
                        placeholder="Select material"
                        onChange={setMaterial}
                    />
                </div>

                <button
                    type="button"
                    onClick={onOpenSettings}
                    className="group flex w-full items-center gap-2.5 border-t border-zinc-100 px-3 py-2.5 text-left transition hover:bg-zinc-50"
                >
                    <Settings2
                        size={14}
                        className="shrink-0 text-zinc-400"
                    />
                    <span className="flex-1 text-[12px] font-semibold text-zinc-700">
                        Configure tools
                    </span>
                    <ChevronRight
                        size={14}
                        className="shrink-0 text-zinc-300 transition group-hover:text-zinc-500"
                    />
                </button>
            </div>
        </section>
    );
}
