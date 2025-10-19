# GraphAI - LangGraph 智能简历助手

这是一个集成到 True-Resume monorepo 中的 LangGraph.js 应用，用于构建智能简历生成和优化助手。

## 项目结构

```
apps/graphai/
├── src/
│   └── agent/
│       ├── graph.ts      # 主要的 LangGraph 工作流定义
│       └── state.ts      # 状态管理和类型定义
├── tests/
│   ├── agent.test.ts     # 单元测试
│   └── graph.int.test.ts # 集成测试
├── langgraph.json        # LangGraph Server 配置
├── package.json          # 项目依赖
├── tsconfig.json         # TypeScript 配置
└── .env                  # 环境变量（需要手动创建）
```

## 快速开始

### 1. 安装依赖

在 monorepo 根目录运行：

```bash
pnpm install
```

### 2. 配置环境变量

GraphAI 使用 monorepo 根目录的 `.env` 文件（已在 `langgraph.json` 中配置为 `../../.env`）。

如果根目录还没有 `.env` 文件，在项目根目录执行：

```bash
cp .env.example .env
```

然后编辑根目录的 `.env` 文件，在文件末尾找到 "AI/LangGraph Configuration" 部分，填入必要的 API 密钥：

```env
# -- AI/LangGraph Configuration (for GraphAI module) --

# LangSmith API Key（可选 - 用于跟踪和调试）
LANGSMITH_API_KEY=your_langsmith_key_here
LANGCHAIN_TRACING_V2=true

# OpenAI API Key（如果使用 OpenAI 模型）
OPENAI_API_KEY=your_openai_key_here

# Anthropic API Key（如果使用 Claude 模型）
ANTHROPIC_API_KEY=your_anthropic_key_here
```

### 3. 开发模式运行

使用 Nx 命令：

```bash
# 在根目录运行
nx serve graphai

# 或在 apps/graphai 目录运行
npx @langchain/langgraph-cli dev
```

这将启动 LangGraph Studio 开发服务器，你可以在浏览器中访问可视化调试界面。

### 4. 构建项目

```bash
nx build graphai
```

### 5. 运行测试

```bash
# 运行单元测试
nx test graphai

# 运行集成测试
nx test:int graphai
```

### 6. 代码检查和格式化

```bash
# Lint
nx lint graphai

# 格式化
nx format graphai
```

## 主要功能

### 当前实现

- ✅ 基础的 LangGraph 工作流
- ✅ 消息状态管理
- ✅ 条件路由
- ✅ 单元测试和集成测试

### 可以扩展的功能

1. **集成 LLM 模型**
   - OpenAI GPT-4/GPT-3.5
   - Anthropic Claude
   - 其他开源模型

2. **简历分析功能**
   - 解析简历内容
   - 提取关键信息
   - 评估简历质量

3. **简历优化建议**
   - 根据职位描述优化简历
   - 提供改进建议
   - 生成更好的描述

4. **工具集成**
   - 集成 True-Resume 的 API
   - 连接数据库查询
   - 外部服务调用

## 开发指南

### 修改工作流

主要的工作流逻辑在 `src/agent/graph.ts` 中定义。你可以：

1. 添加新的节点（nodes）来执行特定任务
2. 定义边（edges）来连接节点
3. 使用条件边（conditional edges）实现动态路由

### 添加 LLM 调用

示例 - 使用 OpenAI：

```typescript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  model: "gpt-4",
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await model.invoke(state.messages);
```

示例 - 使用 Anthropic Claude：

```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const model = new ChatAnthropic({
  model: "claude-3-5-sonnet-20240620",
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await model.invoke(state.messages);
```

### 状态管理

状态定义在 `src/agent/state.ts` 中。你可以添加新的字段来存储：

```typescript
export const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[], BaseMessageLike[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  // 添加新字段
  resumeData: Annotation<ResumeData>(),
  analysisResult: Annotation<AnalysisResult>(),
});
```

## 调试

### 使用 LangGraph Studio

运行 `nx serve graphai` 后，访问 LangGraph Studio 界面进行可视化调试：

- 查看工作流图
- 逐步执行
- 检查每个节点的状态
- 修改并重新运行

### 使用 LangSmith

配置 `LANGSMITH_API_KEY` 后，所有运行的追踪信息会自动上传到 LangSmith 平台，方便分析和优化。

## 集成到 True-Resume

### 与现有服务通信

可以通过以下方式集成：

1. **REST API 调用**
   ```typescript
   import axios from 'axios';
   
   const resumeData = await axios.get('http://localhost:3000/api/resume/:id');
   ```

2. **直接导入共享库**
   ```typescript
   import { ResumeDto } from '@reactive-resume/dto';
   import { resumeSchema } from '@reactive-resume/schema';
   ```

3. **事件驱动**
   - 监听简历更新事件
   - 触发 AI 分析
   - 返回优化建议

## 常见问题

### Q: 如何切换 LLM 提供商？

A: 修改 `src/agent/graph.ts` 中的模型初始化代码，安装相应的 LangChain 集成包。

### Q: 测试失败怎么办？

A: 确保已经正确配置环境变量，并且所有依赖已安装。集成测试需要真实的 API 密钥。

### Q: 如何部署到生产环境？

A: 使用 LangGraph Cloud 或 Docker 容器部署。详见 [LangGraph 部署文档](https://langchain-ai.github.io/langgraph/concepts/deployment/)。

## 相关资源

- [LangGraph.js 文档](https://langchain-ai.github.io/langgraphjs/)
- [LangChain.js 文档](https://js.langchain.com/)
- [LangSmith](https://smith.langchain.com/)
- [LangGraph Studio](https://langchain-ai.github.io/langgraph/concepts/langgraph_studio/)

## 许可证

MIT License - 继承自 True-Resume 项目

