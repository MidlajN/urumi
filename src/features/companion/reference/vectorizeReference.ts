import { ImageProcessor, type ProcessResult } from "svg-skeletonization";

export type VectorizedReference = ProcessResult;

/**
 * The ArUco-flattened bed image, held between the flatten step and the
 * user's lasso selection. `vectorize` finishes the pipeline on the SAME
 * processor instance (flatten stored the frame calibration on it).
 */
export type FlattenedReference = {
    /** Flattened bed image as a data URL — the lasso coordinate space. */
    image: string;

    /** Flattened image size in pixels; the mask must match. */
    width: number;

    height: number;

    /**
     * Extracts drawings from the flattened image. `mask` (white = selected,
     * in flattened-image pixels) limits detection to the lassoed areas;
     * null vectorizes the whole bed.
     */
    vectorize(
        mask: HTMLCanvasElement | null,
    ): Promise<VectorizedReference>;
};

// opencv.js is loaded from a script tag in index.html; the pipeline cannot
// run until its WebAssembly runtime has finished initializing.
const OPENCV_TIMEOUT_MS = 20000;

const OPENCV_POLL_INTERVAL_MS = 200;

type OpenCvGlobal = {
    Mat?: unknown;
};

function isOpenCvReady() {
    const cv = (window as Window & { cv?: OpenCvGlobal }).cv;

    return Boolean(cv && typeof cv.Mat === "function");
}

/**
 * Resolves once opencv.js is usable. Deliberately returns void: the cv
 * Module is an Emscripten thenable that resolves to itself — returning it
 * from an async function makes `await` unwrap it forever, hard-freezing
 * the tab in an infinite microtask loop.
 */
async function waitForOpenCv(): Promise<void> {
    const start = Date.now();

    while (!isOpenCvReady()) {
        if (Date.now() - start > OPENCV_TIMEOUT_MS) {
            throw new Error(
                "OpenCV.js did not finish loading; reference vectorization is unavailable.",
            );
        }

        await new Promise((resolve) =>
            setTimeout(resolve, OPENCV_POLL_INTERVAL_MS),
        );
    }
}

/**
 * Waits until the browser has produced a frame, so progress UI committed just
 * before a long synchronous OpenCV run is actually painted. Falls back to a
 * short timeout in case rAF is throttled (hidden tab).
 */
function waitForPaint() {
    return Promise.race([
        new Promise<void>((resolve) =>
            requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
            ),
        ),
        new Promise<void>((resolve) => setTimeout(resolve, 300)),
    ]);
}

export function loadImageElement(dataUrl: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);

        image.onerror = () =>
            reject(new Error("Unable to load reference image for vectorization"));

        image.src = dataUrl;
    });
}

/**
 * Step one of the pipeline: detect the ArUco frame and warp the photo to a
 * flat, distortion-free bed image. Returns a handle whose `vectorize`
 * finishes the pipeline once the user has picked detection areas on the
 * flattened view. Throws if the four markers are not found.
 */
export async function flattenReferenceImage(
    dataUrl: string,
): Promise<FlattenedReference> {
    await waitForOpenCv();

    const image = await loadImageElement(dataUrl);

    // flatten blocks the main thread; make sure the progress UI is on
    // screen before it starts.
    await waitForPaint();

    // The same processor must finish the pipeline: flatten stashes the
    // detected frame calibration on it, which processFlattened reads back.
    const processor = new ImageProcessor();

    const flattened = await processor.flatten(image);

    return {
        image: flattened.toDataURL("image/jpeg", 0.8),
        width: flattened.width,
        height: flattened.height,

        async vectorize(mask) {
            await waitForPaint();

            const result = await processor.processFlattened(
                flattened,
                mask,
            );

            if (!result?.svg || !result.image) {
                throw new Error("Vectorization produced no output");
            }

            return result;
        },
    };
}
