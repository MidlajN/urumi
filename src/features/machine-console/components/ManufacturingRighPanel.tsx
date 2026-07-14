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

export default function ManufacturingRightPanel() {
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
        <aside
            className="
                flex
                h-screen
                w-[336px]
                shrink-0
                border-l
                border-zinc-200
                bg-white
            "
        >
            <div className="w-full p-6">
                <h2 className="text-lg font-semibold text-zinc-950">
                    Manufacturing
                </h2>

                <label className="mt-6 block">
                    <span className="text-[12px] font-semibold uppercase text-zinc-500">
                        Material
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
                            border-zinc-200
                            bg-white
                            px-3
                            text-[14px]
                            font-medium
                            text-zinc-900
                            outline-none
                            focus:border-zinc-400
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
            </div>
        </aside>
    );
}
