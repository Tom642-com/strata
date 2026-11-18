<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';

const { frontmatter, theme } = useData();

const isNote = computed(() => Boolean(frontmatter.value.date && frontmatter.value.topic));

const date = computed(() => {
  const value = frontmatter.value.date;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? '').slice(0, 10);
});

const topic = computed(() => String(frontmatter.value.topic ?? ''));

const topicLabel = computed(() => {
  const labels = (theme.value as { topicLabels?: Record<string, string> }).topicLabels ?? {};
  return labels[topic.value] ?? topic.value;
});

const tags = computed<string[]>(() =>
  Array.isArray(frontmatter.value.tags) ? frontmatter.value.tags.map(String) : [],
);

const verified = computed(() => frontmatter.value.verified !== false);
</script>

<template>
  <div v-if="isNote" class="note-head">
    <h1 class="note-title">{{ frontmatter.title }}</h1>
    <div class="note-meta">
      <time :datetime="date">{{ date }}</time>
      <span class="sep" aria-hidden="true">·</span>
      <span>{{ topicLabel }}</span>
      <template v-if="tags.length">
        <span class="sep" aria-hidden="true">·</span>
        <span class="tags">
          <span v-for="tag in tags" :key="tag" class="tag">#{{ tag }}</span>
        </span>
      </template>
      <span v-if="!verified" class="badge" title="AI 初稿，尚未人工确认">待核实</span>
    </div>
  </div>
</template>

<style scoped>
/*
 * 笔记正文从 ## 开始，一级标题由 frontmatter 提供。
 * VitePress 默认不会把 frontmatter.title 渲染成标题，所以在这里补上。
 */
.note-head {
  margin-bottom: 2rem;
}

.note-title {
  margin: 0 0 0.75rem;
  border-top: none;
  padding-top: 0;
  font-size: 2rem;
  line-height: 1.3;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
}

.note-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.sep {
  color: var(--vp-c-divider);
}

.tags {
  display: inline-flex;
  gap: 0.5rem;
}

.tag {
  color: var(--vp-c-text-2);
}

.badge {
  margin-left: 0.25rem;
  padding: 0.1rem 0.4rem;
  border: 1px solid var(--vp-c-warning-1);
  border-radius: 4px;
  color: var(--vp-c-warning-1);
  font-size: 12px;
  line-height: 1.5;
}
</style>
