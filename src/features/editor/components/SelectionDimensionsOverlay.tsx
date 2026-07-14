import {
    useEffect,
    useRef,
    useState,
} from "react";

import BboxOverlay from "../overlay/components/BboxOverlay";
import LineOverlay from "../overlay/components/LineOverlay";
import NodesOverlay from "../overlay/components/NodesOverlay";
import type {
    SelectionGeometry,
    SelectionGeometryPatch,
} from "../hooks/useSelectionGeometry";
import type {
    EditorSelectionMode
} from "../store/editor.store";

type Props = {
    geometry: SelectionGeometry | null;
    measurementsEnabled: boolean;
    selectionMode: EditorSelectionMode;
    preserveAspectRatio: boolean;
    readOnly?: boolean;
    onCommit: (
        patch: SelectionGeometryPatch
    ) => void;
};

export default function SelectionDimensionsOverlay({
    geometry,
    measurementsEnabled,
    selectionMode,
    preserveAspectRatio,
    readOnly = false,
    onCommit,
}: Props) {
    const overlayRef =
        useRef<HTMLDivElement>(
            null
        );

    const [
        overlayWidth,
        setOverlayWidth,
    ] = useState(
        0
    );

    useEffect(() => {
        const updateWidth =
            () =>
                setOverlayWidth(
                    overlayRef.current
                        ?.getBoundingClientRect()
                        .width ??
                        0
                );

        const frame =
            window.requestAnimationFrame(
                updateWidth
            );

        window.addEventListener(
            "resize",
            updateWidth
        );

        return () => {
            window.cancelAnimationFrame(
                frame
            );

            window.removeEventListener(
                "resize",
                updateWidth
            );
        };
    }, [
        geometry,
    ]);

    if (!geometry) {
        return null;
    }

    return (
        <div
            ref={
                overlayRef
            }
            className="pointer-events-none absolute inset-0 z-20"
        >
            {selectionMode ===
                "node-edit" &&
                !readOnly &&
                geometry.mode ===
                "line" && (
                <LineOverlay
                    geometry={
                        geometry
                    }
                    overlayRef={
                        overlayRef
                    }
                    measurementsEnabled={
                        measurementsEnabled
                    }
                    onCommit={
                        onCommit
                    }
                />
            )}

            {selectionMode ===
                "node-edit" &&
                !readOnly &&
                geometry.mode ===
                "nodes" && (
                <NodesOverlay
                    geometry={
                        geometry
                    }
                    overlayRef={
                        overlayRef
                    }
                    measurementsEnabled={
                        measurementsEnabled
                    }
                    onCommit={
                        onCommit
                    }
                />
            )}

            {selectionMode !==
                "node-edit" &&
                measurementsEnabled &&
                geometry.mode ===
                "bbox" && (
                <BboxOverlay
                    geometry={
                        geometry
                    }
                    overlayWidth={
                        overlayWidth
                    }
                    preserveAspectRatio={
                        preserveAspectRatio
                    }
                    readOnly={
                        readOnly
                    }
                    onCommit={
                        onCommit
                    }
                />
            )}
        </div>
    );
}
