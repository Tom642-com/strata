<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
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

/* ---- 正文字号：小 / 中 / 大，写入 html[data-read-size] 并持久化 ---- */
type ReadSize = 'sm' | 'md' | 'lg';

const SIZE_OPTIONS: { value: ReadSize; label: string; title: string }[] = [
  { value: 'sm', label: '小', title: '小号正文' },
  { value: 'md', label: '中', title: '中号正文（默认）' },
  { value: 'lg', label: '大', title: '大号正文' },
];

const STORAGE_KEY = 'strata:read-size';

const readSize = ref<ReadSize>('md');

const apply = (value: ReadSize) => {
  document.documentElement.dataset.readSize = value;
};

const setReadSize = (value: ReadSize) => {
  readSize.value = value;
  apply(value);
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* 隐私模式下写入失败不影响当前阅读 */
  }
};

onMounted(() => {
  // 首屏由 head 里的内联脚本先行设置，这里只做状态同步
  const current = document.documentElement.dataset.readSize;
  if (current === 'sm' || current === 'md' || current === 'lg') readSize.value = current;
});
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
        <span class="note-tags">
          <span v-for="tag in tags" :key="tag" class="note-tag">#{{ tag }}</span>
        </span>
      </template>

      <div class="note-size" role="group" aria-label="正文字号">
        <button
          v-for="option in SIZE_OPTIONS"
          :key="option.value"
          type="button"
          class="note-size__btn"
          :class="{ 'is-active': readSize === option.value }"
          :aria-pressed="readSize === option.value"
          :title="option.title"
          @click="setReadSize(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </div>
</template>
