const MAX_LONG_SIDE = 1800;

const JPEG_QUALITY = 0.8;

export type CompressedImage = {
    /** JPEG data URL. */
    image: string;
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

    return {
        image:
            canvas.toDataURL(
                "image/jpeg",
                JPEG_QUALITY
            ),
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
