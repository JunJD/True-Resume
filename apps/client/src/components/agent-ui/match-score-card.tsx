/* eslint-disable lingui/no-unlocalized-strings */
import React, { useMemo } from "react";

type Props = {
  score: number; // 0..1
  jdPreview?: string;
  breakdown?: Partial<
    Record<"skills" | "experience" | "education" | "projects" | "summary", number>
  >;
  className?: string;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function useMatchLevel(score: number) {
  const s = clamp01(score);
  if (s >= 0.8)
    return { label: "优秀匹配", color: "text-emerald-400", glow: "shadow-[0_0_40px_#10b98155]" };
  if (s >= 0.6)
    return { label: "良好匹配", color: "text-green-400", glow: "shadow-[0_0_40px_#22c55e55]" };
  if (s >= 0.4)
    return { label: "一般匹配", color: "text-yellow-400", glow: "shadow-[0_0_40px_#f59e0b55]" };
  return { label: "匹配度较低", color: "text-rose-400", glow: "shadow-[0_0_40px_#f43f5e55]" };
}

export function MatchScoreCard({ score, jdPreview, breakdown, className }: Props) {
  const s = clamp01(score);
  const pct = Math.round(s * 100);
  const level = useMatchLevel(s);

  // Circular gauge numbers
  const r = 70;
  const C = 2 * Math.PI * r;
  const dash = C * s;
  const gap = C - dash;

  const gradientId = useMemo(() => `ms-grad-${Math.random().toString(36).slice(2)}`, [score]);

  return (
    <div
      className={[
        "relative w-full max-w-[520px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/40 p-5 backdrop-blur-xl",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(600px_200px_at_20%_-30%,rgba(34,197,94,.15),transparent_60%),radial-gradient(600px_200px_at_100%_10%,rgba(59,130,246,.12),transparent_60%)]",
        level.glow,
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm uppercase tracking-widest text-white/60">Match Score</div>
        <div className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-medium text-white/70 ring-1 ring-white/10">
          实时分析
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[160px_1fr] gap-4 md:grid-cols-[200px_1fr]">
        {/* Gauge */}
        <div className="relative mx-auto flex size-[180px] items-center justify-center md:size-[220px]">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 200 200"
            className="drop-shadow-[0_10px_30px_rgba(0,0,0,.35)]"
          >
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="40%" stopColor="#f59e0b" />
                <stop offset="70%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Track */}
            <g transform="translate(100,100)">
              <circle
                r={r}
                cx={0}
                cy={0}
                fill="none"
                stroke="rgba(148,163,184,.25)"
                strokeWidth={12}
              />

              {/* Progress arc */}
              <g transform="rotate(-90)">
                <circle
                  r={r}
                  cx={0}
                  cy={0}
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeWidth={12}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${gap}`}
                  style={{ transition: "stroke-dasharray 800ms ease-out" }}
                  filter="url(#glow)"
                />
              </g>
            </g>
          </svg>

          {/* Center number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold tracking-tight text-white">
              {pct}
              <span className="ml-1 text-2xl text-white/70">%</span>
            </div>
            <div className={["mt-1 text-sm font-medium", level.color].join(" ")}>{level.label}</div>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col justify-center">
          <div className="text-base font-semibold text-white">职位匹配分析</div>
          <div className="mt-1 text-sm text-white/70">
            根据简历与JD文本的语义相似度计算匹配分数。建议将工作经历与JD关键词对齐，强化量化指标与行动动词。
          </div>

          {/* Bars */}
          <div className="mt-4 space-y-3">
            <Bar label="整体匹配" value={s} />
            {breakdown ? (
              <>
                {typeof breakdown.skills === "number" && (
                  <Bar subtle label="技能匹配" value={breakdown.skills} />
                )}
                {typeof breakdown.experience === "number" && (
                  <Bar subtle label="经验匹配" value={breakdown.experience} />
                )}
                {typeof breakdown.projects === "number" && (
                  <Bar subtle label="项目匹配" value={breakdown.projects} />
                )}
                {typeof breakdown.education === "number" && (
                  <Bar subtle label="教育匹配" value={breakdown.education} />
                )}
                {typeof breakdown.summary === "number" && (
                  <Bar subtle label="总结匹配" value={breakdown.summary} />
                )}
              </>
            ) : (
              <>
                <Bar subtle label="叙述力度" value={Math.max(0.1, Math.min(1, s * 0.9 + 0.1))} />
                <Bar subtle label="技能相关性" value={Math.max(0.1, Math.min(1, s * 0.8 + 0.2))} />
              </>
            )}
          </div>

          {jdPreview ? (
            <div className="mt-4 rounded-lg border border-white/10 bg-white/[.02] p-3 text-xs text-white/70">
              <div className="mb-1 text-[10px] uppercase tracking-widest text-white/50">
                JD 片段
              </div>
              <div className="line-clamp-2">{jdPreview}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Bar({ label, value, subtle }: { label: string; value: number; subtle?: boolean }) {
  const v = clamp01(value);
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs text-white/70">
        <span>{label}</span>
        <span>{Math.round(v * 100)}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={[
            "h-full rounded-full",
            subtle
              ? "bg-gradient-to-r from-sky-400 to-indigo-500"
              : "bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500",
            "transition-[width] duration-700 ease-out",
          ].join(" ")}
          style={{ width: `${Math.round(v * 100)}%` }}
        />
      </div>
    </div>
  );
}

export default MatchScoreCard;
