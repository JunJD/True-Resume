/* eslint-disable lingui/no-unlocalized-strings */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useCopilotReadable } from "@copilotkit/react-core";

import { useResumeStore } from "../stores/resume";

export const useResumeCopilot = () => {
  const resume = useResumeStore((state) => state.resume);

  // Share summary content
  useCopilotReadable({
    description: "The resume summary/objective section content",
    value: resume.data?.sections?.summary?.content || "",
  });

  // Share experience items
  useCopilotReadable({
    description:
      "The work experience entries in the resume. Each entry includes company, position, location, date, and summary of responsibilities.",
    value: resume.data?.sections?.experience?.items || [],
  });

  // Share project items
  useCopilotReadable({
    description:
      "The project entries in the resume. Each project includes name, description, date, summary, keywords, and url.",
    value: resume.data?.sections?.projects?.items || [],
  });

  // Share skills items
  useCopilotReadable({
    description:
      "The skills in the resume. Each skill includes name, description, level (0-5), and keywords.",
    value: resume.data?.sections?.skills?.items || [],
  });

  return { resume };
};
