import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";

import {
    CompanionClient
} from "../peer/CompanionClient";
import {
    compressImage
} from "../utils/imageCompression";
import {
    MACHINE_CONFIG
} from "@/features/editor/canvas/config";

export type CompanionPageStatus =
    | "invalid"
    | "connecting"
    | "connected"
    | "preview"
    | "uploading"
    | "success"
    | "error";

export function useCompanionSession(
    peerId: string | null
) {
    const clientRef =
        useRef<CompanionClient | null>(
            null
        );

    const previewUrlRef =
        useRef<string | null>(
            null
        );

    const [
        status,
        setStatus
    ] = useState<CompanionPageStatus>(
        peerId
            ? "connecting"
            : "invalid"
    );

    const [
        error,
        setError
    ] = useState<string | null>(
        peerId
            ? null
            : "This page must be opened by scanning the QR code from the editor."
    );

    const [
        selectedFile,
        setSelectedFile
    ] = useState<File | null>(
        null
    );

    const [
        previewUrl,
        setPreviewUrl
    ] = useState<string | null>(
        null
    );

    const [
        progress,
        setProgress
    ] = useState(
        0
    );

    useEffect(() => {
        if (
            !peerId
        ) {
            return;
        }

        const client =
            new CompanionClient();

        clientRef.current =
            client;

        setStatus(
            "connecting"
        );
        setError(
            null
        );

        client.connect(
            peerId
        )
            .then(() => {
                setStatus(
                    "connected"
                );
            })
            .catch(
                (
                    connectError
                ) => {
                    setStatus(
                        "error"
                    );
                    setError(
                        connectError instanceof Error
                            ? connectError.message
                            : "Unable to connect to the editor."
                    );
                }
            );

        return () => {
            client.close();
            clientRef.current =
                null;
        };
    }, [
        peerId
    ]);

    useEffect(() => {
        return () => {
            if (
                previewUrlRef.current
            ) {
                URL.revokeObjectURL(
                    previewUrlRef.current
                );
            }
        };
    }, []);

    const selectFile =
        useCallback(
            (
                file: File
            ) => {
                if (
                    !file.type.startsWith(
                        "image/"
                    )
                ) {
                    setError(
                        "Please choose a supported image file."
                    );
                    return;
                }

                if (
                    previewUrlRef.current
                ) {
                    URL.revokeObjectURL(
                        previewUrlRef.current
                    );
                }

                const nextPreviewUrl =
                    URL.createObjectURL(
                        file
                    );

                previewUrlRef.current =
                    nextPreviewUrl;

                setSelectedFile(
                    file
                );
                setPreviewUrl(
                    nextPreviewUrl
                );
                setProgress(
                    0
                );
                setError(
                    null
                );
                setStatus(
                    "preview"
                );
            },
            []
        );

    const replaceFile =
        useCallback(
            () => {
                if (
                    previewUrlRef.current
                ) {
                    URL.revokeObjectURL(
                        previewUrlRef.current
                    );
                }

                previewUrlRef.current =
                    null;
                setSelectedFile(
                    null
                );
                setPreviewUrl(
                    null
                );
                setProgress(
                    0
                );
                setStatus(
                    "connected"
                );
                setError(
                    null
                );
            },
            []
        );

    const sendImage =
        useCallback(
            async () => {
                const client =
                    clientRef.current;

                if (
                    !client ||
                    !selectedFile
                ) {
                    return;
                }

                try {
                    setStatus(
                        "uploading"
                    );
                    setProgress(
                        15
                    );
                    setError(
                        null
                    );

                    const compressed =
                        await compressImage(
                            selectedFile
                        );

                    setProgress(
                        60
                    );

                    // The captured photo covers the full machine bed, so its
                    // physical size is the bed size in millimetres.
                    await client.sendReferenceImage({
                        image:
                            compressed.image,
                        physical_width:
                            MACHINE_CONFIG.width,
                        physical_height:
                            MACHINE_CONFIG.height,
                        dots_per_mm:
                            compressed.width /
                                MACHINE_CONFIG.width
                    });

                    setProgress(
                        100
                    );
                    setStatus(
                        "success"
                    );
                } catch (sendError) {
                    setStatus(
                        "error"
                    );
                    setError(
                        sendError instanceof Error
                            ? sendError.message
                            : "Unable to transfer the image."
                    );
                }
            },
            [
                selectedFile
            ]
        );

    return {
        status,
        error,
        selectedFile,
        previewUrl,
        progress,
        selectFile,
        replaceFile,
        sendImage
    };
}
