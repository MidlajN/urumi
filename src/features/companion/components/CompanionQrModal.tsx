import {
    X
} from "lucide-react";
import {
    QRCodeSVG
} from "qrcode.react";
import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    COMPANION_APP_URL
} from "../config";
import type {
    CompanionManager
} from "../CompanionManager";
import type {
    CompanionState
} from "../types";

const initialState: CompanionState = {
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

export default function CompanionQrModal({
    manager,
    open,
    onClose
}: {
    manager: CompanionManager | null;
    open: boolean;
    onClose: () => void;
}) {
    const [
        state,
        setState
    ] = useState(
        initialState
    );

    useEffect(() => {
        if (
            !manager ||
            !open
        ) {
            return;
        }

        return manager.subscribe(
            setState
        );
    }, [
        manager,
        open
    ]);
     

    const referenceUrl = useMemo(() => {
        if (!state.peerId || !COMPANION_APP_URL) {
            return "";
        }

        const url = new URL(`${COMPANION_APP_URL}/reference`);
        url.searchParams.set("peer", state.peerId);

        return url.toString();
    }, [state.peerId]);
    if (
        !open
    ) {
        return null;
    }

    const missingConfig =
        !COMPANION_APP_URL;

    const statusLabel =
        state.status === "creating"
            ? "Creating session"
            : state.status === "waiting"
                ? "Waiting for companion"
                : state.status === "connected"
                    ? "Connected, waiting for image"
                    : state.status === "receiving"
                        ? "Receiving reference"
                        : state.status === "received"
                            ? "Reference received"
                            : state.status === "error"
                                ? "Connection error"
                                : "Ready";

    return (
        <div
            className="
                fixed
                inset-0
                z-200
                flex
                items-center
                justify-center
                bg-zinc-950/30
                px-4
            "
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }
            }}
        >
            <div
                className="
                    w-full
                    max-w-sm
                    rounded-xl
                    border
                    border-zinc-200
                    bg-white
                    p-4
                    shadow-2xl
                "
            >
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-[15px] font-semibold text-zinc-950">
                            Capture Bed Reference
                        </h2>
                        <p className="mt-1 text-[12px] font-medium text-zinc-500">
                            Scan from the companion app
                        </p>
                    </div>

                    <button
                        type="button"
                        aria-label="Close companion modal"
                        onClick={
                            onClose
                        }
                        className="
                            flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-md
                            text-zinc-500
                            hover:bg-zinc-100
                            hover:text-zinc-900
                        "
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                    {missingConfig ? (
                        <div className="rounded-md bg-white px-3 py-4 text-center text-[13px] font-medium text-zinc-700">
                            Set VITE_COMPANION_APP_URL to enable QR pairing.
                        </div>
                    ) : referenceUrl ? (
                        <div className="flex justify-center rounded-md bg-white p-3">
                            <QRCodeSVG
                                value={
                                    referenceUrl
                                }
                                size={192}
                                level="M"
                            />
                        </div>
                    ) : (
                        <div className="flex h-54.5 items-center justify-center rounded-md bg-white text-[13px] font-medium text-zinc-500">
                            Preparing session...
                        </div>
                    )}
                </div>

                <div className="mt-4 rounded-md bg-zinc-50 px-3 py-2">
                    <div className="flex items-center justify-between text-[12px] font-semibold">
                        <span className="text-zinc-500">
                            Status
                        </span>
                        <span className="text-zinc-900">
                            {statusLabel}
                        </span>
                    </div>
                    {referenceUrl && (
                        <div className="mt-2 truncate text-[11px] font-medium text-zinc-400">
                            {referenceUrl}
                        </div>
                    )}
                    {state.peerId && (
                        <div className="mt-1 truncate text-[11px] font-medium text-zinc-400">
                            peerId: {state.peerId}
                        </div>
                    )}
                    {state.error && (
                        <div className="mt-2 text-[12px] font-medium text-red-600">
                            {state.error}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={
                        onClose
                    }
                    className="
                        mt-4
                        h-9
                        w-full
                        rounded-md
                        border
                        border-zinc-200
                        text-[13px]
                        font-semibold
                        text-zinc-700
                        hover:bg-zinc-50
                    "
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
