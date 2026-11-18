# 学习笔记

用 Markdown 写笔记，构建成静态网站，部署在 GitHub Pages 上。
支持 Mermaid 图表、MathJax 公式、中文全文搜索、按主题分组的侧边栏与标签筛选。

![站点首页](./docs/screenshot.png)

## 本地运行

需要 Node.js 22 及以上。

```bash
npm install
npm run dev          # 打开 http://localhost:5173
```

## 写一篇笔记

**方式一：命令行创建骨架（推荐）**

```bash
npm run new -- --topic embedded --slug http-cache --title "HTTP 缓存的分层策略"
```

会在 `docs/notes/embedded/` 下生成 `2026-11-18-http-cache.md`，并自动出现在侧边栏。

**方式二：直接新建文件**

路径规则：`docs/notes/<主题>/<日期>-<英文短名>.md`。文件名用英文或拼音，标题写中文。
新增主题时，需要在 `docs/.vitepress/config.mts` 的 `TOPIC_LABELS` 里补一个中文名，否则侧边栏显示英文目录名。

| 字段 | 说明 |
| --- | --- |
| `title` | 中文标题，会渲染为页面 H1 |
| `date` | 写作日期，`YYYY-MM-DD`，必须与文件名前缀一致 |
| `topic` | 主题，必须与所在目录名一致 |
| `tags` | 标签数组，用于跨主题筛选 |
| `summary` | 20–200 字摘要，显示在列表页 |

**正文结构固定四段**：结论 → 推导 → 易错点 → 关联，且不要写一级标题（H1 由模板生成）。
完整规范见 [AGENTS.md](./AGENTS.md)，那份文件同时是给 AI 助手看的约束。

草稿放 `docs/notes/_drafts/`，该目录不会构建、不会进搜索索引。

## 部署

站点已部署在 **https://tom642-com.github.io/strata/**，仓库是 [Tom642-com/strata](https://github.com/Tom642-com/strata)。

每次 `git push` 到 `main`，GitHub Actions 会自动构建并发布，不需要手动操作。
仓库首次启用时，确认 **Settings → Pages → Source** 为 **GitHub Actions**（工作流会尝试自动启用）。

路径规则由工作流自动判断，换仓库名也不用改代码：

| 仓库名 | 访问地址 | base |
| --- | --- | --- |
| `strata`（任意名） | `https://<用户名>.github.io/strata/` | `/strata/` |
| `<用户名>.github.io` | `https://<用户名>.github.io/` | `/` |

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地开发，热更新 |
| `npm run check` | 校验 frontmatter：字段、日期、目录一致性 |
| `npm run build` | 校验 + 生产构建 |
| `npm run preview` | 预览构建产物 |
| `npm run new` | 创建笔记骨架 |
| `npm run format` | 用 Prettier 统一格式 |

## 目录结构

```
docs/
├── .vitepress/
│   ├── config.mts          # 站点配置、侧边栏生成、中文分词
│   ├── notes.data.ts       # 笔记数据源（列表/归档/标签共用）
│   ├── theme/              # 主题扩展与 CSS 变量
│   └── components/         # NoteIndex、TagFilter
├── notes/<主题>/<日期>-<短名>.md   # 笔记正文
├── notes/index.md          # 全部笔记
├── archive.md              # 按年份归档
├── tags.md                 # 标签筛选
└── index.md                # 首页
```

## 常见问题

**构建报 dead link**
站内链接写错了。必须用 `/notes/<主题>/<短名>.md` 这种绝对路径，不能用 `../`；链接目标不存在时构建会直接失败。

**侧边栏里某篇笔记不出现**
检查 frontmatter 的 `date` 是否有效、文件是否放在 `docs/notes/<主题>/` 下。侧边栏是构建时扫描目录生成的，不需要手工登记。

**搜索搜不到中文**
本地搜索的分词由 `config.mts` 里的 `tokenize` 函数提供，依赖浏览器与 Node 的 `Intl.Segmenter`。Node 22 与主流浏览器都支持；如果换到老版本环境，会退回按空格切分，中文检索会明显变差。

**公式或图表不渲染**
公式依赖 `markdown-it-mathjax3`（必须是 4.x），图表依赖 `vitepress-plugin-mermaid` + `mermaid` 11。升级依赖时不要动这两个版本，否则构建会报 peer 冲突。

**Windows 的 Git Bash 里构建后链接带盘符**
Git Bash 会转换以 `/` 开头的环境变量，加前缀即可：`MSYS_NO_PATHCONV=1 BASE_PATH=/strata npm run build`。

## 为什么是 VitePress

笔记站的核心需求是「结构化长文 + 稳定导航 + 全文搜索」，VitePress 的默认主题已经把这三点做完了：
导航、侧边栏、页内目录、搜索、暗色模式、代码高亮都是内置的，定制只需改几个 CSS 变量。

代价是灵活性：它本质上是文档框架，不适合做高度定制的营销页。如果哪天要做完全自定义的界面，
再引入组件库或工具类 CSS 更合适；在当前形态下叠加它们只会增加冲突面。
