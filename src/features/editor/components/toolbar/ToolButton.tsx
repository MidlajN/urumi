// components/editor/toolbar/ToolButton.tsx

import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

type Props = {
    tool?: string;
    icon: LucideIcon;
    active?: boolean;
    label?: string;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
};

export default function ToolButton({
    tool,
    icon: Icon,
    active,
    label,
    onClick,
    onMouseEnter,
    onMouseLeave
}: Props) {

    return (
        <button
            type="button"
            aria-label={
                label ??
                tool
            }
            title={
                label ??
                tool
            }
            onClick={onClick}
            onMouseEnter={
                onMouseEnter
            }
            onMouseLeave={
                onMouseLeave
            }
            className={clsx(
                `
                w-11
                h-11
                rounded-lg
                flex
                items-center
                justify-center
                transition-all
                duration-150
                border
                `,
                active
                    ? `
                    bg-zinc-900
                    text-white
                    border-zinc-900
                    `
                    : `
                    bg-white
                    hover:bg-zinc-100
                    border-transparent
                    text-zinc-700
                    `
            )}
        >
            <Icon size={18} />
        </button>
    );
}
