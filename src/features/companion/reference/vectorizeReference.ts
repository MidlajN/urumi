import { ImageProcessor, type ProcessResult } from "svg-skeletonization";

export type VectorizedReference = ProcessResult;

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

async function waitForOpenCv() {
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

function loadImageElement(dataUrl: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);

        image.onerror = () =>
            reject(new Error("Unable to load reference image for vectorization"));

        image.src = dataUrl;
    });
}

/**
 * Runs the svg-skeletonization pipeline on the received bed image. Returns the
 * vectorized drawings as SVG (viewBox in physical millimetres), the
 * perspective-corrected bed image, and the measured physical dimensions.
 */
export async function vectorizeReferenceImage(
    dataUrl: string,
): Promise<VectorizedReference> {
    await waitForOpenCv();

    const image = await loadImageElement(dataUrl);

    // processor.process blocks the main thread; make sure the progress UI is
    // on screen before it starts.
    await waitForPaint();

    const processor = new ImageProcessor();

    const result = await processor.process(image, "skeleton");

    if (!result?.svg || !result.image) {
        throw new Error("Vectorization produced no output");
    }

    console.log('svg : ' , result)

    return result;
}
