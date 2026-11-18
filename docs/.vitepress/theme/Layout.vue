<script setup lang="ts">
import DefaultTheme from 'vitepress/theme';
import NoteMeta from './NoteMeta.vue';

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #doc-before>
      <NoteMeta />
    </template>
  </Layout>
</template>
