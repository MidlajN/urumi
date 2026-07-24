import { useMemo, useState } from "react";
import {
    ChevronDown,
    Home,
    Pause,
    Play,
    Plug,
    RotateCcw,
    Square,
    SquareParking,
    Terminal,
    Unplug
} from "lucide-react";

import { machineRuntime } from "@/core/machine/runtime";
import type { RuntimeState } from "@/core/machine/runtime/MachineRuntime";
import { useMachineStore } from "@/stores/machine.store";
import type { RuntimeLog } from "@/stores/machine.store";

const RUNTIME_LABEL: Record<RuntimeState, string> = {
    disconnected: "Disconnected",
    idle: "Idle",
    executing: "Executing",
    paused: "Paused",
    completed: "Completed",
    stopped: "Stopped",
    error: "Error"
};

const RUNTIME_TONE: Record<RuntimeState, string> = {
    disconnected: "bg-zinc-100 text-zinc-500",
    idle: "bg-emerald-50 text-emerald-700",
    executing: "bg-blue-50 text-blue-700",
    paused: "bg-amber-50 text-amber-700",
    completed: "bg-emerald-50 text-emerald-700",
    stopped: "bg-zinc-100 text-zinc-600",
    error: "bg-red-50 text-red-700"
};

const LOG_TONE: Record<RuntimeLog["type"], string> = {
    tx: "text-cyan-300",
    rx: "text-emerald-300",
    system: "text-zinc-400",
    error: "text-red-400"
};

/**
 * Machine control surface: driver + connection, machine commands, job
 * execution and the console. Pure reflection of MachineRuntime / the
 * machine store — no runtime state duplicated here.
 */
export default function MachineControls() {
    const runtime = machineRuntime;

    const connectionState = useMachineStore(
        (state) => state.connectionState
    );

    const runtimeState = useMachineStore(
        (state) => state.runtimeState
    );

    const logs = useMachineStore((state) => state.logs);

    const clearLogs = useMachineStore((state) => state.clearLogs);

    const [consoleOpen, setConsoleOpen] = useState(false);

    const connected = connectionState === "connected";

    const connecting = connectionState === "connecting";

    const idle = runtimeState === "idle";

    const executing = runtimeState === "executing";

    const paused = runtimeState === "paused";

    const running = executing || paused;

    // Manual commands and job start require a connected, idle machine.
    const canCommand = connected && idle;

    const runJob = () => {
        // Placeholder motion program: the runtime frames it with the
        // profile's prep/teardown (home, park, ...). Real segments arrive
        // once the toolpath streaming format lands.
        void runtime.executeJob({ program: [] }).catch(() => {
            // Failure is already surfaced via the runtime error state + logs.
        });
    };

    return (
        <>
            {/* MACHINE */}
            <section className="mt-6">
                <div className="mb-2.5 text-[11px] font-bold uppercase text-zinc-500">
                    Machine
                </div>

                <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-2 p-3">
                        <div className="min-w-0">
                            <div className="truncate text-[13px] font-semibold text-zinc-900">
                                Mock Driver
                            </div>
                            <div className="text-[10px] font-medium text-zinc-400">
                                Simulated serial link
                            </div>
                        </div>

                        <span
                            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold ${
                                connected
                                    ? "text-emerald-600"
                                    : "text-zinc-400"
                            }`}
                        >
                            <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                    connected
                                        ? "bg-emerald-500"
                                        : "bg-zinc-300"
                                }`}
                            />
                            {connected ? "Connected" : "Disconnected"}
                        </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-100 px-3 py-2">
                        <span className="text-[11px] font-medium text-zinc-500">
                            Runtime
                        </span>
                        <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${RUNTIME_TONE[runtimeState]}`}
                        >
                            {RUNTIME_LABEL[runtimeState]}
                        </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-100 px-3 py-2">
                        <span className="text-[11px] font-medium text-zinc-500">
                            Estimated Time
                        </span>
                        <span className="text-[11px] font-semibold text-zinc-900">
                            --
                        </span>
                    </div>

                    {/* Connect slot: Run Job takes the primary spot once connected. */}
                    <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 p-2">
                        {connected ? (
                            <button
                                type="button"
                                disabled={!canCommand}
                                onClick={runJob}
                                className="flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-600 text-[12px] font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Play size={14} />
                                Run Job
                            </button>
                        ) : (
                            <button
                                type="button"
                                disabled={connecting}
                                onClick={() => void runtime.connect()}
                                className="flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-600 text-[12px] font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Plug size={14} />
                                Connect
                            </button>
                        )}
                        <button
                            type="button"
                            disabled={!connected}
                            onClick={() => void runtime.disconnect()}
                            className="flex h-9 items-center justify-center gap-2 rounded-md border border-zinc-200 text-[12px] font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Unplug size={14} />
                            Disconnect
                        </button>
                    </div>

                    {/* Command slot: swaps to job controls while a job runs. */}
                    <div className="grid grid-cols-3 gap-2 border-t border-zinc-100 p-2">
                        {running ? (
                            <>
                                <CommandButton
                                    icon={Pause}
                                    label="Pause"
                                    disabled={!executing}
                                    onClick={() => runtime.pause()}
                                />
                                <CommandButton
                                    icon={Play}
                                    label="Resume"
                                    disabled={!paused}
                                    onClick={() => runtime.resume()}
                                />
                                <CommandButton
                                    icon={Square}
                                    label="Stop"
                                    danger
                                    disabled={!executing && !paused}
                                    onClick={() => runtime.stop()}
                                />
                            </>
                        ) : (
                            <>
                                <CommandButton
                                    icon={Home}
                                    label="Home"
                                    disabled={!canCommand}
                                    onClick={() =>
                                        runtime.executeCommand({ type: "home" })
                                    }
                                />
                                <CommandButton
                                    icon={SquareParking}
                                    label="Park"
                                    disabled={!canCommand}
                                    onClick={() =>
                                        runtime.executeCommand({ type: "park" })
                                    }
                                />
                                <CommandButton
                                    icon={RotateCcw}
                                    label="Reset"
                                    disabled={!canCommand}
                                    onClick={() =>
                                        runtime.executeCommand({ type: "unlock" })
                                    }
                                />
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* CONSOLE */}
            <section className="mt-6">
                <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
                    <button
                        type="button"
                        onClick={() => setConsoleOpen((value) => !value)}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-zinc-50"
                    >
                        <Terminal size={14} className="shrink-0 text-zinc-400" />
                        <span className="flex-1 text-[12px] font-semibold text-zinc-700">
                            Console
                        </span>
                        {logs.length > 0 && (
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500">
                                {logs.length}
                            </span>
                        )}
                        <ChevronDown
                            size={14}
                            className={`shrink-0 text-zinc-400 transition-transform ${
                                consoleOpen ? "rotate-180" : ""
                            }`}
                        />
                    </button>

                    {consoleOpen && (
                        <div className="border-t border-zinc-100">
                            <div className="flex items-center justify-between px-3 py-1.5">
                                <span className="text-[10px] font-bold uppercase text-zinc-400">
                                    Runtime log
                                </span>
                                <button
                                    type="button"
                                    onClick={clearLogs}
                                    disabled={logs.length === 0}
                                    className="text-[10px] font-semibold text-zinc-400 transition hover:text-zinc-700 disabled:opacity-40"
                                >
                                    Clear
                                </button>
                            </div>
                            <ConsoleLog logs={logs} />
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

function CommandButton({
    icon: Icon,
    label,
    disabled,
    onClick,
    danger = false
}: {
    icon: typeof Home;
    label: string;
    disabled: boolean;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`flex h-9 items-center justify-center gap-1.5 rounded-md border bg-white text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                danger
                    ? "border-red-200 text-red-600 hover:bg-red-50"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            }`}
        >
            <Icon size={14} />
            {label}
        </button>
    );
}

function ConsoleLog({ logs }: { logs: RuntimeLog[] }) {
    // Newest first, capped so the panel stays bounded.
    const rows = useMemo(() => logs.slice(-200).reverse(), [logs]);

    if (rows.length === 0) {
        return (
            <div className="px-3 py-6 text-center text-[11px] font-medium text-zinc-400">
                No activity yet.
            </div>
        );
    }

    return (
        <div className="max-h-56 overflow-y-auto bg-zinc-950 p-2 font-mono text-[10px] leading-4">
            {rows.map((log) => (
                <div key={log.id} className="flex gap-2">
                    <span className="shrink-0 uppercase text-zinc-600">
                        {log.type}
                    </span>
                    <span className={`min-w-0 break-all ${LOG_TONE[log.type]}`}>
                        {log.message}
                    </span>
                </div>
            ))}
        </div>
    );
}
