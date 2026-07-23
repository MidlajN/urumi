export type CompanionSessionStatus =
    | "idle"
    | "creating"
    | "waiting"
    | "connected"
    | "receiving"
    | "reviewing"
    | "received"
    | "error";

/** ArUco-corrected capture awaiting the user's detection-area selection. */
export type CompanionReviewImage = {
    /** Corrected bed image as a data URL. */
    image: string;

    /** Corrected image size in pixels — the lasso coordinate space. */
    width: number;

    height: number;
};

/**
 * Messages received from the companion app.
 */
export type CompanionReadyMessage = {
    type: "MOBILE_APP_READY";
};

export type CompanionReferencePayload = {
    /** Data URL, e.g. "data:image/jpeg;base64,..." */
    image: string;

    /** Bed width in millimetres. */
    physical_width: number;

    /** Bed height in millimetres. */
    physical_height: number;

    dots_per_mm: number;
};

export type CompanionReferenceMessage = {
    type: "PROCESSING_COMPLETE";

    payload: CompanionReferencePayload;
};

export type CompanionInboundMessage =
    | CompanionReadyMessage
    | CompanionReferenceMessage;

/**
 * Messages sent to the companion app.
 */
export type CompanionReceivedMessage = {
    type: "received";
};

export type CompanionOutboundMessage =
    | CompanionReceivedMessage;

/**
 * Pipeline stage while a received image is being processed into the editor.
 */
export type CompanionReceiveStage =
    | "idle"
    | "vectorizing"
    | "placing"
    | "done";

export type CompanionProgress = {
    stage: CompanionReceiveStage;

    /** Non-fatal problem, e.g. vectorization failed and the raw photo was used. */
    warning: string | null;

    /** Number of vectorized drawing objects added to the canvas. */
    pathCount: number | null;
};

export type CompanionState = {
    status: CompanionSessionStatus;
    peerId: string | null;
    connected: boolean;
    error: string | null;
    progress: CompanionProgress;
    review: CompanionReviewImage | null;
    reference: {
        exists: boolean;
        visible: boolean;
        opacity: number;
    };
};

export function createInitialCompanionState(): CompanionState {
    return {
        status: "idle",
        peerId: null,
        connected: false,
        error: null,
        progress: {
            stage: "idle",
            warning: null,
            pathCount: null,
        },
        review: null,
        reference: {
            exists: false,
            visible: true,
            opacity: 0.5,
        },
    };
}

export type CompanionStateListener = (
    state: CompanionState
) => void;
