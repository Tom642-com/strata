import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import Layout from './Layout.vue';

// 设计系统分层加载，顺序不可调整：令牌 → 基础 → 骨架 → 组件 → 响应式
import './styles/01-tokens.css';
import './styles/02-base.css';
import './styles/03-layout.css';
import './styles/04-components.css';
import './styles/05-responsive.css';

export default {
  extends: DefaultTheme,
  Layout,
} satisfies Theme;
