import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';
import { toISODate } from './date';

/**
 * 主题的中文显示名。新增主题目录时，在这里加一行，否则侧边栏会直接显示目录名。
 * 侧边栏本身由构建时扫描目录生成，不需要手工维护笔记列表。
 */
const TOPIC_LABELS: Record<string, string> = {
  'web-architecture': '前端与架构',
  tooling: '工具链',
};

const configDir = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(configDir, '..');
const notesDir = path.join(docsDir, 'notes');

/**
 * GitHub Pages 的 base 必须是 `/` 或 `/xxx/` 形式。
 * Windows 的 Git Bash 会把 `BASE_PATH=/notes-site` 转换成磁盘路径，这里直接拒绝并回退。
 */
function normalizeBase(value: string) {
  if (!value.startsWith('/') || value.includes(':')) {
    console.warn(`[config] BASE_PATH 非法（${value}），已回退为 "/"。Git Bash 请加 MSYS_NO_PATHCONV=1 前缀。`);
    return '/';
  }
  return value.endsWith('/') ? value : `${value}/`;
}

const base = normalizeBase(process.env.BASE_PATH ?? '/');
const site = process.env.SITE_URL ?? 'http://localhost:5173';

/**
 * 中文分词。MiniSearch 默认按空格切词，一整句中文会变成一个词，导致搜不到。
 * 这里用 Intl.Segmenter 按词切分；VitePress 会把该函数序列化到客户端，
 * 保证索引端与查询端用的是同一套切法。
 * 注意：函数体必须自包含，不能引用外部变量。
 */
function tokenize(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('zh', { granularity: 'word' });
    return [...segmenter.segment(text)]
      .filter((part) => part.isWordLike)
      .map((part) => part.segment.toLowerCase());
  }
  return text
    .toLowerCase()
    .split(/[\s\p{P}]+/u)
    .filter(Boolean);
}

interface NoteLink {
  text: string;
  link: string;
}

function readTopicNotes(topic: string): NoteLink[] {
  const dir = path.join(notesDir, topic);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.md') && !file.startsWith('_'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { data } = matter(raw);
      const slug = file.replace(/\.md$/, '');
      return {
        text: String(data.title ?? slug),
        link: `/notes/${topic}/${slug}.html`,
        date: toISODate(data.date),
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(({ text, link }) => ({ text, link }));
}

/** 扫描 docs/notes 下的一级目录，生成按主题分组的侧边栏 */
function buildSidebar() {
  if (!fs.existsSync(notesDir)) return [];

  const topics = fs
    .readdirSync(notesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.'))
    .map((entry) => entry.name);

  const known = Object.keys(TOPIC_LABELS).filter((topic) => topics.includes(topic));
  const rest = topics.filter((topic) => !known.includes(topic));

  // 只放主题分组：每个一级条目结构一致，不会出现「唯一直链」比别的高一截
  return [
    ...[...known, ...rest].map((topic) => ({
      text: TOPIC_LABELS[topic] ?? topic,
      collapsed: false,
      items: readTopicNotes(topic),
    })),
  ];
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** VitePress 没有内置 RSS，这里在构建结束时按 frontmatter 生成一份 */
function collectFeedItems() {
  if (!fs.existsSync(notesDir)) return [];

  return fs
    .readdirSync(notesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.'))
    .flatMap((entry) =>
      fs
        .readdirSync(path.join(notesDir, entry.name))
        .filter((file) => file.endsWith('.md') && !file.startsWith('_'))
        .map((file) => {
          const { data } = matter(fs.readFileSync(path.join(notesDir, entry.name, file), 'utf8'));
          const slug = file.replace(/\.md$/, '');
          return {
            title: String(data.title ?? slug),
            date: toISODate(data.date),
            summary: String(data.summary ?? ''),
            url: `${site.replace(/\/$/, '')}${base}notes/${entry.name}/${slug}.html`,
          };
        }),
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

async function writeRss(outDir: string) {
  const items = collectFeedItems();
  const toDate = (value: string) => new Date(`${value}T00:00:00Z`).toUTCString();
  const lastBuild = items.length > 0 ? toDate(items[0].date) : new Date().toUTCString();
  const origin = site.replace(/\/$/, '');

  const entries = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.url}</link>
      <guid>${item.url}</guid>
      <pubDate>${toDate(item.date)}</pubDate>
      <description>${escapeXml(item.summary)}</description>
    </item>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>学习笔记</title>
    <link>${origin}${base}</link>
    <description>把对话沉淀成可检索的 Markdown 文档。</description>
    <language>zh-cn</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${origin}${base}rss.xml" rel="self" type="application/rss+xml" />
${entries}
  </channel>
</rss>
`;

  await fs.promises.writeFile(path.join(outDir, 'rss.xml'), xml, 'utf8');
}

export default withMermaid(
  defineConfig({
    lang: 'zh-CN',
    title: '学习笔记',
    description: '把对话沉淀成可检索的 Markdown 文档。',
    base,
    head: [
      ['link', { rel: 'alternate', type: 'application/rss+xml', title: '学习笔记', href: `${base}rss.xml` }],
      ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
    ],
    async buildEnd(siteConfig) {
      await writeRss(siteConfig.outDir);
    },
    sitemap: {
      hostname: site,
      // VitePress 生成 sitemap 时不会带上 base，子路径部署需要手动补
      transformItems: (items) =>
        items.map((item) => ({
          ...item,
          url: item.url.startsWith('http')
            ? item.url
            : `${base.replace(/\/$/, '')}/${item.url.replace(/^\//, '')}`,
        })),
    },

    // 草稿目录不参与构建，也不会进入搜索索引
    srcExclude: ['**/_drafts/**'],

    vite: {
      optimizeDeps: {
        /**
         * mermaid 依赖的 fastdom 是 CJS，开发模式下 Vite 不预构建它，
         * 会抛 "does not provide an export named 'default'"，导致整个页面白屏。
         * 生产构建由 Rollup 做 CJS 互操作，所以只有 dev 会坏——显式预构建即可。
         */
        include: ['fastdom', 'fastdom/extensions/fastdom-promised.js'],
      },
    },

    markdown: {
      math: true,
      theme: { light: 'github-light', dark: 'github-dark' },
    },

    themeConfig: {
      logo: {
        light: '/logo.svg',
        dark: '/logo-dark.svg',
        alt: 'strata',
      },
      topicLabels: TOPIC_LABELS,
      nav: [
        { text: '笔记', link: '/notes/' },
        { text: '归档', link: '/archive.html' },
        { text: '标签', link: '/tags.html' },
      ],
      sidebar: {
        '/notes/': buildSidebar(),
      },
      search: {
        provider: 'local',
        options: {
          translations: {
            button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
            modal: {
              displayDetails: '展开详情',
              resetButtonTitle: '清除查询',
              backButtonTitle: '返回',
              noResultsText: '没有找到相关内容',
              footer: {
                selectText: '选择',
                navigateText: '切换',
                closeText: '关闭',
              },
            },
          },
          miniSearch: {
            options: { tokenize },
            searchOptions: {
              prefix: true,
              fuzzy: 0.2,
              boost: { title: 4, text: 2, titles: 1 },
            },
          },
        },
      },
      outline: { level: [2, 3], label: '本页目录' },
      docFooter: { prev: '上一篇', next: '下一篇' },
      returnToTopLabel: '回到顶部',
      sidebarMenuLabel: '目录',
      darkModeSwitchLabel: '主题',
      lastUpdated: false,
      notFound: {
        title: '页面不存在',
        quote: '链接可能已经失效，或者笔记被重命名了。',
        linkLabel: '返回首页',
        linkText: '回到首页',
      },
      footer: {
        message: '用 Markdown 写成，由 VitePress 构建',
        copyright: '© 2026 学习笔记',
      },
    },
  }),
);
