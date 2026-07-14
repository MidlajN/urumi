import { useWorkspaceStore, } from "@/stores/workspace.store";

import EditorRightPanel from "./EditorRightPanel";
import ManufacturingRightPanel from "@/features/machine-console/components/ManufacturingRighPanel";


export default function RightPanel() {

    const mode =
        useWorkspaceStore(
            state =>
                state.mode
        );

    return mode === "design"

        ? <EditorRightPanel />

        : <ManufacturingRightPanel />;

}