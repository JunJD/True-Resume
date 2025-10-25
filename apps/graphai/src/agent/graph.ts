import { MemorySaver, START, StateGraph } from "@langchain/langgraph";

import { AgentStateAnnotation, type AgentState } from "./state.js";
import { chat_node } from "./chat.js";
// import { search_node } from "./search.js";
import { todo_node } from "./todo.js";
import { analyze_jd_node } from "./analyze_jd.js";
import { optimize_resume_node } from "./optimize.js";

type Decision = "chat_node" | "search_node" | "todo_node" | "optimize_resume_node" | "__end__";
type DecisionCondition = (state: AgentState) => Decision | null | undefined;

const decisionConditions: DecisionCondition[] = [];

export function registerDecisionCondition(fn: DecisionCondition) {
  decisionConditions.push(fn);
}

// const start_search = (state: AgentState) => {
//   const messages = state.messages || [];
//   if (messages.length === 0) return null;
//   // find the most recent AIMessage with tool_calls
//   for (let i = messages.length - 1; i >= 0; i--) {
//     const msg: any = messages[i];
//     const maybeName = msg?.tool_calls?.[0]?.name;
//     if (maybeName) {
//       return maybeName === "Search" ? "search_node" : null;
//     }
//   }
//   return null;
// };

// registerDecisionCondition(start_search)

const start_next_todo = (state: AgentState) => {
  const todos = state.currentTodos || [];
  const hasTodo = todos.some(t => t.status === "todo");
  const hasInProgress = todos.some(t => t.status === "in_progress");
  if (!hasTodo || hasInProgress) return null;
  if (state.createdTodos === true) {
    return "todo_node";
  }
  return null;
};

registerDecisionCondition(start_next_todo);

function decideNext(state: AgentState): Decision {
  for (const cond of decisionConditions) {
    try {
      const decision = cond(state);
      if (decision) return decision;
    } catch (_err) {
      // ignore faulty condition
    }
  }
  // Default: end the branch if no condition matched
  return "__end__";
}

function route(state: AgentState): string {
  return decideNext(state);
}

const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("chat_node", chat_node)
  // 解析JD
  .addNode('analyze_jd_node', analyze_jd_node)
  // 简历优化（当匹配度低于阈值时进入）
  .addNode('optimize_resume_node', optimize_resume_node)
  // .addNode("search_node", search_node)
  .addNode("todo_node", todo_node)
  .addEdge(START, "analyze_jd_node")
  // 根据评分路由：高分结束，低分进入优化，中间情况进入聊天
  .addConditionalEdges("analyze_jd_node", (state: AgentState) => {
    const s = typeof state.currentScore === 'number' ? state.currentScore : undefined;
    const threshold = 0.7; // fixed threshold for routing
    if (typeof s !== 'number') return "chat_node"; // 未评分，进入聊天
    if (s >= threshold) return "__end__"; // 分数足够高，结束
    return "optimize_resume_node"; // 分数较低，进入优化
  }, ["optimize_resume_node", "chat_node", "__end__"])
  .addConditionalEdges("chat_node", route, ["analyze_jd_node", "todo_node", "__end__"])
  // .addEdge("search_node", "chat_node")
  .addEdge("optimize_resume_node", "chat_node")
  .addEdge("todo_node", "chat_node")
// end handled via conditional "__end__"

const memory = new MemorySaver();

export const graph = workflow.compile({
  checkpointer: memory,
  // Remove interrupt here to allow automatic routing into optimize node
  // interruptAfter: ["analyze_jd_node"]
});
