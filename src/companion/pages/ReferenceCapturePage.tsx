import {
    CheckCircle2,
    Loader2,
    WifiOff
} from "lucide-react";
import {
    useMemo
} from "react";

import CameraCapture from "../components/CameraCapture";
import ImagePreview from "../components/ImagePreview";
import TransferProgress from "../components/TransferProgress";
import UploadCard from "../components/UploadCard";
import {
    useCompanionSession
} from "../hooks/useCompanionSession";

function PageShell({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <main
            className="
                min-h-screen
                bg-zinc-100
                px-4
                py-6
                text-zinc-950
            "
        >
            <div className="mx-auto max-w-md">
                <header className="mb-6">
                    <div className="text-[12px] font-semibold uppercase tracking-wide text-zinc-500">
                        Urumi Companion
                    </div>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                        Bed Reference Capture
                    </h1>
                </header>
                {children}
            </div>
        </main>
    );
}

function MessageCard({
    icon,
    title,
    description
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
                {icon}
            </div>
            <h2 className="text-[17px] font-semibold">
                {title}
            </h2>
            <p className="mt-2 text-[13px] leading-5 text-zinc-500">
                {description}
            </p>
        </div>
    );
}

export default function ReferenceCapturePage() {
    const peerId =
        useMemo(
            () =>
                new URLSearchParams(
                    window.location.search
                ).get(
                    "peer"
                ),
            []
        );

    const {
        status,
        error,
        selectedFile,
        previewUrl,
        progress,
        selectFile,
        replaceFile,
        sendImage
    } = useCompanionSession(
        peerId
    );

    if (
        status === "invalid"
    ) {
        return (
            <PageShell>
                <MessageCard
                    icon={
                        <WifiOff size={22} />
                    }
                    title="No editor session found"
                    description="Open this page by scanning the QR code from the desktop editor."
                />
            </PageShell>
        );
    }

    if (
        status === "connecting"
    ) {
        return (
            <PageShell>
                <MessageCard
                    icon={
                        <Loader2
                            size={22}
                            className="animate-spin"
                        />
                    }
                    title="Connecting to editor..."
                    description="Keep the desktop pairing window open while this device connects."
                />
            </PageShell>
        );
    }

    if (
        status === "success"
    ) {
        return (
            <PageShell>
                <MessageCard
                    icon={
                        <CheckCircle2 size={24} />
                    }
                    title="Reference transferred"
                    description="The bed reference image has been sent. You can return to the editor."
                />
            </PageShell>
        );
    }

    if (
        status === "uploading"
    ) {
        return (
            <PageShell>
                <TransferProgress
                    progress={
                        progress
                    }
                />
            </PageShell>
        );
    }

    return (
        <PageShell>
            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
                    {error}
                </div>
            )}

            {status === "preview" &&
            previewUrl ? (
                <ImagePreview
                    previewUrl={
                        previewUrl
                    }
                    fileName={
                        selectedFile?.name
                    }
                    onReplace={
                        replaceFile
                    }
                    onSend={
                        sendImage
                    }
                />
            ) : (
                <div className="space-y-4">
                    <CameraCapture
                        disabled={
                            status === "error"
                        }
                        onFile={
                            selectFile
                        }
                    />
                    <UploadCard
                        disabled={
                            status === "error"
                        }
                        compact
                        onFile={
                            selectFile
                        }
                    />
                </div>
            )}
        </PageShell>
    );
}
