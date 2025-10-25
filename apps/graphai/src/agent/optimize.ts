import { AIMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";

import type { AgentState } from "./state.js";

// Stub node for resume optimization flow. You can replace internals later.
export async function optimize_resume_node(state: AgentState, _config: RunnableConfig) {
  // For now, just acknowledge and hand control back to chat.
  const note = new AIMessage({
    content: "检测到匹配度较低，已进入简历优化流程。我们将逐步提出修改建议以提升得分。",
  });
  const prev = state["messages"] || [];
  return {
    messages: [...prev, note],
  } as Partial<AgentState>;
}

