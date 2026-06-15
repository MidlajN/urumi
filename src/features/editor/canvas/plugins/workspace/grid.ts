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

    private getGridSpacing():
        {
            minor:
                number;

            major:
                number;
        } {

        const zoom =
            this.canvas
                .getZoom();

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

    private updateGrid =
        (): void => {

        const spacing =
            this
                .getGridSpacing();

        const minorSpacing =
            util.parseUnit(
                `${spacing.minor}mm`
            );

        const majorSpacing =
            util.parseUnit(
                `${spacing.major}mm`
            );

        /**
         * tile size
         */
        const tileSize =
            majorSpacing;

        const patternCanvas =
            document.createElement(
                "canvas"
            );

        patternCanvas.width =
            Math.ceil(
                tileSize
            );

        patternCanvas.height =
            Math.ceil(
                tileSize
            );

        const ctx =
            patternCanvas
                .getContext(
                    "2d"
                );

        if (!ctx) {
            return;
        }

        /**
         * white background
         */
        ctx.fillStyle =
            "#ffffff";

        ctx.fillRect(
            0,
            0,
            tileSize,
            tileSize
        );

        /**
         * stable stroke
         */
        const zoom =
            this.canvas
                .getZoom();

        ctx.lineWidth =
            Math.max(
                1 / zoom,
                0.5
            );

        /**
         * minor grid
         */
        ctx.beginPath();

        ctx.strokeStyle =
            "#f2f2f2";

        for (
            let x = 0;
            x <= tileSize;
            x += minorSpacing
        ) {
            ctx.moveTo(
                x,
                0
            );

            ctx.lineTo(
                x,
                tileSize
            );
        }

        for (
            let y = 0;
            y <= tileSize;
            y += minorSpacing
        ) {
            ctx.moveTo(
                0,
                y
            );

            ctx.lineTo(
                tileSize,
                y
            );
        }

        ctx.stroke();

        /**
         * major grid
         */
        ctx.beginPath();

        ctx.strokeStyle =
            "#e5e5e5";

        ctx.moveTo(
            0,
            0
        );

        ctx.lineTo(
            tileSize,
            0
        );

        ctx.moveTo(
            0,
            0
        );

        ctx.lineTo(
            0,
            tileSize
        );

        ctx.stroke();

        this.workspace.set(
            "fill",
            new Pattern({
                source:
                    patternCanvas,

                repeat:
                    "repeat"
            })
        );

        this.canvas.renderAll();
    };
}