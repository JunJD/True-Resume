/* eslint-disable lingui/no-unlocalized-strings, import/order, sort-imports, simple-import-sort/imports */
import { useMemo } from "react";
import { motion } from "framer-motion";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";

type DiffViewerProps = {
  oldValue: unknown;
  newValue: unknown;
  sectionKey: string;
  action: "update" | "add" | "delete";
};

export const DiffViewer = ({ oldValue, newValue, sectionKey, action }: DiffViewerProps) => {
  const { oldText, newText } = useMemo(() => {
    if (action === "add") {
      return {
        oldText: "",
        newText: serializeForDiff(newValue, sectionKey),
      };
    }
    if (action === "delete") {
      return {
        oldText: serializeForDiff(oldValue, sectionKey),
        newText: "",
      };
    }
    return {
      oldText: serializeForDiff(oldValue, sectionKey),
      newText: serializeForDiff(newValue, sectionKey),
    };
  }, [oldValue, newValue, sectionKey, action]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-lg border border-border"
    >
      <ReactDiffViewer
        oldValue={oldText}
        newValue={newText}
        splitView={false}
        compareMethod={DiffMethod.WORDS_WITH_SPACE}
        disableWordDiff={false}
        showDiffOnly={false}
        // pure text diff; no syntax highlight
        styles={{
          variables: {
            light: {
              diffViewerBackground: "transparent",
            },
            dark: {
              diffViewerBackground: "transparent",
            },
          },
        }}
      />
    </motion.div>
  );
};

const serializeForDiff = (value: unknown, sectionKey: string) => {
  if (!value) return "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const val = value as any;

  if (sectionKey === "summary") {
    // Treat as HTML/markdown. We can diff as markdown text for readability.
    return typeof val === "string" ? val : String(val ?? "");
  }

  if (sectionKey === "experience") {
    const lines: string[] = [];
    if (val.position) lines.push(`# ${val.position}`);
    if (val.company) lines.push(`Company: ${val.company}`);
    if (val.location) lines.push(`Location: ${val.location}`);
    if (val.date) lines.push(`Date: ${val.date}`);
    if (val.summary) lines.push(`\n${stripHtml(val.summary)}`);
    return lines.join("\n");
  }

  if (sectionKey === "projects") {
    const lines: string[] = [];
    if (val.name) lines.push(`# ${val.name}`);
    if (val.description) lines.push(val.description);
    if (val.date) lines.push(`Date: ${val.date}`);
    if (val.summary) lines.push(`\n${stripHtml(val.summary)}`);
    if (Array.isArray(val.keywords) && val.keywords.length > 0) {
      lines.push("\nKeywords:");
      for (const k of val.keywords) lines.push(`- ${k}`);
    }
    return lines.join("\n");
  }

  if (sectionKey === "skills") {
    const lines: string[] = [];
    if (val.name) lines.push(`# ${val.name}`);
    if (val.description) lines.push(val.description);
    if (val.level !== undefined) lines.push(`Level: ${val.level}/5`);
    if (Array.isArray(val.keywords) && val.keywords.length > 0) {
      lines.push("\nKeywords:");
      for (const k of val.keywords) lines.push(`- ${k}`);
    }
    return lines.join("\n");
  }

  return JSON.stringify(value, null, 2);
};

const stripHtml = (html: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
};

// No Prism usage; purely textual rendering
