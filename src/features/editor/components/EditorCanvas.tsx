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
    useCanvasInteractionPolicy
} from "../hooks/useCanvasInteractionPolicy";
import {
    useEditorStore
} from "../store/editor.store";
import SelectionDimensionsOverlay from "./SelectionDimensionsOverlay";
import BottomNav from "./BottomNav";
import TopTransformToolbar from "./layout/TopTransformToolbar";
import ReferenceControls from "../../companion/components/ReferenceControls";
import CompanionQrModal from "../../companion/components/CompanionQrModal";
import { useWorkspaceStore } from "@/stores/workspace.store";

export default function EditorCanvas() {
    const {
        containerRef,
        canvasRef,
        canvas,
        toolRef,
        companion
    } = useCanvas();

    const { mode } = useWorkspaceStore();

    const showEditorUi = mode === 'design'

    const isManufacturing =
        mode === "manufacturing";

    const [
        preserveAspectRatio,
        setPreserveAspectRatio
    ] = useState(
        false
    );

    const [
        companionModalOpen,
        setCompanionModalOpen
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

    useCanvasInteractionPolicy(
        canvas,
        mode
    );

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
                    dimensionsOverlayEnabled ||
                    isManufacturing
                }
                selectionMode={
                    isManufacturing
                        ? "select"
                        : selectionMode
                }
                preserveAspectRatio={
                    !isManufacturing &&
                    preserveAspectRatio &&
                    geometry?.mode === "bbox"
                }
                readOnly={
                    isManufacturing
                }
                onCommit={
                    isManufacturing
                        ? () => {}
                        : updateGeometry
                }
            />
            <ReferenceControls
                manager={
                    companion
                }
                onReplace={() => {
                    setCompanionModalOpen(
                        true
                    );
                    void companion?.createReferenceSession();
                }}
            />
            <CompanionQrModal
                manager={
                    companion
                }
                open={
                    companionModalOpen
                }
                onClose={() => {
                    companion?.closeReferenceSession();
                    setCompanionModalOpen(
                        false
                    );
                }}
            />

            { showEditorUi && 
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
            }
            
            <BottomNav />
            
        </div>
    );
}
