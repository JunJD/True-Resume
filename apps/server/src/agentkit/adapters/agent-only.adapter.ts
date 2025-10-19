import type {
  CopilotRuntimeChatCompletionRequest,
  CopilotRuntimeChatCompletionResponse,
  CopilotServiceAdapter,
} from "@copilotkit/runtime";
import { randomUUID } from "@copilotkit/shared";

/**
 * Adapter that keeps CopilotKit runtime satisfied while delegating all intelligence to LangGraph.
 * It registers an empty event stream so the runtime's event pipeline completes cleanly.
 */
export class AgentOnlyAdapter implements CopilotServiceAdapter {
  async process(
    request: CopilotRuntimeChatCompletionRequest,
  ): Promise<CopilotRuntimeChatCompletionResponse> {
    return request.eventSource
      .stream((eventStream$) => {
        return Promise.resolve().then(() => {
          eventStream$.complete();
        });
      })
      .then(() => ({
        threadId: request.threadId ?? randomUUID(),
        runId: request.runId,
      }));
  }
}
