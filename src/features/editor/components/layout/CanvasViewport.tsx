import EditorCanvas from "../EditorCanvas";

export default function CanvasViewport() {

    return (
        <div
            className="
                flex-1
                relative
                overflow-hidden
            "
        >
            <EditorCanvas />
        </div>
    );
}