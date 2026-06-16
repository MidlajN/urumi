import { Canvas, Color, Rect, util, type TBBox } from "fabric";

type DrawOptions = {
    isHorizontal: boolean;
    rulerLength: number;
    startCalibration: number;
};

type RectOptions = {
    left: number;
    top: number;
    width: number;
    height: number;
    fill?: string | CanvasGradient;
    stroke?: string;
    strokeWidth?: number;
};

type TextOptions = {
    left: number;
    top: number;
    text: string;
    fill?: string;
    align?: CanvasTextAlign;
    angle?: number;
    fontSize?: number;
};

type LineOptions = {
    left: number;
    top: number;
    width: number;
    height: number;
    stroke?: string;
    lineWidth?: number;
};

type MaskOptions = {
    isHorizontal: boolean;
    left: number;
    top: number;
    width: number;
    height: number;
    backgroundColor: string;
};

type RulerOptions = {
    ruleSize: number;
    fontSize: number;
    enabled: boolean;
    backgroundColor: string;
    borderColor: string;
    highlightColor: string;
    textColor: string;
};

export default class CanvasRuler {
    private canvas: Canvas;
    private objectBox: TBBox | null = null;

    private option: RulerOptions = {
        ruleSize: 20,
        fontSize: 10,
        enabled: false,
        backgroundColor: "#ffffff",
        borderColor: "#ddd",
        highlightColor: "#007fff",
        textColor: "#888",
    };

    private eventHandler = {
        renderRuler: (e: { ctx?: CanvasRenderingContext2D }) => {
            if (!e.ctx) return;
            this.renderRuler();
        },
    };

    constructor(fabricCanvas: Canvas, _workspace: Rect) {
        this.canvas = fabricCanvas;
    }

    rulerEnable(): void {
        this.canvas.on("after:render", this.eventHandler.renderRuler);
        this.renderRuler();
    }

    rulerDisable(): void {
        this.canvas.off("after:render", this.eventHandler.renderRuler);
    }

    renderRuler(): void {
        const vpt = this.canvas.viewportTransform;
        if (!vpt) return;

        this.draw({
            isHorizontal: false,
            rulerLength: this.canvas.height ?? 0,
            startCalibration: -(vpt[5] / vpt[3]),
        });

        this.draw({
            isHorizontal: true,
            rulerLength: this.canvas.width ?? 0,
            startCalibration: -(vpt[4] / vpt[0]),
        });
    }

    private draw(opt: DrawOptions): void {
        const { isHorizontal, rulerLength, startCalibration } = opt;

        const zoom = this.canvas.getZoom();
        const ruleSize = this.option.ruleSize;
        const fontSize = this.option.fontSize;

        const gap = this.getGap(zoom);

        const unitLength = rulerLength / zoom;

        const startValue =
            Math[startCalibration > 0 ? "floor" : "ceil"](
                startCalibration / gap
            ) * gap;

        const startOffset = startValue - startCalibration;

        const canvasSize = {
            width: this.canvas.width ?? 0,
            height: this.canvas.height ?? 0,
        };

        const ctx = this.canvas.getElement().getContext("2d");
        if (!ctx) return;

        this.drawRect(ctx, {
            left: 0,
            top: 0,
            width: isHorizontal ? canvasSize.width : ruleSize,
            height: isHorizontal ? ruleSize : canvasSize.height,
            fill: this.option.backgroundColor,
        });

        const textColor = new Color(this.option.textColor);

        for (
            let i = 0;
            i + startOffset <= Math.ceil(unitLength);
            i += gap
        ) {
            const position = (startOffset + i) * zoom;
            // const textValue = String(startValue + i);
            const pxPerMM =
                util.parseUnit("1mm");

            const mmValue =
                Math.round(
                    (startValue + i) /
                    pxPerMM
                );

            const textValue =
                String(mmValue);

            const textLength = (10 * textValue.length) / 4;

            const textX = isHorizontal
                ? position - textLength - 1
                : ruleSize / 2 - fontSize / 2;

            const textY = isHorizontal
                ? ruleSize / 2 - fontSize / 2
                : position + textLength;

            this.drawText(ctx, {
                text: textValue,
                left: textX,
                top: textY,
                fill: textColor.toRgb(),
                angle: isHorizontal ? 0 : -90,
            });
        }

        for (
            let j = 0;
            j + startOffset < Math.ceil(unitLength);
            j += gap
        ) {
            const position = Math.round((startOffset + j) * zoom);

            this.drawLine(ctx, {
                left: isHorizontal ? position : ruleSize - 4,
                top: isHorizontal ? ruleSize - 4 : position,
                width: isHorizontal ? 0 : 4,
                height: isHorizontal ? 4 : 0,
                stroke: textColor.toRgb(),
            });
        }

        const activeObject = this.canvas.getActiveObject();
        if (!activeObject) return;

        this.objectBox = activeObject.getBoundingRect();

        this.drawObjectRuler(
            ctx,
            isHorizontal ? "x" : "y",
            zoom,
            startCalibration
        );
    }

    private drawObjectRuler(
        ctx: CanvasRenderingContext2D,
        axis: "x" | "y",
        zoom: number,
        startCalibration: number
    ): void {
        if (!this.objectBox) return;

        const isHorizontal = axis === "x";

        const ruleSize = this.option.ruleSize;
        const fontSize = this.option.fontSize;

        // const roundFactor = (x: number) => String(Math.round(x));
        const pxPerMM =
            util.parseUnit("1mm");

        const roundFactor = (
            x: number
        ) =>
            String(
                Math.round(
                    x / pxPerMM
                )
            );

        const leftValue = roundFactor(
            isHorizontal
                ? this.objectBox.left
                : this.objectBox.top
        );

        const rightValue = roundFactor(
            isHorizontal
                ? this.objectBox.left + this.objectBox.width
                : this.objectBox.top + this.objectBox.height
        );

        const isSameText = leftValue === rightValue;

        const leftWithOffset =
        (this.objectBox.left - startCalibration) * zoom;

        const topWithOffset =
        (this.objectBox.top - startCalibration) * zoom;

        const cleanedWidth = this.objectBox.width * zoom;
        const cleanedHeight = this.objectBox.height * zoom;

        const options = {
            isHorizontal,
            width: isHorizontal ? 160 : ruleSize - 4,
            height: isHorizontal ? ruleSize - 4 : 160,
            backgroundColor: "#fff",
        };

        this.drawMask(ctx, {
            ...options,
            left: isHorizontal ? leftWithOffset - 80 : 0,
            top: isHorizontal ? 0 : topWithOffset - 80,
        });

        if (!isSameText) {
            this.drawMask(ctx, {
                ...options,
                left: isHorizontal
                    ? leftWithOffset + cleanedWidth - 80
                    : 0,
                top: isHorizontal
                    ? 0
                    : topWithOffset + cleanedHeight - 80,
            });
        }

        const highlightColor = new Color("#43cad4");
        highlightColor.setAlpha(0.5);

        this.drawRect(ctx, {
            left: isHorizontal
                ? leftWithOffset
                : ruleSize - 8,
            top: isHorizontal
                ? ruleSize - 8
                : topWithOffset,
            width: isHorizontal ? cleanedWidth : 8,
            height: isHorizontal ? 8 : cleanedHeight,
            fill: highlightColor.toRgba(),
        });

        const pad = ruleSize / 2 - fontSize / 2;

        highlightColor.setAlpha(1);

        this.drawText(ctx, {
            text: leftValue,
            left: isHorizontal ? leftWithOffset - 2 : pad,
            top: isHorizontal ? pad : topWithOffset - 2,
            align: isSameText
                ? "center"
                : isHorizontal
                ? "right"
                : "left",
            fill: highlightColor.toRgba(),
            angle: isHorizontal ? 0 : -90,
        });

        if (!isSameText) {
        this.drawText(ctx, {
            text: rightValue,
            left: isHorizontal
                ? leftWithOffset + cleanedWidth + 2
                : pad,
            top: isHorizontal
                ? pad
                : topWithOffset + cleanedHeight + 2,
            align: isHorizontal ? "left" : "right",
            fill: highlightColor.toRgba(),
            angle: isHorizontal ? 0 : -90,
        });
        }
    }

    private getGap(zoom: number): number {
        const zooms = [0.02, 0.03, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 18];
        const gaps = [5000, 2500, 1000, 500, 250, 100, 50, 25, 10, 5, 2];

        let i = 0;

        while (i < zooms.length && zooms[i] < zoom) {
            i++;
        }

        return gaps[i - 1] || 5000;
    }

    private drawRect(
        ctx: CanvasRenderingContext2D,
        options: RectOptions
    ): void {
        ctx.save();

        const {
            left,
            top,
            width,
            height,
            fill,
            stroke,
            strokeWidth,
        } = options;

        ctx.beginPath();

        if (fill) ctx.fillStyle = fill;

        ctx.rect(left, top, width, height);
        ctx.fill();

        if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth ?? 1;
        ctx.stroke();
        }

        ctx.restore();
    }

    private drawText(
        ctx: CanvasRenderingContext2D,
        options: TextOptions
    ): void {
        ctx.save();

        const {
            left,
            top,
            text,
            fill,
            align,
            angle,
            fontSize,
        } = options;

        if (fill) ctx.fillStyle = fill;

        ctx.textAlign = align ?? "left";
        ctx.textBaseline = "top";
        ctx.font = `${fontSize ?? 10}px sans-serif`;

        if (angle) {
            ctx.translate(left, top);
            ctx.rotate((Math.PI / 180) * angle);
            ctx.translate(-left, -top);
        }

        ctx.fillText(`${text}`, left, top);

        ctx.restore();
    }

    private drawLine(
        ctx: CanvasRenderingContext2D,
        options: LineOptions
    ): void {
        ctx.save();

        const {
            left,
            top,
            width,
            height,
            stroke,
            lineWidth,
        } = options;

        ctx.beginPath();

        if (stroke) ctx.strokeStyle = stroke;

        ctx.lineWidth = lineWidth ?? 1;

        ctx.moveTo(left, top);
        ctx.lineTo(left + width, top + height);
        ctx.stroke();

        ctx.restore();
    }

    private drawMask(
        ctx: CanvasRenderingContext2D,
        options: MaskOptions
    ): void {
        ctx.save();

        const {
            isHorizontal,
            left,
            top,
            width,
            height,
            backgroundColor,
        } = options;

        const gradient = isHorizontal
            ? ctx.createLinearGradient(
                left,
                height / 2,
                left + width,
                height / 2
                )
            : ctx.createLinearGradient(
                width / 2,
                top,
                width / 2,
                height + top
                );

        const transparentColor = new Color(backgroundColor);
        transparentColor.setAlpha(0);

        gradient.addColorStop(0, transparentColor.toRgba());
        gradient.addColorStop(0.33, backgroundColor);
        gradient.addColorStop(0.67, backgroundColor);
        gradient.addColorStop(1, transparentColor.toRgba());

        this.drawRect(ctx, {
            left,
            top,
            width,
            height,
            fill: gradient,
        });

        ctx.restore();
    }
}
