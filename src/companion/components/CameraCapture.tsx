import {
    Camera,
    CameraOff,
    Loader2,
    RotateCcw
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";

type CameraStatus =
    | "starting"
    | "ready"
    | "error";

export default function CameraCapture({
    disabled,
    onFile
}: {
    disabled?: boolean;
    onFile: (
        file: File
    ) => void;
}) {
    const videoRef =
        useRef<HTMLVideoElement | null>(
            null
        );

    const streamRef =
        useRef<MediaStream | null>(
            null
        );

    const [
        status,
        setStatus
    ] = useState<CameraStatus>(
        "starting"
    );

    const [
        error,
        setError
    ] = useState<string | null>(
        null
    );

    const stopCamera =
        useCallback(
            () => {
                streamRef.current
                    ?.getTracks()
                    .forEach(
                        (
                            track
                        ) =>
                            track.stop()
                    );
                streamRef.current =
                    null;
            },
            []
        );

    const startCamera =
        useCallback(
            async () => {
                if (
                    disabled
                ) {
                    stopCamera();
                    setStatus(
                        "error"
                    );
                    setError(
                        "Connect to the editor before capturing a photo."
                    );
                    return;
                }

                stopCamera();
                setStatus(
                    "starting"
                );
                setError(
                    null
                );

                try {
                    if (
                        !navigator.mediaDevices
                            ?.getUserMedia
                    ) {
                        throw new Error(
                            "Camera capture is not available in this browser."
                        );
                    }

                    const stream =
                        await navigator.mediaDevices.getUserMedia(
                            {
                                video: {
                                    facingMode: {
                                        ideal:
                                            "environment"
                                    },
                                    width: {
                                        ideal:
                                            1920
                                    },
                                    height: {
                                        ideal:
                                            1080
                                    }
                                },
                                audio:
                                    false
                            }
                        );

                    streamRef.current =
                        stream;

                    if (
                        videoRef.current
                    ) {
                        videoRef.current.srcObject =
                            stream;
                        await videoRef.current.play();
                    }

                    setStatus(
                        "ready"
                    );
                } catch (cameraError) {
                    stopCamera();
                    setStatus(
                        "error"
                    );
                    setError(
                        cameraError instanceof Error
                            ? cameraError.message
                            : "Unable to start the camera."
                    );
                }
            },
            [
                disabled,
                stopCamera
            ]
        );

    useEffect(() => {
        void startCamera();

        return () => {
            stopCamera();
        };
    }, [
        startCamera,
        stopCamera
    ]);

    const captureFrame =
        useCallback(
            async () => {
                const video =
                    videoRef.current;

                if (
                    !video ||
                    !video.videoWidth ||
                    !video.videoHeight
                ) {
                    setError(
                        "Camera is still preparing the image."
                    );
                    return;
                }

                const canvas =
                    document.createElement(
                        "canvas"
                    );

                canvas.width =
                    video.videoWidth;
                canvas.height =
                    video.videoHeight;

                const context =
                    canvas.getContext(
                        "2d"
                    );

                if (
                    !context
                ) {
                    setError(
                        "Unable to capture the image."
                    );
                    return;
                }

                context.drawImage(
                    video,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                const blob =
                    await new Promise<Blob | null>(
                        (
                            resolve
                        ) => {
                            canvas.toBlob(
                                resolve,
                                "image/jpeg",
                                0.92
                            );
                        }
                    );

                if (
                    !blob
                ) {
                    setError(
                        "Unable to capture the image."
                    );
                    return;
                }

                const file =
                    new File(
                        [
                            blob
                        ],
                        `bed-reference-${Date.now()}.jpg`,
                        {
                            type:
                                "image/jpeg"
                        }
                    );

                stopCamera();
                onFile(
                    file
                );
            },
            [
                onFile,
                stopCamera
            ]
        );

    return (
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="relative aspect-[3/4] bg-zinc-950 sm:aspect-[4/3]">
                <video
                    ref={
                        videoRef
                    }
                    muted
                    playsInline
                    className={`
                        h-full
                        w-full
                        object-cover
                        ${status ===
                        "ready"
                            ? "opacity-100"
                            : "opacity-0"}
                    `}
                />

                {status !==
                    "ready" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
                        {status ===
                        "starting" ? (
                            <>
                                <Loader2
                                    size={26}
                                    className="animate-spin"
                                />
                                <div className="mt-3 text-[14px] font-semibold">
                                    Starting camera...
                                </div>
                            </>
                        ) : (
                            <>
                                <CameraOff size={26} />
                                <div className="mt-3 text-[14px] font-semibold">
                                    Camera unavailable
                                </div>
                                {error && (
                                    <p className="mt-2 text-[12px] leading-5 text-zinc-300">
                                        {error}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-[17px] font-semibold text-zinc-950">
                            Capture bed photo
                        </h2>
                        <p className="mt-1 text-[13px] leading-5 text-zinc-500">
                            Point the camera at the machine bed and capture a clear reference image.
                        </p>
                    </div>
                    <div className="rounded-full bg-zinc-100 p-2 text-zinc-700">
                        <Camera size={18} />
                    </div>
                </div>

                {error &&
                status ===
                    "ready" && (
                    <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600">
                        {error}
                    </div>
                )}

                <div className="mt-4 grid grid-cols-[44px_1fr] gap-2">
                    <button
                        type="button"
                        aria-label="Restart camera"
                        title="Restart camera"
                        disabled={
                            disabled
                        }
                        onClick={() => {
                            void startCamera();
                        }}
                        className="
                            flex
                            h-11
                            items-center
                            justify-center
                            rounded-lg
                            border
                            border-zinc-200
                            text-zinc-700
                            disabled:text-zinc-300
                        "
                    >
                        <RotateCcw size={17} />
                    </button>
                    <button
                        type="button"
                        disabled={
                            disabled ||
                            status !==
                                "ready"
                        }
                        onClick={() => {
                            void captureFrame();
                        }}
                        className="
                            h-11
                            rounded-lg
                            bg-zinc-950
                            text-[14px]
                            font-semibold
                            text-white
                            disabled:bg-zinc-300
                        "
                    >
                        Capture Photo
                    </button>
                </div>
            </div>
        </section>
    );
}
