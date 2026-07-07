const MAX_LONG_SIDE =
    1800;

const JPEG_QUALITY =
    0.8;

export type CompressedImage = {
    data: ArrayBuffer;
    mime: "image/jpeg";
    width: number;
    height: number;
};

export async function compressImage(
    file: File
): Promise<CompressedImage> {
    if (
        !file.type.startsWith(
            "image/"
        )
    ) {
        throw new Error(
            "Please choose an image file."
        );
    }

    const image =
        await loadImage(
            file
        );

    const scale =
        Math.min(
            1,
            MAX_LONG_SIDE /
                Math.max(
                    image.naturalWidth,
                    image.naturalHeight
                )
        );

    const width =
        Math.max(
            1,
            Math.round(
                image.naturalWidth *
                    scale
            )
        );

    const height =
        Math.max(
            1,
            Math.round(
                image.naturalHeight *
                    scale
            )
        );

    const canvas =
        document.createElement(
            "canvas"
        );

    canvas.width =
        width;
    canvas.height =
        height;

    const context =
        canvas.getContext(
            "2d"
        );

    if (
        !context
    ) {
        throw new Error(
            "Unable to prepare image compression."
        );
    }

    context.drawImage(
        image,
        0,
        0,
        width,
        height
    );

    const blob =
        await new Promise<Blob>(
            (
                resolve,
                reject
            ) => {
                canvas.toBlob(
                    (
                        result
                    ) => {
                        if (
                            result
                        ) {
                            resolve(
                                result
                            );
                        } else {
                            reject(
                                new Error(
                                    "Unable to compress image."
                                )
                            );
                        }
                    },
                    "image/jpeg",
                    JPEG_QUALITY
                );
            }
        );

    return {
        data:
            await blob.arrayBuffer(),
        mime:
            "image/jpeg",
        width,
        height
    };
}

function loadImage(
    file: File
) {
    return new Promise<HTMLImageElement>(
        (
            resolve,
            reject
        ) => {
            const url =
                URL.createObjectURL(
                    file
                );

            const image =
                new Image();

            image.onload =
                () => {
                    URL.revokeObjectURL(
                        url
                    );
                    resolve(
                        image
                    );
                };

            image.onerror =
                () => {
                    URL.revokeObjectURL(
                        url
                    );
                    reject(
                        new Error(
                            "Unable to read this image."
                        )
                    );
                };

            image.src =
                url;
        }
    );
}
