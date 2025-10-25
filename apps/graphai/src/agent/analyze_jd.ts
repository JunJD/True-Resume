import { interrupt } from "@langchain/langgraph";
import { InMemoryStore } from "@langchain/core/stores";
import { CacheBackedEmbeddings } from "@langchain/classic/embeddings/cache_backed";
import { createEmbeddingModel } from "./modal.js";
import { AgentState } from "./state.js";
import type { ResumeDto } from "@reactive-resume/dto";
import { RunnableConfig } from "@langchain/core/runnables";
import { copilotkitEmitState } from "@copilotkit/sdk-js/langgraph";
import {
  extractResumeSectionsText,
  stripHtmlToText,
  cosineSimilarity,
  normalizeWeights,
  weightedAverage,
} from "./utils/scoring.js";
// use logs instead of emitting chat messages

// Cache-backed embeddings (in-memory store for now)
const inMemoryStore = new InMemoryStore();
const underlyingEmbeddings = createEmbeddingModel();
const cacheBackedEmbeddings = CacheBackedEmbeddings.fromBytesStore(
    underlyingEmbeddings,
    inMemoryStore,
    {
        namespace: underlyingEmbeddings.model,
    }
);

// helpers moved to ./utils/scoring

export const analyze_jd_node = async (state: AgentState, config: RunnableConfig) => {
    // Logs collector
    const logs = [...(state["logs"] || [])] as { message: string; done: boolean }[];
    const emitLogs = async () => {
        await copilotkitEmitState(config, { logs });
    };
    // Ensure we have JD content; if not, interrupt to request it
    let jdText = state.jdContent;
    if (!jdText) {
        const approved = interrupt("请粘贴你想要面试岗位的招聘信息(JD),我会根据JD优化你的简历");
        // On resume, we expect a message-like structure or direct string
        const last = Array.isArray(approved) ? approved[approved.length - 1] : approved;
        jdText = typeof last === "string" ? last : (last?.content ?? "");
        state.jdContent = jdText;
    }

    logs.push({ message: "开始解析 JD 与简历…", done: false });
    await emitLogs();

    const texts = extractResumeSectionsText(state.resume as ResumeDto);
    const cleanJd = stripHtmlToText(String(jdText ?? ""));
    try {
        const resumeAny: any = state.resume as any;
        const sec = resumeAny?.data?.sections ?? {};
        const expCount = (sec?.experience?.items ?? []).length ?? 0;
        const projCount = (sec?.projects?.items ?? []).length ?? 0;
        const skillCount = (sec?.skills?.items ?? []).length ?? 0;
        const eduCount = (sec?.education?.items ?? []).length ?? 0;
        logs.push({
            message: `简历结构：经历 ${expCount} | 项目 ${projCount} | 技能 ${skillCount} | 教育 ${eduCount}`,
            done: true,
        });
        logs.push({ message: `JD 文本长度：${cleanJd.length} 字符`, done: true });
        await emitLogs();
    } catch {}

    // If either side is empty, set score to 0 and persist JD content if provided
    if (!cleanJd || !texts.overall) {
        logs.push({ message: "缺少 JD 或简历内容，评分为 0", done: true });
        await emitLogs();
        return {
            jdContent: cleanJd || jdText || "",
            currentScore: 0,
            logs,
        } as Partial<AgentState>;
    }

    logs.push({ message: "开始向量化：JD 全文 + 简历分段(5)", done: false });
    await emitLogs();

    // Embed both texts with cache-backed embeddings (parallel)
    const t0 = Date.now();
    const [
        jdEmbedding,
        summaryEmb,
        skillsEmb,
        expEmb,
        eduEmb,
        projEmb,
    ] = await Promise.all([
        cacheBackedEmbeddings.embedQuery(cleanJd),
        cacheBackedEmbeddings.embedQuery(texts.summary || ""),
        cacheBackedEmbeddings.embedQuery(texts.skills || ""),
        cacheBackedEmbeddings.embedQuery(texts.experience || ""),
        cacheBackedEmbeddings.embedQuery(texts.education || ""),
        cacheBackedEmbeddings.embedQuery(texts.projects || ""),
    ]);

    logs[logs.length - 1] = { message: "向量化完成，正在计算分段相似度…", done: true };
    await emitLogs();
    const embTime = Date.now() - t0;
    // Compute cosine similarity (0-1)
    const breakdown = {
        summary: texts.summary ? Math.max(0, Math.min(1, cosineSimilarity(summaryEmb, jdEmbedding))) : 0,
        skills: texts.skills ? Math.max(0, Math.min(1, cosineSimilarity(skillsEmb, jdEmbedding))) : 0,
        experience: texts.experience ? Math.max(0, Math.min(1, cosineSimilarity(expEmb, jdEmbedding))) : 0,
        education: texts.education ? Math.max(0, Math.min(1, cosineSimilarity(eduEmb, jdEmbedding))) : 0,
        projects: texts.projects ? Math.max(0, Math.min(1, cosineSimilarity(projEmb, jdEmbedding))) : 0,
    };
    const weights = normalizeWeights((state as any).scoreWeights);
    const score = weightedAverage(breakdown, weights);
    // Debug log to aid tuning
    console.debug(`[analyze_jd_node] embeddings=${embTime}ms score=${score.toFixed(4)} breakdown=${JSON.stringify(breakdown)} weights=${JSON.stringify(weights)}`);

    // Emit per-section results
    const pct = (v: number) => `${Math.round((v ?? 0) * 100)}%`;
    logs.push({ message: `分段：总结 ${pct(breakdown.summary)} | 技能 ${pct(breakdown.skills)} | 经验 ${pct(breakdown.experience)} | 教育 ${pct(breakdown.education)} | 项目 ${pct(breakdown.projects)}`, done: true });
    logs.push({ message: `权重：总结 ${pct(weights.summary)} | 技能 ${pct(weights.skills)} | 经验 ${pct(weights.experience)} | 教育 ${pct(weights.education)} | 项目 ${pct(weights.projects)}`, done: true });
    logs.push({ message: `总体得分（加权）：${(score * 100).toFixed(1)}%`, done: true });
    const threshold = 0.7;
    logs.push({ message: score >= threshold ? "路由：匹配度达标，流程结束" : "路由：匹配度偏低，进入优化节点", done: true });
    await copilotkitEmitState(config, {
        currentScore: score,
        scoreBreakdown: breakdown,
        scoreWeights: weights,
        logs,
    });
    return {
        jdContent: cleanJd,
        currentScore: score,
        scoreBreakdown: breakdown,
        scoreWeights: weights,
        logs,
    } as Partial<AgentState>;
};
