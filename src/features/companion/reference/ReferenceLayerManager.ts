import {
    Canvas,
    FabricImage,
    FabricObject,
    Rect,
    loadSVGFromString,
} from "fabric";

import { ensureManufacturingMetadata } from "@/core/manufacturing/metadata/objectMetadata";
import { attachGeometryToImportedPath } from "@/features/editor/canvas/engine/Workspace";

import type { CompanionReferencePayload } from "../types";

const DEFAULT_OPACITY = 0.5;

// Fabric.js canvas units are CSS pixels at 96 dpi; the companion payload
// reports physical size in millimetres.
const PX_PER_MM = 96 / 25.4;

export class ReferenceLayerManager {
    private canvas: Canvas;

    private getWorkspace: () => Rect;

    private image: FabricImage | null = null;

    private source: CompanionReferencePayload | null = null;

    private opacity = DEFAULT_OPACITY;

    private visible = true;

    constructor(canvas: Canvas, getWorkspace: () => Rect) {
        this.canvas = canvas;

        this.getWorkspace = getWorkspace;
    }

    async loadImage(payload: CompanionReferencePayload) {
        const image = await FabricImage.fromURL(payload.image);

        this.source = payload;

        this.replaceImage(image);
    }

    /**
     * Parses the vectorized drawings extracted from the bed image and adds
     * them to the canvas as regular editable objects. The SVG viewBox matches
     * the image's pixel dimensions, so applying the overlay's transform lands
     * every path exactly on top of its drawing.
     */
    async addVectorizedSvg(svgString: string) {
        const source = this.source;

        if (!source) {
            return [];
        }

        const loaded = await loadSVGFromString(svgString);

        const objects = loaded.objects.filter(
            (object): object is FabricObject =>
                object !== null &&
                // The generator emits a magenta bed-frame rect; it marks the
                // bed outline and must not become a drawing object.
                String(object.stroke).toUpperCase() !== "#FF00FF",
        );

        if (objects.length === 0) {
            return [];
        }

        const workspaceBounds = this.getWorkspace().getBoundingRect();

        const viewWidth =
            loaded.options.width || this.image?.width || 1;

        const viewHeight =
            loaded.options.height || this.image?.height || 1;

        const scaleX = (source.physical_width * PX_PER_MM) / viewWidth;

        const scaleY = (source.physical_height * PX_PER_MM) / viewHeight;

        objects.forEach((object) => {
            ensureManufacturingMetadata(object);

            object.set({
                fill: "transparent",
                stroke: object.stroke || "#111827",
                strokeWidth: 2,
                strokeUniform: true,
            });

            attachGeometryToImportedPath(object);

            object.set({
                left: workspaceBounds.left + (object.left ?? 0) * scaleX,
                top: workspaceBounds.top + (object.top ?? 0) * scaleY,
                scaleX: (object.scaleX ?? 1) * scaleX,
                scaleY: (object.scaleY ?? 1) * scaleY,
            });

            object.setCoords();

            this.canvas.add(object);
        });

        this.canvas.requestRenderAll();

        return objects;
    }

    remove() {
        this.removeImage();
        this.source = null;
    }

    setOpacity(opacity: number) {
        this.opacity = Math.max(0, Math.min(1, opacity));

        this.image?.set({
            opacity: this.opacity,
        });

        this.canvas.requestRenderAll();
    }

    toggleVisibility() {
        this.visible = !this.visible;

        this.image?.set({
            visible: this.visible,
        });

        this.canvas.requestRenderAll();
    }

    reset() {
        if (!this.image) {
            return;
        }

        this.opacity = DEFAULT_OPACITY;
        this.visible = true;

        this.configureImage(this.image);
        this.placeOnWorkspace(this.image);
        this.moveLayerBehindGeometry();
        this.canvas.requestRenderAll();
    }

    destroy() {
        this.remove();
    }

    getState() {
        return {
            exists: Boolean(this.image),
            opacity: this.opacity,
            visible: this.visible,
        };
    }

    private replaceImage(image: FabricImage) {
        this.removeImage();

        this.image = image;

        this.configureImage(image);
        this.placeOnWorkspace(image);

        this.canvas.add(image);
        this.moveLayerBehindGeometry();
        this.canvas.requestRenderAll();
    }

    private removeImage() {
        if (!this.image) {
            return;
        }

        this.canvas.remove(this.image);
        this.image = null;
        this.canvas.requestRenderAll();
    }

    private configureImage(image: FabricImage) {
        image.set({
            name: "reference-layer",
            // The multi-MB photo data URL must never be serialized: it would
            // bloat every undo snapshot and blow the localStorage quota.
            excludeFromExport: true,
            selectable: false,
            evented: false,
            hasControls: false,
            hasBorders: false,
            lockMovementX: true,
            lockMovementY: true,
            lockScalingX: true,
            lockScalingY: true,
            lockRotation: true,
            opacity: this.opacity,
            visible: this.visible,
        });
    }

    private placeOnWorkspace(image: FabricImage) {
        const workspace = this.getWorkspace();

        const workspaceBounds = workspace.getBoundingRect();

        const imageWidth = image.width || 1;

        const imageHeight = image.height || 1;

        const physicalWidth = this.source?.physical_width ?? 0;

        const physicalHeight = this.source?.physical_height ?? 0;

        if (physicalWidth > 0 && physicalHeight > 0) {
            // Render the captured bed at its true physical size, anchored to
            // the workspace origin so it stays 1:1 with the real bed.
            image.set({
                originX: "left",
                originY: "top",
                left: workspaceBounds.left,
                top: workspaceBounds.top,
                scaleX: (physicalWidth * PX_PER_MM) / imageWidth,
                scaleY: (physicalHeight * PX_PER_MM) / imageHeight,
            });
        } else {
            const scale = Math.min(
                workspaceBounds.width / imageWidth,
                workspaceBounds.height / imageHeight,
            );

            image.set({
                originX: "center",
                originY: "center",
                left: workspaceBounds.left + workspaceBounds.width / 2,
                top: workspaceBounds.top + workspaceBounds.height / 2,
                scaleX: scale,
                scaleY: scale,
            });
        }

        image.setCoords();
    }

    private moveLayerBehindGeometry() {
        if (!this.image) {
            return;
        }

        const objects = this.canvas.getObjects();

        const workspaceIndex = objects.indexOf(this.getWorkspace());

        this.canvas.moveObjectTo(this.image, Math.max(0, workspaceIndex + 1));
    }
}
