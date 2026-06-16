import { useMemo, useState } from 'react'
import {
  Pause,
  Play,
  RotateCcw,
  Send,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react'

import { machineRuntime } from '@/core/machine/runtime'
import { cn } from '@/utils/cn'
import { useMachineStore } from '@/stores/machine.store'

function StatusBadge({
  label,
  value,
}: {
  label: string
  value: string
}) {
  const color =
    value === 'connected'
      ? 'bg-emerald-500'
      : value === 'connecting'
      ? 'bg-amber-500'
      : value === 'error'
      ? 'bg-red-500'
      : value === 'waiting_ack'
      ? 'bg-blue-500'
      : value === 'paused'
      ? 'bg-orange-500'
      : 'bg-zinc-500'

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <div
          className={cn(
            'h-2.5 w-2.5 rounded-full',
            color
          )}
        />

        <span className="font-medium capitalize text-zinc-100">
          {value.replace('_', ' ')}
        </span>
      </div>
    </div>
  )
}

export default function MachineConsole() {
  const runtime = useMemo(
    () => machineRuntime,
    []
  )

  const [command, setCommand] =
    useState('')

  const {
    connectionState,
    queueState,
    currentCommand,
    logs,
    clearLogs,
  } = useMachineStore()

  const handleConnect =
    async () => {
      if (
        connectionState ===
        'connected'
      ) {
        await runtime.disconnect()
        return
      }

      await runtime.connect()
    }

  const handleSend = () => {
    if (!command.trim())
      return

    runtime.send(command)

    setCommand('')
  }

  const handleSendBatch =
    () => {
      runtime.sendMany([
        'MOVE X10',
        'MOVE X20',
        'MOVE X30',
        'MOVE X40',
        'MOVE X50',
      ])
    }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-7xl gap-6 p-6">

        {/* LEFT SIDE */}
        <div className="flex-1 space-y-6">

          {/* HEADER */}
          <div>
            <h1 className="text-3xl font-semibold">
              URUMI Machine Console
            </h1>

            <p className="mt-1 text-zinc-500">
              Runtime &
              communication debugging
            </p>
          </div>

          {/* STATUS */}
          <div className="grid grid-cols-3 gap-4">
            <StatusBadge
              label="Connection"
              value={
                connectionState
              }
            />

            <StatusBadge
              label="Queue"
              value={
                queueState
              }
            />

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Current Command
              </p>

              <p className="mt-2 truncate font-mono text-sm text-zinc-100">
                {currentCommand ??
                  '—'}
              </p>
            </div>
          </div>

          {/* CONNECTION */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-medium">
                  Machine Connection
                </h2>

                <p className="text-sm text-zinc-500">
                  Connect to
                  runtime
                </p>
              </div>

              <button
                onClick={
                  handleConnect
                }
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium transition',

                  connectionState ===
                    'connected'
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                )}
              >
                {connectionState ===
                'connected' ? (
                  <>
                    <WifiOff
                      size={18}
                    />
                    Disconnect
                  </>
                ) : (
                  <>
                    <Wifi
                      size={18}
                    />
                    Connect
                  </>
                )}
              </button>
            </div>
          </div>

          {/* MANUAL COMMAND */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">

            <h2 className="font-medium">
              Manual Command
            </h2>

            <div className="flex gap-3">
              <input
                value={command}
                onChange={(e) =>
                  setCommand(
                    e.target.value
                  )
                }
                placeholder="MOVE X100 Y50"
                className="h-12 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 font-mono outline-none focus:border-zinc-500"
              />

              <button
                onClick={
                  handleSend
                }
                disabled={
                  connectionState !==
                  'connected'
                }
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-medium transition hover:bg-blue-500 disabled:opacity-50"
              >
                <Send
                  size={18}
                />
                Send
              </button>
            </div>
          </div>

          {/* QUEUE CONTROLS */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">

            <h2 className="font-medium">
              Queue Controls
            </h2>

            <div className="flex flex-wrap gap-3">

              <button
                onClick={
                  handleSendBatch
                }
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium transition hover:bg-violet-500"
              >
                Send Test Batch
              </button>

              <button
                onClick={() =>
                  runtime.pause()
                }
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium transition hover:bg-amber-500"
              >
                <Pause
                  size={18}
                />
                Pause
              </button>

              <button
                onClick={() =>
                  runtime.resume()
                }
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium transition hover:bg-emerald-500"
              >
                <Play
                  size={18}
                />
                Resume
              </button>

              <button
                onClick={() =>
                  runtime.retryCurrent()
                }
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium transition hover:bg-red-500"
              >
                <RotateCcw
                  size={18}
                />
                Retry
              </button>
            </div>
          </div>
        </div>

        {/* LOG PANEL */}
        <div className="w-[420px] rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">

          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">

            <div>
              <h2 className="font-medium">
                Runtime Logs
              </h2>

              <p className="text-sm text-zinc-500">
                RX / TX / Errors
              </p>
            </div>

            <button
              onClick={
                clearLogs
              }
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
            >
              <Trash2
                size={18}
              />
            </button>
          </div>

          <div className="h-[calc(100vh-160px)] overflow-y-auto p-4 space-y-2">

            {logs.length ===
            0 ? (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                No runtime logs
              </div>
            ) : (
              logs
                .slice()
                .reverse()
                .map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
                  >
                    <div className="flex items-center justify-between">

                      <span
                        className={cn(
                          'text-xs font-medium uppercase',

                          log.type ===
                            'tx' &&
                            'text-blue-400',

                          log.type ===
                            'rx' &&
                            'text-emerald-400',

                          log.type ===
                            'error' &&
                            'text-red-400',

                          log.type ===
                            'system' &&
                            'text-zinc-400'
                        )}
                      >
                        {log.type}
                      </span>

                      <span className="text-xs text-zinc-500">
                        {new Date(
                          log.timestamp
                        ).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="mt-2 break-all font-mono text-sm text-zinc-200">
                      {log.message}
                    </p>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
