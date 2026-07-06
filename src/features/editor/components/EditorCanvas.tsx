import {
    useState
} from "react";
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
import TopTransformToolbar from "./layout/TopTransformToolbar";

export default function EditorCanvas() {
    const {
        containerRef,
        canvasRef,
        canvas,
        toolRef
    } = useCanvas();

    const [
        preserveAspectRatio,
        setPreserveAspectRatio
    ] = useState(
        false
    );

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
            <TopTransformToolbar
                geometry={
                    geometry
                }
                preserveAspectRatio={
                    preserveAspectRatio
                }
                onPreserveAspectRatioChange={
                    setPreserveAspectRatio
                }
                onCommit={
                    updateGeometry
                }
            />
            <SelectionDimensionsOverlay
                geometry={geometry}
                measurementsEnabled={
                    dimensionsOverlayEnabled
                }
                selectionMode={selectionMode}
                preserveAspectRatio={
                    preserveAspectRatio &&
                    geometry?.mode === "bbox"
                }
                onCommit={updateGeometry}
            />
            <BottomNav />
        </div>
    );
}
