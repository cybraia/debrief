"use client";

import { Conversation } from "@elevenlabs/client";
import type { VoiceConversation } from "@elevenlabs/client";
import type { MessagePayload, Mode, Status } from "@elevenlabs/types";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDashboard } from "@/context/dashboard-context";

export type UiVoiceMode = "idle" | "listening" | "speaking" | "thinking";

type VoiceContextValue = {
  listenOn: boolean;
  setListenOn: (v: boolean) => void;
  wakeWordOn: boolean;
  setWakeWordOn: (v: boolean) => void;
  statusLabel: string;
  uiMode: UiVoiceMode;
  vadScore: number;
  audioLevel: number;
  error: string | null;
  wakeError: string | null;
  connection: Status;
};

const VoiceContext = createContext<VoiceContextValue | null>(null);

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoice must be used within VoiceInterface");
  return ctx;
}

function mapStatusToLabel(
  status: Status,
  mode: Mode | null,
  thinking: boolean,
): { label: string; uiMode: UiVoiceMode } {
  if (status === "connecting" || status === "disconnecting") {
    return { label: "Thinking", uiMode: "thinking" };
  }
  if (status === "disconnected") {
    return { label: "Idle", uiMode: "idle" };
  }
  if (thinking) {
    return { label: "Thinking", uiMode: "thinking" };
  }
  if (mode === "speaking") {
    return { label: "Speaking", uiMode: "speaking" };
  }
  return { label: "Listening", uiMode: "listening" };
}

async function getSessionConfig(): Promise<{
  agentId?: string;
  signedUrl?: string;
}> {
  const publicId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  if (publicId) {
    return { agentId: publicId };
  }
  const res = await fetch("/api/elevenlabs/signed-url");
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Could not get signed URL");
  }
  const data = (await res.json()) as { signedUrl?: string };
  if (!data.signedUrl) throw new Error("Signed URL missing from response");
  return { signedUrl: data.signedUrl };
}

function parseUserVoiceCommand(
  message: string,
  actions: {
    clearTasks: () => void;
    addCapture: (t: string) => void;
    brief: (conv: VoiceConversation) => void;
  },
  conv: VoiceConversation,
) {
  const lower = message.toLowerCase();
  if (/\bclear\s+tasks?\b/i.test(lower)) {
    actions.clearTasks();
  }
  const capture = message.match(/capture note[:\s]+([\s\S]+)/i);
  if (capture?.[1]) {
    actions.addCapture(capture[1].trim());
  }
  if (lower.includes("brief me")) {
    actions.brief(conv);
  }
}

export function VoiceInterface({ children }: { children: React.ReactNode }) {
  const dashboard = useDashboard();
  const dashRef = useRef(dashboard);
  useEffect(() => {
    dashRef.current = dashboard;
  }, [dashboard]);

  const [listenOn, setListenOn] = useState(false);
  const [wakeWordOn, setWakeWordOn] = useState(false);
  const [vadScore, setVadScore] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [mode, setMode] = useState<Mode | null>(null);
  const [status, setStatus] = useState<Status>("disconnected");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wakeError, setWakeError] = useState<string | null>(null);

  const convRef = useRef<VoiceConversation | null>(null);
  const thinkingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenOnRef = useRef(listenOn);
  useEffect(() => {
    listenOnRef.current = listenOn;
  }, [listenOn]);

  useEffect(() => {
    if (!listenOn) {
      void convRef.current?.endSession();
      convRef.current = null;
      /* eslint-disable react-hooks/set-state-in-effect -- reset UI when session off */
      setStatus("disconnected");
      setMode(null);
      setVadScore(0);
      setAudioLevel(0);
      setThinking(false);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }

    let cancelled = false;
    let raf = 0;

    (async () => {
      setError(null);
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const auth = await getSessionConfig();
        const sessionOptions =
          "signedUrl" in auth && auth.signedUrl
            ? { signedUrl: auth.signedUrl, connectionType: "websocket" as const }
            : { agentId: auth.agentId!, connectionType: "websocket" as const };

        const runBrief = (conv: VoiceConversation) => {
          const snapshot = dashRef.current.formatBriefForAgent();
          conv.sendContextualUpdate(
            `The user asked for a briefing. Read the following aloud in a clear, professional tone. Do not skip items. If a section is empty, say so briefly.\n\n${snapshot}`,
          );
        };

        const conv = (await Conversation.startSession({
          ...sessionOptions,
          clientTools: {
            clear_tasks: async () => {
              dashRef.current.clearTasks();
              return "Priority tasks cleared on the dashboard.";
            },
            capture_note: async ({ text }: { text: string }) => {
              dashRef.current.addCapture(String(text));
              return "Note added to Quick Capture.";
            },
            get_dashboard_brief: async () => {
              return dashRef.current.formatBriefForAgent();
            },
          },
          onConnect: () => {
            setThinking(false);
          },
          onDisconnect: () => {
            convRef.current = null;
            if (!cancelled && listenOnRef.current) {
              setListenOn(false);
            }
          },
          onError: (msg) => {
            setError(msg);
          },
          onMessage: (props: MessagePayload) => {
            if (props.role === "user") {
              setThinking(true);
              if (thinkingTimer.current) clearTimeout(thinkingTimer.current);
              thinkingTimer.current = setTimeout(() => setThinking(false), 4500);
              parseUserVoiceCommand(
                props.message,
                {
                  clearTasks: () => dashRef.current.clearTasks(),
                  addCapture: (t) => dashRef.current.addCapture(t),
                  brief: runBrief,
                },
                conv,
              );
            }
            if (props.role === "agent") {
              if (thinkingTimer.current) clearTimeout(thinkingTimer.current);
              setThinking(false);
            }
          },
          onModeChange: ({ mode: m }) => {
            setMode(m);
            if (m === "speaking") setThinking(false);
          },
          onStatusChange: ({ status: s }) => setStatus(s),
          onVadScore: ({ vadScore: v }) => setVadScore(v),
        })) as VoiceConversation;

        if (cancelled) {
          await conv.endSession();
          return;
        }
        convRef.current = conv;

        const tick = () => {
          const c = convRef.current;
          if (!c) return;
          try {
            const inV = c.getInputVolume?.() ?? 0;
            const outV = c.getOutputVolume?.() ?? 0;
            setAudioLevel(Math.max(inV, outV));
          } catch {
            /* ignore */
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Voice session failed");
        setListenOn(false);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      void convRef.current?.endSession();
      convRef.current = null;
    };
  }, [listenOn]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWakeError(null);
    if (!wakeWordOn || listenOn) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setWakeError("Wake phrase needs a browser with Web Speech API (Chrome/Edge).");
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const text = ev.results[i][0].transcript.toLowerCase();
        if (/\b(focus flow|focus on|hey focus)\b/.test(text)) {
          setListenOn(true);
        }
      }
    };
    rec.onerror = () => {};
    try {
      rec.start();
    } catch {
      setWakeError("Could not start wake-word listener.");
    }
    return () => {
      try {
        rec.stop();
      } catch {
        /* */
      }
    };
  }, [wakeWordOn, listenOn]);

  const { label, uiMode } = useMemo(
    () => mapStatusToLabel(status, mode, thinking),
    [status, mode, thinking],
  );

  const value = useMemo<VoiceContextValue>(
    () => ({
      listenOn,
      setListenOn,
      wakeWordOn,
      setWakeWordOn,
      statusLabel: label,
      uiMode,
      vadScore,
      audioLevel,
      error,
      wakeError,
      connection: status,
    }),
    [
      listenOn,
      wakeWordOn,
      label,
      uiMode,
      vadScore,
      audioLevel,
      error,
      wakeError,
      status,
    ],
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}
