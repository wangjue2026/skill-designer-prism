#!/usr/bin/env bash
# 织雨 · Part3 高保真 Demo 三段式准出门禁（EX-6.0-01~12）
# 用法: bash tools/gate-demo.sh <demo.html> <design-spec.html> [--no-visual] [--no-smoke] [--screenshot=<png>]
set -uo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEMO="${1:-}"
SPEC="${2:-}"

if [ -z "$DEMO" ] || [ -z "$SPEC" ]; then
  echo "用法: bash tools/gate-demo.sh <demo.html> <design-spec.html> [--no-visual] [--no-smoke] [--screenshot=<png>]"
  exit 2
fi

NO_VISUAL=0
NO_SMOKE=0
SHOT_ARG=""
for arg in "${@:3}"; do
  case "$arg" in
    --no-visual) NO_VISUAL=1 ;;
    --no-smoke) NO_SMOKE=1 ;;
    --screenshot=*) SHOT_ARG="$arg" ;;
  esac
done

RC=0

echo ">>> [1/3] 跨文件承接与交互动效对账 (gate.js demo)"
node "$DIR/tools/gate.js" demo "$DEMO" "$SPEC" || RC=1

if [ "$NO_VISUAL" -eq 0 ]; then
  echo ""
  echo ">>> [2/3] 视觉门禁 7 条人工实证红线 (visual-audit.js --profile=demo)"
  node "$DIR/tools/visual-audit.js" "$DEMO" --profile=demo || RC=1
else
  echo ""
  echo ">>> [2/3] 视觉门禁已按 --no-visual 跳过"
fi

if [ "$NO_SMOKE" -eq 0 ]; then
  echo ""
  echo ">>> [3/3] 浏览器运行时冒烟自检 (demo-smoke.js)"
  if [ -n "$SHOT_ARG" ]; then
    node "$DIR/tools/demo-smoke.js" "$DEMO" "$SHOT_ARG" || RC=1
  else
    node "$DIR/tools/demo-smoke.js" "$DEMO" || RC=1
  fi
else
  echo ""
  echo ">>> [3/3] 运行时冒烟已按 --no-smoke 跳过"
fi

echo ""
if [ "$RC" -eq 0 ]; then
  echo "🎉 Part3 Demo 准出门禁三段全绿，可交付规划人员体验！"
else
  echo "🚫 Part3 Demo 准出门禁未通过，请按上方报错项修复后重跑。"
fi
exit "$RC"
