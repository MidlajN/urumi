import { ArrowRight, Factory } from "lucide-react";
import { useEffect, useState } from "react";
import type { FabricObject } from "fabric";

import { useCanvas } from "../../canvas/CanvasProvider";
import { useWorkspaceStore } from "@/stores/workspace.store";
import {
    markObjectsOffBed,
    validateBedPlacement
} from "../../utils/bedValidation";
import BedValidationModal from "../BedValidationModal";
import { PanelSection, getOperationTargets } from "./right-panel/shared";
import OperationSwatches from "./right-panel/OperationSwatches";
import OperationObjectsSection from "./right-panel/OperationObjectsSection";
import SelectionPanel from "./right-panel/SelectionPanel";
import ToolSpecificControls from "./right-panel/ToolControls";

/** Live list of the currently selected leaf objects. */
function useActiveSelectionTargets() {
    const { canvas } = useCanvas();

    const [targets, setTargets] = useState<FabricObject[]>([]);

    useEffect(() => {
        if (!canvas) {
            setTargets([]);
            return;
        }

        const sync = () => {
            setTargets(
                getOperationTargets(canvas.getActiveObject())
            );
        };

        sync();

        const events = [
            "selection:created",
            "selection:updated",
            "selection:cleared",
            "object:modified",
            "object:removed"
        ] as const;

        events.forEach((event) => canvas.on(event, sync));

        return () => {
            events.forEach((event) => canvas.off(event, sync));
        };
    }, [canvas]);

    return targets;
}

export default function EditorRightPanel() {
    const { setMode } = useWorkspaceStore();

    const { canvas, workspace } = useCanvas();

    const targets = useActiveSelectionTargets();

    const [
        partialObjects,
        setPartialObjects
    ] = useState<FabricObject[] | null>(null);

    const proceedToManufacturing = () => {
        if (canvas && workspace) {
            const result = validateBedPlacement(
                canvas,
                workspace.getWorkspace()
            );

            if (result.partial.length > 0) {
                setPartialObjects(result.partial);
                return;
            }
        }

        setMode("manufacturing");
    };

    const ignorePartialObjects = () => {
        if (partialObjects) {
            markObjectsOffBed(partialObjects);
        }

        setPartialObjects(null);

        setMode("manufacturing");
    };

    return (
        <aside
            className="
                flex
                h-screen
                w-[336px]
                shrink-0
                flex-col
                border-l
                border-zinc-200
                bg-[#f6f7f8]
            "
        >
            <div className="border-b border-zinc-200 bg-white p-4">
                <button
                    type="button"
                    onClick={proceedToManufacturing}
                    className="group flex w-full items-center gap-3 rounded-md bg-zinc-950 px-3.5 py-3.5 text-left text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10">
                        <Factory size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold">
                            Proceed to manufacturing
                        </span>
                        <span className="mt-0.5 block text-[11px] font-medium text-zinc-400">
                            Review material and operations
                        </span>
                    </span>
                    <ArrowRight
                        size={17}
                        className="shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-white"
                    />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {targets.length > 0 ? (
                    <SelectionPanel targets={targets} />
                ) : (
                    <>
                        <PanelSection title="Operation color">
                            <OperationSwatches />
                        </PanelSection>

                        <OperationObjectsSection />

                        <ToolSpecificControls />
                    </>
                )}
            </div>

            {partialObjects && (
                <BedValidationModal
                    count={partialObjects.length}
                    onIgnore={ignorePartialObjects}
                    onCancel={() => setPartialObjects(null)}
                />
            )}
        </aside>
    );
}
