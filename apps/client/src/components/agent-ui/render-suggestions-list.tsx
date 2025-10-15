import type { RenderSuggestionsListProps } from "@copilotkit/react-ui";
import { ArrowRightIcon, ChatCircleIcon, CheckCircleIcon } from "@phosphor-icons/react";

export const RenderSuggestionsList: React.FC<RenderSuggestionsListProps> = (props) => {
  const { suggestions, onSuggestionClick } = props;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between">
        <div className="flex w-max max-w-full items-center gap-1.5 rounded-full text-[13px] leading-none text-[var(--function-success)]">
          <CheckCircleIcon
            weight="fill"
            size={16}
            className="shrink-0"
            color="var(--function-success)"
          />
          任务已完成
        </div>
      </div>
      <div className="flex w-full flex-col">
        <div className="text-[13px] font-medium leading-[18px] text-[var(--text-tertiary)]">
          推荐追问
        </div>
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.title}
            className='relative flex w-full cursor-pointer items-center justify-between px-3 py-2.5 after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-[var(--border-main)] after:content-[""] hover:rounded-[10px] hover:bg-[var(--fill-tsp-white-main)] hover:after:hidden'
            onClick={() => {
              onSuggestionClick(suggestion.message);
            }}
          >
            <div className="flex items-center gap-2">
              <ChatCircleIcon size={16} color="var(--icon-tertiary)" />
              <span className="min-w-0 flex-1 text-sm leading-[22px] text-[var(--text-secondary)]">
                {suggestion.title}
              </span>
            </div>
            <ArrowRightIcon size={16} color="var(--icon-disable)" className="shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
