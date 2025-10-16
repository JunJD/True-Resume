/* eslint-disable lingui/no-unlocalized-strings */
import { CheckIcon } from "@phosphor-icons/react";
import { Button } from "@reactive-resume/ui";
import { cn, type Template, templatesList } from "@reactive-resume/utils";
import { motion } from "framer-motion";
import { useState } from "react";

import { useResumeStore } from "@/client/stores/resume";

type TemplateSelectorProps = {
  currentTemplate: Template;
  suggestedTemplate: Template;
  reason?: string;
  respond: ((result: { status: string; template?: Template }) => void) | undefined;
};

// Template display names for better UX
const templateDisplayNames: Record<Template, string> = {
  azurill: "Azurill",
  bronzor: "Bronzor",
  chikorita: "Chikorita",
  ditto: "Ditto",
  gengar: "Gengar",
  glalie: "Glalie",
  kakuna: "Kakuna",
  leafish: "Leafish",
  nosepass: "Nosepass",
  onyx: "Onyx",
  pikachu: "Pikachu",
  rhyhorn: "Rhyhorn",
};

export const TemplateSelector = ({
  currentTemplate,
  suggestedTemplate,
  reason,
  respond,
}: TemplateSelectorProps) => {
  const setValue = useResumeStore((state) => state.setValue);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(suggestedTemplate);
  const [status, setStatus] = useState<"pending" | "confirmed">("pending");

  const handleTemplateSelect = (template: Template) => {
    if (status === "confirmed") return;
    setSelectedTemplate(template);
    setValue("metadata.template", template);
  };

  const handleConfirm = () => {
    setStatus("confirmed");
    setTimeout(() => {
      respond?.({ status: "accepted", template: selectedTemplate });
    }, 500);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, height: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "my-3 overflow-hidden rounded-lg border shadow-sm backdrop-blur-sm transition-all duration-300",
        status === "pending" && "border-border/60 bg-secondary/30",
        status === "confirmed" && "border-green-500/50 bg-green-500/10",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b px-4 py-2.5 transition-colors duration-300",
          status === "pending" && "border-border/40 bg-background/50",
          status === "confirmed" && "border-green-500/30 bg-green-500/5",
        )}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 transition-all duration-300",
              status === "pending" && "bg-primary/10 text-primary-foreground/80 ring-primary/20",
              status === "confirmed" &&
                "bg-green-500/20 text-green-700 ring-green-500/40 dark:text-green-400",
            )}
          >
            {status === "pending" && "Change"}
            {status === "confirmed" && "Confirmed"}
          </span>
          <span className="text-sm font-medium capitalize text-foreground">Template</span>
        </div>
        {status === "confirmed" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <CheckIcon className="size-5 text-green-600 dark:text-green-400" weight="bold" />
          </motion.div>
        )}
      </div>

      {reason && status === "pending" && (
        <div className="border-b border-border/40 bg-background/30 px-4 py-2">
          <p className="text-sm text-foreground/60">{reason}</p>
        </div>
      )}

      {status === "pending" && (
        <div className="p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-foreground/60">
            <span>
              Current:{" "}
              <strong className="text-foreground">{templateDisplayNames[currentTemplate]}</strong>
            </span>
            <span>
              Selected:{" "}
              <strong className="text-primary">{templateDisplayNames[selectedTemplate]}</strong>
            </span>
          </div>
          {/* Compact template grid */}
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 rounded-md border border-border/60 bg-background/40 p-3">
            {templatesList.map((template) => (
              <div
                key={template}
                className={cn(
                  "group relative cursor-pointer rounded-lg border-2 transition-all duration-200",
                  "hover:scale-105 hover:shadow-lg",
                  status === "pending" ? "cursor-pointer" : "cursor-not-allowed",
                  selectedTemplate === template
                    ? "border-primary shadow-lg"
                    : "border-transparent hover:border-primary/50",
                )}
                onClick={() => {
                  handleTemplateSelect(template);
                }}
              >
                <img
                  src={`/templates/jpg/${template}.jpg`}
                  alt={templateDisplayNames[template]}
                  className="w-full rounded-md"
                />
                <div
                  className={cn(
                    "absolute inset-x-0 bottom-0 rounded-b-md bg-background/70 py-1.5 text-center text-xs font-medium backdrop-blur-sm transition-all duration-200",
                    selectedTemplate === template
                      ? "text-primary"
                      : "text-foreground group-hover:text-primary",
                  )}
                >
                  {templateDisplayNames[template]}
                </div>

                {template === currentTemplate && (
                  <span className="absolute -right-2 -top-2 rounded-full bg-blue-500 p-1 text-white ring-2 ring-background">
                    <CheckIcon className="size-3" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {status === "pending" && (
        <div className="flex gap-2 border-t border-border/40 bg-background/40 p-3">
          <Button
            size="sm"
            className="group w-full border-0 bg-green-600 shadow-sm transition-all hover:bg-green-700 hover:shadow-md"
            onClick={handleConfirm}
          >
            <CheckIcon className="mr-1.5 size-4 transition-transform group-hover:scale-110" />
            Confirm Selection
          </Button>
        </div>
      )}

      {status === "confirmed" && (
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            ✓ Template changed to {templateDisplayNames[selectedTemplate]}
          </p>
        </div>
      )}
    </motion.div>
  );
};
