import type {
    Canvas,
    Rect
} from "fabric";

import {
    getCompanionReferenceUrl
} from "./config";
import {
    PeerTransport
} from "./transport/PeerTransport";
import type {
    CompanionTransport
} from "./transport/CompanionTransport";
import {
    ReferenceLayerManager
} from "./reference/ReferenceLayerManager";
import {
    COMPANION_PROTOCOL_VERSION,
    type CompanionInboundMessage,
    type CompanionReferenceImageMessage,
    type CompanionState,
    type CompanionStateListener
} from "./types";

export class CompanionManager {
    private transport: CompanionTransport;

    private referenceLayer: ReferenceLayerManager;

    private listeners =
        new Set<CompanionStateListener>();

    private state: CompanionState = {
        status:
            "idle",
        peerId:
            null,
        connected:
            false,
        error:
            null,
        reference: {
            exists:
                false,
            visible:
                true,
            opacity:
                0.5
        }
    };

    constructor(
        canvas: Canvas,
        getWorkspace: () => Rect,
        transport: CompanionTransport =
            new PeerTransport()
    ) {
        this.transport =
            transport;

        this.referenceLayer =
            new ReferenceLayerManager(
                canvas,
                getWorkspace
            );

        this.transport.onMessage(
            this.handleMessage
        );

        this.transport.onConnectionStatus(
            (
                status,
                error
            ) => {
                if (
                    status === "connected"
                ) {
                    this.setState({
                        status:
                            "connected",
                        connected:
                            true,
                        error:
                            null
                    });

                    this.transport.send({
                        version:
                            COMPANION_PROTOCOL_VERSION,
                        type:
                            "ready"
                    });
                }

                if (
                    status === "closed"
                ) {
                    this.setState({
                        connected:
                            false,
                        status:
                            this.state.reference.exists
                                ? "received"
                                : "waiting"
                    });
                }

                if (
                    status === "error"
                ) {
                    this.setState({
                        status:
                            "error",
                        connected:
                            false,
                        error:
                            error?.message ??
                            "Companion connection failed"
                    });
                }
            }
        );
    }

    async createReferenceSession() {
        this.setState({
            status:
                "creating",
            peerId:
                null,
            connected:
                false,
            error:
                null
        });

        try {
            const session =
                await this.transport.createSession();

            this.setState({
                status:
                    "waiting",
                peerId:
                    session.peerId,
                connected:
                    false,
                error:
                    null
            });
        } catch (error) {
            this.setState({
                status:
                    "error",
                error:
                    error instanceof Error
                        ? error.message
                        : "Unable to create companion session"
            });
        }
    }

    closeReferenceSession() {
        this.transport.closeSession();
        this.setState({
            status:
                this.state.reference.exists
                    ? "received"
                    : "idle",
            peerId:
                null,
            connected:
                false
        });
    }

    getReferenceUrl() {
        // console.log("Manager peerId:", this.state.peerId);

        return this.state.peerId
            ? getCompanionReferenceUrl(
                this.state.peerId
            )
            : "";
    }

    setReferenceOpacity(
        opacity: number
    ) {
        this.referenceLayer.setOpacity(
            opacity
        );
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

    getReferenceSource() {
        return this.referenceLayer.getSource();
    }

    async replaceReferenceSource(
        message: CompanionReferenceImageMessage
    ) {
        this.setState({
            status:
                "receiving",
            error:
                null
        });

        try {
            await this.referenceLayer.replaceSource(
                message
            );

            this.syncReferenceState({
                status:
                    "received"
            });
        } catch (error) {
            this.setState({
                status:
                    "error",
                error:
                    error instanceof Error
                        ? error.message
                        : "Unable to update reference image"
            });
        }
    }

    subscribe(
        listener: CompanionStateListener
    ) {
        this.listeners.add(
            listener
        );
        listener(
            this.state
        );

        return () => {
            this.listeners.delete(
                listener
            );
        };
    }

    getState() {
        return this.state;
    }

    destroy() {
        this.transport.closeSession();
        this.referenceLayer.destroy();
        this.listeners.clear();
    }

    private handleMessage =
        async (
            message: CompanionInboundMessage
        ) => {
            if (
                message.version !==
                COMPANION_PROTOCOL_VERSION
            ) {
                return;
            }

            if (
                message.type ===
                "reference-image"
            ) {
                this.setState({
                    status:
                        "receiving"
                });

                await this.referenceLayer.loadImage(
                    message
                );

                this.transport.send({
                    version:
                        COMPANION_PROTOCOL_VERSION,
                    type:
                        "received"
                });

                this.syncReferenceState({
                    status:
                        "received"
                });
            }
        };

    private syncReferenceState(
        patch: Partial<CompanionState> = {}
    ) {
        this.setState({
            ...patch,
            reference:
                this.referenceLayer.getState()
        });
    }

    private setState(
        patch: Partial<CompanionState>
    ) {
        this.state = {
            ...this.state,
            ...patch
        };

        this.listeners.forEach(
            (
                listener
            ) =>
                listener(
                    this.state
                )
        );
    }
}
