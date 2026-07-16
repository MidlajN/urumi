import {
    useEffect,
    useRef
} from "react";
import type {
    FabricObject
} from "fabric";

const PREVIEW_SIZE =
    40;

const PREVIEW_PADDING =
    6;

const PREVIEW_STROKE_OFFSET =
    0.85;

export default function ObjectPreview({
    object
}: {
    object: FabricObject;
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

        const pixelRatio =
            window.devicePixelRatio ||
            1;

        element.width =
            PREVIEW_SIZE *
            pixelRatio;
        element.height =
            PREVIEW_SIZE *
            pixelRatio;

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
            pixelRatio,
            0,
            0,
            pixelRatio,
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
            "#ffffff";
        context.fillRect(
            0,
            0,
            PREVIEW_SIZE,
            PREVIEW_SIZE
        );

        const bounds =
            object.getBoundingRect();

        if (
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

        const strokeOffset =
            PREVIEW_STROKE_OFFSET /
            scale;

        const diagonalOffset =
            strokeOffset *
            0.7;

        const renderOffsets = [
            [
                -strokeOffset,
                0
            ],
            [
                strokeOffset,
                0
            ],
            [
                0,
                -strokeOffset
            ],
            [
                0,
                strokeOffset
            ],
            [
                -diagonalOffset,
                -diagonalOffset
            ],
            [
                diagonalOffset,
                -diagonalOffset
            ],
            [
                -diagonalOffset,
                diagonalOffset
            ],
            [
                diagonalOffset,
                diagonalOffset
            ],
            [
                0,
                0
            ]
        ] as const;

        renderOffsets.forEach(
            (
                [
                    x,
                    y
                ],
                index
            ) => {
                context.save();
                context.translate(
                    x,
                    y
                );
                context.globalAlpha =
                    index ===
                    renderOffsets.length -
                        1
                        ? 1
                        : 0.7;
                object.render(
                    context
                );
                context.restore();
            }
        );

        context.restore();
    }, [
        object
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
            aria-hidden="true"
            className="h-10 w-10 shrink-0 rounded-md border border-zinc-200 bg-white"
        />
    );
}
