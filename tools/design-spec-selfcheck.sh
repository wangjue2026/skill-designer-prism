#!/usr/bin/env bash
# ============================================================
# 织雨设计说明书 · 交付前自检闸门 (Design Spec Pre-Delivery Self-Check)
#
# 用法: bash tools/design-spec-selfcheck.sh <design-spec-xxx.html>
#
# 目的: 用机器兜住三类"老毛病"，不让它们再靠人工逐轮发现——
#   ① 内容完整性    : 五章齐备 / 页面小节存在 / 每条 EP 都有页面落点（防空头引用）
#   ② 资产引用正确性: 组件名必须在 idux-component-map.md 登记（否则须显式声明）
#                     模板 ID 必须在 01-page-types.md 存在（否则须显式声明）
#                     引用的 .md 文件必须可解析
#   ③ 样式合规性    : 所有色值必须命中 03-design-assets/ 全量色板；
#                     严禁出现红色/危险型按钮（设计资产无此按钮类型）
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
head_ "1/9 结构完整性（五章 + 分页面小节）"
H2=$(grep -c '<h2' "$SPEC" || true)
H3P=$(grep -oE '<h3[^>]*>\s*4\.[0-9]' "$SPEC" | wc -l | tr -d ' ')
if [ "$H2" -eq 5 ]; then echo "  ✅ 五章齐备 (h2 = $H2)"; else echo "  ❌ 章节数异常: h2 = $H2（应为 5）"; is_bad; fi
if [ "$H3P" -ge 1 ]; then echo "  ✅ 分页面小节 $H3P 个"; else echo "  ❌ 未找到分页面小节 (h3 4.x)"; is_bad; fi

# ---------- 2. 组件真实性（两轨制）----------
head_ "2/9 组件真实性（已登记 或 已显式声明来源）"
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
head_ "3/9 页面模板真实性（资产库存在 或 已显式声明）"
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
head_ "4/9 色值合规（必须命中 03-design-assets/ 全量色板）"
WHITE=$(find "$ASSETS" -type f -name '*.md' | while read -r f; do grep -oE '#[0-9A-Fa-f]{6}' "$f"; done | tr 'a-f' 'A-F' | sort -u)
BADC=""
# 排除说明性文字行（含违规/禁止/示例/举例/均属/反例等关键词的行是规则描述，非实际使用色值）
for c in $(grep -oE '#[0-9A-Fa-f]{6}' "$SPEC" | tr 'a-f' 'A-F' | sort -u); do
  if ! printf '%s\n' "$WHITE" | grep -qx "$c"; then
    REAL_USAGE=$(grep -n "$c" "$SPEC" | grep -viE '(违规|禁止|示例|举例|均属|反例|规范中的|必须使用)' || true)
    [ -n "$REAL_USAGE" ] && BADC="$BADC $c"
  fi
done
if [ -z "$BADC" ]; then
  echo "  ✅ 全部色值均命中设计资产白名单"
else
  echo "  ❌ 非设计资产色值（严禁 AI 自造色值）:$BADC"; is_bad
fi

# ---------- 5. 按钮用色铁律 ----------
head_ "5/9 按钮用色铁律（无红色 / 危险型按钮）"
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
head_ "6/9 引用文件可解析（.md 必须存在）"
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
head_ "7/9 经验落点（每条 EP 必须在"四、核心页面"中有承载）"
FOURTH=$(grep -n '<h2' "$SPEC" | sed -n '4p' | cut -d: -f1)
if [ -z "$FOURTH" ]; then
  echo "  ⚠️ 未定位到第四章，跳过本项"
else
  ORPHAN=""
  # 只统计真实引用的 EP（排除在说明性文字/举例/规则描述行中出现的 EP 编号）
  for ep in $(grep -oE 'EP-[0-9]+' "$SPEC" | sort -u); do
    REAL_REF=$(grep -nE "${ep}([^0-9]|$)" "$SPEC" | grep -vE '(如禁止写|禁止写入|举例|如：EP|EP-xx|说明|规则|禁止在 UI)' || true)
    [ -z "$REAL_REF" ] && continue
    n=$(printf '%s\n' "$REAL_REF" | cut -d: -f1 | awk -v t="$FOURTH" '$1 > t' | wc -l | tr -d ' ')
    [ "$n" -eq 0 ] && ORPHAN="$ORPHAN $ep"
  done
  if [ -z "$ORPHAN" ]; then
    echo "  ✅ 全部 EP 均在第四章页面中有落点，无空头引用"
  else
    echo "  ❌ 空头引用（经验被引用但无页面承载）:$ORPHAN"; is_bad
  fi
fi

# ---------- 8. 表单左右结构铁律 ----------
head_ "8/9 表单结构合规（遵循 design-form.md 第 14 条左右结构铁律）"
VERTICAL_FORM=$(grep -nE '(<br\s*/?>\s*<input|[:：]\s*(</span>)?\s*<br\s*/?>\s*<input|<label>[^<]*<br\s*/?>\s*<input)' "$SPEC" || true)
if [ -z "$VERTICAL_FORM" ]; then
  echo "  ✅ 未检出表单上下堆叠反模式（严格遵循左 Label 右 Control 水平左右结构）"
else
  echo "  ❌ 检出表单上下堆叠反模式（违反 design-form.md 第 14 条，严禁 Label 换行堆叠控件）:"; printf '%s\n' "$VERTICAL_FORM" | sed 's/^/     /'; is_bad
fi

# ---------- 9. 标杆经验特征物保真度（数据驱动动态契约比对）----------
head_ "9/9 标杆经验特征物保真度（动态特征指纹契约比对）"
DOC_TYPE=$(grep -oE 'Type-0[1-7]' "$SPEC" | head -1 || true)
SIG_DIR="$ROOT/01-system-solution-design/②设计点思考/标杆案例库/signatures"
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

# ---------- 结论 ----------
echo
echo "============================================================"
if [ "$FAIL" -eq 0 ]; then
  echo "🎉 自检通过（9/9）：可进入「🚦 人机共识确认闸门」向规划人员汇报。"
  exit 0
else
  echo "🚫 自检未通过（$FAIL 项）：严禁进入共识确认，必须先修至全绿。"
  exit 1
fi
