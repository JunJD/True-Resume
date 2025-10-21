import {
  CopilotRuntime,
  copilotRuntimeNestEndpoint,
  CopilotServiceAdapter,
  LangGraphAgent,
} from "@copilotkit/runtime";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";

import { AgentOnlyAdapter } from "./adapters/agent-only.adapter";

@Injectable()
export class AgentkitService {
  private runtime: CopilotRuntime;
  private serviceAdapter: CopilotServiceAdapter;

  constructor(private configService: ConfigService) {
    this.initializeAdapter();
    this.initializeRuntime();
  }

  private initializeAdapter() {
    this.serviceAdapter = new AgentOnlyAdapter();
  }

  private initializeRuntime() {
    const langgraphUrl = this.configService.get<string>("LANGGRAPH_URL") ?? "";
    const langgraphGraphId = this.configService.get<string>("LANGGRAPH_GRAPH_ID") ?? "agent";
    const langsmithApiKey = this.configService.get<string>("LANGSMITH_API_KEY");

    this.runtime = new CopilotRuntime({
      agents: {
        resume_agent: new LangGraphAgent({
          deploymentUrl: langgraphUrl,
          graphId: langgraphGraphId,
          agentName: "resume_agent",
          description: "AI agent for resume optimization and analysis powered by LangGraph",
          ...(langsmithApiKey ? { langsmithApiKey } : {}),
        }),
      },
    });
  }

  handleRequest(req: Request, res: Response) {
    const handler = copilotRuntimeNestEndpoint({
      runtime: this.runtime,
      serviceAdapter: this.serviceAdapter,
      endpoint: "/agentKit",
    });

    return handler(req, res);
  }
}
