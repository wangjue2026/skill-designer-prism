# Layout & Grid（布局、栅格、间距）

> **何时使用本 skill**：页面骨架、列布局、表单两列/三列、卡片墙、详情页 + 侧栏、控制台 dashboard。

## 1. 布局原语（按粒度从大到小）

| 组件 | 用途 | 关键 props |
|---|---|---|
| `<a-layout>` | **页面级**容器（顶栏 + 侧栏 + 内容 + 页脚） | `fixed`, `floatSider` |
| `<a-layout-header>` | 顶栏 | — |
| `<a-layout-sider>` | 侧栏 | `collapsed`, `collapsible`, `theme: 'light' \| 'dark'`, `width`, `collapsedWidth` |
| `<a-layout-content>` | 主内容区 | — |
| `<a-layout-footer>` | 页脚 | — |
| `<a-row>` + `<a-col>` | **24 列栅格**（区块/表单分列） | row: `align`, `justify`, `gutter`, `wrap` |
| `<a-space>` | **同向元素均匀间距**（按钮组、tag 列） | `direction`, `size`, `align`, `justify`, `wrap`, `vertical` |
| `<a-divider>` | 分隔线 | `dashed`, `plain`, `labelPlacement` |

### Pro 版本的页面骨架

`<a-layout>` —— 把 a-layout 的 5 个原语 + a-menu 全套打包。直接给数据驱动：

```vue
<template>
  <a-layout
    :menus="menus"
    :logo="{ src: '/logo.svg', text: 'SASE 设计规范' }"
    :theme="{ header: 'dark', sider: 'light' }"
    type="both"
    :fixed="true"
    v-model:collapsed="collapsed"
    v-model:active-key="activeKey"
  >
    <RouterView />
  </a-layout>
</template>
```

ProLayout 的 `type` 决定形态：`'both'`（顶栏+侧栏）/ `'header'`（仅顶栏）/ `'sider'`（仅侧栏） / `'mixin'`（混合菜单）。

## 2. Grid 系统（24 列）

### 2.1 Row props

```ts
align: 'start' | 'center' | 'end' | 'baseline' | 'stretch'   // align-items
justify: 'start' | 'center' | 'end' | 'space-around' | 'space-between'
gutter: number | string | [horizontal, vertical] | { xs?, sm?, md?, lg?, xl? }
wrap: boolean   // 默认 true
```

### 2.2 Col props

```ts
flex: number | string                  // flex 简写
span: number | string                  // 1–24
order: number | string
offset: number | string
push: number | string
pull: number | string
xs / sm / md / lg / xl: number | string | ColBreakpointConfig
```

`ColBreakpointConfig`（响应式断点级配置）：
```ts
{ span?, order?, offset?, push?, pull? }
```

### 2.3 Gutter 推荐值（与间距 token 对齐）

| 场景 | gutter | 等价 token |
|---|---|---|
| 紧凑列表（侧栏内） | `8` | `paddingSizeSm` |
| 表单两列 | `[24, 16]` | `paddingSizeXl, paddingSizeLg` |
| 卡片墙 | `[16, 16]` | `paddingSizeLg` |
| Dashboard 区块 | `[24, 24]` | `paddingSizeXl` |
| 大屏宽松 | `[32, 24]` | `paddingSize2Xl, paddingSizeXl` |

### 2.4 响应式 col 例

```vue
<a-row :gutter="[16, 16]">
  <a-col :xs="24" :sm="12" :md="8" :lg="6" :xl="4">A</a-col>
  <a-col :xs="24" :sm="12" :md="8" :lg="6" :xl="4">B</a-col>
  <!-- ... -->
</a-row>
```

> 24 列分布建议：1 / 2 / 3 / 4 / 6 / 8 / 12 / 24 = 24 / 12 / 8 / 6 / 4 / 3 / 2 / 1 列。优先用整除值。

## 3. 间距系统（Spacing Tokens）

来自 `getDerivedSizeTokens.ts`，base = 8：

| Token | 计算 | 值 (px) | 典型用途 |
|---|---|---|---|
| `paddingSize2Xs` / `marginSize2Xs` | ⌈base × 0.25⌉ | `2` | 极小间距，icon 与文字间 |
| `paddingSizeXs` / `marginSizeXs` | ⌈base × 0.5⌉ | `4` | tag 内 padding、紧凑表格 |
| `paddingSizeSm` / `marginSizeSm` | base | `8` | 按钮内 padding、列表项垂直 padding |
| `paddingSizeMd` / `marginSizeMd` | ⌈base × 1.5⌉ | `12` | 卡片内 padding（小卡）、modal 内 |
| `paddingSizeLg` / `marginSizeLg` | ⌈base × 2⌉ | `16` | 卡片标准 padding |
| `paddingSizeXl` / `marginSizeXl` | base × 3 | `24` | 模块间距、modal 标准 padding |
| `paddingSize2Xl` / `marginSize2Xl` | ⌈base × 4⌉ | `32` | 区段间距 |

### 3.1 a-space 默认值

```ts
size: 8         // 8px gap
wrap: true      // 自动换行
direction: 'horizontal'
align: 'center'
```

### 3.2 间距速查表

```
2  → 内部细节（icon ↔ 文字）
4  → 极紧凑（tag 内、紧凑表格行）
8  → 标准内间距、列表项
12 → 卡片内（默认 a-card size=sm）
16 → 卡片间、表单行间
24 → 模块间、modal 内边、表单行间（宽松）
32 → 区段间、页面分块
```

## 4. 高度系统（Control Heights）

来自 `getDerivedSizeTokens.ts`，base = 32：

| Token | 倍率 | 值 (px) | 典型控件 |
|---|---|---|---|
| `heightXs` | × 0.5 | `16` | 极小 chip、紧凑 badge |
| `heightSm` | × 0.75 | `24` | 紧凑表格行、小按钮 |
| `heightMd` | × 1 | **`32`** | **默认按钮、输入框、select** |
| `heightLg` | × 1.25 | `40` | 大按钮、强调输入框 |
| `heightXl` | × 1.5 | `48` | 顶部搜索框、modal 标题栏 |
| `height2xl` | × 1.75 | `56` | 卡片头 |
| `height3xl` | × 2 | `64` | 页面顶栏 |

## 5. Container / 最大宽度

SASE 设计规范 **没有**全局 container max-width 限制（中后台一般铺满）。如果需要：

```css
.page-container {
  max-width: 1440px;       /* 自定，常见 1280/1440/1600 */
  margin-inline: auto;
  padding-inline: padding-size-xl;  /* 24px */
}
```

或随断点：

```css
@media (min-width: 1720px) {  /* screenXl */
  .page-container { padding-inline: 48px; }
}
```

## 6. 常见页面骨架蓝图

### 6.1 Landing / 详情阅读页

```
┌─────────────────────────────────────────┐
│  a-layoutHeader (height3xl=64)           │
├─────────────────────────────────────────┤
│  a-layoutContent                         │
│  ┌───────────────────────────────────┐   │
│  │  Page Title (fontSize2xl, 600)    │   │
│  │  Breadcrumb (fontSizeSm)          │   │
│  ├───────────────────────────────────┤   │
│  │  Body                             │   │
│  │  paddingSizeXl (24px) all around  │   │
│  └───────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  a-layoutFooter                          │
└─────────────────────────────────────────┘
```

### 6.2 Dashboard

```
┌──────────┬───────────────────────────────┐
│          │  a-layoutHeader (64)          │
│          ├───────────────────────────────┤
│ Sider    │  Page Title                   │
│ (240w)   │  ┌─────────┬─────────┬──────┐ │
│ collapsed│  │ stat    │ stat    │ stat │ │
│ → 80w    │  │ card    │ card    │ card │ │
│          │  └─────────┴─────────┴──────┘ │
│          │  Row gutter=[24,24]           │
│          │  ┌──────────────┬───────────┐ │
│          │  │ Chart card   │ Chart card│ │
│          │  └──────────────┴───────────┘ │
│          │  ┌─────────────────────────┐  │
│          │  │ Pro Table               │  │
│          │  └─────────────────────────┘  │
└──────────┴───────────────────────────────┘
```

实现：
```vue
<a-layout type="sider" :menus="menus" v-model:collapsed="collapsed">
  <div class="page">
    <h1>仪表盘</h1>
    <a-row :gutter="[24, 24]">
      <a-col :xs="24" :sm="12" :md="8" v-for="s in stats" :key="s.id">
        <a-card size="sm">
          <a-statistic :title="s.title" :value="s.value" />
        </a-card>
      </a-col>
    </a-row>
    <a-row :gutter="[24, 24]" style="margin-top: 24px;">
      <a-col :span="12"><ChartA/></a-col>
      <a-col :span="12"><ChartB/></a-col>
    </a-row>
    <a-table :columns="columns" :data-source="rows" />
  </div>
</a-layout>
```

### 6.3 表单页（两列）

```
┌────────────────────────────────────────┐
│ Page Title                             │
│  ┌──────────────────────────────────┐  │
│  │ a-form (size=md, layout=h)    │  │
│  │ Row gutter=[24,16]               │  │
│  │ ┌──────────────┬───────────────┐ │  │
│  │ │ Form.Item    │ Form.Item     │ │  │
│  │ │ label 8/24   │ label 8/24    │ │  │
│  │ │ wrap 16/24   │ wrap 16/24    │ │  │
│  │ └──────────────┴───────────────┘ │  │
│  │ ┌──────────────────────────────┐ │  │
│  │ │ Full-width Form.Item :span=24│ │  │
│  │ └──────────────────────────────┘ │  │
│  │     [取消]  [提交]               │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

```vue
<a-form :control="form" layout="horizontal" :label-col="{ span: 8 }" :control-col="{ span: 16 }">
  <a-row :gutter="[24, 16]">
    <a-col :span="12"><a-formItem label="名称"><a-input/></a-formItem></a-col>
    <a-col :span="12"><a-formItem label="状态"><a-select/></a-formItem></a-col>
    <a-col :span="24"><a-formItem label="描述"><a-textarea :auto-rows="{minRows:3,maxRows:6}"/></a-formItem></a-col>
  </a-row>
  <a-space style="margin-top: 24px; justify-content: flex-end;">
    <a-button>取消</a-button>
    <a-button mode="primary" type="submit">提交</a-button>
  </a-space>
</a-form>
```

### 6.4 列表 / 表格管理页

```
┌────────────────────────────────────────┐
│ Page Title           [新建]            │
│ ┌────────────────────────────────────┐ │
│ │ ProSearch（筛选条件） + [搜索]     │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ ProTable                           │ │
│ │ - toolbar: [批量删除][导出][刷新]  │ │
│ │ - layoutTool（列设置）             │ │
│ │ - 表头 + sticky                    │ │
│ │ - 数据行                           │ │
│ │ - 分页 bottomEnd                   │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

### 6.5 详情页（左主右辅）

```
┌────────┬─────────────────────────────┐
│        │ Header（标题 + 操作）       │
│ Tabs   ├─────────────────────────────┤
│ 侧导航 │  a-row gutter=[24,24]       │
│        │  ┌────────────┬──────────┐  │
│        │  │ 主信息卡片 │ 元数据   │  │
│        │  │  span=16   │ span=8   │  │
│        │  └────────────┴──────────┘  │
│        │  ┌────────────────────────┐ │
│        │  │ Tabs（详情/日志/配置） │ │
│        │  └────────────────────────┘ │
└────────┴─────────────────────────────┘
```

## 7. Sider 行为

`<a-layout-sider>` 默认值：

| Prop | 默认 |
|---|---|
| `width` | 240 |
| `collapsedWidth` | 80 |
| `theme` | `'light'` |
| `breakpoint` | undefined（自动响应可设 `'md'` 等） |
| `collapsible` | undefined |

> **窄屏自动折叠**：在 `<a-layout-sider>` 上设 `breakpoint="md"`，浏览器宽 < 960px 自动折叠。

## 8. Header / Footer

```css
.sase-layout-header {
  height: height-3xl;   /* 64px */
  padding-inline: padding-size-xl;  /* 24px */
  background: bg-inverse;     /* 默认深色顶栏 */
  color: text-inverse;
}

.sase-layout-footer {
  padding: padding-size-md) var(--sase-padding-size-xl;  /* 12px 24px */
  background: container-bg;
  color: text-info;
  text-align: center;
}
```

## 9. 易错点

| ❌ 错 | ✅ 对 |
|---|---|
| `padding: 20px` | 用 `padding-size-xl)` (24px 或最近档 |
| 自己 flex 写一行按钮组 | 用 `<a-space>` |
| 用 grid template-columns | SASE 设计规范 的 Row/Col 是 flex，统一 24 列 |
| 直接 `<aside>` + 写 sticky | 用 `<a-layout-sider>` |
| `gap: 10px` | 不在 token 表内，要么 8 要么 12 |
| 顶栏高度 60px | 用 `height3xl` (64) |
| `width: 250px` 侧栏 | 用 a-layoutSider 默认 240 或扩 token |

## 10. SeerDesign 原子规范补充

当输出 SeerDesign 高保真视觉稿时,以下规则优先作为验收标准:

| 类别 | 强制规则 |
|---|---|
| 圆角 | 全局组件圆角 2px；表格自身无圆角 |
| 常规边框 | #D3D7DE / graphite-l20 |
| 激活/选中边框 | #1C6EFF / blue |
| 下拉/浮层投影 | dropshadow-s2: 0 4px 16px rgba(30,35,43,0.14) |
| Focus | 禁止蓝色外发光阴影,不使用默认 glow |
| 可点击元素 | hover 时 cursor 必须为 pointer |
| Placeholder | 输入框、选择框、搜索框均为 12px / graphite (#A1A7B3) |

### 间距层级

| 层级 | 值 | 用途 |
|---|---|---|
| XS | 4px | 图标与文字、小组件内部 |
| S | 8px | 默认间距、组件间、表单项 |
| M | 12px | 单元格左右间距、按钮组内部 |
| L | 16px | 表单 label 间距、区块内分组 |
| XL | 24px | 模块间、大区块间距 |
| XXL | 32px | 页面级大间距 |

默认组件间距为 8px,按钮之间 8px,按钮组与相邻元素 16px,表格单元格左右 12px。标题与下方内容间距 16px,标题与上方内容间距 8px。
