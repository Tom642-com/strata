---
title: 标签
sidebar: false
aside: false
---

<script setup>
import TagFilter from './.vitepress/components/TagFilter.vue'
import { data } from './.vitepress/notes.data'
</script>

# 标签

主题是骨架，标签是横切维度。同一个概念可能出现在多个主题里，用标签把它们串起来。

<TagFilter :notes="data" />
