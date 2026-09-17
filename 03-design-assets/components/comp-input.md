# 输入框组件 (Input)

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
- 内边距：5px 12px
- 字重：400
- 圆角：2px
- 边框色：var(--color-graphite-l20)
- 背景色：var(--color-white)
- 文字颜色：var(--color-graphite-d40)
- 盒模型：border-box
- 禁止使用 `line-height: 32px` 作为文字垂直居中方案

### Placeholder 规范
- 适用控件：输入框、选择框、搜索框
- 字号：12px（与默认字体一致）
- 颜色：var(--color-graphite)

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
- 错误提示：字号 12px，颜色 var(--color-red-d10)，位置在输入框下方，间距 4px

## 交互态规范

### 悬浮态 (Hover)
- 边框色：var(--color-blue)

### 点击态 (Active)
- 边框色：var(--color-blue)

## 输入框类型

### 标准输入框
适用场景：普通文本输入，无需特殊图标或功能。

### 密码输入框
- 显示/隐藏密码图标颜色：var(--color-graphite)
- 图标 hover 颜色：var(--color-blue)
- 前缀/后缀图标与文字间距：8px
- 前缀/后缀图标颜色：var(--color-graphite)

### 文本域输入框
适用场景：多行文本输入。

- 字号：12px
- 行高：20px
- 内边距：6px 12px
- 最小高度：52px
- 圆角：2px
- 边框色：var(--color-graphite-l20)
- 文本域允许高度随内容或配置变化，但文字行高固定为 20px

### 前后置输入框
适用场景：输入框前后存在固定格式、协议、单位或可切换选项。

结构：`[前置区，可选] [输入区] [后置区，可选]`

支持三种形态：
1. 仅前缀，例如：`[https://] [输入框]`
2. 仅后缀，例如：`[24] [小时 v]`、`[10] [Mbps]`
3. 前置+后置同时存在，例如：`[https://] [输入框] [.com]`

前置区和后置区都支持两种类型：
1. 固定展示型：只展示文本，不显示下拉 icon
2. 可切换选择型：展示文本和下拉 icon，文字与 icon 间距 8px

视觉要求：
1. 组合控件整体高度为 32px
2. 整体圆角为 2px
3. 整体边框为 1px solid var(--color-graphite-l20)
4. 前置区、后置区背景色为灰阶一级背景色 var(--color-graphite-l50)
5. 前置区、后置区文字颜色为正文色 var(--color-graphite-d40)
6. 前置区、输入区、后置区必须贴合展示，中间不能有外部 gap
7. 区块之间只允许有 1px 内部分割线
8. 不允许出现双边框
9. 输入区最小宽度为 80px
10. 固定前置 / 后置最小宽度为 48px
11. 可切换前置 / 后置最小宽度为 64px
12. 前置 / 后置不可切换时，不显示下拉 icon
13. 前置 / 后置可切换时，显示下拉 icon
14. focus、error、disabled 状态作用于整体控件，不要让内部区块分别出现多层边框
15. 在句式配置项中使用时，该组合输入框作为一个整体片段参与排版，与前后文字间距为 8px

## 尺寸变体
| 尺寸 | 高度 | 字号 |
|-----|------|------|
| 小尺寸 (sm) | 24px | 12px |
| 默认尺寸 | 32px | 12px |
| 大尺寸 (lg) | 40px | 14px |

## 验收标准
- 输入框高度稳定为 32px（默认尺寸）
- 输入文字和 Placeholder 在输入框内垂直居中
- 输入文字和 Placeholder 不出现上下裁切
- 输入框不得通过 `line-height: 32px` 实现垂直居中
- 带前置/后置的输入框，外层容器高度为 32px，内部 input 高度和行高为 20px
- 激活态无蓝色外发光阴影
- 禁用状态视觉可区分
- 错误提示位置和颜色正确
- Placeholder 颜色和字号正确
- 可清除图标 hover 反馈正确
