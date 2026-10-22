#!/usr/bin/env bash
# ============================================================
# 织雨设计说明书 · 交付前自检闸门 (Design Spec Pre-Delivery Self-Check)
#
# 用法: bash tools/design-spec-selfcheck.sh <design-spec-xxx.html>
#
# 目的: 用机器兜住四类"老毛病"，不让它们再靠人工逐轮发现——
#   ① 内容完整性    : 五章齐备 / 页面小节存在 / 每条 EP 都有页面落点（防空头引用）
#   ② 资产引用正确性: 组件名必须在 idux-component-map.md 登记（否则须显式声明）
#                     模板 ID 必须在 01-page-types.md 存在（否则须显式声明）
#                     引用的 .md 文件必须可解析
#   ③ 样式合规性    : 所有色值必须命中 03-design-assets/ 全量色板；
#                     严禁出现红色/危险型按钮（设计资产无此按钮类型）
#   ④ 线框规范符合度: 弹窗/抽屉页脚主按钮在左；操作按钮不带前置图标；
#                     表单 Label 非必填项须留星号占位；弹窗/抽屉宽度须命中允许档位；
#                     页面模板与线框容器原语一致（drawer ↔ modal 不得跨用）；UI 文案不泄漏 EP 编号
#   ⑤ 可视化件完整性: 含可视化件的页面，其《可视化件声明》(class="viz-decl") 五字段须齐全
#                     （件型 / 图形编码规则 / 风格规范 / 交互与退化 / 可替代性）
#
# 退出码: 0 = 全部通过（可进入共识确认闸门）；1 = 存在未通过项（必须先修）
# ============================================================
set -uo pipefail

SPEC="${1:-}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSETS="$ROOT/03-design-assets"
MAP="$ASSETS/components/idux-component-map.md"
PAGES="$ASSETS/page-templates/01-page-types.md"

if [ -z "$SPEC" ] || [ ! -f "$SPEC" ]; then
  echo "用法: bash tools/design-spec-selfcheck.sh <design-spec-xxx.html>"
  exit 2
fi
for f in "$MAP" "$PAGES"; do
  [ -f "$f" ] || { echo "缺少设计资产文件: $f"; exit 2; }
done

FAIL=0
is_bad() { FAIL=$((FAIL + 1)); }
head_() { printf '\n🔎 %s\n' "$1"; }

echo "============================================================"
echo " 织雨设计说明书 · 交付前自检"
echo " 目标文件: $SPEC"
echo "============================================================"

# ---------- 1. 结构完整性 ----------
head_ "1/11 结构完整性（五章 或 Part1/Part2 两段式 + 分页面小节）"
H2=$(grep -c '<h2' "$SPEC" || true)
PART=$(grep -c '<h2[^>]*class="part"' "$SPEC" || true)
# 分页面小节：旧结构 h3 4.x；新结构 h4 7.x（第7节下的页面小节）
H3P=$(grep -oE '<h[34][^>]*>\s*(4|7)\.[0-9]' "$SPEC" | wc -l | tr -d ' ')
if [ "$H2" -eq 5 ]; then
  echo "  ✅ 五章齐备 (h2 = $H2)"
elif [ "$H2" -eq 2 ] && [ "$PART" -eq 2 ]; then
  echo "  ✅ 两段式结构齐备 (Part1 / Part2, h2 = $H2)"
else
  echo "  ❌ 章节数异常: h2 = ${H2}、part 标题 = ${PART}（应为 5，或 2 个 part 标题）"; is_bad
fi
if [ "$H3P" -ge 1 ]; then echo "  ✅ 分页面小节 $H3P 个"; else echo "  ❌ 未找到分页面小节 (h3 4.x 或 h4 7.x)"; is_bad; fi

# 场景切分（1.1 判据：数量 2~5 条；名字里不得带阶段/操作词，串行旅程必须合并）
SCN=$(grep -oE '<td><b>S[0-9]+\.' "$SPEC" | wc -l | tr -d ' ')
if [ "$SCN" -gt 0 ]; then
  SCN_MSG=""
  if [ "$SCN" -lt 2 ] || [ "$SCN" -gt 5 ]; then
    SCN_MSG="$SCN_MSG【场景数量】主场景 $SCN 条，应为 2~5 条（不足=拆碎，过多=没收敛）；"
  fi
  BADNAME=$(grep -oE '<td><b>S[0-9]+\. [^<]*' "$SPEC" | sed 's|<td><b>||' | grep -E '(追踪|结果|查看|定位|详情|下发|提交|编辑|导入|导出|新建)' || true)
  if [ -n "$BADNAME" ]; then
    SCN_MSG="$SCN_MSG【场景串行】场景名含阶段/操作词（$(printf '%s' "$BADNAME" | tr '\n' ' ')），疑似把一段串行旅程拆成两个场景；A 的终态若是 B 的触发情境必须合并；"
  fi
  if [ -z "$SCN_MSG" ]; then
    echo "  ✅ 场景切分合规（$SCN 条 · 名称不含阶段词）"
  else
    echo "  ❌ $SCN_MSG"; is_bad
  fi
fi

# 条数上限（1.3 / 5.0 统一口径：突破点 2~5 处）——只提示，不计入 11 项
BPN=$(grep -oE '<td>\s*B[0-9]+\s*</td>' "$SPEC" | grep -oE 'B[0-9]+' | sort -u | wc -l | tr -d ' ' || true)
if [ "$BPN" -gt 5 ]; then
  echo "  ⚠️ 突破点 ${BPN} 处（编号去重），超过上限 5（1.3 / 5.0 统一口径）——先合并去重再砍，别靠加编号蒙过去"
elif [ "$BPN" -gt 0 ]; then
  echo "  ✅ 突破点 ${BPN} 处（编号去重 · 上限 5）"
fi

# ---------- 2. 组件真实性（两轨制）----------
head_ "2/11 组件真实性（已登记 或 已显式声明来源）"
MAPTOK=$(grep -oE 'Ix[A-Za-z]+' "$MAP" | sort -u)
DECL_RE='未在|未登记|保留蒸馏|查无|无对应|产线|已声明'
UNDEF=""
for t in $(grep -oE 'Ix[A-Za-z]+' "$SPEC" | sort -u); do
  if printf '%s\n' "$MAPTOK" | grep -qx "$t"; then continue; fi
  if grep -E "${t}([^A-Za-z]|$)" "$SPEC" | grep -qE "$DECL_RE"; then :; else UNDEF="$UNDEF $t"; fi
done
if [ -z "$UNDEF" ]; then
  echo "  ✅ 所有 Ix 组件均已登记，或已显式声明来源（未登记 / 保留蒸馏名）"
else
  echo "  ❌ 未登记且未声明的组件（严禁杜撰）:$UNDEF"; is_bad
fi

# ---------- 3. 模板真实性 ----------
head_ "3/11 页面模板真实性（资产库存在 或 已显式声明）"
REALTPL=$(grep -oE 'page-[a-z]+-[a-z]+' "$PAGES" | sort -u)
TPL_DECL_RE='无对应模板|套头借|模板库|自定义|产线|已声明'
BADTPL=""
for t in $(grep -oE 'page-[a-z]+-[a-z]+' "$SPEC" | sort -u); do
  if printf '%s\n' "$REALTPL" | grep -qx "$t"; then continue; fi
  if grep -E "${t}([^a-z-]|$)" "$SPEC" | grep -qE "$TPL_DECL_RE"; then :; else BADTPL="$BADTPL $t"; fi
done
if [ -z "$BADTPL" ]; then
  echo "  ✅ 所有 page-* 模板 ID 均真实存在，或已显式声明（库缺口 / 产线差异）"
else
  echo "  ❌ 不存在的模板 ID（严禁杜撰）:$BADTPL"; is_bad
fi

# ---------- 4. 色值白名单 ----------
head_ "4/11 色值合规（必须命中 03-design-assets/ 全量色板；草图折叠区免检）"
# 剔除草图折叠区（details.sketch-fold 内）——草图不受设计规范约束，见 1.4 第五节
NOCKECK=$(mktemp)
TMPC=$(mktemp)
awk '/<details class="sketch-fold">/{skip=1} !skip{print} /<\/details>/{skip=0}' "$SPEC" > "$NOCKECK"
WHITE=$(find "$ASSETS" -type f -name '*.md' | while read -r f; do grep -oE '#[0-9A-Fa-f]{6}' "$f"; done | tr 'a-f' 'A-F' | sort -u)
# 豁免范围只看"这一行是不是说明性文字"，不看行内有没有某几个词（旧写法会被正文里的"违规"字样误判）
#   ① HTML 注释行（<!-- ... -->）不算实际使用；
#   ② Markdown 说明行（以 > 、| 、* 、- 、# 开头）不算实际使用；
#   ③ 其余一律视为真实用法，必须命中白名单
# 性能：先一次性过滤出"真实用法行"，再比对白名单（旧写法每个色值都全表扫一遍，大文件会卡死）
# 用 awk 做集合比对（比逐个 grep -qx 快两个数量级）
BADC=$(awk '!/^[[:space:]]*(<!--|>|\||\*|-|#)/' "$NOCKECK" \
  | grep -oE '#[0-9A-Fa-f]{6}' | tr 'a-f' 'A-F' | sort -u > "$TMPC" ; \
  awk 'NR==FNR{w[$0]=1; next} !($0 in w){print}' <(printf '%s\n' "$WHITE") "$TMPC" | tr '\n' ' ')
if [ -z "$BADC" ]; then
  echo "  ✅ 全部色值均命中设计资产白名单"
else
  echo "  ❌ 非设计资产色值（严禁 AI 自造色值）:$BADC"; is_bad
fi

# ---------- 5. 按钮用色铁律 ----------
head_ "5/11 按钮用色铁律（无红色 / 危险型按钮）"
# 排除自检规则说明行（含「扫描」「不存在」「严格」「严禁」「铁律」等词的行是规则描述，非实际代码）
DANGER_BTN=$(grep -nE '危险型' "$SPEC" | grep -vE '(扫描|不存在|严格|严禁|检查|铁律|规则|自检|说明)' || true)
if [ -z "$DANGER_BTN" ]; then
  echo "  ✅ 未出现"危险型"按钮"
else
  echo "  ❌ 出现"危险型"按钮（设计资产只有主按钮 / 普通按钮两种）"; is_bad
fi
REDBTN=$(grep -nE 'background:\s*(#D9363E|#CF171D|var\(--danger-t\))[^>]*color:\s*#FFF' "$SPEC" || true)
if [ -z "$REDBTN" ]; then
  echo "  ✅ 未检出红色实心按钮（danger 底色 + 白字）"
else
  echo "  ❌ 检出红色实心按钮:"; printf '%s\n' "$REDBTN" | sed 's/^/     /'; is_bad
fi

# ---------- 6. 引用文件可解析 ----------
head_ "6/11 引用文件可解析（.md 必须存在）"
MISSING=""
for r in $(grep -oE '[a-zA-Z0-9_./-]+\.md' "$SPEC" | sort -u); do
  if [ -f "$ROOT/$r" ] || [ -f "$ASSETS/$r" ] || [ -n "$(find "$ROOT" -name "$(basename "$r")" -not -path '*/node_modules/*' -print -quit 2>/dev/null)" ]; then :; else MISSING="$MISSING $r"; fi
done
if [ -z "$MISSING" ]; then
  echo "  ✅ 所有引用的 .md 文件均可解析"
else
  echo "  ❌ 引用了不存在的文件:$MISSING"; is_bad
fi

# ---------- 7. 经验落点（无空头引用）----------
head_ "7/11 经验落点（纵向 EP 与横向 D0x-EPxx 均须在四、核心页面中有承载）"
FOURTH=$(grep -n '<h2' "$SPEC" | sed -n '4p' | cut -d: -f1)
if [ -z "$FOURTH" ]; then
  # 两段式结构：以「7. 核心页面线框」为承载区起点
  FOURTH=$(grep -n '<h3[^>]*>\s*7\.' "$SPEC" | head -1 | cut -d: -f1)
fi
if [ -z "$FOURTH" ]; then
  echo "  ⚠️ 未定位到第四章 / 第7节，跳过本项"
else
  ORPHAN=""
  # 只统计真实引用的纵向 EP（排除在说明性文字/举例/规则描述行中出现的 EP 编号）
  for ep in $(grep -oE 'EP-[0-9]+' "$SPEC" | sort -u); do
    REAL_REF=$(grep -nE "${ep}([^0-9]|$)" "$SPEC" | grep -vE '(如禁止写|禁止写入|举例|如：EP|EP-xx|说明|规则|禁止在 UI)' || true)
    [ -z "$REAL_REF" ] && continue
    n=$(printf '%s\n' "$REAL_REF" | cut -d: -f1 | awk -v t="$FOURTH" '$1 > t' | wc -l | tr -d ' ')
    [ "$n" -eq 0 ] && ORPHAN="$ORPHAN $ep"
  done
  # 横向通用决策经验（D0x-EPxx）同样要求有页面落点
  ORPHANH=""
  for ep in $(grep -oE 'D[0-9][0-9]-EP[0-9]+' "$SPEC" | sort -u); do
    n=$(grep -nE "${ep}([^0-9]|$)" "$SPEC" | cut -d: -f1 | awk -v t="$FOURTH" '$1 > t' | wc -l | tr -d ' ')
    [ "$n" -eq 0 ] && ORPHANH="$ORPHANH $ep"
  done
  if [ -z "$ORPHAN" ] && [ -z "$ORPHANH" ]; then
    echo "  ✅ 全部纵向 EP 与横向 D0x-EPxx 均在第四章页面中有落点，无空头引用"
  else
    [ -n "$ORPHAN" ] && { echo "  ❌ 纵向空头引用（经验被引用但无页面承载）:$ORPHAN"; is_bad; }
    [ -n "$ORPHANH" ] && { echo "  ❌ 横向空头引用（D0x-EPxx 被引用但无页面承载）:$ORPHANH"; is_bad; }
  fi
fi

# ---------- 8. 表单左右结构铁律 ----------
head_ "8/11 表单结构合规（遵循 design-form.md 第 14 条左右结构铁律）"
VERTICAL_FORM=$(grep -nE '(<br\s*/?>\s*<input|[:：]\s*(</span>)?\s*<br\s*/?>\s*<input|<label>[^<]*<br\s*/?>\s*<input)' "$SPEC" || true)
if [ -z "$VERTICAL_FORM" ]; then
  echo "  ✅ 未检出表单上下堆叠反模式（严格遵循左 Label 右 Control 水平左右结构）"
else
  echo "  ❌ 检出表单上下堆叠反模式（违反 design-form.md 第 14 条，严禁 Label 换行堆叠控件）:"; printf '%s\n' "$VERTICAL_FORM" | sed 's/^/     /'; is_bad
fi

# ---------- 9. 标杆经验特征物保真度（数据驱动动态契约比对）----------
head_ "9/11 标杆经验特征物保真度（动态特征指纹契约比对）"
DOC_TYPE=$(grep -oE 'Type-0[1-7]' "$SPEC" | head -1 || true)
SIG_DIR="$ROOT/01-system-solution-design/②设计思考与决策/需求大类设计决策/signatures"
SIG_FILE="$SIG_DIR/${DOC_TYPE}.json"

if [ -z "$DOC_TYPE" ]; then
  echo "  ⚠️ 未识别到需求类型定性 (Type-01~07)，跳过细粒度特征指纹比对"
elif [ ! -f "$SIG_FILE" ]; then
  echo "  ℹ️ 需求类型 [${DOC_TYPE}] 尚未配置专属特征指纹契约 (${DOC_TYPE}.json)，通用基线已全绿，本项自适应跳过"
else
  # 调用 node 执行动态契约比对，通用引擎无任何业务与 EP 硬编码
  NODE_RESULT=$(node -e '
    const fs = require("fs");
    const spec = fs.readFileSync(process.argv[1], "utf-8");
    const sig = JSON.parse(fs.readFileSync(process.argv[2], "utf-8"));
    const errors = [];
    const declaredEPs = new Set();
    const epMatches = spec.match(/EP-[0-9]+/g) || [];
    epMatches.forEach(ep => declaredEPs.add(ep));

    let checkedCount = 0;
    for (const [ep, rule] of Object.entries(sig.signatures || {})) {
      if (declaredEPs.has(ep)) {
        checkedCount++;
        for (const pattern of rule.required_patterns) {
          const reg = new RegExp(pattern);
          if (!reg.test(spec)) {
            errors.push(`【${ep} 特征物缺失】${rule.error_msg}`);
            break;
          }
        }
      }
    }
    if (errors.length > 0) {
      console.log("FAIL|" + errors.join("；"));
    } else {
      console.log(`PASS|已动态核验 ${checkedCount} 项命中经验的物理特征指纹，均完整还原`);
    }
  ' "$SPEC" "$SIG_FILE")

  STATUS=$(echo "$NODE_RESULT" | cut -d'|' -f1)
  MSG=$(echo "$NODE_RESULT" | cut -d'|' -f2-)

  if [ "$STATUS" = "PASS" ]; then
    echo "  ✅ [${DOC_TYPE}] $MSG"
  else
    echo "  ❌ [${DOC_TYPE}] $MSG"
    is_bad
  fi
fi

# ---------- 10. 线框规范符合度（对接 03-design-assets 组件规范）----------
head_ "10/11 线框规范符合度（页面线框必检；草图折叠区免检）"
WF_RESULT=$(node -e '
  const fs = require("fs");
  const raw = fs.readFileSync(process.argv[1], "utf-8");
  // 剔除草图折叠区（details.sketch-fold）——草图不受设计规范约束，见 1.4 第五节
  const spec = raw.replace(/<details class="sketch-fold">[\s\S]*?<\/details>/g, "");
  const errors = [];
  const lines = spec.split(/\r?\n/);

  // 收集全部线框按钮（按文档顺序）
  const btnRe = /<span class="(wf-btn-primary|wf-btn|wf-btn-disabled)"[^>]*>([^<]*)<\/span>/g;
  const btns = [];
  let m;
  while ((m = btnRe.exec(spec)) !== null) {
    btns.push({ kind: m[1], text: m[2].trim(), idx: m.index });
  }

  // 10a 弹窗/抽屉页脚按钮顺序：取消/关闭 不得紧邻排在主按钮之前（comp-modal.md / comp-drawer.md：主按钮在左）
  for (let i = 0; i < btns.length - 1; i++) {
    const a = btns[i], b = btns[i + 1];
    if (a.kind === "wf-btn" && /^(取消|关闭)$/.test(a.text) && b.kind === "wf-btn-primary" && (b.idx - a.idx) < 400) {
      errors.push("【按钮顺序】「" + a.text + "」紧邻排在主按钮之前；页脚须主按钮在左、取消/关闭在右");
    }
  }

  // 10b 操作按钮默认不带图标（comp-button.md）：按钮文本不得以图标字符开头（规范允许的刷新 icon 按钮 ⟳ 除外）
  const iconLead = /^[+＋✚✎✕✖🔍⚙🗑➕]/;
  for (const b of btns) {
    if (iconLead.test(b.text)) {
      errors.push("【按钮图标】按钮「" + b.text + "」带前置图标；按 comp-button.md 默认不带图标（刷新 icon 按钮除外）");
    }
  }

  // 10c 表单 Label 星号占位对齐（design-form.md 5.1.3 / 5.3.9）：存在必填项时，非必填 Label 也须预留隐形星号占位
  const labelRe = /<div class="wf-form-label">([\s\S]*?)<\/div>/g;
  const labels = [];
  while ((m = labelRe.exec(spec)) !== null) labels.push(m[1]);
  const hasRequired = labels.some(l => /class="req"/.test(l));
  if (hasRequired) {
    const seen = new Set();
    for (const l of labels) {
      if (!/class="req"/.test(l) && !/visibility\s*:\s*hidden/.test(l)) {
        const name = l.replace(/<[^>]+>/g, "").trim();
        if (!seen.has(name)) { seen.add(name); errors.push("【表单对齐】Label「" + name + "」未预留星号占位；非必填项须补隐形占位以保证左对齐"); }
      }
    }
  }

  // 10d 弹窗/抽屉宽度档位（comp-modal.md / comp-drawer.md）：宽度须命中允许档位
  const allowed = new Set([400, 480, 640, 720, 800, 960, 1200]);
  for (const line of lines) {
    if (!/(IxModal|IxDrawer|IxProFormModal|IxProFormDrawer)/.test(line)) continue;
    const wm = line.match(/宽\s*(\d{3,4})\s*px/);
    if (wm && !allowed.has(parseInt(wm[1], 10))) {
      errors.push("【容器宽度】弹窗/抽屉宽度 " + wm[1] + "px 不在允许档位（400/480/640/720/800/960/1200）");
    }
  }

  // 10e 容器选型一致性：页面声明的模板类型与其线框容器原语必须一致（drawer 类 ↔ wf-drawer；modal 类 ↔ wf-modal）
  const secRe = /<h3[^>]*>([\s\S]*?)(?=<h3|<h2|<\/body>)/g;
  const DRAWER = new Set(["page-form-drawer", "page-detail-drawer", "page-list-drawer"]);
  const MODAL = new Set(["page-form-modal", "page-list-modal"]);
  while ((m = secRe.exec(spec)) !== null) {
    const sec = m[1];
    if (sec.indexOf("wf-container") === -1) continue;
    const t = sec.match(/page-[a-z]+-[a-z]+/);
    if (!t) continue;
    const tpl = t[0];
    const hasDrawer = sec.indexOf("wf-drawer-body") !== -1;
    const hasModal = sec.indexOf("wf-modal-body") !== -1;
    if (DRAWER.has(tpl) && hasModal && !hasDrawer) errors.push("【容器选型】模板 " + tpl + " 是抽屉页，线框却用了弹窗容器（wf-modal-body）");
    if (MODAL.has(tpl) && hasDrawer && !hasModal) errors.push("【容器选型】模板 " + tpl + " 是弹窗页，线框却用了抽屉容器（wf-drawer-body）");
  }

  // 10f UI 文案不泄漏经验编号：线框可视区（wf-container 内、wf-annotation 批注之前）不得出现 EP-xx / D0x-EPxx
  const contRe = /<div class="wf-container">/g;
  const seenUI = new Set();
  while ((m = contRe.exec(spec)) !== null) {
    const tail = spec.slice(m.index);
    const annRel = tail.search(/<div class="wf-annotation">/);
    const region = annRel === -1 ? tail : tail.slice(0, annRel);
    const hits = region.match(/EP-\d+|D\d\d-EP\d+/g) || [];
    hits.forEach(h => seenUI.add(h));
  }
  if (seenUI.size) errors.push("【UI文案】线框可视区出现经验编号 " + [...seenUI].join("、") + "；EP/D0x-EPxx 不得写进线框 UI 文案，只能出现在映射表与批注中");

  // 10g 弹窗/抽屉三段分区硬指标（comp-modal.md / comp-drawer.md）
  const boxRe = /<div class="(wf-modal-body|wf-drawer-body)"[^>]*>/g;
  while ((m = boxRe.exec(spec)) !== null) {
    const kind = m[1];
    const tail = spec.slice(m.index);
    const endRel = tail.search(/<div class="wf-annotation">/);
    const region = endRel === -1 ? tail : tail.slice(0, endRel);
    const name = kind === "wf-modal-body" ? "弹窗" : "抽屉";
    if (/wf-header[^>]*border-bottom/.test(region)) errors.push("【" + name + "分区】标题栏带底部分割线；comp-modal / comp-drawer 要求标题栏无底部分割线");
    if (region.indexOf("height:48px") === -1) errors.push("【" + name + "分区】标题栏未标 48px 高度（规范硬指标）");
    if (region.indexOf("height:56px") === -1) errors.push("【" + name + "分区】底部按钮栏未标 56px 高度（规范硬指标）");
    if (kind === "wf-modal-body" && region.indexOf("justify-content:flex-end") === -1) errors.push("【弹窗分区】页脚按钮组未右对齐；comp-modal.md 要求按钮组整体右对齐（主按钮在左、取消在右）");
    if (kind === "wf-drawer-body" && region.indexOf("justify-content:flex-start") === -1) errors.push("【抽屉分区】页脚按钮未左对齐；comp-drawer.md 要求按钮左对齐、主按钮最左");
  }

  // 10h 提示条规范（comp-alert.md）：一律无边框；红色三元组不得作为块级提示条底色
  const redBlock = /<div[^>]*background:\s*(#FFF1F0|var\(--danger-b\))[^>]*>/gi;
  if (redBlock.test(spec)) errors.push("【提示条】出现红色底块级警示条；comp-alert.md 只有普通条/告警条两档，红色不得用作 Alert 底色（红色只许用于文字级与 Tag）");
  const alertBorderA = /<div[^>]*background:\s*(#FFFAF2|#F7F7F8)[^>]*border\s*:/gi;
  const alertBorderB = /<div[^>]*border\s*:[^>]*background:\s*(#FFFAF2|#F7F7F8)/gi;
  if (alertBorderA.test(spec) || alertBorderB.test(spec)) errors.push("【提示条】普通/告警提示条带了边框；comp-alert.md 规定无边框");

  if (errors.length > 0) {
    console.log("FAIL|" + [...new Set(errors)].join("；"));
  } else {
    console.log("PASS|线框规范符合度通过（页脚按钮顺序 / 按钮无图标 / 表单星号占位 / 容器宽度档位 / 容器选型一致 / UI 文案无经验编号 / 弹窗三段分区 / 提示条无边框无红底）· 草图区已跳过");
  }
' "$SPEC")

WF_STATUS=$(echo "$WF_RESULT" | cut -d'|' -f1)
WF_MSG=$(echo "$WF_RESULT" | cut -d'|' -f2-)
if [ "$WF_STATUS" = "PASS" ]; then
  echo "  ✅ $WF_MSG"
else
  echo "  ❌ $WF_MSG"
  is_bad
fi

# ---------- 11. 可视化件声明完整性 ----------
head_ "11/11 可视化件声明完整性（含可视化件的页面须五字段齐全）"
VIZ_SIG="$ROOT/01-system-solution-design/②设计思考与决策/需求大类设计决策/signatures/viz-signatures.json"
VIZ_RESULT=$(node -e '
  const fs = require("fs");
  const spec = fs.readFileSync(process.argv[1], "utf-8");
  let reg = null;
  try { reg = JSON.parse(fs.readFileSync(process.argv[2], "utf-8")); } catch (e) { reg = null; }
  const required = (reg && reg.required_fields) || ["件型","图形编码规则","风格规范","交互与退化","可替代性"];
  const blocks = [...spec.matchAll(/<div class="viz-decl">([\s\S]*?)<\/div>/g)].map(m => m[1]);
  if (blocks.length === 0) { console.log("PASS|本说明书未声明可视化件，本项自适应跳过"); process.exit(0); }
  const errors = [];
  blocks.forEach((body, i) => {
    const missing = required.filter(f => body.indexOf(f) === -1);
    if (missing.length) errors.push("第 " + (i + 1) + " 个《可视化件声明》缺字段：" + missing.join("、"));
  });
  if (errors.length) console.log("FAIL|" + errors.join("；"));
  else console.log("PASS|已核验 " + blocks.length + " 个《可视化件声明》，五字段齐全");
' "$SPEC" "$VIZ_SIG")
VIZ_STATUS=$(echo "$VIZ_RESULT" | cut -d'|' -f1)
VIZ_MSG=$(echo "$VIZ_RESULT" | cut -d'|' -f2-)
if [ "$VIZ_STATUS" = "PASS" ]; then
  echo "  ✅ $VIZ_MSG"
else
  echo "  ❌ $VIZ_MSG"
  is_bad
fi

# ---------- 附：线框数据完整度（提示项，不计入 11 项通过率） ----------
head_ "附：线框数据完整度（提示项 · 不计入通过率）"
PLACEHOLDER=$(grep -o '__' "$NOCKECK" 2>/dev/null | wc -l | tr -d ' ')
if [ "${PLACEHOLDER:-0}" -gt 0 ]; then
  echo "  ⚠️ 线框区（已排除草图折叠区）仍有 ${PLACEHOLDER} 处占位符 __；按 5.0 铁律第 18 条，线框须用跨页自洽的示例数据补齐，不得沿用草图占位"
else
  echo "  ✅ 线框区无占位符，数据完整度符合线框标准（草图区免检）"
fi

# ---------- 结论 ----------
echo
echo "============================================================"
if [ "$FAIL" -eq 0 ]; then
  echo "🎉 自检通过（11/11）：可进入「🚦 人机共识确认闸门」向规划人员汇报。"
  exit 0
else
  echo "🚫 自检未通过（$FAIL 项）：严禁进入共识确认，必须先修至全绿。"
  exit 1
fi
