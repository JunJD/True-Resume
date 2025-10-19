# GraphAI 集成指南

本文档说明如何在 True-Resume monorepo 中使用 GraphAI（LangGraph.js）项目。

## 已完成的集成步骤

### 1. 项目结构已配置

- ✅ 创建了 `apps/graphai/project.json` - Nx 项目配置
- ✅ 更新了 `apps/graphai/tsconfig.json` - 继承 monorepo 的 TypeScript 配置
- ✅ 添加了 LangGraph 依赖到根 `package.json`
- ✅ 创建了 `.prettierrc` 和 `.prettierignore` 配置文件
- ✅ 创建了 `.env.example` 环境变量模板

### 2. 依赖已安装

已添加到 `package.json` 的依赖：

**运行时依赖：**
- `@langchain/core`: ^0.3.57
- `@langchain/langgraph`: ^0.3.0

**开发依赖：**
- `@eslint/eslintrc`: ^3.1.0
- `@eslint/js`: ^9.9.1
- `@tsconfig/recommended`: ^1.0.7
- `eslint-plugin-no-instanceof`: ^1.0.1

## 快速开始

### 1. 配置环境变量

GraphAI 使用根目录的 `.env` 文件（已在 `langgraph.json` 中配置）。

如果根目录还没有 `.env` 文件，请复制示例文件：

```bash
# 在项目根目录
cp .env.example .env
```

编辑根目录的 `.env` 文件，添加 AI 相关的 API 密钥（在文件末尾的 AI/LangGraph Configuration 部分）：

```env
# -- AI/LangGraph Configuration (for GraphAI module) --

# 如果要使用 LangSmith 追踪（可选）
LANGSMITH_API_KEY=your_key_here
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=true-resume-ai

# 如果要使用 OpenAI（可选）
OPENAI_API_KEY=your_key_here

# 如果要使用 Claude（可选）
ANTHROPIC_API_KEY=your_key_here
```

### 2. 启动开发服务器

使用 Nx 命令：

```bash
# 在项目根目录
nx serve graphai
```

或者直接使用 LangGraph CLI：

```bash
cd apps/graphai
npx @langchain/langgraph-cli dev
```

这将启动 LangGraph Studio，你可以在浏览器中查看和调试你的 AI 工作流。

### 3. 运行测试

```bash
# 单元测试
nx test graphai

# 集成测试
nx test:int graphai
```

### 4. 构建项目

```bash
nx build graphai
```

### 5. 代码检查

```bash
# Lint
nx lint graphai

# 格式化检查
nx format:check graphai

# 自动格式化
nx format graphai
```

## 可用的 Nx 命令

| 命令 | 说明 |
|------|------|
| `nx serve graphai` | 启动 LangGraph 开发服务器 |
| `nx build graphai` | 构建项目 |
| `nx test graphai` | 运行单元测试 |
| `nx test:int graphai` | 运行集成测试 |
| `nx lint graphai` | 运行代码检查 |
| `nx format graphai` | 格式化代码 |
| `nx format:check graphai` | 检查代码格式 |

## 项目结构

```
apps/graphai/
├── src/
│   └── agent/
│       ├── graph.ts       # 主工作流定义
│       └── state.ts       # 状态管理
├── tests/
│   ├── agent.test.ts      # 单元测试
│   └── graph.int.test.ts  # 集成测试
├── scripts/
│   └── checkLanggraphPaths.js
├── static/
│   └── studio.png
├── .editorconfig
├── .eslintrc.cjs
├── .gitignore
├── .prettierrc
├── .prettierignore
├── .env.example
├── jest.config.js
├── langgraph.json         # LangGraph 配置
├── LICENSE
├── package.json
├── project.json           # Nx 项目配置
├── README.md              # 英文说明
├── README_CN.md           # 中文说明
└── tsconfig.json
```

## 下一步：集成到 True-Resume

### 方案 1: REST API 集成

在 GraphAI 中调用 True-Resume 的后端 API：

```typescript
import axios from 'axios';

// 获取简历数据
const resume = await axios.get('http://localhost:3000/api/resume/:id');

// 使用 AI 分析和优化
const optimized = await analyzeResume(resume.data);

// 更新简历
await axios.put('http://localhost:3000/api/resume/:id', optimized);
```

### 方案 2: 共享库集成

直接导入 True-Resume 的共享库：

```typescript
import { ResumeDto } from '@reactive-resume/dto';
import { resumeSchema } from '@reactive-resume/schema';
import { parseResume } from '@reactive-resume/parser';

// 直接使用类型和工具
const resume: ResumeDto = { /* ... */ };
```

### 方案 3: 嵌入到后端

将 GraphAI 作为一个服务集成到 `apps/server` 中：

1. 在 `apps/server/src/ai/` 创建新模块
2. 导入 GraphAI 的工作流
3. 通过 NestJS 控制器暴露 API

## 开发 AI 功能的建议

### 1. 简历分析

创建一个节点来分析简历质量：

```typescript
const analyzeResume = async (state: State) => {
  const resume = state.resume;
  
  // 使用 LLM 分析
  const analysis = await model.invoke([
    { role: "system", content: "你是一个专业的简历分析师..." },
    { role: "user", content: `分析这份简历：${JSON.stringify(resume)}` }
  ]);
  
  return { analysis };
};
```

### 2. 简历优化

创建一个节点来提供优化建议：

```typescript
const optimizeResume = async (state: State) => {
  const { resume, jobDescription } = state;
  
  const optimized = await model.invoke([
    { role: "system", content: "根据职位描述优化简历..." },
    { role: "user", content: `简历：${resume}\n职位：${jobDescription}` }
  ]);
  
  return { optimizedResume: optimized };
};
```

### 3. 技能匹配

创建一个节点来匹配职位要求：

```typescript
const matchSkills = async (state: State) => {
  const { resume, jobDescription } = state;
  
  const matching = await model.invoke([
    { role: "system", content: "分析简历与职位的匹配度..." },
    { role: "user", content: `简历技能：${resume.skills}\n职位要求：${jobDescription}` }
  ]);
  
  return { matchingScore: matching };
};
```

## 调试和追踪

### 使用 LangSmith

1. 在 [LangSmith](https://smith.langchain.com/) 注册账号
2. 获取 API Key
3. 配置环境变量：

```env
LANGSMITH_API_KEY=your_key_here
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=true-resume-ai
```

4. 所有的 AI 调用将自动追踪到 LangSmith

### 使用 LangGraph Studio

运行 `nx serve graphai` 后：

1. 打开浏览器访问 Studio UI
2. 可视化查看工作流图
3. 逐步调试执行过程
4. 查看每个节点的输入输出
5. 修改状态并重新运行

## 常见问题

### Q: 如何添加新的 LLM 提供商？

A: 安装对应的集成包并修改代码：

```bash
# OpenAI
pnpm add @langchain/openai

# Anthropic
pnpm add @langchain/anthropic

# Google
pnpm add @langchain/google-genai
```

### Q: 如何连接到 True-Resume 的数据库？

A: 可以通过以下方式：

1. 导入 Prisma Client：
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

2. 或者通过 REST API 调用

### Q: 测试时需要真实的 API Key 吗？

A: 
- 单元测试（`nx test graphai`）不需要
- 集成测试（`nx test:int graphai`）需要真实的 API Key

### Q: 如何部署到生产环境？

A: 有几种选择：

1. **LangGraph Cloud**: 官方托管服务
2. **Docker**: 构建容器镜像部署
3. **集成到现有后端**: 作为 NestJS 模块运行

## 相关资源

- [LangGraph.js 文档](https://langchain-ai.github.io/langgraphjs/)
- [LangChain.js 文档](https://js.langchain.com/)
- [LangSmith](https://smith.langchain.com/)
- [LangGraph Studio](https://langchain-ai.github.io/langgraph/concepts/langgraph_studio/)
- [True-Resume 文档](../README.md)

## 获取帮助

- 查看 `apps/graphai/README.md` 和 `README_CN.md`
- 参考 LangGraph.js 官方文档
- 提交 Issue 到项目仓库

---

**集成完成！** 🎉

现在你可以开始开发 AI 功能了。建议从简单的简历分析功能开始，逐步添加更复杂的优化和生成功能。

