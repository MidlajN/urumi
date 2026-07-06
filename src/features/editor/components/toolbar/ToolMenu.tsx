import {
    AnimatePresence,
    motion
} from "framer-motion";

import MenuItem from "./MenuItem";
import type {
    LucideIcon
} from "lucide-react";

type MenuItemType<T extends string> = {
    id: T;
    label: string;
    icon: LucideIcon;
};

type Props<T extends string> = {
    open: boolean;
    items: readonly MenuItemType<T>[];
    selected?: T;
    top?: number;

    onSelect: (id: T) => void;

    onMouseEnter: () => void;
    onMouseLeave: () => void;
};

export default function ToolMenu<T extends string>({
    open,
    items,
    selected,
    top = 210,
    onSelect,
    onMouseEnter,
    onMouseLeave
}: Props<T>) {

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0, x: -8, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}

                    exit={{ opacity: 0, x: -8, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}

                    onMouseEnter={ onMouseEnter }
                    onMouseLeave={ onMouseLeave }
                    className="
                        absolute
                        left-[74px]
                        z-[100]
                        w-64
                        rounded-xl
                        border
                        border-zinc-200
                        bg-white
                        shadow-xl
                        p-2
                    "
                    style={{
                        top
                    }}
                >
                    <div className="flex flex-col gap-1">
                        {items.map((item) => (
                            <MenuItem
                                key={
                                    item.id
                                }
                                label={
                                    item.label
                                }
                                icon={
                                    item.icon
                                }
                                selected={
                                    selected ===
                                    item.id
                                }
                                onClick={() =>
                                    onSelect(
                                        item.id
                                    )
                                }
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
