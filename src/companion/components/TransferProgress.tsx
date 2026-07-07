export default function TransferProgress({
    progress
}: {
    progress: number;
}) {
    return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-3 text-[15px] font-semibold text-zinc-950">
                Sending reference image
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                    className="h-full rounded-full bg-zinc-950 transition-all"
                    style={{
                        width:
                            `${Math.max(
                                5,
                                Math.min(
                                    100,
                                    progress
                                )
                            )}%`
                    }}
                />
            </div>
            <div className="mt-3 text-[13px] font-medium text-zinc-500">
                Compressing and transferring. Keep this page open.
            </div>
        </div>
    );
}
