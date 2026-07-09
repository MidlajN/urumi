import {
    AnimatePresence,
    motion
} from "framer-motion";
import {
    X
} from "lucide-react";

import type {
    CompanionManager
} from "../CompanionManager";
import ReferenceAdjustmentContent from "./ReferenceAdjustmentContent";

export default function ReferenceAdjustmentModal({
    manager,
    open,
    onClose
}: {
    manager: CompanionManager | null;
    open: boolean;
    onClose: () => void;
}) {
    if (
        !open
    ) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                className="
                    fixed
                    inset-0
                    z-210
                    flex
                    items-center
                    justify-center
                    bg-zinc-950/40
                    px-4
                    py-6
                "
                initial={{
                    opacity:
                        0
                }}
                animate={{
                    opacity:
                        1
                }}
                exit={{
                    opacity:
                        0
                }}
                onMouseDown={(event) => {
                    if (
                        event.target ===
                        event.currentTarget
                    ) {
                        onClose();
                    }
                }}
            >
                <motion.div
                    className="
                        flex
                        max-h-full
                        w-full
                        max-w-4xl
                        flex-col
                        overflow-hidden
                        rounded-xl
                        border
                        border-zinc-200
                        bg-white
                        shadow-2xl
                    "
                    initial={{
                        y:
                            12,
                        scale:
                            0.98
                    }}
                    animate={{
                        y:
                            0,
                        scale:
                            1
                    }}
                    exit={{
                        y:
                            12,
                        scale:
                            0.98
                    }}
                >
                    <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                        <div>
                            <h2 className="text-[14px] font-semibold text-zinc-950">
                                Adjust Reference
                            </h2>
                            <p className="mt-0.5 text-[12px] font-medium text-zinc-500">
                                Perspective
                            </p>
                        </div>

                        <button
                            type="button"
                            aria-label="Close reference adjustment"
                            onClick={
                                onClose
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <ReferenceAdjustmentContent
                        manager={
                            manager
                        }
                        onClose={
                            onClose
                        }
                    />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
