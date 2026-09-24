# 业务需求文档 (PRD)：SASE 终端安全合规基线检测任务

| 文档版本 | v1.0 | 归属产品线 | SASE 智能云安全访问平台 |
| :--- | :--- | :--- | :--- |
| **所属模块** | 终端管理 ➔ 终端管控 ➔ 合规基线检测 | **关联模块** | 零信任网络访问 (动态策略)、日志中心 (合规检查日志) |
| **需求定性** | Type-07 检测任务与批量巡检类 | **文档状态** | 待设计方案推导与评审 |
| **作者** | 业务规划团队 / SecOps 规划组 | **评审设计师** | 织雨 (Virtual Designer Zhiyu) |

---

## 1. 业务背景与现状痛点 (Background & Pain Points)

### 1.1 业务背景
随着企业远程办公、混合办公常态化，大量员工自带设备 (BYOD) 与企业统一配发 PC（Windows、macOS、Linux）频繁接入企业 SASE 零信任网络访问内网核心业务。
为满足《网络安全等级保护 2.0》与企业内控安全基线要求，防止因终端未装防病毒客户端导致勒索病毒横向扩散，或因员工安装非法代理、黑客工具导致商业秘密外泄，企业安全运维团队必须建立**常态化终端合规基线巡检与自动处置机制**：
1. **基线必装**：必须安装统一杀毒软件、EDR 客户端、数据防泄密 (DLP) 客户端及屏幕水印客户端；
2. **违规清退**：严禁存在未授权的翻墙代理工具、P2P 盗版下载器、高风险挖矿进程、未经报备的远程协助软件（如未受控的 TeamViewer、向日葵个人版等）。

### 1.2 现状痛点与阻碍 (As-Is Pain Points)

* **【痛点 P1：规则配置繁琐，必装与违规定义门槛高】**：
  现有系统缺乏规则预置模板库，管理员配置时需手动填写进程名称、注册表键值、软件 Hash 等底层底层参数，极易因大小写拼错导致大面积漏报或误报；且缺乏对目标终端数量的预估，无法评估检测影响面。
* **【痛点 P2：海量终端巡检执行如黑盒，长耗时无感知】**：
  企业面对 2,000 ~ 50,000 台分布式终端，下发全网巡检时耗时可能长达数十分钟至数小时。界面仅有一个笼统的 loading 转圈或静态无刷新表格，离线终端大量超时挂死，管理员无法知道当前“跑了多少台、成功多少、离线跳过多少、预计还需多久”，焦虑感严重。
* **【痛点 P3：结果呈现离散，无法就地定界排障（跳页断流）】**：
  巡检完成后输出海量日志流水表，缺乏全局体检看板（合规率、高频违规项排行）。管理员点击查看某台终端时，系统强制跳转至底层全量日志页，不仅打断当前巡检上下文，且日志全为底层十六进制代码，无法直观还原该机器“到底缺什么、到底哪个进程违规”。
* **【痛点 P4：检测与处置割裂，无法形成安全闭环】**：
  查出违规终端后，管理员只能人工线下通过 IM 软件联系员工催促整改；无法与 SASE 现有的零信任网络访问策略联动（如对严重违规终端动态降权/阻断访问内网系统），导致合规管控沦为形式，无法真正防范威胁入侵。

---

## 2. 目标角色与本质任务 (JTBD)

| 角色画像 | 真实使用情境与心智压力 | 核心本质任务 (JTBD) |
| :--- | :--- | :--- |
| **企业安全运维管理员 (SecOps - 最高频)** | **求稳、防背锅、怕误杀**<br>日常负责数千台终端资产巡检；下发策略时最怕规则写错导致全公司电脑报障；巡检时希望随时掌控进度，排障时希望原地解决。 | “我需要能按部门或标签一键装配规则并下发巡检，在 3 秒内看到执行健康度，并能在不跳页的情况下定位违规根因并完成批量处置。” |
| **安全合规负责人 (CISO / 审计员)** | **一屏掌控、量化因果、等保凭据**<br>不关心某条具体流水日志，需要向上汇报全员合规率达标趋势与整改进度，面临等保内审外审压力。 | “我需要掌握企业合规率大盘，能清晰导出满足等保审计规范的整改证明报告，证明违规终端均已受控处置。” |

---

## 3. 功能范围与端到端场景说明 (Scope & Scenarios)

### 3.1 场景一：检测任务制定与多维策略下发 (任务下发阶段)
1. **基础任务信息**：
   - 任务名称、检测优先级（高/中/低）、任务描述。
2. **双维度检测规则组矩阵**：
   - **必装软件基线 (Mandatory Software Baseline)**：
     - 预置软件库一键勾选：深信服 EDR 终端安全客户端、企业杀毒软件 (火绒/360企业版/Symantec)、DLP 数据防泄密客户端、屏幕防拍照水印客户端；
     - 自定义新增规则：软件名、匹配进程名 (如 `edr_agent.exe`)、支持通配符、最低版本号限制、是否要求“必须保持进程存活运行”。
   - **违规软件与黑名单进程 (Prohibited Software & Blacklist)**：
     - 预置黑名单库一键勾选：
       - `代理翻墙类`：Shadowsocks、V2Ray、Clash、Tor 等；
       - `未授权远程控制`：ToDesk 免密版、TeamViewer 个人版、向日葵绿色版、AnyDesk；
       - `高危挖矿与黑客工具`：XMRig 挖矿进程、Mimikatz、Wireshark (对非研发人员拦截)；
       - `高带宽 P2P 下载`：迅雷精简版、BitTorrent、百度网盘非企业版；
     - 自定义黑名单规则：规则名称、风险等级（严重/高危/中危/低危）、匹配进程正则/文件名、安装路径特征、检出后是否支持自动阻断零信任网络。
3. **目标终端范围选择与即时预估 (Pre-check)**：
   - 维度一：**组织架构部门树**（支持多选父级部门自动继承，如“研发中心”、“财务部”）；
   - 维度二：**终端标签组**（如“高密研发机”、“外包 BYOD 办公机”、“财务高危组”）；
   - 维度三：**操作系统过滤**（Windows 10/11 64bit、macOS 12+、Linux）；
   - **即时模拟测算**：选择条件后，右侧/底部即时计算当前命中的终端资产大数（如：`已选 3 个部门，覆盖 2,450 台终端，当前在线 2,180 台，离线 270 台`）。
4. **调度周期 (Execution Cycle)**：
   - 支持【立即执行一次】；
   - 支持【定时/周期巡检】：每天（指定时间段，如 `12:30~13:30` 避免高峰）、每周工作日、每月固定日；
   - 支持【事件驱动检测】：终端上线登录 SASE 客户端时静默自检。

### 3.2 场景二：执行状态机与长耗时监控 (执行监控阶段)
1. **全局执行大盘与三态节点**：
   - 提供全局进度百分比条（`78% 巡检中`）；
   - 实时聚合 4 项核心状态计数卡：`已检测完成台数`、`合规达标台数`、`违规检出台数`、`离线跳过/异常台数`；
2. **控制与防呆保护**：
   - 运行中支持【紧急暂停】与【终止任务】（需二次确认 `IxPopconfirm`）；
   - 超时自动跳过策略：若某终端离线或未响应超过 10 分钟，自动标记为“离线跳过，待下次开机补检”，防止单个离线设备卡死全局任务流程。

### 3.3 场景三：合规大盘与违规就地定界排障 (结果呈现阶段)
1. **顶层合规看板 (Overview Cards)**：
   - 综合合规率（如 `93.4%`）；
   - 核心风险 Top3 摘要（如 `缺必装TOP1: DLP防泄密客户端`，`违规软件TOP1: ToDesk远程协助`）。
2. **多维表格切换与联动过滤**：
   - **Tab 1: 按终端维度聚合**：
     - 列字段：终端名称、IP/MAC、所属部门、当前使用人、合规状态（已合规 / 违规 / 检测异常 / 离线跳过）、违规项数、最高风险等级、处置状态、最近检测时间、操作（诊断详情、下发处置、加白）；
   - **Tab 2: 按违规规则维度聚合**：
     - 列字段：违规规则名称、规则类别（缺必装 / 违规黑名单）、风险等级、涉及终端数、整改率、操作（查看影响终端）；
3. **In-situ 原地抽屉下钻 (终端合规诊断抽屉)**：
   - 点击某台违规终端，右侧滑出抽屉（Drawer），在不离开当前页的前提下展开该机器的体检单：
     - **模块 A：必装基线核对清单**：EDR（已装 3.5.20 - 合规 ✅）、DLP（未检测到运行进程 - 违规 ❌）；
     - **模块 B：检出违规项清单**：发现未授权进程 `ToDesk.exe`，进程 PID 4921，执行路径 `C:\Users\admin\Downloads\ToDesk.exe`，风险等级：高危 ⚠️；
     - **模块 C：该终端处置历史与网络准入状态**。

### 3.4 场景四：处置闭环与零信任联动 (闭环处置阶段)
1. **弱提醒通道（自助整改引导）**：
   - 勾选违规终端，点击【下发整改通知】：SASE 客户端右下角弹出标准系统气泡，文案人性化大白话告知：“您的电脑缺少公司必备安全软件【DLP数据防泄密】，请点击链接快速安装”，附带内网合规安装包下载链接；
2. **强管控联动（零信任动态隔离/阻断）**：
   - 对命中严重高危项（如挖矿、严重黑客工具）的终端，支持【一键联动零信任动态隔离】：
     - 自动调用 SASE 零信任安全策略引擎，将该设备置入“高危隔离安全组”，立刻阻断所有内网业务系统的访问权限，仅保留访问 SASE 客户端与内网软件分发平台的白名单权限，直到整改复测通过；
3. **合规例外（加白名单）**：
   - 针对研发测试等特殊机器，支持选择特定规则或特定终端【申请/添加合规例外】：
     - 必须填写例外理由（如“安全团队逆向测试专用机”）、选择有效截止期限（如 7 天后失效）；
4. **一键复测与审计导出**：
   - 针对整改后的终端，支持单台/批量【一键重新复测】；
   - 支持【导出等保整改台账】（Excel / PDF 格式，包含时间戳、MAC、违规项、处置责任人）。

---

## 4. 实体数据模型与字段字典 (Data Models)

### 4.1 任务实体 (ComplianceTask)
| 字段名 (Field) | 类型 (Type) | 必填 | 字典/示例值 | 说明 |
| :--- | :--- | :---: | :--- | :--- |
| `taskId` | String | 是 | `TASK-20260921-001` | 唯一任务编号，系统自动生成 |
| `taskName` | String | 是 | `2026 Q3 办公终端基线合规例行巡检` | 长度 2~50 字符 |
| `priority` | String | 是 | `HIGH` / `MEDIUM` / `LOW` | 优先级，影响终端队列调度权重 |
| `targetScope` | Object | 是 | - | 目标资产范围配置 |
| ├─ `deptIds` | Array\<String\> | 否 | `["dept_rd_01", "dept_fin_02"]` | 目标部门 ID 数组 |
| ├─ `endpointTags` | Array\<String\> | 否 | `["高密研发机", "外包BYOD"]` | 终端标签组 |
| ├─ `osTypes` | Array\<String\> | 是 | `["WINDOWS", "MACOS"]` | 操作系统限制 |
| └─ `estimatedCount` | Integer | 是 | `2450` | 预估覆盖总台数 |
| `scheduleConfig` | Object | 是 | - | 执行计划配置 |
| ├─ `type` | String | 是 | `IMMEDIATE` / `CYCLE_CRON` / `LOGIN` | 调度类型 |
| ├─ `cronExpression` | String | 否 | `0 30 12 ? * MON-FRI` | 周期 cron 表达式 (工作日午休) |
| └─ `timeoutMinutes` | Integer | 是 | `60` | 超时保护时长 (默认 60 分钟) |
| `taskStatus` | String | 是 | `WAITING` / `RUNNING` / `COMPLETED` / `PARTIAL_FAILED` / `TERMINATED` | 任务当前生命周期状态 |
| `progressStats` | Object | 是 | - | 进度与统计三态数据 |
| ├─ `percentage` | Integer | 是 | `78` | 当前百分比 0~100 |
| ├─ `total` | Integer | 是 | `2450` | 总台数 |
| ├─ `compliant` | Integer | 是 | `1750` | 合规通过台数 |
| ├─ `nonCompliant`| Integer | 是 | `160` | 违规发现台数 |
| └─ `offlineSkipped`| Integer| 是 | `540` | 离线跳过台数 |
| `createdBy` | String | 是 | `admin_secops` | 创建人姓名/账号 |
| `createdAt` | DateTime | 是 | `2026-09-21 14:00:00` | 创建时间 |

### 4.2 检测规则实体 (ComplianceRule)
| 字段名 (Field) | 类型 (Type) | 必填 | 字典/示例值 | 说明 |
| :--- | :--- | :---: | :--- | :--- |
| `ruleId` | String | 是 | `RULE-REQ-001` / `RULE-BLK-002` | 规则唯一标识 |
| `ruleType` | String | 是 | `MANDATORY_SOFTWARE` / `PROHIBITED_SOFTWARE` | 必装基线 / 违规黑名单 |
| `ruleName` | String | 是 | `深信服 EDR 客户端必装` / `非法远控 ToDesk` | 规则展示名称 |
| `category` | String | 是 | `EDR` / `ANTIVIRUS` / `DLP` / `PROXY` / `REMOTE_DESKTOP` / `MINING` | 细分类别 |
| `matchTarget` | String | 是 | `edr_agent.exe` / `todesk.exe|teamviewer.exe` | 匹配进程名、包名或路径模式 |
| `minVersion` | String | 否 | `3.5.20` | 最低允许版本 (仅必装软件生效) |
| `requireRunning` | Boolean | 是 | `true` | 是否要求进程必须处于存活运行态 |
| `severity` | String | 是 | `CRITICAL` (严重) / `HIGH` (高危) / `MEDIUM` (中危) / `LOW` (低危) | 风险等级 |
| `autoBlockZeroTrust` | Boolean | 是 | `true` / `false` | 命中后是否允许联动零信任动态阻断 |
| `remediationGuideUrl` | String | 否 | `https://sec.corp.internal/dlp-guide` | 引导员工自愈安装的链接 |

### 4.3 终端检测结果与明细实体 (EndpointResult)
| 字段名 (Field) | 类型 (Type) | 必填 | 字典/示例值 | 说明 |
| :--- | :--- | :---: | :--- | :--- |
| `endpointId` | String | 是 | `EP-89210-MAC` | 终端设备唯一硬件指纹 |
| `hostname` | String | 是 | `DEV-PC-WANGJUE` | 计算机名 |
| `ipAddress` | String | 是 | `10.28.14.88` | 局域网 IP / SASE 虚拟 IP |
| `macAddress` | String | 是 | `3C:22:FB:4A:11:02` | 网卡物理地址 |
| `userName` | String | 是 | `王珏 (wangjue)` | 当前登录域用户姓名与工号 |
| `department` | String | 是 | `基础平台部/安全体验组` | 所属组织架构完整路径 |
| `osName` | String | 是 | `macOS Sonoma 14.5` | 操作系统版本全称 |
| `complianceStatus` | String | 是 | `COMPLIANT` / `NON_COMPLIANT` / `OFFLINE` / `FAILED` | 终端最终合规裁决 |
| `violationCount` | Integer | 是 | `2` | 检出违规项总数 |
| `highestSeverity` | String | 是 | `CRITICAL` / `HIGH` / `MEDIUM` / `LOW` / `NONE` | 当前最高违规等级 |
| `remediationStatus` | String | 是 | `PENDING` (待整改) / `NOTIFIED` (已提醒) / `QUARANTINED` (已隔离) / `EXEMPTED` (已例外) | 处置跟进状态 |
| `details` | Array\<Object\> | 是 | - | 检出明细数组 |
| ├─ `ruleName` | String | 是 | `DLP 数据防泄密客户端` | 规则名称 |
| ├─ `type` | String | 是 | `MISSING_SOFTWARE` (缺必装) / `BLACKLIST_HIT` (中黑名单) | 违规类型 |
| ├─ `detectedPath` | String | 否 | `C:\Users\Downloads\todesk.exe` | 违规文件所在绝对路径 |
| ├─ `detectedPid` | Integer | 否 | `4921` | 运行时进程 ID |
| └─ `detectedAt` | DateTime | 是 | `2026-09-21 14:32:05` | 探针上报检出时间戳 |

---

## 5. UI/UX 体验设计要求与约束

1. **严格遵循 SASE 产品线设计资产**：
   - 导航层级：必须严格归属于 [03-design-assets/product-lines-knowledge/SASE/sase-navigation.md](../../03-design-assets/product-lines-knowledge/SASE/sase-navigation.md) 的 `终端管理 ➔ 终端管控 ➔ 合规基线检测`；
   - 业务页面模板：采用 [01-page-types.md](../../03-design-assets/page-templates/01-page-types.md) 的【标准列表管理/监控套头】结构；
   - 功能规范：下发周期采用 [execution-cycle.md](../../03-design-assets/feature/execution-cycle.md)，批量处置采用 [batch-edit.md](../../03-design-assets/feature/batch-edit.md)；
2. **深度消费 Type-07 标杆经验 (EP-01 ~ EP-11)**：
   - 任务配置采用轻量抽屉（Drawer）并带即时计算模拟测算；
   - 执行监控采用三态机（完成/违规/离线跳过）进度条，超时自动熔断防死信；
   - 结果下钻严格实行 **In-situ 就地抽屉闭环（Drawer）**，坚决抵制跳页断流；
3. **底层组件与 Token 强制对齐**：
   - 严格映射 [idux-component-map.md](../../03-design-assets/components/idux-component-map.md) 标准组件：`IxTable`, `IxDrawer`, `IxProgress`, `IxTagGroup`, `IxPopconfirm`, `IxRadioGroup`, `IxTreeSelect`, `IxEmpty` 等；
   - 尺寸、高度严格执行 `h32` (操作/表格头)、`h28` (内联控件)、`rounded-[2px]`、石墨灰底色 `#F7F9FC`、边框 `#E1E5EB`、主品牌蓝 `#1C6EFF`。

---

## 6. 验收与方案评审标准

- **评审第一阶段（本 PRD 确认后交付）**：
  织雨须交付包含五大固定章节的自包含单文件 **《设计说明书 HTML》（`design-spec-sase-compliance.html`）**，并停下等待规划人员评审；
- **评审第二阶段（说明书共识达成后交付）**：
  根据说明书 100% 还原落地前端高保真 Demo，并执行套头与组件回测。
