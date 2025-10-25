import type { ResumeDto } from "@reactive-resume/dto";

export type ScoreBreakdown = {
  summary: number;
  skills: number;
  experience: number;
  education: number;
  projects: number;
};

export type ScoreWeights = ScoreBreakdown;

export const defaultScoreWeights: ScoreWeights = {
  // Balanced but emphasizing skills/experience
  summary: 0.05,
  skills: 0.35,
  experience: 0.35,
  education: 0.1,
  projects: 0.15,
};

export function normalizeWeights(input?: Partial<ScoreWeights> | null): ScoreWeights {
  const base = { ...defaultScoreWeights, ...(input ?? {}) } as ScoreWeights;
  const values = Object.values(base).map((v) => Math.max(0, Number(v) || 0));
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum <= 0) return { ...defaultScoreWeights };
  const keys = Object.keys(base) as (keyof ScoreWeights)[];
  const out: any = {};
  keys.forEach((k, i) => {
    out[k] = values[i] / sum;
  });
  return out as ScoreWeights;
}

export function weightedAverage(breakdown: Partial<ScoreBreakdown>, weights: ScoreWeights): number {
  let acc = 0;
  let wsum = 0;
  (Object.keys(weights) as (keyof ScoreWeights)[]).forEach((k) => {
    const w = Math.max(0, Number(weights[k]) || 0);
    const v = Math.max(0, Math.min(1, Number((breakdown as any)[k]) || 0));
    acc += w * v;
    wsum += w;
  });
  if (wsum <= 0) return 0;
  return acc / wsum;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function stripHtmlToText(input: string): string {
  const s = String(input ?? "");
  return s
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractResumeSectionsText(resume?: ResumeDto | null): {
  overall: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
  projects: string;
} {
  if (!resume) {
    return { overall: "", summary: "", skills: "", experience: "", education: "", projects: "" };
  }
  const data: any = resume.data ?? {};
  const basics = data.basics ?? {};
  const sections = data.sections ?? {};

  const overallParts: string[] = [];

  // Basics
  if (basics.name) overallParts.push(String(basics.name));
  if (basics.headline) overallParts.push(String(basics.headline));
  if (basics.location) overallParts.push(String(basics.location));

  // Summary
  const summaryText = sections?.summary?.content ? stripHtmlToText(sections.summary.content) : "";
  if (summaryText) overallParts.push(summaryText);

  // Experience
  const expItems = sections?.experience?.items ?? [];
  const expParts: string[] = [];
  for (const it of expItems) {
    const c: string[] = [];
    if (it.company) c.push(it.company);
    if (it.position) c.push(it.position);
    if (it.location) c.push(it.location);
    if (it.summary) c.push(stripHtmlToText(String(it.summary)));
    expParts.push(c.join(" "));
  }
  if (expParts.length) overallParts.push(expParts.join("\n"));

  // Projects
  const projItems = sections?.projects?.items ?? [];
  const projParts: string[] = [];
  for (const it of projItems) {
    const c: string[] = [];
    if (it.name) c.push(it.name);
    if (it.description) c.push(it.description);
    if (it.summary) c.push(stripHtmlToText(String(it.summary)));
    projParts.push(c.join(" "));
  }
  if (projParts.length) overallParts.push(projParts.join("\n"));

  // Education
  const eduItems = sections?.education?.items ?? [];
  const eduParts: string[] = [];
  for (const it of eduItems) {
    const c: string[] = [];
    if (it.institution) c.push(it.institution);
    if (it.area) c.push(it.area);
    if ((it as any).studyType) c.push(String((it as any).studyType));
    if (it.summary) c.push(stripHtmlToText(String(it.summary)));
    eduParts.push(c.join(" "));
  }
  if (eduParts.length) overallParts.push(eduParts.join("\n"));

  // Skills
  const skillItems = sections?.skills?.items ?? [];
  const skillParts: string[] = [];
  for (const it of skillItems) {
    const c: string[] = [];
    if (it.name) c.push(it.name);
    if (Array.isArray(it.keywords) && it.keywords.length) c.push(it.keywords.join(", "));
    if (it.description) c.push(it.description);
    skillParts.push(c.join(" "));
  }
  if (skillParts.length) overallParts.push(skillParts.join("\n"));

  return {
    overall: overallParts.filter(Boolean).join("\n"),
    summary: summaryText,
    skills: skillParts.join("\n"),
    experience: expParts.join("\n"),
    education: eduParts.join("\n"),
    projects: projParts.join("\n"),
  };
}

