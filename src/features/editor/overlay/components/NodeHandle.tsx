import type {
    OverlayCommit,
    OverlayRef,
    SelectionGeometry,
    SelectionNode,
} from "../types";
import { viewportPointerToScene } from "../utils/viewport";

export default function NodeHandle({
    node,
    geometry,
    overlayRef,
    onCommit,
}: {
    node: SelectionNode;
    geometry: SelectionGeometry;
    overlayRef: OverlayRef;
    onCommit: OverlayCommit;
}) {
    const handlePointerDown =
        (
            event: React.PointerEvent<HTMLButtonElement>
        ) => {
            event.preventDefault();
            event.stopPropagation();

            const move =
                (
                    pointerEvent: PointerEvent
                ) => {
                    const scenePoint =
                        viewportPointerToScene(
                            geometry,
                            overlayRef,
                            pointerEvent
                        );

                    if (!scenePoint) {
                        return;
                    }

                    onCommit({
                        node: {
                            id:
                                node.id,
                            x:
                                scenePoint.x,
                            y:
                                scenePoint.y,
                        },
                    });
                };

            const up =
                () => {
                    window.removeEventListener(
                        "pointermove",
                        move
                    );
                    window.removeEventListener(
                        "pointerup",
                        up
                    );
                };

            window.addEventListener(
                "pointermove",
                move
            );
            window.addEventListener(
                "pointerup",
                up
            );
        };

    return (
        <button
            aria-label="Edit node"
            className="
                pointer-events-auto
                absolute
                h-3
                w-3
                -translate-x-1/2
                -translate-y-1/2
                rounded-full
                border
                border-zinc-950
                bg-white
                shadow-sm
                outline-none
                hover:bg-cyan-100
                focus-visible:ring-2
                focus-visible:ring-cyan-400
            "
            style={{
                left:
                    node.viewport.x,
                top:
                    node.viewport.y,
            }}
            onPointerDown={
                handlePointerDown
            }
        />
    );
}
