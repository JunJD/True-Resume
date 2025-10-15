import type { InputProps } from "@copilotkit/react-ui";
import { t } from "@lingui/macro";
import { PaperPlaneIcon, StopIcon } from "@phosphor-icons/react";
import { cn } from "@reactive-resume/utils";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

export const MakeInput: React.FC<InputProps> = (props) => {
  const { inProgress, onSend: propOnSend, onStop } = props;

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState(45);

  const streaming = inProgress || sending;

  const onClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    textareaRef.current?.focus();
  }, []);

  const updateTextAreaHeight = useCallback(() => {
    const maxHeight = 120;
    const target = textareaRef.current;
    if (!target) return;
    target.style.height = "auto";
    const height = Math.min(target.scrollHeight, maxHeight);
    target.style.height = `${height}px`;
    target.style.overflowY = "auto";
    setTextareaHeight(height);
  }, []);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateTextAreaHeight();
      setInput(e.currentTarget.value);
    },
    [updateTextAreaHeight],
  );

  const handleSend = useCallback(
    async (message?: string) => {
      const messageToSend = message ?? input;
      if (!messageToSend.trim() || streaming) return;

      setSending(true);
      setInput("");
      setTimeout(() => {
        updateTextAreaHeight();
      }, 0);

      try {
        await propOnSend(messageToSend);
      } finally {
        setSending(false);
      }
    },
    [input, propOnSend, streaming, updateTextAreaHeight],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const isEmpty = e.currentTarget.value.trim() === "";

      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        if (!isEmpty && !streaming) {
          e.currentTarget.blur();
          void handleSend();
        }
      }
    },
    [handleSend, streaming],
  );

  useEffect(() => {
    updateTextAreaHeight();
  }, [updateTextAreaHeight]);

  return (
    <div
      className={cn(
        "w-full rounded-2xl border p-4 transition-all duration-500",
        "border-gray-200 bg-white shadow-[0px_2px_3px_rgba(0,0,0,0.05)]",
        "hover:shadow-[0px_4px_6px_rgba(0,0,0,0.08)]",
        "dark:border-gray-700 dark:bg-gray-800",
      )}
      onClick={onClick}
    >
      <div className="relative w-full">
        <motion.div
          layout
          animate={{ height: textareaHeight }}
          transition={{ duration: 0.13, ease: "easeOut" }}
        >
          <textarea
            ref={textareaRef}
            autoFocus
            name="chat-input"
            rows={2}
            disabled={streaming}
            placeholder="What are your thoughts?"
            className={cn(
              "w-full resize-none bg-transparent text-sm",
              "border-0 p-0",
              "focus:outline-none focus:ring-0",
              "transition-[height] duration-150",
              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
          />
        </motion.div>
      </div>
      <footer className="mt-2 flex items-center justify-end">
        <div className="flex items-center gap-2">
          {streaming ? (
            <button
              className={cn(
                "flex size-7 items-center justify-center rounded-full",
                "bg-black transition-all duration-200",
                "hover:scale-105 hover:shadow-lg",
                "active:scale-95",
                "dark:bg-gray-700",
              )}
              aria-label={t`Stop generation`}
              onClick={onStop}
            >
              <StopIcon className="size-4 text-white" weight="fill" />
            </button>
          ) : (
            <button
              disabled={!input.trim() || sending}
              className={cn(
                "flex size-7 items-center justify-center rounded-full",
                "bg-blue-600 transition-all duration-200",
                "hover:scale-105 hover:bg-blue-700 hover:shadow-lg",
                "active:scale-95",
                "disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:scale-100",
                "dark:bg-blue-500 dark:hover:bg-blue-600",
                "dark:disabled:bg-gray-600",
              )}
              aria-label={t`Send message`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void handleSend();
              }}
            >
              <PaperPlaneIcon className="size-4 text-white" weight="fill" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
