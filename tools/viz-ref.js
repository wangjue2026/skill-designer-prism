#!/usr/bin/env node
/**
 * 件型参考实现抽取器（D-11 判型后「取代码」的唯一入口）
 *
 * 治的病：参考实现页是整页示例（带业务数据与整页 CSS），直接照搬会
 *   ① 把示例业务残留（在线用户 / PC-DEV-001）抄进新页面；
 *   ② 把整页 body / 演示壳 / 别的件型的 CSS 一起拖走；
 *   ③ 各人手工挑 CSS，漏规则、抄漂移。
 * 本工具按 data-viz 键从整页里**现场抽取**「该件的 DOM + 它命中的 CSS 规则 + 填空清单」，
 * 不落第二份真源（样式仍活在 pages/ 里，改一处即全量生效）。
 *
 * 用法：
 *   node tools/viz-ref.js VIZ-08-C            # 抽取：填空清单 + 样式 + 结构
 *   node tools/viz-ref.js VIZ-08-C --html     # 只要结构
 *   node tools/viz-ref.js VIZ-08-C --css      # 只要样式
 *   node tools/viz-ref.js --list              # 键 → 文件 / 选择器
 *   node tools/viz-ref.js --check             # 索引与页面对账（键存在 / 实例数 / 槽位选择器）
 */
'use strict';

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', '03-design-assets', 'visual-styles', '内容件', '参考实现');
const INDEX = path.join(BASE, '参考实现索引.json');

function loadIndex() {
  return JSON.parse(fs.readFileSync(INDEX, 'utf-8'));
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function styleOf(html) {
  const out = [];
  const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return stripComments(out.join('\n'));
}

function countOccurrences(html, key) {
  // 只认真正的元素根（声明表里也会出现 data-viz 文本，不能算实例）
  const re = new RegExp('<div[^>]*\\bdata-viz="' + key + '"', 'g');
  return (html.match(re) || []).length;
}

/** 从 data-viz 起点向前找到 <div，按 div 嵌套取平衡闭合 */
function elementOf(html, key, nth) {
  const re = new RegExp('<div[^>]*\\bdata-viz="' + key + '"', 'g');
  let hit = null;
  let n = 0;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (n === (nth || 0)) { hit = m.index; break; }
    n += 1;
  }
  if (hit === null) return null;
  const start = hit;
  if (start < 0) return null;
  const tagRe = /<div\b|<\/div>/g;
  tagRe.lastIndex = start;
  let depth = 0;
  let mm;
  while ((mm = tagRe.exec(html)) !== null) {
    if (mm[0] === '</div>') {
      depth -= 1;
      if (depth === 0) return html.slice(start, mm.index + 6);
    } else {
      depth += 1;
    }
  }
  return null;
}

function classesOf(el) {
  const set = new Set();
  const re = /class="([^"]*)"/g;
  let m;
  while ((m = re.exec(el)) !== null) m[1].split(/\s+/).filter(Boolean).forEach((c) => set.add(c));
  return set;
}

/** 解析 CSS 为 [{selector, body, media}]，支持 @media 一层嵌套 */
function parseRules(css) {
  const rules = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open < 0) break;
    const selector = css.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth += 1;
      else if (css[j] === '}') depth -= 1;
      j += 1;
    }
    const body = css.slice(open + 1, j - 1);
    if (selector.startsWith('@media')) {
      parseRules(body).forEach((r) => rules.push({ selector: r.selector, body: r.body, media: selector }));
    } else if (selector) {
      rules.push({ selector, body, media: null });
    }
    i = j;
  }
  return rules;
}

function matches(rule, classSet) {
  // 选择器里的类名必须**全部**出现在该件内，否则会把同族兄弟件型（.wf-topo--b / --c）的规则带进来
  return rule.selector.split(',').some((part) => {
    const cls = (part.match(/\.([\w-]+)/g) || []).map((c) => c.slice(1));
    return cls.length > 0 && cls.every((c) => classSet.has(c));
  });
}

function cssFor(html, el) {
  const css = styleOf(html);
  const set = classesOf(el);
  const rules = parseRules(css);
  const rootRules = rules.filter((r) => r.selector.trim() === ':root');
  const hit = rules.filter((r) => r.media === null && r.selector.trim() !== ':root' && matches(r, set));
  const media = {};
  rules.filter((r) => r.media && matches(r, set)).forEach((r) => {
    (media[r.media] = media[r.media] || []).push(r);
  });
  const out = [];
  rootRules.forEach((r) => out.push(r.selector + '{' + r.body.trim() + '}'));
  hit.forEach((r) => out.push(r.selector + '{' + r.body.trim() + '}'));
  Object.keys(media).forEach((q) => {
    out.push(q + '{');
    media[q].forEach((r) => out.push('  ' + r.selector + '{' + r.body.trim() + '}'));
    out.push('}');
  });
  return out.join('\n');
}

function slotTable(entry, taxonomy) {
  const lines = ['| 槽位 | 选择器 | 要换什么 |', '| :--- | :--- | :--- |'];
  Object.entries(entry.slots || {}).forEach(([slot, sel]) => {
    const label = (taxonomy && taxonomy[slot]) || slot;
    const tail = slot === 'icons' ? '' : '；示例值一律不许留';
    lines.push('| ' + slot + ' | `' + sel + '` | ' + label + tail + ' |');
  });
  return lines.join('\n');
}

function render(entry) {
  const page = fs.readFileSync(path.join(BASE, entry.file), 'utf-8');
  const el = elementOf(page, entry.key, 0);
  if (!el) {
    console.error('页面里找不到 data-viz="' + entry.key + '"，请先修索引或页面');
    process.exit(1);
  }
  return {
    el,
    css: cssFor(page, el),
    count: countOccurrences(page, entry.key),
  };
}

function check() {
  const idx = loadIndex();
  const errs = [];
  idx.keys.forEach((entry) => {
    const f = path.join(BASE, entry.file);
    if (!fs.existsSync(f)) { errs.push(entry.key + ' 文件缺失：' + entry.file); return; }
    const page = fs.readFileSync(f, 'utf-8');
    const n = countOccurrences(page, entry.key);
    if (!n) { errs.push(entry.key + ' 页面里没有 data-viz 根元素'); return; }
    if (entry.instances && n !== entry.instances) errs.push(entry.key + ' 实例数 ' + n + ' ≠ 索引 ' + entry.instances);
    const el = elementOf(page, entry.key, 0);
    const set = classesOf(el || '');
    Object.entries(entry.slots || {}).forEach(([slot, sel]) => {
      const classes = (sel.match(/\.([\w-]+)/g) || []).map((c) => c.slice(1));
      const hit = classes.some((c) => set.has(c));
      if (classes.length && !hit) errs.push(entry.key + ' 槽位 ' + slot + ' 的选择器 `' + sel + '` 在页面里找不到对应类名');
    });
  });
  if (errs.length) {
    console.log('FAIL|' + errs.join('；'));
    process.exit(1);
  }
  const contract = JSON.parse(fs.readFileSync(path.join(BASE, '..', '件型落地契约.json'), 'utf-8'));
  const missing = (contract.keys || []).map((k) => k.key).filter((k) => !idx.keys.some((e) => e.key === k));
  console.log('PASS|参考实现索引对账通过：' + idx.keys.length + ' 个键，文件与选择器均在位'
    + (missing.length ? '；契约中无样板的键（按线框手写）：' + missing.join(' / ') : ''));
}

function main() {
  const args = process.argv.slice(2);
  const idx = loadIndex();

  if (args[0] === '--check') return check();
  if (args[0] === '--list') {
    idx.keys.forEach((e) => console.log(e.key + '\t' + e.file + '\t' + e.selector));
    return;
  }
  const key = args[0];
  const entry = idx.keys.find((e) => e.key === key);
  if (!entry) {
    console.error('键不在索引：' + key + '（用 --list 看已登记键）');
    process.exit(1);
  }
  const r = render(entry);
  if (args.includes('--html')) {
    console.log(r.el);
    return;
  }
  if (args.includes('--css')) {
    console.log(r.css);
    return;
  }

  const out = [];
  out.push('[' + key + '] 参考实现 · ' + entry.file + (entry.instances > 1 ? '（' + entry.instances + ' 个实例，取第 1 个）' : ''));
  out.push('');
  out.push('① 填空清单（只换内容，不动结构 / 尺寸 / 配色）');
  out.push(slotTable(entry, idx.slotTaxonomy));
  out.push('');
  out.push('图标：形状按新需求语义重画；尺寸 / 线宽 / 底色 / 色值沿用本页，禁止沿用示例的对象形状');
  if (entry.note) out.push('口径：' + entry.note);
  if (entry.variants) entry.variants.forEach((v) => out.push('变体：' + v.note + ' → `' + v.selector + '`'));
  out.push('');
  out.push('② 样式（从整页抽取，只含本件命中的规则；含 :root token）');
  out.push('<style>');
  out.push(r.css);
  out.push('</style>');
  out.push('');
  out.push('③ 结构（原样保留 data-viz 与类名，只替换文本 / 数值）');
  out.push(r.el);
  console.log(out.join('\n'));
}

if (require.main === module) main();
module.exports = { elementOf, cssFor, check };
