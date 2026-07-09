import type {
    CompanionReferenceImageMessage
} from "./types";

export type ReferencePoint = {
    x: number;
    y: number;
};

export type ReferencePerspectiveCorners = {
    topLeft: ReferencePoint;
    topRight: ReferencePoint;
    bottomRight: ReferencePoint;
    bottomLeft: ReferencePoint;
};

export type ReferenceImageAdjustments = {
    corners: ReferencePerspectiveCorners;
    rotation: 0 | 90 | 180 | 270;
    flipHorizontal: boolean;
    flipVertical: boolean;
};

const MAX_OUTPUT_SIDE =
    2200;

const MIN_OUTPUT_SIDE =
    32;

const JPEG_QUALITY =
    0.9;

export const defaultReferenceCorners: ReferencePerspectiveCorners = {
    topLeft: {
        x:
            0,
        y:
            0
    },
    topRight: {
        x:
            1,
        y:
            0
    },
    bottomRight: {
        x:
            1,
        y:
            1
    },
    bottomLeft: {
        x:
            0,
        y:
            1
    }
};

export function cloneReferenceImageMessage(
    message: CompanionReferenceImageMessage
): CompanionReferenceImageMessage {
    return {
        ...message,
        data:
            message.data.slice(
                0
            )
    };
}

export async function applyReferenceImageAdjustments(
    source: CompanionReferenceImageMessage,
    adjustments: ReferenceImageAdjustments
): Promise<CompanionReferenceImageMessage> {
    const image =
        await loadImage(
            source
        );

    const orientedCanvas =
        drawOrientedImage(
            image,
            adjustments
        );

    const correctedCanvas =
        warpPerspective(
            orientedCanvas,
            adjustments.corners
        );

    const blob =
        await canvasToBlob(
            correctedCanvas
        );

    return {
        version:
            1,
        type:
            "reference-image",
        mime:
            "image/jpeg",
        width:
            correctedCanvas.width,
        height:
            correctedCanvas.height,
        data:
            await blob.arrayBuffer()
    };
}

function loadImage(
    source: CompanionReferenceImageMessage
) {
    const blob =
        new Blob(
            [
                source.data
            ],
            {
                type:
                    source.mime
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    return new Promise<HTMLImageElement>(
        (
            resolve,
            reject
        ) => {
            const image =
                new Image();

            image.onload = () => {
                URL.revokeObjectURL(
                    url
                );
                resolve(
                    image
                );
            };

            image.onerror = () => {
                URL.revokeObjectURL(
                    url
                );
                reject(
                    new Error(
                        "Unable to load reference image"
                    )
                );
            };

            image.src =
                url;
        }
    );
}

function drawOrientedImage(
    image: HTMLImageElement,
    adjustments: ReferenceImageAdjustments
) {
    const rotated =
        adjustments.rotation ===
            90 ||
        adjustments.rotation ===
            270;

    const canvas =
        document.createElement(
            "canvas"
        );

    canvas.width =
        rotated
            ? image.naturalHeight
            : image.naturalWidth;
    canvas.height =
        rotated
            ? image.naturalWidth
            : image.naturalHeight;

    const context =
        get2dContext(
            canvas
        );

    context.save();
    context.translate(
        canvas.width / 2,
        canvas.height / 2
    );
    context.rotate(
        (adjustments.rotation *
            Math.PI) /
            180
    );
    context.scale(
        adjustments.flipHorizontal
            ? -1
            : 1,
        adjustments.flipVertical
            ? -1
            : 1
    );
    context.drawImage(
        image,
        -image.naturalWidth / 2,
        -image.naturalHeight / 2
    );
    context.restore();

    return canvas;
}

function warpPerspective(
    sourceCanvas: HTMLCanvasElement,
    corners: ReferencePerspectiveCorners
) {
    const sourcePoints =
        cornersToPixels(
            corners,
            sourceCanvas.width,
            sourceCanvas.height
        );

    const outputSize =
        getOutputSize(
            sourcePoints
        );

    const outputCanvas =
        document.createElement(
            "canvas"
        );

    outputCanvas.width =
        outputSize.width;
    outputCanvas.height =
        outputSize.height;

    const sourceContext =
        get2dContext(
            sourceCanvas
        );
    const outputContext =
        get2dContext(
            outputCanvas
        );

    const sourceImageData =
        sourceContext.getImageData(
            0,
            0,
            sourceCanvas.width,
            sourceCanvas.height
        );

    const outputImageData =
        outputContext.createImageData(
            outputCanvas.width,
            outputCanvas.height
        );

    const transform =
        solveHomography(
            [
                {
                    x:
                        0,
                    y:
                        0
                },
                {
                    x:
                        outputCanvas.width - 1,
                    y:
                        0
                },
                {
                    x:
                        outputCanvas.width - 1,
                    y:
                        outputCanvas.height - 1
                },
                {
                    x:
                        0,
                    y:
                        outputCanvas.height - 1
                }
            ],
            sourcePoints
        );

    for (
        let y = 0;
        y < outputCanvas.height;
        y += 1
    ) {
        for (
            let x = 0;
            x < outputCanvas.width;
            x += 1
        ) {
            const sourcePoint =
                applyHomography(
                    transform,
                    x,
                    y
                );

            writeSample(
                sourceImageData,
                outputImageData,
                sourcePoint.x,
                sourcePoint.y,
                x,
                y
            );
        }
    }

    outputContext.putImageData(
        outputImageData,
        0,
        0
    );

    return outputCanvas;
}

function cornersToPixels(
    corners: ReferencePerspectiveCorners,
    width: number,
    height: number
) {
    return [
        corners.topLeft,
        corners.topRight,
        corners.bottomRight,
        corners.bottomLeft
    ].map(
        (
            point
        ) => ({
            x:
                clamp(
                    point.x,
                    0,
                    1
                ) *
                (width - 1),
            y:
                clamp(
                    point.y,
                    0,
                    1
                ) *
                (height - 1)
        })
    );
}

function getOutputSize(
    points: ReferencePoint[]
) {
    const top =
        distance(
            points[0],
            points[1]
        );
    const right =
        distance(
            points[1],
            points[2]
        );
    const bottom =
        distance(
            points[2],
            points[3]
        );
    const left =
        distance(
            points[3],
            points[0]
        );

    let width =
        Math.max(
            top,
            bottom,
            MIN_OUTPUT_SIDE
        );
    let height =
        Math.max(
            left,
            right,
            MIN_OUTPUT_SIDE
        );

    const longest =
        Math.max(
            width,
            height
        );

    if (
        longest >
        MAX_OUTPUT_SIDE
    ) {
        const scale =
            MAX_OUTPUT_SIDE /
            longest;

        width *=
            scale;
        height *=
            scale;
    }

    return {
        width:
            Math.round(
                width
            ),
        height:
            Math.round(
                height
            )
    };
}

function solveHomography(
    from: ReferencePoint[],
    to: ReferencePoint[]
) {
    const matrix: number[][] =
        [];

    from.forEach(
        (
            point,
            index
        ) => {
            const target =
                to[index];

            matrix.push([
                point.x,
                point.y,
                1,
                0,
                0,
                0,
                -target.x *
                    point.x,
                -target.x *
                    point.y,
                target.x
            ]);

            matrix.push([
                0,
                0,
                0,
                point.x,
                point.y,
                1,
                -target.y *
                    point.x,
                -target.y *
                    point.y,
                target.y
            ]);
        }
    );

    const solved =
        gaussianSolve(
            matrix
        );

    return [
        solved[0],
        solved[1],
        solved[2],
        solved[3],
        solved[4],
        solved[5],
        solved[6],
        solved[7],
        1
    ];
}

function gaussianSolve(
    matrix: number[][]
) {
    const size =
        8;

    for (
        let column = 0;
        column < size;
        column += 1
    ) {
        let pivot =
            column;

        for (
            let row =
                column + 1;
            row < size;
            row += 1
        ) {
            if (
                Math.abs(
                    matrix[row][column]
                ) >
                Math.abs(
                    matrix[pivot][column]
                )
            ) {
                pivot =
                    row;
            }
        }

        [
            matrix[column],
            matrix[pivot]
        ] = [
            matrix[pivot],
            matrix[column]
        ];

        const pivotValue =
            matrix[column][column] ||
            1;

        for (
            let value = column;
            value <= size;
            value += 1
        ) {
            matrix[column][value] /=
                pivotValue;
        }

        for (
            let row = 0;
            row < size;
            row += 1
        ) {
            if (
                row ===
                column
            ) {
                continue;
            }

            const factor =
                matrix[row][column];

            for (
                let value = column;
                value <= size;
                value += 1
            ) {
                matrix[row][value] -=
                    factor *
                    matrix[column][value];
            }
        }
    }

    return matrix.map(
        (
            row
        ) => row[size]
    );
}

function applyHomography(
    transform: number[],
    x: number,
    y: number
) {
    const denominator =
        transform[6] *
            x +
        transform[7] *
            y +
        transform[8];

    return {
        x:
            (transform[0] *
                x +
                transform[1] *
                    y +
                transform[2]) /
            denominator,
        y:
            (transform[3] *
                x +
                transform[4] *
                    y +
                transform[5]) /
            denominator
    };
}

function writeSample(
    source: ImageData,
    output: ImageData,
    sourceX: number,
    sourceY: number,
    outputX: number,
    outputY: number
) {
    const outputIndex =
        (outputY *
            output.width +
            outputX) *
        4;

    if (
        sourceX < 0 ||
        sourceY < 0 ||
        sourceX >=
            source.width - 1 ||
        sourceY >=
            source.height - 1
    ) {
        output.data[outputIndex] =
            255;
        output.data[outputIndex + 1] =
            255;
        output.data[outputIndex + 2] =
            255;
        output.data[outputIndex + 3] =
            255;
        return;
    }

    const left =
        Math.floor(
            sourceX
        );
    const top =
        Math.floor(
            sourceY
        );
    const right =
        left + 1;
    const bottom =
        top + 1;
    const dx =
        sourceX - left;
    const dy =
        sourceY - top;

    const topLeft =
        getPixel(
            source,
            left,
            top
        );
    const topRight =
        getPixel(
            source,
            right,
            top
        );
    const bottomLeft =
        getPixel(
            source,
            left,
            bottom
        );
    const bottomRight =
        getPixel(
            source,
            right,
            bottom
        );

    for (
        let channel = 0;
        channel < 4;
        channel += 1
    ) {
        const topValue =
            topLeft[channel] *
                (1 - dx) +
            topRight[channel] *
                dx;
        const bottomValue =
            bottomLeft[channel] *
                (1 - dx) +
            bottomRight[channel] *
                dx;

        output.data[
            outputIndex +
                channel
        ] =
            topValue *
                (1 - dy) +
            bottomValue *
                dy;
    }
}

function getPixel(
    image: ImageData,
    x: number,
    y: number
) {
    const index =
        (y *
            image.width +
            x) *
        4;

    return [
        image.data[index],
        image.data[index + 1],
        image.data[index + 2],
        image.data[index + 3]
    ];
}

function canvasToBlob(
    canvas: HTMLCanvasElement
) {
    return new Promise<Blob>(
        (
            resolve,
            reject
        ) => {
            canvas.toBlob(
                (
                    blob
                ) => {
                    if (
                        blob
                    ) {
                        resolve(
                            blob
                        );
                        return;
                    }

                    reject(
                        new Error(
                            "Unable to encode reference image"
                        )
                    );
                },
                "image/jpeg",
                JPEG_QUALITY
            );
        }
    );
}

function get2dContext(
    canvas: HTMLCanvasElement
) {
    const context =
        canvas.getContext(
            "2d",
            {
                willReadFrequently:
                    true
            }
        );

    if (
        !context
    ) {
        throw new Error(
            "Canvas 2D rendering is unavailable"
        );
    }

    return context;
}

function distance(
    a: ReferencePoint,
    b: ReferencePoint
) {
    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );
}

function clamp(
    value: number,
    min: number,
    max: number
) {
    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
}
