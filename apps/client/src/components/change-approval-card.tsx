/* eslint-disable lingui/no-unlocalized-strings */
import { createId } from "@paralleldrive/cuid2";
import { CheckIcon, CircleNotchIcon, XIcon } from "@phosphor-icons/react";
import type { Experience, Project, Skill } from "@reactive-resume/schema";
import { Button } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";
import { motion } from "framer-motion";
import { produce } from "immer";

import { useResumeStore } from "@/client/stores/resume";

import { DiffViewer } from "./diff-viewer";

type ChangeApprovalCardProps = {
  sectionKey: "summary" | "experience" | "projects" | "skills";
  action: "update" | "add" | "delete";
  oldValue: unknown;
  newValue: unknown;
  description?: string;
  respond: ((result: { status: string }) => void) | undefined;
  status?: "inProgress" | "executing" | "complete";
};

export const ChangeApprovalCard = ({
  sectionKey,
  action,
  oldValue,
  newValue,
  description,
  respond,
  status = "inProgress",
}: ChangeApprovalCardProps) => {
  const setValue = useResumeStore((state) => state.setValue);

  const applyChange = () => {
    switch (sectionKey) {
      case "summary": {
        setValue("sections.summary.content", newValue as string);
        break;
      }
      case "experience": {
        const section = useResumeStore.getState().resume.data.sections.experience;

        switch (action) {
          case "add": {
            setValue(
              "sections.experience.items",
              produce(section.items, (draft: Experience[]) => {
                draft.push({ ...(newValue as Partial<Experience>), id: createId() } as Experience);
              }),
            );
            break;
          }
          case "update": {
            setValue(
              "sections.experience.items",
              produce(section.items, (draft: Experience[]) => {
                const index = draft.findIndex(
                  (item: Experience) => item.id === (newValue as Experience).id,
                );
                if (index !== -1) {
                  draft[index] = newValue as Experience;
                }
              }),
            );
            break;
          }
          case "delete": {
            setValue(
              "sections.experience.items",
              section.items.filter((item: Experience) => item.id !== (oldValue as Experience).id),
            );
            break;
          }
          // No default
        }
        break;
      }
      case "projects": {
        const section = useResumeStore.getState().resume.data.sections.projects;

        switch (action) {
          case "add": {
            setValue(
              "sections.projects.items",
              produce(section.items, (draft: Project[]) => {
                draft.push({ ...(newValue as Partial<Project>), id: createId() } as Project);
              }),
            );
            break;
          }
          case "update": {
            setValue(
              "sections.projects.items",
              produce(section.items, (draft: Project[]) => {
                const index = draft.findIndex(
                  (item: Project) => item.id === (newValue as Project).id,
                );
                if (index !== -1) {
                  draft[index] = newValue as Project;
                }
              }),
            );
            break;
          }
          case "delete": {
            setValue(
              "sections.projects.items",
              section.items.filter((item: Project) => item.id !== (oldValue as Project).id),
            );
            break;
          }
          // No default
        }
        break;
      }
      case "skills": {
        const section = useResumeStore.getState().resume.data.sections.skills;

        switch (action) {
          case "add": {
            setValue(
              "sections.skills.items",
              produce(section.items, (draft: Skill[]) => {
                draft.push({ ...(newValue as Partial<Skill>), id: createId() } as Skill);
              }),
            );
            break;
          }
          case "update": {
            setValue(
              "sections.skills.items",
              produce(section.items, (draft: Skill[]) => {
                const index = draft.findIndex((item: Skill) => item.id === (newValue as Skill).id);
                if (index !== -1) {
                  draft[index] = newValue as Skill;
                }
              }),
            );
            break;
          }
          case "delete": {
            setValue(
              "sections.skills.items",
              section.items.filter((item: Skill) => item.id !== (oldValue as Skill).id),
            );
            break;
          }
          // No default
        }
        break;
      }
      // No default
    }
  };

  const handleAccept = () => {
    applyChange();
    respond?.({ status: "accepted" });
  };

  const handleReject = () => {
    respond?.({ status: "rejected" });
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
        status === "inProgress" && "border-border/60 bg-secondary/30",
        status === "executing" && "border-border/60 bg-secondary/30",
        status === "complete" && "border-green-500/50 bg-green-500/10",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b px-4 py-2.5 transition-colors duration-300",
          status === "inProgress" && "border-border/40 bg-background/50",
          status === "executing" && "border-border/40 bg-background/50",
          status === "complete" && "border-green-500/30 bg-green-500/5",
        )}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 transition-all duration-300",
              (status === "inProgress" || status === "executing") &&
                "bg-primary/10 text-primary-foreground/80 ring-primary/20",
              status === "complete" &&
                "bg-green-500/20 text-green-700 ring-green-500/40 dark:text-green-400",
            )}
          >
            {status === "executing" && action}
            {status === "inProgress" && "Applying"}
            {status === "complete" && "Applied"}
          </span>
          <span className="text-sm font-medium capitalize text-foreground">{sectionKey}</span>
        </div>
        {status === "complete" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <CheckIcon className="size-5 text-green-600 dark:text-green-400" weight="bold" />
          </motion.div>
        )}
        {status === "inProgress" && <CircleNotchIcon className="size-5 animate-spin" />}
      </div>

      {description && status === "executing" && (
        <div className="border-b border-border/40 bg-background/30 px-4 py-2">
          <p className="text-sm text-foreground/60">{description}</p>
        </div>
      )}

      {status === "executing" && (
        <div className="p-4">
          <DiffViewer
            oldValue={oldValue}
            newValue={newValue}
            sectionKey={sectionKey}
            action={action}
          />
        </div>
      )}

      {status === "executing" && (
        <div className="flex gap-2 border-t border-border/40 bg-background/40 p-3">
          <Button
            size="sm"
            variant="ghost"
            className="group flex-1 border border-border/60 text-red-600 transition-all hover:border-red-500/50 hover:bg-red-500/10 dark:text-red-400"
            onClick={handleReject}
          >
            <XIcon className="mr-1.5 size-4 transition-transform group-hover:scale-110" />
            Reject
          </Button>
          <Button
            size="sm"
            className="group flex-1 border-0 bg-green-600 shadow-sm transition-all hover:bg-green-700 hover:shadow-md"
            onClick={handleAccept}
          >
            <CheckIcon className="mr-1.5 size-4 transition-transform group-hover:scale-110" />
            Accept
          </Button>
        </div>
      )}

      {status === "complete" && (
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            ✓ Change applied successfully
          </p>
        </div>
      )}
    </motion.div>
  );
};
