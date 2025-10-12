<div align="center" markdown="1">

<img alt="Reactive Resume" width="800" src="https://i.imgur.com/FFc4nyZ.jpg" />

![App Version](https://img.shields.io/github/package-json/version/AmruthPillai/Reactive-Resume?label=version)
[![Docker Pulls](https://img.shields.io/docker/pulls/amruthpillai/reactive-resume)](https://hub.docker.com/repository/docker/amruthpillai/reactive-resume)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/AmruthPillai)](https://github.com/sponsors/AmruthPillai)
[![Crowdin](https://badges.crowdin.net/reactive-resume/localized.svg)](https://crowdin.com/project/reactive-resume)
[![Discord](https://img.shields.io/discord/1173518977851473940?label=discord&link=https%3A%2F%2Fdiscord.gg%2FhzwkZbyvUW)](https://discord.gg/hzwkZbyvUW)

# Reactive Resume

一个免费的开源简历构建器，简化了创建、更新和分享简历的过程。

### [在线体验](https://rxresu.me/) | [文档](https://docs.rxresu.me/)

</div>

## 🚀 快速开始

### 前置要求

在开始之前，请确保您的系统已安装以下软件：

- **Node.js** (版本 ≥ 22.13.1)
- **pnpm** (推荐的包管理器)
- **Docker** 和 **Docker Compose** (用于运行依赖服务)

### 方式一：使用 Docker 开发环境（推荐）

这是最简单的启动方式，适合快速体验和开发。

1. **克隆项目**
   ```bash
   git clone https://github.com/AmruthPillai/Reactive-Resume.git
   cd Reactive-Resume
   ```

2. **启动依赖服务**
   ```bash
   # 启动 PostgreSQL、MinIO、Chrome 等依赖服务
   docker compose -f compose.dev.yml up -d
   ```

3. **安装依赖**
   ```bash
   pnpm install
   ```

4. **配置环境变量**
   
   创建 `.env` 文件并配置以下必要变量：
   ```bash
   # 数据库配置
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
   
   # 应用 URL
   PUBLIC_URL="http://localhost:5173"
   STORAGE_URL="http://localhost:9000/default"
   
   # 认证密钥（请使用强密码）
   ACCESS_TOKEN_SECRET="your-access-token-secret"
   REFRESH_TOKEN_SECRET="your-refresh-token-secret"
   
   # Chrome 浏览器服务
   CHROME_TOKEN="chrome_token"
   CHROME_URL="http://localhost:8080"
   
   # 存储配置 (MinIO)
   STORAGE_ENDPOINT="localhost"
   STORAGE_PORT=9000
   STORAGE_BUCKET="default"
   STORAGE_ACCESS_KEY="minioadmin"
   STORAGE_SECRET_KEY="minioadmin"
   ```

5. **初始化数据库**
   ```bash
   pnpm prisma:migrate:dev
   ```

6. **启动开发服务器**
   ```bash
   pnpm dev
   ```

7. **访问应用**
   - 前端应用：http://localhost:5173
   - 后端 API：http://localhost:3000
   - 数据库管理：http://localhost:5555 (Adminer)
   - MinIO 控制台：http://localhost:9001

### 方式二：本地开发环境

如果您希望完全控制开发环境，可以手动安装和配置所有服务。

1. **安装 PostgreSQL**
   - 创建数据库 `reactive_resume`
   - 确保服务运行在端口 5432

2. **安装 MinIO**
   - 下载并启动 MinIO 服务器
   - 创建存储桶 `default`

3. **安装 Chrome/Chromium**
   - 用于 PDF 生成和预览功能

4. **配置环境变量**（参考上面的 `.env` 配置）

5. **运行项目**
   ```bash
   pnpm install
   pnpm prisma:migrate:dev
   pnpm dev
   ```

### 常用命令

```bash
# 开发模式启动所有服务
pnpm dev

# 构建项目
pnpm build

# 启动生产环境
pnpm start

# 运行测试
pnpm test

# 代码格式化
pnpm format:fix

# 代码检查
pnpm lint:fix

# 数据库迁移
pnpm prisma:migrate:dev

# 生成 Prisma 客户端
pnpm prisma:generate
```

### 项目结构

```
├── apps/
│   ├── client/          # React 前端应用
│   ├── server/          # NestJS 后端应用
│   └── artboard/        # 简历设计工具
├── libs/                # 共享库
│   ├── dto/            # 数据传输对象
│   ├── schema/         # 数据模式定义
│   ├── ui/             # UI 组件库
│   └── utils/          # 工具函数
├── tools/
│   └── prisma/         # 数据库模式和迁移
└── compose.dev.yml     # 开发环境 Docker 配置
```

### 故障排除

**端口冲突**
- 前端默认端口：5173
- 后端默认端口：3000
- 数据库默认端口：5432
- MinIO 默认端口：9000

如果遇到端口冲突，请修改相应的配置文件或环境变量。

**数据库连接问题**
确保 PostgreSQL 服务正在运行，并且 `DATABASE_URL` 配置正确。

**依赖安装问题**
建议使用 `pnpm` 而不是 `npm` 或 `yarn`，因为项目配置了 `pnpm` 作为包管理器。

### 贡献指南

欢迎贡献代码！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细的贡献指南。

---

## 项目介绍

Reactive Resume 是一个免费的开源简历构建器，简化了创建、更新和分享简历的过程。我们不进行用户跟踪或投放广告，您的隐私是我们的首要考虑。该平台极其用户友好，如果您希望完全拥有自己的数据，可以在不到 30 秒内完成自托管部署。

平台支持多种语言，功能丰富，包括实时编辑、数十种模板、拖拽自定义以及与 OpenAI 集成来增强您的写作能力。

您可以与潜在雇主分享个性化的简历链接，跟踪查看或下载次数，并通过拖拽方式自定义页面布局。平台还支持各种字体选项，提供数十种模板供您选择。当然，还有暗色模式，为您提供更舒适的浏览体验。

立即开始使用 Reactive Resume 创建您的出色简历吧！

## 简历模板预览

| Azurill                                                      | Bronzor                                                     | Chikorita                                                   |
| ------------------------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------- |
| <img src="https://i.imgur.com/jKgo04C.jpeg" width="200px" /> | <img src="https://i.imgur.com/DFNQZP2.jpg" width="200px" /> | <img src="https://i.imgur.com/Dwv8Y7f.jpg" width="200px" /> |

| Ditto                                                       | Kakuna                                                      | Nosepass                                                    |
| ----------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| <img src="https://i.imgur.com/6c5lASL.jpg" width="200px" /> | <img src="https://i.imgur.com/268ML3t.jpg" width="200px" /> | <img src="https://i.imgur.com/npRLsPS.jpg" width="200px" /> |

| Onyx                                                        | Pikachu                                                     | Rhyhorn                                                     |
| ----------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| <img src="https://i.imgur.com/cxplXOW.jpg" width="200px" /> | <img src="https://i.imgur.com/Y9f7qsh.jpg" width="200px" /> | <img src="https://i.imgur.com/h4kQxy2.jpg" width="200px" /> |

## 主要特性

- **永久免费** 且开源
- 无遥测、用户跟踪或广告
- 您可以在不到 30 秒内自托管应用程序
- **支持多种语言** ([帮助添加/改进您的语言](https://translate.rxresu.me/))
- 使用您的邮箱地址（或临时邮箱，没问题）创建账户
- 您也可以使用 GitHub 或 Google 账户登录，甚至可以设置双因素认证以增强安全性
- 在单个账户下创建多份简历，根据每个职位描述优化每份简历，以获得更高的 ATS 评分
- **使用您自己的 OpenAI API 密钥** 解锁功能，如改进写作、修复拼写和语法或一键更改文本语调
- 使用 ChatGPT 将您的简历翻译成任何语言，并将其导入回来以便更轻松地编辑
- 轻松创建单页简历或跨多页的简历
- 自定义颜色和布局，为您的简历添加个人风格
- 只需拖放部分即可按您喜欢的方式自定义页面布局
- 如果现有部分不适合，可以创建特定于您行业的自定义部分
- 记录仅对您可见的简历特定个人笔记
- 锁定简历以防止进一步编辑（对主模板很有用）
- **数十种模板** 可供选择，从专业到现代风格
- 使用标准化的 EuroPass 设计模板设计您的简历
- 支持以 A4 或 Letter 页面格式打印简历
- 使用 [Google Fonts](https://fonts.google.com/) 上可用的任何字体设计您的简历
- **与公司或招聘人员分享您简历的个性化链接**，让他们获得最新更新
- 您可以跟踪您的公开简历收到的查看或下载次数
- 使用最先进的（目前）和可靠的技术构建，这些技术经过实战测试并由 GitHub 上的开源社区同行评审
- **MIT 许可证**，因此只要您注明原作者，您可以随意使用代码
- 当然，还有暗色模式 🌓

## 技术栈

- React (Vite) - 前端框架
- NestJS - 后端框架
- PostgreSQL - 主数据库
- Prisma ORM - 数据库操作层，让您可以通过少量代码更改轻松切换到任何其他关系数据库
- MinIO - 对象存储：用于存储头像、简历 PDF 和预览
- Browserless - 无头 Chrome，用于打印 PDF 和生成预览
- SMTP 服务器 - 用于发送密码恢复邮件
- GitHub/Google OAuth - 用于快速验证用户身份
- LinguiJS 和 Crowdin - 用于翻译管理和本地化

## 创建用户
```
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试用户",
    "email": "test@example.com", 
    "username": "testuser",
    "password": "yourpassword123"
  }'
```

## Star 历史

<a href="https://star-history.com/#AmruthPillai/Reactive-Resume&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=AmruthPillai/Reactive-Resume&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=AmruthPillai/Reactive-Resume&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=AmruthPillai/Reactive-Resume&type=Date" />
  </picture>
</a>

## 许可证

Reactive Resume 使用 [MIT 许可证](/LICENSE.md) 进行打包和分发，该许可证允许商业使用、分发、修改和私人使用，前提是软件的所有副本都包含相同的许可证和版权声明。

_由社区开发，为社区服务。_  
[Amruth Pillai](https://www.amruthpillai.com/) 的激情项目

<p>
  <a href="https://m.do.co/c/ceae1fff245e">
    <img src="https://opensource.nyc3.cdn.digitaloceanspaces.com/attribution/assets/PoweredByDO/DO_Powered_by_Badge_blue.svg" width="200px">
  </a>
</p>
