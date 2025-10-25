/* eslint-disable lingui/no-unlocalized-strings */
import { useCoAgent } from "@copilotkit/react-core";
import { cn } from "@reactive-resume/utils";
import React from "react";

type LogItem = { message: string; done: boolean };

export function LogsPanel({ className }: { className?: string }) {
  const { state } = useCoAgent({ name: "resume_agent" });
  const logs: LogItem[] = state?.logs ?? [];
  if (logs.length === 0) return null;

  return (
    <div
      className={cn(
        "mx-4 mt-3 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/40 p-4 text-white backdrop-blur-xl",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold uppercase tracking-widest text-white/70">
          Analysis Logs
        </div>
        <div className="text-xs text-white/60">{logs.length} steps</div>
      </div>
      <div className="space-y-2">
        {logs.map((l, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                l.done ? "bg-emerald-500/20 text-emerald-300" : "bg-sky-500/20 text-sky-300",
              )}
            >
              {l.done ? "✓" : "•"}
            </span>
            <span className={cn("text-sm", l.done ? "text-white/80" : "text-white/90")}>
              {l.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LogsPanel;
