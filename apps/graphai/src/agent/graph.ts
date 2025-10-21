import { randomUUID } from "crypto";

import { z } from "zod";
import { RunnableConfig } from "@langchain/core/runnables";
import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { SimpleChatModel } from "@langchain/core/language_models/chat_models";
import { copilotkitEmitState } from "@copilotkit/sdk-js/langgraph";

import type {
  AgentState,
  ConversationPhase,
  ExperienceInsight,
  FollowUpQuestion,
  FollowUpType,
  JDInsights,
  ResumeContext,
  ResumeSuggestion,
  RuntimeState,
} from "./state.js";
import {
  AgentStateAnnotation,
  JOB_CATEGORIES,
  createInitialResumeContext,
  createInitialRuntimeState,
} from "./state.js";

const ResumeSignalSchema = z.object({
  targetRole: z.string().min(2).optional(),
  targetCompany: z.string().min(2).optional(),
  resumeStatus: z.enum(["blank", "rough", "polished"]).optional(),
  jobCategory: z.enum(JOB_CATEGORIES).optional(),
  jobDescription: z.string().min(30).optional(),
  focusStrengths: z.array(z.string().min(2)).optional(),
  experiences: z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.string(),
        role: z.string().optional(),
        company: z.string().optional(),
        timeframe: z.string().optional(),
        summary: z.string().optional(),
        metrics: z.array(z.string()).optional(),
        techHighlights: z.array(z.string()).optional(),
        businessImpact: z.array(z.string()).optional(),
        leadershipSignals: z.array(z.string()).optional(),
        needs: z
          .object({
            quantify: z.boolean().optional(),
            techDepth: z.boolean().optional(),
            impact: z.boolean().optional(),
          })
          .optional(),
      })
    )
    .optional(),
  followUpAnswers: z
    .array(
      z.object({
        followUpId: z.string().optional(),
        experienceLabel: z.string().optional(),
        insights: z
          .object({
            metrics: z.array(z.string()).optional(),
            techHighlights: z.array(z.string()).optional(),
            businessImpact: z.array(z.string()).optional(),
            narrative: z.string().optional(),
          })
          .optional(),
      })
    )
    .optional(),
  suggestionFeedback: z
    .array(
      z.object({
        suggestionId: z.string().optional(),
        decision: z.enum(["approve", "reject", "revise"]),
        reason: z.string().optional(),
      })
    )
    .optional(),
  clarificationNeeded: z.boolean().optional(),
  additionalNotes: z.string().optional(),
});

type ResumeSignals = z.infer<typeof ResumeSignalSchema>;

const JDInsightsSchema = z.object({
  summary: z.string(),
  responsibilities: z.array(z.string()),
  mustHaveSkills: z.array(z.string()),
  niceToHaveSkills: z.array(z.string()),
  businessFocus: z.array(z.string()),
  clarifyingQuestions: z.array(z.string()),
});

const SuggestionSchema = z.object({
  bullet: z.string(),
  title: z.string().optional(),
  rationale: z.string(),
  alignmentTags: z.array(z.string()).default([]),
});

// 通过环境变量切换 LLM 或 CoAgent 名称，部署时无需改动代码。
const DEFAULT_MODEL_NAME = process.env.GRAPHAI_MODEL ?? process.env.OPENAI_MODEL ?? "qwen-max";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? process.env.DASHSCOPE_API_KEY ?? "";
const COAGENT_NAME = process.env.COPILOTKIT_COAGENT_NAME ?? "resume_agent";

let latestContextSnapshot: ResumeContext | null = null;

const getResumeContextTool = tool(
  () => JSON.stringify(latestContextSnapshot ?? {}, null, 2),
  {
    name: "get_resume_context",
    description:
      "Return the most recent structured summary of the user's profile, JD insights, experiences, pending questions, and drafted suggestions.",
    schema: z.object({}),
  }
);

const tools = [getResumeContextTool];

// 将 LangGraph 状态增量推送给 CopilotKit，驱动 useCoAgent 的实时同步。
async function emitCoagentState(
  config: RunnableConfig | undefined,
  nodeName: string,
  payload: { resumeContext: ResumeContext; runtime: RuntimeState }
) {
  if (!config) {
    return;
  }

  try {
    await copilotkitEmitState(config, {
      name: COAGENT_NAME,
      nodeName,
      state: payload,
    });
  } catch (error) {
    console.debug("Failed to emit coagent state", error);
  }
}

class LocalCoachingModel extends SimpleChatModel {
  constructor(private readonly phase: ConversationPhase, private readonly context: ResumeContext) {
    super({});
  }

  _identifyingParams(): Record<string, unknown> {
    return { name: "local-resume-coach", phase: this.phase };
  }

  _llmType(): string {
    return "local-resume-coach";
  }

  async _call(messages: BaseMessage[]): Promise<string> {
    const lastHuman = [...messages].reverse().find((message) => message._getType() === "human");
    const userText = lastHuman ? messageContentToString(lastHuman) : "";
    const language = detectLanguage(userText);
    const experienceLabel = this.context.experiences.at(-1)?.label;

    switch (this.phase) {
      case "init":
        return language === "zh"
          ? "你好！先了解一下你的情况：目标岗位、是否有JD、目前简历状态以及你最希望突出的优势？"
          : "Hi! Let's start with the basics—target role, JD availability, current resume state, and strengths you want to spotlight.";
      case "parse_jd":
        return language === "zh"
          ? "我已收到JD，会解析出核心要求并告诉你接下来重点挖掘的方向。"
          : "Thanks for the JD! I'll pull out the key requirements and guide what to explore next.";
      case "interview": {
        if (experienceLabel) {
          return language === "zh"
            ? `我们继续深入「${experienceLabel}」。先聊聊项目规模和你负责的部分好吗？`
            : `Let's keep digging into "${experienceLabel}". Could you walk me through the scale and your responsibilities?`;
        }
        return language === "zh"
          ? "挑一个你最想突出的经历，先给我讲讲背景和你的角色。"
          : "Pick the experience you're most proud of—give me the context and your role.";
      }
      case "synthesize":
        return language === "zh"
          ? "我会把刚才挖掘的亮点整理成一版更有说服力的描述，等你审批。"
          : "I'll turn the details we gathered into a stronger resume bullet for you to approve.";
      case "await_approval":
        return language === "zh"
          ? "请在右侧审批卡片里确认或调整我刚才给出的建议，有任何反馈随时告诉我。"
          : "Take a look at the suggestions I proposed—approve or tweak them, and let me know what you'd like adjusted.";
      case "validate":
        return language === "zh"
          ? "我会预留JD对齐检验的壳子，稍后你可以接入最终逻辑。"
          : "I'll provide a placeholder for JD alignment checks so you can plug in the actual logic later.";
      default:
        return language === "zh"
          ? "好的，我们继续完善你的简历。"
          : "Sounds good—let's keep sharpening your resume.";
    }
  }
}

function hasLLMProvider(): boolean {
  return Boolean(OPENAI_API_KEY);
}

function createChatModel(phase: ConversationPhase, context: ResumeContext) {
  if (hasLLMProvider()) {
    return new ChatOpenAI({
      modelName: DEFAULT_MODEL_NAME,
      temperature: phase === "synthesize" ? 0.65 : phase === "init" ? 0.35 : 0.5,
      openAIApiKey: OPENAI_API_KEY,
      configuration: OPENAI_BASE_URL ? { baseURL: OPENAI_BASE_URL } : undefined,
    });
  }

  return new LocalCoachingModel(phase, context);
}

async function ingestNode(state: AgentState, config: RunnableConfig) {
  const harvest = await harvestLatestSignals(state);
  latestContextSnapshot = harvest.resumeContext;

  harvest.runtime.currentNode = "ingest_node";

  return {
    resumeContext: harvest.resumeContext,
    runtime: harvest.runtime,
  } satisfies Partial<AgentState>;
}

async function chatNode(state: AgentState, config: RunnableConfig) {
  const context = state.resumeContext ?? createInitialResumeContext();
  const runtime = state.runtime ?? createInitialRuntimeState();
  const phase = determineConversationPhase(context, runtime);
  const language = detectLanguageFromMessages(state.messages);

  // 按阶段动态生成提示词与模型参数，使对话流程更可控。
  const systemPrompt = buildSystemPrompt(phase, context, language);
  const model = createChatModel(phase, context);

  const availableTools = [
    ...(state.copilotkit?.actions ?? []),
    ...tools,
  ];

  const modelWithTools = typeof (model as any).bindTools === "function"
    ? (model as any).bindTools(availableTools)
    : model;

  const response = await modelWithTools.invoke([
    new SystemMessage({ content: systemPrompt }),
    ...state.messages,
  ], config);

  const updatedRuntime: RuntimeState = {
    ...runtime,
    turn: runtime.turn + 1,
    currentNode: "chat_node",
    phase,
  };

  await emitCoagentState(config, "chat_node", {
    resumeContext: context,
    runtime: updatedRuntime,
  });

  return {
    messages: response,
    runtime: updatedRuntime,
  } satisfies Partial<AgentState>;
}

async function parseJDNode(state: AgentState, config: RunnableConfig) {
  const context = cloneResumeContext(state.resumeContext);
  if (!context.jobDescription) {
    const runtime = {
      ...(state.runtime ?? createInitialRuntimeState()),
      currentNode: "parse_jd_node",
      phase: "parse_jd" as ConversationPhase,
    };
    await emitCoagentState(config, "parse_jd_node", {
      resumeContext: context,
      runtime,
    });
    return {
      runtime,
    } satisfies Partial<AgentState>;
  }

  context.jdInsights = await deriveJDInsights(context.jobDescription, context);
  latestContextSnapshot = context;

  const runtime = {
    ...(state.runtime ?? createInitialRuntimeState()),
    currentNode: "parse_jd_node",
    phase: "parse_jd" as ConversationPhase,
  };

  await emitCoagentState(config, "parse_jd_node", {
    resumeContext: context,
    runtime,
  });

  return {
    resumeContext: context,
    runtime,
  } satisfies Partial<AgentState>;
}

async function synthesizeNode(state: AgentState, config: RunnableConfig) {
  const context = cloneResumeContext(state.resumeContext);
  const runtime = { ...(state.runtime ?? createInitialRuntimeState()) };

  const targetExperience = context.experiences.find((experience) =>
    !experience.needs.quantify &&
    !experience.needs.techDepth &&
    !experience.needs.impact &&
    !context.suggestions.some(
      (suggestion) =>
        suggestion.experienceId === experience.id && suggestion.status === "pending"
    )
  );

  if (!targetExperience) {
    runtime.pendingSynthesis = false;
    runtime.currentNode = "synthesize_node";
    runtime.phase = "synthesize";

    await emitCoagentState(config, "synthesize_node", {
      resumeContext: context,
      runtime,
    });

    return {
      runtime,
    } satisfies Partial<AgentState>;
  }

  const suggestion = await craftSuggestion(targetExperience, context, config);
  const suggestionEntry: ResumeSuggestion = {
    id: randomUUID(),
    section: "experience",
    experienceId: targetExperience.id,
    title: suggestion.title ?? `${targetExperience.label} 亮点改写`,
    before: targetExperience.summary ?? "",
    after: suggestion.bullet,
    rationale: suggestion.rationale,
    alignmentTags: suggestion.alignmentTags,
    status: "pending",
  };

  context.suggestions = [...context.suggestions, suggestionEntry];
  runtime.pendingSynthesis = shouldSynthesize(context);
  runtime.awaitingApprovalNotified = false;
  runtime.currentNode = "synthesize_node";
  runtime.phase = "synthesize";
  latestContextSnapshot = context;

  await emitCoagentState(config, "synthesize_node", {
    resumeContext: context,
    runtime,
  });

  return {
    resumeContext: context,
    runtime,
  } satisfies Partial<AgentState>;
}

async function craftSuggestion(
  experience: ExperienceInsight,
  context: ResumeContext,
  config: RunnableConfig
) {
  if (!hasLLMProvider()) {
    return {
      bullet: `主导${experience.label}，聚焦结果与影响的表述待补充。`,
      rationale: "占位建议，等待模型可用时补全细节。",
      alignmentTags: [],
    } satisfies z.infer<typeof SuggestionSchema>;
  }

  const structuredModel = (createChatModel("synthesize", context) as ChatOpenAI).withStructuredOutput(
    SuggestionSchema,
    { name: "ResumeSuggestion", method: "jsonMode" }
  );

  const system = new SystemMessage({
    content:
      "You generate high-impact resume bullets based on the structured details provided. Focus on clarity, quantifiable outcomes, and differentiation.",
  });

  const human = new HumanMessage({
    content: `Experience label: ${experience.label}
Role: ${experience.role ?? "未说明"}
Company: ${experience.company ?? "未说明"}
Timeframe: ${experience.timeframe ?? "未说明"}
Existing summary: ${experience.summary ?? "(none)"}
Metrics captured: ${experience.metrics.join("; ") || "未提供"}
Technical highlights: ${experience.techHighlights.join("; ") || "未提供"}
Business impact: ${experience.businessImpact.join("; ") || "未提供"}
Leadership signals: ${experience.leadershipSignals.join("; ") || "未提供"}
Target JD must-haves: ${(context.jdInsights?.mustHaveSkills ?? []).join(", ")}
Target JD nice-to-haves: ${(context.jdInsights?.niceToHaveSkills ?? []).join(", ")}

Please craft a single concise resume bullet (适合中英任一语言) that showcases technical depth, measurable impact, and business value. Provide a brief rationale explaining why this bullet is compelling and list up to four alignment tags.`,
  });

  try {
    return await structuredModel.invoke([system, human], config);
  } catch (error) {
    console.warn("Failed to craft suggestion via LLM, falling back", error);
    return {
      bullet: `${experience.label}: 带上量化指标和业务影响，形成一句完整表述。`,
      rationale: "模型未返回结果，使用占位提示。",
      alignmentTags: [],
    } satisfies z.infer<typeof SuggestionSchema>;
  }
}

async function awaitApprovalNode(state: AgentState, config: RunnableConfig) {
  const runtime = { ...(state.runtime ?? createInitialRuntimeState()) };
  runtime.awaitingApprovalNotified = true;
  runtime.currentNode = "await_approval_node";
  runtime.phase = "await_approval";

  const context = state.resumeContext ?? createInitialResumeContext();

  await emitCoagentState(config, "await_approval_node", {
    resumeContext: context,
    runtime,
  });

  return {
    runtime,
  } satisfies Partial<AgentState>;
}

function ingestRouter(state: AgentState): string {
  const context = state.resumeContext ?? createInitialResumeContext();
  const runtime = state.runtime ?? createInitialRuntimeState();

  if (context.jobDescription && !context.jdInsights) {
    return "parse_jd_node";
  }

  if (runtime.pendingSynthesis) {
    return "synthesize_node";
  }

  const hasPending = context.suggestions.some((suggestion) => suggestion.status === "pending");
  if (hasPending && !runtime.awaitingApprovalNotified) {
    return "await_approval_node";
  }

  return "chat_node";
}

const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("ingest_node", ingestNode)
  .addNode("chat_node", chatNode)
  .addNode("parse_jd_node", parseJDNode)
  .addNode("synthesize_node", synthesizeNode)
  .addNode("await_approval_node", awaitApprovalNode)
  .addConditionalEdges("ingest_node", ingestRouter as any, [
    "parse_jd_node",
    "synthesize_node",
    "await_approval_node",
    "chat_node",
  ])
  .addEdge(START, "ingest_node")
  .addEdge("parse_jd_node", "ingest_node")
  .addEdge("synthesize_node", "ingest_node")
  .addEdge("await_approval_node", "ingest_node")
  .addEdge("chat_node", "__end__");

const memory = new MemorySaver();

export const graph = workflow.compile({
  checkpointer: memory,
});

export function route(): string {
  return "ingest_node";
}

async function harvestLatestSignals(state: AgentState) {
  const runtime: RuntimeState = { ...(state.runtime ?? createInitialRuntimeState()) };
  const resumeContext = cloneResumeContext(state.resumeContext);
  const phaseForExtraction = determineConversationPhase(resumeContext, runtime);

  // 仅在检测到新的用户消息时才触发信号抽取，避免重复处理旧数据。
  const lastHumanIndex = findLastHumanMessageIndex(state.messages);
  if (lastHumanIndex !== undefined && lastHumanIndex > runtime.lastProcessedMessageIndex) {
    const lastHumanMessage = state.messages[lastHumanIndex];
    const userText = messageContentToString(lastHumanMessage);
    const signals = await extractSignals(userText, phaseForExtraction, resumeContext);
    const mergeResult = applySignals(resumeContext, signals);

    runtime.lastProcessedMessageIndex = lastHumanIndex;
    runtime.pendingSynthesis = runtime.pendingSynthesis || mergeResult.pendingSynthesis;

    if (mergeResult.resolvedQuestionIds.length) {
      resumeContext.pendingQuestions = resumeContext.pendingQuestions.map((question) =>
        mergeResult.resolvedQuestionIds.includes(question.id)
          ? { ...question, resolved: true }
          : question
      );

      if (
        runtime.awaitingFollowUpId &&
        mergeResult.resolvedQuestionIds.includes(runtime.awaitingFollowUpId)
      ) {
        runtime.awaitingFollowUpId = null;
      }
    }

    mergeResult.pendingQuestionsToAdd.forEach((question) => {
      resumeContext.pendingQuestions.push({
        ...question,
        askedAtTurn: runtime.turn,
      });
      runtime.awaitingFollowUpId = question.id;
    });

    resumeContext.focusStrengths = mergeUniqueStrings(
      resumeContext.focusStrengths,
      mergeResult.strengthsToAdd
    );

    resumeContext.experiences = mergeResult.updatedExperiences;
    resumeContext.jobDescription = mergeResult.jobDescription ?? resumeContext.jobDescription;
    resumeContext.jdInsights = mergeResult.jdInsights ?? resumeContext.jdInsights;
    resumeContext.targetRole = mergeResult.targetRole ?? resumeContext.targetRole;
    resumeContext.targetCompany = mergeResult.targetCompany ?? resumeContext.targetCompany;
    resumeContext.resumeStatus = mergeResult.resumeStatus ?? resumeContext.resumeStatus;
    resumeContext.jobCategory = mergeResult.jobCategory ?? resumeContext.jobCategory;
    resumeContext.narrativeStrategy = mergeResult.narrativeStrategy ?? resumeContext.narrativeStrategy;
    resumeContext.suggestions = mergeResult.updatedSuggestions;

    if (!mergeResult.hasPendingSuggestions) {
      runtime.awaitingApprovalNotified = false;
    }
  }

  runtime.pendingSynthesis = runtime.pendingSynthesis || shouldSynthesize(resumeContext);

  const stage = determineConversationPhase(resumeContext, runtime);
  runtime.phase = stage;

  return {
    resumeContext,
    runtime,
  } satisfies {
    resumeContext: ResumeContext;
    runtime: RuntimeState;
  };
}

function cloneResumeContext(context: ResumeContext | undefined): ResumeContext {
  const source = context ?? createInitialResumeContext();
  return {
    ...source,
    focusStrengths: [...source.focusStrengths],
    experiences: source.experiences.map((experience) => ({
      ...experience,
      metrics: [...experience.metrics],
      techHighlights: [...experience.techHighlights],
      businessImpact: [...experience.businessImpact],
      leadershipSignals: [...experience.leadershipSignals],
      needs: { ...experience.needs },
    })),
    pendingQuestions: source.pendingQuestions.map((question) => ({ ...question })),
    suggestions: source.suggestions.map((suggestion) => ({ ...suggestion })),
    narrativeStrategy: source.narrativeStrategy ? { ...source.narrativeStrategy } : null,
    jdInsights: source.jdInsights ? { ...source.jdInsights } : null,
  };
}

function findLastHumanMessageIndex(messages: BaseMessage[]): number | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]._getType() === "human") {
      return index;
    }
  }
  return undefined;
}

function messageContentToString(message: BaseMessage): string {
  const { content } = message;
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (part?.type === "text" && typeof part?.text === "string") {
          return part.text;
        }

        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return String(content ?? "");
}

async function extractSignals(
  userText: string,
  phase: ConversationPhase,
  context: ResumeContext
): Promise<ResumeSignals> {
  if (!userText.trim()) {
    return {};
  }

  if (!hasLLMProvider()) {
    return fallbackExtraction(userText);
  }

  const extractor = (createChatModel(phase, context) as ChatOpenAI).withStructuredOutput(
    ResumeSignalSchema,
    {
      name: "ResumeSignalExtraction",
      method: "jsonMode",
    }
  );

  const system = new SystemMessage({
    content:
      "You extract structured resume signals from user replies for a resume optimization agent. Return JSON matching the schema.",
  });

  const human = new HumanMessage({
    content: `Conversation phase: ${phase}
Current context snapshot: ${JSON.stringify(
      {
        targetRole: context.targetRole,
        jobCategory: context.jobCategory,
        strengths: context.focusStrengths,
        pendingQuestions: context.pendingQuestions,
        experiences: context.experiences.map((experience) => ({
          id: experience.id,
          label: experience.label,
          needs: experience.needs,
        })),
      },
      null,
      2
    )}
User reply: ${userText}`,
  });

  try {
    return await extractor.invoke([system, human]);
  } catch (error) {
    console.warn("Resume signal extraction failed, falling back", error);
    return fallbackExtraction(userText);
  }
}

function fallbackExtraction(userText: string): ResumeSignals {
  const lower = userText.toLowerCase();
  const signals: ResumeSignals = {};

  if (/jd[:：]/i.test(userText) || userText.length > 400) {
    signals.jobDescription = userText;
  }

  const roleMatch = userText.match(/(目标岗位|target role|position)[^:：]*[:：]\s*([\u4e00-\u9fa5_a-z\s]+)/i);
  if (roleMatch?.[2]) {
    signals.targetRole = roleMatch[2].trim();
  }

  if (/空白|blank resume/.test(lower)) {
    signals.resumeStatus = "blank";
  } else if (/粗糙|draft|rough/.test(lower)) {
    signals.resumeStatus = "rough";
  } else if (/完整|完善|polished/.test(lower)) {
    signals.resumeStatus = "polished";
  }

  return signals;
}

function applySignals(context: ResumeContext, signals: ResumeSignals) {
  const updatedExperiences = mergeExperiences(context.experiences, signals.experiences ?? []);
  const strengthsToAdd = signals.focusStrengths ?? [];
  const pendingQuestionsToAdd: FollowUpQuestion[] = [];
  const resolvedQuestionIds: string[] = [];
  let pendingSynthesis = false;

  if (signals.followUpAnswers?.length) {
    signals.followUpAnswers.forEach((answer) => {
      const question = answer.followUpId
        ? context.pendingQuestions.find((item) => item.id === answer.followUpId)
        : undefined;

      if (question) {
        resolvedQuestionIds.push(question.id);
      }

      if (answer.insights) {
        const experience = selectExperience(updatedExperiences, answer.followUpId, answer.experienceLabel);
        if (experience) {
          if (answer.insights.metrics?.length) {
            experience.metrics = mergeUniqueStrings(experience.metrics, answer.insights.metrics);
            experience.needs.quantify = false;
          }
          if (answer.insights.techHighlights?.length) {
            experience.techHighlights = mergeUniqueStrings(
              experience.techHighlights,
              answer.insights.techHighlights
            );
            experience.needs.techDepth = false;
          }
          if (answer.insights.businessImpact?.length) {
            experience.businessImpact = mergeUniqueStrings(
              experience.businessImpact,
              answer.insights.businessImpact
            );
            experience.needs.impact = false;
          }
        }
      }
    });
  }

  updatedExperiences.forEach((experience) => {
    if (
      !experience.needs.quantify &&
      !experience.needs.techDepth &&
      !experience.needs.impact &&
      !context.suggestions.some((suggestion) => suggestion.experienceId === experience.id)
    ) {
      pendingSynthesis = true;
    }

    if (
      experience.needs.quantify &&
      !hasPendingQuestion(context.pendingQuestions, pendingQuestionsToAdd, experience.id, "quantify")
    ) {
      pendingQuestionsToAdd.push(createFollowUpQuestion(experience, "quantify"));
    }

    if (
      experience.needs.techDepth &&
      !hasPendingQuestion(context.pendingQuestions, pendingQuestionsToAdd, experience.id, "tech_depth")
    ) {
      pendingQuestionsToAdd.push(createFollowUpQuestion(experience, "tech_depth"));
    }

    if (
      experience.needs.impact &&
      !hasPendingQuestion(context.pendingQuestions, pendingQuestionsToAdd, experience.id, "impact")
    ) {
      pendingQuestionsToAdd.push(createFollowUpQuestion(experience, "impact"));
    }
  });

  const updatedSuggestions = applySuggestionFeedback(context.suggestions, signals.suggestionFeedback ?? []);
  const hasPendingSuggestions = updatedSuggestions.some((suggestion) => suggestion.status === "pending");

  return {
    updatedExperiences,
    strengthsToAdd,
    pendingQuestionsToAdd,
    resolvedQuestionIds,
    pendingSynthesis,
    jobDescription: signals.jobDescription,
    jdInsights: context.jdInsights,
    targetRole: signals.targetRole,
    targetCompany: signals.targetCompany,
    resumeStatus: signals.resumeStatus,
    jobCategory: signals.jobCategory,
    narrativeStrategy: context.narrativeStrategy,
    updatedSuggestions,
    hasPendingSuggestions,
  };
}

function mergeExperiences(
  currentExperiences: ExperienceInsight[],
  incoming: NonNullable<ResumeSignals["experiences"]>
) {
  const result = currentExperiences.map((experience) => ({ ...experience }));

  incoming.forEach((item) => {
    const existing = selectExperience(result, item.id, item.label);

    if (existing) {
      existing.role = item.role ?? existing.role;
      existing.company = item.company ?? existing.company;
      existing.timeframe = item.timeframe ?? existing.timeframe;
      existing.summary = item.summary ?? existing.summary;
      existing.metrics = mergeUniqueStrings(existing.metrics, item.metrics ?? []);
      existing.techHighlights = mergeUniqueStrings(existing.techHighlights, item.techHighlights ?? []);
      existing.businessImpact = mergeUniqueStrings(existing.businessImpact, item.businessImpact ?? []);
      existing.leadershipSignals = mergeUniqueStrings(
        existing.leadershipSignals,
        item.leadershipSignals ?? []
      );
      if (item.needs) {
        existing.needs = {
          quantify: item.needs.quantify ?? existing.needs.quantify,
          techDepth: item.needs.techDepth ?? existing.needs.techDepth,
          impact: item.needs.impact ?? existing.needs.impact,
        };
      }
      existing.lastUpdatedIsodate = new Date().toISOString();
    } else {
      result.push({
        id: item.id ?? randomUUID(),
        label: item.label,
        role: item.role,
        company: item.company,
        timeframe: item.timeframe,
        summary: item.summary,
        metrics: [...(item.metrics ?? [])],
        techHighlights: [...(item.techHighlights ?? [])],
        businessImpact: [...(item.businessImpact ?? [])],
        leadershipSignals: [...(item.leadershipSignals ?? [])],
        needs: {
          quantify: item.needs?.quantify ?? true,
          techDepth: item.needs?.techDepth ?? true,
          impact: item.needs?.impact ?? true,
        },
        lastUpdatedIsodate: new Date().toISOString(),
      });
    }
  });

  return result;
}

function selectExperience(
  experiences: ExperienceInsight[],
  id?: string,
  label?: string
): ExperienceInsight | undefined {
  if (id) {
    const byId = experiences.find((item) => item.id === id);
    if (byId) {
      return byId;
    }
  }

  if (label) {
    const normalized = label.trim().toLowerCase();
    return experiences.find((item) => item.label.trim().toLowerCase() === normalized);
  }

  return experiences[experiences.length - 1];
}

function mergeUniqueStrings(existing: string[], incoming: string[]): string[] {
  const normalized = new Set(existing.map((value) => value.trim()));
  incoming.forEach((value) => {
    const trimmed = value.trim();
    if (trimmed && !normalized.has(trimmed)) {
      normalized.add(trimmed);
    }
  });
  return Array.from(normalized);
}

function hasPendingQuestion(
  existing: FollowUpQuestion[],
  queued: FollowUpQuestion[],
  experienceId: string | undefined,
  type: FollowUpType
): boolean {
  return (
    existing.some(
      (question) =>
        question.type === type &&
        !question.resolved &&
        (experienceId ? question.experienceId === experienceId : true)
    ) ||
    queued.some(
      (question) => (question.type === type && (experienceId ? question.experienceId === experienceId : true))
    )
  );
}

function createFollowUpQuestion(
  experience: ExperienceInsight,
  type: FollowUpType
): FollowUpQuestion {
  const base = experience.label;
  let question: string;

  switch (type) {
    case "quantify":
      question = `针对「${base}」，有哪些可量化的数据（规模、指标、用户数、节省的成本等）？`;
      break;
    case "tech_depth":
      question = `「${base}」过程中遇到的核心技术难点是什么？实现方案如何体现你的技术深度？`;
      break;
    case "impact":
      question = `「${base}」带来了哪些业务或团队层面的影响？是否有具体指标或反馈？`;
      break;
    case "leadership":
      question = `在「${base}」里你如何影响团队或跨部门协作？`;
      break;
    default:
      question = `请补充「${base}」的更多背景细节。`;
      break;
  }

  return {
    id: randomUUID(),
    type,
    question,
    askedAtTurn: 0,
    experienceId: experience.id,
    resolved: false,
  };
}

function applySuggestionFeedback(
  current: ResumeSuggestion[],
  feedback: NonNullable<ResumeSignals["suggestionFeedback"]>
): ResumeSuggestion[] {
  if (!feedback.length) {
    return current;
  }

  return current.map((suggestion) => {
    const decision = feedback.find((item) => item.suggestionId === suggestion.id);
    if (!decision) {
      return suggestion;
    }

    const status =
      decision.decision === "approve"
        ? "applied"
        : decision.decision === "reject"
        ? "rejected"
        : "pending";

    const rationale =
      decision.reason && decision.decision !== "approve"
        ? `${suggestion.rationale} | 用户反馈: ${decision.reason}`
        : suggestion.rationale;

    return {
      ...suggestion,
      status,
      rationale,
    };
  });
}

function determineConversationPhase(context: ResumeContext, runtime: RuntimeState): ConversationPhase {
  if (!context.targetRole || !context.resumeStatus) {
    return "init";
  }

  if (context.jobDescription && !context.jdInsights) {
    return "parse_jd";
  }

  const unresolvedQuestions = context.pendingQuestions.filter((question) => !question.resolved);
  if (unresolvedQuestions.length > 0) {
    return "interview";
  }

  if (runtime.pendingSynthesis) {
    return "synthesize";
  }

  const hasPendingSuggestions = context.suggestions.some((suggestion) => suggestion.status === "pending");
  if (hasPendingSuggestions) {
    return "await_approval";
  }

  return "complete";
}

function shouldSynthesize(context: ResumeContext): boolean {
  return context.experiences.some(
    (experience) =>
      !experience.needs.quantify &&
      !experience.needs.techDepth &&
      !experience.needs.impact &&
      !context.suggestions.some((suggestion) => suggestion.experienceId === experience.id)
  );
}

function detectLanguage(text: string): "zh" | "en" | "mixed" {
  if (!text) {
    return "en";
  }

  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const hasLatin = /[a-zA-Z]/.test(text);

  if (hasChinese && hasLatin) {
    return "mixed";
  }

  if (hasChinese) {
    return "zh";
  }

  return "en";
}

function detectLanguageFromMessages(messages: BaseMessage[]): "zh" | "en" | "mixed" {
  const lastHuman = [...messages].reverse().find((message) => message._getType() === "human");
  return detectLanguage(lastHuman ? messageContentToString(lastHuman) : "");
}

function buildSystemPrompt(
  phase: ConversationPhase,
  context: ResumeContext,
  language: "zh" | "en" | "mixed"
): string {
  const languageInstruction =
    language === "zh"
      ? "请使用简体中文，如用户切换语言请快速跟随。"
      : language === "mixed"
      ? "以用户最后一句的语言为准，可中英夹杂。"
      : "Reply in the language of the user's last message (default English).";

  const jdSummary = context.jdInsights
    ? `JD 核心：${context.jdInsights.summary}\n必备：${context.jdInsights.mustHaveSkills.join(", ")}\n加分：${context.jdInsights.niceToHaveSkills.join(", ")}`
    : context.jobDescription
    ? "已收到 JD 原文，等待解析。"
    : "尚未提供 JD。";

  const experiencesSummary =
    context.experiences.length === 0
      ? "尚未收集经历详情"
      : context.experiences
          .map((experience, index) => {
            const needs = [
              experience.needs.quantify ? "量化" : null,
              experience.needs.techDepth ? "技术" : null,
              experience.needs.impact ? "业务" : null,
            ]
              .filter(Boolean)
              .join("/");
            return `${index + 1}. ${experience.label} (${needs || "信息充分"})`;
          })
          .join("\n");

  const pendingQuestionsSummary =
    context.pendingQuestions.length === 0
      ? "无待回答问题"
      : context.pendingQuestions
          .filter((question) => !question.resolved)
          .map((question) => `- (${question.type}) ${question.question}`)
          .join("\n");

  const phaseInstruction = getPhaseInstruction(phase);

  return [
    "你是 True-Resume 的“竞争力挖掘对话助手”，目标是通过结构化访谈帮用户挖掘可量化、可信、差异化的简历亮点。",
    languageInstruction,
    "核心原则：\n1. 对话先于改写，确保每个亮点有事实支撑\n2. 聚焦用户价值：技术深度、业务影响、独特优势\n3. 增量式构建内容，必要时先追问再给建议\n4. 任何改写必须通过 CopilotKit actions 推送审批，不能直接改动用户简历。",
    `目标岗位：${context.targetRole ?? "未知"}（${context.jobCategory ?? "未分类"}）`,
    `JD 解析：${jdSummary}`,
    `已知优势：${context.focusStrengths.join(", ") || "暂无"}`,
    `经历进展：\n${experiencesSummary}`,
    `待补充问题：\n${pendingQuestionsSummary}`,
    phaseInstruction,
    "输出需自然亲和、但保持专业顾问角色；当需要生成修改时，结合 CopilotKit actions（如 updateExperience、updateSummary 等）提供建议并附简短 rationale。",
  ].join("\n\n");
}

function getPhaseInstruction(phase: ConversationPhase): string {
  switch (phase) {
    case "init":
      return "阶段指引：明确目标岗位、JD、简历完成度和优先挖掘的竞争力。优先提问目标岗位、是否有 JD、当前简历状态、期待强化的亮点。";
    case "parse_jd":
      return "阶段指引：解析 JD，将要求拆解为职责 / 必备 / 加分 / 业务指标，提炼出接下来访谈的重点。";
    case "interview":
      return "阶段指引：按照“三轮追问”协议（基本事实→技术/策略→业务价值）挖掘细节，紧扣用户上一轮回答继续深挖。";
    case "deep_dive":
      return "阶段指引：聚焦缺失的量化数据、技术深度或业务影响，补齐差距。";
    case "synthesize":
      return "阶段指引：将已挖掘的素材整合成高质量简历表述，突出量化成果、技术深度与业务价值。";
    case "await_approval":
      return "阶段指引：提醒用户在 CopilotKit 审批卡片中确认或调整建议，耐心等待反馈。";
    case "validate":
      return "阶段指引：执行 JD 对齐检验壳子（待实现），指出缺口并建议下一步挖掘方向。";
    case "complete":
      return "阶段指引：当前回合可收尾，可邀请用户继续深挖其他经历，或进入 JD 校验阶段。";
    default:
      return "阶段指引：保持结构化访谈节奏，确保信息完整可靠。";
  }
}

async function deriveJDInsights(
  jdText: string,
  context: ResumeContext
): Promise<JDInsights> {
  if (!jdText.trim()) {
    return buildHeuristicJDInsights(jdText);
  }

  if (!hasLLMProvider()) {
    return buildHeuristicJDInsights(jdText);
  }

  const structuredModel = (createChatModel("parse_jd", context) as ChatOpenAI).withStructuredOutput(
    JDInsightsSchema,
    { name: "JDInsights", method: "jsonMode" }
  );

  const system = new SystemMessage({
    content:
      "Parse the job description into concise resume coaching insights. Focus on the business needs, required skills, and helpful follow-up questions.",
  });
  const human = new HumanMessage({
    content: `Job description to analyze:\n${jdText}`,
  });

  try {
    const parsed = await structuredModel.invoke([system, human]);
    return {
      ...parsed,
      extractedAt: new Date().toISOString(),
    } satisfies JDInsights;
  } catch (error) {
    console.warn("JD insight extraction failed, using heuristic fallback", error);
    return buildHeuristicJDInsights(jdText);
  }
}

function buildHeuristicJDInsights(jdText: string): JDInsights {
  const sentences = jdText
    .split(/[。.!?\n]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const responsibilities = sentences.slice(0, 6);
  const keywordMatches = jdText.match(/[A-Za-z][A-Za-z0-9+\-#]{2,}/g) ?? [];
  const keywords = Array.from(new Set(keywordMatches.map((keyword) => keyword.toLowerCase())));

  return {
    summary: responsibilities.slice(0, 2).join(" | ") || jdText.slice(0, 180),
    responsibilities,
    mustHaveSkills: keywords.slice(0, 6),
    niceToHaveSkills: keywords.slice(6, 12),
    businessFocus: [],
    clarifyingQuestions: [],
    extractedAt: new Date().toISOString(),
  } satisfies JDInsights;
}
