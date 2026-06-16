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

type Props = {
    geometry: SelectionGeometry | null;
    onCommit: (
        patch: SelectionGeometryPatch
    ) => void;
};

export default function SelectionDimensionsOverlay({
    geometry,
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
            {geometry.mode ===
                "line" && (
                <LineOverlay
                    geometry={
                        geometry
                    }
                    onCommit={
                        onCommit
                    }
                />
            )}

            {geometry.mode ===
                "nodes" && (
                <NodesOverlay
                    geometry={
                        geometry
                    }
                    overlayRef={
                        overlayRef
                    }
                    onCommit={
                        onCommit
                    }
                />
            )}

            {geometry.mode ===
                "bbox" && (
                <BboxOverlay
                    geometry={
                        geometry
                    }
                    overlayWidth={
                        overlayWidth
                    }
                    onCommit={
                        onCommit
                    }
                />
            )}
        </div>
    );
}
