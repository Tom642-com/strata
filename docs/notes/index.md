---
title: 全部笔记
aside: false
---

<script setup>
import NoteIndex from '../.vitepress/components/NoteIndex.vue'
import { data } from '../.vitepress/notes.data'
import { useData } from 'vitepress'

const { theme } = useData()
</script>

# 全部笔记

按主题分组，共 {{ data.length }} 篇。侧边栏里也是同一份结构。

<NoteIndex :notes="data" mode="topic" :labels="theme.topicLabels" />
