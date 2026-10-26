#!/usr/bin/env bash
# ============================================================
# Part B · 设计说明书整体准出门禁（SP）
# 口径唯一来源：04-workflows-and-cases/准出门禁总表.md
#
# 组成：
#   gate.js sp               —— SP-S 结构 / SP-W-04 数据完整 / SP-W-06 占位展开 / SP-W-07 占位能力逐条落地 / SP-C 内容一致性 / SP-D 六节契约
#   design-spec-selfcheck.sh —— SP-A 资产真实性 + SP-W 线框规范（11 项）
#
# 用法: bash tools/gate-sp.sh design-spec-<业务名>.html [草图-<业务名>.html]
#       传草图时做跨文件对账：草图 ph-ledger 里每条 CAP 的能力项，必须在该页映射清单里出现
# 退出码: 0 = 可交规划人员确认；1 = 退回（按编号定位到哪一组）
# ============================================================
set -uo pipefail
SPEC="${1:-}"
SKETCH="${2:-}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -z "$SPEC" ] || [ ! -f "$SPEC" ]; then
  echo "用法: bash tools/gate-sp.sh design-spec-<业务名>.html [草图-<业务名>.html]"
  exit 2
fi
if [ -n "$SKETCH" ] && [ ! -f "$SKETCH" ]; then
  echo "⚠️ 草图文件不存在: $SKETCH（已跳过 SP-W-07 跨文件对账）"
  SKETCH=""
fi

RC=0
node "$DIR/gate.js" sp "$SPEC" "$SKETCH" || RC=1
echo
bash "$DIR/design-spec-selfcheck.sh" "$SPEC" || RC=1

echo
echo "============================================================"
if [ "$RC" -eq 0 ]; then
  echo "🎉 SP 准出：结构 + 资产 + 线框 + 内容 + 自包含均合格，可交共识确认。"
else
  echo "🚫 SP 未过：按上面编号退回对应环节，严禁带病交付。"
fi
exit "$RC"
