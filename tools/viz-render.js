#!/usr/bin/env node
/**
 * 可视化件还原包渲染器（D-11 判型后的唯一取用入口）
 *
 * 治的病：判型定键之后，AI 要跨「契约 json / 件型线框 / 样式卡」三个文件
 * 手工把 14 个字段拼成《风格规范》六格——拼漏、拼错、抄进容器实测，机检拦不住。
 * 本工具从唯一真源 件型落地契约.json 现场渲染，不落盘、不产生第二份手写真源。
 *
 * 用法：
 *   node tools/viz-render.js VIZ-01-A2           # 打印四块还原包
 *   node tools/viz-render.js VIZ-01-A2 --json    # 输出契约原始条目（供脚本/生成视图用）
 *   node tools/viz-render.js --list              # 列出全部键与实测状态
 */
'use strict';

const fs = require('fs');
const path = require('path');

const CONTRACT = path.join(__dirname, '..', '03-design-assets', 'visual-styles', '内容件', '件型落地契约.json');

function load() {
  const j = JSON.parse(fs.readFileSync(CONTRACT, 'utf-8'));
  const byKey = {};
  j.keys.forEach((k) => { byKey[k.key] = k; });
  return { contract: j, byKey };
}

const orNone = (v) => (v === null || v === undefined || v === '' ? '无' : v);

function styleLine(k) {
  const t = k.tokens || {};
  const segs = [
    '档 B（默认；切档只换容器语气 token，不动结构）',
    '底 ' + orNone(t.bg),
    '描边 ' + orNone(t.bd),
    '阴影 ' + orNone(t.shadow),
    '圆角 ' + orNone(t.radius),
    '内距 ' + orNone(t.pad),
    '项 ' + orNone(t.item),
  ];
  if (t.title) segs.push('标题 ' + t.title);
  if (t.value) segs.push('数值 ' + t.value);
  if (t.label) segs.push('标签 ' + t.label);
  if (t.icon) segs.push('图标 ' + t.icon);
  if (t.statusColor) segs.push('状态色 ' + t.statusColor);
  if (t.special) segs.push('特有 ' + t.special);
  return segs.join(' ／ ');
}

function domTree(k) {
  const req = k.required || [k.root_class];
  const [root, unit, ...rest] = req;
  const rootCls = (k.probe && k.probe !== root) ? k.probe + ' ' + root : root;
  const lines = ['<div class="' + rootCls + '" data-viz="' + k.key + '">'];
  if (unit) {
    lines.push('  └─ ' + unit + ' ×≥' + (k.min_items || 1));
    rest.forEach((c, i) => lines.push('      ' + (i === rest.length - 1 ? '└─' : '├─') + ' ' + c));
  }
  return lines.join('\n');
}

function geoLine(k) {
  const g = k.geometry || {};
  const parts = [];
  if (g.wire) parts.push('线框 件型线框.md §' + g.wire);
  if (g.geom) parts.push('几何表 §' + g.geom);
  if (g.state) parts.push('状态矩阵 §' + g.state);
  return parts.join(' ｜ ') || '（无专节）';
}

function render(k) {
  const t = k.tokens || {};
  const out = [];
  out.push('[' + k.key + '] ' + k.name + ' · ' + k.form);
  out.push('');
  out.push('① 结构（DOM 类名；类名只作结构对账标记、不自带样式，视觉按 ② 逐项写）');
  out.push('容器：宽随栅格 / 分栏 / 等分自适应，不写死像素；空间不富裕时只要内容放得下就自动适配');
  out.push(domTree(k));
  out.push('');

  if (t.status === 'pending') {
    out.push('⚠ 本键 status=pending：无实测值，禁止编值');
    out.push('降级口径：' + (k.fallback || '（缺 fallback，先补测）'));
    if (Array.isArray(t.missing) && t.missing.length) out.push('待补测项：' + t.missing.join('；'));
    out.push('如本期必须用：声明「风格规范」格写明「无实测值，按通用值推定」，并在交付说明列为风险项');
  } else if (t.status === 'resource') {
    out.push('② 素材件：按素材原样贴入（' + orNone(t.src) + '），无独立 token');
    if (t.special) out.push('特有：' + t.special);
  } else {
    out.push('② 风格规范（整块粘进《可视化件声明·风格规范》格，不许手工转述）');
    out.push(styleLine(k));
    if (t.status === 'partial' && Array.isArray(t.missing) && t.missing.length) {
      out.push('⚠ partial：以下项无实测，用前须自证或补测 —— ' + t.missing.join('；'));
    }
  }
  out.push('');

  out.push('③ 图标（按语义自绘内联 SVG，禁 <i> 空标签填底色；形状语义无实测出处时为建议值，风格对齐 components/icon-map.md）');
  out.push(k.icon_rules || '无图标语义件');
  out.push('');

  out.push('④ 溯源（仅对不齐时点开；取值以 ② 为准）');
  out.push(geoLine(k));
  if (t.src) out.push('值出处：' + t.src);
  return out.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const { contract, byKey } = load();

  if (args[0] === '--list') {
    contract.keys.forEach((k) => console.log(k.key + '\t' + k.tokens.status + '\t' + k.form));
    return;
  }
  const key = args[0];
  if (!key) {
    console.error('用法: node tools/viz-render.js <VIZ-xx-形态> [--json] | --list');
    process.exit(2);
  }
  const k = byKey[key];
  if (!k) {
    console.error('键不在册: ' + key + '（用 --list 看在册键；杜撰键禁止落线框）');
    process.exit(1);
  }
  if (args.includes('--json')) {
    console.log(JSON.stringify(k, null, 2));
    return;
  }
  console.log(render(k));
}

if (require.main === module) main();
module.exports = { render, styleLine, domTree, geoLine };
