/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable lingui/no-unlocalized-strings */
import { useCoAgent } from "@copilotkit/react-core";

type TodoStatus = "todo" | "in_progress" | "done";

type CurrentTodo = {
  id: string;
  title: string;
  status: TodoStatus;
};

export function CurrentTodosPanel() {
  const { state } = useCoAgent({
    name: "resume_agent",
  });
  const todos: CurrentTodo[] = state?.currentTodos ?? [];
  if (todos.length === 0) return null;

  const inProgress = todos.filter((t) => t.status === "in_progress").length;
  const todo = todos.filter((t) => t.status === "todo").length;
  const done = todos.filter((t) => t.status === "done").length;

  return (
    <div className="mx-4 mt-3 rounded-xl border bg-background p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-sm font-medium">
        <div>
          {todos.length} Todo Item{todos.length > 1 ? "s" : ""}
        </div>
        <div className="text-xs text-foreground">
          {inProgress > 0 && <span className="mr-3">{inProgress} In&nbsp;Progress</span>}
          {todo > 0 && <span className="mr-3">{todo} Todo</span>}
          {done > 0 && <span>{done} Done</span>}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {todos.map((t) => (
          <div key={t.id} className="flex items-center gap-2 text-sm">
            <span className="inline-flex h-5 w-16 items-center justify-center rounded border text-xs capitalize">
              {(t.status ?? "todo").replace("_", " ")}
            </span>
            <span className={t.status === "done" ? "text-foreground line-through" : ""}>
              {t.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
