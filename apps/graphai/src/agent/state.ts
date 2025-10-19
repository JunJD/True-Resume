import { Annotation } from "@langchain/langgraph";

import { CopilotKitStateAnnotation } from "@copilotkit/sdk-js/langgraph";

// 预设的岗位类别，用于匹配对应访谈协议和追问重点。
export const JOB_CATEGORIES = [
  "tech_engineering",
  "tech_product",
  "business_sales",
  "business_operations",
  "business_function",
  "creative_design",
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];

export type ResumeReadiness = "blank" | "rough" | "polished";

export type ConversationPhase =
  | "init"
  | "parse_jd"
  | "interview"
  | "deep_dive"
  | "synthesize"
  | "await_approval"
  | "validate"
  | "complete";

// 定义追问的问题类型，便于前端展示与阶段控制。
export type FollowUpType =
  | "context"
  | "quantify"
  | "tech_depth"
  | "impact"
  | "leadership"
  | "jd_gap";

export interface FollowUpQuestion {
  id: string;
  type: FollowUpType;
  question: string;
  askedAtTurn: number;
  experienceId?: string;
  resolved: boolean;
}

export interface ExperienceInsight {
  id: string;
  label: string;
  role?: string;
  company?: string;
  timeframe?: string;
  summary?: string;
  metrics: string[];
  techHighlights: string[];
  businessImpact: string[];
  leadershipSignals: string[];
  needs: {
    quantify: boolean;
    techDepth: boolean;
    impact: boolean;
  };
  lastUpdatedIsodate?: string;
}

export interface JDInsights {
  summary: string;
  responsibilities: string[];
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  businessFocus: string[];
  clarifyingQuestions: string[];
  extractedAt: string;
}

export interface ResumeSuggestion {
  id: string;
  section:
    | "summary"
    | "experience"
    | "projects"
    | "skills"
    | "education"
    | "custom";
  experienceId?: string;
  title: string;
  before?: string;
  after: string;
  rationale: string;
  alignmentTags: string[];
  status: "pending" | "applied" | "rejected";
}

export interface NarrativeStrategy {
  angle: "深度专家" | "全栈通才" | "业务驱动" | "技术创新" | "待定";
  rationale: string;
  strengths: string[];
}

// 多个节点共享的简历上下文，保持原始数据而非格式化文本。
export interface ResumeContext {
  targetRole: string | null;
  targetCompany: string | null;
  resumeStatus: ResumeReadiness | null;
  jobCategory: JobCategory | null;
  focusStrengths: string[];
  jobDescription: string | null;
  jdInsights: JDInsights | null;
  experiences: ExperienceInsight[];
  pendingQuestions: FollowUpQuestion[];
  suggestions: ResumeSuggestion[];
  narrativeStrategy: NarrativeStrategy | null;
}

// 执行时的元信息，供 CopilotKit 实时展示进度与当前节点。
export interface RuntimeState {
  turn: number;
  lastProcessedMessageIndex: number;
  initPromptIssued: boolean;
  awaitingFollowUpId: string | null;
  pendingSynthesis: boolean;
  awaitingApprovalNotified: boolean;
  currentNode: string | null;
  phase: ConversationPhase;
}

// LangGraph 默认 reducer 使用的工厂函数，保证初始上下文干净可预测。
export const createInitialResumeContext = (): ResumeContext => ({
  targetRole: null,
  targetCompany: null,
  resumeStatus: null,
  jobCategory: null,
  focusStrengths: [],
  jobDescription: null,
  jdInsights: null,
  experiences: [],
  pendingQuestions: [],
  suggestions: [],
  narrativeStrategy: null,
});

// 运行时状态的默认值，确保 CoAgent 在首轮执行前也能拿到完整结构。
export const createInitialRuntimeState = (): RuntimeState => ({
  turn: 0,
  lastProcessedMessageIndex: -1,
  initPromptIssued: false,
  awaitingFollowUpId: null,
  pendingSynthesis: false,
  awaitingApprovalNotified: false,
  currentNode: null,
  phase: "init",
});

export const AgentStateAnnotation = Annotation.Root({
  ...CopilotKitStateAnnotation.spec,
  resumeContext: Annotation<ResumeContext>({ default: createInitialResumeContext }),
  runtime: Annotation<RuntimeState>({ default: createInitialRuntimeState }),
});

export type AgentState = typeof AgentStateAnnotation.State;
