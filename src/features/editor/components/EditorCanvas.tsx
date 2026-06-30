import {
    useCanvas
} from "../canvas/CanvasProvider";
import {
    useEditorSetup
} from "../hooks/useEditorSetup";
import {
    useSelectionGeometry
} from "../hooks/useSelectionGeometry";
import {
    useEditorFabricEvents
} from "../hooks/useEditorFabricEvents";
import {
    useNodeEditLifecycle
} from "../hooks/useNodeEditLifecycle";
import {
    useEditorStore
} from "../store/editor.store";
import SelectionDimensionsOverlay from "./SelectionDimensionsOverlay";
import BottomNav from "./BottomNav";

export default function EditorCanvas() {
    const {
        containerRef,
        canvasRef,
        canvas,
        toolRef
    } = useCanvas();

    const dimensionsOverlayEnabled =
        useEditorStore(
            (
                state
            ) =>
                state.dimensionsOverlayEnabled
        );

    const selectionMode =
        useEditorStore(
            (
                state
            ) =>
                state.selectionMode
        );

    useEditorSetup({
        canvas,
        toolRef
    });

    useEditorFabricEvents(
        canvas
    );

    const {
        geometry,
        updateGeometry
    } = useSelectionGeometry(
        canvas,
        selectionMode
    );

    useNodeEditLifecycle({
        canvas,
        object:
            geometry?.object,
        selectionMode
    });

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full"
        >
            <canvas ref={canvasRef} />
            <SelectionDimensionsOverlay
                geometry={geometry}
                measurementsEnabled={
                    dimensionsOverlayEnabled
                }
                selectionMode={selectionMode}
                onCommit={updateGeometry}
            />
            <BottomNav />
        </div>
    );
}
