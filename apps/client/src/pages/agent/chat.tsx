/* eslint-disable lingui/no-unlocalized-strings */
import "@copilotkit/react-ui/styles.css";

import { CopilotChat, useCopilotChatSuggestions } from "@copilotkit/react-ui";
import { ScrollArea } from "@reactive-resume/ui";

import { MakeAssistantMessage } from "@/client/components/agent-ui/make-assistant-message";
import { MakeInput } from "@/client/components/agent-ui/make-input";
import { MarkUserMessage } from "@/client/components/agent-ui/make-user-message";
import { RenderSuggestionsList } from "@/client/components/agent-ui/render-suggestions-list";
import { useResumeActions } from "@/client/hooks/use-resume-actions";
import { useResumeCopilot } from "@/client/hooks/use-resume-copilot";
import { useResumeStore } from "@/client/stores/resume";

export function AgentChat() {
  // Share resume state with AI
  useResumeCopilot();
  const resume = useResumeStore((state) => state.resume);

  // Provide resume editing actions to AI
  useResumeActions();

  useCopilotChatSuggestions(
    {
      instructions: "Suggest the most relevant next actions.",
      minSuggestions: 1,
      maxSuggestions: 2,
    },
    [resume.data],
  );

  return (
    <ScrollArea
      orientation="vertical"
      className="relative flex h-screen flex-1 flex-col self-center bg-[var(--background-gray-main)]"
    >
      <div className="flex h-screen min-w-0 flex-1 overflow-hidden bg-[var(--background-gray-main)]">
        <CopilotChat
          className="size-full flex-1 bg-[var(--background-gray-main)]"
          instructions={`You are a professional resume optimization assistant with expertise in creating compelling, ATS-friendly resumes.

Your capabilities include:
- Improving summary/objective statements to be more impactful and targeted
- Enhancing work experience descriptions with strong action verbs and quantifiable achievements
- Optimizing project descriptions to highlight technical skills and outcomes
- Organizing and presenting skills effectively

When suggesting changes:
1. Always use the provided actions (updateSummary, addExperience, updateExperience, addProject) to apply changes
2. Provide clear reasoning for each suggestion
3. Focus on impact, clarity, and relevance
4. Use action verbs and quantify achievements where possible
5. Ensure consistency in formatting and tone

Render a review card for each change with Accept/Reject options, and apply on Accept.`}
          labels={{
            title: "Resume Assistant",
            initial:
              "Hi! 👋 I'm your resume optimization assistant. I can help you improve your resume's content. What would you like to work on?",
          }}
          AssistantMessage={MakeAssistantMessage}
          Input={MakeInput}
          UserMessage={MarkUserMessage}
          RenderSuggestionsList={RenderSuggestionsList}
        ></CopilotChat>
      </div>
    </ScrollArea>
  );
}
