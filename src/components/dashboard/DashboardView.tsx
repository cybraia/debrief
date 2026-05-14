"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Mic,
  MicOff,
  Radio,
  Sparkles,
  StickyNote,
  Trash2,
} from "lucide-react";
import { useDashboard } from "@/context/dashboard-context";
import { VoiceVisualizer } from "@/components/voice/VoiceVisualizer";
import { useVoice } from "@/components/voice/VoiceInterface";

function hudPanelClass(extra = "") {
  return [
    "rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-5 shadow-[0_0_0_1px_rgba(34,211,238,0.06),inset_0_1px_0_rgba(255,255,255,0.04)]",
    "backdrop-blur-md",
    extra,
  ].join(" ");
}

export function DashboardView() {
  const {
    agenda,
    setAgenda,
    tasks,
    addTask,
    removeTask,
    clearTasks,
    captures,
    addCapture,
    clearCaptures,
  } = useDashboard();
  const voice = useVoice();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(56,189,248,0.22),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1400px] flex-col gap-8 px-5 py-8 md:px-10 md:py-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-400/90">
              Focus-Flow
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              No-Touch Command Deck
            </h1>
            <p className="mt-2 max-w-xl text-lg text-slate-400">
              Glanceable HUD for voice-first control. Toggle Listen or enable wake
              phrase <span className="text-cyan-300">&quot;focus flow&quot;</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => voice.setListenOn(!voice.listenOn)}
              className={`flex items-center gap-3 rounded-xl border px-5 py-4 text-lg font-semibold transition ${
                voice.listenOn
                  ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.25)]"
                  : "border-slate-600/80 bg-slate-900/80 text-slate-200 hover:border-cyan-500/40"
              }`}
            >
              {voice.listenOn ? (
                <Mic className="h-7 w-7 text-cyan-300" aria-hidden />
              ) : (
                <MicOff className="h-7 w-7 text-slate-400" aria-hidden />
              )}
              {voice.listenOn ? "Listening" : "Listen"}
            </button>

            <button
              type="button"
              onClick={() => voice.setWakeWordOn(!voice.wakeWordOn)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-4 text-base font-semibold transition ${
                voice.wakeWordOn
                  ? "border-amber-400/50 bg-amber-500/10 text-amber-100"
                  : "border-slate-600/80 bg-slate-900/80 text-slate-300 hover:border-amber-400/30"
              }`}
            >
              <Radio className="h-6 w-6" aria-hidden />
              Wake phrase
            </button>
          </div>
        </header>

        {(voice.error || voice.wakeError) && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-rose-100">
            {voice.error ?? voice.wakeError}
          </div>
        )}

        <section className="flex flex-col items-center gap-6 lg:flex-row lg:items-stretch lg:justify-between">
          <motion.div
            layout
            className={`${hudPanelClass("flex flex-1 flex-col items-center justify-center py-10 lg:min-h-[320px]")} w-full lg:max-w-md`}
          >
            <VoiceVisualizer
              vadScore={voice.vadScore}
              audioLevel={voice.audioLevel}
              mode={voice.uiMode}
            />
            <p className="mt-6 text-center text-xs uppercase tracking-[0.4em] text-cyan-300/80">
              Status
            </p>
            <motion.p
              key={voice.statusLabel}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-center text-4xl font-semibold tracking-wide text-white md:text-5xl"
            >
              {voice.statusLabel}
            </motion.p>
            <p className="mt-3 text-center text-base text-slate-400">
              {voice.connection === "connected"
                ? "ElevenLabs agent session active"
                : "Session idle — start Listen to connect"}
            </p>
          </motion.div>

          <div className="grid flex-1 grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <motion.div
              layout
              className={hudPanelClass("min-h-[220px] xl:col-span-1")}
            >
              <div className="mb-4 flex items-center gap-2 text-cyan-200">
                <Calendar className="h-6 w-6" aria-hidden />
                <h2 className="text-xl font-semibold tracking-tight">
                  Today&apos;s Agenda
                </h2>
              </div>
              <ul className="space-y-3">
                {mounted &&
                  agenda.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 rounded-lg border border-white/5 bg-slate-900/50 px-3 py-3"
                    >
                      <span className="shrink-0 rounded-md bg-cyan-500/15 px-2 py-1 font-mono text-sm text-cyan-200">
                        {item.time}
                      </span>
                      <input
                        className="min-w-0 flex-1 bg-transparent text-lg text-white outline-none placeholder:text-slate-600"
                        suppressHydrationWarning
                        value={item.title}
                        onChange={(e) => {
                          const v = e.target.value;
                          setAgenda((prev) =>
                            prev.map((a) =>
                              a.id === item.id ? { ...a, title: v } : a,
                            ),
                          );
                        }}
                        aria-label={`Agenda ${item.time}`}
                      />
                    </li>
                  ))}
              </ul>
            </motion.div>

            <motion.div
              layout
              className={hudPanelClass("min-h-[220px] xl:col-span-1")}
            >
              <div className="mb-4 flex items-center justify-between gap-2 text-cyan-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6" aria-hidden />
                  <h2 className="text-xl font-semibold tracking-tight">
                    Priority Tasks
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => clearTasks()}
                  className="text-sm text-slate-500 hover:text-rose-300"
                >
                  Clear all
                </button>
              </div>
              <form
                className="mb-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const v = String(fd.get("task") ?? "").trim();
                  if (v) addTask(v);
                  e.currentTarget.reset();
                }}
              >
                <input
                  name="task"
                  placeholder="Add task (optional keyboard)"
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-base text-white outline-none focus:border-cyan-500/50"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100"
                >
                  Add
                </button>
              </form>
              <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {mounted &&
                  (tasks.length === 0 ? (
                    <li className="text-base text-slate-500">
                      No tasks — say &quot;capture note …&quot; or add above.
                    </li>
                  ) : (
                    tasks.map((t, i) => (
                      <li
                        key={`${i}-${t}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-slate-900/40 px-3 py-2"
                      >
                        <span className="text-lg text-white">{t}</span>
                        <button
                          type="button"
                          onClick={() => removeTask(i)}
                          className="rounded-md p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                          aria-label={`Remove ${t}`}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </li>
                    ))
                  ))}
              </ul>
            </motion.div>

            <motion.div
              layout
              className={`${hudPanelClass("min-h-[220px]")} md:col-span-2 xl:col-span-2`}
            >
              <div className="mb-4 flex items-center justify-between gap-2 text-cyan-200">
                <div className="flex items-center gap-2">
                  <StickyNote className="h-6 w-6" aria-hidden />
                  <h2 className="text-xl font-semibold tracking-tight">
                    Quick Capture
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => clearCaptures()}
                  className="text-sm text-slate-500 hover:text-rose-300"
                >
                  Clear all
                </button>
              </div>
              <form
                className="mb-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const v = String(fd.get("note") ?? "").trim();
                  if (v) addCapture(v);
                  e.currentTarget.reset();
                }}
              >
                <input
                  name="note"
                  placeholder="Voice: “capture note …”"
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900/80 px-3 py-2 text-base text-white outline-none focus:border-cyan-500/50"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100"
                >
                  Save
                </button>
              </form>
              <ul className="max-h-40 space-y-2 overflow-y-auto">
                {captures.length === 0 ? (
                  <li className="text-base text-slate-500">
                    Captured thoughts appear here.
                  </li>
                ) : (
                  captures.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-lg border border-white/5 bg-slate-900/40 px-3 py-2"
                    >
                      <p className="text-lg text-white">{c.text}</p>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {new Date(c.at).toISOString()}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </motion.div>
          </div>
        </section>

        <footer className="mt-auto flex flex-wrap items-center gap-4 border-t border-white/5 pt-6 text-base text-slate-500">
          <Sparkles className="h-5 w-5 text-cyan-500/80" aria-hidden />
          <span>
            Voice: <strong className="text-slate-300">&quot;Brief me&quot;</strong>{" "}
            · <strong className="text-slate-300">&quot;Clear tasks&quot;</strong> ·{" "}
            <strong className="text-slate-300">&quot;Capture note …&quot;</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span>
            Configure matching{" "}
            <code className="text-cyan-400/90">client_tools</code> in ElevenLabs
            for tool-based control.
          </span>
        </footer>
      </div>
    </div>
  );
}
