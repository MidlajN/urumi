import {
    Canvas,
    Rect,
    Pattern,
    util
} from "fabric";

export default class CanvasGrid {
    private canvas:
        Canvas;

    private workspace:
        Rect;

    private zoomHandler:
        () => void;

    constructor(
        canvas: Canvas,
        workspace: Rect
    ) {
        this.canvas =
            canvas;

        this.workspace =
            workspace;

        this.zoomHandler =
            this.updateGrid;
    }

    enable(): void {
        this.updateGrid();

        this.canvas.on(
            "mouse:wheel",
            this.zoomHandler
        );
    }

    destroy(): void {
        this.canvas.off(
            "mouse:wheel",
            this.zoomHandler
        );
    }

    private getMajorMM(): number {

        const zoom =
            this.canvas.getZoom();

        /**
         * 1000x700 bed
         * tuned for fit view
         */

        if (zoom < 0.4) {
            return 100;
        }

        if (zoom < 1) {
            return 50;
        }

        if (zoom < 2) {
            return 25;
        }

        if (zoom < 4) {
            return 10;
        }

        return 5;
    }

    private updateGrid =
        (): void => {

            const zoom =
                this.canvas
                    .getZoom();

            /**
             * Real-world grid
             */
            let majorMM = this.getMajorMM();

            const majorSpacing =
                util.parseUnit(
                    `${majorMM}mm`
                );

            /**
             * EXACTLY 10 lines
             */
            const minorSpacing =
                majorSpacing / 10;

            const tileSize =
                majorSpacing;

            const patternCanvas =
                document.createElement(
                    "canvas"
                );

            patternCanvas.width =
                Math.ceil(tileSize);

            patternCanvas.height =
                Math.ceil(tileSize);

            const ctx =
                patternCanvas.getContext(
                    "2d"
                );

            if (!ctx) return;

            ctx.clearRect(
                0,
                0,
                tileSize,
                tileSize
            );

            /**
             * crisp stroke
             */
            ctx.lineWidth =
                Math.max(
                    0.8 / zoom,
                    0.4
                );

            /**
             * MINOR GRID
             */
            ctx.beginPath();

            ctx.strokeStyle =
                "#F1F3F5";

            for (
                let x = minorSpacing;
                x < tileSize;
                x += minorSpacing
            ) {

                const px =
                    Math.round(x) + 0.5;

                ctx.moveTo(px, 0);
                ctx.lineTo(px, tileSize);
            }

            for (
                let y = minorSpacing;
                y < tileSize;
                y += minorSpacing
            ) {

                const py =
                    Math.round(y) + 0.5;

                ctx.moveTo(0, py);
                ctx.lineTo(tileSize, py);
            }

            ctx.stroke();

            /**
             * MAJOR GRID
             */
            ctx.beginPath();

            ctx.strokeStyle =
                "#E4E8ED";

            ctx.lineWidth =
                Math.max(
                    1.2 / zoom,
                    0.7
                );

            ctx.moveTo(0.5, 0);
            ctx.lineTo(0.5, tileSize);

            ctx.moveTo(0, 0.5);
            ctx.lineTo(tileSize, 0.5);

            ctx.stroke();

            this.workspace.set({
                fill: new Pattern({
                    source: patternCanvas,
                    repeat: "repeat"
                }),
                backgroundColor: "#FFFFFF",
            });

            this.canvas.requestRenderAll();
    };
}