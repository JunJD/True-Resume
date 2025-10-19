import { describe, it, expect } from "vitest";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

import { graph } from "../src/agent/graph.js";

describe("Graph", () => {
  it("should process input through the graph", async () => {
    const input = new HumanMessage("你好，我正在准备前端工程师的简历");
    const result = await graph.invoke(
      { messages: [input] },
      { configurable: { thread_id: "graph-int-test" } }
    );

    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
    expect(result.messages).toBeDefined();
    expect(Array.isArray(result.messages)).toBe(true);
    expect(result.messages.length).toBeGreaterThan(0);

    const lastMessage = result.messages[result.messages.length - 1];
    expect(lastMessage).toBeInstanceOf(AIMessage);
    expect(lastMessage.content.toString()).toMatch(/目标岗位|target role|简历状态/i);
  }, 30000); // Increased timeout to 30 seconds
});
