import { Annotation } from "@langchain/langgraph";
import { CopilotKitStateAnnotation } from "@copilotkit/sdk-js/langgraph";
import { ResumeDto } from "@reactive-resume/dto";

export type TodoStatus = "todo" | "in_progress" | "done";
export interface CurrentTodo {
  id: string;
  title: string;
  status: TodoStatus;
}
const CurrentTodoAnnotation = Annotation.Root({
  id: Annotation<string>,
  title: Annotation<string>,
  status: Annotation<TodoStatus>,
});

const LogAnnotation = Annotation.Root({
  message: Annotation<string>,
  done: Annotation<boolean>,
});

const ScoreBreakdownAnnotation = Annotation.Root({
  summary: Annotation<number>,
  skills: Annotation<number>,
  experience: Annotation<number>,
  education: Annotation<number>,
  projects: Annotation<number>,
});

const ScoreWeightsAnnotation = Annotation.Root({
  summary: Annotation<number>,
  skills: Annotation<number>,
  experience: Annotation<number>,
  education: Annotation<number>,
  projects: Annotation<number>,
});

export const resumeAnnotation = Annotation.Root({
  resume: Annotation<ResumeDto>,
});

export const AgentStateAnnotation = Annotation.Root({
  ...CopilotKitStateAnnotation.spec,
  ...resumeAnnotation.spec,
  currentTodos: Annotation<(typeof CurrentTodoAnnotation.State)[]>,
  logs: Annotation<(typeof LogAnnotation.State)[]>,
  createdTodos: Annotation<boolean>,
  jdContent: Annotation<string>,
  // Current resume-vs-JD match score (0-1)
  currentScore: Annotation<number>,
  // Optional per-section scores (0-1)
  scoreBreakdown: Annotation<typeof ScoreBreakdownAnnotation.State>,
  // Optional weights used for the score (sum to 1)
  scoreWeights: Annotation<typeof ScoreWeightsAnnotation.State>,
});

export type AgentState = typeof AgentStateAnnotation.State;
