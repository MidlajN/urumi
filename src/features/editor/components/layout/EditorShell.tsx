import LeftToolbar from "./LeftToolbar";

import CanvasViewport from "./CanvasViewport";

export default function EditorShell() {

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
            <LeftToolbar />

            <CanvasViewport />
        </div>
    );
}