#!/usr/bin/env bash
# ============================================================
# Part B · 设计说明书整体准出门禁（SP）
# 口径唯一来源：04-workflows-and-cases/准出门禁总表.md
#
# 组成（职责去重、零双跑）：
#   gate.js sp               —— SP-S 结构规模 / SP-W-04 数据完整 / SP-W-06~12 承接·能力·形态·面板·决策域·动线·件型对账 / SP-C 内容一致性 / SP-D 六节契约
#   design-spec-selfcheck.sh —— SP-A 资产真实性（6项）+ SP-W 组件结构硬指标 & 可视化件声明（2项）= 8 项精准机检
#   visual-audit.js          —— V 组视觉专项（--profile=wireframe）
#
# 用法: bash tools/gate-sp.sh design-spec-<业务名>.html [草图-<业务名>.html] [--no-visual] [--no-measure]
#       传草图时按说明书「方案来源」自动过滤选定方案的 ph-ledger / data-dx 做跨文件对账
# 退出码: 0 = 可交规划人员确认；1 = 退回（按编号定位到哪一组）
# ============================================================
set -uo pipefail
SPEC="${1:-}"
SKETCH="${2:-}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 视觉专项开关：--no-visual 跳过 V 组；--no-measure 只关量测项（与 gate-ex.sh 对齐）
NO_VISUAL=0
NO_MEASURE=0
for a in "$@"; do
  [ "$a" = "--no-visual" ] && NO_VISUAL=1
  [ "$a" = "--no-measure" ] && NO_MEASURE=1
done
case "${SKETCH:-}" in --*) SKETCH="";; esac

if [ -z "$SPEC" ] || [ ! -f "$SPEC" ]; then
  echo "用法: bash tools/gate-sp.sh design-spec-<业务名>.html [草图-<业务名>.html] [--no-visual] [--no-measure]"
  exit 2
fi
if [ -n "$SKETCH" ] && [ ! -f "$SKETCH" ]; then
  echo "⚠️ 草图文件不存在: $SKETCH（已跳过 SP-W-07 / SP-W-06⑥ 跨文件对账）"
  SKETCH=""
fi

RC=0
node "$DIR/gate.js" sp "$SPEC" "$SKETCH" || RC=1
echo
bash "$DIR/design-spec-selfcheck.sh" "$SPEC" || RC=1
echo

# 视觉专项（V 组）：visual-audit.js --profile=wireframe
if [ "$NO_VISUAL" -eq 0 ] && [ -f "$DIR/visual-audit.js" ]; then
  VA_ARGS=("$SPEC" "--profile=wireframe")
  if [ "$NO_MEASURE" -eq 1 ]; then VA_ARGS+=("--no-measure"); fi
  node "$DIR/visual-audit.js" "${VA_ARGS[@]}" || RC=1
else
  echo "  ⚠️  视觉专项（V 组）已按 --no-visual 跳过：本次交付回执须注明\"视觉未检视\""
fi

echo
echo "============================================================"
if [ "$RC" -eq 0 ]; then
  echo "🎉 SP 准出：结构 + 资产 + 线框 + 内容 + 自包含 + 视觉均合格，可交共识确认。"
else
  echo "🚫 SP 未过：按上面编号退回对应环节，严禁带病交付。"
fi
exit "$RC"
