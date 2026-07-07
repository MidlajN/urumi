export default function ImagePreview({
    previewUrl,
    fileName,
    onReplace,
    onSend
}: {
    previewUrl: string;
    fileName?: string;
    onReplace: () => void;
    onSend: () => void;
}) {
    return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
            <img
                src={
                    previewUrl
                }
                alt="Selected reference"
                className="
                    h-72
                    w-full
                    rounded-xl
                    object-contain
                    bg-zinc-100
                "
            />

            <div className="mt-3 truncate text-[13px] font-medium text-zinc-500">
                {fileName ??
                    "Selected image"}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={
                        onReplace
                    }
                    className="h-10 rounded-lg border border-zinc-200 text-[14px] font-semibold text-zinc-700"
                >
                    Replace
                </button>
                <button
                    type="button"
                    onClick={
                        onSend
                    }
                    className="h-10 rounded-lg bg-zinc-950 text-[14px] font-semibold text-white"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
