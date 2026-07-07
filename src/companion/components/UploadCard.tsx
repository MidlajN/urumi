import {
    Upload
} from "lucide-react";
import {
    useRef,
    useState
} from "react";

export default function UploadCard({
    disabled,
    onFile
}: {
    disabled?: boolean;
    onFile: (
        file: File
    ) => void;
}) {
    const inputRef =
        useRef<HTMLInputElement | null>(
            null
        );

    const [
        dragging,
        setDragging
    ] = useState(
        false
    );

    const handleFiles =
        (
            files: FileList | null
        ) => {
            const file =
                files?.[0];

            if (
                file
            ) {
                onFile(
                    file
                );
            }
        };

    return (
        <div
            className={`
                rounded-2xl
                border
                border-dashed
                p-5
                text-center
                ${dragging
                    ? "border-zinc-900 bg-zinc-100"
                    : "border-zinc-300 bg-white"
                }
            `}
            onDragOver={(event) => {
                event.preventDefault();
                setDragging(
                    true
                );
            }}
            onDragLeave={() =>
                setDragging(
                    false
                )
            }
            onDrop={(event) => {
                event.preventDefault();
                setDragging(
                    false
                );
                handleFiles(
                    event.dataTransfer.files
                );
            }}
        >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
                <Upload size={22} />
            </div>

            <h2 className="text-[17px] font-semibold text-zinc-950">
                Upload bed photo
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-[13px] leading-5 text-zinc-500">
                Choose a clear image of the machine bed. The image will be resized before transfer.
            </p>

            <button
                type="button"
                disabled={
                    disabled
                }
                onClick={() =>
                    inputRef.current?.click()
                }
                className="
                    mt-5
                    h-11
                    w-full
                    rounded-lg
                    bg-zinc-950
                    text-[14px]
                    font-semibold
                    text-white
                    disabled:bg-zinc-300
                "
            >
                Choose Image
            </button>

            <input
                ref={
                    inputRef
                }
                hidden
                type="file"
                accept="image/*"
                disabled={
                    disabled
                }
                onChange={(event) =>
                    handleFiles(
                        event.target.files
                    )
                }
            />
        </div>
    );
}
