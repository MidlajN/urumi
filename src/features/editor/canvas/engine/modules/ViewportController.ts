import {
    Canvas,
    Rect,
    Point,
    util,
    iMatrix,
    type TMat2D
} from "fabric";

import throttle from "lodash.throttle";

import type { RefObject } from "react";

type ToolRef = RefObject<string>;

type EmitFn = (
    event: string,
    data: unknown
) => void;

export class ViewportController {

    private canvas: Canvas;

    private getWorkspace: () => Rect;

    private container: HTMLDivElement;

    private toolRef: ToolRef;

    private emit: EmitFn;
    
    private observer: ResizeObserver | null = null;

    private zoomRatio = 0.75;

    private dragMode = false;

    private isDragging = false;

    private lastPosX = 0;

    private lastPosY = 0;

    constructor(
        canvas: Canvas,
        getWorkspace: () => Rect,
        container: HTMLDivElement,
        toolRef: ToolRef,
        emit: EmitFn
    ) {
        this.canvas = canvas;

        this.getWorkspace = getWorkspace;

        this.container = container;

        this.toolRef = toolRef;

        this.emit = emit
    }

    init(): void {
        this.initResizeObserver();
        this.initDrag();
        this.bindMouseWheel();
    }

    destroy(): void {
        this.observer?.disconnect();

        this.canvas.off("mouse:wheel", this.eventHandlers.mouseWheel);
    }

    getDragMode(): boolean {
        return this.dragMode;
    }

    startDrag(): void {
        this.dragMode = true;

        this.canvas.setCursor("grab");

        this.emit("dragMode", true);

        this.canvas.renderAll();
    }

    endDrag(): void {
        this.dragMode = false;

        this.canvas.setCursor("default");

        this.isDragging = false;

        this.emit("dragMode", false);

        this.canvas.renderAll();
    }

    zoomIn(): void {

        let zoom = this.canvas.getZoom();

        zoom += 0.05;

        const center = this.canvas.getCenterPoint();

        this.canvas.zoomToPoint(
            new Point(
                center.x,
                center.y
            ),
            zoom
        );
    }

    zoomOut(): void {

        let zoom = this.canvas.getZoom();

        zoom -= 0.05;

        const center = this.canvas.getCenterPoint();

        this.canvas.zoomToPoint(
            new Point(
                center.x,
                center.y
            ),
            zoom < 0 ? 0.01 : zoom
        );
    }

    setZoomAuto(): void {

        const elWidth = this.container.offsetWidth;

        const elHeight = this.container.offsetHeight;

        const scale =
            util.findScaleToFit(
                this.getWorkspace(),
                {
                    width: elWidth,
                    height: elHeight
                }
            );

        this.canvas.setDimensions({
            width: elWidth,
            height: elHeight
        });

        const center = this.canvas.getCenterPoint();

        const identity: TMat2D = [...iMatrix];

        this.canvas.setViewportTransform(
            identity
        );

        this.canvas.zoomToPoint(
            new Point(
                center.x,
                center.y
            ),
            scale * this.zoomRatio
        );

        const wsCenter = this.getWorkspace().getCenterPoint();

        const vt = this.canvas.viewportTransform;

        if (!vt || !this.canvas.width || !this.canvas.height) return;

        vt[4] = this.canvas.width / 2 - wsCenter.x * vt[0];

        vt[5] = this.canvas.height / 2 - wsCenter.y * vt[3];

        this.canvas.setViewportTransform(
            vt
        );

        this.canvas.renderAll();
    }

    private initResizeObserver(): void {

        this.observer = new ResizeObserver(
            throttle(() => {
                this.setZoomAuto();
            }, 50)
        );

        this.observer.observe(this.container);
    }

    private initDrag(): void {

        this.canvas.on("mouse:down", (evt: any) => {

                if (!this.dragMode) return;

                const event = evt.e;

                this.canvas.setCursor("grabbing");

                this.canvas.discardActiveObject();

                this.canvas.selection = false;

                this.canvas.getObjects().forEach(obj => {
                    obj.selectable = false;
                });

                this.isDragging = true;

                this.lastPosX = event.clientX;

                this.lastPosY = event.clientY;
            }
        );

        this.canvas.on("mouse:move", (evt: any) => {

                if (!this.isDragging) return;

                const event = evt.e;

                const vpt = this.canvas.viewportTransform;

                if (!vpt) return;

                vpt[4] += event.clientX - this.lastPosX;

                vpt[5] += event.clientY - this.lastPosY;

                this.lastPosX = event.clientX;

                this.lastPosY = event.clientY;

                this.canvas.renderAll();
            }
        );

        this.canvas.on("mouse:up", () => {

                if (!this.dragMode) return;

                const vpt = this.canvas.viewportTransform;

                if (!vpt) return;

                this.canvas.setViewportTransform(
                    vpt
                );

                this.isDragging = false;

                this.canvas.setCursor("grab");

                if (this.toolRef.current !== "Select") return;

                this.canvas.selection = true;

                this.canvas.getObjects().forEach(obj => {
                    if (
                        obj.name !== "workspace" && 
                        obj.hasControls
                    ) {
                        obj.selectable = true;
                    }
                });
            }
        );
    }

    private eventHandlers = {
        mouseWheel: (event: any) => {

            let zoom = this.canvas.getZoom();

            zoom *= 0.999 ** event.e.deltaY;

            zoom = Math.min(
                Math.max(zoom, 0.05),
                20
            );

            const pointer = this.canvas.getViewportPoint(
                event.e
            );

            this.canvas.zoomToPoint(
                new Point(pointer.x, pointer.y),
                zoom
            );

            event.e.preventDefault();
            event.e.stopPropagation();
        }
    };

    private bindMouseWheel(): void {
        this.canvas.on(
            "mouse:wheel",
            this.eventHandlers.mouseWheel
        );
    }
}