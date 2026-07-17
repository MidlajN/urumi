export type CompanionSessionStatus =
    | "idle"
    | "creating"
    | "waiting"
    | "connected"
    | "receiving"
    | "received"
    | "error";

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

export type CompanionState = {
    status: CompanionSessionStatus;
    peerId: string | null;
    connected: boolean;
    error: string | null;
    reference: {
        exists: boolean;
        visible: boolean;
        opacity: number;
    };
};

export type CompanionStateListener = (
    state: CompanionState
) => void;
