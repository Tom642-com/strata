import { createContentLoader } from 'vitepress';
import { toISODate } from './date';

export interface NoteItem {
  url: string;
  title: string;
  date: string;
  topic: string;
  tags: string[];
  summary: string;
  verified: boolean;
}

declare const data: NoteItem[];
export { data };

/**
 * 全站笔记的唯一数据源。列表页、归档页、标签页都从这里取数，
 * 新增 Markdown 文件后无需改动任何代码。
 */
export default createContentLoader('notes/**/*.md', {
  excerpt: false,
  transform(raw): NoteItem[] {
    return raw
      // 目录首页（/notes/）本身不是笔记
      .filter(({ url }) => !url.endsWith('/'))
      .map(({ url, frontmatter }) => ({
        url,
        title: String(frontmatter.title ?? ''),
        date: toISODate(frontmatter.date),
        topic: String(frontmatter.topic ?? ''),
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : [],
        summary: String(frontmatter.summary ?? ''),
        verified: frontmatter.verified !== false,
      }))
      .filter((note) => note.title && note.date)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  },
});
