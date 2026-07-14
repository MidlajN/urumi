import {
    useEffect,
    useRef
} from "react";

import type {
    ManufacturingOperationSummary
} from "@/core/manufacturing/analysis/types";

const PREVIEW_SIZE =
    68;

const PREVIEW_PADDING =
    9;

export default function OperationPreview({
    summary
}: {
    summary: ManufacturingOperationSummary;
}) {
    const canvasRef =
        useRef<HTMLCanvasElement | null>(
            null
        );

    useEffect(() => {
        const element =
            canvasRef.current;

        if (
            !element
        ) {
            return;
        }

        const scaleFactor =
            window.devicePixelRatio ||
            1;

        element.width =
            PREVIEW_SIZE *
            scaleFactor;
        element.height =
            PREVIEW_SIZE *
            scaleFactor;

        const context =
            element.getContext(
                "2d"
            );

        if (
            !context
        ) {
            return;
        }

        context.setTransform(
            scaleFactor,
            0,
            0,
            scaleFactor,
            0,
            0
        );
        context.clearRect(
            0,
            0,
            PREVIEW_SIZE,
            PREVIEW_SIZE
        );
        context.fillStyle =
            "#f4f4f5";
        context.fillRect(
            0,
            0,
            PREVIEW_SIZE,
            PREVIEW_SIZE
        );

        context.strokeStyle =
            "#e4e4e7";
        context.lineWidth =
            1;

        for (
            let offset = 12;
            offset < PREVIEW_SIZE;
            offset += 12
        ) {
            context.beginPath();
            context.moveTo(
                offset,
                0
            );
            context.lineTo(
                offset,
                PREVIEW_SIZE
            );
            context.moveTo(
                0,
                offset
            );
            context.lineTo(
                PREVIEW_SIZE,
                offset
            );
            context.stroke();
        }

        const bounds =
            summary.boundingBox;

        if (
            !bounds ||
            bounds.width <= 0 ||
            bounds.height <= 0
        ) {
            return;
        }

        const scale =
            Math.min(
                (PREVIEW_SIZE -
                    PREVIEW_PADDING *
                        2) /
                    bounds.width,
                (PREVIEW_SIZE -
                    PREVIEW_PADDING *
                        2) /
                    bounds.height
            );

        const offsetX =
            PREVIEW_PADDING +
            (
                PREVIEW_SIZE -
                PREVIEW_PADDING *
                    2 -
                bounds.width *
                    scale
            ) /
                2;
        const offsetY =
            PREVIEW_PADDING +
            (
                PREVIEW_SIZE -
                PREVIEW_PADDING *
                    2 -
                bounds.height *
                    scale
            ) /
                2;

        context.save();
        context.translate(
            offsetX -
                bounds.left *
                    scale,
            offsetY -
                bounds.top *
                    scale
        );
        context.scale(
            scale,
            scale
        );

        summary.objects.forEach(
            (
                object
            ) => {
                context.save();
                object.render(
                    context
                );
                context.restore();
            }
        );

        context.restore();
    }, [
        summary
    ]);

    return (
        <canvas
            ref={
                canvasRef
            }
            width={
                PREVIEW_SIZE
            }
            height={
                PREVIEW_SIZE
            }
            className="
                h-[68px]
                w-[68px]
                shrink-0
                rounded-md
                border
                border-zinc-200
                bg-zinc-100
                shadow-inner
            "
        />
    );
}
