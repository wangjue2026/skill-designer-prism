#!/usr/bin/env bash
# ============================================================
# 织雨设计说明书 · 资产与组件规范机检 (Design Spec Asset & Component Self-Check)
#
# 用法: bash tools/design-spec-selfcheck.sh <design-spec-xxx.html>
#
# 定位（2026-11-27 Part2 门禁去重瘦身 · 8 项精准机检）：
#   由 tools/gate-sp.sh 统一调用，专注 SP-A（资产真实性）与 SP-W-01~03（组件结构硬指标 & 可视化件声明）：
#   ① 组件真实性 (SP-A-01)       : Ix* 组件须在 idux-component-map.md 登记或显式声明
#   ② 模板真实性 (SP-A-02)       : page-* 模板 ID 须存在于 01-page-types.md 或显式声明借用
#   ③ 色值合规性 (SP-A-03)       : 色值命中 03-design-assets/ 色板（草图折叠区与 data-viz="REF" 内部图形免误杀）
#   ④ 按钮用色铁律 (SP-A-04)     : 无红色实心按钮 / 无"危险型"按钮
#   ⑤ 引用可解析性 (SP-A-05)     : 提及的 .md 规范文件本地存在
#   ⑥ 经验落点 (SP-A-06)         : D0x-EPxx（及历史 EP-xx）在第 7 节有承载落点，无空头引用
#   ⑦ 表单与组件硬指标 (SP-W-01/02): 表单左右结构 / 非必填星号占位 / 抽屉弹窗宽度档位与三段分区 / 容器选型一致(支持 h5) / 按钮顺序与无前置图标 / UI文案无经验编号 / 提示条无边框无红底
#   ⑧ 可视化件声明完整性 (SP-W-03): 在册件型七字段与可执行风格值；支持 REF / 资产未覆盖 分流校验（语义+依据+Part1溯源+微调说明）
#
# 已移出/合并项（避免重复双跑与僵尸项）：
#   - 原 1/11（结构与场景）→ 已统一归口 gate.js SP-S-01~07
#   - 原 9/11（纵向 signatures/Type-0x.json）→ 纵向库已于 2026-11-10 停用，删除
#   - 原 11b（viz-audit.js）→ 已由 gate.js SP-W-12 唯一调用，消除双跑
#   - 原 11c（viz-index.js --check）→ 属仓库级维护自检，移出业务交付门禁
#
# 退出码: 0 = 全部通过；1 = 存在未通过项（必须先修）
# ============================================================
set -uo pipefail

SPEC="${1:-}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSETS="$ROOT/03-design-assets"
MAP="$ASSETS/components/idux-component-map.md"
PAGETYPES="$ASSETS/page-templates/01-page-types.md"

if [ -z "$SPEC" ] || [ ! -f "$SPEC" ]; then
  echo "用法: bash tools/design-spec-selfcheck.sh <design-spec-xxx.html>"
  exit 2
fi
for f in "$MAP" "$PAGETYPES"; do
  [ -f "$f" ] || { echo "缺少设计资产文件: $f"; exit 2; }
done

FAIL=0
is_bad() { FAIL=$((FAIL + 1)); }
head_() { printf '\n🔎 %s\n' "$1"; }

echo "============================================================"
echo " 织雨设计说明书 · 资产与组件规范机检（8 项精准版）"
echo " 目标文件: $SPEC"
echo "============================================================"

# ---------- 1/8 组件真实性（SP-A-01）----------
head_ "1/8 组件真实性（SP-A-01 · 已登记 或 已显式声明来源）"
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

# ---------- 2/8 页面模板真实性（SP-A-02）----------
head_ "2/8 页面模板真实性（SP-A-02 · 资产库存在 或 已显式声明借用）"
REALTPL=$(grep -oE 'page-[a-z]+-[a-z]+' "$PAGETYPES" | sort -u)
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

# ---------- 3/8 色值白名单（SP-A-03 · 草图折叠区与 REF 内部图形免误杀）----------
head_ "3/8 色值合规（SP-A-03 · 命中 03-design-assets/ 色板；草图折叠区与 data-viz=\"REF\" 内部图形豁免）"
COLOR_RESULT=$(node -e '
  const fs = require("fs");
  const path = require("path");
  const specPath = process.argv[1];
  const assetsDir = process.argv[2];

  // 收集 03-design-assets 下全部 .md 的白名单色值
  const white = new Set();
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith(".md")) {
        const txt = fs.readFileSync(p, "utf8");
        (txt.match(/#[0-9A-Fa-f]{6}\b/g) || []).forEach(c => white.add(c.toUpperCase()));
      }
    }
  }
  walk(assetsDir);

  let html = fs.readFileSync(specPath, "utf8");
  // 剔除草图折叠区（details.sketch-fold）
  html = html.replace(/<details[^>]*class="[^"]*sketch-fold[^"]*"[\s\S]*?<\/details>/gi, "");
  // 剔除 HTML 注释
  html = html.replace(/<!--[\s\S]*?-->/g, "");
  // 剔除 data-viz="REF..." 块内部的 <svg>...</svg> 与 <pre>/<code> 深色代码块（保骨微调协议：允许保留图表梯度色阶与代码语法高亮）
  html = html.replace(/<([a-zA-Z][\w-]*)[^>]*data-viz="REF[^"]*"[^>]*>[\s\S]*?<\/\1>/gi, (blk) => {
    return blk
      .replace(/<svg[\s\S]*?<\/svg>/gi, "")
      .replace(/<pre[\s\S]*?<\/pre>/gi, "");
  });
  // 同时剔除独立标注了 data-viz-ref-graphic 的 SVG/Canvas/代码块
  html = html.replace(/<(svg|pre)[^>]*data-viz-ref-graphic[^>]*>[\s\S]*?<\/\1>/gi, "");

  const bad = new Set();
  for (const line of html.split(/\r?\n/)) {
    if (/^\s*(<!--|>|\||\*|-|#)/.test(line)) continue;
    (line.match(/#[0-9A-Fa-f]{6}\b/g) || []).forEach(c => {
      const u = c.toUpperCase();
      if (!white.has(u)) bad.add(u);
    });
  }
  if (bad.size === 0) console.log("PASS|全部色值均命中设计资产白名单（草图折叠区与 REF 内部图形已按协议豁免）");
  else console.log("FAIL|非设计资产色值（严禁 AI 自造色值）: " + [...bad].sort().join(" "));
' "$SPEC" "$ASSETS")
COLOR_STATUS=$(echo "$COLOR_RESULT" | cut -d'|' -f1)
COLOR_MSG=$(echo "$COLOR_RESULT" | cut -d'|' -f2-)
if [ "$COLOR_STATUS" = "PASS" ]; then
  echo "  ✅ $COLOR_MSG"
else
  echo "  ❌ $COLOR_MSG"; is_bad
fi

# ---------- 4/8 按钮用色铁律（SP-A-04）----------
head_ "4/8 按钮用色铁律（SP-A-04 · 无红色实心按钮 / 无危险型按钮）"
DANGER_BTN=$(grep -nE '危险型' "$SPEC" | grep -vE '(扫描|不存在|严格|严禁|检查|铁律|规则|自检|说明)' || true)
if [ -z "$DANGER_BTN" ]; then
  echo "  ✅ 未出现\"危险型\"按钮"
else
  echo "  ❌ 出现\"危险型\"按钮（设计资产只有主按钮 / 普通按钮两种）"; is_bad
fi
REDBTN=$(grep -nE '<(button|span|a)[^>]*class="[^"]*btn[^"]*"[^>]*background:\s*(#D9363E|#CF171D|var\(--danger-t\))' "$SPEC" || true)
if [ -z "$REDBTN" ]; then
  echo "  ✅ 未检出红色实心按钮（danger 底色 + 白字）"
else
  echo "  ❌ 检出红色实心按钮:"; printf '%s\n' "$REDBTN" | sed 's/^/     /'; is_bad
fi

# ---------- 5/8 引用文件可解析（SP-A-05）----------
head_ "5/8 引用文件可解析（SP-A-05 · .md 必须存在）"
MISSING=""
SPEC_DIR="$(cd "$(dirname "$SPEC")" && pwd)"
for r in $(grep -oE '[^\s"'"'"'<>`()\[\]（）、，；：]+\.md' "$SPEC" | sort -u); do
  if [ -f "$ROOT/$r" ] || [ -f "$ASSETS/$r" ] || [ -f "$SPEC_DIR/$r" ] || [ -n "$(find "$ROOT" -name "$(basename "$r")" -not -path '*/node_modules/*' -print -quit 2>/dev/null)" ]; then :; else MISSING="$MISSING $r"; fi
done
if [ -z "$MISSING" ]; then
  echo "  ✅ 所有引用的 .md 文件均可解析"
else
  echo "  ❌ 引用了不存在的文件:$MISSING"; is_bad
fi

# ---------- 6/8 经验落点（SP-A-06）----------
head_ "6/8 经验落点（SP-A-06 · D0x-EPxx 须在第 7 节有承载，无空头引用）"
FOURTH=$(grep -n '<h2' "$SPEC" | sed -n '4p' | cut -d: -f1)
if [ -z "$FOURTH" ]; then
  FOURTH=$(grep -n '<h3[^>]*>\s*7\.' "$SPEC" | head -1 | cut -d: -f1)
fi
if [ -z "$FOURTH" ]; then
  echo "  ⚠️ 未定位到第四章 / 第7节，跳过本项"
else
  ORPHAN=""
  for ep in $(grep -oE 'EP-[0-9]+' "$SPEC" | sort -u); do
    REAL_REF=$(grep -nE "${ep}([^0-9]|$)" "$SPEC" | grep -vE '(如禁止写|禁止写入|举例|如：EP|EP-xx|说明|规则|禁止在 UI)' || true)
    [ -z "$REAL_REF" ] && continue
    n=$(printf '%s\n' "$REAL_REF" | cut -d: -f1 | awk -v t="$FOURTH" '$1 > t' | wc -l | tr -d ' ')
    [ "$n" -eq 0 ] && ORPHAN="$ORPHAN $ep"
  done
  ORPHANH=""
  for ep in $(grep -oE 'D[0-9][0-9]-EP[0-9]+' "$SPEC" | sort -u); do
    n=$(grep -nE "${ep}([^0-9]|$)" "$SPEC" | cut -d: -f1 | awk -v t="$FOURTH" '$1 > t' | wc -l | tr -d ' ')
    [ "$n" -eq 0 ] && ORPHANH="$ORPHANH $ep"
  done
  if [ -z "$ORPHAN" ] && [ -z "$ORPHANH" ]; then
    echo "  ✅ 全部经验编号均在第 7 节页面中有落点，无空头引用"
  else
    [ -n "$ORPHAN" ] && { echo "  ❌ 历史纵向空头引用:$ORPHAN"; is_bad; }
    [ -n "$ORPHANH" ] && { echo "  ❌ 横向空头引用（D0x-EPxx 被引用但无页面承载）:$ORPHANH"; is_bad; }
  fi
fi

# ---------- 7/8 表单与组件结构硬指标（SP-W-01 / SP-W-02）----------
head_ "7/8 表单与组件结构硬指标（SP-W-01/02 · 左右结构 / 星号占位 / 容器档位与选型(含h5) / 三段分区 / 按钮 / 提示条）"
WF_RESULT=$(node -e '
  const fs = require("fs");
  const raw = fs.readFileSync(process.argv[1], "utf8");
  const spec = raw.replace(/<details[^>]*class="[^"]*sketch-fold[^"]*"[\s\S]*?<\/details>/gi, "");
  const errors = [];
  const lines = spec.split(/\r?\n/);

  // 7a 表单左右结构（SP-W-01）
  if (/(<br\s*\/?>\s*<input|[:：]\s*(<\/span>)?\s*<br\s*\/?>\s*<input|<label>[^<]*<br\s*\/?>\s*<input)/i.test(spec)) {
    errors.push("【表单上下堆叠】违反 design-form.md 第 14 条左右结构铁律，严禁 Label 换行堆叠控件");
  }

  // 收集全部线框按钮
  const btnRe = /<span class="(wf-btn-primary|wf-btn|wf-btn-disabled)"[^>]*>([^<]*)<\/span>/g;
  const btns = [];
  let m;
  while ((m = btnRe.exec(spec)) !== null) {
    btns.push({ kind: m[1], text: m[2].trim(), idx: m.index });
  }

  // 7b 页脚按钮顺序：主按钮在左、取消/关闭在右
  for (let i = 0; i < btns.length - 1; i++) {
    const a = btns[i], b = btns[i + 1];
    if (a.kind === "wf-btn" && /^(取消|关闭)$/.test(a.text) && b.kind === "wf-btn-primary" && (b.idx - a.idx) < 400) {
      errors.push("【按钮顺序】「" + a.text + "」紧邻排在主按钮之前；页脚须主按钮在左、取消/关闭在右");
    }
  }

  // 7c 操作按钮默认不带前置图标（刷新 ⟳ / ↻ 与搜索 🔍 白名单除外）
  const iconLead = /^[+＋✚✎✕✖⚙🗑➕]/u;
  const iconBtnOk = new Set(["⟳", "↻", "🔍"]);
  for (const b of btns) {
    if (iconBtnOk.has(b.text)) continue;
    if (iconLead.test(b.text)) {
      errors.push("【按钮图标】按钮「" + b.text + "」带前置图标；按 comp-button.md 默认不带图标");
    }
  }

  // 7d 表单 Label 非必填星号占位对齐
  const labelRe = /<div class="wf-form-label"[^>]*>([\s\S]*?)<\/div>/g;
  const labels = [];
  while ((m = labelRe.exec(spec)) !== null) labels.push(m[1]);
  const hasRequired = labels.some(l => /class="req"|#F52727|#D9363E/.test(l) && /\*/.test(l));
  if (hasRequired) {
    const seen = new Set();
    for (const l of labels) {
      if (!(/\*/.test(l)) && !/visibility\s*:\s*hidden/.test(l)) {
        const name = l.replace(/<[^>]+>/g, "").trim();
        if (!seen.has(name)) { seen.add(name); errors.push("【表单对齐】Label「" + name + "」未预留星号占位；非必填项须补隐形占位以保证左对齐"); }
      }
    }
  }

  // 7e 弹窗/抽屉宽度档位（400/480/640/720/800/960/1200）
  const allowed = new Set([400, 480, 640, 720, 800, 960, 1200]);
  for (const line of lines) {
    if (!/(IxModal|IxDrawer|IxProFormModal|IxProFormDrawer)/.test(line)) continue;
    const wm = line.match(/宽\s*(\d{3,4})\s*px/);
    if (wm && !allowed.has(parseInt(wm[1], 10))) {
      errors.push("【容器宽度】弹窗/抽屉宽度 " + wm[1] + "px 不在允许档位（400/480/640/720/800/960/1200）");
    }
  }

  // 7f 容器选型一致性（修复：同时支持新结构 <h5 id="page-"> 与旧结构 <h3）
  const DRAWER = new Set(["page-form-drawer", "page-detail-drawer", "page-list-drawer"]);
  const MODAL = new Set(["page-form-modal", "page-list-modal"]);
  let pageSegs = spec.split(/<h5[^>]*id="page-/).slice(1).map(s => s.split(/<h5[^>]*id="page-|<h4[^>]*class="[^"]*domain|<\/section>/)[0]);
  if (!pageSegs.length) {
    pageSegs = spec.split(/<h3[^>]*>/).slice(1).map(s => s.split(/<h3|<h2|<\/body>/)[0]);
  }
  for (const sec of pageSegs) {
    if (sec.indexOf("wf-container") === -1) continue;
    const t = sec.match(/page-[a-z]+-[a-z]+/);
    if (!t) continue;
    const tpl = t[0];
    const hasDrawer = sec.indexOf("wf-drawer-body") !== -1;
    const hasModal = sec.indexOf("wf-modal-body") !== -1;
    if (DRAWER.has(tpl) && hasModal && !hasDrawer) errors.push("【容器选型】模板 " + tpl + " 是抽屉页，线框却用了弹窗容器（wf-modal-body）");
    if (MODAL.has(tpl) && hasDrawer && !hasModal) errors.push("【容器选型】模板 " + tpl + " 是弹窗页，线框却用了抽屉容器（wf-drawer-body）");
  }

  // 7g UI 文案不泄漏经验编号
  const contRe = /<div class="wf-container"[^>]*>/g;
  const seenUI = new Set();
  while ((m = contRe.exec(spec)) !== null) {
    const tail = spec.slice(m.index);
    const annRel = tail.search(/<div class="wf-annotation"/);
    const region = annRel === -1 ? tail : tail.slice(0, annRel);
    const hits = region.match(/EP-\d+|D\d\d-EP\d+/g) || [];
    hits.forEach(h => seenUI.add(h));
  }
  if (seenUI.size) errors.push("【UI文案】线框可视区出现经验编号 " + [...seenUI].join("、") + "；不得写进 UI 文案");

  // 7h 弹窗/抽屉三段分区硬指标（48px无底线标题栏 + 56px底栏 + 对齐方向）
  const boxRe = /<div class="[^"]*(wf-modal-body|wf-drawer-body)[^"]*"[^>]*>/g;
  while ((m = boxRe.exec(spec)) !== null) {
    const kind = m[1];
    const tail = spec.slice(m.index);
    const endRel = tail.search(/<div class="wf-annotation"/);
    const region = endRel === -1 ? tail : tail.slice(0, endRel);
    const name = kind === "wf-modal-body" ? "弹窗" : "抽屉";
    if (/wf-header[^>]*border-bottom/.test(region)) errors.push("【" + name + "分区】标题栏带底部分割线；comp-modal / comp-drawer 要求标题栏无底部分割线");
    if (region.indexOf("height:48px") === -1 && region.indexOf("wf-drawer-hd") === -1 && region.indexOf("wf-modal-hd") === -1) {
      errors.push("【" + name + "分区】标题栏未标 48px 高度（或使用标准 .wf-drawer-hd / .wf-modal-hd 原语）");
    }
    if (region.indexOf("height:56px") === -1 && region.indexOf("wf-drawer-ft") === -1 && region.indexOf("wf-modal-ft") === -1) {
      errors.push("【" + name + "分区】底部按钮栏未标 56px 高度（或使用标准 .wf-drawer-ft / .wf-modal-ft 原语）");
    }
    if (kind === "wf-modal-body" && region.indexOf("justify-content:flex-end") === -1 && region.indexOf("wf-modal-ft") === -1) {
      errors.push("【弹窗分区】页脚按钮组未右对齐；comp-modal.md 要求按钮组整体右对齐（主按钮在左、取消在右）");
    }
    if (kind === "wf-drawer-body" && region.indexOf("justify-content:flex-start") === -1 && region.indexOf("wf-drawer-ft") === -1) {
      errors.push("【抽屉分区】页脚按钮未左对齐；comp-drawer.md 要求按钮左对齐、主按钮最左");
    }
  }

  // 7i 提示条规范（comp-alert.md）：无边框、无红底块（排除可视化瀑布时间轴行 grid-template-columns）
  const redDivs = (spec.match(/<div[^>]*background:\s*(#FFF1F0|var\(--danger-b\))[^>]*>/gi) || [])
    .filter(tag => !/grid-template-columns|data-viz|trace-row/i.test(tag));
  if (redDivs.length > 0) {
    errors.push("【提示条】出现红色底块级警示条；comp-alert.md 只有普通条/告警条两档，红色不得用作 Alert 底色");
  }
  if (/<div[^>]*background:\s*(#FFFAF2|#F7F7F8)[^>]*border\s*:/i.test(spec) || /<div[^>]*border\s*:[^>]*background:\s*(#FFFAF2|#F7F7F8)/i.test(spec)) {
    errors.push("【提示条】普通/告警提示条带了边框；comp-alert.md 规定无边框");
  }

  if (errors.length > 0) console.log("FAIL|" + [...new Set(errors)].join("；"));
  else console.log("PASS|表单与组件结构硬指标全绿（左右结构 / 星号占位 / 容器档位与选型 / 三段分区 / 按钮 / 提示条）");
' "$SPEC")
WF_STATUS=$(echo "$WF_RESULT" | cut -d'|' -f1)
WF_MSG=$(echo "$WF_RESULT" | cut -d'|' -f2-)
if [ "$WF_STATUS" = "PASS" ]; then
  echo "  ✅ $WF_MSG"
else
  echo "  ❌ $WF_MSG"; is_bad
fi

# ---------- 8/8 可视化件声明完整性（SP-W-03 · 支持 REF / 资产未覆盖 分流）----------
head_ "8/8 可视化件声明完整性（SP-W-03 · 在册件型七字段与风格值 / REF 分流校验）"
VIZ_SIG="$ROOT/01-system-solution-design/②设计思考与决策/需求大类设计决策/signatures/viz-signatures.json"
VIZ_RESULT=$(node -e '
  const fs = require("fs");
  const spec = fs.readFileSync(process.argv[1], "utf8");
  let reg = null;
  try { reg = JSON.parse(fs.readFileSync(process.argv[2], "utf8")); } catch (e) { reg = null; }
  const required = (reg && reg.required_fields) || ["件型","件型键","线框与几何","图形编码规则","风格规范","交互与退化","可替代性"];
  const blocks = [...spec.matchAll(/<div class="viz-decl"[^>]*>([\s\S]*?)<\/div>/g)].map(m => m[1]);
  if (blocks.length === 0) { console.log("PASS|本说明书未声明可视化件，本项自适应跳过"); process.exit(0); }
  const errors = [];
  let refCnt = 0, stdCnt = 0;
  blocks.forEach((body, i) => {
    const plain = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const keyCell = body.match(/<b>\s*件型键\s*<\/b>[\s\S]{0,120}?<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/);
    const keyText = keyCell ? keyCell[1].replace(/<[^>]+>/g, " ").trim() : "";
    const isRef = /^REF\b/i.test(keyText) || /REF\s*\/\s*资产未覆盖/.test(keyText);

    if (isRef) {
      refCnt++;
      // REF 保骨微调分流校验：不强求 VIZ-xx 与 件型线框.md，改查「语义 + 依据 + Part1/草图溯源 + 微调说明」
      if (!/语义/.test(plain)) errors.push("第 " + (i + 1) + " 个 REF《可视化件声明》缺「语义」说明");
      if (!/(语义不符|资产未覆盖)/.test(plain)) errors.push("第 " + (i + 1) + " 个 REF《可视化件声明》缺依据（须写「语义不符」或「资产未覆盖」）");
      if (!/(草图|Part1|P\d|DX-)/i.test(plain)) errors.push("第 " + (i + 1) + " 个 REF《可视化件声明》缺 Part1/草图溯源");
      if (!/(微调|映射|color-map|Token|#[0-9A-Fa-f]{6})/i.test(plain)) errors.push("第 " + (i + 1) + " 个 REF《可视化件声明》缺样式微调/色值对齐说明");
      return;
    }

    stdCnt++;
    const missing = required.filter(f => body.indexOf(f) === -1);
    if (missing.length) errors.push("第 " + (i + 1) + " 个《可视化件声明》缺字段：" + missing.join("、"));
    if (!/VIZ-\d{2}[-A-Z0-9]*|CHART-/.test(body)) errors.push("第 " + (i + 1) + " 个《可视化件声明》未落件型键（须 VIZ-xx-<形态>、CHART-* 或 REF / 资产未覆盖）");
    if (!/件型线框\.md/.test(body)) errors.push("第 " + (i + 1) + " 个《可视化件声明》未引用件型线框.md（线框与几何无出处）");
    const cellM = body.match(/<b>风格规范<\/b>[\s\S]{0,60}?<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/);
    const styleCell = cellM ? cellM[1] : body;
    if (!/档\s*[AB]|风格档/.test(styleCell)) errors.push("第 " + (i + 1) + " 个《可视化件声明》「风格规范」缺档名（须写明 档 A / 档 B）");
    const toks = new Set((styleCell.match(/glow-blue-s1|bg-blue-wash|border-ghost|dropshadow-s1|graphite-[a-z0-9-]+|blue-l\d+|r2|r4/gi) || []).map(x => x.toLowerCase()));
    if (toks.size < 2) errors.push("第 " + (i + 1) + " 个《可视化件声明》「风格规范」缺可执行 token（至少 2 个）");
    if (!/#[0-9A-Fa-f]{3,8}|rgba?\(|linear-gradient\(|\d+px/.test(styleCell)) errors.push("第 " + (i + 1) + " 个《可视化件声明》「风格规范」缺具体值（渐变 / rgba / hex / px 至少一项）");
  });
  if (errors.length) console.log("FAIL|" + errors.join("；"));
  else console.log("PASS|已核验 " + blocks.length + " 个《可视化件声明》（在册件型 " + stdCnt + " + REF 保骨微调 " + refCnt + "），均合规");
' "$SPEC" "$VIZ_SIG")
VIZ_STATUS=$(echo "$VIZ_RESULT" | cut -d'|' -f1)
VIZ_MSG=$(echo "$VIZ_RESULT" | cut -d'|' -f2-)
if [ "$VIZ_STATUS" = "PASS" ]; then
  echo "  ✅ $VIZ_MSG"
else
  echo "  ❌ $VIZ_MSG"; is_bad
fi

# ---------- 附：线框数据完整度（提示项，不计入 8 项通过率）----------
head_ "附：线框数据完整度（提示项 · 不计入通过率）"
PLACEHOLDER=$(node -e '
  const fs = require("fs");
  const s = fs.readFileSync(process.argv[1], "utf8")
    .replace(/<details[^>]*class="[^"]*sketch-fold[^"]*"[\s\S]*?<\/details>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ");
  console.log((s.match(/(?:^|[^\w-])__(?:[^\w-]|$)/g) || []).length);
' "$SPEC")
if [ "${PLACEHOLDER:-0}" -gt 0 ]; then
  echo "  ⚠️ 线框区仍有 ${PLACEHOLDER} 处占位符 __；按 5.0 铁律第 18 条，须用跨页自洽的示例数据补齐"
else
  echo "  ✅ 线框区无占位符，数据完整度符合标准"
fi

# ---------- 结论 ----------
echo
echo "============================================================"
if [ "$FAIL" -eq 0 ]; then
  echo "🎉 资产与组件机检通过（8/8）。"
  exit 0
else
  echo "🚫 资产与组件机检未通过（$FAIL 项）：请按报错逐项修复。"
  exit 1
fi
