"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AgendaItem = { id: string; time: string; title: string };
export type CaptureEntry = { id: string; text: string; at: string };

type DashboardContextValue = {
  agenda: AgendaItem[];
  setAgenda: React.Dispatch<React.SetStateAction<AgendaItem[]>>;
  tasks: string[];
  addTask: (t: string) => void;
  removeTask: (index: number) => void;
  clearTasks: () => void;
  captures: CaptureEntry[];
  addCapture: (text: string) => void;
  clearCaptures: () => void;
  formatBriefForAgent: () => string;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

const defaultAgenda: AgendaItem[] = [
  { id: "1", time: "09:00", title: "Deep work block" },
  { id: "2", time: "12:30", title: "Lunch / reset" },
  { id: "3", time: "14:00", title: "Review & ship" },
];

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [agenda, setAgenda] = useState<AgendaItem[]>(defaultAgenda);
  const [tasks, setTasks] = useState<string[]>([]);
  const [captures, setCaptures] = useState<CaptureEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const a = loadJson("ff-agenda", defaultAgenda);
    const t = loadJson("ff-tasks", [] as string[]);
    const c = loadJson("ff-captures", [] as CaptureEntry[]);
    console.log("Dashboard Hydrating:", { agendaCount: a.length, taskCount: t.length });
    setAgenda(a);
    setTasks(t);
    setCaptures(c);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("ff-agenda", JSON.stringify(agenda));
  }, [agenda, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("ff-tasks", JSON.stringify(tasks));
  }, [tasks, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("ff-captures", JSON.stringify(captures));
  }, [captures, hydrated]);

  const addTask = useCallback((t: string) => {
    const v = t.trim();
    if (!v) return;
    console.log("Adding task to state:", v);
    setTasks((prev) => [...prev, v]);
  }, []);

  const removeTask = useCallback((index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearTasks = useCallback(() => {
    setTasks([]);
  }, []);

  const addCapture = useCallback((text: string) => {
    const v = text.trim();
    if (!v) return;
    const entry: CaptureEntry = {
      id: crypto.randomUUID(),
      text: v,
      at: new Date().toISOString(),
    };
    setCaptures((prev) => [entry, ...prev].slice(0, 50));
  }, []);

  const clearCaptures = useCallback(() => {
    setCaptures([]);
  }, []);

  const formatBriefForAgent = useCallback(() => {
    const agendaLines = agenda
      .map((a) => `- ${a.time}: ${a.title}`)
      .join("\n");
    const taskLines =
      tasks.length > 0
        ? tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")
        : "(no priority tasks)";
    const recent = captures.slice(0, 3).map((c) => `- ${c.text}`);
    const capBlock =
      recent.length > 0
        ? `Recent quick captures:\n${recent.join("\n")}`
        : "No recent captures.";
    return `Today's agenda:\n${agendaLines}\n\nPriority tasks:\n${taskLines}\n\n${capBlock}`;
  }, [agenda, tasks, captures]);

  const value = useMemo(
    () => ({
      agenda,
      setAgenda,
      tasks,
      addTask,
      removeTask,
      clearTasks,
      captures,
      addCapture,
      clearCaptures,
      formatBriefForAgent,
    }),
    [
      agenda,
      tasks,
      captures,
      addTask,
      removeTask,
      clearTasks,
      addCapture,
      clearCaptures,
      formatBriefForAgent,
    ],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
