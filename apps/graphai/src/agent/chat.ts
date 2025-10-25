/**
 * Chat Node
 */

import { RunnableConfig } from "@langchain/core/runnables";
import { SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { randomUUID } from "crypto";
import { z } from "zod";
import { copilotkitCustomizeConfig } from "@copilotkit/sdk-js/langgraph";
import { AgentState, TodoStatus } from "./state.js";
import { ChatOpenAI } from "@langchain/openai";
import { systemPrompt } from "../prompt.js";

export const createTodoTool = tool(() => { }, {
    name: "create_todo",
    description:
        'Make a todo list for client, returns the todo list with a unique ID, this tool should only used when you are doing something that requires multiple steps, like writing a document or composing an email.',
    schema: z.object({
        todo: z
            .object({
                title: z.string().describe('The title of the todo item'),
                description: z
                    .string()
                    .describe('The description of the todo item'),
            })
            .array(),
    }),
});

const createMarkTodoTool = tool(() => { }, {
    name: "mark_todo",
    description: 'Mark a todo item as processing or completed in a todo list',
    schema: z.object({
        //   todoListId: z.string().describe('The ID of the todo list'),
        todoId: z
            .string()
            .describe('The ID of the todo item to mark as completed'),
        status: z
            .enum(['processing', 'completed'])
            .describe('The status to set for the todo item'),
    }),
});

const Search = tool(() => { }, {
    name: "Search",
    description:
        "A list of one or more search queries to find good resources to support the research.",
    schema: z.object({ queries: z.array(z.string()) }),
});


const DEFAULT_MODEL_NAME = process.env.OPENAI_MODEL;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? process.env.DASHSCOPE_API_KEY ?? "";

export function createChatModel() {
    return new ChatOpenAI({
        model: DEFAULT_MODEL_NAME,
        temperature: 0.5,
        openAIApiKey: OPENAI_API_KEY,
        configuration: OPENAI_BASE_URL ? { baseURL: OPENAI_BASE_URL } : undefined,
    });
}

export async function chat_node(state: AgentState, config: RunnableConfig) {
    const customConfig = copilotkitCustomizeConfig(config, {
        emitIntermediateState: [
            {
                stateKey: "currentTodos",
                tool: "create_todo",
                toolArgument: "currentTodos",
            },
            {
                stateKey: "currentTodos",
                tool: "mark_todo",
                toolArgument: "currentTodos",
            },
        ],
        emitToolCalls: ["create_todo", "mark_todo"],
    });

    state['currentTodos'] = state.currentTodos || [];

    const model = createChatModel();
    const invokeArgs: Record<string, unknown> = {};
    if (model.constructor.name === "ChatOpenAI") {
        invokeArgs["parallel_tool_calls"] = false;
    }

    // Normalize messages: avoid empty assistant content for providers (e.g., DashScope)
    const cleaned = [
        new SystemMessage(
            `${systemPrompt}\nThis is the current todos:\n${(state.currentTodos || []).map((t) => `- ${t.title}`).join("\n")}`
        ),
        ...((state.messages || [])
            .map((m: any) => {
                const toolCalls = (m as any)?.tool_calls ?? (m as any)?.additional_kwargs?.tool_calls;
                const hasToolCalls = Array.isArray(toolCalls) && toolCalls.length > 0;
                const raw = (m as any)?.content;
                const content = typeof raw === "string" ? raw : raw != null ? JSON.stringify(raw) : "";
                if (!content || content.trim() === "") {
                    // Drop empty messages entirely (including empty assistant tool-call echoes)
                    return null;
                }
                if (hasToolCalls) {
                    // Skip assistant tool-call echo to avoid provider incompatibilities
                    return null;
                }
                return m;
            })
            .filter(Boolean) as any[]),
    ];

    const response = await model.bindTools!(
        [createTodoTool, createMarkTodoTool, Search],
        invokeArgs
    ).invoke(
        cleaned,
        customConfig
    );

    const aiMessage = response as AIMessage;

    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
        const call = aiMessage.tool_calls[0];
        const rawArgs = (call as any)?.args;
        const parsedArgs = typeof rawArgs === "string" ? (() => { try { return JSON.parse(rawArgs); } catch { return {}; } })() : (rawArgs ?? {});
        if (call.name === "create_todo") {
            const todoList = (parsedArgs as any)?.todo ?? (parsedArgs as any)?.todos ?? [];
            const normalized = (Array.isArray(todoList) ? todoList : []).map((t: any) => ({
                id: randomUUID(),
                title: String(t?.title ?? "Untitled"),
                status: "todo" as const,
            }));
            const updatedTodos = [...(state.currentTodos ?? []), ...normalized];
            return {
                currentTodos: updatedTodos,
                createdTodos: true,
                messages: [
                    aiMessage,
                    new ToolMessage({
                        tool_call_id: (call as any)["id"]!,
                        content: "Todo list created.",
                        name: "create_todo",
                    }),
                ],
            };
        } else if (call.name === "mark_todo") {
            const todoId = (parsedArgs as any)?.todoId as string;
            const rawStatus = (parsedArgs as any)?.status as string;
            const status: TodoStatus = rawStatus === "processing" ? "in_progress" : rawStatus === "completed" ? "done" : (rawStatus as TodoStatus);
            const updatedTodos = [...(state.currentTodos ?? []).map((todo) =>
                todo.id === todoId ? { ...todo, status } : todo
            )];
            return {
                currentTodos: updatedTodos,
                createdTodos: false,
                messages: [
                    aiMessage,
                    new ToolMessage({
                        tool_call_id: (call as any)["id"]!,
                        content: `Todo ${todoId} marked as ${status}.`,
                        name: "mark_todo",
                    }),
                ],
            };
        }
    }

    const outContent: any = (response as any)?.content;
    if (typeof outContent === "string" && outContent.trim() === "") {
        return {} as any;
    }
    return { messages: [response] } as any;
}
