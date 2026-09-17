# 按钮组件 (Button)

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

## 核心规范
- 默认不带图标，仅在有明确功能需求时添加图标
- 双字按钮：固定 56px 宽度
- 多字按钮：自适应宽度，左右内边距 16px
- 圆角：2px
- 禁止径向扩散阴影

## 按钮字号
- 字重：400
- 弹窗/抽屉/页面底部按钮栏：14px
- 其他场景：12px（默认）

## 按钮类型样式

### 主按钮 (Primary)
- 背景色：var(--color-blue)
- 文字颜色：var(--color-white)
- 边框：无
- 悬浮态背景色：var(--color-blue-l10)
- 点击态背景色：var(--color-blue-d10)

### 普通按钮 / 次按钮 (Default)
- 背景色：var(--color-white)
- 文字颜色：var(--color-graphite-d40)
- 边框色：var(--color-graphite-l20)
- 悬浮态边框色：var(--color-blue)，文字颜色变为 var(--color-blue)
- 点击态边框色：var(--color-blue-d10)，文字颜色变为 var(--color-blue-d10)

## 交互态规范
- 悬浮态：opacity 0.85
- 点击态：opacity 0.7
- 焦点态：清除焦点阴影

## 验收标准
- 双字按钮宽度固定 56px
- 主按钮和普通按钮颜色正确
- 弹窗/抽屉中按钮字号为 14px
- 点击时无径向扩散阴影
- 按钮字号：默认 12px，弹窗/抽屉中 14px
- 默认不带图标，除非明确要求添加图标
- 悬浮和点击态反馈正确
- 焦点态无阴影
