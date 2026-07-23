import { Lasso, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import type { CompanionReviewImage } from "../types";

type Point = [number, number];

/** Ignore pointer moves shorter than this (in corrected-image pixels). */
const MIN_POINT_DISTANCE = 4;

/**
 * Detection-area selection over the uploaded capture: the user lassos the
 * regions to vectorize; everything outside stays untouched. Lasso points
 * are kept in the photo's pixel coordinates — the pipeline warps the mask
 * through the same ArUco correction as the image.
 */
export default function ReferenceReviewStage({
    review,
    onConfirm,
    onCancel
}: {
    review: CompanionReviewImage;
    onConfirm: (mask: HTMLCanvasElement | null) => void;
    onCancel: () => void;
}) {
    const surfaceRef = useRef<HTMLDivElement | null>(null);

    const [lassos, setLassos] = useState<Point[][]>([]);

    const [draft, setDraft] = useState<Point[] | null>(null);

    const toImagePoint = (
        event: ReactPointerEvent
    ): Point | null => {
        const surface = surfaceRef.current;

        if (!surface) {
            return null;
        }

        const bounds = surface.getBoundingClientRect();

        if (bounds.width === 0 || bounds.height === 0) {
            return null;
        }

        const x =
            ((event.clientX - bounds.left) / bounds.width) *
            review.width;

        const y =
            ((event.clientY - bounds.top) / bounds.height) *
            review.height;

        return [
            Math.max(0, Math.min(review.width, x)),
            Math.max(0, Math.min(review.height, y))
        ];
    };

    const handlePointerDown = (event: ReactPointerEvent) => {
        if (event.button !== 0) {
            return;
        }

        const point = toImagePoint(event);

        if (!point) {
            return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);

        setDraft([point]);
    };

    const handlePointerMove = (event: ReactPointerEvent) => {
        if (!draft) {
            return;
        }

        const point = toImagePoint(event);

        if (!point) {
            return;
        }

        const last = draft[draft.length - 1];

        const distance = Math.hypot(
            point[0] - last[0],
            point[1] - last[1]
        );

        if (distance < MIN_POINT_DISTANCE) {
            return;
        }

        setDraft([...draft, point]);
    };

    const handlePointerUp = () => {
        if (!draft) {
            return;
        }

        if (draft.length >= 3) {
            setLassos([...lassos, draft]);
        }

        setDraft(null);
    };

    const buildMask = (): HTMLCanvasElement => {
        const canvas = document.createElement("canvas");

        canvas.width = review.width;
        canvas.height = review.height;

        const context = canvas.getContext("2d");

        if (context) {
            context.fillStyle = "#000000";
            context.fillRect(0, 0, canvas.width, canvas.height);

            context.fillStyle = "#ffffff";

            lassos.forEach((points) => {
                context.beginPath();

                points.forEach(([x, y], index) => {
                    if (index === 0) {
                        context.moveTo(x, y);
                    } else {
                        context.lineTo(x, y);
                    }
                });

                context.closePath();
                context.fill();
            });
        }

        return canvas;
    };

    const toPolygonPoints = (points: Point[]) =>
        points
            .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
            .join(" ");

    return (
        <div className="p-4">
            <div className="mb-3 flex items-start gap-2 rounded-md bg-zinc-50 px-3 py-2">
                <Lasso
                    size={14}
                    className="mt-0.5 shrink-0 text-zinc-400"
                />
                <p className="text-[12px] font-medium leading-4 text-zinc-600">
                    Draw around the drawings you want detected.
                    Areas outside your selection are ignored.
                </p>
            </div>

            <div className="flex justify-center rounded-lg border border-zinc-200 bg-zinc-100/70 p-3">
                <div
                    ref={surfaceRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className="relative max-h-[420px] cursor-crosshair touch-none select-none overflow-hidden rounded-md shadow-sm"
                >
                    <img
                        src={review.image}
                        alt="Bed capture"
                        draggable={false}
                        className="max-h-[420px] w-auto select-none"
                    />

                    <svg
                        viewBox={`0 0 ${review.width} ${review.height}`}
                        preserveAspectRatio="none"
                        className="pointer-events-none absolute inset-0 h-full w-full"
                    >
                        {lassos.map((points, index) => (
                            <polygon
                                key={index}
                                points={toPolygonPoints(points)}
                                fill="rgba(34,197,94,0.18)"
                                stroke="#16a34a"
                                strokeWidth={3}
                                vectorEffect="non-scaling-stroke"
                            />
                        ))}

                        {draft && draft.length > 1 && (
                            <polyline
                                points={toPolygonPoints(draft)}
                                fill="rgba(34,197,94,0.10)"
                                stroke="#16a34a"
                                strokeWidth={3}
                                strokeDasharray="6 4"
                                vectorEffect="non-scaling-stroke"
                            />
                        )}
                    </svg>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-500">
                    {lassos.length === 0
                        ? "No areas selected yet"
                        : `${lassos.length} area${
                            lassos.length === 1 ? "" : "s"
                        } selected`}
                </span>

                <button
                    type="button"
                    disabled={lassos.length === 0}
                    onClick={() => setLassos([])}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Trash2 size={12} />
                    Clear
                </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="h-9 rounded-md border border-zinc-200 text-[13px] font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={() => onConfirm(null)}
                    className="h-9 rounded-md border border-zinc-200 text-[13px] font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                    Detect entire image
                </button>
            </div>

            <button
                type="button"
                disabled={lassos.length === 0}
                onClick={() => onConfirm(buildMask())}
                className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 text-[13px] font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
                <Lasso size={14} />
                Detect in selection
            </button>
        </div>
    );
}
