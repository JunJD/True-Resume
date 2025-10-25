/**
 * Search Node
 */

/**
 * The search node is responsible for searching the internet for information.
 */

// import { z } from "zod";
// import { tool } from "@langchain/core/tools";
import { tavily } from "@tavily/core";
import { randomUUID } from "crypto";
import { RunnableConfig } from "@langchain/core/runnables";
import { AIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import {
  copilotkitCustomizeConfig,
  copilotkitEmitState,
} from "@copilotkit/sdk-js/langgraph";
import { AgentState } from "./state.js";
import { createChatModel, createTodoTool } from "./chat.js";

const tavilyClient = tavily({
  apiKey: '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',
});

export async function search_node(state: AgentState, config: RunnableConfig) {
  const aiMessage = state["messages"][
    state["messages"].length - 1
  ] as AIMessage;

  let currentTodos = state["currentTodos"] || [];
  let logs = state["logs"] || [];

  if(!aiMessage.tool_calls || aiMessage.tool_calls.length === 0) {
    return state
  }
  
  const queries = aiMessage.tool_calls?.[0]["args"]?.["queries"] ?? [];

  for (const query of queries) {
    logs.push({
      message: `Searching for ${query}`,
      done: false,
    });
  }
  const { messages, ...restOfState } = state;
  await copilotkitEmitState(config, {
    ...restOfState,
    logs,
    currentTodos,
  });

  const search_results = [];

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    const response = await tavilyClient.search(query, {});
    search_results.push(response);
    logs[i]["done"] = true;
    await copilotkitEmitState(config, {
      ...restOfState,
      logs,
      currentTodos,
    });
  }

  const searchResultsToolMessageFull = new ToolMessage({
    tool_call_id: aiMessage.tool_calls![0]["id"]!,
    content: `Performed search: ${JSON.stringify(search_results)}`,
    name: "Search",
  });

  // const searchResultsToolMessage = new ToolMessage({
  //   tool_call_id: aiMessage.tool_calls![0]["id"]!,
  //   content: `Performed search.`,
  //   name: "Search",
  // });

  const customConfig = copilotkitCustomizeConfig(config, {
    emitIntermediateState: [
        {
            stateKey: "currentTodos",
            tool: "create_todo",
            toolArgument: "currentTodos",
        },
    ],
  });

  const model = createChatModel();
  const invokeArgs: Record<string, any> = {};
  if (model.constructor.name === "ChatOpenAI") {
    invokeArgs["parallel_tool_calls"] = false;
  }

  logs = [];

  await copilotkitEmitState(config, {
    ...restOfState,
    currentTodos,
    logs,
  });

  const cleaned = [
    new SystemMessage({
      content: `You need to create a todo list from the following search results.`,
    }),
    ...((state["messages"] || []).map((m: any) => {
      const toolCalls = (m as any)?.tool_calls ?? (m as any)?.additional_kwargs?.tool_calls;
      const hasToolCalls = Array.isArray(toolCalls) && toolCalls.length > 0;
      const raw = (m as any)?.content;
      const content = typeof raw === "string" ? raw : raw != null ? JSON.stringify(raw) : "";
      if (!content || content.trim() === "") {
        return null;
      }
      if (hasToolCalls) {
        return null;
      }
      return m;
    }).filter(Boolean) as any[]),
    searchResultsToolMessageFull,
  ];

  const response = await model.bindTools!([createTodoTool], {
    ...invokeArgs,
    tool_choice: "create_todo",
  }).invoke(
    cleaned,
    customConfig
  );

  const aiMessageResponse = response as AIMessage;
  if(!aiMessageResponse.tool_calls || aiMessageResponse.tool_calls.length === 0)  {
    return state
  }
  const rawArgs = aiMessageResponse.tool_calls![0]["args"] as any;
  const parsedArgs = typeof rawArgs === "string" ? (() => { try { return JSON.parse(rawArgs); } catch { return {}; } })() : (rawArgs ?? {});
  const newTodosRaw = parsedArgs["todo"] ?? parsedArgs["todos"] ?? [];
  const newTodos = (Array.isArray(newTodosRaw) ? newTodosRaw : []).map((t: any) => ({
    id: randomUUID(),
    title: String(t?.title ?? "Untitled"),
    status: "todo" as const,
  }));

  currentTodos.push(...newTodos);

  return {
    messages: [
      // echo back the model's create_todo tool call and a confirmation tool result
      aiMessageResponse,
      new ToolMessage({
        tool_call_id: aiMessageResponse.tool_calls![0]["id"]!,
        content: `Todos added.`,
        name: "create_todo",
      }),
    ],
    currentTodos,
    logs,
    createdTodos: true,
  };
}
