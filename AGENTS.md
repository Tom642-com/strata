# AGENTS.md

> 本文件是给**生成代码与笔记的模型**看的项目约定，不是给人看的介绍。
> 修改项目结构、技术栈或内容规范时，必须同步更新本文件。

## 项目定位

个人学习笔记站。内容由对话沉淀而来，代码由模型编写，人类只做小范围手改。
因此所有约定都服务于一个目标：**让没有人工逐行审阅的代码库保持可验证、可接管。**

## 技术栈（固定，不要替换）

| 层 | 技术 | 版本约束 |
| --- | --- | --- |
| 框架 | VitePress | 1.6.x，默认主题 |
| 样式 | 默认主题 + 设计令牌 | 定制写在 `docs/.vitepress/theme/styles/`，规范见 `DESIGN.md` |
| 图表 | vitepress-plugin-mermaid | 配套 **mermaid 11**，不能升到 12 |
| 公式 | markdown-it-mathjax3 | 4.x，构建时渲染为内联 SVG |
| 搜索 | VitePress 本地搜索 | 自定义 `Intl.Segmenter` 中文分词 |
| 校验 | zod + gray-matter | `scripts/check-content.mjs` |

### 硬性禁止

1. **禁止引入 Tailwind 或其他 CSS 框架**。默认主题已经覆盖导航、侧边栏、正文排版；叠加工具类会与主题的预检样式冲突。需要改视觉时，改 `styles/01-tokens.css` 里的令牌。
2. **禁止把 mermaid 升到 12**。`vitepress-plugin-mermaid` 的 peer 依赖是 `10 || 11`，升级会导致构建期的依赖冲突。
3. **禁止在内容中使用相对链接**（如 `../xxx.md`）。VitePress 的相对链接按文件位置解析，移动文件就会断。统一用站内绝对路径：
   `/notes/<topic>/<slug>.md`（构建时自动转成 `.html` 并补上 base）。
4. **禁止在 `config.mts` 中写死域名或 base**。两者由 CI 通过 `SITE_URL` / `BASE_PATH` 注入。
5. **禁止在 `docs/notes/` 下放草稿**。未完成的笔记放 `docs/notes/_drafts/`，该目录被 `srcExclude` 排除，不会构建、不会被搜索索引。
6. **禁止删除或改写 `check-content.mjs` 的校验规则来「让构建通过」**。校验失败说明内容有问题，应改内容。
7. **禁止在 `.vue` 组件里写 `<style>`，禁止在样式文件里写裸数值**。所有视觉规则见 `DESIGN.md`：
   颜色/字号/间距只能来自 `theme/styles/01-tokens.css` 的令牌，组件类名统一登记在 `DESIGN.md` 第 6 节。

## 目录结构

```
docs/
├── .vitepress/
│   ├── config.mts          # 站点配置、侧边栏生成、中文分词
│   ├── notes.data.ts       # 笔记数据源（列表/归档/标签共用）
│   ├── theme/              # 主题扩展：Layout、NoteMeta、index.ts
│   │   └── styles/         # 设计系统 5 层：令牌/基础/骨架/组件/响应式
│   └── components/         # NoteIndex、TagFilter（只含模板与逻辑，无样式）
├── notes/<topic>/<date>-<slug>.md   # 笔记正文，唯一的内容来源
├── notes/index.md          # 全部笔记（按主题分组）
├── archive.md              # 按年份归档
├── tags.md                 # 标签筛选
└── index.md                # 首页
```

## 新增一篇笔记

### 路径与命名

- 路径：`docs/notes/<topic>/<YYYY-MM-DD>-<english-slug>.md`
- `<topic>`：已有主题优先复用；新增主题时，**必须同步在 `config.mts` 的 `TOPIC_LABELS` 里加中文名**，否则侧边栏会显示英文目录名。
- 文件名：小写英文或拼音，连字符分隔；**文件名前缀日期必须与 frontmatter 的 `date` 一致**（校验会检查）。
- 侧边栏由构建时扫描目录自动生成，不需要手工登记。

### frontmatter 字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | string | 是 | 中文标题，≤ 80 字；会渲染为页面 H1 |
| `date` | string | 是 | `YYYY-MM-DD`，与文件名前缀一致 |
| `topic` | string | 是 | 必须与所在目录名一致 |
| `tags` | string[] | 否 | 复用已有标签，全站控制在 50 个以内 |
| `summary` | string | 是 | 20–200 字，显示在列表页 |

### 正文结构（固定四段）

```markdown
## 结论      —— 先给答案，三行以内
## 推导      —— 为什么是这样，关键权衡与反例
## 易错点    —— 实际踩过的坑，每条一句话说清
## 关联      —— 指向已有笔记的绝对链接
```

**正文不要写一级标题**（不要写 `# xxx`）。H1 由 `NoteMeta.vue` 从 frontmatter 渲染，重复写会出现两个标题。

不足四段时可以省略，但**顺序不能变**，且「结论」必须有。

## 写作规范

- **链接**：`[标题](/notes/<topic>/<slug>.md)`，不要写 `.html`，不要写 `../`。
- **标题层级**：正文从 `##` 开始。
- **术语**：首次出现时给出一句定义；同一概念全站只用一种叫法。
- **篇幅**：单篇 400–1500 字。超过应拆成多篇，用「关联」串起来。

## 图表与公式

### Mermaid

用围栏代码块，不加任何属性：

````markdown
```mermaid
flowchart LR
  A["输入"] --> B["处理"]
```
````

- 节点文字含空格、标点或中文括号时必须加双引号：`A["笔记 .md"]`。
- 单图节点数 ≤ 15。超过说明这张图该拆，或改用表格描述。
- 图表在浏览器端渲染，页面会多加载一个约 500KB 的脚本（仅在含图的页面加载）。

### 公式

- 行内：`$O(n \log n)$`
- 块级：`$$` 单独成行包裹
- 构建时渲染为内联 SVG，不产生运行时请求。

### 代码块

必须标注语言。未标注不会高亮。

### 图片

- 与 Markdown 同目录，命名 `<slug>-<序号>.png`
- 单图 ≤ 500KB，宽度 ≤ 1600px
- 引用用相对路径 `![](./xxx.png)`

## 验证（每次改完必须执行）

```bash
npm run check    # frontmatter 校验：字段、日期、目录一致性
npm run build    # 构建；死链、语法错误都会让构建失败
```

两条都通过才算完成。**构建失败时不要删除内容或关闭检查来「修复」，应先读报错定位。**

## 交付流程（改完必须给出本地链接）

改完任何东西，都要在回复里给出**可点击的本地地址**，供人工审核后再提交：

1. 先确认开发服务器在运行（`npm run dev -- --host 127.0.0.1`，默认 `http://127.0.0.1:5173/`）；没运行就启动，并把端口告诉人类。
2. 给出**受影响的具体页面 URL**，例如 `http://127.0.0.1:5173/notes/embedded/2026-11-18-embedded-roadmap.html`，不要只说「刷新看看」。
3. 改动涉及多个页面时，逐条列出对应的链接。
4. 人类确认之后才 `git commit` / `git push`，不要自行推送。

## 视觉规范

视觉与排版的完整规范见 **[DESIGN.md](./DESIGN.md)**，包含令牌表、组件类名表、命名规则、已知陷阱与验收清单。
改动任何样式前必须先读该文件；新增组件或令牌后同步更新它。样式文件分层固定在：

```
theme/styles/01-tokens.css  →  02-base.css  →  03-layout.css  →  04-components.css  →  05-responsive.css
```

顺序即层叠顺序，不可调整；新增样式必须归入对应层，不允许新建游离文件。

## 提交规范

- 一次提交只做一件事：新增笔记 / 修改配置 / 升级依赖 分开提交。
- 提交信息：`note: 新增 <标题>` / `feat: <改动>` / `fix: <修复>` / `chore: <杂项>`
- 不要提交 `docs/.vitepress/dist`、`docs/.vitepress/cache`、`node_modules`。
