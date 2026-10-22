---
name: device-multi-selector-basic
description: 设备多选-基础版组件技能，包含穿梭框式设备选择弹窗的完整规范（分组树+设备表格+已选区），支持按分组批量选择、关键词搜索、主备设备联动选择。适用于安全管控类B端产品。
---

# Skill: 设备多选-基础版 (Device Multi-Selector Basic)

## 概述

设备多选-基础版是一个**穿梭框式**的设备选择组件，适用于安全管控类 B 端产品中需要多选设备的场景。它以弹窗形式呈现，左侧为"待选区"（分组树 + 设备表格），右侧为"已选区"（已选列表），支持按分组批量选择、关键词搜索、主备设备联动选择。

## 使用方式

在任意 AI 工具中，用户可以如下方式调用此 Skill：

> "在 xxx 位置，应用下面的 skill，制作一个设备多选-基础版的配置项"

AI 工具应根据本文档完整还原该组件的布局、样式、交互逻辑。

### 默认产出要求

AI 工具使用此 Skill 时，**默认**应在页面上创建一个配置项，结构如下：

1. **配置项标题**：「选择设备」（字号 12px，字重 400，颜色 #6F7785，左对齐）
2. **配置框**：一个 32px 高的输入框样式容器，内含：
   - 未选择时：显示 placeholder「请选择」（颜色 #A1A7B3）
   - 已选择时：输入框内部直接展示具体已选摘要文本（由分组名或设备名逗号分隔组成），超出截断。不使用蓝色已选数量标签，下方也不产生额外灰色摘要面板。
   - 右侧：列表图标（List icon，颜色 #6F7785）
   - 边框：#D3D7DE，hover 时 #1C6EFF
3. **点击配置框**：弹出设备多选弹窗
4. **弹窗确认后**：输入框内部直接展示具体已选摘要文本，超出截断。下方不产生额外容器。


---

## 1. 组件整体结构

### 1.1 触发器（Trigger）

在页面中，以**输入框+标签**的形式呈现，点击后弹出选择弹窗。

```
[标签文字]  [输入框: 显示已选内容 / "请选择"  |  列表图标]
```

**布局规范**：
- 标签与输入框水平排列，间距 `gap: 16px`
- 标签文字：12px/400，颜色 `#6F7785`
- 输入框：高度 32px，宽度由父容器决定（建议 400px），内边距 `padding: 0 12px`
- 边框：1px solid `#D3D7DE`，圆角 2px
- 悬浮态：边框色变为 `#1C6EFF`
- 占位文字："请选择"，颜色 `#A1A7B3`（SeerDesign Placeholder 色），字号 12px
- 选中后文字：显示已选摘要，颜色 `#2F3540`，超出截断
- 右侧图标：列表图标（List），颜色 `#6F7785`，悬浮时变 `#1C6EFF`
- 输入框内：左侧为选中文字（flex-1 min-w-0 truncate），右侧为图标（shrink-0 ml-8px）

**选中后显示逻辑**：
- 显示分组名 + 设备名
- 总数 ≤ 3 项时，全部展示，逗号分隔：`上海, sh-device-2, gz-device-3`
- 总数 > 3 项时：`上海, sh-device-2, gz-device-3...等N项`

### 1.2 弹窗（Modal/Dialog）

弹窗尺寸：**宽 1200px，高 640px**

弹窗分为三部分（从上到下）：
1. **标题栏**：48px 高
2. **主体区**：flex-1（自适应），内含待选区和已选区
3. **底栏**：56px 高

---

## 2. 标题栏

**高度**：48px，水平内边距 16px

**左侧**：标题"选择设备"，16px/600，颜色 `#2F3540`

**右侧**：关闭按钮（X 图标），24×24px 容器，图标 16px，颜色 `#6F7785`，悬浮背景 `#EDF1F7`

---

## 3. 主体区 - 双栏布局

主体区采用 Flex 水平布局：待选区（flex-1） + 间距 4px + 已选区（340px 固定宽度）

外层水平内边距 16px

### 3.1 待选区（左侧）

外框：1px solid `#D3D7DE`，圆角 2px，overflow hidden

#### 3.1.1 待选标题栏

- 高度 40px，水平内边距 12px
- 文字："待选"，12px/600，颜色 `#2F3540`
- **背景必须为白色**（`bg-white`），禁止出现灰色底色

#### 3.1.2 搜索区域

在标题栏下方，水平内边距 12px，底部内边距 12px

**基础版搜索框**：
- 宽度 100%，高度 32px
- 左内边距 12px，右内边距 36px（放搜索图标）
- 边框：1px solid `#D3D7DE`，圆角 2px
- 聚焦边框：`#1C6EFF`，无 shadow
- 占位文字："搜索设备名称/分组"，颜色 `#A1A7B3`（SeerDesign 规范 Placeholder 色），字号 12px
- 输入文字：颜色 `#2F3540`，字号 12px
- 搜索图标：16px，位于右侧，垂直居中，颜色 `#A1A7B3`

#### 3.1.3 内容区（左树 + 右表）

搜索区下方，1px top border `#E1E5EB`，Flex 水平布局

##### 3.1.3.1 左侧分组树面板

- 宽度 260px，右边界 1px border `#E1E5EB`
- 可滚动（ScrollArea）
- 上下内边距 4px

**树节点规范（SeerDesign 树选择规范）**：

| 属性 | 值 |
|------|------|
| 节点高度 | 32px |
| 字号 | 12px |
| 字重 | 400（常规） |
| 字色 | `#2F3540`（常规）/ `#1C6EFF`（active 态） |
| 行高 | 20px |
| 展开/收起按钮 | **必须使用 +/- 方形按钮**（严禁使用 ChevronDown/ChevronRight 箭头！），16×16px，1px border `#D3D7DE`，圆角 2px；子节点背景白色，根节点背景 `#F7F9FC`；展开时显示"-"图标，收起时显示"+"图标；这是本组件的特有设计，不同于常见树组件的箭头样式 |
| 连接线 | 1px 实线，颜色 `#E1E5EB` |
| 选中态背景 | `#E8F4FF` |
| 选中态左竖条 | 2px 宽，颜色 `#1C6EFF`，absolute left-0 top-0 bottom-0 |
| 悬浮态背景 | `#F7F9FC` |
| 复选框 | 16×16px，圆角 2px，未选边框 `#D3D7DE`，背景白色；选中态背景 `#1C6EFF`，勾选色白色。注意：基础版不支持半选(indeterminate)态，仅显示选/未选两种状态 |
| 文件夹图标 | 16×16px 黄色实心文件夹（代码中已内置 FolderIcon 内联 SVG），左间距 4px |
| +/- 图标 | 线宽 1.5px，颜色 `#454C59`，round linecap；"+" 为横竖两条线，"-" 为一条横线 |
| 叶节点连接点 | 4×4px 圆点，颜色 `#E1E5EB` |
| 节点内间距 | 水平内边距 8px（左8px右8px） |

**树连线布局参数**：
- 基础偏移(BASE_OFFSET)：12px
- 切换按钮区(SWITCHER_W)：20px（仅根节点有此区域）
- 复选框宽(CHECKBOX_W)：16px
- +/- 按钮尺寸(BUTTON_SIZE)：16px
- 水平连线长度(H_BRANCH)：8px
- 根节点竖线X = BASE_OFFSET + SWITCHER_W + CHECKBOX_W/2 = 40px
- 每层缩进(INDENT) = BUTTON_SIZE/2 + H_BRANCH + CHECKBOX_W/2 = 24px
- depth0 竖线X=40, depth1=64, depth2=88

**树连线完整绘制规则**（非根节点才画连线）：

1. **祖先层垂直连线**：对于每个祖先层级 i（0 到 depth-2），如果该层祖先的父节点还有后续子节点（不是最后一个子节点），则画一条从上到下贯穿整个节点高度的垂直线：
   - 位置：`left: ROOT_LINE_X + i * INDENT`，`top: 0, bottom: 0`
   - 样式：`width: 1px, background: #E1E5EB`
   - 如果该层祖先是其父节点的最后一个子节点，则**不画**该层垂直连线

2. **当前层从父级延伸下来的竖线**：
   - 位置：`left: ROOT_LINE_X + (depth - 1) * INDENT`
   - 从 `top: 0` 开始
   - 如果当前节点是最后一个子节点：竖线到 `bottom: 50%`（只到中间）
   - 如果当前节点不是最后一个子节点：竖线到 `bottom: 0`（贯穿到底）
   - 样式：`width: 1px, background: #E1E5EB`

3. **+/- 按钮放在竖线上**（覆盖竖线的交汇点）：
   - 如果节点有子节点：放置 +/- 按钮（**严禁使用箭头图标！必须使用方形+/-按钮**）
     - 位置：`left: ROOT_LINE_X + (depth-1)*INDENT - BUTTON_SIZE/2`，`top: 50%`，`transform: translateY(-50%)`
     - 尺寸：16×16px
     - 样式：1px border `#D3D7DE`，圆角 2px，背景白色，z-index: 1（覆盖竖线）
     - 内容：展开时显示 `-` 图标，收起时显示 `+` 图标
     - +/- 图标：线宽 1.5px，颜色 `#454C59`，round linecap
     - 悬浮态：背景 `#F7F9FC`
   - 如果节点是叶子节点（无子节点）：在竖线上放置 4×4px 圆点
     - 位置：`left: ROOT_LINE_X + (depth-1)*INDENT - 2`，`top: 50%`，`transform: translateY(-50%)`
     - 样式：4×4px，圆角 full，背景 `#E1E5EB`，z-index: 1

4. **水平连线**（从箭头/圆点右边缘到复选框）：
   - 位置：`left: ROOT_LINE_X + (depth-1)*INDENT + 7`，`top: 50%`
   - 宽度：`H_BRANCH`（8px）
   - 样式：`height: 1px, background: #E1E5EB`

5. **根节点特殊处理**：根节点不画任何连线，有独立的 switcher 区域（20px 宽），内含 +/- 按钮（样式与子节点相同，16×16px，背景 `#F7F9FC`）

**关键：连线层级关系**——竖线是底层，+/- 按钮或圆点覆盖在竖线上方（z-index: 1），水平连线在最上层连接到复选框。**复选框及节点内容区域必须设置 `position: relative; z-index: 3`**，确保不会被连线遮挡，用户可以正常点击勾选。

**树节点内容定位计算**：
- 根节点（depth=0）：`padding-left: BASE_OFFSET`（12px），内含 switcher 区域（20px）+ 复选框（16px）
- 非根节点（depth≥1）：`padding-left: ownLineX - CHECKBOX_W/2`，其中 `ownLineX = ROOT_LINE_X + depth * INDENT`
  - depth=1: padding-left = 64 - 8 = 56px
  - depth=2: padding-left = 88 - 8 = 80px
- 复选框居左排列，复选框中心对齐 ownLineX 位置
- **重要**：节点内容区域（含复选框、图标、文字）需要设置 `position: relative; z-index: 3` 确保在树连线上方可点击

**树节点渲染模板**（每个节点的 DOM 结构）：
```html
<div class="tree-node" style="height:32px; position:relative; display:flex; align-items:center; padding-left:{contentPadLeft}px">
  <!-- 步骤1: 祖先层垂直连线 (非根节点, depth≥2 才有) -->
  <!-- 对每个祖先层级 i (0 到 depth-2): -->
  <div style="position:absolute; left:{ROOT_LINE_X + i*INDENT}px; top:0; bottom:0; width:1px; background:#E1E5EB" />
  
  <!-- 步骤2: 当前层从父级延伸下来的竖线 (非根节点, depth≥1) -->
  <div style="position:absolute; left:{ROOT_LINE_X + (depth-1)*INDENT}px; top:0; bottom:{isLast ? '50%' : '0'}; width:1px; background:#E1E5EB" />
  
  <!-- 步骤3: +/- 按钮 (覆盖在竖线上) -->
  <!-- 有子节点时: -->
  <button style="position:absolute; left:{ROOT_LINE_X + (depth-1)*INDENT - 8}px; top:50%; transform:translateY(-50%); width:16px; height:16px; border:1px solid #D3D7DE; border-radius:2px; background:white; z-index:2; display:flex; align-items:center; justify-content:center">
    {expanded ? <minusIcon/> : <plusIcon/>}
  </button>
  <!-- 叶节点时: -->
  <div style="position:absolute; left:{ROOT_LINE_X + (depth-1)*INDENT - 2}px; top:50%; transform:translateY(-50%); width:4px; height:4px; border-radius:50%; background:#E1E5EB; z-index:2" />
  
  <!-- 步骤4: 水平连线 (非根节点, depth≥1) -->
  <div style="position:absolute; left:{ROOT_LINE_X + (depth-1)*INDENT + 8}px; top:50%; width:8px; height:1px; background:#E1E5EB" />
  
  <!-- 根节点特有: switcher 区域 -->
  {depth === 0 && <div style="width:20px; display:flex; align-items:center; justify-content:center"><button>+/-</button></div>}
  
  <!-- 内容区域 (必须设置 z-index 确保可点击) -->
  <div style="position:relative; z-index:3; display:flex; align-items:center; gap:4px; flex:1; min-width:0">
    <Checkbox />
    <FolderIcon /> {/* 16×16px 黄色文件夹 */}
    <span>{node.name}</span>
  </div>
</div>
```

**树交互逻辑**：
1. 点击节点 → 激活/取消激活该分组（用于筛选表格），不影响选中状态
2. 勾选复选框 → 选中/取消该分组（含所有子组设备）
3. 点击 +/- 按钮 → 展开/收起子节点
4. 父级分组被选中 → 子分组禁用（opacity:0.4, pointer-events:none），复选框 disabled，悬浮提示"该对象所属的父级已被选中，无需单独选择"
5. 搜索时 → 自动过滤树节点，只显示匹配设备所属的分组及其祖先路径，自动展开匹配节点

**分组数据结构**：
```typescript
interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  isLeaf?: boolean;
}
```

**默认分组树（示例数据）**：
```
/
├── 未分类
├── 上海
├── 广东
│   ├── 广州办事处
│   ├── 深圳办事处
│   └── 东莞办事处
└── 广西
```

**完整 GROUP_TREE 数据**（必须包含根节点 "/"，根节点 id 为 `'root'`）：
```typescript
const GROUP_TREE: TreeNode[] = [
  {
    id: 'root',
    name: '/',
    isLeaf: false,
    children: [
      { id: 'uncategorized', name: '未分类', isLeaf: true },
      { id: 'shanghai', name: '上海', isLeaf: true },
      {
        id: 'guangdong',
        name: '广东',
        isLeaf: false,
        children: [
          { id: 'guangzhou', name: '广州办事处', isLeaf: true },
          { id: 'shenzhen', name: '深圳办事处', isLeaf: true },
          { id: 'dongguan', name: '东莞办事处', isLeaf: true },
        ],
      },
      { id: 'guangxi', name: '广西', isLeaf: true },
    ],
  },
];
```

**根节点 "/" 的渲染规范**：
- 根节点始终显示在树的最顶部，作为第一层
- 根节点默认展开，显示其所有子节点
- 根节点有 +/- 按钮用于展开/收起
- 根节点的 +/- 按钮背景色为 `#F7F9FC`（浅灰，区别于子节点的白色背景）
- 根节点有复选框，可勾选选中全部设备
- 根节点可点击激活（筛选全部设备）

##### 3.1.3.2 右侧设备表格

- flex-1，min-width 0，**宽度必须填满剩余空间**（`width: 100%`）
- 可横向滚动
- **表格宽度必须 100% 填满容器**，禁止出现右侧大量空白
- 表格列宽总和应等于容器宽度，设备名称列应使用 `flex-1` 自适应剩余宽度

**表头规范（SeerDesign 表格规范）**：

| 属性 | 值 |
|------|------|
| 高度 | 32px |
| 背景 | `#EDF1F7` |
| 底边框 | 1px `#E1E5EB` |
| 文字 | 12px/400，颜色 `#454C59` |
| 单元格水平内边距 | 12px |
| 列间分割线 | 1px × 16px 高，颜色 `#E1E5EB`，垂直居中 |

**基础版列配置**：

| 列 | 字段 | 宽度 | 渲染类型 | 对齐 |
|------|------|------|------|------|
| 多选框 | - | 40px | Checkbox（居中） | center |
| 设备名称 | name | **200px 固定** | deviceName（图标+L型连线+主备标签+名称） | left |
| 接入状态 | status | 90px | status（状态圆点+文字） | left |
| 所属分组 | groupName | **flex-1**（自适应剩余宽度） | group（灰色文字） | left |

**表格宽度计算**：表格总宽度 = 容器宽度 = 40 + 200 + 90 + flex-1，所属分组列自适应填满剩余空间

**表头多选框**：
- 居中于 40px 宽列
- 支持全选/取消全选（基础版无半选态，仅选/未选两种状态）

**表格行规范**：

| 属性 | 值 |
|------|------|
| 行高 | 40px |
| 底边框 | 1px `#E1E5EB` |
| 文字 | 12px/400，颜色 `#2F3540` |
| 悬浮态 | 背景 `#F7F9FC` |
| 选中态 | 背景 `#E8F4FF` |
| 禁用态（分组已选） | opacity:0.4，复选框 disabled |

**设备名称列渲染**（从左到右依次排列）：
1. 设备图标（16×16px，使用网关/设备图标替代）
2. 备设备 L 型连线（**仅备设备显示**，详见下方）
3. 主/备标签（DeviceTypeBadge）
4. 设备名称文字

**备设备 L 型连线（关键细节）**：

L 型连线用于在表格行中表示备设备与上方主设备的从属关系。连线位于设备图标**右侧**，由一条竖线和一条水平线组成，形状如字母 "L"：

**在待选区表格中**：
- 容器：`width: 12px, height: 40px, position: relative, flex-shrink: 0`
- 竖线：`width: 1px, background: #8F959E, position: absolute, left: 0, top: 0, height: 50%`（从顶部到中间）
- 水平线：`height: 1px, background: #8F959E, position: absolute, left: 0, top: 50%, width: 12px`（从左到右，连接到标签/名称）
- 含义：竖线连接上方主设备行，水平线连接到当前备设备内容

**在已选区列表中**：
- 容器：`width: 8px, height: 40px, position: relative, flex-shrink: 0`
- 竖线：`width: 1px, background: #8F959E, position: absolute, left: 0, top: 0, height: 50%`
- 水平线：`height: 1px, background: #8F959E, position: absolute, left: 0, top: 50%, width: 8px`

**重要**：主设备行不显示 L 型连线，只有备设备行才显示。主备设备在列表中始终相邻排列（主设备在上，备设备紧随其后）。

**主/备标签（DeviceTypeBadge）**：
- 主：背景 `#E8F4FF`，文字 `#1C6EFF`
- 备：背景 `#E6F9F0`，文字 `#12A679`
- 尺寸：水平内边距 4px，高度 18px，字号 12px，字重 500，圆角 2px
- 非主备设备不显示标签

**接入状态列渲染（StatusBadge）**：

| 状态 | 圆点颜色 | 文字 | 文字颜色 |
|------|------|------|------|
| online | `#12A679` | 在线 | `#12A679` |
| offline | `#6F7785` | 离线 | `#6F7785` |
| pending | `#FDAA1D` | 待接入 | `#FDAA1D` |
| fault | `#CF171D` | 故障 | `#CF171D` |

- 圆点：6×6px (w-1.5 h-1.5)，圆角 full
- 文字：12px，行高 20px
- 圆点与文字间距 4px

**所属分组列**：
- 灰色文字 `#6F7785`，12px，超长截断

**空状态**：
- 居中显示灰色设备插图（64×64 SVG）
- 文字"暂无设备数据"，12px，颜色 `#6F7785`（SeerDesign 辅助文字色）

**分页器**：
- 高度 40px，上边框 1px `#E1E5EB`
- **背景必须为白色**（`bg-white`），禁止出现灰色底色
- 左侧：总项数文字，12px，颜色 `#6F7785`，格式"共 N 项"
- 右侧：分页按钮
  - 上一页/下一页：24×24px，ChevronLeft/Right 图标 14px
  - 禁用态：颜色 `#D3D7DE`，cursor not-allowed
  - 页码：24×24px，12px
  - 当前页：蓝色圆形背景 `#1C6EFF`，白色文字
  - 非当前页：颜色 `#2F3540`，悬浮蓝色边框+文字
  - 省略号：`...`，颜色 `#6F7785`
  - 每页 10 条（按行组分页，保证主备不被拆开）

---

### 3.2 已选区（右侧）

- 宽度 340px，1px border `#D3D7DE`，圆角 2px，overflow hidden

#### 3.2.1 已选标题栏

- 高度 40px，水平内边距 12px
- 左侧："已选(N)"，12px/600，颜色 `#2F3540`
- 右侧：清空按钮（垃圾桶图标），14px，颜色 `#6F7785`，悬浮 `#CF171D`
  - 无选中时 disabled（opacity:0.4）
- **背景必须为白色**（`bg-white`），禁止出现灰色底色

#### 3.2.2 已选搜索框

- 水平内边距 12px，底部内边距 12px
- 高度 32px，右内边距 32px
- 占位文字："搜索已选设备"
- 搜索图标 12px，位于右侧

#### 3.2.3 已选列表

上边框 1px `#E1E5EB`

**已选表头**：
- **表头始终可见**，即使已选列表为空（无已选设备时表头也不能隐藏）
- 高度 32px，背景 `#EDF1F7`，底边框 1px `#E1E5EB`
- 三列：设备名称（flex-1）| 所属分组（120px）| 操作（32px）
- 列间分割线：1px × 16px，颜色 `#E1E5EB`
- 文字 12px/500，颜色 `#454C59`

**已选行**：
- 高度 40px，底边框 1px `#E1E5EB`
- 悬浮背景 `#F7F9FC`

**分组条目行**：
- 文件夹图标 14px + 分组名（12px，`#2F3540`，truncate）
- 所属分组：路径文字，12px，`#6F7785`，120px 宽，truncate
- 操作：X 按钮 12px，颜色 `#6F7785`，悬浮 `#CF171D`

**设备条目行**：
- 设备图标 14px（网关/设备图标）
- 备设备 L 型连线（仅备设备显示，宽 8px，高 40px，绘制规则同上但宽度为 8px）
- 主/备标签
- 设备名（12px，`#2F3540`，truncate）
- 所属分组：`/` + 分组路径，12px，`#6F7785`，120px 宽
- 操作：X 按钮，同上

**空状态**：
- 居中灰色文件夹插图（64×64 SVG）
- 主文字："暂无已选设备"，12px，`#6F7785`（SeerDesign 辅助文字色）
- 副文字："请在左侧勾选设备或分组"，12px，`#A1A7B3`（SeerDesign 提示文字色）

---

## 4. 底栏

**高度**：56px，水平内边距 16px

**左侧**："设备列表"按钮 + 外链图标
- 高度 32px，水平内边距 16px
- 边框 1px `#D3D7DE`，圆角 2px
- 文字 14px，颜色 `#2F3540`
- 悬浮：边框 `#1C6EFF`，文字 `#1C6EFF`
- 外链图标（ExternalLink）12px

**右侧按钮区**：**确定按钮在左，取消按钮在右**（重要：确定 | 取消，从左到右排列）
- 确定：72×32px，背景 `#1C6EFF`，白色文字 14px，圆角 2px
  - 悬浮：`#4FA1FF`，点击：`#1458CC`
- 取消：72×32px，边框 1px `#D3D7DE`，文字 `#2F3540` 14px
  - 悬浮：边框 `#1C6EFF`，文字 `#1C6EFF`
- 两按钮间距 8px

---

## 5. 核心交互逻辑（选择逻辑完整说明）

### 5.1 三套状态变量

组件维护三套核心状态：

| 状态变量 | 类型 | 说明 |
|----------|------|------|
| `selectedDevices` | `Set<string>` | **个体选中**的设备ID集合（不含通过分组选中的设备） |
| `selectedGroups` | `Set<string>` | 选中的分组ID集合 |
| `disabledGroups` | `Set<string>` | 禁用的分组ID集合（因父级分组被选中而禁用） |

另外有一个**计算属性**：
- `effectiveSelectedDeviceIds: Set<string>` = 个体选中设备 + 分组下所有设备 + 主备联动设备

**关键原则：分组选中与个体选中是完全独立的两套记录，互不干扰。**

### 5.2 设备勾选逻辑（toggleDevice）

在表格中勾选/取消勾选单个设备时：

**前提检查**：
1. 如果设备所属分组在 `selectedGroups` 中 → **忽略操作**（该设备已通过分组选中，不可单独操作）
2. 如果设备所属分组的祖先分组在 `selectedGroups` 中 → **忽略操作**（同上）

**勾选设备**：
1. 将该设备ID加入 `selectedDevices`
2. 查找 `MASTER_BACKUP_MAP`，如果存在主备关联设备，将关联设备ID也加入 `selectedDevices`

**取消勾选设备**：
1. 将该设备ID从 `selectedDevices` 移除
2. 查找 `MASTER_BACKUP_MAP`，如果存在主备关联设备，将关联设备ID也从 `selectedDevices` 移除

**重要：勾选设备不会改变任何分组的选中状态（不联动父级/子级分组）。**

### 5.3 分组勾选逻辑（toggleGroup）

在左侧树中勾选/取消勾选分组复选框时：

**勾选分组**（分组不在 `selectedGroups` 中时）：
1. 将该分组ID加入 `selectedGroups`
2. 获取该分组下**所有层级**的设备ID（含子分组、孙分组的设备），将这些设备ID从 `selectedDevices` 中移除（避免重复选中）
3. 获取该分组的**所有后代分组ID**，将它们加入 `disabledGroups`（禁用）
4. 将 `selectedGroups` 中已有的后代分组移除（如果"广东"被选中，则"广州办事处"等子分组自动取消选中）

**取消勾选分组**（分组在 `selectedGroups` 中时）：
1. 将该分组ID从 `selectedGroups` 移除
2. 获取该分组下所有层级的设备ID，将这些设备ID从 `selectedDevices` 中移除（分组取消时，原来通过分组选中的设备不再有效）
3. 获取该分组的所有后代分组ID，将它们从 `disabledGroups` 中移除（恢复可操作性）

**关键规则**：
- 分组勾选**不会联动改变父级分组**的选中状态
- 分组勾选**会使后代分组禁用**，后代分组不可单独勾选
- 分组勾选**会清除后代分组的已有选中状态**（后代分组从 `selectedGroups` 中移除）
- 分组勾选**会清除该分组下所有设备的个体选中**（设备从 `selectedDevices` 中移除）

### 5.4 禁用分组逻辑（disabledGroups）

当分组被选中时，其后代分组的处理：

**禁用表现**（在树中）：
1. 后代分组节点 opacity: 0.4，pointer-events: none
2. 后代分组的复选框 checked=false, disabled=true
3. 悬浮显示 Tooltip："该对象所属的父级已被选中，无需单独选择"

**禁用表现**（在表格中）：
1. 属于禁用分组的设备行 opacity: 0.4
2. 复选框 checked=true, disabled=true
3. 悬浮 Tooltip："该对象所属的父级已被选中，无需单独选择"

**恢复时机**：取消选中父级分组时，所有后代分组从 `disabledGroups` 中移除，恢复可操作性

### 5.5 树节点复选框的三态显示

树中每个分组节点的复选框有三种状态：

| 状态 | 条件 | 表现 |
|------|------|------|
| 未选中 | 分组不在 `selectedGroups` 中 | 空白复选框 |
| 全选 | 分组在 `selectedGroups` 中 | 勾选复选框 |

**重要：基础版不支持半选(indeterminate)态。设备勾选不会影响分组的复选框视觉状态。分组复选框仅反映分组自身是否被勾选。**

### 5.6 主备联动逻辑

设备之间存在主备关系映射（MASTER_BACKUP_MAP，双向映射）：

| 触发操作 | 联动行为 |
|----------|----------|
| 勾选设备 | 关联设备自动加入 `selectedDevices` |
| 取消勾选设备 | 关联设备自动从 `selectedDevices` 移除 |
| 分组选中 | 分组下设备的关联设备自动加入 `effectiveSelectedDeviceIds` |
| 分组取消选中 | 关联设备同时从 `effectiveSelectedDeviceIds` 中移除 |
| 搜索匹配 | 关联设备同时出现在搜索结果中 |
| 已选区移除设备 | 关联设备同时移除 |

**表格排列**：主设备在前，备设备紧跟其后（同属一个 DeviceRowGroup）
**已选列表**：主备设备相邻排列，备设备前有 L 型连线

### 5.7 搜索逻辑（基础版）

- 搜索关键字匹配**设备名称**和**所属分组名称**（不区分大小写，包含匹配）
- 搜索时：匹配设备的主备关联设备也出现在结果中
- 搜索时：左侧树自动过滤，只显示匹配设备所属的分组及其祖先路径（**不显示无关的兄弟节点**）
- 搜索时：自动展开匹配的分组节点
- 搜索关键字变化时自动重置页码到第1页
- 搜索状态下覆盖手动展开状态，清除搜索后恢复原始树和手动展开状态

**搜索过滤树的具体实现步骤**：
1. 当搜索框有内容时，遍历**全量设备**（DEVICES，不受 activeGroupId 限制），找出名称或分组路径匹配关键字的设备
2. 收集匹配设备的 `group` 字段，得到 `searchMatchedGroupIds`（匹配分组ID集合）
3. 对每个匹配分组，递归向上获取其所有祖先分组ID，加入 `searchMatchedGroupIds`
4. 用 `searchMatchedGroupIds` 过滤原始树（GROUP_TREE），只保留匹配分组及其祖先路径，**不显示匹配分组的无关兄弟节点**
5. 渲染树时使用过滤后的树数据（filteredTree），而非原始 GROUP_TREE
6. 清除搜索时恢复使用 GROUP_TREE 渲染

### 5.8 树节点点击筛选（与复选框无关）

点击树节点的**非复选框区域**（节点文字行）：
- 激活/取消激活该分组（高亮该节点，显示蓝色背景+左侧2px竖条）
- 激活时：右侧表格只显示该分组及其子组下的设备
- 再次点击同一节点：取消筛选，显示全部设备
- **此操作仅影响表格筛选，不影响任何选中状态**

### 5.9 已选区操作

**移除分组条目**：
1. 将分组ID从 `selectedGroups` 移除
2. 将分组下所有设备ID从 `selectedDevices` 移除
3. 将后代分组ID从 `disabledGroups` 移除（恢复可操作性）

**移除设备条目**：
1. 将设备ID从 `selectedDevices` 移除
2. 查找 MASTER_BACKUP_MAP，将关联设备ID也从 `selectedDevices` 移除

**清空按钮**：
- 清空 `selectedDevices`、`selectedGroups`、`disabledGroups` 三个状态

**搜索框**：
- 在已选列表中按设备名称/分组名称过滤

### 5.10 全选/取消全选

表头复选框：

| 当前状态 | 操作 |
|----------|------|
| 全部未选 | 将所有设备ID加入 `selectedDevices`，不改变 `selectedGroups` |
| 全部已选 | 清空 `selectedDevices`、`selectedGroups`、`disabledGroups` |
| 部分选中(半选态) | 将所有设备ID加入 `selectedDevices`（变全选） |

**判断逻辑**：`allSelected = DEVICES.every(id => effectiveSelectedDeviceIds.has(id))`

### 5.11 选择逻辑完整流程图

```
用户操作                    状态变化                                    UI联动
─────────────────────────────────────────────────────────────────────────
勾选表格设备         → selectedDevices += 设备ID + 关联ID          → 复选框勾选、已选区新增

取消勾选表格设备     → selectedDevices -= 设备ID - 关联ID          → 复选框取消、已选区移除

勾选树分组           → selectedGroups += 分组ID                     → 分组复选框勾选
                     → selectedDevices -= 该分组下所有设备ID         → 表格设备行变禁用(checked+disabled)
                     → disabledGroups += 所有后代分组ID              → 后代分组节点变禁用(opacity:0.4)
                     → selectedGroups -= 后代分组ID(如有)            → 后代分组取消选中

取消勾选树分组       → selectedGroups -= 分组ID                     → 分组复选框取消
                     → selectedDevices -= 该分组下所有设备ID         → 表格设备行恢复可选
                     → disabledGroups -= 所有后代分组ID              → 后代分组恢复可操作

点击树节点(非复选框) → activeGroupId = groupId / null               → 节点高亮/取消高亮
                     （不影响任何选中状态）                           → 表格筛选该分组下设备

已选区移除分组       → selectedGroups -= 分组ID                     → 同"取消勾选树分组"
                     → selectedDevices -= 该分组下设备ID
                     → disabledGroups -= 后代分组ID

已选区移除设备       → selectedDevices -= 设备ID - 关联ID           → 同"取消勾选表格设备"

全选按钮             → selectedDevices = 所有设备ID                  → 所有复选框勾选
                     → selectedGroups = {}                           → 树节点不变(设备勾选不影响分组态)
                     → disabledGroups = {}

取消全选             → 三个状态全部清空                              → 所有复选框取消
```

---

## 6. 数据模型

### 6.1 设备数据结构

```typescript
interface DeviceItem {
  id: string;            // 设备唯一标识
  name: string;          // 设备名称
  type: '主' | '备' | null;  // 主备关系
  group: string;         // 所属分组ID
  groupName: string;     // 所属分组完整路径，如"广东/广州办事处"
  status: 'online' | 'offline' | 'pending' | 'fault';  // 接入状态
  masterId?: string;     // 主设备ID（备设备才有）
}
```

### 6.2 完整示例设备数据（基础版）

```typescript
const DEVICES: DeviceItem[] = [
  { id: 'dev1', name: 'unc-device-1', type: null, group: 'uncategorized', groupName: '/未分类', status: 'online' },
  { id: 'dev2', name: 'sh-device-2', type: null, group: 'shanghai', groupName: '/上海', status: 'offline' },
  { id: 'dev3', name: 'gz-device-3', type: null, group: 'guangzhou', groupName: '/广东/广州办事处', status: 'online' },
  { id: 'dev4', name: 'sz-device-4', type: '主', group: 'shenzhen', groupName: '/广东/深圳办事处', status: 'online' },
  { id: 'dev5', name: 'sz-device-5', type: '备', group: 'shenzhen', groupName: '/广东/深圳办事处', status: 'online', masterId: 'dev4' },
  { id: 'dev6', name: 'dg-device-6', type: null, group: 'dongguan', groupName: '/广东/东莞办事处', status: 'pending' },
  { id: 'dev7', name: 'gx-device-7', type: null, group: 'guangxi', groupName: '/广西', status: 'online' },
  { id: 'dev8', name: 'unc-device-8', type: null, group: 'uncategorized', groupName: '/未分类', status: 'offline' },
  { id: 'dev9', name: 'gz-device-9', type: '主', group: 'guangzhou', groupName: '/广东/广州办事处', status: 'online' },
  { id: 'dev10', name: 'sh-device-10', type: null, group: 'shanghai', groupName: '/上海', status: 'online' },
  { id: 'dev11', name: 'gd-device-11', type: null, group: 'guangdong', groupName: '/广东', status: 'offline' },
  { id: 'dev12', name: 'gx-device-12', type: null, group: 'guangxi', groupName: '/广西', status: 'pending' },
  { id: 'dev13', name: 'gz-device-13', type: '备', group: 'guangzhou', groupName: '/广东/广州办事处', status: 'online', masterId: 'dev9' },
  { id: 'dev14', name: 'sh-device-14', type: null, group: 'shanghai', groupName: '/上海', status: 'online' },
  { id: 'dev15', name: 'unc-device-15', type: null, group: 'uncategorized', groupName: '/未分类', status: 'fault' },
  { id: 'dev16', name: 'dg-device-16', type: '主', group: 'dongguan', groupName: '/广东/东莞办事处', status: 'online' },
  { id: 'dev17', name: 'sz-device-17', type: null, group: 'shenzhen', groupName: '/广东/深圳办事处', status: 'offline' },
  { id: 'dev18', name: 'gx-device-18', type: null, group: 'guangxi', groupName: '/广西', status: 'online' },
  { id: 'dev19', name: 'gd-device-19', type: null, group: 'guangdong', groupName: '/广东', status: 'online' },
  { id: 'dev20', name: 'sh-device-20', type: '主', group: 'shanghai', groupName: '/上海', status: 'online' },
  { id: 'dev21', name: 'gz-device-21', type: null, group: 'guangzhou', groupName: '/广东/广州办事处', status: 'pending' },
  { id: 'dev22', name: 'unc-device-22', type: null, group: 'uncategorized', groupName: '/未分类', status: 'online' },
  { id: 'dev23', name: 'sz-device-23', type: null, group: 'shenzhen', groupName: '/广东/深圳办事处', status: 'online' },
  { id: 'dev24', name: 'dg-device-24', type: '备', group: 'dongguan', groupName: '/广东/东莞办事处', status: 'online', masterId: 'dev16' },
  { id: 'dev25', name: 'gx-device-25', type: null, group: 'guangxi', groupName: '/广西', status: 'offline' },
  { id: 'dev26', name: 'gd-device-26', type: null, group: 'guangdong', groupName: '/广东', status: 'online' },
  { id: 'dev27', name: 'sh-device-27', type: null, group: 'shanghai', groupName: '/上海', status: 'fault' },
  { id: 'dev28', name: 'gz-device-28', type: '主', group: 'guangzhou', groupName: '/广东/广州办事处', status: 'online' },
  { id: 'dev29', name: 'unc-device-29', type: null, group: 'uncategorized', groupName: '/未分类', status: 'offline' },
  { id: 'dev30', name: 'sz-device-30', type: null, group: 'shenzhen', groupName: '/广东/深圳办事处', status: 'pending' },
  { id: 'dev31', name: 'dg-device-31', type: null, group: 'dongguan', groupName: '/广东/东莞办事处', status: 'online' },
  { id: 'dev32', name: 'gx-device-32', type: null, group: 'guangxi', groupName: '/广西', status: 'online' },
  { id: 'dev33', name: 'gd-device-33', type: '主', group: 'guangdong', groupName: '/广东', status: 'online' },
  { id: 'dev34', name: 'sh-device-34', type: '备', group: 'shanghai', groupName: '/上海', status: 'online', masterId: 'dev20' },
  { id: 'dev35', name: 'gz-device-35', type: null, group: 'guangzhou', groupName: '/广东/广州办事处', status: 'offline' },
  { id: 'dev36', name: 'unc-device-36', type: null, group: 'uncategorized', groupName: '/未分类', status: 'online' },
  { id: 'dev37', name: 'sz-device-37', type: null, group: 'shenzhen', groupName: '/广东/深圳办事处', status: 'online' },
  { id: 'dev38', name: 'dg-device-38', type: null, group: 'dongguan', groupName: '/广东/东莞办事处', status: 'pending' },
  { id: 'dev39', name: 'gx-device-39', type: null, group: 'guangxi', groupName: '/广西', status: 'fault' },
  { id: 'dev40', name: 'gd-device-40', type: null, group: 'guangdong', groupName: '/广东', status: 'online' },
  { id: 'dev41', name: 'sh-device-41', type: null, group: 'shanghai', groupName: '/上海', status: 'online' },
  { id: 'dev42', name: 'gz-device-42', type: '备', group: 'guangzhou', groupName: '/广东/广州办事处', status: 'online', masterId: 'dev28' },
  { id: 'dev43', name: 'unc-device-43', type: null, group: 'uncategorized', groupName: '/未分类', status: 'offline' },
  { id: 'dev44', name: 'sz-device-44', type: null, group: 'shenzhen', groupName: '/广东/深圳办事处', status: 'online' },
  { id: 'dev45', name: 'dg-device-45', type: null, group: 'dongguan', groupName: '/广东/东莞办事处', status: 'online' },
  { id: 'dev46', name: 'gx-device-46', type: '备', group: 'guangxi', groupName: '/广西', status: 'online', masterId: 'dev33' },
  { id: 'dev47', name: 'gd-device-47', type: null, group: 'guangdong', groupName: '/广东', status: 'pending' },
  { id: 'dev48', name: 'sh-device-48', type: null, group: 'shanghai', groupName: '/上海', status: 'online' },
  { id: 'dev49', name: 'gz-device-49', type: null, group: 'guangzhou', groupName: '/广东/广州办事处', status: 'offline' },
  { id: 'dev50', name: 'unc-device-50', type: null, group: 'uncategorized', groupName: '/未分类', status: 'online' },
  { id: 'dev51', name: 'sz-device-51', type: null, group: 'shenzhen', groupName: '/广东/深圳办事处', status: 'fault' },
  { id: 'dev52', name: 'dg-device-52', type: '备', group: 'dongguan', groupName: '/广东/东莞办事处', status: 'online', masterId: 'dev65' },
  { id: 'dev53', name: 'gx-device-53', type: null, group: 'guangxi', groupName: '/广西', status: 'online' },
  { id: 'dev54', name: 'gd-device-54', type: null, group: 'guangdong', groupName: '/广东', status: 'online' },
  { id: 'dev55', name: 'sh-device-55', type: '主', group: 'shanghai', groupName: '/上海', status: 'online' },
  { id: 'dev56', name: 'gz-device-56', type: null, group: 'guangzhou', groupName: '/广东/广州办事处', status: 'pending' },
  { id: 'dev57', name: 'unc-device-57', type: null, group: 'uncategorized', groupName: '/未分类', status: 'offline' },
  { id: 'dev58', name: 'sz-device-58', type: null, group: 'shenzhen', groupName: '/广东/深圳办事处', status: 'online' },
  { id: 'dev59', name: 'dg-device-59', type: null, group: 'dongguan', groupName: '/广东/东莞办事处', status: 'online' },
  { id: 'dev60', name: 'gx-device-60', type: null, group: 'guangxi', groupName: '/广西', status: 'offline' },
  { id: 'dev61', name: 'gd-device-61', type: null, group: 'guangdong', groupName: '/广东', status: 'online' },
  { id: 'dev62', name: 'sh-device-62', type: null, group: 'shanghai', groupName: '/上海', status: 'pending' },
  { id: 'dev63', name: 'gz-device-63', type: '备', group: 'guangzhou', groupName: '/广东/广州办事处', status: 'online', masterId: 'dev55' },
  { id: 'dev64', name: 'unc-device-64', type: null, group: 'uncategorized', groupName: '/未分类', status: 'online' },
  { id: 'dev65', name: 'sz-device-65', type: '主', group: 'shenzhen', groupName: '/广东/深圳办事处', status: 'online' },
  { id: 'dev66', name: 'dg-device-66', type: null, group: 'dongguan', groupName: '/广东/东莞办事处', status: 'fault' },
  { id: 'dev67', name: 'gx-device-67', type: null, group: 'guangxi', groupName: '/广西', status: 'online' },
  { id: 'dev68', name: 'gd-device-68', type: null, group: 'guangdong', groupName: '/广东', status: 'offline' },
  { id: 'dev69', name: 'sh-device-69', type: null, group: 'shanghai', groupName: '/上海', status: 'online' },
  { id: 'dev70', name: 'gz-device-70', type: null, group: 'guangzhou', groupName: '/广东/广州办事处', status: 'online' },
];
```

### 6.3 主备联动映射

```typescript
// 双向映射：主设备ID ↔ 备设备ID
const MASTER_BACKUP_MAP: Record<string, string> = {
  dev4: 'dev5',   dev5: 'dev4',
  dev9: 'dev13',  dev13: 'dev9',
  dev16: 'dev24', dev24: 'dev16',
  dev20: 'dev34', dev34: 'dev20',
  dev28: 'dev42', dev42: 'dev28',
  dev33: 'dev46', dev46: 'dev33',
  dev55: 'dev63', dev63: 'dev55',
  dev65: 'dev52', dev52: 'dev65',
};
```

### 6.4 分组树数据结构

```typescript
interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  isLeaf?: boolean;  // 叶子节点无children
}

// 完整分组树数据（必须包含根节点 "/"）
const GROUP_TREE: TreeNode[] = [
  {
    id: 'root',
    name: '/',
    isLeaf: false,
    children: [
      { id: 'uncategorized', name: '未分类', isLeaf: true },
      { id: 'shanghai', name: '上海', isLeaf: true },
      {
        id: 'guangdong',
        name: '广东',
        isLeaf: false,
        children: [
          { id: 'guangzhou', name: '广州办事处', isLeaf: true },
          { id: 'shenzhen', name: '深圳办事处', isLeaf: true },
          { id: 'dongguan', name: '东莞办事处', isLeaf: true },
        ],
      },
      { id: 'guangxi', name: '广西', isLeaf: true },
    ],
  },
];
```

### 6.5 选择结果

```typescript
interface SelectionResult {
  deviceIds: string[];  // 所有选中设备的ID（含主备联动、分组下的设备）
  groupIds: string[];   // 选中的分组ID
}
```

---

## 7. 设计规范引用（SeerDesign）

以下规范来源于 SeerDesign 视觉规范体系，AI 还原此组件时**必须严格遵循**。

### 7.1 色彩体系

| 用途 | 色值 | 说明 |
|------|------|------|
| 品牌主色 | `#1C6EFF` | 选中态、激活态、主按钮 |
| 品牌悬浮 | `#4FA1FF` | 按钮 hover、可点击文字 hover |
| 品牌点击 | `#1458CC` | 按钮 active |
| 浅蓝背景 | `#E8F4FF` | 选中行/选中节点/选中项背景 |
| 页面背景 | `#F7F9FC` | 一级背景色/悬浮态背景 |
| 次级背景 | `#EDF1F7` | 表头背景/多选标签背景/卡片背景 |
| 三级背景 | `#E1E5EB` | 一级分割线/表格行分割/树连线 |
| 主文字 | `#2F3540` | 正文、标题、核心内容 |
| 次文字 | `#6F7785` | 描述、辅助信息、离线状态 |
| 表头文字 | `#454C59` | 表头专用 |
| 提示文字 | `#A1A7B3` | **Placeholder 专用色**，不得使用其他灰色 |
| 不可用文字 | `#BEC3CC` | 禁用态文字 |
| 边框色 | `#D3D7DE` | 二级分割线/常规边框/未选复选框边框 |
| 激活边框 | `#1C6EFF` | 输入框/选择器聚焦态边框 |
| 在线/正常 | `#12A679` | 状态-在线/正常 |
| 故障/错误 | `#CF171D` | 状态-故障/错误/删除悬浮 |
| 待接入/警告 | `#FDAA1D` | 状态-待接入/警告 |
| 备标签背景 | `#E6F9F0` | 备设备标签背景 |
| 备标签文字 | `#12A679` | 备设备标签文字 |
| 纯白 | `#FFFFFF` | 组件背景、输入框背景、按钮背景 |

### 7.2 圆角规范

- **全局锁定 2px**（所有按钮、输入框、搜索框、选择器、标签、复选框、下拉面板、卡片等）
- **弹窗/对话框圆角 4px**（弹窗是唯一使用 4px 圆角的组件）
- **表格无圆角**：表格四角均为直角（border-radius: 0）
- 分页当前页码：圆形（24px 直径圆形背景）

### 7.3 字体排版

- **字体栈**：`pingfang SC, helvetica neue, arial, hiragino sans gb, microsoft yahei ui, microsoft yahei, simsun, sans-serif`
- **字重限制**：仅允许 400 (Regular) 和 600 (Bold)，严禁使用 300/500/700 等其他字重
- **行高公式**：行高 = 字号 + 8px（必须显式声明，禁止 `line-height: normal` 或 `1.5`）
- **常用字号**：
  - 12px → 行高 20px：正文、表格、表单、提示语、占位符、下拉选项、说明文案（**默认字号**）
  - 14px → 行高 22px：弹窗/抽屉底部按钮、二级标题
  - 16px → 行高 24px：弹窗标题
- **默认字号 12px**：除规范明确声明其他字号外，所有组件文字默认 12px

### 7.4 投影规范

- 弹窗/模态框投影：`0 4px 16px rgba(30, 35, 43, 0.12)`
- 下拉面板/浮层投影：`0 2px 8px rgba(31, 35, 43, 0.14)`
- 卡片悬浮态投影：`0 1px 4px rgba(31, 35, 43, 0.16)`
- **严禁蓝色发光投影**：所有 Focus 状态必须 `box-shadow: none !important`，禁止蓝色外发光阴影
- **严禁径向扩散阴影**：按钮点击时禁止出现扩散阴影

### 7.5 间距规范

| 间距层级 | 值 | 用途场景 |
|---------|------|---------|
| XS | 4px | 图标与文字、复选框与文字 |
| S | 8px | 默认间距、表单行间距、按钮之间 |
| M | 12px | 单元格左右间距、输入框内边距 |
| L | 16px | 弹窗内边距、Label 间距、区块间 |
| XL | 24px | 模块间 |

### 7.6 复选框（Checkbox）组件规范

**尺寸**：16px × 16px，圆角 2px

| 状态 | 边框 | 背景 | 内容 |
|------|------|------|------|
| 未选中 | `#D3D7DE` | `#FFFFFF` | 无 |
| 已选中 | 无边框线 | `#1C6EFF` | 白色勾图标，居中 |
| 未选禁用 | `#D3D7DE` | `#E1E5EB` | 无，文字色 `#A1A7B3` |
| 已选禁用 | 无 | `#E1E5EB` | 勾色 `#5E6573`，文字色 `#A1A7B3` |

**注意：基础版不支持半选(indeterminate)态，复选框仅显示已选/未选两种状态。**

- 复选框与文字间距：4px
- 复选框文字：12px/400，颜色 `#2F3540`
- **样式实现建议**：由于 Tailwind 的 `data-[state=checked]:bg-[#1C6EFF]` 与 shadcn/ui Checkbox 组件默认的 `data-[state=checked]:bg-primary` 会产生类冲突（在没有 tailwind-merge 的情况下），推荐在组件顶部注入 CSS 样式覆盖：
  ```css
  [data-state="checked"] { background-color: #1C6EFF !important; border-color: #1C6EFF !important; }
  [data-state="unchecked"] { border-color: #D3D7DE !important; background-color: #FFFFFF !important; }
  ```
  Checkbox 组件的 className 只需设置 `rounded-[2px]`，不再需要 `data-[state=checked]` 相关类名

### 7.7 按钮（Button）组件规范

**圆角**：2px，**禁止径向扩散阴影**

| 按钮类型 | 背景 | 文字色 | 边框 |
|---------|------|--------|------|
| 主按钮(Primary) | `#1C6EFF` | `#FFFFFF` | 无 |
| 主按钮 hover | `#4FA1FF` | `#FFFFFF` | 无 |
| 主按钮 active | `#1458CC` | `#FFFFFF` | 无 |
| 普通按钮(Default) | `#FFFFFF` | `#2F3540` | `#D3D7DE` |
| 普通按钮 hover | `#FFFFFF` | `#1C6EFF` | `#1C6EFF` |
| 普通按钮 active | `#FFFFFF` | `#1458CC` | `#1458CC` |
| 文字按钮 | 透明 | `#1C6EFF` | 无 |
| 文字按钮 hover | 透明 | `#4FA1FF` | 无 |

- **按钮高度**：32px
- **按钮字号**：弹窗/抽屉底部按钮 14px/400，其他场景 12px/400
- **双字按钮宽度**：固定 56px
- **多字按钮**：自适应宽度，左右内边距 16px
- **按钮间距**：8px
- **底栏按钮排列**：按钮组整体右对齐，**确定（主按钮）在左，取消（普通按钮）在右**
- **图标按钮**：32px × 32px，图标 14px × 14px 居中
- **焦点态**：`box-shadow: none !important`

### 7.8 输入框（Input）组件规范

**高度**：32px（默认），圆角 2px

| 状态 | 边框色 | 背景 | 文字色 |
|------|--------|------|--------|
| 默认 | `#D3D7DE` | `#FFFFFF` | `#2F3540` |
| 悬浮(hover) | `#1C6EFF` | `#FFFFFF` | `#2F3540` |
| 聚焦(focus) | `#1C6EFF` | `#FFFFFF` | `#2F3540` |
| 禁用(disabled) | `#D3D7DE` | `#E1E5EB` | `#A1A7B3` |
| 错误(error) | `#CF171D` | `#FFFFFF` | `#2F3540` |

- **字号**：12px，行高 20px
- **内边距**：5px 12px（左右统一 12px）
- **Placeholder**：字号 12px，颜色 `#A1A7B3`（不是 `#8F959E` 或 `#B0B5BD`）
- **禁止**：使用 `line-height: 32px` 实现垂直居中（应使用 flex/padding）
- **聚焦态**：严禁蓝色外发光阴影（`box-shadow: none !important`）
- **搜索框**：搜索图标位于右侧（32px 区域内居中），颜色 `#A1A7B3`；有内容时显示关闭图标

### 7.9 弹窗（Modal/Dialog）组件规范

- **圆角**：4px（弹窗是唯一使用 4px 圆角的组件，其余全部 2px）
- **标题栏**：高度 48px，标题 16px/600，颜色 `#2F3540`，左边距 16px，无底部 border
- **内容区（Body）**：左右内边距 32px，上下无额外间距，内容超出时在 Body 内滚动
- **底部按钮栏（Footer）**：高度 56px，左右内边距 16px，无顶部 border
  - 按钮组整体右对齐
  - 按钮间距 8px
  - **排列顺序**：确定（主按钮）在左，取消（普通按钮）在右
  - 按钮高度 32px，字号 14px
- **关闭按钮**：右上角，24px × 24px 点击热区，图标 16px，颜色 `#6F7785`，悬浮背景 `#EDF1F7`
- **弹窗宽度**：从 400/480/640/720/800/960/1200px 中选择，本组件使用 1200px
- **遮罩层**：半透明黑色遮罩

### 7.10 选择器（Select）下拉面板规范

- **圆角**：2px
- **选项高度**：32px
- **选中项**：背景 `#E8F4FF` 通栏展示，文字色 `#1C6EFF`
- **悬浮项**：背景 `#F7F9FC`
- **面板上下间距**：4px
- **面板投影**：`0 2px 8px rgba(31, 35, 43, 0.14)`
- **选中项禁止勾选图标**（不显示 ✓ 图标）
- **多选标签**：文字色 `#2F3540`，背景 `#EDF1F7`，圆角 2px，高度 20px，左右内边距 8px

### 7.11 标签（Tag）组件规范

**浅色标签**（用于状态展示）：
- 圆角 2px，内边距 4px 8px，字号 12px，字重 400，无边框
- 文字颜色 = 对应语义色，背景颜色 = 对应文字色的 10% 透明度

| 状态 | 文字色 | 背景色 |
|------|--------|--------|
| 在线/正常 | `#12A679` | rgba(18, 166, 121, 0.1) |
| 故障/错误 | `#CF171D` | rgba(207, 23, 29, 0.1) |
| 待接入/警告 | `#FDAA1D` | rgba(253, 170, 29, 0.1) |
| 离线 | `#6F7785` | rgba(111, 119, 133, 0.1) |

**深色标签**（用于强调）：
- 文字色白色，背景色为语义主色

**点状标签**（用于状态指示）：
- 左侧 6px × 6px 圆点，右侧文字 12px/400 `#2F3540`，圆点与文字间距 4px

### 7.12 表格详细规范

**表头**：
- 高度 32px，背景 `#EDF1F7`
- 文字：12px/400，颜色 `#454C59`
- 纵向分割线：1px × 16px 高，颜色 `#E1E5EB`，垂直居中（仅表头，内容区无竖线）
- 最后一列表头右侧不显示分割线
- 表头文字不换行，默认左对齐（序号/多选框列居中）

**内容行**：
- 行高 40px，底边框 1px `#E1E5EB`
- 文字：12px/400，颜色 `#2F3540`
- 悬浮态：背景 `#F7F9FC`
- 选中态：背景 `#E8F4FF`
- 单元格左右内边距 12px
- 表格无圆角（四角均为直角）

**多选框列**：宽度 40px，表头和内容均居中

**分页器**：
- 高度 40px，右对齐
- 当前页码：24px 直径圆形，背景 `#1C6EFF`，文字白色
- 悬浮边框色 `#1C6EFF`，点击边框色 `#1458CC`
- 快速跳转输入框：48px 宽 × 24px 高，边框 `#D3D7DE`，聚焦 `#1C6EFF` 无 shadow
- 禁用态文字色 `#BEC3CC`

### 7.13 交互状态统一规范

**焦点态（Focus）**：
- 输入框/选择器聚焦：边框色 `#1C6EFF`，**严禁**蓝色外发光阴影
- 必须清除默认焦点环：`box-shadow: none !important; outline: none;`

**禁用态（Disabled）**：
- 背景 `#E1E5EB`，边框 `#D3D7DE`，文字色 `#A1A7B3`
- 光标 `cursor: not-allowed`
- 不可点击，无交互反馈

**交互手势**：
- 所有可点击元素（按钮、导航、下拉框、图标）悬浮时必须 `cursor: pointer`
- 禁用态元素使用 `cursor: not-allowed`

**过渡动画**：
- hover/active 状态切换建议使用 `transition: all 150ms ease`

### 7.14 滚动条规范

弹窗/表格/树面板内的滚动条应使用轻量样式：
- 滚动条宽度：6px
- 滚动条轨道：透明
- 滚动条滑块：`rgba(0, 0, 0, 0.15)`，悬浮时 `rgba(0, 0, 0, 0.25)`
- 滚动条圆角：3px

### 7.15 空状态规范

- 图标：48px，颜色 `#D3D7DE`
- 文字：12px/400，颜色 `#6F7785`
- 上下居中排列，图标与文字间距 8px

---

## 8. 图标资源

### 8.1 设备图标

> **说明**：代码块中已内置 `GatewayIcon` 内联SVG组件（蓝色圆角矩形机身 + 白色端口指示灯），无需额外引入外部图标文件。若使用SKILL技能文档（非代码块），请自行绘制一个表示**网关设备**的图标（16×16px，颜色 `#1C6EFF`），实心填充风格。

图标用于：
- 表格设备名称列（16×16px）
- 已选列表设备条目（14×14px）

### 8.2 文件夹图标

> **说明**：代码块中已内置 `FolderIcon` 内联SVG组件（黄色实心填充 + 浅黄翻页），无需额外引入外部图标文件。若使用SKILL技能文档（非代码块），请自行绘制一个**黄色文件夹**图标（16×16px，颜色 `#FDAA1D`），实心填充风格。请勿使用 Lucide 默认线条风格图标。

图标用于：
- 树节点文件夹图标
- 已选列表分组条目

### 8.3 Lucide 图标

| 图标名 | 用途 |
|--------|------|
| Search | 搜索按钮/搜索框图标 |
| ChevronLeft | 分页上一页 |
| ChevronRight | 分页下一页 |
| X | 关闭/删除/清空 |
| Trash2 | 清空已选 |
| List | 触发器右侧列表图标 |
| ExternalLink | 底栏设备列表外链 |

---

## 9. 关键实现注意事项

### 9.1 分页与主备分组

- 设备按主备关系分组为 DeviceRowGroup，分页以行组为单位
- 保证同一组的主备设备不被分页拆开
- 每页 10 个行组

### 9.2 搜索时树过滤

- 搜索匹配设备后，计算匹配设备所属的所有分组ID（含祖先分组）
- 过滤树只保留匹配分组及其祖先路径，不显示无关的兄弟节点
- 搜索状态下覆盖手动展开状态，自动展开到匹配节点
- 清除搜索后恢复原始树和手动展开状态
- **搜索范围**：搜索应覆盖所有设备（忽略 activeGroupId 过滤），确保搜索结果不受当前激活分组的限制

### 9.3 禁用分组逻辑

父级分组被选中时：
1. 所有后代分组进入禁用态（disabledGroups Set）
2. 禁用分组在树中显示为：opacity 0.4，pointer-events none
3. 禁用分组的复选框 checked=false, disabled=true
4. 悬浮显示 Tooltip："该对象所属的父级已被选中，无需单独选择"
5. 取消父级选中 → 自动恢复后代分组的可操作性

### 9.4 表格设备禁用逻辑

当设备所属的分组（或其祖先分组）被选中时：
- 表格中该设备行显示为禁用态（opacity 0.4）
- 复选框 checked=true, disabled=true
- 悬浮 Tooltip："该对象所属的父级已被选中，无需单独选择"

### 9.5 已选区分类展示

已选区将条目分为两类：
1. **分组条目**：显示文件夹图标 + 分组名 + 所属路径
2. **个体设备条目**：显示设备图标 + 主备标签 + 设备名 + 所属分组

分组选中的设备不作为个体设备出现在已选列表中，只有通过表格单独勾选的设备才作为个体设备展示。

### 9.6 弹窗关闭行为

- 点击"确定"：回调 onConfirm 传递 SelectionResult，关闭弹窗
- 点击"取消"：直接关闭弹窗，不保留选择
- 点击右上角 X：同取消

### 9.7 底栏按钮顺序（关键）

底栏右侧按钮区的**排列顺序**为：**确定（左）| 取消（右）**

这是非标准的按钮排列（标准通常是取消在左、确定在右），但本组件严格遵循此顺序。AI 工具实现时必须确保：
- 第一个按钮（左侧）= 确定（蓝色主按钮，`bg-[#1C6EFF]`）
- 第二个按钮（右侧）= 取消（灰色边框按钮，`border border-[#D3D7DE]`）

### 9.8 设备名称列内边距

- 设备名称列：`padding: 0 12px`，`gap: 8px`（图标、连线、标签、文字之间的间距）
- 其他列：`padding: 0 12px`
- 多选框列：居中对齐，无文字内边距

---

## 10. 完整组件 API

```typescript
interface DeviceMultiSelectorBasicProps {
  /** 弹窗是否打开 */
  open: boolean;
  /** 弹窗打开/关闭回调 */
  onOpenChange: (open: boolean) => void;
  /** 确认选择回调 */
  onConfirm: (result: SelectionResult) => void;
}

interface SelectionResult {
  /** 所有选中设备ID（含主备联动、分组下设备） */
  deviceIds: string[];
  /** 选中的分组ID */
  groupIds: string[];
}
```

---

## 11. 触发器嵌入规范

在页面中嵌入时，触发器组件的完整结构：

```html
<div style="display:flex; align-items:center; gap:16px; width:400px">
  <!-- 标签 -->
  <span style="font-size:12px; color:#6F7785; flex-shrink:0">设备</span>
  <!-- 输入框 -->
  <div 
    style="display:flex; align-items:center; justify-content:space-between; height:32px; padding:0 12px; border:1px solid #D3D7DE; border-radius:2px; background:white; cursor:pointer; flex:1; min-width:0"
    onmouseover="this.style.borderColor='#1C6EFF'"
    onmouseout="this.style.borderColor='#D3D7DE'"
    onclick="openModal()"
  >
    <span style="font-size:12px; color:#2F3540/#A1A7B3; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">
      已选摘要 或 "请选择"
    </span>
    <!-- 列表图标 -->
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6F7785" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:8px; flex-shrink:0">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  </div>
</div>
```

外层包裹一个 DEMO 展示框：
- 边框：10px solid `#EDF1F7`，圆角 4px
- 内边距：24px
- 背景：白色

---

## 12. 体验 Tips（展示在 DEMO 标题下方）

> **体验Tips：**
> 1. 直接勾选对象：在表格中勾选设备，在左树勾选设备分组；
> 2. 搜索后勾选：输入设备/分组名称后，勾选对象；
> 3. 勾选主备关系设备：勾选任一具有主备关系的设备，关联设备会一并勾选，搜索时关联设备也会展示。

Tips 区域样式：背景 `#F7F9FC`，圆角 2px，内边距 12px，标题 12px/600 `#2F3540`，内容 12px/400 `#6F7785`

---

## 13. 页面上下文结构

该 Skill 组件在页面中的完整上下文：

```
页面标题：设备多选-基础版
页面描述：通用的设备多选组件样式，适用于大部分场景。
体验Tips区域：上述 Tips
DEMO外框：10px border #EDF1F7 + 4px 圆角 + 24px 内边距
  └── 触发器：标签"设备" + 输入框
      └── 弹窗（点击触发器打开）
```

标题样式：14px/600 `#2F3540`
描述样式：12px/400 `#6F7785`，与标题间距 4px
Tips 与描述间距：12px
DEMO 外框与 Tips 间距：16px
