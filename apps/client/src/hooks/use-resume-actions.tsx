/* eslint-disable lingui/no-unlocalized-strings */
import {
  useCoAgentStateRender,
  useCopilotAction,
  useLangGraphInterrupt,
} from "@copilotkit/react-core";
import type { Experience, Project } from "@reactive-resume/schema";
import { type Template, templatesList } from "@reactive-resume/utils";

import { InputJDCard } from "@/client/components/agent-ui/input-jd-card";
import { MatchScoreCard } from "@/client/components/agent-ui/match-score-card";
import { ChangeApprovalCard } from "@/client/components/change-approval-card";
import { TemplateSelector } from "@/client/components/template-selector";

// import type { AgentState } from "../../../apps/graphai/src/agent/state";
import { useResumeStore } from "../stores/resume";

export const useResumeActions = () => {
  const resume = useResumeStore((state) => state.resume);

  // Update Summary Action
  useCopilotAction({
    name: "updateSummary",
    description:
      "Update the resume summary/objective section with improved or new content. Use this to enhance the professional summary.",
    parameters: [
      {
        name: "newSummary",
        type: "string",
        description: "The new or improved summary content in HTML format",
        required: true,
      },
      {
        name: "reason",
        type: "string",
        description: "Brief explanation of why this change improves the resume",
        required: false,
      },
    ],
    renderAndWaitForResponse: ({ args, respond, status }) => {
      const oldSummary = resume.data.sections.summary.content;
      return (
        <ChangeApprovalCard
          sectionKey="summary"
          action="update"
          oldValue={oldSummary}
          newValue={args.newSummary}
          description={args.reason ?? "Updated summary section"}
          respond={respond}
          status={status}
        />
      );
    },
  });

  // Add Experience Action
  useCopilotAction({
    name: "addExperience",
    description: "Add a new work experience entry to the resume.",
    parameters: [
      { name: "company", type: "string", description: "Company name", required: true },
      { name: "position", type: "string", description: "Job title/position", required: true },
      { name: "location", type: "string", description: "Location of the job", required: false },
      {
        name: "date",
        type: "string",
        description: "Date range (e.g., 'Jan 2020 - Present')",
        required: false,
      },
      {
        name: "summary",
        type: "string",
        description: "HTML formatted description of responsibilities and achievements",
        required: true,
      },
      {
        name: "reason",
        type: "string",
        description: "Brief explanation of why this addition is valuable",
        required: false,
      },
    ],
    renderAndWaitForResponse: ({ args, respond, status }) => {
      const newExperience: Partial<Experience> = {
        company: args.company,
        position: args.position,
        location: args.location ?? "",
        date: args.date ?? "",
        summary: args.summary,
        visible: true,
      };
      return (
        <ChangeApprovalCard
          sectionKey="experience"
          action="add"
          oldValue={null}
          newValue={newExperience}
          description={args.reason ?? `Add experience at ${args.company}`}
          respond={respond}
          status={status}
        />
      );
    },
  });

  // Update Experience Action
  useCopilotAction({
    name: "updateExperience",
    description:
      "Update an existing work experience entry in the resume. You should identify the experience by company name and position.",
    parameters: [
      {
        name: "experienceId",
        type: "string",
        description: "The ID of the experience item to update. Find this from the readable state.",
        required: true,
      },
      {
        name: "company",
        type: "string",
        description: "Updated company name",
        required: false,
      },
      {
        name: "position",
        type: "string",
        description: "Updated job title/position",
        required: false,
      },
      {
        name: "location",
        type: "string",
        description: "Updated location",
        required: false,
      },
      {
        name: "date",
        type: "string",
        description: "Updated date range (e.g., 'Jan 2020 - Present')",
        required: false,
      },
      {
        name: "summary",
        type: "string",
        description: "Updated HTML formatted description of responsibilities and achievements",
        required: false,
      },
      {
        name: "url",
        type: "object",
        description: "Updated URL object with label and href properties",
        required: false,
      },
      {
        name: "reason",
        type: "string",
        description: "Brief explanation of the improvement",
        required: false,
      },
    ],
    renderAndWaitForResponse: ({ args, respond, status }) => {
      const experiences = resume.data.sections.experience.items;
      const oldExperience = experiences.find((exp) => exp.id === args.experienceId);
      if (!oldExperience) {
        return (
          <div className="text-sm text-foreground/70">
            Experience with ID {String(args.experienceId)} not found.
          </div>
        );
      }

      // Build updates object from individual fields
      const updates: Partial<Experience> = {};
      if (args.company !== undefined) updates.company = args.company;
      if (args.position !== undefined) updates.position = args.position;
      if (args.location !== undefined) updates.location = args.location;
      if (args.date !== undefined) updates.date = args.date;
      if (args.summary !== undefined) updates.summary = args.summary;
      if (args.url !== undefined) updates.url = args.url as { label: string; href: string };

      const newExperience = { ...oldExperience, ...updates } as Experience;
      return (
        <ChangeApprovalCard
          sectionKey="experience"
          action="update"
          oldValue={oldExperience}
          newValue={newExperience}
          description={args.reason ?? `Update experience at ${oldExperience.company}`}
          respond={respond}
          status={status}
        />
      );
    },
  });

  // Add Project Action
  useCopilotAction({
    name: "addProject",
    description: "Add a new project entry to the resume.",
    parameters: [
      { name: "name", type: "string", description: "Project name", required: true },
      {
        name: "description",
        type: "string",
        description: "Brief project description",
        required: true,
      },
      { name: "date", type: "string", description: "Project date or date range", required: false },
      {
        name: "summary",
        type: "string",
        description: "HTML formatted detailed description of the project and achievements",
        required: true,
      },
      {
        name: "keywords",
        type: "object",
        description: "Array of technology or skill keywords",
        required: false,
      },
      {
        name: "reason",
        type: "string",
        description: "Brief explanation of why this project is valuable",
        required: false,
      },
    ],
    renderAndWaitForResponse: ({ args, respond, status }) => {
      const newProject: Partial<Project> = {
        name: args.name,
        description: args.description,
        date: args.date ?? "",
        summary: args.summary,
        keywords: (args.keywords as string[] | undefined) ?? [],
        visible: true,
      };
      return (
        <ChangeApprovalCard
          sectionKey="projects"
          action="add"
          oldValue={null}
          newValue={newProject}
          description={args.reason ?? `Add project: ${args.name}`}
          respond={respond}
          status={status}
        />
      );
    },
  });

  // Update Project Action
  useCopilotAction({
    name: "updateProject",
    description: "Update an existing project entry in the resume.",
    parameters: [
      {
        name: "projectId",
        type: "string",
        description: "The ID of the project item to update",
        required: true,
      },
      {
        name: "name",
        type: "string",
        description: "Updated project name",
        required: false,
      },
      {
        name: "description",
        type: "string",
        description: "Updated brief project description",
        required: false,
      },
      {
        name: "date",
        type: "string",
        description: "Updated project date or date range",
        required: false,
      },
      {
        name: "summary",
        type: "string",
        description: "Updated HTML formatted detailed description",
        required: false,
      },
      {
        name: "keywords",
        type: "object",
        description: "Updated array of technology or skill keywords",
        required: false,
      },
      {
        name: "url",
        type: "object",
        description: "Updated URL object with label and href properties",
        required: false,
      },
      {
        name: "reason",
        type: "string",
        description: "Brief explanation of the improvement",
        required: false,
      },
    ],
    renderAndWaitForResponse: ({ args, respond, status }) => {
      const projects = resume.data.sections.projects.items;
      const oldProject = projects.find((proj) => proj.id === args.projectId);
      if (!oldProject) {
        return (
          <div className="text-sm text-foreground/70">
            Project with ID {String(args.projectId)} not found.
          </div>
        );
      }

      // Build updates object from individual fields
      const updates: Partial<Project> = {};
      if (args.name !== undefined) updates.name = args.name;
      if (args.description !== undefined) updates.description = args.description;
      if (args.date !== undefined) updates.date = args.date;
      if (args.summary !== undefined) updates.summary = args.summary;
      if (args.keywords !== undefined) updates.keywords = args.keywords as string[];
      if (args.url !== undefined) updates.url = args.url as { label: string; href: string };

      const newProject = { ...oldProject, ...updates } as Project;
      return (
        <ChangeApprovalCard
          sectionKey="projects"
          action="update"
          oldValue={oldProject}
          newValue={newProject}
          description={args.reason ?? `Update project: ${oldProject.name}`}
          respond={respond}
          status={status}
        />
      );
    },
  });

  useCopilotAction({
    name: "changeTemplate",
    description:
      "Change the resume template to a different design. Call this whenever user mentions changing, switching, or trying a different template layout. Always use this tool to show the template selector UI instead of describing templates in text.",
    parameters: [
      {
        name: "template",
        type: "string",
        description:
          "Optional: AI suggested template name if user specified which template they want. If user just wants to change template without specifying which one, leave this empty and let them choose from the UI.",
        enum: [...templatesList],
        required: false,
      },
      {
        name: "reason",
        type: "string",
        description: "Optional: Brief explanation of why the suggested template is better",
        required: false,
      },
    ],
    renderAndWaitForResponse: ({ args, respond, status }) => {
      const currentTemplate = resume.data.metadata.template as Template;
      const suggestedTemplate = args.template ?? currentTemplate;
      return (
        <TemplateSelector
          currentTemplate={currentTemplate}
          suggestedTemplate={suggestedTemplate}
          reason={args.reason}
          respond={respond}
          status={status}
        />
      );
    },
  });

  useLangGraphInterrupt<string>({
    render: ({ event, resolve }) => <InputJDCard event={event} resolve={resolve} />,
    enabled: ({ eventValue, agentMetadata }) => {
      return (
        eventValue === "请粘贴你想要面试岗位的招聘信息(JD),我会根据JD优化你的简历" &&
        agentMetadata.agentName === "resume_agent" &&
        agentMetadata.nodeName === "analyze_jd_node"
      );
    },
  });

  useCoAgentStateRender({
    name: "resume_agent",
    nodeName: "analyze_jd_node",
    render: ({ state }) => {
      const score = Number(state.currentScore ?? 0);
      if (Number.isFinite(score) && score > 0) {
        const jdPreview =
          typeof state.jdContent === "string" ? state.jdContent.slice(0, 160) : undefined;
        return (
          <MatchScoreCard score={score} jdPreview={jdPreview} breakdown={state.scoreBreakdown} />
        );
      }
      return null;
    },
  });
};
