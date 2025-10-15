import { t } from "@lingui/macro";
import * as React from "react";

type ToolCallProps = {
  status: "complete" | "inProgress" | "executing";
  name?: string;
  args?: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any;
};

export default function McpToolCall({ status, name = "", args, result }: ToolCallProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Format content for display
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, unicorn/consistent-function-scoping
  const format = (content: any): string => {
    if (!content) return "";
    const text = typeof content === "object" ? JSON.stringify(content, null, 2) : String(content);
    return text
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  };

  return (
    <div className="w-full overflow-hidden rounded-lg bg-[#1e2738]">
      <div
        className="flex cursor-pointer items-center p-3"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        <span className="overflow-hidden text-ellipsis text-sm text-white">
          {name || t`MCP Tool Call`}
        </span>
        <div className="ml-auto">
          <div
            className={`size-2 rounded-full ${
              status === "complete"
                ? "bg-gray-300"
                : // eslint-disable-next-line unicorn/no-nested-ternary, @typescript-eslint/no-unnecessary-condition
                  status === "inProgress" || status === "executing"
                  ? "animate-pulse bg-gray-500"
                  : "bg-gray-700"
            }`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="px-4 pb-4 font-mono text-xs text-gray-300">
          {args && (
            <div className="mb-4">
              <div className="mb-2 text-gray-400">{t`Parameters`}:</div>
              <pre className="max-h-[200px] overflow-auto whitespace-pre-wrap">{format(args)}</pre>
            </div>
          )}

          {status === "complete" && result && (
            <div>
              <div className="mb-2 text-gray-400">{t`Result`}:</div>
              <pre className="max-h-[200px] overflow-auto whitespace-pre-wrap">
                {format(result)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
