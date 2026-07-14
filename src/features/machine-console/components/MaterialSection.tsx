import {
    Settings
} from "lucide-react";

import {
    listMaterials
} from "@/core/manufacturing/materials/registry";
import {
    useManufacturingStore
} from "@/stores/manufacturing.store";

const materials =
    listMaterials().filter(
        (
            material
        ) => material.enabled
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
        <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                        Material Preset
                    </div>
                    <div className="mt-0.5 text-[12px] font-medium text-zinc-500">
                        Tools are configured once per material.
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
                        rounded-md
                        border
                        border-zinc-200
                        bg-zinc-950
                        p-2
                        text-white
                        shadow-sm
                        transition
                        hover:bg-zinc-800
                    "
                >
                    <Settings size={16} />
                </button>
            </div>

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
                    h-10
                    w-full
                    rounded-md
                    border
                    border-zinc-200
                    bg-zinc-50
                    px-3
                    text-[14px]
                    font-medium
                    text-zinc-900
                    outline-none
                    transition
                    focus:border-zinc-400
                    focus:bg-white
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
        </section>
    );
}
