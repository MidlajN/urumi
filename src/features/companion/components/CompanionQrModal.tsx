import {
    Check,
    CheckCircle2,
    ImageDown,
    LoaderCircle,
    Route,
    Scan,
    TriangleAlert,
    Upload,
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
import {
    createInitialCompanionState,
    type CompanionProgress
} from "../types";
import ReferenceReviewStage from "./ReferenceReviewStage";

const initialState = createInitialCompanionState();

type StepState = "pending" | "active" | "done";

const RECEIVE_STEPS = [
    {
        key: "received",
        label: "Image received",
        detail: "Capture handed to the editor",
        icon: ImageDown
    },
    {
        key: "vectorizing",
        label: "Vectorizing drawings",
        detail: "Tracing pen lines into machine-ready paths",
        icon: Route
    },
    {
        key: "placing",
        label: "Placing on workspace",
        detail: "Aligning to the bed at physical scale",
        icon: Scan
    }
] as const;

function getStepState(
    stepKey: (typeof RECEIVE_STEPS)[number]["key"],
    progress: CompanionProgress
): StepState {
    const order = ["received", "vectorizing", "placing"] as const;

    const stageIndex =
        progress.stage === "done"
            ? order.length
            : progress.stage === "placing"
                ? 2
                : progress.stage === "vectorizing"
                    ? 1
                    : 0;

    const stepIndex = order.indexOf(stepKey);

    if (stepIndex < stageIndex) {
        return "done";
    }

    return stepIndex === stageIndex ? "active" : "pending";
}

function ProgressStep({
    label,
    detail,
    icon: Icon,
    state,
    isLast
}: {
    label: string;
    detail: string;
    icon: typeof ImageDown;
    state: StepState;
    isLast: boolean;
}) {
    return (
        <div className="flex gap-3">
            <div className="flex flex-col items-center">
                <div
                    className={`
                        flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors
                        ${state === "done"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                            : state === "active"
                                ? "border-zinc-300 bg-white text-zinc-900 shadow-sm"
                                : "border-zinc-200 bg-zinc-50 text-zinc-300"}
                    `}
                >
                    {state === "done" ? (
                        <Check size={14} strokeWidth={2.5} />
                    ) : state === "active" ? (
                        <LoaderCircle
                            size={14}
                            className="animate-spin"
                        />
                    ) : (
                        <Icon size={14} />
                    )}
                </div>
                {!isLast && (
                    <div
                        className={`
                            my-1 w-px flex-1
                            ${state === "done"
                                ? "bg-emerald-200"
                                : "bg-zinc-200"}
                        `}
                    />
                )}
            </div>

            <div className={isLast ? "pb-0" : "pb-4"}>
                <div
                    className={`
                        text-[13px] font-semibold
                        ${state === "pending"
                            ? "text-zinc-400"
                            : "text-zinc-900"}
                    `}
                >
                    {label}
                </div>
                <p
                    className={`
                        mt-0.5 text-[12px] leading-4
                        ${state === "pending"
                            ? "text-zinc-300"
                            : "text-zinc-500"}
                    `}
                >
                    {detail}
                </p>
            </div>
        </div>
    );
}

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
        url.searchParams.set("peerId", state.peerId);

        return url.toString();
    }, [state.peerId]);
    if (
        !open
    ) {
        return null;
    }

    const missingConfig =
        !COMPANION_APP_URL;

    const received =
        state.status ===
        "received";

    const receiving =
        state.status ===
        "receiving";

    const reviewing =
        state.status ===
            "reviewing" &&
        state.review !== null;

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
        <>
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
                className={`
                    w-full
                    ${reviewing ? "max-w-xl" : "max-w-sm"}
                    max-h-[calc(100vh-32px)]
                    overflow-y-auto
                    rounded-xl
                    border
                    border-zinc-200
                    bg-white
                    shadow-2xl
                `}
            >
                <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                    <div>
                        <h2 className="text-[15px] font-semibold text-zinc-950">
                            {reviewing
                                ? "Select Detection Areas"
                                : receiving
                                    ? "Processing Reference"
                                    : received
                                        ? "Reference Received"
                                        : "Capture Bed Reference"}
                        </h2>
                        <p className="mt-1 text-[12px] font-medium text-zinc-500">
                            {reviewing
                                ? "Lasso the drawings on the flattened bed"
                                : receiving
                                    ? "Turning the capture into a bed overlay"
                                    : received
                                        ? "Reference layer is ready"
                                        : "Scan from the companion app"}
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

                {reviewing && state.review ? (
                    <ReferenceReviewStage
                        review={state.review}
                        onConfirm={(mask) => {
                            void manager?.confirmReferenceSelection(
                                mask
                            );
                        }}
                        onCancel={() =>
                            manager?.cancelReferenceReview()
                        }
                    />
                ) : receiving ? (
                    <div className="p-4">
                        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                            {RECEIVE_STEPS.map((step, index) => (
                                <ProgressStep
                                    key={step.key}
                                    label={step.label}
                                    detail={step.detail}
                                    icon={step.icon}
                                    state={getStepState(
                                        step.key,
                                        state.progress
                                    )}
                                    isLast={
                                        index ===
                                        RECEIVE_STEPS.length - 1
                                    }
                                />
                            ))}
                        </div>

                        {state.progress.warning && (
                            <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                                <TriangleAlert
                                    size={14}
                                    className="mt-0.5 shrink-0 text-amber-600"
                                />
                                <p className="text-[12px] font-medium leading-4 text-amber-700">
                                    {state.progress.warning}
                                </p>
                            </div>
                        )}

                        <p className="mt-4 text-center text-[11px] font-medium text-zinc-400">
                            This can take a few seconds on large captures.
                        </p>
                    </div>
                ) : received ? (
                    <div className="p-4">
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-5 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                                <CheckCircle2 size={24} />
                            </div>
                            <div className="mt-3 text-[15px] font-semibold text-zinc-950">
                                Reference ready
                            </div>
                            <p className="mx-auto mt-2 max-w-xs text-[12px] leading-5 text-emerald-700">
                                {state.progress.pathCount
                                    ? `${state.progress.pathCount} drawing${
                                        state.progress.pathCount === 1
                                            ? ""
                                            : "s"
                                    } vectorized and placed on the workspace.`
                                    : "The reference layer has been added to the editor."}
                            </p>
                        </div>

                        {state.progress.warning && (
                            <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                                <TriangleAlert
                                    size={14}
                                    className="mt-0.5 shrink-0 text-amber-600"
                                />
                                <p className="text-[12px] font-medium leading-4 text-amber-700">
                                    {state.progress.warning}
                                </p>
                            </div>
                        )}

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
                            Done
                        </button>
                        </div>
                ) : (
                    <div className="p-4">
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

                        <div className="mt-3 flex items-center gap-3">
                            <span className="h-px flex-1 bg-zinc-200" />
                            <span className="text-[10px] font-bold uppercase text-zinc-400">
                                or
                            </span>
                            <span className="h-px flex-1 bg-zinc-200" />
                        </div>

                        <label className="mt-3 flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-zinc-950 text-[13px] font-semibold text-white transition hover:bg-zinc-800">
                            <Upload size={14} />
                            Upload image from files
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => {
                                    const file =
                                        event.target.files?.[0];

                                    event.target.value = "";

                                    if (file) {
                                        void manager?.importReferenceFile(
                                            file
                                        );
                                    }
                                }}
                            />
                        </label>

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
                )}
            </div>
        </div>
        </>
    );
}
