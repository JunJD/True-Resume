import { CopilotKit } from "@copilotkit/react-core";
import { StrictMode } from "react";
import * as ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";

import { router } from "./router";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = ReactDOM.createRoot(document.querySelector("#root")!);

root.render(
  <StrictMode>
    <CopilotKit runtimeUrl="/agentKit" agent="resume_agent">
      <RouterProvider router={router} />
    </CopilotKit>
  </StrictMode>,
);
