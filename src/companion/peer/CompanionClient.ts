import Peer, { type DataConnection } from "peerjs";

import type {
    CompanionReferencePayload,
    // Messages this client sends (inbound from the editor's perspective).
    CompanionInboundMessage,
    // Messages the editor sends back (its outbound).
    CompanionOutboundMessage,
} from "@/features/companion/types";

export type { CompanionReferencePayload };

export class CompanionClient {
    private peer: Peer | null = null;

    private connection: DataConnection | null = null;

    async connect(desktopPeerId: string) {
        this.close();

        if (!desktopPeerId.trim()) {
            throw new Error("Invalid editor session.");
        }

        const peer = new Peer();

        this.peer = peer;

        await new Promise<void>((resolve, reject) => {
            peer.once("open", () => resolve());

            peer.once("error", reject);
        });

        const connection = peer.connect(desktopPeerId, {
            reliable: true,
        });

        await new Promise<void>((resolve, reject) => {
            const timeout = window.setTimeout(() => {
                cleanup();
                reject(new Error("Unable to connect to the editor."));
            }, 15000);

            const handleOpen = () => {
                cleanup();
                resolve();
            };

            const handleError = (error: Error) => {
                cleanup();
                reject(error);
            };

            const handleClose = () => {
                cleanup();
                reject(new Error("The editor disconnected before pairing completed."));
            };

            const cleanup = () => {
                window.clearTimeout(timeout);
                connection.off("open", handleOpen);
                connection.off("error", handleError);
                connection.off("close", handleClose);
            };

            connection.once("open", handleOpen);

            connection.once("error", handleError);

            connection.once("close", handleClose);
        });

        this.connection = connection;

        this.send({
            type: "MOBILE_APP_READY",
        });
    }

    async sendReferenceImage(payload: CompanionReferencePayload) {
        const connection = this.connection;

        if (!connection || !connection.open) {
            throw new Error("Editor connection is not open.");
        }

        await new Promise<void>((resolve, reject) => {
            const timeout = window.setTimeout(() => {
                cleanup();
                reject(new Error("The editor did not acknowledge the transfer."));
            }, 30000);

            const handleData = (data: unknown) => {
                const editorMessage = data as CompanionOutboundMessage;

                if (editorMessage.type === "received") {
                    cleanup();
                    resolve();
                }
            };

            const handleClose = () => {
                cleanup();
                reject(new Error("The editor disconnected during transfer."));
            };

            const handleError = (error: Error) => {
                cleanup();
                reject(error);
            };

            const cleanup = () => {
                window.clearTimeout(timeout);
                connection.off("data", handleData);
                connection.off("close", handleClose);
                connection.off("error", handleError);
            };

            connection.on("data", handleData);
            connection.once("close", handleClose);
            connection.once("error", handleError);

            this.send({
                type: "PROCESSING_COMPLETE",
                payload,
            });
        });
    }

    close() {
        this.connection?.close();
        this.connection = null;

        this.peer?.destroy();
        this.peer = null;
    }

    private send(message: CompanionInboundMessage) {
        this.connection?.send(message);
    }
}
