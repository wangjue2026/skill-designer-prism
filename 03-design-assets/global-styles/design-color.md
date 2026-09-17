# SeerDesign 色彩体系

## 目录
- [1.1 品牌色与应用规则](#11-品牌色与应用规则)
- [1.2 功能色规范](#12-功能色规范)
- [1.3 灰阶色板规范](#13-灰阶色板规范)
- [1.4 基础色板](#14-基础色板)
- [1.5 阴影规范](#15-阴影规范)

---

## 1.1 品牌色与应用规则

品牌色决定了界面的核心色调，所有交互元素必须遵循以下规则：

| Token 名称 | 交互状态/用途 | 具体色号 (Hex) | 备注 |
|-----------|-------------|---------------|------|
| blue-l50 | 选中背景 (Selected background) | #E8F4FF | 用于列表、菜单的选中态底色 |
| blue-l10 | 悬浮态 (Hover) | #4FA1FF | 用于按钮或交互元素的悬浮状态 |
| blue | 常态 (Normal / Primary) | #1C6EFF | 平台主色调，用于核心操作 |
| blue-d10 | 点击态 (Click) | #1458CC | 用于按钮或交互元素的点击状态 |
| turquoise | 点缀色 (Turquoise) | #6DD405 | 用于点缀和积极状态提示 |

## 1.2 功能色规范

用于传达状态、紧急程度等信息。

### 1.2.1 状态颜色 (Status)

| 状态含义 | Token 名称 | 具体色号 (Hex) | 适用场景 |
|---------|-----------|---------------|---------|
| 故障 | red-d10 | #CF171D | 错误、拦截、严重警告 |
| 正常/良好 | blue | #1C6EFF | 默认正常运行状态 |
| 在线/健康 | turquoise-d10 | #12A679 | 设备连接成功、运行平稳 |
| 离线 | graphite-d10 | #6F7785 | 未连接、不可用状态 |
| 未接入 | brown | #FDAA1D | 待初始化、未知状态 |

### 1.2.2 安全等级颜色 (Security Levels)

| 等级名称 | Token 名称 | 具体色号 (Hex) | 视觉反馈 |
|---------|-----------|---------------|---------|
| 失陷 | red-d30 | #82010E | 最高优先级告警 |
| 高危 | red-d10 | #CF171D | 严重安全隐患 |
| 中危 | orange | #FA721B | 需要关注的安全风险 |
| 中低危 | brown | #FDAA1D | 潜在的微小风险 |
| 低危 | graphite-d10 | #6F7785 | 一般性安全信息 |
| 信息 | cyan-d10 | #0BA7B5 | 纯信息同步，无威胁 |
| 安全 | turquoise-d10 | #12A679 | 安全检查通过 |

## 1.3 纯白色

| Token 名称 | 具体色号 (Hex) | 适用场景 |
|-----------|---------------|---------|
| --color-white | #FFFFFF | 组件背景、标签背景、按钮背景、边框内侧 |

## 1.4 灰阶色板规范

灰阶基于主色调调整的冷调灰色，用于组件背景、分割线及文字层级。

| 等级名称 | Token 名称 | 具体色号 (Hex) | 适用场景说明 |
|---------|-----------|---------------|-------------|
| 一级背景颜色 | graphite-l50 | #F7F9FC | 页面整体主背景色 |
| 二级背景颜色 | graphite-l40 | #EDF1F7 | 容器、卡片或内层区域背景 |
| 一级分割线 | graphite-l30 | #E1E5EB | 主要边框、组件外框线 |
| 二级分割线 | graphite-l20 | #D3D7DE | 列表项、内部分隔线 |
| 不可用文字 | graphite-l10 | #BEC3CC | 禁用状态 (Disabled) 的文本 |
| 提示文字 | graphite | #A1A7B3 | Placeholder 或极弱的提示语 |
| 辅助文字 | graphite-d10 | #6F7785 | 次要说明、备注文本 |
| 表头文字 | graphite-d20 | #5E6573 | 表格 Header、属性标签文本 |
| banner 大标题 | graphite-d30 | #454C59 | 顶部 Banner 或显眼的模块标题 |
| 正文 & 标题 | graphite-d40 | #2F3540 | 页面核心正文内容、主要标题 |
| 深色底色 | graphite-d50 | #1E232B | 极深背景或强调色块 |

## 1.5 基础色板

完整的 10 色系列，每色 10 个层级（从 l50 最浅到 d50 最深）。

### 1.5.1 色板矩阵

| 色系 | l50 | l40 | l30 | l20 | l10 | 主色 | d10 | d20 | d30 | d40 |
|-----|-----|-----|-----|-----|-----|------|-----|-----|-----|-----|
| **Red/枫红** | #FFF7F5 | #FFD3CC | #FFACA3 | #FF837A | #FF5752 | #F52727 | #CF171D | #A80A15 | #82010E | #5C000C |
| **Orange/破晓** | #FFF5E8 | #FFE0BF | #FFC996 | #FFAF6E | #FF9245 | #FA721B | #D4520D | #AD3802 | #872600 | #611800 |
| **Brown/大地** | #FFFAE8 | #FFF0BF | #FFE396 | #FFD36E | #FFC145 | #FDAA1D | #D6860D | #B06402 | #8A4900 | #633200 |
| **Yellow/丰收** | #FFFFE6 | #FFFEBD | #FFFA94 | #FFF36B | #FFE942 | #F8D81A | #D1AD0A | #AB8600 | #856300 | #5E4400 |
| **Bud/萌芽** | #FAFFE8 | #F0FFBF | #DCF792 | #C2EB65 | #A8DE3C | #8DD118 | #6BAB0A | #4C8501 | #325E00 | #1C3800 |
| **Green/极光** | #F2FFEB | #CEF5BA | #A7E88B | #81DB60 | #5DCF3A | #39C317 | #239C0B | #127502 | #084F00 | #032900 |
| **Turquoise/若竹** | #F5FFFA | #CCFFE7 | #9BF2CC | #6EE6B6 | #45D9A3 | #20CC94 | #12A679 | #088060 | #015945 | #003329 |
| **Cyan/湖蓝** | #E8FFFC | #BFFFFA | #96FFFA | #69F5F2 | #3FE5E8 | #19D2DB | #0BA7B5 | #017E8F | #005969 | #003642 |
| **Glacier/冰川** | #E8FAFF | #BFEFFF | #96E1FF | #6EADFF | #45BEFF | #1BA0F2 | #0C7CCC | #025CA6 | #004280 | #002B59 |
| **Blue/苍穹** | #E8F4FF | #BFDFFF | #96C7FF | #6EADFF | #458FFF | #1C6EFF | #0D51D9 | #0237B3 | #00258C | #001866 |
| **Indigo/深海** | #F0F3FF | #C7D0FF | #9EABFF | #7583FF | #4D58FF | #2229F6 | #1313CF | #0C07A8 | #090082 | #09005C |
| **Purple/星空** | #F8F0FF | #E4C7FF | #CD9EFF | #B375FF | #974DFF | #7824FF | #5914D9 | #3D07B3 | #28008C | #1A0066 |
| **Magenta/牡丹** | #FFEBF9 | #FFC2EF | #FC97E5 | #F069D5 | #E340C8 | #D619BE | #B00CA0 | #8A0381 | #630060 | #3D003D |

### 1.5.2 常用色值快速索引

**品牌蓝色系**：
- 主色：#1C6EFF
- 选中背景：#E8F4FF
- 悬浮态：#4FA1FF
- 点击态：#1458CC

**状态色系**：
- 成功/安全：#12A679 (turquoise-d10)
- 警告/中危：#FA721B (orange)
- 错误/高危：#CF171D (red-d10)
- 信息：#0BA7B5 (cyan-d10)

**金属色系**：
- 金色：#E7AA40 (gold)
- 银色：#A9B4C8 (silver)
- 铜色：#C97F58 (bronze)

---

## 1.6 阴影规范

阴影用于层级区分和交互反馈。

| 阴影 Token | 参数值 | 使用场景 |
|-----------|--------|---------|
| dropshadow-s1 | 0 1px 4px rgba(31, 35, 43, 0.16) | 卡片悬浮态、浮层基准层级 |
| dropshadow-s2 | 0 2px 8px rgba(31, 35, 43, 0.14) | 下拉面板、工具提示 |
| dropshadow-s3 | 0 4px 16px rgba(31, 35, 43, 0.12) | 弹窗、模态框 |

---

## 1.7 金属色板规范

金属色用于特定业务场景（如等级标识、资产分类等），不属于基础交互色系，不在 10 级色阶体系内。

| 色系 | Token 名称 | 具体色号 (Hex) | 说明 |
|-----|-----------|---------------|------|
| **Gold/金** | gold-l10 | #F5C76C | 金色浅色 |
| | gold | #E7AA40 | 金色主色 |
| | gold-d10 | #C2862D | 金色深色 |
| **Silver/银** | silver-l10 | #CBDED4 | 银色浅色 |
| | silver | #A9B4C8 | 银色主色 |
| | silver-d10 | #7F8AA1 | 银色深色 |
| **Bronze/铜** | bronze-l10 | #D6A181 | 铜色浅色 |
| | bronze | #C97F58 | 铜色主色 |
| | bronze-d10 | #A35F40 | 铜色深色 |

---

## 附录：色彩相关 CSS 变量定义

```css
:root {
  /* White */
  --color-white: #FFFFFF;

  /* Brand Colors */
  --color-blue-l50: #E8F4FF;
  --color-blue-l10: #4FA1FF;
  --color-blue: #1C6EFF;
  --color-blue-d10: #1458CC;
  --color-turquoise: #6DD405;

  /* Status Colors */
  --color-red-d10: #CF171D;
  --color-turquoise-d10: #12A679;
  --color-brown: #FDAA1D;
  --color-cyan-d10: #0BA7B5;

  /* Security Level Colors */
  --color-red-d30: #82010E;
  --color-orange: #FA721B;

  /* Metal Colors */
  --color-gold-l10: #F5C76C;
  --color-gold: #E7AA40;
  --color-gold-d10: #C2862D;
  --color-silver-l10: #CBDED4;
  --color-silver: #A9B4C8;
  --color-silver-d10: #7F8AA1;
  --color-bronze-l10: #D6A181;
  --color-bronze: #C97F58;
  --color-bronze-d10: #A35F40;

  /* Graphite / Grayscale */
  --color-graphite-l50: #F7F9FC;
  --color-graphite-l40: #EDF1F7;
  --color-graphite-l30: #E1E5EB;
  --color-graphite-l20: #D3D7DE;
  --color-graphite-l10: #BEC3CC;
  --color-graphite: #A1A7B3;
  --color-graphite-d10: #6F7785;
  --color-graphite-d20: #5E6573;
  --color-graphite-d30: #454C59;
  --color-graphite-d40: #2F3540;
  --color-graphite-d50: #1E232B;
}
```

字体相关 CSS 变量见 [字体与排版](design-typography.md#附录字体相关-css-变量定义)。

