# 基础搜索框组件 (Basic Search)

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

## 视觉规范

### 默认状态
- 高度：32px
- 字号：12px
- 文字行高：20px
- 输入区内边距：5px 12px
- 字重：400
- 圆角：2px
- 边框色：var(--color-graphite-l20)
- 背景色：var(--color-white)
- 文字颜色：var(--color-graphite-d40)
- 默认提示文案：搜索
- 禁止使用 `line-height: 32px` 作为文字垂直居中方案

### Placeholder 规范
- 字号：12px（与默认字体一致）
- 颜色：var(--color-graphite) #A1A7B3
- 文字左边距：12px
- 垂直居中对齐

### 搜索图标规范
- 位置：右侧搜索图标区域
- 搜索图标区域宽度：32px
- 搜索图标在区域内水平、垂直居中
- 图标颜色：var(--color-graphite)
- 基础搜索框不使用蓝色按钮背景，默认保持白色背景和灰色边框

### 关闭图标规范
- 出现时机：输入搜索内容后显示
- 位置：搜索图标左侧
- 与搜索图标间距：4px
- 垂直居中对齐
- 图标颜色：var(--color-graphite)
- 关闭图标 hover 颜色：var(--color-blue)

### 激活/选中状态 (Focus)
- 边框色：var(--color-blue)
- 焦点阴影：严禁使用蓝色外发光阴影

### 禁用状态 (Disabled)
- 背景色：var(--color-graphite-l30)
- 边框色：var(--color-graphite-l20)
- 文字颜色：var(--color-graphite)
- 光标：not-allowed

### 错误状态
- 边框色：var(--color-red-d10)
- 错误提示：字号 12px，颜色 var(--color-red-d10)，位置在搜索框下方，间距 4px

## 交互态规范

### 悬浮态 (Hover)
- 边框色：var(--color-blue)

### 点击态 (Active)
- 边框色：var(--color-blue)

### 清空内容
- 点击关闭图标清空搜索框内的内容
- 清空后关闭图标消失
- 清空后显示默认提示文案"搜索"

## 验收标准
- 搜索框高度稳定为 32px
- 输入文字和 Placeholder 在搜索框内垂直居中
- 输入文字和 Placeholder 不出现上下裁切
- 搜索框不得通过 `line-height: 32px` 实现垂直居中
- 激活态无蓝色外发光阴影
- 禁用状态视觉可区分
- 错误提示位置和颜色正确
- Placeholder 颜色和字号正确
- 默认提示文案为"搜索"
- 搜索图标右对齐，右间距为 6px
- 关闭图标在搜索图标左侧，间距为 4px
- 关闭图标 hover 颜色正确
- 点击关闭图标能清空搜索框内容
- 清空后关闭图标消失
