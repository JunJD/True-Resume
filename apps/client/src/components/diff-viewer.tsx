/* eslint-disable lingui/no-unlocalized-strings */
import { motion } from "framer-motion";
import { useMemo } from "react";

type DiffViewerProps = {
  oldValue: unknown;
  newValue: unknown;
  sectionKey: string;
  action: "update" | "add" | "delete";
};

export const DiffViewer = ({ oldValue, newValue, sectionKey, action }: DiffViewerProps) => {
  const renderDiff = useMemo(() => {
    if (action === "add") {
      return (
        <div className="space-y-2">
          <div className="text-sm font-medium text-green-600 dark:text-green-400">
            + New {sectionKey} entry
          </div>
          <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/20">
            {renderValue(newValue, sectionKey)}
          </div>
        </div>
      );
    }

    if (action === "delete") {
      return (
        <div className="space-y-2">
          <div className="text-sm font-medium text-red-600 dark:text-red-400">
            - Remove {sectionKey} entry
          </div>
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            {renderValue(oldValue, sectionKey)}
          </div>
        </div>
      );
    }

    // Update action
    if (sectionKey === "summary") {
      return (
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-sm font-medium text-red-600 dark:text-red-400">- Old</div>
            <div className="rounded-md bg-red-50 p-3 text-sm dark:bg-red-900/20">
              <div
                dangerouslySetInnerHTML={{ __html: (oldValue as string | undefined) ?? "(empty)" }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-green-600 dark:text-green-400">+ New</div>
            <div className="rounded-md bg-green-50 p-3 text-sm dark:bg-green-900/20">
              <div
                dangerouslySetInnerHTML={{ __html: (newValue as string | undefined) ?? "(empty)" }}
              />
            </div>
          </div>
        </div>
      );
    }

    // For structured items (experience, projects, skills)
    if (sectionKey === "experience" || sectionKey === "projects" || sectionKey === "skills") {
      return (
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-sm font-medium text-red-600 dark:text-red-400">- Old</div>
            <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
              {renderValue(oldValue, sectionKey)}
            </div>
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-green-600 dark:text-green-400">+ New</div>
            <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/20">
              {renderValue(newValue, sectionKey)}
            </div>
          </div>
        </div>
      );
    }

    return null;
  }, [oldValue, newValue, sectionKey, action]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-lg border border-border"
    >
      {renderDiff}
    </motion.div>
  );
};

const renderValue = (value: unknown, sectionKey: string) => {
  if (!value) return <span className="text-foreground/40">(empty)</span>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const val = value as any;

  if (sectionKey === "experience") {
    return (
      <div className="space-y-1 text-sm">
        <div className="font-semibold">{val.position ?? "(no position)"}</div>
        <div className="text-foreground">{val.company ?? "(no company)"}</div>
        {val.location && <div className="text-xs">{val.location}</div>}
        {val.date && <div className="text-xs">{val.date}</div>}
        {val.summary && (
          <div dangerouslySetInnerHTML={{ __html: val.summary }} className="mt-2 text-xs" />
        )}
      </div>
    );
  }

  if (sectionKey === "projects") {
    return (
      <div className="space-y-1 text-sm">
        <div className="font-semibold">{val.name ?? "(no name)"}</div>
        {val.description && <div className="text-xs text-foreground/70">{val.description}</div>}
        {val.date && <div className="text-xs">{val.date}</div>}
        {val.summary && (
          <div dangerouslySetInnerHTML={{ __html: val.summary }} className="mt-2 text-xs" />
        )}
        {val.keywords && val.keywords.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {val.keywords.map((keyword: string, idx: number) => (
              <span key={idx} className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                {keyword}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (sectionKey === "skills") {
    return (
      <div className="space-y-1 text-sm">
        <div className="font-semibold">{val.name ?? "(no name)"}</div>
        {val.description && <div className="text-xs text-foreground/70">{val.description}</div>}
        {val.level !== undefined && <div className="text-xs">Level: {val.level}/5</div>}
        {val.keywords && val.keywords.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {val.keywords.map((keyword: string, idx: number) => (
              <span key={idx} className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                {keyword}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>;
};
