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
  <div class="tag-cloud">
    <button
      v-for="[tag, count] in tags"
      :key="tag"
      type="button"
      class="tag-chip"
      :class="{ 'is-active': active === tag }"
      @click="select(tag)"
    >
      #{{ tag }}
      <span class="tag-chip__count">{{ count }}</span>
    </button>
  </div>

  <p class="tag-cloud__hint">
    {{ active ? `已筛选：#${active}` : `共 ${tags.length} 个标签，点击筛选。` }}
  </p>

  <ul class="entry-list">
    <li v-for="note in filtered" :key="note.url" class="entry-item">
      <div class="entry-row">
        <time class="entry-date" :datetime="note.date">{{ note.date }}</time>
        <a class="entry-name" :href="withBase(note.url)">{{ note.title }}</a>
      </div>
      <p v-if="note.summary" class="entry-summary">{{ note.summary }}</p>
    </li>
  </ul>
</template>

