import type { Canvas, Rect } from "fabric";

import { PeerTransport } from "./transport/PeerTransport";
import type { CompanionTransport } from "./transport/CompanionTransport";
import { ReferenceLayerManager } from "./reference/ReferenceLayerManager";
import { flattenReferenceImage } from "./reference/vectorizeReference";
import { compressImage } from "@/companion/utils/imageCompression";
import { MACHINE_CONFIG } from "@/features/editor/canvas/config";
import {
  createInitialCompanionState,
  type CompanionInboundMessage,
  type CompanionProgress,
  type CompanionReferencePayload,
  type CompanionSessionStatus,
  type CompanionState,
  type CompanionStateListener,
} from "./types";
import type {
  FlattenedReference,
  VectorizedReference,
} from "./reference/vectorizeReference";

type PendingReview = {
    flattened: FlattenedReference;
    payload: CompanionReferencePayload;
};

export class CompanionManager {
    private transport: CompanionTransport;

    private referenceLayer: ReferenceLayerManager;

    private listeners = new Set<CompanionStateListener>();

    private state: CompanionState = createInitialCompanionState();

    private pendingReview: PendingReview | null = null;

    constructor(
        canvas: Canvas,
        getWorkspace: () => Rect,
        transport: CompanionTransport = new PeerTransport(),
    ) {
        this.transport = transport;

        this.referenceLayer = new ReferenceLayerManager(canvas, getWorkspace);

        this.transport.onMessage(this.handleMessage);

        this.transport.onConnectionStatus((status, error) => {
            if (status === "connected") {
                this.setState({
                    status: "connected",
                    connected: true,
                    error: null,
                });
            }

            if (status === "closed") {
                this.setState({
                    connected: false,
                    status: this.state.reference.exists ? "received" : "waiting",
                });
            }

            if (status === "error") {
                this.setState({
                    status: "error",
                    connected: false,
                    error: error?.message ?? "Companion connection failed",
                });
            }
        });
    }

    async createReferenceSession() {
        this.setState({
            status: "creating",
            peerId: null,
            connected: false,
            error: null,
        });

        try {
            const session = await this.transport.createSession();

            this.setState({
                status: "waiting",
                peerId: session.peerId,
                connected: false,
                error: null,
            });
        } catch (error) {
            this.setState({
                status: "error",
                error:
                error instanceof Error
                    ? error.message
                    : "Unable to create companion session",
            });
        }
    }

    closeReferenceSession() {
        this.cancelReferenceReview();

        this.transport.closeSession();

        this.setState({
            status: this.state.reference.exists ? "received" : "idle",
            peerId: null,
            connected: false,
        });
    }

    setReferenceOpacity(opacity: number) {
        this.referenceLayer.setOpacity(opacity);
        this.syncReferenceState();
    }

    toggleReferenceVisibility() {
        this.referenceLayer.toggleVisibility();
        this.syncReferenceState();
    }

    removeReference() {
        this.referenceLayer.remove();
        this.syncReferenceState();
    }

    resetReference() {
        this.referenceLayer.reset();
        this.syncReferenceState();
    }

    subscribe(listener: CompanionStateListener) {
        this.listeners.add(listener);
        listener(this.state);

        return () => {
            this.listeners.delete(listener);
        };
    }

    getState() {
        return this.state;
    }

    destroy() {
        this.pendingReview = null;
        this.transport.closeSession();
        this.referenceLayer.destroy();
        this.listeners.clear();
    }

    /**
     * Loads a reference image picked from the local filesystem, bypassing
     * the phone companion. Runs the exact same vectorize-and-place
     * pipeline as a companion capture; the photo is assumed to cover the
     * whole bed, mirroring the companion app's framing.
     */
    async importReferenceFile(file: File) {
        this.setState({
            status: "receiving",
            error: null,
        });

        this.setProgress({
            stage: "vectorizing",
            warning: null,
            pathCount: null,
        });

        let compressed;

        try {
            compressed = await compressImage(file);
        } catch (error) {
            this.setProgress({
                stage: "idle",
            });

            this.setState({
                status: "error",
                error:
                error instanceof Error
                    ? error.message
                    : "Unable to read this image.",
            });

            return;
        }

        await this.processReferencePayload(
            {
                image: compressed.image,
                physical_width: MACHINE_CONFIG.width,
                physical_height: MACHINE_CONFIG.height,
                dots_per_mm: compressed.width / MACHINE_CONFIG.width,
            },
            { acknowledge: false },
        );
    }

    private handleMessage = async (message: CompanionInboundMessage) => {
        if (message.type === "MOBILE_APP_READY") {
            this.setState({
                status: "connected",
                connected: true,
                error: null,
            });

            return;
        }

        if (message.type === "PROCESSING_COMPLETE") {
            await this.processReferencePayload(message.payload, {
                acknowledge: true,
            });
        }
    };

    /**
     * The bed is landscape; portrait captures are rotated 90° so the photo
     * lands in the bed's orientation when vectorization is unavailable.
     */
    private async ensureLandscapePayload(
        payload: CompanionReferencePayload,
    ): Promise<CompanionReferencePayload> {
        const rotated = await rotateImage90(payload.image);

        if (!rotated) {
            return payload;
        }

        return {
            image: rotated.image,
            physical_width: MACHINE_CONFIG.width,
            physical_height: MACHINE_CONFIG.height,
            dots_per_mm: rotated.width / MACHINE_CONFIG.width,
        };
    }

    /**
     * The corrected capture follows the ArUco frame's own (portrait)
     * orientation regardless of how the photo was taken. Rotate the
     * corrected image, the vector SVG and the measured dimensions together
     * so everything lands in the bed's landscape orientation.
     */
    private async rotateVectorizedToLandscape(
        vectorized: VectorizedReference,
    ): Promise<VectorizedReference> {
        const rotatedSvg = rotateSvgToLandscape(vectorized.svg);

        const rotatedImage = await rotateImage90(vectorized.image);

        if (!rotatedSvg || !rotatedImage) {
            return vectorized;
        }

        return {
            image: rotatedImage.image,
            svg: rotatedSvg,
            meta: {
                ...vectorized.meta,
                physical_width: vectorized.meta.physical_height,
                physical_height: vectorized.meta.physical_width,
            },
        };
    }

    /**
     * Flattens the received capture (ArUco warp), then pauses in the
     * "reviewing" state so the user can lasso detection areas on the flat,
     * distortion-free view. confirmReferenceSelection / cancelReferenceReview
     * continue the flow. If the frame can't be detected the raw photo loads
     * as the overlay, skipping the selection step.
     */
    private async processReferencePayload(
        payload: CompanionReferencePayload,
        options: { acknowledge: boolean },
    ) {
        this.setState({
            status: "receiving",
        });

        this.setProgress({
            stage: "vectorizing",
            warning: null,
            pathCount: null,
        });

        try {
            payload = await this.ensureLandscapePayload(payload);

            // Ack as soon as the capture is safely in the editor — the
            // review step can take arbitrarily long and the phone only
            // waits a few seconds for confirmation.
            if (options.acknowledge) {
                this.transport.send({
                    type: "received",
                });
            }

            let flattened: FlattenedReference | null = null;

            try {
                flattened = await flattenReferenceImage(payload.image);
            } catch (flattenError) {
                console.warn(
                    "Reference flatten failed",
                    flattenError,
                );

                this.setProgress({
                    warning:
                        "Bed frame not detected — showing the photo only.",
                });
            }

            if (!flattened) {
                await this.placeReference(null, payload);

                return;
            }

            this.pendingReview = {
                flattened,
                payload,
            };

            this.setState({
                status: "reviewing",
                review: {
                    image: flattened.image,
                    width: flattened.width,
                    height: flattened.height,
                },
            });
        } catch (error) {
            this.failReference(error);
        }
    }

    /**
     * Continues the paused pipeline with the user's detection-area mask
     * (white = selected, in flattened-image pixels; null = whole bed).
     */
    async confirmReferenceSelection(mask: HTMLCanvasElement | null) {
        const pending = this.pendingReview;

        if (!pending) {
            return;
        }

        this.pendingReview = null;

        this.setState({
            status: "receiving",
            review: null,
        });

        this.setProgress({
            stage: "vectorizing",
        });

        try {
            // Vectorization failure is non-fatal — the raw photo still
            // loads as the overlay.
            let vectorized: VectorizedReference | null = null;

            try {
                vectorized = await pending.flattened.vectorize(mask);
            } catch (vectorizationError) {
                console.warn(
                    "Reference vectorization failed",
                    vectorizationError,
                );

                this.setProgress({
                    warning:
                        "Drawings could not be vectorized — showing the photo only.",
                });
            }

            if (vectorized) {
                vectorized =
                    await this.rotateVectorizedToLandscape(vectorized);
            }

            await this.placeReference(vectorized, pending.payload);
        } catch (error) {
            this.failReference(error);
        }
    }

    /** Discards the paused capture and returns to the pre-receive state. */
    cancelReferenceReview() {
        const pending = this.pendingReview;

        if (!pending) {
            return;
        }

        this.pendingReview = null;

        const returnStatus: CompanionSessionStatus = this.state.connected
            ? "connected"
            : this.state.peerId
                ? "waiting"
                : this.state.reference.exists
                    ? "received"
                    : "idle";

        this.setState({
            status: returnStatus,
            review: null,
        });

        this.setProgress({
            stage: "idle",
            warning: null,
            pathCount: null,
        });
    }

    private async placeReference(
        vectorized: VectorizedReference | null,
        payload: CompanionReferencePayload,
    ) {
        this.setProgress({
            stage: "placing",
        });

        // Prefer the pipeline's perspective-corrected image and its
        // measured physical size over the raw payload.
        const overlayPayload: CompanionReferencePayload = vectorized
            ? {
                image: vectorized.image,
                physical_width:
                    vectorized.meta.physical_width ??
                    payload.physical_width,
                physical_height:
                    vectorized.meta.physical_height ??
                    payload.physical_height,
                dots_per_mm:
                    vectorized.meta.dots_per_mm ??
                    payload.dots_per_mm,
            }
            : payload;

        await this.referenceLayer.loadImage(overlayPayload);

        let pathCount = 0;

        if (vectorized) {
            const objects = await this.referenceLayer.addVectorizedSvg(
                vectorized.svg,
            );

            pathCount = objects.length;
        }

        this.syncReferenceState({
            status: "received",
        });

        this.setProgress({
            stage: "done",
            pathCount: vectorized ? pathCount : null,
        });
    }

    private failReference(error: unknown) {
        this.setProgress({
            stage: "idle",
        });

        this.setState({
            status: "error",
            review: null,
            error:
            error instanceof Error
                ? error.message
                : "Unable to load reference image",
        });
    }

  private setProgress(patch: Partial<CompanionProgress>) {
    this.setState({
      progress: {
        ...this.state.progress,
        ...patch,
      },
    });
  }

  private syncReferenceState(patch: Partial<CompanionState> = {}) {
    this.setState({
      ...patch,
      reference: this.referenceLayer.getState(),
    });
  }

  private setState(patch: Partial<CompanionState>) {
    this.state = {
      ...this.state,
      ...patch,
    };

    this.listeners.forEach((listener) => listener(this.state));
  }
}

function loadImageElement(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);

        image.onerror = () =>
            reject(new Error("Unable to read this image."));

        image.src = src;
    });
}

/**
 * Rotates a portrait image 90° clockwise. Returns null when the image is
 * already landscape (or a 2d context is unavailable).
 */
async function rotateImage90(src: string) {
    const image = await loadImageElement(src);

    if (image.naturalWidth >= image.naturalHeight) {
        return null;
    }

    const canvas = document.createElement("canvas");

    canvas.width = image.naturalHeight;
    canvas.height = image.naturalWidth;

    const context = canvas.getContext("2d");

    if (!context) {
        return null;
    }

    context.translate(canvas.width, 0);
    context.rotate(Math.PI / 2);
    context.drawImage(image, 0, 0);

    return {
        image: canvas.toDataURL("image/jpeg", 0.85),
        width: canvas.width,
        height: canvas.height,
    };
}

/**
 * Rewrites a portrait SVG so its content is rotated 90° clockwise into
 * landscape: swaps the root dimensions and wraps the markup in a rotation
 * group (fabric's SVG parser flattens parent transforms onto each path).
 * Returns null when the SVG is already landscape or cannot be parsed.
 */
function rotateSvgToLandscape(svg: string): string | null {
    const openTagMatch = svg.match(/<svg[^>]*>/i);

    const closeIndex = svg.lastIndexOf("</svg>");

    if (!openTagMatch || openTagMatch.index === undefined || closeIndex < 0) {
        return null;
    }

    const openTag = openTagMatch[0];

    const viewBoxMatch = openTag.match(/viewBox\s*=\s*"([^"]+)"/i);

    if (!viewBoxMatch) {
        return null;
    }

    const parts = viewBoxMatch[1]
        .trim()
        .split(/[\s,]+/)
        .map(Number);

    if (parts.length !== 4 || parts.some(Number.isNaN)) {
        return null;
    }

    const [minX, minY, width, height] = parts;

    if (width >= height) {
        return null;
    }

    let rotatedOpenTag = openTag.replace(
        viewBoxMatch[0],
        `viewBox="0 0 ${height} ${width}"`,
    );

    const widthMatch = rotatedOpenTag.match(/\swidth\s*=\s*"([^"]*)"/i);

    const heightMatch = rotatedOpenTag.match(/\sheight\s*=\s*"([^"]*)"/i);

    if (widthMatch && heightMatch) {
        rotatedOpenTag = rotatedOpenTag
            .replace(widthMatch[0], ` width="${heightMatch[1]}"`)
            .replace(heightMatch[0], ` height="${widthMatch[1]}"`);
    }

    const inner = svg.slice(
        openTagMatch.index + openTag.length,
        closeIndex,
    );

    return (
        rotatedOpenTag +
        `<g transform="translate(${height + minY} ${-minX}) rotate(90)">` +
        inner +
        "</g></svg>"
    );
}
