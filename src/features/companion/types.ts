export const COMPANION_PROTOCOL_VERSION =
    1;

export type CompanionSessionStatus =
    | "idle"
    | "creating"
    | "waiting"
    | "connected"
    | "receiving"
    | "received"
    | "error";

export type CompanionReadyMessage = {
    version: 1;
    type: "ready";
};

export type CompanionReceivedMessage = {
    version: 1;
    type: "received";
};

export type CompanionReferenceImageMessage = {
    version: 1;
    type: "reference-image";
    mime: "image/jpeg" | "image/png" | string;
    width: number;
    height: number;
    data: ArrayBuffer;
};

export type CompanionOutboundMessage =
    | CompanionReadyMessage
    | CompanionReceivedMessage;

export type CompanionInboundMessage =
    | CompanionReferenceImageMessage;

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
