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
  <section v-for="[key, items] in groups" :key="key" class="note-group">
    <h2 :id="key" class="note-group__title">
      {{ labelOf(key) }}
      <span class="note-group__count">{{ items.length }}</span>
    </h2>

    <ul class="entry-list">
      <li v-for="note in items" :key="note.url" class="entry-item">
        <div class="entry-row">
          <time class="entry-date" :datetime="note.date">{{ note.date }}</time>
          <a class="entry-name" :href="withBase(note.url)">{{ note.title }}</a>
        </div>
        <p v-if="note.summary" class="entry-summary">{{ note.summary }}</p>
      </li>
    </ul>
  </section>
</template>

