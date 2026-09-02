# 设计师棱镜 (Designer Prism / Prism 体验设计智脑) - 技能概览

## 1. 技能定位与核心目标
**设计师棱镜 (Designer Prism)** 是一套专为 **产品/业务规划人员** 打造的 **“AI 设计中枢与双轨意图转译”** 技能。
其核心目标是：
- 消除规划人员与 Coding AI 之间的“设计词汇与审美代沟”；
- 将规划人员的**自然语言输入（原始 PRD / 模糊修改意见）**转化为兼具**通俗业务思考（面向规划）**与**高保真像素级代码指令（面向 AI）**的双重交付物；
- 赋能规划人员能够自主、高质量地完成 Demo 架构重构与专业化细节调优。

---

## 2. 双轨设计知识体系与目录结构

整个技能按照 **【宏观方案层】**、**【微观细节层】**、**【规范基座层】**、**【SOP 与实战案例】** 四大模块构建，实现高内聚、零割裂：

```text
skill-designer-prism/
├── SKILL.md                               # 技能主入口与中枢路由 (双轨设计转译总控)
├── README.md                              # 技能说明文档
│
├── 01-macro-solution/                     # 🌐 【宏观方案与业务旅程层】(解决业务顺畅与闭环)
│   ├── business-patterns.md               # 业务高频场景范式 (拓扑链路/KPI驾驶舱/散点看板/向导)
│   ├── journey-and-flow-strategies.md     # 流程顺畅度与旅程闭环策略 (In-situ原地闭环/同源聚合/三级联动排障)
│   └── macro-prompt-template.md           # 宏观 0➔1 需求转译与全页面生成 Prompt 模板 (含规划解释)
│
├── 02-micro-detail/                       # 🔬 【微观细节与局部调优层】(解决样式精致与易用性)
│   ├── detail-tuning-dictionary.md        # 细节吐槽转译词典 (太挤/太散/很土/小标题碎等 40+ 细节点经验)
│   ├── heuristic-guardrails.md            # 局部易用性黄金法则与四重防破坏安全带 (Regression Guard)
│   └── micro-prompt-template.md           # 微观细节调优补丁 Prompt 模板 (含规划解释)
│
├── 03-design-standards/                   # 📐 【规范基座层】(提供客观数值与组件约束)
│   ├── tokens-cheatsheet.md               # 高频 Token 与状态三元组 (浅底+深字+浅边) 速查手册
│   ├── global-styles/                     # 全局原子规范 (色彩全量矩阵、8px间距、字阶、24栅格)
│   └── components/                        # 20+ 基础组件规范库 (Table、ProSearch、Button、Drawer 等)
│
└── 04-workflows-and-cases/                # 📖 【执行SOP与实战案例库】
    ├── execution-sop.md                   # 4 大阶段 8 步执行工作流标准说明书
    └── few-shots.md                       # 宏观与微观经典实战 Few-Shot 标杆案例
```
