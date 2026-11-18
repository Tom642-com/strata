<script setup lang="ts">
import { computed } from 'vue';
import { withBase } from 'vitepress';
import type { NoteItem } from '../notes.data';

const props = defineProps<{
  notes: NoteItem[];
  mode?: 'topic' | 'year';
  labels?: Record<string, string>;
}>();

const groups = computed(() => {
  const mode = props.mode ?? 'topic';
  const map = new Map<string, NoteItem[]>();

  for (const note of props.notes) {
    const key = mode === 'year' ? (note.date || '').slice(0, 4) : note.topic || '未分类';
    const list = map.get(key) ?? [];
    list.push(note);
    map.set(key, list);
  }

  const entries = [...map.entries()];
  if (mode === 'year') entries.sort((a, b) => (a[0] < b[0] ? 1 : -1));
  else entries.sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  return entries;
});

const labelOf = (key: string) => props.labels?.[key] ?? key;
</script>

<template>
  <section v-for="[key, items] in groups" :key="key" class="group">
    <h2 :id="key" class="group-title">
      {{ labelOf(key) }}
      <span class="count">{{ items.length }}</span>
    </h2>

    <ul class="list">
      <li v-for="note in items" :key="note.url" class="item">
        <div class="row">
          <time class="date" :datetime="note.date">{{ note.date }}</time>
          <a class="title" :href="withBase(note.url)">{{ note.title }}</a>
          <span v-if="!note.verified" class="badge">待核实</span>
        </div>
        <p v-if="note.summary" class="summary">{{ note.summary }}</p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.group {
  margin-bottom: 2.25rem;
}

.group-title {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin: 0 0 0.5rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 16px;
  font-weight: 600;
  border-top: none;
}

.count {
  font-size: 12px;
  font-weight: 400;
  color: var(--vp-c-text-3);
}

.list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.item {
  margin: 0;
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

.badge {
  padding: 0 0.3rem;
  border: 1px solid var(--vp-c-warning-1);
  border-radius: 4px;
  font-size: 11px;
  color: var(--vp-c-warning-1);
}

.summary {
  margin: 0.3rem 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
</style>
