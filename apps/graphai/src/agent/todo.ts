/**
 * Todo Node
 * - Advances the next pending todo sequentially.
 * - Marks it as in_progress and instructs the model to complete it.
 */

// import { RunnableConfig } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";
// import { copilotkitEmitState } from "@copilotkit/sdk-js/langgraph";
import type { AgentState } from "./state.js";

export async function todo_node(state: AgentState) {
  const todos = state.currentTodos ?? [];
  const nextIdx = todos.findIndex(t => t.status === "todo");

  if (nextIdx === -1) {
    return state;
  }

  const nextTodo = todos[nextIdx];
  const updated = todos.map(t =>
    t.id === nextTodo.id ? { ...t, status: "in_progress" } : t
  );

  // const { messages, ...rest } = state;
  // await copilotkitEmitState(config, {
  //   ...rest,
  //   currentTodos: updated,
  //   createdTodos: false,
  // });

  const instruction = new SystemMessage({
    content: `Execute the next step: "${nextTodo.title}" (todoId: ${nextTodo.id}). When you finish, you MUST call the tool mark_todo with { todoId: "${nextTodo.id}", status: "completed" }. If you start a long-running step, you may call mark_todo with { todoId: "${nextTodo.id}", status: "processing" } first to update progress.`,
  });

  return {
    currentTodos: updated,
    // messages: [...(state.messages ?? []), instruction],
    messages: [instruction],
    createdTodos: false,
  };
}
