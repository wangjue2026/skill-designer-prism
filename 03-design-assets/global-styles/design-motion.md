# 全局原子规范：B 端交互动效规范 (Motion & Micro-interaction Tokens)

> 💡 **规范基座定位**：
> 本文档定义织雨体验设计智脑（SASE / XDR / aES 等 B 端安全与运维产线）的**唯一动效真源（SSOT）**。
> Part2《设计说明书》第 7 节「③ 组件、Token 与动效」须直接引用本文档 Token；Part3 高保真 Demo 须按本规范落实全部交互过渡与微动效。
>
> **核心理念：精准、克制、低延迟、不阻塞操作**。B 端高频操作场景下，动效只服务于**空间定位（从哪来/去哪去）、状态反馈（点了有回应）与视觉连续性（不生硬闪现）**，严禁拖沓或炫技。

---

## 一、时长阶梯 (Duration Tokens)

| Token 变量名 | 标准时长 | 适用场景 |
| :--- | :---: | :--- |
| `--motion-dur-fast` | `150ms` | 微交互反馈：按钮 Hover / Active、表格行 Hover、Tag 增删、Tooltip 显隐、图标旋转（展开箭头）、筛选高亮 |
| `--motion-dur-base` | `220ms` | 组件状态切换：页内 Tab 指示条与面板切换、下拉菜单 / 日期面板展开、模态弹窗（Modal）缩放淡入、Toast 轻提示滑入、流带/瀑布条选中联动高亮 |
| `--motion-dur-slow` | `280ms` | 大面积容器位移：右侧抽屉（Drawer）滑入/滑出、侧边栏菜单折叠/展开、手风琴大区块展开 |

> ⚠️ **时长上限红线**：除骨架屏循环微光（`1.4s`）与加载旋转（`0.8s`）外，**任何一次性交互过渡不得超过 `300ms`**，避免高频排障时产生拖泥带水感。

---

## 二、缓动曲线 (Easing Tokens)

| Token 变量名 | 贝塞尔曲线值 | 物理隐喻与适用场景 |
| :--- | :--- | :--- |
| `--motion-ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | **入场与展开（快启缓停）**：抽屉滑入、弹窗出现、下拉面板展开、Toast 弹出、Tab 内容淡入 |
| `--motion-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | **退场与收起（加速离场）**：抽屉滑出、弹窗关闭、Toast 消失、下拉收起 |
| `--motion-ease-std` | `cubic-bezier(0.4, 0, 0.2, 1)` | **状态位移与变形（平滑过渡）**：侧栏宽度伸缩、Tab 底部蓝条移动、颜色/边框/背景色切换、进度条长度变化 |

> 🚫 **禁止曲线**：严禁使用带回弹过冲的 `bounce` / `elastic` 曲线（如 `cubic-bezier(0.34, 1.56, 0.64, 1)`），与安全运维产线沉稳气质冲突。

---

## 三、七类核心组件与可视化动效原语 (Motion Primitives)

在 Part3 Demo 中，以下 7 类高频交互必须落实对应 CSS 过渡（可直接拷贝 `:root` 与原语类）：

```css
:root {
  --motion-dur-fast: 150ms;
  --motion-dur-base: 220ms;
  --motion-dur-slow: 280ms;
  --motion-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --motion-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --motion-ease-std: cubic-bezier(0.4, 0, 0.2, 1);
}

/* 1. 右侧抽屉（Drawer）：遮罩淡入 + 抽屉体右滑入 */
.demo-drawer-mask { opacity: 0; pointer-events: none; transition: opacity var(--motion-dur-base) var(--motion-ease-std); }
.demo-drawer-mask.open { opacity: 1; pointer-events: auto; }
.demo-drawer-panel { transform: translateX(100%); transition: transform var(--motion-dur-slow) var(--motion-ease-out); }
.demo-drawer-mask.open .demo-drawer-panel { transform: translateX(0); }

/* 2. 模态弹窗（Modal）：遮罩淡入 + 弹窗体 0.96→1 轻缩放淡入 */
.demo-modal-mask { opacity: 0; pointer-events: none; transition: opacity var(--motion-dur-base) var(--motion-ease-std); }
.demo-modal-mask.open { opacity: 1; pointer-events: auto; }
.demo-modal-panel { transform: scale(0.96) translateY(6px); opacity: 0; transition: transform var(--motion-dur-base) var(--motion-ease-out), opacity var(--motion-dur-base) var(--motion-ease-out); }
.demo-modal-mask.open .demo-modal-panel { transform: scale(1) translateY(0); opacity: 1; }

/* 3. 页内 Tab 内容切换：轻微上浮淡入（6px，不引起跳动） */
@keyframes demoPaneFade {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.demo-pane-active { animation: demoPaneFade var(--motion-dur-base) var(--motion-ease-out); }

/* 4. Toast 轻提示（IxMessage）：顶部滑入淡出 */
@keyframes demoToastIn {
  from { opacity: 0; transform: translate(-50%, -10px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
.demo-toast { animation: demoToastIn var(--motion-dur-base) var(--motion-ease-out); }

/* 5. 下拉菜单 / 日期面板 / Popover：轻位移淡入 */
.demo-popover { opacity: 0; transform: translateY(-4px); pointer-events: none; transition: opacity var(--motion-dur-fast) var(--motion-ease-out), transform var(--motion-dur-fast) var(--motion-ease-out); }
.demo-popover.open { opacity: 1; transform: translateY(0); pointer-events: auto; }

/* 6. 列表行更新 / 可视化联动高亮反馈（刷亮后回落） */
@keyframes demoRowFlash {
  0% { background-color: #E8F4FF; }
  100% { background-color: transparent; }
}
.demo-row-flash { animation: demoRowFlash 700ms var(--motion-ease-out); }

/* 7. 骨架屏微光（IxSkeleton）与局部加载（IxSpin） */
@keyframes demoShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.demo-skeleton {
  background: linear-gradient(90deg, #EDF1F7 25%, #F7F9FC 50%, #EDF1F7 75%);
  background-size: 200% 100%;
  animation: demoShimmer 1.4s ease-in-out infinite;
  border-radius: 2px;
}

/* 8. 无障碍降级（必含） */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

## 四、B 端动效执行红线（五条）

1. **不阻塞操作**：弹窗/抽屉打开或切换 Tab 时，不加多余 `setTimeout` 锁死用户点击；仅在真实模拟异步提交（如“确认提交误报”）时给按钮施加 `300~500ms` 的 Loading 态防连点；
2. **终态完整可见**：首屏入场不得把关键 KPI、图表或表格藏在 `opacity: 0` 里等滚动触发——静态截图时所有内容必须处于完整终态；
3. **同级控件必有 Hover / Active / Disabled 态**：所有按钮、表格行、Tab、筛选 Tag、可视化可点击节点（流带、瀑布条、拓扑节点）均须声明 `transition: background-color var(--motion-dur-fast) var(--motion-ease-std), border-color var(--motion-dur-fast) var(--motion-ease-std), color var(--motion-dur-fast) var(--motion-ease-std)`；
4. **可视化联动必有明确视觉锚点**：点击桑基流带、瀑布条或拓扑节点时，选中项高亮描边/提亮，其余非关联项适度降透明（如 `opacity: 0.45`）并平滑过渡（`150ms`），让用户一眼看懂“当前筛选了什么”；
5. **可逆退出一致**：抽屉与弹窗均支持点击右上角 `✕`、点取消按钮、点击遮罩层、按 `ESC` 键退出（表单有未保存修改时触发脏检查确认）。
