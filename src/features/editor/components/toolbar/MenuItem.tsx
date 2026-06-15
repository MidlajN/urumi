// features/editor/components/toolbar/MenuItem.tsx

import { Check } from "lucide-react";
import type {
    LucideIcon
} from "lucide-react";

type Props = {
    label: string;
    icon: LucideIcon;
    selected?: boolean;
    onClick: () => void;
};

export default function MenuItem({
    label,
    icon: Icon,
    selected = false,
    onClick
}: Props) {

    return (
        <button
            type="button"
            onClick={onClick}
            className="
                group
                relative
                flex
                items-center
                w-full
                px-2
                py-3
                rounded-xl
                transition-colors
                hover:bg-zinc-100
            "
        >
            {/* LEFT ICON */}
            <div
                className="
                    w-4
                    flex
                    justify-center
                    items-center
                    text-zinc-500
                "
            >
                <Icon
                    size={13}
                    strokeWidth={1.5}
                />
            </div>

            {/* LABEL */}
            <span
                className="
                    ml-4
                    text-[13px]
                    text-zinc-900
                "
            >
                {label}
            </span>

            {/* SELECTED */}
            <div className="ml-auto">
                {selected && (
                    <Check
                        size={18}
                        className="
                            text-emerald-500
                        "
                        strokeWidth={3}
                    />
                )}
            </div>
        </button>
    );
}
