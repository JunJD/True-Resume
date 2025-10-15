import type { AssistantMessageProps } from "@copilotkit/react-ui";
import { Trans } from "@lingui/macro";
import { Streamdown } from "streamdown";

import { Logo } from "../logo";

export const MakeAssistantMessage: React.FC<AssistantMessageProps> = (props) => {
  const { message, isLoading, isCurrentMessage, isGenerating } = props;

  return (
    <div>
      <Logo />
      {isLoading ? (
        <div className="flex items-center gap-1 text-sm text-[var(--text-tertiary)]">
          <span>
            <Trans>Trues 正在思考</Trans>
          </span>
          <span className="relative top-[4px] flex gap-1">
            <span
              className="animate-bounce-dot rounded bg-[var(--icon-tertiary)]"
              style={{
                animationDelay: "100ms",
                width: "6px",
                height: "6px",
                animationDuration: "1.5s",
              }}
            ></span>
            <span
              className="animate-bounce-dot rounded bg-[var(--icon-tertiary)]"
              style={{
                animationDelay: "300ms",
                width: "6px",
                height: "6px",
                animationDuration: "1.5s",
              }}
            ></span>
            <span
              className="animate-bounce-dot rounded bg-[var(--icon-tertiary)]"
              style={{
                animationDelay: "500ms",
                width: "6px",
                height: "6px",
                animationDuration: "1.5s",
              }}
            ></span>
          </span>
        </div>
      ) : (
        <>
          {message?.content && (
            <Streamdown isAnimating={isGenerating}>{message.content}</Streamdown>
          )}
          {message?.generativeUI?.()}
          {!isGenerating && isCurrentMessage && (
            <div className="flex items-center gap-[6px] py-1.5 text-sm font-[500] text-[var(--function-warning)]">
              <svg
                height="16"
                width="16"
                fill="none"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clip-path="url(#clip0_4313_82384)">
                  <circle
                    cx="8"
                    cy="8"
                    r="6.5"
                    stroke="currentColor"
                    stroke-dasharray="2.44 1.62"
                    stroke-width="1.5"
                  ></circle>
                </g>
                <defs>
                  <clipPath id="clip0_4313_82384">
                    <rect height="16" width="16" fill="white" />
                  </clipPath>
                </defs>
              </svg>
              <Trans>Trues 将在你回复后与你继续对话</Trans>
            </div>
          )}
          {isGenerating && (
            <a href="https://git.io/typing-svg">
              <img
                src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=16&pause=1000&color=858481&width=435&lines=Trues+%E6%AD%A3%E5%9C%A8%E6%80%9D%E8%80%83..."
                alt="Typing SVG"
              />
            </a>
          )}
        </>
      )}
    </div>
  );
};
