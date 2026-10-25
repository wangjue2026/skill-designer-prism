#!/usr/bin/env bash
# ============================================================
# Part A · 执行环节准出门禁（EX）
# 口径唯一来源：04-workflows-and-cases/准出门禁总表.md
#
# 用法:
#   bash tools/gate-ex.sh 1.1 _output/<业务名>/01-主场景-<业务名>.md
#   bash tools/gate-ex.sh 1.2 _output/<业务名>/02-体验目标-<业务名>.md _output/<业务名>/01-主场景-<业务名>.md
#   bash tools/gate-ex.sh 1.3 _output/<业务名>/03-突破点-<业务名>.md
#   bash tools/gate-ex.sh 1.4 _output/<业务名>/草图-<业务名>.html
#   bash tools/gate-ex.sh 4.1 _output/<业务名>/草图-<业务名>.html     # 定稿页面清单前（EX-4.1-01/02，静默执行）
#
# 1.4 会额外调用 sketch-selfcheck.sh（EX-1.4-04 结构级 5 条）
# 4.1 为静默自检：不过就自己回补，不向用户提问、不新增停顿
# 退出码: 0 = 本环可准出；1 = 退回本环重做
# ============================================================
set -uo pipefail
STAGE="${1:-}"
ART="${2:-}"
UP="${3:-}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -z "$STAGE" ] || [ -z "$ART" ] || [ ! -f "$ART" ]; then
  echo "用法: bash tools/gate-ex.sh <1.1|1.2|1.3|1.4|4.1> <产物文件> [上游场景文件]"
  exit 2
fi

RC=0
node "$DIR/gate.js" ex "$STAGE" "$ART" ${UP:+"$UP"} || RC=1

if [ "$STAGE" = "1.4" ]; then
  echo
  bash "$DIR/sketch-selfcheck.sh" "$ART" || RC=1
fi

echo
echo "============================================================"
if [ "$RC" -eq 0 ]; then
  echo "🎉 EX-$STAGE 准出：可进入下一环（人检项交付时自行核对）。"
else
  echo "🚫 EX-$STAGE 未过：退回本环重做，不许带病往下走。"
fi
exit "$RC"
