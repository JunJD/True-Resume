import type { UserMessageProps } from "@copilotkit/react-ui";
import { t } from "@lingui/macro";
import { CopyIcon } from "@phosphor-icons/react";

import { toast } from "@/client/hooks/use-toast";

export const MarkUserMessage = (props: UserMessageProps) => {
  const { message } = props;

  return (
    <div className="group my-3 flex w-full flex-col items-end justify-end gap-1">
      <div className="flex max-w-[90%] flex-col items-end">
        <div className="flex w-full items-center justify-between gap-[8px]">
          <div className="invisible flex items-center justify-end gap-[2px] overflow-hidden group-hover:visible">
            <div
              className="flex size-7 cursor-pointer items-center justify-center rounded-md hover:bg-[var(--fill-tsp-gray-main)]"
              onClick={() => {
                navigator.clipboard.writeText(message?.content ?? "").catch(() => {
                  toast({
                    variant: "error",
                    title: t`Failed to copy to clipboard.`,
                  });
                });
              }}
            >
              <CopyIcon className="size-4 text-[var(--icon-secondary)]" />
            </div>
            <div className="float-right whitespace-nowrap text-[12px] text-[var(--text-tertiary)] transition">
              星期二
            </div>
          </div>
        </div>
      </div>
      <div className="relative flex flex-col items-end gap-2">
        <div className="relative flex items-center overflow-hidden rounded-[12px] border border-[var(--border-main)] bg-[var(--fill-white)] p-3 dark:border-0 dark:bg-[var(--fill-tsp-white-main)] ltr:rounded-br-none rtl:rounded-bl-none">
          <div className="transition-all duration-300">
            <span className="u-break-words whitespace-pre-wrap text-[var(--text-primary)]">
              {message?.content}
            </span>
          </div>
        </div>
        <div className="flex w-full flex-col flex-wrap items-end justify-start gap-2"></div>
      </div>
    </div>
  );
};
