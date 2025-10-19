# AgentKit 完整指南 🚀

CopilotKit + LangGraph 集成到 True-Resume 的完整指南。

## 🎯 项目概述

AgentKit 是一个集成模块，将 CopilotKit 和 LangGraph 整合到 True-Resume 项目中，提供 AI 智能简历助手功能。

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────┐
│  GraphAI Service (apps/graphai)                 │
│  Port: 2024                                      │
│  LangGraph 工作流执行                            │
└─────────────────────────────────────────────────┘
         ↑ HTTP 连接
         ↓
┌─────────────────────────────────────────────────┐
│  NestJS Server (apps/server)                    │
│  Port: 3000                                      │
│                                                  │
│  ┌──────────────────────────────┐              │
│  │  AgentKit Module              │              │
│  │  /copilotkit endpoint         │              │
│  │                                │              │
│  │  ┌───────────────────────┐   │              │
│  │  │ CopilotRuntime        │   │              │
│  │  │  + Empty Adapter      │   │              │
│  │  │  + LangGraphAgent     │   │              │
│  │  │    (HTTP 连接到 2024) │   │              │
│  │  └───────────────────────┘   │              │
│  └──────────────────────────────┘              │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│  CopilotKit Cloud                               │
│  连接到: http://your-domain.com/copilotkit      │
└─────────────────────────────────────────────────┘
```

## 📁 文件结构

```
True-Resume/
├── apps/
│   ├── graphai/                    # LangGraph 服务
│   │   ├── src/agent/
│   │   │   ├── graph.ts           # 主要工作流
│   │   │   └── state.ts           # 状态管理
│   │   ├── langgraph.json         # LangGraph 配置
│   │   └── project.json           # Nx 项目配置
│   └── server/
│       └── src/agentkit/           # AgentKit 模块
│           ├── agentkit.module.ts  # NestJS 模块
│           ├── agentkit.controller.ts # /copilotkit 端点
│           ├── agentkit.service.ts # CopilotKit Runtime
│           └── README.md           # 模块文档
├── .env.example                    # 环境变量模板
└── AGENTKIT_COMPLETE_GUIDE.md     # 本文档
```

## 🎯 关键特点

## 📚 相关资源

- [CopilotKit 官方文档](https://docs.copilotkit.ai/)
- [LangGraph 官方文档](https://langchain-ai.github.io/langgraphjs/)
- [LangSmith 平台](https://smith.langchain.com/)
- [LangGraph Studio](https://langchain-ai.github.io/langgraph/concepts/langgraph_studio/)
