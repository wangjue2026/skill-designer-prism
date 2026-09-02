# SeerDesign 全局原子规范与间距规范

## 目录
- [3.1 圆角 (Border Radius)](#31-圆角-border-radius)
- [3.2 边框色 (Border Color)](#32-边框色-border-color)
- [3.3 投影规范 (Shadows)](#33-投影规范-shadows)
- [3.4 交互手势](#34-交互手势)
- [3.5 输入控件 Placeholder 规范](#35-输入控件-placeholder-规范)
- [3.6 输入类控件内容内边距规范](#36-输入类控件内容内边距规范)
- [4.1 基础间距系统](#41-基础间距系统)
- [4.2 组件内部间距](#42-组件内部间距)
- [4.3 页面级间距](#43-页面级间距)

---

## 3. 全局原子规范

### 3.1 圆角 (Border Radius)
- **全局锁定**：2px
- **表格除外**：表格组件无圆角（border-radius: 0）
- 其他所有组件统一使用 2px 圆角

### 3.2 边框色 (Border Color)
- **常规状态**：#D3D7DE
- **激活/选中状态**：var(--color-blue) (#1C6EFF)

### 3.3 投影规范 (Shadows)

#### 禁止蓝色发光
- **严禁**在 Focus 状态下使用 AntD 默认的蓝色外发光阴影
- 必须使用 `box-shadow: none !important;` 清除默认阴影

#### 下拉/浮层投影
- 统一使用：`dropshadow-s2: 0 4px 16px rgba(30, 35, 43, 0.14)`
- 适用场景：下拉菜单、弹出层、工具提示等

### 3.4 交互手势
- **适用元素**：所有可点击元素（按钮、导航、下拉框、图标）
- **强制要求**：悬浮时鼠标必须切换为 Pointer 手势
- 实现方式：`cursor: pointer !important;`

**注**：按钮组件规范详见 [comp-button.md](../components/comp-button.md)

### 3.5 输入控件 Placeholder 规范
- **适用控件**：输入框 (Input)、选择框 (Select)、搜索框 (Input.Search)
- **字号**：12px（与默认字体一致）
- **颜色**：辅助色 graphite (#A1A7B3)
- **实现方式**：
```css
.ant-input::placeholder,
.ant-select-selection-placeholder,
.ant-input-search::placeholder {
  font-size: 12px !important;
  color: #A1A7B3 !important; /* graphite */
}
```

### 3.6 输入类控件内容内边距规范

1. 普通输入框、选择器、搜索框、数字输入框的输入内容左内边距统一为 12px。
2. Placeholder 的左起点必须与输入内容左起点一致。
3. 不允许出现普通输入框 12px、选择器 16px、搜索框 20px 这类不一致情况。
4. 带 prefix 图标的搜索框：
   - 图标左边缘距离输入框左边缘 12px；
   - 图标尺寸 16px；
   - 图标与 placeholder / 输入文字之间间距 8px。
5. 带 suffix、showCount、allowClear 的输入框，外层 wrapper 负责 12px 内边距，内部 input 不再重复设置 padding。
6. Select 的 placeholder 和已选文本也必须从 12px 起始。
7. Select 的下拉箭头区域单独预留，不影响左侧 placeholder 起点。

---

## 4. 间距规范

### 4.1 基础间距系统

#### 4.1.1 间距层级
| 层级 | 值 | 用途场景 |
|-----|---|---------|
| XS | 4px | 图标与文字、小组件内部 |
| S | 8px | 默认间距、组件间、表单项 |
| M | 12px | 单元格文字左右间距、按钮组内部 |
| L | 16px | 表单 Label 间距、区块间 |
| XL | 24px | 模块间、大区块间距 |
| XXL | 32px | 页面级大间距 |

#### 4.1.2 默认间距原则
- **组件间默认间距**：8px
- **表单行间距**：8px
- **表单 Label 间距**：16px

### 4.2 组件内部间距

#### 4.2.1 图标与文字间距
- **默认间距**：4px
- **适用场景**：按钮、菜单、列表项等包含图标的元素

#### 4.2.2 单元格文字间距
- **左右间距**：12px
- **上下间距**：8px（行高）

#### 4.2.3 按钮组内部间距
- **按钮之间**：8px
- **按钮组与相邻元素**：16px

### 4.3 页面级间距

#### 4.3.1 模块间距
- **模块之间**：24px
- **大区块之间**：32px

#### 4.3.2 标题与内容间距
- **标题与下方内容**：16px
- **标题与上方内容**：8px
