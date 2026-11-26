#!/usr/bin/env bash
# ============================================================
# Part A · 执行环节准出门禁（EX）
# 口径唯一来源：04-workflows-and-cases/准出门禁总表.md
#
# 用法:
#   bash tools/gate-ex.sh 1.1 _output/<业务名>/01-主场景-<业务名>.md
#   bash tools/gate-ex.sh 1.2 _output/<业务名>/02-体验目标-<业务名>.md _output/<业务名>/01-主场景-<业务名>.md
#   bash tools/gate-ex.sh 1.3 _output/<业务名>/03-突破点-<业务名>.md _output/<业务名>/01-主场景-<业务名>.md
#   bash tools/gate-ex.sh 1.4 _output/<业务名>/草图-<业务名>.html
#         # 附加开关注意量：--no-visual 跳过视觉专项（V 组）；--no-measure 只关量测项
#   bash tools/gate-ex.sh 4.1 _output/<业务名>/草图-<业务名>.html _output/<业务名>/04-扫读-<业务名>.md
#        # 定稿页面清单前（EX-4.1-01/02/04，静默执行）
#        # 第三参数 = 逐页决策域扫读表；不传则 EX-4.1-05 只告警，不阻断
#
# 1.4 会额外调用 sketch-selfcheck.sh（EX-1.4-04 结构级 6 条，含吸顶）
# 1.4 会额外调用 visual-audit.js --profile=sketch（视觉专项 V-01~V-27，判据见 门禁-V-视觉专项.md）
#     27 条全量可执行；端口未开时 V-01/V-02/V-05/V-24 报 ⚠️ 未量测；V-04/V-21 有 metrics 用 bbox、无端口走静态近似；V-05/V-24 量测部分观察期至 2026-12-10 只 WARN
# 1.4 机检覆盖 EX-1.4-01~39（01~20 + 21 交付面纯净 / 22 主图存在 / 24 框内解释禁令 / 25 页面内禁说明文字 / 26 跨方案切换面板 / 27 浮层页层级闭合 / 28 序列不换行 / 29 主图非卡片墙 / 30 每页声明视图数 / 31 高保真区可交接 / 32 图框内禁规格值 / 33 切换方案后落到 S1 / 34 四层结构与步骤齐 / 35 步骤-页面承接与闭环 / 36 重复副本一致 / 37 页面覆盖 / 38 两套剧本对齐 / 39 监控页可视化拆块契约（viz-split-audit，不数字符串））
# 39 反例自测：node tools/viz-split-audit.js --selftest（假拆/重复问题/换皮/单块放行必须红，真拆分必须绿）
# 4.1 为静默自检：不过就自己回补，不向用户提问、不新增停顿
# 退出码: 0 = 本环可准出；1 = 退回本环重做
# ============================================================
set -uo pipefail

# 视觉专项开场：任意位置出现 --no-visual / --no-measure 即生效（供单点调试与降级）
NO_VISUAL=0
NO_MEASURE=0
POS=()
for a in "$@"; do
  case "$a" in
    --no-visual)  NO_VISUAL=1 ;;
    --no-measure) NO_MEASURE=1 ;;
    *)            POS+=("$a") ;;
  esac
done

STAGE="${POS[0]:-}"
ART="${POS[1]:-}"
UP="${POS[2]:-}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -z "$STAGE" ] || [ -z "$ART" ] || [ ! -f "$ART" ]; then
  echo "用法: bash tools/gate-ex.sh <1.1|1.2|1.3|1.4|4.1> <产物文件> [上游场景文件 / 4.1 的扫读表] [--no-visual] [--no-measure]"
  exit 2
fi

RC=0
node "$DIR/gate.js" ex "$STAGE" "$ART" ${UP:+"$UP"} || RC=1

if [ "$STAGE" = "1.4" ]; then
  echo
  bash "$DIR/sketch-selfcheck.sh" "$ART" || RC=1
  echo

# 视觉专项（V 组）：草图 profile（17 条成品精度项不判）；端口未开时 4 条严格量测打 ⚠️ 未量测
  if [ "$NO_VISUAL" -eq 0 ] && [ -f "$DIR/visual-audit.js" ]; then
    VA_ARGS=("$ART" "--profile=sketch")
    if [ "$NO_MEASURE" -eq 1 ]; then VA_ARGS+=("--no-measure"); fi
    node "$DIR/visual-audit.js" "${VA_ARGS[@]}" || RC=1
  else
    echo "  ⚠️  视觉专项（V 组）已按 --no-visual 跳过：本次交付回执须注明"视觉未检视""
  fi
fi

echo
echo "============================================================"
if [ "$RC" -eq 0 ]; then
  echo "🎉 EX-$STAGE 准出：可进入下一环（人检项交付时自行核对）。"
else
  echo "🚫 EX-$STAGE 未过：退回本环重做，不许带病往下走。"
fi
exit "$RC"
