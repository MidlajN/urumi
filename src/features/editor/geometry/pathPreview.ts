import {
    Point,
    type Canvas
} from "fabric";

import {
    sceneToViewport
} from "./geometryUtils";
import type {
    PathGeometry,
    PathNode
} from "./pathModel";

type PreviewStyle = {
    stroke: string;
    previewStroke: string;
    lineWidth: number;
};

const DEFAULT_STYLE: PreviewStyle = {
    stroke: "#111827",
    previewStroke: "#0891b2",
    lineWidth: 2
};

export class PathPreviewRenderer {
    private canvas: Canvas;

    private geometry: PathGeometry | null =
        null;

    private previewNode: PathNode | null =
        null;

    private style: PreviewStyle;

    constructor(
        canvas: Canvas,
        style: Partial<PreviewStyle> = {}
    ) {
        this.canvas =
            canvas;

        this.style = {
            ...DEFAULT_STYLE,
            ...style
        };

        this.canvas.on(
            "after:render",
            this.render
        );
    }

    setGeometry(
        geometry: PathGeometry,
        previewNode: PathNode | null = null
    ) {
        this.geometry =
            geometry;

        this.previewNode =
            previewNode;

        this.canvas.requestRenderAll();
    }

    clear() {
        this.geometry =
            null;

        this.previewNode =
            null;

        this.canvas.requestRenderAll();
    }

    destroy() {
        this.canvas.off(
            "after:render",
            this.render
        );
    }

    private drawVertex(
        ctx: CanvasRenderingContext2D,
        node: PathNode
    ) {
        const point =
            sceneToViewport(
                new Point(
                    node.x,
                    node.y
                ),
                this.canvas
            );

        ctx.save();
        ctx.fillStyle =
            "#ffffff";
        ctx.strokeStyle =
            this.style.previewStroke;
        ctx.lineWidth =
            1.5;
        ctx.beginPath();
        ctx.arc(
            point.x,
            point.y,
            3.5,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    private drawSegment(
        ctx: CanvasRenderingContext2D,
        start: PathNode,
        end: PathNode,
        preview = false
    ) {
        const startPoint =
            sceneToViewport(
                new Point(
                    start.x,
                    start.y
                ),
                this.canvas
            );

        const endPoint =
            sceneToViewport(
                new Point(
                    end.x,
                    end.y
                ),
                this.canvas
            );

        ctx.save();
        ctx.strokeStyle =
            preview
                ? this.style.previewStroke
                : this.style.stroke;
        ctx.lineWidth =
            this.style.lineWidth;
        ctx.lineCap =
            "round";
        ctx.lineJoin =
            "round";

        if (preview) {
            ctx.setLineDash([
                7,
                5
            ]);
        }

        ctx.beginPath();
        ctx.moveTo(
            startPoint.x,
            startPoint.y
        );

        if (
            start.handleOut ||
            end.handleIn
        ) {
            const out =
                start.handleOut
                    ? sceneToViewport(
                        new Point(
                            start.handleOut.x,
                            start.handleOut.y
                        ),
                        this.canvas
                    )
                    : startPoint;

            const input =
                end.handleIn
                    ? sceneToViewport(
                        new Point(
                            end.handleIn.x,
                            end.handleIn.y
                        ),
                        this.canvas
                    )
                    : endPoint;

            ctx.bezierCurveTo(
                out.x,
                out.y,
                input.x,
                input.y,
                endPoint.x,
                endPoint.y
            );
        } else {
            ctx.lineTo(
                endPoint.x,
                endPoint.y
            );
        }

        ctx.stroke();
        ctx.restore();
    }

    private render =
        () => {
            if (!this.geometry) {
                return;
            }

            const ctx =
                this.canvas
                    .getElement()
                    .getContext(
                        "2d"
                    );

            if (!ctx) {
                return;
            }

            const nodes =
                this.geometry.nodes;

            for (
                let index = 0;
                index < nodes.length - 1;
                index += 1
            ) {
                const start =
                    nodes[index];

                const end =
                    nodes[
                        index +
                            1
                    ];

                if (
                    start &&
                    end
                ) {
                    this.drawSegment(
                        ctx,
                        start,
                        end
                    );
                }
            }

            const last =
                nodes[
                    nodes.length -
                        1
                ];

            if (
                last &&
                this.previewNode
            ) {
                this.drawSegment(
                    ctx,
                    last,
                    this.previewNode,
                    true
                );
            }

            nodes.forEach(
                (
                    node
                ) =>
                    this.drawVertex(
                        ctx,
                        node
                    )
            );

            if (this.previewNode) {
                this.drawVertex(
                    ctx,
                    this.previewNode
                );
            }
        };
}
