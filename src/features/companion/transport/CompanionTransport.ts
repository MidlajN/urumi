import type {
    CompanionInboundMessage,
    CompanionOutboundMessage
} from "../types";

export type CompanionSession = {
    peerId: string;
};

export type CompanionConnectionStatus =
    | "connected"
    | "closed"
    | "error";

export type CompanionConnectionListener = (
    status: CompanionConnectionStatus,
    error?: Error
) => void;

export interface CompanionTransport {
    createSession: () => Promise<CompanionSession>;
    closeSession: () => void;
    send: (
        message: CompanionOutboundMessage
    ) => void;
    onMessage: (
        listener: (
            message: CompanionInboundMessage
        ) => void
    ) => () => void;
    onConnectionStatus: (
        listener: CompanionConnectionListener
    ) => () => void;
}
