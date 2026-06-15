import {
    AnimatePresence,
    motion
} from "framer-motion";

import MenuItem from "./MenuItem";
import type {
    ShapeType
} from "../../store/editor.store";
import type {
    LucideIcon
} from "lucide-react";

type MenuItemType = {
    id: ShapeType;
    label: string;
    icon: LucideIcon;
};

type Props = {
    open: boolean;
    items: readonly MenuItemType[];
    selected?: ShapeType;

    onSelect: (id: ShapeType) => void;

    onMouseEnter: () => void;
    onMouseLeave: () => void;
};

export default function ToolMenu({
    open,
    items,
    selected,
    onSelect,
    onMouseEnter,
    onMouseLeave
}: Props) {

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
                        top-[210px]
                        z-[100]
                        w-64
                        rounded-xl
                        border
                        border-zinc-200
                        bg-white
                        shadow-xl
                        p-2
                    "
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
