import { Canvas, Rect, util } from "fabric";

export default class CanvasGrid {
    private eventHandler: {
        renderGrid: () => void;
    };

    constructor(
        private canvas: Canvas,
        private workspace: Rect
    ) {
        this.eventHandler = {
            renderGrid: this.renderGrid
        };
    }

    enable(): void {
        this.canvas.on(
            "after:render",
            this.eventHandler.renderGrid
        );

        this.canvas.renderAll();
    }

    destroy(): void {
        this.canvas.off(
            "after:render",
            this.eventHandler.renderGrid
        );
    }

    private getGridSpacing(): {
        minor: number;
        major: number;
    } {
        const zoom =
            this.canvas.getZoom();

        if (zoom < 0.08) {
            return {
                minor: 100,
                major: 500
            };
        }

        if (zoom < 0.15) {
            return {
                minor: 50,
                major: 250
            };
        }

        if (zoom < 0.35) {
            return {
                minor: 25,
                major: 100
            };
        }

        if (zoom < 0.75) {
            return {
                minor: 10,
                major: 50
            };
        }

        if (zoom < 2) {
            return {
                minor: 5,
                major: 25
            };
        }

        return {
            minor: 1,
            major: 10
        };
    }

    private renderGrid = (): void => {
        const ctx =
            this.canvas.getContext();

        const vpt =
            this.canvas.viewportTransform;

        if (!ctx || !vpt) return;

        ctx.save();

        /**
         * Preserve retina transform.
         */
        const t =
            ctx.getTransform();

        /**
         * Multiply DPR transform
         * by viewport transform.
         */
        ctx.setTransform(
            t.a * vpt[0],
            vpt[1],
            vpt[2],
            t.d * vpt[3],
            t.e + vpt[4] * t.a,
            t.f + vpt[5] * t.d
        );

        /**
         * Workspace scene coords
         */
        const left =
            this.workspace.left ?? 0;

        const top =
            this.workspace.top ?? 0;

        const width =
            (this.workspace.width ?? 0) *
            (this.workspace.scaleX ?? 1);

        const height =
            (this.workspace.height ?? 0) *
            (this.workspace.scaleY ?? 1);

        /**
         * Clip to workspace
         */
        ctx.beginPath();

        ctx.rect(
            left,
            top,
            width,
            height
        );

        ctx.clip();

        this.drawGrid(
            ctx,
            left,
            top,
            width,
            height
        );

        ctx.restore();
    };

    private drawGrid(
        ctx: CanvasRenderingContext2D,
        left: number,
        top: number,
        width: number,
        height: number
    ): void {
        const spacing =
            this.getGridSpacing();

        const minorSpacing =
            util.parseUnit(
                `${spacing.minor}mm`
            );

        const majorSpacing =
            util.parseUnit(
                `${spacing.major}mm`
            );
        /**
         * Minor grid
         */
        ctx.beginPath();

        ctx.strokeStyle =
            "#f2f2f2";

        /**
         * Keep thickness stable
         */
        ctx.lineWidth =
            1 / this.canvas.getZoom();

        for (
            let x = left;
            x <= left + width;
            x += minorSpacing
        ) {
            ctx.moveTo(x, top);

            ctx.lineTo(
                x,
                top + height
            );
        }

        for (
            let y = top;
            y <= top + height;
            y += minorSpacing
        ) {
            ctx.moveTo(left, y);

            ctx.lineTo(
                left + width,
                y
            );
        }

        ctx.stroke();

        /**
         * Major grid
         */
        ctx.beginPath();

        ctx.strokeStyle =
            "#e5e5e5";

        for (
            let x = left;
            x <= left + width;
            x += majorSpacing
        ) {
            ctx.moveTo(x, top);

            ctx.lineTo(
                x,
                top + height
            );
        }

        for (
            let y = top;
            y <= top + height;
            y += majorSpacing
        ) {
            ctx.moveTo(left, y);

            ctx.lineTo(
                left + width,
                y
            );
        }

        ctx.stroke();
    }
}