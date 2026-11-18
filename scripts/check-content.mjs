#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';

/**
 * 内容契约检查。构建前运行，任何不合规的笔记都会让 CI 失败。
 * VitePress 本身不校验 frontmatter，这个脚本是唯一的内容防呆层。
 */

const notesDir = path.join(process.cwd(), 'docs', 'notes');

const schema = z.object({
  title: z.string().min(1, '不能为空').max(80, '不超过 80 字'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '格式必须是 YYYY-MM-DD'),
  topic: z.string().min(1, '不能为空'),
  tags: z.array(z.string()).default([]),
  summary: z
    .string()
    .min(20, '至少 20 字，列表页需要它')
    .max(200, '不超过 200 字'),
  verified: z.boolean().default(false),
});

const toISODate = (value) =>
  value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '').slice(0, 10);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) return [];
      return walk(full);
    }
    return entry.name.endsWith('.md') ? [full] : [];
  });
}

if (!fs.existsSync(notesDir)) {
  console.log('没有 docs/notes 目录，跳过内容检查。');
  process.exit(0);
}

const errors = [];
const files = walk(notesDir).filter((file) => path.basename(file) !== 'index.md');

for (const file of files) {
  const relative = path.relative(process.cwd(), file);
  const raw = fs.readFileSync(file, 'utf8');
  const { data } = matter(raw);

  const normalized = { ...data, date: toISODate(data.date) };
  const result = schema.safeParse(normalized);

  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(`${relative} → ${issue.path.join('.') || 'frontmatter'}：${issue.message}`);
    }
    continue;
  }

  const { topic, date } = result.data;
  const dirName = path.basename(path.dirname(file));
  const fileName = path.basename(file);

  if (topic !== dirName) {
    errors.push(`${relative} → topic 是 "${topic}"，但所在目录是 "${dirName}"，两者必须一致`);
  }

  const match = fileName.match(/^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/);
  if (!match) {
    errors.push(`${relative} → 文件名必须是 <YYYY-MM-DD>-<英文短名>.md`);
  } else if (match[1] !== date) {
    errors.push(`${relative} → 文件名日期 ${match[1]} 与 frontmatter 的 date（${date}）不一致`);
  }

  if ('draft' in data) {
    errors.push(`${relative} → 不再支持 draft 字段；未完成的笔记请放到 docs/notes/_drafts/`);
  }
}

if (errors.length > 0) {
  console.error(`\n内容检查失败，共 ${errors.length} 处：\n`);
  for (const message of errors) console.error(`  · ${message}`);
  console.error('\n修正后重试。不要为了通过检查而删除字段。\n');
  process.exit(1);
}

console.log(`内容检查通过：${files.length} 篇笔记。`);
