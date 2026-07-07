import Peer, { type DataConnection } from "peerjs";

import type {
  CompanionInboundMessage,
  CompanionOutboundMessage,
} from "../types";
import type {
  CompanionConnectionListener,
  CompanionTransport,
} from "./CompanionTransport";

export class PeerTransport implements CompanionTransport {
    private peer: Peer | null = null;

    private connection: DataConnection | null = null;

    private messageListeners = new Set<
        (message: CompanionInboundMessage) => void
    >();

    private connectionListeners = new Set<CompanionConnectionListener>();

    createSession() {
        this.closeSession();

        return new Promise<{ peerId: string; }>((resolve, reject) => {
            const peer = new Peer({
                debug: 3
            });

            this.peer = peer;

            peer.on("open", (id) =>
                resolve({
                    peerId: id,
                }),
            );

            peer.on("connection", (connection) => {
                this.bindConnection(connection);

                console.log(connection);

                console.log(connection.peer);
                console.log(connection.connectionId);
                console.log(connection.open);

                console.log((connection as any)._negotiator);
                console.log((connection as any).peerConnection);
                console.log((connection as any)._peerConnection);
            });

            peer.on("connection", () => {
                console.log("Desktop: incoming connection");
            });

            peer.on("error", (error) => {
                this.emitConnectionStatus("error", error);
                reject(error);
            });
        });
    }

    closeSession() {
        this.connection?.close();
        this.connection = null;

        this.peer?.destroy();
        this.peer = null;
    }

    send(message: CompanionOutboundMessage) {
        if (this.connection?.open) {
        this.connection.send(message);
        }
    }

    onMessage(listener: (message: CompanionInboundMessage) => void) {
        this.messageListeners.add(listener);

        return () => this.messageListeners.delete(listener);
    }

    onConnectionStatus(listener: CompanionConnectionListener) {
        this.connectionListeners.add(listener);

        return () => this.connectionListeners.delete(listener);
    }

    private bindConnection(connection: DataConnection) {
        console.log("Desktop: bindConnection");

        this.connection?.close();
        this.connection = connection;

        connection.on("open", () => {
            console.log("Desktop: connection open");
            this.emitConnectionStatus("connected");
        });

        connection.on("data", (data) => {
            console.log("Desktop: received", data);
            this.messageListeners.forEach((listener) =>
                listener(data as CompanionInboundMessage),
            );
        });

        connection.on("close", () => {
            console.log("Desktop: connection closed");
            this.emitConnectionStatus("closed");
        });

        connection.on("error", (error) => {
            console.log("Desktop: connection error", error);
            this.emitConnectionStatus("error", error);
        });

    }

    private emitConnectionStatus(
        status: "connected" | "closed" | "error",
        error?: Error,
    ) {
        this.connectionListeners.forEach((listener) => listener(status, error));
    }
}
