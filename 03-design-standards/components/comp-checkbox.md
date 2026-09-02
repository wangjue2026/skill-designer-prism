# 复选框组件 (Checkbox)

## 使用声明

本规范只定义组件的视觉结构、布局关系、交互行为和验收标准，不提供具体框架代码实现。

生成代码时，必须以当前项目的技术栈 Skill 为准。

如果本规范与项目技术栈约束发生冲突，优先遵守项目技术栈约束。

本规范禁止包含：
- React / Vue / Angular 代码示例
- JSX / TSX
- TypeScript 示例
- import 语句
- className
- React state 写法
- 具体图标组件名
- 具体组件库 API

本规范中的组件名称仅表示设计语义，不代表必须使用某个框架或组件库的同名组件。

本组件遵循 [全局原子规范与间距规范](../global-styles/design-atomic-spacing.md) 中的设计原则。

## 基础复选框

### 未选中状态 (Unchecked)
- 尺寸：固定 16px x 16px
- 圆角：2px
- 边框色：var(--color-graphite-l20)（不遵循全局原子规范）
- 背景色：var(--color-white)

### 半选状态 (Indeterminate)
- 边框线：无边框线
- 背景色：var(--color-blue)
- 中间图标：8px x 2px 白色长条，垂直居中

### 已选状态 (Checked)
- 边框线：无边框线
- 背景色：var(--color-blue)
- 中间图标：白色勾图标，上下左右居中对齐

### 复选框 + 文字形式
- 复选框和文字间距：4px
- 文字颜色：var(--color-graphite-d40)
- 文字字号：12px

### 禁用状态 (Disabled)

#### 未选禁用
- 背景色：var(--color-graphite-l30)
- 边框色：var(--color-graphite-l20)（不遵循全局原子规范）
- 文字颜色：var(--color-graphite)

#### 已选禁用
- 背景色：var(--color-graphite-l30)
- 文字颜色：var(--color-graphite)
- 中间勾图标颜色：var(--color-graphite-d10)

#### 半选禁用
- 背景色：var(--color-graphite-l30)
- 中间白色长条颜色：var(--color-graphite-d10)

## 按钮样式复选框

### 基础样式
- 高度：32px
- 圆角：2px
- 边框色：未选中 var(--color-graphite-l20)，已选中 var(--color-blue)
- 背景色：未选中 var(--color-white)，已选中 var(--color-blue)
- 文字颜色：未选中 var(--color-graphite-d40)，已选中 var(--color-white)
- 按钮和文字间距：8px
- 按钮图标颜色：未选中 var(--color-graphite-d20)，已选中 var(--color-white)

### 三角色块位置
- 位置：按钮内右上角
- 尺寸：8px x 8px
- 颜色：var(--color-blue)
- 形状：直角三角形

### 禁用状态
- 背景色：var(--color-graphite-l40)
- 边框色：var(--color-graphite-l20)
- 文字颜色：var(--color-graphite-d10)
- 圆角：2px
- 禁用状态隐藏选中标识三角色块

### 按钮样式交互态

#### 悬浮态 (Hover)
- 未选中悬浮：边框色变为 var(--color-blue)，背景色透明
- 已选中悬浮：边框色变深 var(--color-blue-d10)

#### 点击态 (Active)
- 未选中点击：边框色变深 var(--color-blue-d10)，背景色 var(--color-blue-l50)
- 已选中点击：边框色变深 var(--color-blue-d10)，背景色 var(--color-blue-l50)

## 复选框组布局
- 使用换行布局
- 行间距：8px
- 列间距：16px

## 验收标准
- 复选框尺寸固定 16px x 16px
- 已选和半选状态无边框线
- 半选状态白色长条垂直居中
- 按钮样式选中态三角色块显示在右上角
- 禁用状态隐藏三角色块
- 复选框组换行布局间距正确
- 悬浮和点击态颜色反馈正确
- 清除焦点阴影
