<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { withBase } from 'vitepress';
import type { NoteItem } from '../notes.data';

const props = defineProps<{ notes: NoteItem[] }>();

const active = ref('');

const tags = computed(() => {
  const map = new Map<string, number>();
  for (const note of props.notes) {
    for (const tag of note.tags) map.set(tag, (map.get(tag) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
});

const filtered = computed(() =>
  active.value ? props.notes.filter((note) => note.tags.includes(active.value)) : props.notes,
);

onMounted(() => {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  if (hash && props.notes.some((note) => note.tags.includes(hash))) active.value = hash;
});

function select(tag: string) {
  active.value = active.value === tag ? '' : tag;
  const url = active.value
    ? `${window.location.pathname}#${encodeURIComponent(active.value)}`
    : window.location.pathname;
  window.history.replaceState(null, '', url);
}
</script>

<template>
  <div class="cloud">
    <button
      v-for="[tag, count] in tags"
      :key="tag"
      type="button"
      class="chip"
      :class="{ on: active === tag }"
      @click="select(tag)"
    >
      #{{ tag }}
      <span class="count">{{ count }}</span>
    </button>
  </div>

  <p class="hint">
    {{ active ? `已筛选：#${active}` : `共 ${tags.length} 个标签，点击筛选。` }}
  </p>

  <ul class="list">
    <li v-for="note in filtered" :key="note.url" class="item">
      <div class="row">
        <time class="date" :datetime="note.date">{{ note.date }}</time>
        <a class="title" :href="withBase(note.url)">{{ note.title }}</a>
      </div>
      <p v-if="note.summary" class="summary">{{ note.summary }}</p>
    </li>
  </ul>
</template>

<style scoped>
.cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1.25rem 0 0.75rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.28rem 0.65rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: transparent;
  font-size: 13px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s;
}

.chip:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.chip.on {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.count {
  font-size: 11px;
  color: var(--vp-c-text-3);
}

.hint {
  margin: 0 0 1rem;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.item {
  padding: 0.7rem 0;
  border-bottom: 1px solid var(--vp-c-divider-light);
}

.item:last-child {
  border-bottom: none;
}

.row {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}

.date {
  flex: none;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.title {
  font-size: 15px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.title:hover {
  color: var(--vp-c-brand-1);
}

.summary {
  margin: 0.3rem 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
</style>
