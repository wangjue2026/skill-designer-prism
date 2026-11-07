#!/usr/bin/env node
/**
 * 可视化件「还原包索引」生成器（D-11 场景 ②.1b 的生成视图）
 *
 * 为什么要有它：D-11 是判型入口，判完键后要能当场看到该键的可粘样式，
 * 不许跨三个文件手拼。但手写一份进来就变成第二真源（会漂移）。
 * 所以：索引由本脚本从 件型落地契约.json 生成，带 AUTO-GEN 标记，
 * `--check` 供机检对账，`--write` 刷新；人只改契约，不手改生成块。
 *
 * 用法：
 *   node tools/viz-index.js            # 打印生成块（stdout）
 *   node tools/viz-index.js --write    # 写入 D-11 的 BEGIN/END 标记之间
 *   node tools/viz-index.js --check    # 与 D-11 现有块比对，不一致退出 1
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTRACT = path.join(ROOT, '03-design-assets', 'visual-styles', '内容件', '件型落地契约.json');
const REF_INDEX = path.join(ROOT, '03-design-assets', 'visual-styles', '内容件', '参考实现', '参考实现索引.json');
const D11 = path.join(ROOT, '01-system-solution-design', '②设计思考与决策', '通用设计决策', 'D-11-可视化件选型与还原.md');

const BEGIN = '<!-- VIZ-INDEX:BEGIN 由 tools/viz-index.js 生成，勿手改；改值请改 件型落地契约.json 后执行 node tools/viz-index.js --write -->';
const END = '<!-- VIZ-INDEX:END -->';

const BADGE = { measured: '✅ measured', partial: '🟡 partial', pending: '🚧 pending', resource: '🎨 resource' };

const orNone = (v) => (v === null || v === undefined || v === '' ? '无' : v);

function structure(k) {
  const req = k.required || [k.root_class];
  const [root, unit, ...rest] = req;
  const rootCls = (k.probe && k.probe !== root) ? '`' + k.probe + ' ' + root + '`' : '`' + root + '`';
  let s = rootCls + (unit ? ' › `' + unit + '` ×≥' + (k.min_items || 1) : '');
  if (rest.length) s += ' ／ ' + rest.map((c) => '`' + c + '`').join('、');
  return s;
}

function styleLine(k) {
  const t = k.tokens || {};
  const segs = ['档 B（默认；切档只换容器语气 token，不动结构）', '底 ' + orNone(t.bg), '描边 ' + orNone(t.bd), '阴影 ' + orNone(t.shadow), '圆角 ' + orNone(t.radius), '内距 ' + orNone(t.pad), '项 ' + orNone(t.item)];
  if (t.title) segs.push('标题 ' + t.title);
  if (t.value) segs.push('数值 ' + t.value);
  if (t.label) segs.push('标签 ' + t.label);
  if (t.icon) segs.push('图标 ' + t.icon);
  if (t.statusColor) segs.push('状态色 ' + t.statusColor);
  if (t.special) segs.push('特有 ' + t.special);
  return segs.join(' ／ ');
}

function geoLine(k) {
  const g = k.geometry || {};
  const parts = [];
  if (g.wire) parts.push('线框 §' + g.wire);
  if (g.geom) parts.push('几何表 §' + g.geom);
  if (g.state) parts.push('状态矩阵 §' + g.state);
  return parts.length ? parts.join(' ｜ ') : '（无专节）';
}

function loadRefs() {
  try {
    const j = JSON.parse(fs.readFileSync(REF_INDEX, 'utf8'));
    const map = {};
    (j.keys || []).forEach((e) => { map[e.key] = e; });
    return map;
  } catch (e) {
    return {};
  }
}

function refLine(k, refs) {
  const r = refs[k.key];
  if (!r) return '- 参考实现：无样板（按 `件型线框.md` 手写；勿照搬示例业务）';
  return '- 参考实现：`' + r.file + '` › 取代码 `node tools/viz-ref.js ' + k.key + '`（只抽本件 DOM + CSS，模板随新需求填空）';
}

function entry(k, refs) {
  const t = k.tokens || {};
  const head = '**`' + k.key + '`** ｜ ' + (BADGE[t.status] || t.status) + ' ｜ ' + k.name + ' · ' + k.form;
  const lines = [head];

  if (t.status === 'pending') {
    lines.push('- **无实测值 → 禁止编值**：' + orNone(k.fallback || '（缺 fallback，先补测）'));
    if (Array.isArray(t.missing) && t.missing.length) lines.push('- 待补测：' + t.missing.join('；'));
  } else if (t.status === 'resource') {
    lines.push('- 素材件：按素材原样贴入（' + orNone(t.src) + '），不自造 token');
    if (t.special) lines.push('- 特有：' + t.special);
  } else {
    lines.push('- 结构：' + structure(k));
    lines.push('- 风格（整块粘进《可视化件声明·风格规范》）：' + styleLine(k));
    lines.push('- 图标：' + orNone(k.icon_rules));
    if (t.status === 'partial' && Array.isArray(t.missing) && t.missing.length) {
      lines.push('- ⚠ partial 缺项（用前自证或补测）：' + t.missing.join('；'));
    }
  }
  lines.push(refLine(k, refs));
  lines.push('- 溯源：' + geoLine(k) + ' ｜ 全包 `node tools/viz-render.js ' + k.key + '`');
  return lines.join('\n');
}

function build() {
  const j = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
  const refs = loadRefs();
  const body = j.keys.map((k) => entry(k, refs)).join('\n\n');
  return BEGIN + '\n\n' + body + '\n\n' + END;
}

function readD11() {
  return fs.readFileSync(D11, 'utf8');
}

function extractBlock(md) {
  const i = md.indexOf(BEGIN);
  const e = md.indexOf(END);
  if (i < 0 || e < 0) return null;
  return md.slice(i, e + END.length);
}

function main() {
  const args = process.argv.slice(2);
  const block = build();

  if (args.includes('--check')) {
    const cur = extractBlock(readD11());
    if (!cur) { console.error('FAIL|D-11 缺少 VIZ-INDEX 标记块'); process.exit(1); }
    if (cur.trim() !== block.trim()) {
      console.error('FAIL|D-11 还原包索引与 件型落地契约.json 不一致（重跑 node tools/viz-index.js --write）');
      process.exit(1);
    }
    console.log('PASS|D-11 还原包索引与契约一致');
    return;
  }

  if (args.includes('--write')) {
    let md = readD11();
    const cur = extractBlock(md);
    if (!cur) { console.error('缺少 VIZ-INDEX 标记块，请先插入标记'); process.exit(1); }
    md = md.replace(cur, block);
    fs.writeFileSync(D11, md);
    console.log('written: ' + D11);
    return;
  }

  console.log(block);
}

if (require.main === module) main();
module.exports = { build, extractBlock, BEGIN, END };
