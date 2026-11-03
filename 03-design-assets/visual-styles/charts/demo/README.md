# charts/demo · 可复用图图片段

> **用途**：每个 `CHART-*` 键对应一个**最小可运行片段**。新需求做图表时**拼装片段**，不要从零写。
> **规则**：片段里的每个色值/尺寸必须能在 [`../tokens/charts.json`](../tokens/charts.json) 找到；`node tools/check-charts.js` 会校验（C6 色值、C7 键覆盖）。
> **依赖**：ECharts 5（`https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js`）；`bar-rank-noaxis` 与各图例为**纯 DOM**。

## 一、片段清单（25 个键全覆盖）

### 柱状图（14）

| 文件 | 对应键 | 形态要点 |
| :--- | :--- | :--- |
| `bar-vertical.html` | `CHART-柱状图·基础-竖向` | 单系列；上端圆角 `[1,1,0,0]` |
| `bar-horizontal.html` | `CHART-柱状图·基础-横向` | 轴互换；右端圆角 `[0,1,1,0]`；单位挂 xAxis |
| `bar-rank-noaxis.html` | `CHART-柱状图·基础-横向上方` | **无轴排行条**（纯 DOM）：名称在上 +5px、轨道 `#EDF1F7` |
| `bar-grouped.html` | `CHART-柱状图·分组-竖向` | 双系列并列，图例在下 |
| `bar-grouped-horizontal.html` | `CHART-柱状图·分组-横向` | 轴互换 + 双系列，长终端名 |
| `bar-stacked.html` | `CHART-柱状图·堆叠-竖向` | `stack`；**仅顶段**圆角；按等级取色 |
| `bar-stacked-horizontal.html` | `CHART-柱状图·堆叠-横向` | 轴互换 + stack，长路径名 |
| `bar-compare.html` | `CHART-柱状图·对比` | 本期/上期两组并排 |
| `bar-markline.html` | `CHART-柱状图·参考线` | `markLine` 阈值线，线色 `#E1E5EB` |
| `bar-decal.html` | `CHART-柱状图·纹理-竖向` | `itemStyle.decal` 斜线纹理 |
| `bar-decal-horizontal.html` | `CHART-柱状图·纹理-横向` | 轴互换 + decal |
| `bar-in-card.html` | `CHART-柱状图·卡片化` | 外层卡片容器 + 图表自适应 |
| `bar-legend-multi.html` | `CHART-柱状图·图例多列` | 6 系列堆叠，图例按宽度换行 |
| `bar-legend-value.html` | `CHART-柱状图·图例带数值百分比` | `legend.formatter` 输出「值（占比）」 |

### 折线图（6）

| 文件 | 对应键 | 形态要点 |
| :--- | :--- | :--- |
| `line-basic.html` | `CHART-折线图·基础` | `boundaryGap:false`；线宽 2px、两端透明 |
| `line-smooth.html` | `CHART-折线图·平滑` | `smooth:true`（波动大看趋势） |
| `line-area.html` | `CHART-折线图·面积` | `areaStyle` 低透明度渐变 |
| `line-stacked.html` | `CHART-折线图·堆叠` | 多系列 `stack` + 面积 |
| `line-dual-axis.html` | `CHART-折线图·双Y轴` | 右轴不画分隔线 |
| `line-multi-axis.html` | `CHART-折线图·多Y轴` | 三轴，右侧轴 `offset` 错开 |

### 饼图（5）

| 文件 | 对应键 | 形态要点 |
| :--- | :--- | :--- |
| `pie-basic.html` | `CHART-饼图·基础` | **实心需显式** `radius:'80%'` |
| `pie-ring.html` | `CHART-饼图·环形` | 默认 `['70%','80%']` |
| `pie-ring-total.html` | `CHART-饼图·环形带总数` | 双层圆等比缩放 + 24px 中心数字 |
| `pie-rose-total.html` | `CHART-饼图·玫瑰` | `roseType:'area'`；**总数在图例上方并加粗** |
| `pie-legend-percent.html` | `CHART-饼图·图例带数值百分比` | 图例含数值 + 占比，右对齐 |

## 二、怎么用

1. 按件型键找到对应片段；
2. 只改三处：`DATA`、标题、容器尺寸；
3. **不要改** 颜色、圆角、阴影、图例间距 —— 这些是 token 的落点；
4. 若确需新样式，先改 `tokens/charts.json` 与对应规范，再回改片段，跑 `check-charts.js`。

## 三、通用规则（所有片段共享）

| 项 | 值 | 来源 |
| :--- | :--- | :--- |
| 网格线 / 轴线 | `#E1E5EB`（**所有线同色**） | 设计源 CSS |
| 轴标签 | 12px / `#6F7785` / 苹方-简 / 居中 | 设计源实测 |
| 柱宽 | `barWidth: 10` | iDux 默认 |
| 柱体渐变 | 竖 `180deg`、横 `270deg`（右→左，暗端在右） | 设计源 CSS |
| 柱体阴影 | `0 -4px 10px rgba(<基色>,0.16)` | 设计源 CSS |
| 图例 | 两列 / 列距 16 / 行距 12 / 数字右对齐 / 名称↔数字 8~48 / 与主体 24~64 | 设计源批注 |
| 数值标签 | `#2F3540` 12px | 已确认 |
| 状态 | 只实现 `正常`；加载用组件内置 `loading` | iDux 源码 |

## 四、新增片段的步骤

1. 复制最接近的片段 → 命名 `<家族>-<子类型>.html`；
2. 顶部注释写清 `CHART-*` 键与差异点（**检查器靠这行判断键是否被覆盖**）；
3. 在 `tokens/charts.json` 的 `chartKeys` 登记该键；
4. 在本文件清单加一行；
5. 跑 `node tools/check-charts.js`（应 0 错误 0 警告）。
