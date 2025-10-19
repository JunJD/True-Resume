# AgentKit Module

CopilotKit + LangGraph 集成模块，为 True-Resume 提供 AI 智能助手功能。

> 📖 **完整文档**：请参考根目录的 [AGENTKIT_COMPLETE_GUIDE.md](../../AGENTKIT_COMPLETE_GUIDE.md)

## 快速开始

### 1. 启动服务

```bash
# 终端 1：启动 GraphAI 服务
nx serve graphai

# 终端 2：启动 Server 服务
nx serve server
```

### 2. 环境变量

在根目录 `.env` 文件中配置：

```env
LANGGRAPH_URL=http://localhost:2024
LANGGRAPH_GRAPH_ID=agent
# LANGGRAPH_AGENT_ID=fe096781-5601-53d2-b2f6-0d3403f7e9ca
OPENAI_API_KEY=sk-xxx
LANGSMITH_API_KEY=lsv2_xxx
```

### 3. 端点

- **AgentKit 端点**: `http://localhost:3000/copilotkit`
- **LangGraph Studio**: `https://smith.langchain.com/studio?baseUrl=http://localhost:2024`

## 技术实现

### 核心组件

- **AgentkitService**: CopilotKit Runtime 配置和请求处理
- **AgentkitController**: `/copilotkit` 端点处理
- **AgentkitModule**: NestJS 模块注册

### 关键配置

```typescript
// 使用 LangGraphAgent 连接 GraphAI
new LangGraphAgent({
  deploymentUrl: "http://localhost:2024",
  graphId: "agent",
  description: "AI agent for resume optimization",
})

// 使用空适配器（LLM 由 GraphAI 处理）
new ExperimentalEmptyAdapter()
```

## 开发指南

### 添加新 Agent

1. 在 GraphAI 中创建新工作流
2. 在 `agentkit.service.ts` 中添加配置
3. 更新环境变量

### 调试工具

- **LangGraph Studio**: 可视化工作流调试
- **LangSmith**: 追踪和性能分析
- **NestJS 日志**: 服务层调试

## 相关资源

- [完整指南](../../AGENTKIT_COMPLETE_GUIDE.md)
- [CopilotKit 文档](https://docs.copilotkit.ai/)
- [LangGraph 文档](https://langchain-ai.github.io/langgraphjs/)
