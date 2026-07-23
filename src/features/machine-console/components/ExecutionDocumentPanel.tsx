/**
 * TEMPORARY developer inspection window.
 *
 * Tabbed "advanced window" for the compiled Execution Document: General
 * (material + operations), SVG (exporter output) and Motion Plan
 * (urumi-toolpath bake). Pure visualization — it never mutates the job,
 * the document, or Fabric objects. Opened from the header icon in
 * ManufacturingSidebar.
 *
 * Remove this file (and its trigger in ManufacturingSidebar) once the
 * exporter pipeline is in place.
 */
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
    Check,
    ClipboardList,
    Copy,
    Download,
    FileCode2,
    Route,
    TriangleAlert,
    X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { compileExecutionDocument } from "@/core/manufacturing/compiler";
import type {
    ExecutionDocument,
    ExecutionOperation
} from "@/core/manufacturing/compiler";
import { getOperation } from "@/core/manufacturing/operations/registry";
import { SvgExporter } from "@/core/manufacturing/exporters/svg";
import {
    MICRO_JOG,
    MICRO_LIFT,
    MICRO_PATH_END,
    MICRO_PAUSE,
    Planner
} from "@/core/manufacturing/planner";
import type {
    Block,
    PipelineConfig,
    PlannerResult
} from "@/core/manufacturing/planner";
import type {
    ManufacturingDocumentSummary
} from "@/core/manufacturing/analysis/types";
import { resolveJob } from "@/core/manufacturing/job/resolver";
import { useManufacturingStore } from "@/stores/manufacturing.store";
import { useCanvas } from "@/features/editor/canvas/CanvasProvider";

type TabId = "general" | "svg" | "plan";

const TABS: {
    id: TabId;
    label: string;
    icon: LucideIcon;
}[] = [
    { id: "general", label: "General", icon: ClipboardList },
    { id: "svg", label: "SVG", icon: FileCode2 },
    { id: "plan", label: "Motion Plan", icon: Route }
];

const SEGMENT_PREVIEW_LIMIT = 200;

/** Canvas units are CSS px at 96 dpi. */
const MM_PER_PX = 25.4 / 96;

type BedSizeMm = {
    width: number;
    height: number;
};

type PlanPreview = {
    result: PlannerResult | null;
    error: string | null;
};

export default function ExecutionDocumentModal({
    summary,
    open,
    onClose
}: {
    summary: ManufacturingDocumentSummary;
    open: boolean;
    onClose: () => void;
}) {
    const { canvas } = useCanvas();

    const job = useManufacturingStore((state) => state.job);

    const resolvedJob = useMemo(() => resolveJob(job), [job]);

    const executionDocument = useMemo(
        () =>
            open && canvas && resolvedJob
                ? compileExecutionDocument(
                    canvas,
                    summary,
                    resolvedJob
                )
                : null,
        [open, canvas, resolvedJob, summary]
    );

    const [activeTab, setActiveTab] = useState<TabId>("general");

    useEffect(() => {
        if (open) {
            setActiveTab("general");
        }
    }, [open]);

    const bedMm = useMemo<BedSizeMm | null>(
        () =>
            executionDocument?.bed
                ? {
                    width:
                        executionDocument.bed.width *
                        MM_PER_PX,
                    height:
                        executionDocument.bed.height *
                        MM_PER_PX
                }
                : null,
        [executionDocument]
    );

    // Tab results are produced lazily, only for the visible tab.
    const svgMarkup = useMemo(
        () =>
            activeTab === "svg" && executionDocument
                ? new SvgExporter().export(executionDocument)
                : null,
        [activeTab, executionDocument]
    );

    const planPreview = useMemo<PlanPreview | null>(() => {
        if (activeTab !== "plan" || !executionDocument) {
            return null;
        }

        try {
            return {
                result: new Planner().plan(executionDocument),
                error: null
            };
        } catch (error) {
            return {
                result: null,
                error:
                    error instanceof Error
                        ? error.message
                        : "Planning failed"
            };
        }
    }, [activeTab, executionDocument]);

    if (!open) {
        return null;
    }

    return createPortal(
        <div
            className="
                fixed
                inset-0
                z-150
                flex
                items-center
                justify-center
                bg-zinc-950/30
                px-4
            "
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="flex h-[640px] max-h-[calc(100vh-48px)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl">
                <header className="flex items-center gap-2.5 border-b border-zinc-200 bg-white px-4 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-white">
                        <FileCode2 size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-semibold text-zinc-950">
                            Execution Document
                        </div>
                        <div className="text-[11px] font-medium text-zinc-500">
                            Compiled manufacturing document
                        </div>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-700">
                        Dev
                    </span>
                    <button
                        type="button"
                        aria-label="Close execution document"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                    >
                        <X size={15} />
                    </button>
                </header>

                <nav className="flex items-end gap-1 border-b border-zinc-200 bg-zinc-50/80 px-3 pt-2">
                    {TABS.map((tab) => {
                        const active = tab.id === activeTab;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() =>
                                    setActiveTab(tab.id)
                                }
                                className={`
                                    -mb-px
                                    flex
                                    items-center
                                    gap-1.5
                                    rounded-t-lg
                                    border
                                    px-3.5
                                    py-2
                                    text-[12px]
                                    font-semibold
                                    transition
                                    ${
                                        active
                                            ? "border-zinc-200 border-b-transparent bg-white text-zinc-950"
                                            : "border-transparent text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-800"
                                    }
                                `}
                            >
                                <tab.icon size={13} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="min-h-0 flex-1 overflow-y-auto bg-white p-4">
                    {!executionDocument ? (
                        <div className="rounded-md border border-dashed border-zinc-300 px-3 py-10 text-center text-[12px] font-medium text-zinc-500">
                            Select a material to compile the execution document.
                        </div>
                    ) : activeTab === "general" ? (
                        <GeneralTab
                            document={executionDocument}
                            bedMm={bedMm}
                        />
                    ) : activeTab === "svg" ? (
                        svgMarkup && <SvgTab svg={svgMarkup} />
                    ) : (
                        planPreview && (
                            <PlanTab
                                preview={planPreview}
                                bedMm={bedMm}
                            />
                        )
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

function GeneralTab({
    document,
    bedMm
}: {
    document: ExecutionDocument;
    bedMm: BedSizeMm | null;
}) {
    const objectCount = document.operations.reduce(
        (total, operation) => total + operation.objects.length,
        0
    );

    return (
        <>
            <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                    <div className="text-[9px] font-bold uppercase text-zinc-400">
                        Material
                    </div>
                    <div className="mt-0.5 truncate text-[13px] font-semibold text-zinc-900">
                        {document.material.name}
                        <span className="ml-1.5 font-medium text-zinc-500">
                            {document.material.thickness} mm
                        </span>
                    </div>
                </div>
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                    <div className="text-[9px] font-bold uppercase text-zinc-400">
                        Bed
                    </div>
                    <div className="mt-0.5 text-[13px] font-semibold text-zinc-900">
                        {bedMm
                            ? `${Math.round(bedMm.width)} × ${Math.round(bedMm.height)} mm`
                            : "Unknown"}
                    </div>
                </div>
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                    <div className="text-[9px] font-bold uppercase text-zinc-400">
                        Objects
                    </div>
                    <div className="mt-0.5 text-[13px] font-semibold text-zinc-900">
                        {objectCount}
                    </div>
                </div>
            </div>

            <div className="mb-1 mt-4 text-[10px] font-bold uppercase text-zinc-400">
                Operations ({document.operations.length})
            </div>

            {document.operations.length === 0 ? (
                <div className="rounded-md border border-dashed border-zinc-300 px-3 py-4 text-center text-[11px] font-medium text-zinc-500">
                    No executable operations. Enable an operation and assign a tool.
                </div>
            ) : (
                <div className="space-y-2">
                    {document.operations.map((operation) => (
                        <ExecutionOperationBlock
                            key={operation.operationId}
                            operation={operation}
                        />
                    ))}
                </div>
            )}
        </>
    );
}

function SvgTab({ svg }: { svg: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(svg);

            setCopied(true);

            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard unavailable — the source is still selectable below.
        }
    };

    const handleDownload = () => {
        const blob = new Blob([svg], {
            type: "image/svg+xml"
        });

        const url = URL.createObjectURL(blob);

        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = "execution-document.svg";
        anchor.click();

        URL.revokeObjectURL(url);
    };

    return (
        <>
            <div className="mb-1 text-[10px] font-bold uppercase text-zinc-400">
                Preview
            </div>
            <div
                className="
                    rounded-md
                    border
                    border-zinc-200
                    bg-[repeating-conic-gradient(#fafafa_0%_25%,#ffffff_0%_50%)]
                    bg-[length:16px_16px]
                    p-3
                    [&_svg]:mx-auto
                    [&_svg]:h-auto
                    [&_svg]:max-h-72
                    [&_svg]:w-full
                "
                dangerouslySetInnerHTML={{
                    __html: svg
                }}
            />

            <div className="mb-1 mt-4 text-[10px] font-bold uppercase text-zinc-400">
                Source
            </div>
            <pre className="max-h-56 overflow-auto rounded-md bg-zinc-950 p-3 font-mono text-[10px] leading-4 whitespace-pre-wrap break-all text-zinc-100">
                {svg}
            </pre>

            <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => {
                        void handleCopy();
                    }}
                    className="flex h-9 items-center justify-center gap-2 rounded-md border border-zinc-200 text-[13px] font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                    {copied ? (
                        <Check
                            size={14}
                            className="text-emerald-600"
                        />
                    ) : (
                        <Copy size={14} />
                    )}
                    {copied ? "Copied" : "Copy source"}
                </button>
                <button
                    type="button"
                    onClick={handleDownload}
                    className="flex h-9 items-center justify-center gap-2 rounded-md bg-zinc-950 text-[13px] font-semibold text-white hover:bg-zinc-800"
                >
                    <Download size={14} />
                    Download .svg
                </button>
            </div>
        </>
    );
}

function PlanTab({
    preview,
    bedMm
}: {
    preview: PlanPreview;
    bedMm: BedSizeMm | null;
}) {
    const { result, error } = preview;

    const totalSegments =
        result?.plan.blocks.reduce(
            (total, block) => total + block.segments.length,
            0
        ) ?? 0;

    const [blockIndex, setBlockIndex] = useState(0);

    const blocks = result?.plan.blocks ?? [];

    const safeBlockIndex = Math.min(
        blockIndex,
        Math.max(0, blocks.length - 1)
    );

    const selectedBlock = blocks[safeBlockIndex] ?? null;

    const trajectory = useMemo(
        () =>
            result
                ? buildPlanTrajectory(
                    result.plan.blocks,
                    result.config,
                    bedMm
                )
                : null,
        [result, bedMm]
    );

    const operationLegend = useMemo(
        () =>
            result
                ? Array.from(
                    new Set(
                        result.plan.blocks.map(
                            (block) => block.profile.name
                        )
                    )
                ).map((operationId) => ({
                    operationId,
                    color: operationColor(operationId)
                }))
                : [],
        [result]
    );

    const handleDownload = () => {
        if (!result) {
            return;
        }

        const blob = new Blob([result.bytes as BlobPart], {
            type: "application/octet-stream"
        });

        const url = URL.createObjectURL(blob);

        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = "execution-document.plan";
        anchor.click();

        URL.revokeObjectURL(url);
    };

    if (error) {
        return (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5">
                <TriangleAlert
                    size={14}
                    className="mt-0.5 shrink-0 text-red-600"
                />
                <p className="text-[12px] font-medium leading-4 whitespace-pre-wrap text-red-700">
                    {error}
                </p>
            </div>
        );
    }

    if (!result) {
        return null;
    }

    return (
        <>
            <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-center">
                    <div className="text-[15px] font-semibold text-zinc-900">
                        {result.plan.blocks.length}
                    </div>
                    <div className="text-[9px] font-bold uppercase text-zinc-400">
                        Blocks
                    </div>
                </div>
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-center">
                    <div className="text-[15px] font-semibold text-zinc-900">
                        {totalSegments}
                    </div>
                    <div className="text-[9px] font-bold uppercase text-zinc-400">
                        Segments
                    </div>
                </div>
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-center">
                    <div className="text-[15px] font-semibold text-zinc-900">
                        {(result.bytes.length / 1024).toFixed(1)} KB
                    </div>
                    <div className="text-[9px] font-bold uppercase text-zinc-400">
                        .plan size
                    </div>
                </div>
            </div>

            <div className="mb-1 mt-4 text-[10px] font-bold uppercase text-zinc-400">
                Blocks
            </div>
            <div className="space-y-2">
                {result.plan.blocks.map((block, index) => (
                    <div
                        key={index}
                        className="rounded-md border border-zinc-200 bg-zinc-50/70 p-2.5"
                    >
                        <div className="flex items-center justify-between">
                            <div className="text-[12px] font-semibold capitalize text-zinc-900">
                                {index + 1}. {block.profile.name}
                            </div>
                            <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[9px] font-bold text-zinc-500">
                                {block.segments.length} segments
                            </span>
                        </div>
                        <div className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
                            <span className="font-medium text-zinc-400">
                                Feed / Accel
                            </span>
                            <span className="font-semibold text-zinc-800">
                                {block.profile.feedMax} mm/s · {block.profile.accel} mm/s²
                            </span>
                            <span className="font-medium text-zinc-400">
                                Start
                            </span>
                            <span className="font-mono text-[10px] font-semibold text-zinc-800">
                                x {block.startSteps.x} · y {block.startSteps.y} steps
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mb-1 mt-4 text-[10px] font-bold uppercase text-zinc-400">
                Trajectory
            </div>

            {trajectory ? (
                <div className="rounded-md border border-zinc-200 bg-white p-2">
                    <svg
                        viewBox={trajectory.viewBox}
                        className="h-64 w-full"
                    >
                        {trajectory.bed && (
                            <rect
                                x={0}
                                y={0}
                                width={trajectory.bed.width}
                                height={trajectory.bed.height}
                                fill="#fafafa"
                                stroke="#d4d4d8"
                                strokeWidth={1}
                                vectorEffect="non-scaling-stroke"
                            />
                        )}
                        {trajectory.paths.map((path, index) => (
                            <path
                                key={index}
                                d={path.d}
                                fill="none"
                                stroke={path.color}
                                strokeWidth={1}
                                vectorEffect="non-scaling-stroke"
                                strokeDasharray={
                                    path.travel
                                        ? "5 4"
                                        : undefined
                                }
                            />
                        ))}
                    </svg>
                    <div className="mt-1 flex items-center gap-4 text-[10px] font-medium text-zinc-500">
                        {operationLegend.map((entry) => (
                            <span
                                key={entry.operationId}
                                className="flex items-center gap-1.5 capitalize"
                            >
                                <span
                                    className="h-0.5 w-4"
                                    style={{
                                        backgroundColor:
                                            entry.color
                                    }}
                                />
                                {entry.operationId}
                            </span>
                        ))}
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 border-t-2 border-dashed border-zinc-400" />
                            Travel / lift
                        </span>
                        <span className="ml-auto">
                            {trajectory.bed
                                ? `bed ${Math.round(trajectory.bed.width)} × ${Math.round(trajectory.bed.height)} mm`
                                : "mm, machine frame"}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="rounded-md border border-dashed border-zinc-300 px-3 py-4 text-center text-[11px] font-medium text-zinc-500">
                    No XY motion in this plan.
                </div>
            )}

            <div className="mb-1 mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-zinc-400">
                    Segments
                    {selectedBlock &&
                        selectedBlock.segments.length >
                            SEGMENT_PREVIEW_LIMIT &&
                        ` (first ${SEGMENT_PREVIEW_LIMIT} of ${selectedBlock.segments.length})`}
                </span>
                {blocks.length > 1 && (
                    <select
                        value={safeBlockIndex}
                        onChange={(event) =>
                            setBlockIndex(
                                Number(event.target.value)
                            )
                        }
                        className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700"
                    >
                        {blocks.map((block, index) => (
                            <option key={index} value={index}>
                                {index + 1}. {block.profile.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            <div className="max-h-44 overflow-auto rounded-md border border-zinc-200">
                <table className="w-full font-mono text-[10px]">
                    <thead className="sticky top-0 bg-zinc-50 text-zinc-500">
                        <tr>
                            {["#", "dx", "dy", "dz", "da", "interval", "flags"].map(
                                (column) => (
                                    <th
                                        key={column}
                                        className="px-2 py-1 text-left font-semibold"
                                    >
                                        {column}
                                    </th>
                                )
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {selectedBlock?.segments
                            .slice(0, SEGMENT_PREVIEW_LIMIT)
                            .map((segment, index) => (
                                <tr
                                    key={index}
                                    className="border-t border-zinc-100 text-zinc-800"
                                >
                                    <td className="px-2 py-0.5 text-zinc-400">
                                        {index}
                                    </td>
                                    <td className="px-2 py-0.5">
                                        {segment.dx}
                                    </td>
                                    <td className="px-2 py-0.5">
                                        {segment.dy}
                                    </td>
                                    <td className="px-2 py-0.5">
                                        {segment.dz}
                                    </td>
                                    <td className="px-2 py-0.5">
                                        {segment.da}
                                    </td>
                                    <td className="px-2 py-0.5">
                                        {segment.interval}
                                    </td>
                                    <td className="px-2 py-0.5 text-zinc-500">
                                        {flagLabels(segment.flags)}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            <button
                type="button"
                onClick={handleDownload}
                className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 text-[13px] font-semibold text-white hover:bg-zinc-800"
            >
                <Download size={14} />
                Download .plan
            </button>
        </>
    );
}

type TrajectoryPath = {
    color: string;
    travel: boolean;
    d: string;
};

const TRAVEL_COLOR = "#a1a1aa";

function operationColor(operationId: string): string {
    return getOperation(operationId)?.color ?? "#18181b";
}

/**
 * Decodes the plan's MicroSegments back into XY polylines per operation
 * group (mm, machine frame) by accumulating step deltas from each block's
 * startSteps. Cutting moves take the operation's color; travel moves are
 * neutral. When the bed is known the geometry is mapped onto it (machine
 * origin bottom-left → screen top-left), mirroring the exported SVG.
 */
function buildPlanTrajectory(
    blocks: readonly Block[],
    config: PipelineConfig,
    bedMm: BedSizeMm | null
): {
    paths: TrajectoryPath[];
    bed: BedSizeMm | null;
    viewBox: string;
} | null {

    const stepsX = config.machine.x.stepsPerUnit;

    const stepsY = config.machine.y.stepsPerUnit;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const paths: TrajectoryPath[] = [];

    for (const block of blocks) {

        const color = operationColor(block.profile.name);

        let x = block.startSteps.x;

        let y = block.startSteps.y;

        const toPoint = (): [number, number] => {
            const pointX = x / stepsX;

            const machineY = y / stepsY;

            const pointY = bedMm
                ? bedMm.height - machineY
                : -machineY;

            minX = Math.min(minX, pointX);
            minY = Math.min(minY, pointY);
            maxX = Math.max(maxX, pointX);
            maxY = Math.max(maxY, pointY);

            return [pointX, pointY];
        };

        let current: {
            travel: boolean;
            points: [number, number][];
        } | null = null;

        const flush = () => {
            if (!current || current.points.length < 2) {
                return;
            }

            paths.push({
                color: current.travel
                    ? TRAVEL_COLOR
                    : color,
                travel: current.travel,
                d:
                    "M " +
                    current.points
                        .map(
                            ([pointX, pointY]) =>
                                `${pointX.toFixed(2)} ${pointY.toFixed(2)}`
                        )
                        .join(" L "),
            });
        };

        for (const segment of block.segments) {

            if (!segment.dx && !segment.dy) {
                continue;
            }

            const travel = Boolean(
                segment.flags & (MICRO_JOG | MICRO_LIFT)
            );

            if (!current || current.travel !== travel) {
                flush();

                current = {
                    travel,
                    points: [toPoint()],
                };
            }

            x += segment.dx;
            y += segment.dy;

            current.points.push(toPoint());
        }

        flush();
    }

    if (paths.length === 0) {
        return null;
    }

    const margin = 5;

    const viewBox = (
        bedMm
            ? [
                -margin,
                -margin,
                bedMm.width + margin * 2,
                bedMm.height + margin * 2,
            ]
            : [
                minX - margin,
                minY - margin,
                maxX - minX + margin * 2,
                maxY - minY + margin * 2,
            ]
    )
        .map((value) => value.toFixed(2))
        .join(" ");

    return {
        paths,
        bed: bedMm,
        viewBox,
    };
}

function flagLabels(flags: number): string {

    const labels: string[] = [];

    if (flags & MICRO_PATH_END) {
        labels.push("END");
    }

    if (flags & MICRO_LIFT) {
        labels.push("LIFT");
    }

    if (flags & MICRO_JOG) {
        labels.push("JOG");
    }

    if (flags & MICRO_PAUSE) {
        labels.push("PAUSE");
    }

    return labels.join("·") || "cut";
}

function ExecutionOperationBlock({
    operation
}: {
    operation: ExecutionOperation;
}) {
    const configuration =
        operation.materialToolConfiguration;

    return (
        <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-2.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span
                        className="h-2.5 w-2.5 rounded-full border border-black/10"
                        style={{
                            backgroundColor:
                                operationColor(
                                    operation.operationId
                                )
                        }}
                    />
                    <span className="text-[12px] font-semibold capitalize text-zinc-900">
                        {operation.operationId}
                    </span>
                </div>
                <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[9px] font-bold text-zinc-500">
                    {operation.objects.length} object{operation.objects.length === 1 ? "" : "s"}
                </span>
            </div>

            <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
                <span className="font-medium text-zinc-400">
                    Tool
                </span>
                <span className="font-semibold text-zinc-800">
                    {operation.tool.name}
                </span>

                <span className="font-medium text-zinc-400">
                    Velocity
                </span>
                <span className="font-semibold text-zinc-800">
                    {configuration.velocity}
                </span>

                <span className="font-medium text-zinc-400">
                    Acceleration
                </span>
                <span className="font-semibold text-zinc-800">
                    {configuration.acceleration}
                </span>

                <span className="font-medium text-zinc-400">
                    Passes
                </span>
                <span className="font-semibold text-zinc-800">
                    {configuration.passes}
                </span>
            </div>

            <div className="mt-2 border-t border-zinc-200 pt-2">
                <ul className="space-y-0.5">
                    {operation.objects.map(
                        (executionObject, index) => (
                            <li
                                key={
                                    executionObject.fabricObject.id ??
                                    index
                                }
                                className="flex items-baseline justify-between gap-2 text-[11px]"
                            >
                                <span className="font-medium capitalize text-zinc-700">
                                    {executionObject.fabricObject.type}
                                </span>
                                {executionObject.fabricObject.id && (
                                    <span className="truncate font-mono text-[9px] text-zinc-400">
                                        {executionObject.fabricObject.id}
                                    </span>
                                )}
                            </li>
                        )
                    )}
                </ul>
            </div>
        </div>
    );
}
