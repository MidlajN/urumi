import LeftToolbar from "./LeftToolbar";

import CanvasViewport from "./CanvasViewport";
import RightPanel from "./RightPanel";
import { useWorkspaceStore } from "@/stores/workspace.store";

export default function EditorShell() {

    const { mode } = useWorkspaceStore();

    const isManufacturing = mode === "manufacturing"

    return (
        <div
            className="
                h-screen
                w-screen
                bg-[#d6dbe1]
                flex
                overflow-hidden
            "
        >
            { !isManufacturing && <LeftToolbar /> }

            <CanvasViewport />

            <RightPanel />
        </div>
    );
}
