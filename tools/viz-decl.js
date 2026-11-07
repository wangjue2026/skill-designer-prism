#!/usr/bin/env node
/**
 * 《可视化件声明》块生成器（写参考件型页 / 说明书时用）
 *
 * 用法：
 *   node tools/viz-decl.js VIZ-01-A VIZ-01-A2        # 输出 HTML 声明块
 *   node tools/viz-decl.js --all                     # 输出全部 25 份
 *
 * 为什么：声明七字段里「线框与几何 / 线框原语 / 风格规范」都能从契约直接取，
 * 手写必然漏项（V5/V6/V7 报错）。本工具只拼装，不新增真源。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { styleLine } = require('./viz-render');

const CONTRACT = path.join(__dirname, '..', '03-design-assets', 'visual-styles', '内容件', '件型落地契约.json');

const clean = (s) => String(s || '').replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();

function geomText(g) {
  if (!g) return '（无专节）';
  const parts = [];
  if (g.wire) parts.push('§' + g.wire + ' 线框');
  if (g.geom) parts.push('§' + g.geom + ' 几何表');
  if (g.state) parts.push('§' + g.state + ' 状态矩阵');
  return '`件型线框.md` ' + parts.join(' / ');
}

function primitiveText(k) {
  const req = k.required || [k.root_class];
  const [root, unit, ...rest] = req;
  const rootCls = (k.probe && k.probe !== root) ? k.probe + ' ' + root : root;
  const parts = [];
  if (unit) parts.push('`' + unit + '` ×≥' + (k.min_items || 1));
  rest.forEach((c) => parts.push('`' + c + '`'));
  return '`class="' + rootCls + '" data-viz="' + k.key + '"`' + (parts.length ? '；必含 ' + parts.join('、') : '');
}

function encodeText(k) {
  const t = k.tokens || {};
  if (k.icon_rules) return clean(k.icon_rules);
  if (t.statusColor) return clean(t.statusColor);
  return '本件无图形编码项（素材件按素材原样贴入）';
}

function interactText(k) {
  const t = k.tokens || {};
  const seg = [];
  if (t.special) seg.push(clean(t.special));
  if (Array.isArray(t.missing) && t.missing.length) seg.push('⚠ 未采项：' + t.missing.join('；'));
  if (k.fallback) seg.push('无实测值 → ' + clean(k.fallback));
  if (!seg.length) seg.push('见 `件型线框.md` 状态矩阵：空态 / 无数据 / 窄屏退化按该件状态矩阵执行');
  return seg.join('；');
}

function altText(k) {
  const st = (k.tokens || {}).status;
  if (st === 'resource') return '定制不可仿（素材保留件，附素材）';
  if (st === 'pending') return '可参数化重绘（无实测值，按 fallback 推定后落地）';
  return '可参数化重绘（DOM 组件）';
}

function build(k) {
  const t = k.tokens || {};
  const lines = [
    '<div class="viz-decl">',
    '| 件型 | ' + k.name + ' |',
    '| 件型键 | `' + k.key + '`（' + t.status + '） |',
    '| 线框与几何 | ' + geomText(k.geometry) + ' |',
    '| 线框原语 | ' + primitiveText(k) + ' |',
    '| 图形编码规则 | ' + encodeText(k) + ' |',
  ];
  if (t.status === 'pending' || t.status === 'resource') {
    const base = '档 B（推定；切档只换容器语气 token，不动结构） ／ 容器底 按父底分层（#FFFFFF 或 graphite-l50 #F7F9FC） ／ 描边 graphite-l30 #E1E5EB 1px ／ 圆角 r2';
    lines.push('| 风格规范 | ' + base + (t.status === 'resource'
      ? ' ／ 素材件：按素材原样贴入，不自造 token'
      : ' ／ 其余按 fallback 推定，声明须标注「无实测值，按通用值推定」') + ' |');
  } else {
    let st = clean(styleLine(k));
    if (!/#[0-9A-Fa-f]{3,8}|rgba?\(|linear-gradient\(|\d+px/.test(st)) st += ' ／ 描边 graphite-l30 #E1E5EB 1px';
    lines.push('| 风格规范 | ' + st + ' |');
  }
  lines.push('| 交互与退化 | ' + interactText(k) + ' |');
  lines.push('| 可替代性 | ' + altText(k) + ' |');
  lines.push('</div>');
  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error('用法: node tools/viz-decl.js <键...> | --all');
    process.exit(2);
  }
  const j = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
  const byKey = {};
  j.keys.forEach((k) => { byKey[k.key] = k; });
  const keys = args[0] === '--all' ? j.keys.map((k) => k.key) : args;
  const out = keys.map((key) => {
    const k = byKey[key];
    if (!k) { console.error('键不在册: ' + key); process.exit(1); }
    return build(k);
  });
  console.log(out.join('\n\n'));
}

if (require.main === module) main();
module.exports = { build };
