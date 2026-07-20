import {
    TriangleAlert,
    X
} from "lucide-react";

export default function BedValidationModal({
    count,
    onIgnore,
    onCancel
}: {
    count: number;
    onIgnore: () => void;
    onCancel: () => void;
}) {
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
                    onCancel();
                }
            }}
        >
            <div className="w-full max-w-sm overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl">
                <header className="flex items-center gap-2.5 border-b border-amber-100 bg-amber-50/60 px-4 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                        <TriangleAlert size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-semibold text-zinc-950">
                            Objects cross the bed edge
                        </div>
                        <div className="text-[11px] font-medium text-zinc-500">
                            Bed placement check
                        </div>
                    </div>
                    <button
                        type="button"
                        aria-label="Cancel manufacturing"
                        onClick={
                            onCancel
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                    >
                        <X size={15} />
                    </button>
                </header>

                <div className="p-4">
                    <p className="text-[13px] font-medium leading-5 text-zinc-700">
                        {count === 1
                            ? "1 object lies partly on the bed and partly outside it."
                            : `${count} objects lie partly on the bed and partly outside it.`}
                    </p>
                    <p className="mt-2 text-[12px] font-medium leading-5 text-zinc-500">
                        Only objects fully on the bed can be manufactured. Ignore
                        to leave {count === 1 ? "it" : "them"} out of the
                        manufacturing document, or cancel and reposition
                        {count === 1 ? " it" : " them"} first.
                    </p>
                </div>

                <footer className="grid grid-cols-2 gap-2 border-t border-zinc-200 p-3">
                    <button
                        type="button"
                        onClick={
                            onCancel
                        }
                        className="h-9 rounded-md border border-zinc-200 text-[13px] font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={
                            onIgnore
                        }
                        className="h-9 rounded-md bg-zinc-950 text-[13px] font-semibold text-white hover:bg-zinc-800"
                    >
                        Ignore & continue
                    </button>
                </footer>
            </div>
        </div>
    );
}
