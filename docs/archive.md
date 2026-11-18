---
title: 归档
sidebar: false
aside: false
prev: false
next: false
---

<script setup>
import NoteIndex from './.vitepress/components/NoteIndex.vue'
import { data } from './.vitepress/notes.data'
</script>

# 归档

按年份倒序排列，共 {{ data.length }} 篇。

<NoteIndex :notes="data" mode="year" />
