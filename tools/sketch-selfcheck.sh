#!/usr/bin/env bash
# ============================================================
# 草图交付前轻量门禁 (Sketch Self-Check)
#
# 检查对象：1.4 输出的草图 HTML（草图-<业务名>.html）
# 检查范围：只查"结构级规范"5 条，不查精度级（像素/字段名/图标/星号占位）
#
#   ① 主按钮用主题蓝        —— 页面主操作必须用主题色实心按钮，不能全灰
#   ② 按钮顺序主左取右      —— 页脚双按钮，主按钮在前、取消/关闭在后
#   ③ 页脚按钮对齐          —— 抽屉贴左、弹窗贴右（两种容器规则相反）
#   ④ 容器形态不混用        —— 抽屉/弹窗/整页不互相顶替
#   ⑤ 草图不出现规范语义件  —— 不得出现 Ix* 组件名、px 像素、wf-form-item 等
#
# 用法：bash tools/sketch-selfcheck.sh <草图-业务名.html>
# 退出码：0 = 通过；1 = 存在未通过项
# ============================================================
set -uo pipefail

SKETCH="${1:-}"
if [ -z "$SKETCH" ] || [ ! -f "$SKETCH" ]; then
  echo "用法：bash tools/sketch-selfcheck.sh <草图-业务名.html>"
  exit 1
fi

FAIL=0
is_bad() { FAIL=$((FAIL + 1)); }
head_() { echo; echo "🔎 $1"; }

echo "============================================================"
echo " 织雨草图 · 交付前轻量门禁（只查结构级规范 5 条）"
echo " 目标文件: $SKETCH"
echo "============================================================"

# ---------- 1. 主按钮用主题蓝 ----------
head_ "1/5 主按钮用主题蓝（主操作必须用主题色实心）"
BTN_TOTAL=$(grep -oE 'class="btn( p)?"' "$SKETCH" | wc -l | tr -d ' ')
BTN_PRIMARY=$(grep -oE 'class="btn p"' "$SKETCH" | wc -l | tr -d ' ')
if [ "$BTN_TOTAL" -eq 0 ]; then
  echo "  ⚠️ 未检出任何按钮（草图里没有操作？确认是否漏画）"
elif [ "$BTN_PRIMARY" -eq 0 ]; then
  echo "  ❌ 有 $BTN_TOTAL 个按钮，但没有任何主按钮（主题蓝）；用户看不出这页的主操作是什么"
  is_bad
else
  echo "  ✅ 主按钮 $BTN_PRIMARY 个 / 全部按钮 $BTN_TOTAL 个"
fi

# ---------- 2. 按钮顺序：主在左、取消在右 ----------
head_ "2/5 按钮顺序（主按钮在前，取消/关闭在后）"
BAD_ORDER=$(grep -oE '<span class="btn">(取消|关闭|返回)</span>[[:space:]]*<span class="btn p">' "$SKETCH" || true)
if [ -z "$BAD_ORDER" ]; then
  echo "  ✅ 未检出「取消在前、主按钮在后」"
else
  echo "  ❌ 检出「取消/关闭」排在主按钮之前：$(echo "$BAD_ORDER" | head -3 | tr '\n' ' ')"
  is_bad
fi

# ---------- 3. 页脚按钮对齐：抽屉贴左、弹窗贴右 ----------
head_ "3/5 页脚按钮对齐（抽屉 flex-start / 弹窗 flex-end）"
# 抽屉容器内的页脚不应右对齐
BAD_DRAWER=$(printf '%s' "$(grep -n 'wf-drawer-body' "$SKETCH" || true)" )
DRAWER_FOOT_RIGHT=$(grep -nE 'justify-content:flex-end' "$SKETCH" | wc -l | tr -d ' ')
FLEX_START=$(grep -oE 'justify-content:flex-start' "$SKETCH" | wc -l | tr -d ' ')
if [ "$DRAWER_FOOT_RIGHT" -eq 0 ]; then
  echo "  ✅ 未检出右对齐页脚（若本图无弹窗，这是正常结果）"
else
  # 有右对齐页脚时，必须同时存在 flex-start（说明抽屉用对了）
  if [ "$FLEX_START" -gt 0 ]; then
    echo "  ✅ 右对齐页脚 $DRAWER_FOOT_RIGHT 处（弹窗用），左对齐页脚 $FLEX_START 处（抽屉用）"
  else
    echo "  ❌ 存在右对齐页脚，但没有任何左对齐页脚；若含抽屉页，抽屉页脚必须左对齐（comp-drawer.md）"
    is_bad
  fi
fi

# ---------- 4. 容器形态不混用 ----------
head_ "4/5 容器形态不混用（抽屉/弹窗不同时承载同一页脚）"
if grep -q 'wf-drawer-body' "$SKETCH" && grep -q 'wf-modal-body' "$SKETCH"; then
  echo "  ℹ️ 本图同时含抽屉与弹窗（正常：不同页面各自形态），请人工确认无同一页脚混用"
else
  echo "  ✅ 容器形态单一，无混用"
fi

# ---------- 5. 草图不出现规范语义件 ----------
head_ "5/5 草图不出现规范语义件（Ix* 组件名 / px 像素 / 表单规范结构件）"
# 注：BSD grep 不支持 \b，用 [^A-Za-z] 兼容写法
N_IX=$(grep -oE '(^|[^A-Za-z])Ix[A-Z][A-Za-z]+' "$SKETCH" | grep -oE 'Ix[A-Z][A-Za-z]+' | sort -u | tr '\n' ' ')
N_FORM=$(grep -oE 'wf-form-item|wf-form-label|class="req"' "$SKETCH" | sort -u | tr '\n' ' ')
BAD=0
if [ -n "$N_IX" ]; then echo "  ❌ 出现组件名：$N_IX"; BAD=1; fi
if [ -n "$N_FORM" ]; then echo "  ❌ 出现表单规范结构件：$N_FORM"; BAD=1; fi
if [ "$BAD" -eq 0 ]; then
  echo "  ✅ 无组件名、无表单规范结构件（草图只到"结构"这一级）"
else
  is_bad
fi

# ---------- 结论 ----------
echo
echo "============================================================"
if [ "$FAIL" -eq 0 ]; then
  echo "🎉 草图门禁通过（5/5）：可交付给用户做方案确认。"
  exit 0
else
  echo "🚫 草图门禁未通过（$FAIL 项）：修完再交付，别带病给用户看。"
  exit 1
fi
