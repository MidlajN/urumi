declare module "svg-skeletonization" {
    export type ProcessMeta = {
        dots_per_mm?: number;
        physical_width?: number;
        physical_height?: number;
    };

    export type ProcessResult = {
        svg: string;
        /** Perspective-corrected bed image as a JPEG data URL. */
        image: string;
        meta: ProcessMeta;
    };

    export class ImageProcessor {
        /**
         * One-shot pipeline: warp, extract, vectorize. `maskCanvas` (white =
         * selected, in the source image's pixel space) is corrected together
         * with the image.
         */
        process(
            image: HTMLImageElement | HTMLCanvasElement,
            maskCanvas?: HTMLCanvasElement | null,
        ): Promise<ProcessResult>;

        /**
         * Step one: detect the ArUco frame and return the flattened,
         * distortion-free bed image. Stores the frame calibration on this
         * instance for a following processFlattened call.
         */
        flatten(
            image: HTMLImageElement | HTMLCanvasElement,
        ): Promise<HTMLCanvasElement>;

        /**
         * Step two: extract and vectorize a flattened image. `maskCanvas`
         * (white = selected, in flattened-image pixels) limits detection.
         * Must run on the same instance that produced the flattened image.
         */
        processFlattened(
            flattened: HTMLCanvasElement,
            maskCanvas?: HTMLCanvasElement | null,
        ): Promise<ProcessResult>;
    }
}
