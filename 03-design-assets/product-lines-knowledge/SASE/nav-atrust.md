# aTrust 零信任标准导航框架 (aTrust Navigation Boilerplate)

## ⚠️ 高频违规速查（生成/复用代码前必看）

> AI 在生成或复用 aTrust 导航代码前，必须先逐行核对此表；创建 Demo 时必须 **100% 复制** 文末「完整复用代码块」，仅允许在 `Main Workspace` 内填充业务内容。

| 规则 | ✅ 正确 | ❌ 常见错误 |
|:---|:---|:---|
| **复用方式** | 整页复制文末 HTML 代码块，保存至 `Demos/` 目录 | 手写骨架、删减菜单、改用其他导航结构 |
| **产品名称** | 固定为 **零信任控制中心** | 随意改名或省略 |
| **Header 高度** | **56px**，Logo **40×40px** | 使用 48px 或其他高度 |
| **一级菜单布局** | 三栏 Flex：左品牌区 + **中间绝对居中** 8 个 Tab + 右操作区 | 一级菜单靠左或靠右，未满 8 项 |
| **订阅切换器位置** | 紧邻产品名称右侧（左品牌区内） | 移到 Header 右侧操作区 |
| **一级 Tab 选中态** | 蓝底 `#1C6EFF` + 白字 + **18px 胶囊圆角** | 下划线 Tab、直角、灰色选中 |
| **Sider 宽度/底色** | 展开 **240px**，背景 **#272E38** | 200px、浅色侧栏 |
| **48px 阅读线** | L2/L3 文字起始 **48px**（24+16+8）；L4 文字 **60px** | 使用组件库默认缩进，各级错位 |
| **二级菜单图标选中** | 蓝绿渐变 `linear-gradient(90deg, #1C6EFF, #6DD405)`，需全局 `#icon-grad` SVG | 单色图标、无 SVG defs、图标隐身 |
| **小标题 (at-menu-group)** | 仅分组展示，`cursor: default`，**不可点击**、无选中态 | 小标题可点、参与展开或高亮 |
| **数据防泄密小标题** | 左间距 **48px**（非默认 28px） | 与其他模块小标题左间距混用 |
| **顶部导航记忆** | 切换一级菜单时恢复 `navDefaults` 对应末级项 | 每次切换重置为任意项或丢失展开态 |
| **二级菜单展开** | 手风琴互斥：`toggleL2` + Alpine `x-collapse` | 多个 L2 同时展开导致侧栏过长 |
| **依赖资源** | `ai-dem.css`（at-* 类）、`css-overrides.css`、`tailwind-config.js` | 遗漏样式文件导致导航样式崩塌 |
| **业务内容区** | 仅在 `<main>` / Main Workspace 内开发 | 修改 Header、Sider 结构或菜单数据 |

---

## 使用声明

本规范提供 **开箱即用的完整 HTML 实现**（见文末代码块），与视觉/交互设计规则一并作为 aTrust 导航的唯一标准来源。

- 创建 aTrust 导航 Demo 时：**必须 100% 使用文末代码块还原**，不得自行拼凑导航骨架。
- 允许修改的范围：`<main>` 内业务内容、`title`、页面级 `x-data` 扩展（勿破坏根级导航 `x-data`）。
- 禁止修改：顶部 Header 结构、左侧完整菜单树、`navDefaults` 键名与菜单 ID（`m_*`）映射逻辑。
- Demo 文件须保存于 `Demos/` 目录；资源路径 `./assets/` 相对于 `Demos/` 根目录。
- 若设计描述与项目 SeerDesign 技术栈冲突，优先遵守项目技术栈约束。

---

## 全局参数速查

| 参数 | 规范值 |
|-----|--------|
| 产品名称 | 零信任控制中心 |
| Header 高度 | 56px |
| Logo 尺寸 | 40×40px |
| 一级菜单数量 | 固定 8 个 |
| Sider 展开宽度 | 240px |
| Sider 背景色 | #272E38 |
| Sider 标题栏高度 | 48px |
| L2 图标区 | 左 24px + 16px 图标 + 8px 间距 → 文字 48px |
| L4 文字起始 | 60px（相对 L3 缩进 12px）+ 4px 圆点 |

### 一级菜单清单（固定顺序）

`监控中心` · `全球安全互联` · `零信任安全接入` · `互联网安全访问` · `数据保护` · `业务管理` · `系统管理` · `审计中心`

---

## 交互逻辑摘要

| 机制 | 规则 |
|-----|------|
| **状态变量** | `topNav`（一级）、`expandedL2` / `expandedL3`（展开）、`activeLeaf`（末级选中） |
| **切换一级** | `setTopNav(nav)` → 从 `navDefaults` 恢复 l2 / l3 / leaf |
| **切换二级** | `toggleL2(key, isLeaf)`：叶子项直接选中；有子项则展开/收起（互斥） |
| **切换三级** | `toggleL3(key)` 展开/收起四级 |
| **切换四级** | `toggleL4(key)` 设置 `activeLeaf` |
| **图标渐变** | 选中态 SVG `stroke="url(#icon-grad)"`，依赖页面顶部隐藏 SVG defs |

---

## 订阅模式过滤矩阵（摘要）

| 一级菜单 | 全订阅 | 分支组网 | 办公安全 |
|---------|:------:|:--------:|:--------:|
| 监控中心 | ✅ | ✅ | ✅ |
| 全球安全互联 | ✅ | ✅ | ❌ |
| 零信任安全接入 | ✅ | ❌ | ✅ |
| 互联网安全访问 | ✅ | ❌ | ✅ |
| 数据保护 | ✅ | ❌ | ✅ |
| 业务管理 | ✅ | ✅ | ✅ |
| 系统管理 | ✅ | ✅ | ✅ |
| 审计中心 | ✅ | ✅ | ✅ |

> 分支组网：监控中心隐藏「用户监控」；业务管理仅「设备管理」；审计中心仅「防火墙集中管理日志」「审计中心配置」。  
> 办公安全：隐藏「全球安全互联」；业务管理隐藏「设备管理」；审计中心隐藏「防火墙集中管理日志」。

---

## 完整菜单结构（树形参考）

```
监控中心
├─ 访问体验监测 → 概览 / 体验监控 / 监控配置
├─ 设备状态
├─ 用户监控 → 在线列表 / 用户状态 / 爆破锁定IP / 闲置账号
├─ 设备监控
└─ 告警管理 → 告警列表 / 告警设置 / 邮件告警配置

全球安全互联
├─ 防火墙集中管理 → TOPN / 策略管理 / 模版管理 / 设备视图
├─ SD-WAN组网 → VPN配置列表 / 拓扑管理 / 智能选路
├─ 全球加速 → 加速用量分析 / 加速配置 / 加速资源
└─ 下发任务管理

零信任安全接入（9 个二级模块，含安全雷达/威胁诱捕/UEM 等，见代码块）

互联网安全访问（含「分析」「策略」小标题分组）

数据保护（UEM 四级嵌套 + 数据防泄密，小标题左间距 48px）

业务管理 · 系统管理 · 审计中心（完整子项见代码块内菜单模板）
```

> 菜单 ID 规则：`m_{一级索引}_{二级}_{三级}_{四级}`，与代码块内 `activeLeaf` / `navDefaults` 保持一致，勿擅自重命名。

---

## 完整复用代码块

> 以下为开箱即用的完整 HTML 页面。创建 aTrust 导航 Demo 时 **必须整段复制**，保存为 `Demos/<页面名>.html`，仅在该文件 `<main>` 区域内追加业务内容。

```html
<!DOCTYPE html>
<html lang="zh-CN">

<head>
  <!-- aTrust 导航框架模版（Boilerplate）
  - 来源：总览+tab版.html 导航框架抽离
  - 包含：顶部一级导航 + 左侧多级菜单 + 空白业务内容区
  - 样式：./assets/css/ai-dem.css、./assets/css/css-overrides.css
  - 参考：SKillS/skill_seerdesign_demo_v2.0/SD Page Templates/boilerplate-l-nav.html
  - 使用：复制本文件，在 Main Workspace 区域内填充业务内容即可
-->

  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>aTrust 零信任控制中心 - 导航框架模版</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@400;500;600;700&display=swap"
    rel="stylesheet">

  <!-- 引入 SeerDesign 全局样式与 Token -->
  <link rel="stylesheet" href="./assets/css/css-overrides.css">

  <!-- 引入 Alpine.js 及 Collapse 插件实现顺滑手风琴折叠 -->
  <script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.x.x/dist/cdn.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

  <!-- 引入 Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="./assets/js/tailwind-config.js"></script>

  <link rel="stylesheet" href="./assets/css/ai-dem.css" />
</head>

<body class="bg-bg-light text-text font-sans overflow-hidden w-screen h-screen">

  <!-- ======================================================
    Global SVG Definitions / 全局 SVG 定义
    用途：定义全局渐变，用于图标渲染，避免 background-clip 导致隐身。
    排障提示：如图标渐变、发光、颜色异常，优先检查此区域和 assets/css/ai-dem.css。
  ======================================================= -->
  <svg aria-hidden="true" style="position: absolute; width: 0; height: 0; overflow: hidden;" version="1.1"
    xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="icon-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#1C6EFF" />
        <stop offset="100%" stop-color="#6DD405" />
      </linearGradient>
    </defs>
  </svg>

  <!-- ======================================================
    App Root State / 应用根级交互状态
    用途：维护顶部导航、左侧菜单展开项、当前叶子菜单、全局抽屉开关等 Alpine 状态。
    排障提示：如导航切换、菜单高亮、抽屉打开异常，优先检查此 x-data。
  ======================================================= -->
  <div class="flex flex-col w-full h-full" x-data="{
         topNav: '监控中心',
         expandedL2: 'm_0_0', 
         expandedL3: '',
         activeLeaf: 'm_0_0_0',
         navDefaults: {
           '监控中心': { l2: 'm_0_0', l3: '', leaf: 'm_0_0_0' },
           '全球安全互联': { l2: 'm_1_0', l3: '', leaf: 'm_1_0_0' },
           '零信任安全接入': { l2: '', l3: '', leaf: 'm_2_0' },
           '互联网安全访问': { l2: '', l3: '', leaf: 'm_3_0' },
           '数据保护': { l2: 'm_4_0', l3: 'm_4_0_0', leaf: 'm_4_0_0_0' },
           '业务管理': { l2: '', l3: '', leaf: 'm_5_0' },
           '系统管理': { l2: 'm_6_0', l3: '', leaf: 'm_6_0_0' },
           '审计中心': { l2: 'm_7_0', l3: '', leaf: 'm_7_0_0' }
         },
         setTopNav(nav) {
           this.topNav = nav;
           const d = this.navDefaults[nav];
           if(d) {
             this.expandedL2 = d.l2; this.expandedL3 = d.l3; this.activeLeaf = d.leaf;
           }
         },
         toggleL2(key, isLeaf = false) {
           if(isLeaf) { this.activeLeaf = key; this.expandedL2 = key; this.expandedL3 = ''; } 
           else { this.expandedL2 = this.expandedL2 === key ? '' : key; }
         },
         toggleL3(key) { this.expandedL3 = this.expandedL3 === key ? '' : key; },
         toggleL4(key) { this.activeLeaf = key; }
       }">

    <!-- ======================================================
      Header / 顶部导航栏，固定高度 56px
      包含：Logo、产品标题、顶部一级导航、右侧用户入口。
      排障提示：如顶部导航切换异常，检查 setTopNav(nav) 和 navDefaults。
    ======================================================= -->
    <header class="h-[56px] min-h-[56px] bg-white border-b border-bg-line flex items-center px-4 flex-shrink-0 z-30">
      <div class="flex items-center w-[280px] flex-shrink-0">
        <img src="https://i.imgur.com/jrWvSot.png" alt="Logo" class="w-[40px] h-[40px] object-contain flex-shrink-0">
        <span class="ml-3 text-lg font-semibold text-text-title whitespace-nowrap">零信任控制中心</span>
        <div class="ml-6 flex items-center gap-1 cursor-pointer text-xs text-text-title">
          <span>全订阅</span>
          <svg class="w-3 h-3 text-text-mute" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>

      <!-- 中间 NavCenter -->
      <div class="flex-1 flex justify-center">
        <div class="flex items-center gap-1">
          <template x-for="nav in ['监控中心', '全球安全互联', '零信任安全接入', '互联网安全访问', '数据保护', '业务管理', '系统管理', '审计中心']">
            <div class="at-top-nav-item" :class="topNav === nav && 'active'" @click="setTopNav(nav)" x-text="nav"></div>
          </template>
        </div>
      </div>

      <div class="flex items-center gap-4 w-[280px] justify-end pr-4">
        <svg class="w-4 h-4 text-text-title cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <div class="flex items-center gap-2 cursor-pointer">
          <div class="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center font-semibold text-xs">A
          </div>
          <span class="text-xs font-medium text-text-title">Admin</span>
        </div>
      </div>
    </header>

    <!-- ======================================================
      App Layout Shell / 应用主体布局容器
      包含：左侧 Sider 菜单 + 右侧 Main Workspace。
      排障提示：如页面高度、滚动、左右区域挤压异常，优先检查此布局容器和 overflow 设置。
    ======================================================= -->
    <div class="flex-1 flex overflow-hidden">

      <!-- ======================================================
        Sidebar / 左侧导航菜单，宽度约 240px
        包含：按 topNav 切换的二级、三级、四级菜单。
        排障提示：如菜单展开/收起、高亮、默认选中异常，检查 expandedL2、expandedL3、activeLeaf。
      ======================================================= -->
      <aside class="at-sider flex flex-col flex-shrink-0 select-none">
        <div class="at-sider-title flex-shrink-0">
          <span x-text="topNav"></span>
          <svg class="w-4 h-4 opacity-60 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </div>
        <div class="flex-1 overflow-y-auto py-2 custom-scrollbar">
          <template x-if="topNav === '监控中心'">
            <div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_0_0' || activeLeaf.startsWith('m_0_0_')) ? 'active' : (expandedL2 === 'm_0_0' ? 'text-white' : '')"
                @click="toggleL2('m_0_0')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_0_0' || activeLeaf.startsWith('m_0_0_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 12h-4l-3 9L9 3l-3 9H2">
                  </path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_0_0' || activeLeaf.startsWith('m_0_0_')) ? 'font-semibold' : ''">访问体验监测</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_0_0' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_0_0'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_0_0_0' ? 'active' : ''" @click="toggleL4('m_0_0_0')">
                  概览</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_0_0_1' ? 'active' : ''" @click="toggleL4('m_0_0_1')">
                  体验监控</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_0_0_2' ? 'active' : ''" @click="toggleL4('m_0_0_2')">
                  监控配置</div>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_0_1' ? 'active' : ''" @click="toggleL2('m_0_1', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_0_1' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm0 10a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM6 15h.01M6 7h.01">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_0_1' ? 'font-semibold' : ''">设备状态</span>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_0_2' || activeLeaf.startsWith('m_0_2_')) ? 'active' : (expandedL2 === 'm_0_2' ? 'text-white' : '')"
                @click="toggleL2('m_0_2')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_0_2' || activeLeaf.startsWith('m_0_2_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z">
                  </path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_0_2' || activeLeaf.startsWith('m_0_2_')) ? 'font-semibold' : ''">用户监控</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_0_2' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_0_2'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_0_2_0' ? 'active' : ''" @click="toggleL4('m_0_2_0')">
                  在线列表</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_0_2_1' ? 'active' : ''" @click="toggleL4('m_0_2_1')">
                  用户状态</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_0_2_2' ? 'active' : ''" @click="toggleL4('m_0_2_2')">
                  爆破锁定IP</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_0_2_3' ? 'active' : ''" @click="toggleL4('m_0_2_3')">
                  闲置账号</div>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_0_3' ? 'active' : ''" @click="toggleL2('m_0_3', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_0_3' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 17v-6a2 2 0 012-2h2m4 8V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10"></path>
                </svg>
                <span :class="activeLeaf === 'm_0_3' ? 'font-semibold' : ''">设备监控</span>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_0_4' || activeLeaf.startsWith('m_0_4_')) ? 'active' : (expandedL2 === 'm_0_4' ? 'text-white' : '')"
                @click="toggleL2('m_0_4')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_0_4' || activeLeaf.startsWith('m_0_4_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9">
                  </path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_0_4' || activeLeaf.startsWith('m_0_4_')) ? 'font-semibold' : ''">告警管理</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_0_4' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_0_4'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_0_4_0' ? 'active' : ''" @click="toggleL4('m_0_4_0')">
                  告警列表</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_0_4_1' ? 'active' : ''" @click="toggleL4('m_0_4_1')">
                  告警设置</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_0_4_2' ? 'active' : ''" @click="toggleL4('m_0_4_2')">
                  邮件告警配置</div>
              </div>
            </div>
          </template>
          <template x-if="topNav === '全球安全互联'">
            <div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_1_0' || activeLeaf.startsWith('m_1_0_')) ? 'active' : (expandedL2 === 'm_1_0' ? 'text-white' : '')"
                @click="toggleL2('m_1_0')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_1_0' || activeLeaf.startsWith('m_1_0_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_1_0' || activeLeaf.startsWith('m_1_0_')) ? 'font-semibold' : ''">防火墙集中管理</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_1_0' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_1_0'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_1_0_0' ? 'active' : ''" @click="toggleL4('m_1_0_0')">
                  TOPN</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_1_0_1' ? 'active' : ''" @click="toggleL4('m_1_0_1')">
                  策略管理</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_1_0_2' ? 'active' : ''" @click="toggleL4('m_1_0_2')">
                  模版管理</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_1_0_3' ? 'active' : ''" @click="toggleL4('m_1_0_3')">
                  设备视图</div>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_1_1' || activeLeaf.startsWith('m_1_1_')) ? 'active' : (expandedL2 === 'm_1_1' ? 'text-white' : '')"
                @click="toggleL2('m_1_1')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_1_1' || activeLeaf.startsWith('m_1_1_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v3a2 2 0 002 2h4a2 2 0 002-2V8a2 2 0 00-2-2zm0 10H6a2 2 0 00-2 2v3a2 2 0 002 2h4a2 2 0 002-2v-3a2 2 0 00-2-2zm10-5h-4a2 2 0 00-2 2v3a2 2 0 002 2h4a2 2 0 002-2v-3a2 2 0 00-2-2zM12 9h4M12 19h4M8 11v5">
                  </path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_1_1' || activeLeaf.startsWith('m_1_1_')) ? 'font-semibold' : ''">SD-WAN组网</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_1_1' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_1_1'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_1_1_0' ? 'active' : ''" @click="toggleL4('m_1_1_0')">
                  VPN配置列表</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_1_1_1' ? 'active' : ''" @click="toggleL4('m_1_1_1')">
                  拓扑管理</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_1_1_2' ? 'active' : ''" @click="toggleL4('m_1_1_2')">
                  智能选路</div>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_1_2' || activeLeaf.startsWith('m_1_2_')) ? 'active' : (expandedL2 === 'm_1_2' ? 'text-white' : '')"
                @click="toggleL2('m_1_2')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_1_2' || activeLeaf.startsWith('m_1_2_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z">
                  </path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_1_2' || activeLeaf.startsWith('m_1_2_')) ? 'font-semibold' : ''">全球加速</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_1_2' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_1_2'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_1_2_0' ? 'active' : ''" @click="toggleL4('m_1_2_0')">
                  加速用量分析</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_1_2_1' ? 'active' : ''" @click="toggleL4('m_1_2_1')">
                  加速配置</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_1_2_2' ? 'active' : ''" @click="toggleL4('m_1_2_2')">
                  加速资源</div>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_1_3' ? 'active' : ''" @click="toggleL2('m_1_3', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_1_3' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_1_3' ? 'font-semibold' : ''">下发任务管理</span>
              </div>
            </div>
          </template>
          <template x-if="topNav === '零信任安全接入'">
            <div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_2_0' ? 'active' : ''" @click="toggleL2('m_2_0', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_2_0' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z M4 10h16 M10 10v10"></path>
                </svg>
                <span :class="activeLeaf === 'm_2_0' ? 'font-semibold' : ''">安全概览</span>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_2_1' || activeLeaf.startsWith('m_2_1_')) ? 'active' : (expandedL2 === 'm_2_1' ? 'text-white' : '')"
                @click="toggleL2('m_2_1')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_2_1' || activeLeaf.startsWith('m_2_1_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 22a10 10 0 100-20 10 10 0 000 20z M12 16a4 4 0 100-8 4 4 0 000 8z M12 2v4 M12 18v4 M2 12h4 M18 12h4">
                  </path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_2_1' || activeLeaf.startsWith('m_2_1_')) ? 'font-semibold' : ''">安全雷达</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_2_1' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_2_1'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_2_1_0' ? 'active' : ''" @click="toggleL4('m_2_1_0')">
                  防线可视</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_2_1_1' ? 'active' : ''" @click="toggleL4('m_2_1_1')">
                  实体调查</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_2_1_2' ? 'active' : ''" @click="toggleL4('m_2_1_2')">
                  行为洞察</div>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_2_2' || activeLeaf.startsWith('m_2_2_')) ? 'active' : (expandedL2 === 'm_2_2' ? 'text-white' : '')"
                @click="toggleL2('m_2_2')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_2_2' || activeLeaf.startsWith('m_2_2_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 8V6a6 6 0 1112 0v2m-9 4v4m6-4v4"></path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_2_2' || activeLeaf.startsWith('m_2_2_')) ? 'font-semibold' : ''">威胁诱捕</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_2_2' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_2_2'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_2_2_0' ? 'active' : ''" @click="toggleL4('m_2_2_0')">
                  蜜罐主机</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_2_2_1' ? 'active' : ''" @click="toggleL4('m_2_2_1')">
                  诱捕策略</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_2_2_2' ? 'active' : ''" @click="toggleL4('m_2_2_2')">
                  诱捕日志</div>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_2_3' || activeLeaf.startsWith('m_2_3_')) ? 'active' : (expandedL2 === 'm_2_3' ? 'text-white' : '')"
                @click="toggleL2('m_2_3')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_2_3' || activeLeaf.startsWith('m_2_3_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 20v-2M6.5 15.5l-2 2M17.5 15.5l2 2M5 10H3M21 10h-2M6.5 4.5l-2-2M17.5 4.5l2-2M15 10a3 3 0 01-6 0c0-1.5.5-3 3-5s3 3.5 3 5z">
                  </path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_2_3' || activeLeaf.startsWith('m_2_3_')) ? 'font-semibold' : ''">恶意识别</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_2_3' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_2_3'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_2_3_0' ? 'active' : ''" @click="toggleL4('m_2_3_0')">
                  恶意文件分析</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_2_3_1' ? 'active' : ''" @click="toggleL4('m_2_3_1')">
                  恶意流量检测</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_2_3_2' ? 'active' : ''" @click="toggleL4('m_2_3_2')">
                  恶意样本库</div>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_2_4' ? 'active' : ''" @click="toggleL2('m_2_4', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_2_4' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span :class="activeLeaf === 'm_2_4' ? 'font-semibold' : ''">处置策略</span>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_2_5' || activeLeaf.startsWith('m_2_5_')) ? 'active' : (expandedL2 === 'm_2_5' ? 'text-white' : '')"
                @click="toggleL2('m_2_5')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_2_5' || activeLeaf.startsWith('m_2_5_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 6h16v12H4z M8 6v4 M12 6v6 M16 6v4"></path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_2_5' || activeLeaf.startsWith('m_2_5_')) ? 'font-semibold' : ''">安全基线</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_2_5' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_2_5'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_2_5_0' ? 'active' : ''" @click="toggleL4('m_2_5_0')">
                  应用防护策略</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_2_5_1' ? 'active' : ''" @click="toggleL4('m_2_5_1')">
                  上线准入策略</div>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_2_6' || activeLeaf.startsWith('m_2_6_')) ? 'active' : (expandedL2 === 'm_2_6' ? 'text-white' : '')"
                @click="toggleL2('m_2_6')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_2_6' || activeLeaf.startsWith('m_2_6_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21">
                  </path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_2_6' || activeLeaf.startsWith('m_2_6_')) ? 'font-semibold' : ''">服务隐身</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_2_6' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_2_6'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_2_6_0' ? 'active' : ''" @click="toggleL4('m_2_6_0')">
                  SPA防护</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_2_6_1' ? 'active' : ''" @click="toggleL4('m_2_6_1')">
                  安全码管理</div>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_2_7' || activeLeaf.startsWith('m_2_7_')) ? 'active' : (expandedL2 === 'm_2_7' ? 'text-white' : '')"
                @click="toggleL2('m_2_7')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_2_7' || activeLeaf.startsWith('m_2_7_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_2_7' || activeLeaf.startsWith('m_2_7_')) ? 'font-semibold' : ''">虚拟网络域</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_2_7' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_2_7'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_2_7_0' ? 'active' : ''" @click="toggleL4('m_2_7_0')">
                  网络域管理</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_2_7_1' ? 'active' : ''" @click="toggleL4('m_2_7_1')">
                  网络切换策略</div>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_2_8' ? 'active' : ''" @click="toggleL2('m_2_8', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_2_8' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_2_8' ? 'font-semibold' : ''">第三方安全集成</span>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_2_9' ? 'active' : ''" @click="toggleL2('m_2_9', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_2_9' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z M8 10l2 2-2 2 M14 14h2"></path>
                </svg>
                <span :class="activeLeaf === 'm_2_9' ? 'font-semibold' : ''">可信进程</span>
              </div>
            </div>
          </template>
          <template x-if="topNav === '互联网安全访问'">
            <div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_3_0' ? 'active' : ''" @click="toggleL2('m_3_0', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_3_0' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z M4 10h16 M10 10v10"></path>
                </svg>
                <span :class="activeLeaf === 'm_3_0' ? 'font-semibold' : ''">互联网安全访问概览</span>
              </div>
              <div class="at-menu-group" style="padding-left: 28px;">分析</div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_3_2' ? 'active' : ''" @click="toggleL2('m_3_2', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_3_2' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z M8 14v-4 M12 14v-6 M16 14v-8">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_3_2' ? 'font-semibold' : ''">上网行为分析</span>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_3_3' ? 'active' : ''" @click="toggleL2('m_3_3', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_3_3' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_3_3' ? 'font-semibold' : ''">上网管控分析</span>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_3_4' ? 'active' : ''" @click="toggleL2('m_3_4', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_3_4' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4 M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_3_4' ? 'font-semibold' : ''">云威胁情报分析</span>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_3_5' ? 'active' : ''" @click="toggleL2('m_3_5', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_3_5' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 22a10 10 0 100-20 10 10 0 000 20z M12 16a4 4 0 100-8 4 4 0 000 8z M12 2v4 M12 18v4 M2 12h4 M18 12h4">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_3_5' ? 'font-semibold' : ''">风险终端分析</span>
              </div>
              <div class="at-menu-group" style="padding-left: 28px;">策略</div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_3_7' ? 'active' : ''" @click="toggleL2('m_3_7', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_3_7' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 6a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zm10 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_3_7' ? 'font-semibold' : ''">互联网应用管控</span>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_3_8' ? 'active' : ''" @click="toggleL2('m_3_8', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_3_8' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 17v1a3 3 0 11-6 0v-1m6 0a3 3 0 006 0v-1m-6 0H9 M15 10a3 3 0 11-6 0 3 3 0 016 0z M17.5 12.5L21 16">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_3_8' ? 'font-semibold' : ''">互联网应用审计</span>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_3_9' ? 'active' : ''" @click="toggleL2('m_3_9', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_3_9' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span :class="activeLeaf === 'm_3_9' ? 'font-semibold' : ''">威胁管理</span>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_3_10' ? 'active' : ''"
                @click="toggleL2('m_3_10', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_3_10' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 7h8M8 11h8M10 3v4M14 3v4M12 15v6"></path>
                </svg>
                <span :class="activeLeaf === 'm_3_10' ? 'font-semibold' : ''">接入管理</span>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_3_11' ? 'active' : ''"
                @click="toggleL2('m_3_11', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_3_11' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_3_11' ? 'font-semibold' : ''">SSL解密配置</span>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_3_12' ? 'active' : ''"
                @click="toggleL2('m_3_12', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_3_12' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 10h10a8 8 0 018 8v2 M3 10l6 6 M3 10l6-6"></path>
                </svg>
                <span :class="activeLeaf === 'm_3_12' ? 'font-semibold' : ''">重定向设置</span>
              </div>
            </div>
          </template>
          <template x-if="topNav === '数据保护'">
            <div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_4_0' || activeLeaf.startsWith('m_4_0_')) ? 'active' : (expandedL2 === 'm_4_0' ? 'text-white' : '')"
                @click="toggleL2('m_4_0')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_4_0' || activeLeaf.startsWith('m_4_0_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_4_0' || activeLeaf.startsWith('m_4_0_')) ? 'font-semibold' : ''">UEM</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_4_0' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_4_0'" x-collapse x-cloak>
                <div class="at-menu-l3"
                  :class="(activeLeaf === 'm_4_0_0' || activeLeaf.startsWith('m_4_0_0_')) ? 'text-white' : ''"
                  @click="toggleL3('m_4_0_0')">
                  <span
                    :class="(activeLeaf === 'm_4_0_0' || activeLeaf.startsWith('m_4_0_0_')) ? 'font-semibold' : ''">移动数据安全</span>
                  <svg class="ml-auto w-3 h-3 opacity-60 transition-transform"
                    :class="expandedL3 === 'm_4_0_0' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                <div x-show="expandedL3 === 'm_4_0_0'" x-collapse x-cloak>
                  <div class="at-menu-l4" :class="activeLeaf === 'm_4_0_0_0' ? 'active' : ''"
                    @click="toggleL4('m_4_0_0_0')">
                    <span class="w-1 h-1 rounded-full flex-shrink-0"
                      :class="activeLeaf === 'm_4_0_0_0' ? 'bg-white' : 'bg-[#6F7785]'"></span>
                    <span class="ml-2">终端管控</span>
                  </div>
                  <div class="at-menu-l4" :class="activeLeaf === 'm_4_0_0_1' ? 'active' : ''"
                    @click="toggleL4('m_4_0_0_1')">
                    <span class="w-1 h-1 rounded-full flex-shrink-0"
                      :class="activeLeaf === 'm_4_0_0_1' ? 'bg-white' : 'bg-[#6F7785]'"></span>
                    <span class="ml-2">应用管控</span>
                  </div>
                  <div class="at-menu-l4" :class="activeLeaf === 'm_4_0_0_2' ? 'active' : ''"
                    @click="toggleL4('m_4_0_0_2')">
                    <span class="w-1 h-1 rounded-full flex-shrink-0"
                      :class="activeLeaf === 'm_4_0_0_2' ? 'bg-white' : 'bg-[#6F7785]'"></span>
                    <span class="ml-2">数据管控</span>
                  </div>
                </div>
                <div class="at-menu-l3"
                  :class="(activeLeaf === 'm_4_0_1' || activeLeaf.startsWith('m_4_0_1_')) ? 'text-white' : ''"
                  @click="toggleL3('m_4_0_1')">
                  <span
                    :class="(activeLeaf === 'm_4_0_1' || activeLeaf.startsWith('m_4_0_1_')) ? 'font-semibold' : ''">PC数据安全</span>
                  <svg class="ml-auto w-3 h-3 opacity-60 transition-transform"
                    :class="expandedL3 === 'm_4_0_1' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                <div x-show="expandedL3 === 'm_4_0_1'" x-collapse x-cloak>
                  <div class="at-menu-l4" :class="activeLeaf === 'm_4_0_1_0' ? 'active' : ''"
                    @click="toggleL4('m_4_0_1_0')">
                    <span class="w-1 h-1 rounded-full flex-shrink-0"
                      :class="activeLeaf === 'm_4_0_1_0' ? 'bg-white' : 'bg-[#6F7785]'"></span>
                    <span class="ml-2">终端管控</span>
                  </div>
                  <div class="at-menu-l4" :class="activeLeaf === 'm_4_0_1_1' ? 'active' : ''"
                    @click="toggleL4('m_4_0_1_1')">
                    <span class="w-1 h-1 rounded-full flex-shrink-0"
                      :class="activeLeaf === 'm_4_0_1_1' ? 'bg-white' : 'bg-[#6F7785]'"></span>
                    <span class="ml-2">应用管控</span>
                  </div>
                  <div class="at-menu-l4" :class="activeLeaf === 'm_4_0_1_2' ? 'active' : ''"
                    @click="toggleL4('m_4_0_1_2')">
                    <span class="w-1 h-1 rounded-full flex-shrink-0"
                      :class="activeLeaf === 'm_4_0_1_2' ? 'bg-white' : 'bg-[#6F7785]'"></span>
                    <span class="ml-2">数据管控</span>
                  </div>
                </div>
                <div class="at-menu-l3"
                  :class="(activeLeaf === 'm_4_0_2' || activeLeaf.startsWith('m_4_0_2_')) ? 'text-white' : ''"
                  @click="toggleL3('m_4_0_2')">
                  <span
                    :class="(activeLeaf === 'm_4_0_2' || activeLeaf.startsWith('m_4_0_2_')) ? 'font-semibold' : ''">审批管理</span>
                  <svg class="ml-auto w-3 h-3 opacity-60 transition-transform"
                    :class="expandedL3 === 'm_4_0_2' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                <div x-show="expandedL3 === 'm_4_0_2'" x-collapse x-cloak>
                  <div class="at-menu-l4" :class="activeLeaf === 'm_4_0_2_0' ? 'active' : ''"
                    @click="toggleL4('m_4_0_2_0')">
                    <span class="w-1 h-1 rounded-full flex-shrink-0"
                      :class="activeLeaf === 'm_4_0_2_0' ? 'bg-white' : 'bg-[#6F7785]'"></span>
                    <span class="ml-2">审批流程</span>
                  </div>
                  <div class="at-menu-l4" :class="activeLeaf === 'm_4_0_2_1' ? 'active' : ''"
                    @click="toggleL4('m_4_0_2_1')">
                    <span class="w-1 h-1 rounded-full flex-shrink-0"
                      :class="activeLeaf === 'm_4_0_2_1' ? 'bg-white' : 'bg-[#6F7785]'"></span>
                    <span class="ml-2">审批记录</span>
                  </div>
                </div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_4_0_3' ? 'active' : ''" @click="toggleL4('m_4_0_3')">
                  UEM高级设置</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_4_0_4' ? 'active' : ''" @click="toggleL4('m_4_0_4')">
                  UEM授权终端统计</div>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_4_1' || activeLeaf.startsWith('m_4_1_')) ? 'active' : (expandedL2 === 'm_4_1' ? 'text-white' : '')"
                @click="toggleL2('m_4_1')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_4_1' || activeLeaf.startsWith('m_4_1_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z M15 10V7">
                  </path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_4_1' || activeLeaf.startsWith('m_4_1_')) ? 'font-semibold' : ''">数据防泄密</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_4_1' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_4_1'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_4_1_0' ? 'active' : ''" @click="toggleL4('m_4_1_0')">
                  数据防泄密概览</div>
                <div class="at-menu-group" style="padding-left: 48px;">分析</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_4_1_2' ? 'active' : ''" @click="toggleL4('m_4_1_2')">
                  数据外发分析</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_4_1_3' ? 'active' : ''" @click="toggleL4('m_4_1_3')">
                  泄密事件分析</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_4_1_4' ? 'active' : ''" @click="toggleL4('m_4_1_4')">
                  泄密风险用户</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_4_1_5' ? 'active' : ''" @click="toggleL4('m_4_1_5')">
                  泄密追溯中心</div>
                <div class="at-menu-group" style="padding-left: 48px;">策略</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_4_1_7' ? 'active' : ''" @click="toggleL4('m_4_1_7')">
                  终端泄密审计</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_4_1_8' ? 'active' : ''" @click="toggleL4('m_4_1_8')">
                  终端泄密管控</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_4_1_9' ? 'active' : ''" @click="toggleL4('m_4_1_9')">
                  泄密分析规则</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_4_1_10' ? 'active' : ''"
                  @click="toggleL4('m_4_1_10')">敏感对象定义</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_4_1_11' ? 'active' : ''"
                  @click="toggleL4('m_4_1_11')">高级配置</div>
              </div>
            </div>
          </template>
          <template x-if="topNav === '业务管理'">
            <div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_5_0' ? 'active' : ''" @click="toggleL2('m_5_0', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_5_0' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_5_0' ? 'font-semibold' : ''">用户与角色</span>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_5_1' || activeLeaf.startsWith('m_5_1_')) ? 'active' : (expandedL2 === 'm_5_1' ? 'text-white' : '')"
                @click="toggleL2('m_5_1')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_5_1' || activeLeaf.startsWith('m_5_1_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z">
                  </path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_5_1' || activeLeaf.startsWith('m_5_1_')) ? 'font-semibold' : ''">认证管理</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_5_1' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_5_1'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_1_0' ? 'active' : ''" @click="toggleL4('m_5_1_0')">
                  认证服务器</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_1_1' ? 'active' : ''" @click="toggleL4('m_5_1_1')">
                  认证策略</div>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_5_2' || activeLeaf.startsWith('m_5_2_')) ? 'active' : (expandedL2 === 'm_5_2' ? 'text-white' : '')"
                @click="toggleL2('m_5_2')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_5_2' || activeLeaf.startsWith('m_5_2_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 6a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zm10 0a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z">
                  </path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_5_2' || activeLeaf.startsWith('m_5_2_')) ? 'font-semibold' : ''">应用管理</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_5_2' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_5_2'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_2_0' ? 'active' : ''" @click="toggleL4('m_5_2_0')">
                  应用列表</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_2_1' ? 'active' : ''" @click="toggleL4('m_5_2_1')">
                  应用授权</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_2_2' ? 'active' : ''" @click="toggleL4('m_5_2_2')">
                  应用权限审批</div>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_5_3' || activeLeaf.startsWith('m_5_3_')) ? 'active' : (expandedL2 === 'm_5_3' ? 'text-white' : '')"
                @click="toggleL2('m_5_3')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_5_3' || activeLeaf.startsWith('m_5_3_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_5_3' || activeLeaf.startsWith('m_5_3_')) ? 'font-semibold' : ''">终端管理</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_5_3' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_5_3'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_3_0' ? 'active' : ''" @click="toggleL4('m_5_3_0')">
                  终端资产</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_3_1' ? 'active' : ''" @click="toggleL4('m_5_3_1')">
                  软件管理</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_3_2' ? 'active' : ''" @click="toggleL4('m_5_3_2')">
                  终端管控</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_3_3' ? 'active' : ''" @click="toggleL4('m_5_3_3')">
                  终端日志获取</div>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_5_4' || activeLeaf.startsWith('m_5_4_')) ? 'active' : (expandedL2 === 'm_5_4' ? 'text-white' : '')"
                @click="toggleL2('m_5_4')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_5_4' || activeLeaf.startsWith('m_5_4_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm0 10a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM6 15h.01M6 7h.01">
                  </path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_5_4' || activeLeaf.startsWith('m_5_4_')) ? 'font-semibold' : ''">设备管理</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_5_4' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_5_4'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_4_0' ? 'active' : ''" @click="toggleL4('m_5_4_0')">
                  设备列表</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_4_1' ? 'active' : ''" @click="toggleL4('m_5_4_1')">
                  设备备份</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_4_2' ? 'active' : ''" @click="toggleL4('m_5_4_2')">
                  版本补丁包升级</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_4_3' ? 'active' : ''" @click="toggleL4('m_5_4_3')">
                  规则库升级</div>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_5_5' || activeLeaf.startsWith('m_5_5_')) ? 'active' : (expandedL2 === 'm_5_5' ? 'text-white' : '')"
                @click="toggleL2('m_5_5')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_5_5' || activeLeaf.startsWith('m_5_5_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                  </path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_5_5' || activeLeaf.startsWith('m_5_5_')) ? 'font-semibold' : ''">策略管理</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_5_5' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_5_5'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_5_0' ? 'active' : ''" @click="toggleL4('m_5_5_0')">
                  全局策略</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_5_1' ? 'active' : ''" @click="toggleL4('m_5_5_1')">
                  用户策略</div>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_5_6' || activeLeaf.startsWith('m_5_6_')) ? 'active' : (expandedL2 === 'm_5_6' ? 'text-white' : '')"
                @click="toggleL2('m_5_6')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_5_6' || activeLeaf.startsWith('m_5_6_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10">
                  </path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_5_6' || activeLeaf.startsWith('m_5_6_')) ? 'font-semibold' : ''">对象管理</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_5_6' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_5_6'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_6_0' ? 'active' : ''" @click="toggleL4('m_5_6_0')">
                  网络区域</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_6_1' ? 'active' : ''" @click="toggleL4('m_5_6_1')">
                  IP地址</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_6_2' ? 'active' : ''" @click="toggleL4('m_5_6_2')">
                  文件类型组</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_6_3' ? 'active' : ''" @click="toggleL4('m_5_6_3')">
                  终端应用库</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_6_4' ? 'active' : ''" @click="toggleL4('m_5_6_4')">
                  应用识别库</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_6_5' ? 'active' : ''" @click="toggleL4('m_5_6_5')">
                  URL分类库</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_6_6' ? 'active' : ''" @click="toggleL4('m_5_6_6')">
                  进程库</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_5_6_7' ? 'active' : ''" @click="toggleL4('m_5_6_7')">
                  时间计划</div>
              </div>
            </div>
          </template>
          <template x-if="topNav === '系统管理'">
            <div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_6_0' || activeLeaf.startsWith('m_6_0_')) ? 'active' : (expandedL2 === 'm_6_0' ? 'text-white' : '')"
                @click="toggleL2('m_6_0')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_6_0' || activeLeaf.startsWith('m_6_0_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_6_0' || activeLeaf.startsWith('m_6_0_')) ? 'font-semibold' : ''">管理员配置</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_6_0' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_6_0'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_6_0_0' ? 'active' : ''" @click="toggleL4('m_6_0_0')">
                  管理员账号</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_6_0_1' ? 'active' : ''" @click="toggleL4('m_6_0_1')">
                  管理员认证</div>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_6_1' ? 'active' : ''" @click="toggleL2('m_6_1', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_6_1' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_6_1' ? 'font-semibold' : ''">系统配置</span>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_6_2' ? 'active' : ''" @click="toggleL2('m_6_2', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_6_2' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_6_2' ? 'font-semibold' : ''">客户端个性配置</span>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_6_3' ? 'active' : ''" @click="toggleL2('m_6_3', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_6_3' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v3a2 2 0 002 2h4a2 2 0 002-2V8a2 2 0 00-2-2zm0 10H6a2 2 0 00-2 2v3a2 2 0 002 2h4a2 2 0 002-2v-3a2 2 0 00-2-2zm10-5h-4a2 2 0 00-2 2v3a2 2 0 002 2h4a2 2 0 002-2v-3a2 2 0 00-2-2zM12 9h4M12 19h4M8 11v5">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_6_3' ? 'font-semibold' : ''">网络部署</span>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_6_4' ? 'active' : ''" @click="toggleL2('m_6_4', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_6_4' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_6_4' ? 'font-semibold' : ''">集群管理</span>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_6_5' ? 'active' : ''" @click="toggleL2('m_6_5', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_6_5' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_6_5' ? 'font-semibold' : ''">特性中心</span>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_6_6' ? 'active' : ''" @click="toggleL2('m_6_6', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_6_6' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                </svg>
                <span :class="activeLeaf === 'm_6_6' ? 'font-semibold' : ''">升级管理</span>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_6_7' ? 'active' : ''" @click="toggleL2('m_6_7', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_6_7' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.121 2.121 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_6_7' ? 'font-semibold' : ''">系统运维</span>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_6_8' ? 'active' : ''" @click="toggleL2('m_6_8', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_6_8' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_6_8' ? 'font-semibold' : ''">扩展能力对接</span>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_6_9' ? 'active' : ''" @click="toggleL2('m_6_9', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_6_9' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_6_9' ? 'font-semibold' : ''">代理网关管理</span>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_6_10' ? 'active' : ''"
                @click="toggleL2('m_6_10', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_6_10' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_6_10' ? 'font-semibold' : ''">深信服联动设备</span>
              </div>
            </div>
          </template>
          <template x-if="topNav === '审计中心'">
            <div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_7_0' || activeLeaf.startsWith('m_7_0_')) ? 'active' : (expandedL2 === 'm_7_0' ? 'text-white' : '')"
                @click="toggleL2('m_7_0')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_7_0' || activeLeaf.startsWith('m_7_0_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                  </path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_7_0' || activeLeaf.startsWith('m_7_0_')) ? 'font-semibold' : ''">防火墙集中管理日志</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_7_0' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_7_0'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_7_0_0' ? 'active' : ''" @click="toggleL4('m_7_0_0')">
                  应用控制日志</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_7_0_1' ? 'active' : ''" @click="toggleL4('m_7_0_1')">
                  安全日志</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_7_0_2' ? 'active' : ''" @click="toggleL4('m_7_0_2')">
                  本地操作日志</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_7_0_3' ? 'active' : ''" @click="toggleL4('m_7_0_3')">
                  本地系统日志</div>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_7_1' ? 'active' : ''" @click="toggleL2('m_7_1', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_7_1' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_7_1' ? 'font-semibold' : ''">零信任安全接入日志</span>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_7_2' || activeLeaf.startsWith('m_7_2_')) ? 'active' : (expandedL2 === 'm_7_2' ? 'text-white' : '')"
                @click="toggleL2('m_7_2')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_7_2' || activeLeaf.startsWith('m_7_2_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                  </path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_7_2' || activeLeaf.startsWith('m_7_2_')) ? 'font-semibold' : ''">互联网安全访问日志</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_7_2' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_7_2'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_7_2_0' ? 'active' : ''" @click="toggleL4('m_7_2_0')">
                  上网行为日志</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_7_2_1' ? 'active' : ''" @click="toggleL4('m_7_2_1')">
                  威胁防护日志</div>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_7_3' ? 'active' : ''" @click="toggleL2('m_7_3', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_7_3' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_7_3' ? 'font-semibold' : ''">数据防泄密日志</span>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_7_4' || activeLeaf.startsWith('m_7_4_')) ? 'active' : (expandedL2 === 'm_7_4' ? 'text-white' : '')"
                @click="toggleL2('m_7_4')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_7_4' || activeLeaf.startsWith('m_7_4_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                  </path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_7_4' || activeLeaf.startsWith('m_7_4_')) ? 'font-semibold' : ''">终端管理日志</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_7_4' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_7_4'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_7_4_0' ? 'active' : ''" @click="toggleL4('m_7_4_0')">
                  终端管控日志</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_7_4_1' ? 'active' : ''" @click="toggleL4('m_7_4_1')">
                  软件管控日志</div>
              </div>
              <div class="at-menu-l2" :class="activeLeaf === 'm_7_5' ? 'active' : ''" @click="toggleL2('m_7_5', true)">
                <svg class="at-menu-l2-icon" :stroke="activeLeaf === 'm_7_5' ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                  </path>
                </svg>
                <span :class="activeLeaf === 'm_7_5' ? 'font-semibold' : ''">用户登录日志</span>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_7_6' || activeLeaf.startsWith('m_7_6_')) ? 'active' : (expandedL2 === 'm_7_6' ? 'text-white' : '')"
                @click="toggleL2('m_7_6')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_7_6' || activeLeaf.startsWith('m_7_6_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                  </path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_7_6' || activeLeaf.startsWith('m_7_6_')) ? 'font-semibold' : ''">设备运维日志</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_7_6' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_7_6'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_7_6_0' ? 'active' : ''" @click="toggleL4('m_7_6_0')">
                  管理员运维日志</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_7_6_1' ? 'active' : ''" @click="toggleL4('m_7_6_1')">
                  设备与系统日志</div>
              </div>
              <div class="at-menu-l2"
                :class="(activeLeaf === 'm_7_7' || activeLeaf.startsWith('m_7_7_')) ? 'active' : (expandedL2 === 'm_7_7' ? 'text-white' : '')"
                @click="toggleL2('m_7_7')">
                <svg class="at-menu-l2-icon"
                  :stroke="(activeLeaf === 'm_7_7' || activeLeaf.startsWith('m_7_7_')) ? 'url(#icon-grad)' : 'currentColor'"
                  fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z">
                  </path>
                </svg>
                <span
                  :class="(activeLeaf === 'm_7_7' || activeLeaf.startsWith('m_7_7_')) ? 'font-semibold' : ''">审计中心配置</span>
                <svg class="ml-auto mr-4 w-4 h-4 opacity-60 transition-transform"
                  :class="expandedL2 === 'm_7_7' ? 'rotate-180' : ''" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              <div x-show="expandedL2 === 'm_7_7'" x-collapse x-cloak>
                <div class="at-menu-l3" :class="activeLeaf === 'm_7_7_0' ? 'active' : ''" @click="toggleL4('m_7_7_0')">
                  日志存储及审计配置</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_7_7_1' ? 'active' : ''" @click="toggleL4('m_7_7_1')">
                  Syslog日志同步</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_7_7_2' ? 'active' : ''" @click="toggleL4('m_7_7_2')">
                  零信任流量镜像</div>
                <div class="at-menu-l3" :class="activeLeaf === 'm_7_7_3' ? 'active' : ''" @click="toggleL4('m_7_7_3')">
                  零信任分析中心对接</div>
              </div>
            </div>
          </template>
        </div>
      </aside>

      <!-- ======================================================
        Main Workspace / 右侧主工作区（业务内容占位）
        用途：承载当前选中菜单对应的业务页面。
        使用说明：在此区域内添加 PageTitle、筛选 Toolbar、表格、表单等业务组件。
      ======================================================= -->
      <main class="flex-1 bg-bg-light p-0 flex flex-col overflow-hidden">

        <div class="bg-white rounded-none shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex-1 flex flex-col overflow-hidden">

          <!-- 页面页头占位（可按需添加 PageTitle + Tab） -->
          <div class="h-12 border-b border-bg-line flex items-center pl-4 flex-shrink-0 select-none">
            <span class="text-xs font-semibold text-text-title" x-text="topNav"></span>
            <span class="w-[1px] h-4 bg-bg-line mx-3"></span>
            <span class="text-xs text-text-mute">页面标题 / Tab 切换区</span>
          </div>

          <!-- 业务内容占位区 -->
          <div class="flex-1 flex flex-col overflow-hidden p-3">
            <div class="flex-1 border border-dashed border-border flex flex-col items-center justify-center text-text-mute text-xs rounded-control gap-2">
              <span>【业务内容区】</span>
              <span>在此处添加筛选 Toolbar、数据表格 <code class="text-brand">.sd-table</code>、表单或业务组件</span>
              <span class="text-[10px] text-text-mute mt-2">当前菜单：<span class="text-text" x-text="activeLeaf"></span></span>
            </div>
          </div>

        </div>

      </main>
    </div>

  </div>

</body>

</html>

```
