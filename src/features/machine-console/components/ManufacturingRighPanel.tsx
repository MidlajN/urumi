import { useWorkspaceStore } from "@/stores/workspace.store";

export default function ManufacturingRightPanel() {
    const { setMode } = useWorkspaceStore();
    

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

            <div className="p-6">

                <h2 className="text-lg font-semibold">

                    Manufacturing

                </h2>

                <p className="mt-2 text-sm text-zinc-500">

                    Manufacturing workspace.

                </p>


                <button

                    onClick={() =>
                    setMode(
                    "design"
                    )}

                >

                Design

                </button>

            </div>

        </aside>

    );

}