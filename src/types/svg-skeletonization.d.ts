declare module "svg-skeletonization" {
    export type VectorizationMode = "skeleton" | "contour";

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
        process(
            image: HTMLImageElement | HTMLCanvasElement,
            vectorizationMode?: VectorizationMode,
            maskCanvas?: HTMLCanvasElement | null,
        ): Promise<ProcessResult>;
    }
}
