import {
    useEffect
} from "react";
import type {
    Canvas
} from "fabric";

import type {
    WorkspaceMode
} from "@/stores/workspace.store";
import {
    useEditorStore
} from "../store/editor.store";
import {
    applyCanvasInteractionPolicy
} from "../canvas/interactionPolicy";

export function useCanvasInteractionPolicy(
    canvas: Canvas | null,
    mode: WorkspaceMode
) {
    useEffect(() => {
        if (
            !canvas
        ) {
            return;
        }

        if (
            mode ===
            "manufacturing"
        ) {
            const editorState =
                useEditorStore.getState();

            editorState.exitNodeEditMode();
            editorState.setTool(
                "select"
            );
        }

        const applyPolicy = () =>
            applyCanvasInteractionPolicy(
                canvas,
                mode
            );

        applyPolicy();

        canvas.on(
            "object:added",
            applyPolicy
        );
        canvas.on(
            "selection:created",
            applyPolicy
        );
        canvas.on(
            "selection:updated",
            applyPolicy
        );
        canvas.on(
            "selection:cleared",
            applyPolicy
        );

        return () => {
            canvas.off(
                "object:added",
                applyPolicy
            );
            canvas.off(
                "selection:created",
                applyPolicy
            );
            canvas.off(
                "selection:updated",
                applyPolicy
            );
            canvas.off(
                "selection:cleared",
                applyPolicy
            );
        };
    }, [
        canvas,
        mode
    ]);
}
