# 规范基座：高频 Tokens 与视觉规范速查手册 (Tokens Cheatsheet)

> 💡 **规范基座定位**：
> 本文档定义织雨体验设计智脑在指导 Coding AI 输出代码时**必须严格遵守的高频 Design Tokens**。
> 所有颜色、字号、间距、圆角与投影必须使用本规范中定义的标准值，禁止 AI 随意生成未经定义的随机色值与尺寸。
>
> 📚 **深入全量规范查阅**：
> - 完整全局原子规范库：[`global-styles/`](global-styles/)（包含 [色彩全量矩阵](global-styles/design-color.md)、[原子间距与网格](global-styles/design-atomic-spacing.md)、[排版字阶](global-styles/design-typography.md)、[24栅格布局](global-styles/layout-grid.md)）
> - 完整基础组件规范库：[`components/`](components/)（包含 20 个基础组件的像素级尺寸、交互态与验收标准）

---

## 一、 色彩系统速查 (Color Palette System)

### 1. 品牌主色阶 (Brand Colors)

| Token 变量名 | HEX 色值 | Tailwind / CSS 类 | 适用场景说明 |
| :--- | :--- | :--- | :--- |
| `--color-blue-l50` | `#E8F4FF` | `bg-[#E8F4FF]` | 品牌色极浅底色、选中项高亮底色、轻量 Badge 底色 |
| `--color-blue-l10` | `#4FA1FF` | `bg-[#4FA1FF]` / `text-[#4FA1FF]` | 主按钮悬浮态 (Hover)、次级链接悬浮 |
| **`--color-blue` (主色)** | **`#1C6EFF`** | **`bg-[#1C6EFF]` / `text-[#1C6EFF]`** | **主操作按钮、选中 Tab、激活高亮、主色链接、聚焦光圈** |
| `--color-blue-d10` | `#1458CC` | `bg-[#1458CC]` | 主按钮点击态 (Active / Pressed) |

---

### 2. 语义化状态色阶（深/浅/边框三元组规范）

> ⚠️ **织雨避坑铁律**：
> 严禁使用 `#FF0000` / `#00FF00` 等原生高饱和纯色！
> 状态展示必须遵循 **“浅底 (LightBg) + 深字 (DeepText) + 浅边框 (Border)”** 的柔和三元组规范。

| 业务状态 / 风险等级 | 语义深色 (Deep Text / Icon) | 浅色背景 (Light Bg) | 浅色边框 (Border) | 标准组件应用 Class 示例 |
| :--- | :--- | :--- | :--- | :--- |
| **正常 / 优 / 运行中 / 低危** | `#12A679` (或 `#52C41A`) | `#F6FFED` (或 `#E6F8F2`) | `#B7EB8F` | `bg-[#F6FFED] text-[#12A679] border-[#B7EB8F]` |
| **一般 / 关注 / 告警 / 中危** | `#FA721B` (或 `#FA8C16`) | `#FFFBE6` (或 `#FEFCE8`) | `#FFE58F` | `bg-[#FFFBE6] text-[#FA8C16] border-[#FFE58F]` |
| **差 / 异常 / 阻塞 / 高危 / 阻断** | `#D9363E` (或 `#F52727`) | `#FFF1F0` (或 `#FFF1F2`) | `#FFA39E` | `bg-[#FFF1F0] text-[#D9363E] border-[#FFA39E]` |
| **信息 / 提示 / 专有节点** | `#0BA7B5` (或 `#0EA5E9`) | `#E0F2FE` | `#BAE6FD` | `bg-[#E0F2FE] text-[#0BA7B5] border-[#BAE6FD]` |
| **未配置 / 禁用 / 离线 / 占位** | `#64748B` (或 `#8A92A1`) | `#F1F5F9` | `#E2E8F0` | `bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]` |

---

### 3. 石墨灰阶体系 (Graphite Grayscale)

| Token 变量名 | HEX 色值 | 适用场景说明 |
| :--- | :--- | :--- |
| `--color-graphite-l50` | `#F7F9FC` (或 `#F8FAFC`) | **页面底色 (Page Canvas Bg)**、只读输入框背景、斑马纹表格底色 |
| `--color-graphite-l40` | `#EDF1F7` (或 `#F1F5F9`) | **次级容器背景**、手风琴 Header 悬浮背景、展开区域底色 |
| `--color-graphite-l30` | `#E1E5EB` (或 `#E2E8F0`) | **容器外边框 (Card Border)**、模块间分割线 (Divider) |
| `--color-graphite-l20` | `#D3D7DE` (或 `#CBD5E1`) | **输入框/下拉框默认边框**、禁用态边框 |
| `--color-graphite-l10` | `#BEC3CC` | 次要图标默认色、禁用态文字 |
| `--color-graphite` | `#A1A7B3` (或 `#94A3B8`) | **输入框占位符 (Placeholder)**、图表网格线、图表 X/Y 轴文字 |
| `--color-graphite-d10` | `#6F7785` (或 `#64748B`) | **次级标签文本 (Label)**、表格表头文字、单位说明、Tooltip 辅助文字 |
| `--color-graphite-d30` | `#454C59` | **模块副标题**、次级按钮文字 |
| `--color-graphite-d40` | `#2F3540` (或 `#1E293B`) | **主标题、卡片主标题、表格正文主要内容** |
| `--color-graphite-d50` | `#1E232B` (或 `#0F172A`) | **极深背景 (Dark Shell Header / Dark Tooltip / Sider)** |

---

## 二、 字阶与排版体系 (Typography System)

### 1. 字体族定义 (Font Family Stack)
* **正文与标题通用**：`"Inter", "PingFang SC", "Helvetica Neue", Arial, sans-serif`
* **关键大指标数字专用 (Metrics & Numbers)**：`"Outfit", "DIN", "Roboto", sans-serif`（必须配置数字等宽 `font-variant-numeric: tabular-nums;`）
* **代码与技术标识专用 (IP, Domain, Timestamp)**：`"JetBrains Mono", "Menlo", "Courier New", monospace`

### 2. 标准字阶公式：`行高 = 字号 + 8px`
| 字阶分类 | 字号 (Font-size) | 行高 (Line-height) | 字重 (Font-weight) | 典型应用场景 |
| :--- | :--- | :--- | :--- | :--- |
| **Micro (极小)** | `10px` / `11px` | `16px` / `18px` | Regular / Medium | 胶囊 Tag 状态、基线辅助说明、时间微标 |
| **Caption (次要)** | `12px` | `20px` | Regular / Medium | 表格正文、表单 Label、输入框占位符、小标题 |
| **Body (主要正文)** | `13px` / `14px` | `22px` | Regular / Medium | 标准表格数据行、弹窗描述、正文内容 |
| **Subhead (小标题)** | `16px` | `24px` | Semibold (600) | 卡片 Header 标题、步骤条标题、抽屉主标题 |
| **Section (模块大标题)** | `18px` / `20px` | `28px` | Bold (700) | 页面一级标题、抽屉大标题 |
| **Metric LG (中大指标)** | `24px` | `32px` | Bold / `font-outfit` | 顶部 4 联概览卡片主指标数值 |
| **Metric XL (主看板特大指标)**| `28px` / `32px` | `36px` / `40px` | Bold / `font-outfit` | 核心大屏/驾驶舱核心 KPI 数值 |

---

## 三、 空间与栅格规范 (Spacing & Grid System)

### 1. 8px / 4px 网格基准
* **`8px` (1x)**：`gap-2`, `p-2` —— 按钮内边距、紧凑表单行间距、紧凑工具栏；
* **`12px` (1.5x)**：`gap-3`, `p-3` —— 卡片内子模块间隔、表格单元格纵向内边距；
* **`16px` (2x)**：`gap-4`, `p-4` —— **标准卡片默认 padding、多卡片之间的标准网格间距**；
* **`24px` (3x)**：`gap-6`, `p-6` —— 大模块纵向间隔、页面外层边距、抽屉内边距。

### 2. 容器高度标准
* **紧凑型控件 (Compact Control)**：高度统一为 `32px` (`h-8`)；
* **标准表单控件 (Default Control)**：高度统一为 `36px` (`h-9`)；
* **页面顶栏/菜单 (Header)**：高度统一为 `56px` (`h-14`)；
* **侧边栏导航 (Sidebar)**：宽度固定为 `240px` (`w-60`)。

---

## 四、 圆角与投影层级 (Radius & Elevation)
* **`2px` (紧凑控件)**：`rounded-[2px]` —— 按钮、输入框、下拉框、Tab、小 Tag；
* **`4px` / `6px` (内容容器)**：`rounded-sm` / `rounded-md` —— 内容卡片（Card）、看板容器；
* **`8px` (顶层浮层)**：`rounded-lg` —— 模态弹窗（Modal）、通知 Toast、右侧抽屉（Drawer）；
* **`9999px` (全圆角胶囊)**：`rounded-full` —— 状态指示圆点、同环比上升下降胶囊。

```css
/* 基础轻量投影 (S1) - 普通卡片与 Hover 微悬浮 */
--seer-dropshadow-s1: 0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px 0 rgba(15, 23, 42, 0.04);
/* 中度卡片投影 (S2) - 下拉菜单、Popover 气泡 */
--seer-dropshadow-s2: 0 4px 16px 0 rgba(30, 35, 43, 0.12);
/* 深度浮层投影 (S3) - 全局弹窗 Modal、右侧滑动抽屉 Drawer */
--seer-dropshadow-s3: 0 12px 32px 0 rgba(15, 23, 42, 0.18);
```
