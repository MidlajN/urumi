// components/editor/toolbar/ToolButton.tsx

import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

type Props = {
    tool?: string;
    icon: LucideIcon;
    active?: boolean;
    hasMenu?: boolean;
    label?: string;
    onClick?: () => void;
    onNotchClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
};

export default function ToolButton({
    tool,
    icon: Icon,
    active,
    hasMenu,
    label,
    onClick,
    onNotchClick,
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
                relative
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
            {hasMenu && (
                <span
                    role="button"
                    aria-label={`${
                        label ??
                        tool
                    } options`}
                    onClick={(e) => {

                        e.stopPropagation();

                        onNotchClick?.();
                    }}
                    className="
                        absolute
                        right-0
                        bottom-0
                        w-4
                        h-4
                        flex
                        items-end
                        justify-end
                        p-1
                        cursor-pointer
                    "
                >
                    <span
                        aria-hidden="true"
                        className={clsx(
                            `
                            w-0
                            h-0
                            border-l-[7px]
                            border-b-[7px]
                            border-l-transparent
                            `,
                            active
                                ? "border-r-white/80"
                                : "border-t-zinc-400"
                        )}
                    />
                </span>
            )}
        </button>
    );
}
