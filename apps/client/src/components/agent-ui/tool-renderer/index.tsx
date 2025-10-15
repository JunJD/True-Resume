import type { CatchAllActionRenderProps } from "@copilotkit/react-core";
import { useCopilotAction } from "@copilotkit/react-core";

import McpToolCall from "./mcp-tool-call";

export function ToolRenderer() {
  useCopilotAction({
    /**
     * The asterisk (*) matches all tool calls
     */
    name: "*",
    render: ({ name, status, args, result }: CatchAllActionRenderProps) => (
      <McpToolCall status={status} name={name} args={args} result={result} />
    ),
  });
  return null;
}
