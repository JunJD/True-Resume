import { useCopilotChat } from "@copilotkit/react-core";
import { useEffect } from "react";

function McpServerManager() {
  const { setMcpServers } = useCopilotChat();

  useEffect(() => {
    // mcpServers
    // setMcpServers({});
  }, [setMcpServers]);

  return null;
}

export default McpServerManager;
