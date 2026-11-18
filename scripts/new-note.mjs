#!/usr/bin/env node
import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';

const USAGE = `
用法：
  npm run new -- --topic <主题> --slug <英文短名> --title "<中文标题>" [--date YYYY-MM-DD]

示例：
  npm run new -- --topic embedded --slug http-cache --title "HTTP 缓存的分层策略"
`;

const { values } = parseArgs({
  options: {
    topic: { type: 'string' },
    slug: { type: 'string' },
    title: { type: 'string' },
    date: { type: 'string' },
  },
});

const missing = ['topic', 'slug', 'title'].filter((key) => !values[key]);
if (missing.length > 0) {
  console.error(`缺少参数：${missing.map((key) => `--${key}`).join(', ')}\n${USAGE}`);
  process.exit(1);
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) {
  console.error('slug 只能包含小写字母、数字和连字符，例如 http-cache');
  process.exit(1);
}

const date = values.date ?? new Date().toISOString().slice(0, 10);
const dir = path.join('docs', 'notes', values.topic);
const file = path.join(dir, `${date}-${values.slug}.md`);

try {
  await access(file);
  console.error(`文件已存在，未覆盖：${file}`);
  process.exit(1);
} catch {
  // 不存在才继续
}

const template = `---
title: ${values.title}
date: ${date}
topic: ${values.topic}
tags: []
summary:
---

## 结论

## 推导

## 易错点

## 关联
`;

await mkdir(dir, { recursive: true });
await writeFile(file, template, 'utf8');

console.log(`已创建：${file}`);
console.log('提醒：summary 必填且不少于 20 字；新主题需在 docs/.vitepress/config.mts 的 TOPIC_LABELS 里补中文名。');
