import Peer, { type DataConnection } from "peerjs";

const PROTOCOL_VERSION = 1;

type ReadyMessage = {
  version: 1;
  type: "ready";
};

type ReceivedMessage = {
  version: 1;
  type: "received";
};

type ReferenceImageMessage = {
  version: 1;
  type: "reference-image";
  mime: "image/jpeg";
  width: number;
  height: number;
  data: ArrayBuffer;
};

type DesktopMessage = ReadyMessage | ReceivedMessage;

export type ReferenceImagePayload = Omit<
  ReferenceImageMessage,
  "version" | "type"
>;

export class CompanionClient {
    private peer: Peer | null = null;

    private connection: DataConnection | null = null;

    async connect(desktopPeerId: string) {
        this.close();

        if (!desktopPeerId.trim()) {
            throw new Error("Invalid editor session.");
        }

        const peer = new Peer({
            debug: 3
        });

        this.peer = peer;

        await new Promise<void>((resolve, reject) => {
            peer.once("open", () => resolve());

            peer.once("open", () => {
                console.log("Mobile: peer created");
            });

            peer.once("error", reject);
        });

        const connection = peer.connect(desktopPeerId, {
            reliable: true,
        });


        console.log(connection);

        console.log(connection.peer);
        console.log(connection.connectionId);
        console.log(connection.open);

        console.log((connection as any)._negotiator);
        console.log((connection as any).peerConnection);
        console.log((connection as any)._peerConnection);

        console.log("Connection object", connection);
        console.log("Initially open?", connection.open);

        connection.on("open", () => {
            console.log("OPEN EVENT");
        });

        setInterval(() => {
            console.log("Polling open:", connection.open);
        }, 1000);

        await new Promise<void>((resolve, reject) => {
            connection.once("open", () => {
                console.log("Connection opened");
                resolve();
            });

            connection.once("error", reject);

            connection.once("close", () => {
                reject(new Error("Connection closed"));
            });
        });

        this.connection = connection;

        await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
            cleanup();
            reject(new Error("Unable to connect to the editor."));
        }, 15000);

        const handleData = (data: unknown) => {
            const desktopMessage = data as DesktopMessage;

            if (
            desktopMessage.version === PROTOCOL_VERSION &&
            desktopMessage.type === "ready"
            ) {
            cleanup();
            resolve();
            }
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
            connection.off("data", handleData);
            connection.off("error", handleError);
            connection.off("close", handleClose);
        };

        connection.on("data", handleData);

        connection.once("error", handleError);

        connection.once("close", handleClose);
        });
    }

    async sendReferenceImage(payload: ReferenceImagePayload) {
        const connection = this.connection;

        if (!connection || !connection.open) {
        throw new Error("Editor connection is not open.");
        }

        const message: ReferenceImageMessage = {
        version: PROTOCOL_VERSION,
        type: "reference-image",
        ...payload,
        };

        await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
            cleanup();
            reject(new Error("The editor did not acknowledge the transfer."));
        }, 30000);

        const handleData = (data: unknown) => {
            const desktopMessage = data as DesktopMessage;

            if (
            desktopMessage.version === PROTOCOL_VERSION &&
            desktopMessage.type === "received"
            ) {
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

        connection.send(message);
        });
    }

    close() {
        this.connection?.close();
        this.connection = null;

        this.peer?.destroy();
        this.peer = null;
    }
}
