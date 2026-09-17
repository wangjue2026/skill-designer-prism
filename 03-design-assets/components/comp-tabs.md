# 标签页组件 Tabs

## 1. 组件概述

用于在同一视图内切换不同内容区域。

## 2. 类型选择

Tabs 组件分为两种类型，适用于不同场景：

- **下划线式 (Underline)**：用于内容区域切换，强调当前激活的内容面板
- **分段式 (Segment)**：用于业务筛选或数据视图切换，提供重标签和轻量两种视觉风格

## 3. 下划线式标签页规范

### 3.1 文本字重与颜色

#### 选中态

| 规范项 | 规范值 |
|--------|--------|
| 字重 | 强制使用 **500** (Medium) |
| 颜色 | `var(--seer-blue)` #1C6EFF |

#### 未选中态

| 规范项 | 规范值 |
|--------|--------|
| 字重 | 使用 **400** (Regular) |
| 颜色 | 强制使用正文颜色 `var(--seer-graphite-d40)` #2F3540 |

**禁止行为**：严禁使用淡灰色或禁用色作为未选中态文字颜色。

### 3.2 下划线指示器

- 容器底部有 1px 分割线，颜色 var(--color-graphite-l30)
- 激活下划线高度固定 2px
- 激活下划线颜色 var(--seer-blue) / #1C6EFF
- 激活下划线位于当前激活 Tab 底部
- 激活下划线必须覆盖在容器底部分割线上，而不是悬浮在文字下方
- 激活下划线的底边必须与容器底部分割线重合
- 激活下划线不额外占用布局高度
- 激活下划线左上、右上圆角 2px，左下、右下直角
- 激活下划线宽度与当前 Tab 文字宽度保持一致
- 下划线宽度不允许跨多个 Tab
- 禁止使用 margin-top / border-bottom / 普通文档流元素实现激活下划线，应使用 absolute 定位到标题栏底部

## 4. 分段式标签页规范

### 4.1 通用规则

| 规范项 | 规范值 |
|--------|--------|
| 圆角 | 标签项背景及边框圆角强制设定为 **2px** |
| 图标 | 默认不带图标。仅在用户明确要求或使用 `#title` 插槽进行高保真定制时使用 |

### 4.2 重标签样式

适用于需要突出当前选中状态、强烈视觉反馈或作为页面主要操作入口的场景。

| 状态 | 文字颜色 | 背景颜色 | 边框颜色 |
|------|---------|---------|---------|
| 未选中 | `var(--seer-graphite-d40)` #2F3540 | `var(--seer-white)` #FFFFFF | `var(--seer-graphite-l20)` #D3D7DE |
| 选中 | `var(--seer-white)` #FFFFFF | `var(--seer-blue)` #1C6EFF | `var(--seer-blue)` #1C6EFF |
| 禁用 | `var(--seer-graphite-l10)` #C0C4CC | `var(--seer-graphite-l50)` #F7F8FA | `var(--seer-graphite-l30)` #DCDFE6 |
| Hover | `var(--seer-blue)` #1C6EFF | `var(--seer-blue-l50)` #E8F0FF | `var(--seer-blue-l20)` #B3CCFF |

### 4.3 轻量样式

适用于需要轻量视觉反馈、辅助性筛选切换或视图模式切换（列表/网格/树形）的场景。

| 状态 | 文字颜色 | 背景颜色 | 边框颜色 |
|------|---------|---------|---------|
| 未选中 | `var(--seer-graphite-d40)` #2F3540 | `var(--seer-white)` #FFFFFF | `var(--seer-graphite-l20)` #D3D7DE |
| 选中 | `var(--seer-blue)` #1C6EFF | `var(--seer-white)` #FFFFFF | `var(--seer-blue)` #1C6EFF |
| 禁用 | `var(--seer-graphite-l10)` #C0C4CC | `var(--seer-graphite-l50)` #F7F8FA | `var(--seer-graphite-l30)` #DCDFE6 |
| Hover | `var(--seer-blue-l10)` #458FFF | `var(--seer-white)` #FFFFFF | `var(--seer-blue-l10)` #458FFF |
