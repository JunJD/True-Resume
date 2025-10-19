/**
 * This is the main entry point for the agent.
 * It defines the workflow graph, state, tools, nodes and edges.
 */

import { Annotation } from "@langchain/langgraph";

import { CopilotKitStateAnnotation } from "@copilotkit/sdk-js/langgraph";

// 2. Define our agent state, which includes CopilotKit state to
//    provide actions to the state.
export const AgentStateAnnotation = Annotation.Root({
  proverbs: Annotation<string[]>,
  ...CopilotKitStateAnnotation.spec,
});

// 3. Define the type for our agent state
export type AgentState = typeof AgentStateAnnotation.State;
