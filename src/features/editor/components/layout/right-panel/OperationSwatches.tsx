import { useEffect, useMemo, useState } from "react";

import { useCanvas } from "../../../canvas/CanvasProvider";
import { useEditorStore } from "../../../store/editor.store";
import { ensureManufacturingMetadata } from "@/core/manufacturing/metadata/objectMetadata";
import {
    applyOperationColor,
    getObjectOperationColor,
    getOperationTargets
} from "./shared";

/** Tracks the (lowercased) operation colors of the current selection. */
export function useSelectionOperationColors() {
    const { canvas } = useCanvas();

    const [selectedColors, setSelectedColors] = useState<string[]>([]);

    useEffect(() => {
        if (!canvas) {
            setSelectedColors([]);
            return;
        }

        const syncSelection = () => {
            const colors = getOperationTargets(canvas.getActiveObject())
                .map(getObjectOperationColor)
                .filter((color): color is string => Boolean(color))
                .map((color) => color.toLowerCase());

            setSelectedColors(Array.from(new Set(colors)));
        };

        syncSelection();

        const events = [
            "selection:created",
            "selection:updated",
            "selection:cleared",
            "object:modified"
        ] as const;

        events.forEach((event) => canvas.on(event, syncSelection));

        return () => {
            events.forEach((event) => canvas.off(event, syncSelection));
        };
    }, [canvas]);

    return { selectedColors, setSelectedColors };
}

/**
 * Operation color grid. With a selection it reassigns the selection's
 * operation; it always sets the default for newly drawn objects.
 */
export default function OperationSwatches() {
    const { canvas } = useCanvas();

    const {
        operationColors,
        strokeColor,
        setStrokeColor
    } = useEditorStore();

    const {
        selectedColors,
        setSelectedColors
    } = useSelectionOperationColors();

    const selectedOperationColor = useMemo(
        () =>
            selectedColors.length === 1
                ? selectedColors[0]
                : null,
        [selectedColors]
    );

    const applyOperation = (
        color: string,
        operationId: string
    ) => {
        setStrokeColor(color);

        if (!canvas) return;

        const activeObject = canvas.getActiveObject();

        const targets = getOperationTargets(activeObject);

        if (targets.length === 0) return;

        targets.forEach((object) => {
            applyOperationColor(object, color);

            const metadata = ensureManufacturingMetadata(object);

            metadata.operationId = operationId;
            metadata.enabled = true;
        });

        if (activeObject) {
            activeObject.setCoords();
            canvas.fire("object:modified", {
                target: activeObject
            });
        }

        canvas.requestRenderAll();
        setSelectedColors([color.toLowerCase()]);
    };

    return (
        <div className="grid grid-cols-2 gap-2">
            {operationColors.map((item) => {
                const activeColor =
                    selectedOperationColor ??
                    strokeColor.toLowerCase();

                const active =
                    activeColor === item.color.toLowerCase();

                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                            applyOperation(item.color, item.id)
                        }
                        className={`
                            flex
                            h-9
                            items-center
                            gap-2
                            rounded-md
                            border
                            px-2
                            text-[13px]
                            font-medium
                            ${
                                active
                                    ? "border-zinc-900 bg-zinc-100 text-zinc-950"
                                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                            }
                        `}
                    >
                        <span
                            className="h-4 w-4 rounded-full border border-black/10"
                            style={{
                                backgroundColor: item.color
                            }}
                        />
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
