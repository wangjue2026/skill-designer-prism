#!/usr/bin/env node
/**
 * visual-audit.js — 视觉门禁检视器（V 组）
 *
 * 已实现 27 条（全量）：
 *   V-01 左基线     V-02 栅格列线   V-03 容器嵌套   V-04 通栏克制   V-05 撑满留白
 *   V-06 筛选区     V-07 动作分区   V-08 间距阶梯   V-09 内边距     V-10 字阶
 *   V-11 行高       V-12 数字对齐   V-13 截断换行   V-14 色彩数量   V-15 三元组
 *   V-16 对比度     V-17 状态编码   V-18 按钮层级   V-19 圆角阴影   V-20 语义色
 *   V-21 表格视觉   V-22 六态       V-23 KPI 结构   V-24 操作槽位   V-25 行内对齐
 *   V-26 形态关系   V-27 承载空间
 *
 * 两层判定：
 *   1. 静态（默认，离线可用）：HTML 结构 + CSS 声明值，不拉浏览器
 *   2. 量测（走 tools/visual-measure.js → CDP 9222）：
 *      - 严格量测：V-01 左基线 / V-02 栅格列线 / V-05 留白 / V-24 操作坐标（端口未开输出 ⚠️ 未量测）
 *      - bbox 优先 + 静态回退：V-04 通栏宽度 / V-21 表格行高
 *   3. 已无未实现条目；--no-measure 只关闭严格量测，回执须登记未完成项
 *   - auditing 只读被测产物与 tools/fixtures/visual/；图例册仅在 --doc-check 时被读取
 *   - --doc-check 只比对图例册 data-v 与夹具编号（不判视觉、不进门禁）
 *
 * 用法：
 *   node tools/visual-audit.js <产物.html> --profile=sketch|wireframe [--only=V-08,V-19]
 *   node tools/visual-audit.js --selftest
 *   node tools/visual-audit.js --doc-check
 *
 * 退出码：0 通过 / 1 有 FAIL / 2 用法错
 */

'use strict';

const fs = require('fs');
const path = require('path');

// 量测通道：模块缺失或 9222 未开时按条目降级，静态机检照跑
let measure = null, portAlive = null;
try {
  ({ measure, portAlive } = require('./visual-measure'));
} catch (e) {
  measure = null; portAlive = null;
}

// ── 资产取值（唯一来源：03-design-assets/global-styles，见 md §9）──────────
const LADDER = [2, 4, 8, 12, 16, 24, 32];            // design-atomic-spacing §4.1
const SPACING_PROPS = ['padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'gap', 'row-gap', 'column-gap'];
const SPACING_WHITE = /(^|[\s,>+~])(th|td|\.tag|\.btn|\.icon)(?![-\w])/;

const SIZE_TOKENS = [12, 14, 16, 20, 24, 30, 36, 48, 56, 64];  // design-typography §2.3
const WEIGHTS = [400, 600];                                     // §2.2（禁 500 / 700）

const RADIUS_OK = [0, 2];                                       // atomic-spacing §3.1
const SHADOW_TOKENS = {                                         // design-color §1.6（s2 已裁决）
  s1: '0 1px 4px rgba(31,35,43,.16)',
  s2: '0 2px 8px rgba(31,35,43,.14)',
  s3: '0 4px 16px rgba(31,35,43,.12)',
};
const AVATAR_WHITE = /(avatar|\.icon|\.logo|\.dot)/i;

// 草图阶段不执行的条目：草图画法允许灰块 / 文字当控件 / 宽松间距 / 无圆角，
// 这 9 条按"成品页"精度判必然全红（实测某草图 3929 红），改成 ⚠️ 不判。
const SKETCH_SKIP = ['V-01', 'V-02', 'V-03', 'V-04', 'V-05', 'V-06', 'V-08', 'V-13', 'V-09', 'V-10', 'V-11', 'V-12', 'V-14', 'V-16', 'V-19', 'V-21', 'V-25'];

// §1.2 语义色映射表（12 token）+ 品牌蓝三态
const SEM = ['#cf171d', '#82010e', '#1c6eff', '#12a679', '#6f7785', '#fdaa1d',
  '#fa721b', '#0ba7b5', '#e8f4ff', '#4fa1ff', '#1458cc', '#ffffff',
  // d30 文字色（标签三元组用）与正文/表头文字
  '#015945', '#872600', '#00258c', '#454c59', '#5e6573', '#2f3540'];
const REDS = ['#cf171d', '#82010e', '#f52727', '#ff5752'];
const RISK_WORDS = /(风险|危险|失败|高危|拦截|违规|失陷|超限|告警)/;

// ── 基础工具 ────────────────────────────────────────────────────────────────
function pxNum(v) {
  const m = /^(-?\d+(?:\.\d+)?)px$/i.exec(String(v).trim());
  return m ? parseFloat(m[1]) : null;
}
function toPx(v) {
  const s = String(v).trim().toLowerCase();
  const p = pxNum(s);
  if (p !== null) return p;
  const r = /^(-?\d+(?:\.\d+)?)rem$/.exec(s);
  if (r) return parseFloat(r[1]) * 16;
  return null;
}
function canonShadow(v) {
  return String(v).toLowerCase().replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',')
    .replace(/0\.(\d)/g, '.$1')
    .replace(/rgba\(([^)]*)\)/g, (all, inner) => 'rgba(' + inner.split(',').map((x) => x.trim()).join(',') + ')')
    .trim();
}
function parseDecls(str) {
  const out = {};
  String(str || '').split(';').forEach((d) => {
    const i = d.indexOf(':');
    if (i < 0) return;
    const k = d.slice(0, i).trim().toLowerCase();
    const v = d.slice(i + 1).trim();
    if (k && v) out[k] = v;
  });
  return out;
}
function parseAttrs(str) {
  const out = {};
  const re = /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m;
  while ((m = re.exec(str))) {
    out[m[1].toLowerCase()] = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : '';
  }
  return out;
}

// ── HTML → 轻量 DOM ────────────────────────────────────────────────────────
const VOID = ['br', 'img', 'input', 'meta', 'link', 'hr', 'col', 'source', 'area', 'base', 'embed', 'param', 'track', 'wbr'];

function parseHTML(html) {
  const src = html.replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '');
  const root = { tag: '#root', attrs: {}, cls: [], children: [], parent: null, texts: [] };
  const stack = [root];
  let cur = root;
  const re = /<!--[\s\S]*?-->|<![^>]*>|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g;
  let last = 0, m;
  while ((m = re.exec(src))) {
    const txt = src.slice(last, m.index);
    if (txt.trim()) cur.texts.push(txt.trim());
    last = re.lastIndex;
    if (m[0].slice(0, 4) === '<!--' || m[0][0] === '<' && m[0][1] === '!') continue;
    if (m[1]) {
      const tag = m[1].toLowerCase();
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) { stack.length = i; cur = stack[i - 1]; break; }
      }
      continue;
    }
    const tag = (m[2] || '').toLowerCase();
    if (!tag) continue;
    const attrs = parseAttrs(m[3] || '');
    const el = { tag, attrs, cls: (attrs.class || '').split(/\s+/).filter(Boolean), children: [], parent: cur, texts: [] };
    cur.children.push(el);
    if (!m[4] && VOID.indexOf(tag) < 0) { stack.push(el); cur = el; }
  }
  return root;
}

function textOf(el) {
  if (el._txt !== undefined) return el._txt;
  let s = el.texts.join(' ');
  el.children.forEach((c) => { s += ' ' + textOf(c); });
  el._txt = s.replace(/\s+/g, ' ').trim();
  return el._txt;
}
function ownText(el) { return el.texts.join(' ').replace(/\s+/g, ' ').trim(); }
function walk(el, fn) {
  fn(el);
  el.children.forEach((c) => walk(c, fn));
}
function findAll(root, pred) {
  const out = [];
  walk(root, (el) => { if (el !== root && pred(el)) out.push(el); });
  return out;
}

// ── 选择器（子集：tag / .class / #id / [attr] / 后代 / > / 逗号）───────────
function tokenize(sel) {
  return sel.trim().replace(/\s*>\s*/g, ' > ').split(/\s+/).filter(Boolean);
}
function matchCompound(el, comp) {
  if (!comp || comp === '*') return true;
  let rest = comp;
  const tagM = /^([a-zA-Z][\w-]*)/.exec(rest);
  if (tagM) {
    if (el.tag !== tagM[1].toLowerCase()) return false;
    rest = rest.slice(tagM[0].length);
  }
  const re = /([.#])([\w-]+)|\[([\w:-]+)(?:\s*=\s*["']?([^"'\]]*)["']?)?\]|::?[\w-]+(?:\([^)]*\))?/g;
  let m;
  while ((m = re.exec(rest))) {
    if (m[1] === '.') { if (el.cls.indexOf(m[2]) < 0) return false; }
    else if (m[1] === '#') { if (el.attrs.id !== m[2]) return false; }
    else if (m[3]) {
      if (!(m[3] in el.attrs)) return false;
      if (m[4] !== undefined && m[4] !== '' && el.attrs[m[3]] !== m[4]) return false;
    }
    // 伪类/伪元素忽略（:focus 由规则层单独处理）
  }
  return true;
}
function matchFrom(el, toks, i) {
  if (!el || el.tag === '#root' || i < 0) return false;
  if (toks[i] === '>') return false;
  if (!matchCompound(el, toks[i])) return false;
  if (i === 0) return true;
  if (toks[i - 1] === '>') return matchFrom(el.parent, toks, i - 2);
  let p = el.parent;
  while (p && p.tag !== '#root') {
    if (matchFrom(p, toks, i - 1)) return true;
    p = p.parent;
  }
  return false;
}
function matches(el, selector) {
  return String(selector).split(',').some((s) => {
    const toks = tokenize(s);
    return toks.length ? matchFrom(el, toks, toks.length - 1) : false;
  });
}

// ── CSS 规则 ────────────────────────────────────────────────────────────────
function extractRules(html) {
  const css = (html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [])
    .map((x) => x.replace(/^<style[^>]*>/i, '').replace(/<\/style>$/i, '')).join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const flat = css.replace(/@[^{]+\{/g, '');
  const rules = [];
  flat.split('}').forEach((chunk) => {
    const i = chunk.indexOf('{');
    if (i < 0) return;
    const selector = chunk.slice(0, i).replace(/^[\s}]+/, '').trim();
    if (!selector) return;
    const decls = parseDecls(chunk.slice(i + 1));
    if (Object.keys(decls).length) {
      rules.push({ selector, decls, inline: false, groups: selector.split(',').map(tokenize).filter((g) => g.length) });
    }
  });
  const inlineRe = /<([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)style\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = inlineRe.exec(html)) !== null) {
    const cls = (m[2].match(/class\s*=\s*"([^"]*)"/) || [])[1] || '';
    const sel = m[1].toLowerCase() + (cls ? '.' + cls.trim().split(/\s+/).join('.') : '') + ' [inline]';
    rules.push({ selector: sel, decls: parseDecls(m[3]), inline: true, groups: sel.split(',').map(tokenize).filter((g) => g.length) });
  }
  return rules;
}

// ── 计算式样式（声明级，非渲染）────────────────────────────────────────────
let RULES = [];

// 索引：byClass / byTag，避免"每条规则 × 每个元素"的全量匹配（282KB 草图曾要 27s）
function indexTree(root) {
  const all = [], byClass = new Map(), byTag = new Map();
  walk(root, (el) => {
    if (el.tag === '#root') return;
    all.push(el);
    if (!byTag.has(el.tag)) byTag.set(el.tag, []);
    byTag.get(el.tag).push(el);
    el.cls.forEach((c) => {
      if (!byClass.has(c)) byClass.set(c, []);
      byClass.get(c).push(el);
    });
  });
  return { all, byClass, byTag };
}

function candidatesFor(rule, idx) {
  if (rule._cand) return rule._cand;
  const out = new Set();
  rule.groups.forEach((toks) => {
    const last = toks[toks.length - 1];
    const cls = /\.([\w-]+)/.exec(last);
    if (cls && idx.byClass.has(cls[1])) { idx.byClass.get(cls[1]).forEach((e) => out.add(e)); return; }
    const tag = /^([a-zA-Z][\w-]*)/.exec(last);
    if (tag && idx.byTag.has(tag[1].toLowerCase())) { idx.byTag.get(tag[1].toLowerCase()).forEach((e) => out.add(e)); return; }
    idx.all.forEach((e) => out.add(e));
  });
  rule._cand = [...out];
  return rule._cand;
}

function matchesRule(el, rule) {
  return rule.groups.some((toks) => matchFrom(el, toks, toks.length - 1));
}

// 一次性把所有声明落到元素上，styleOf 之后只读
function applyStyles(idx, rules) {
  idx.all.forEach((el) => { el._cs = {}; });
  rules.forEach((rule) => {
    candidatesFor(rule, idx).forEach((el) => {
      if (matchesRule(el, rule)) Object.assign(el._cs, rule.decls);
    });
  });
  idx.all.forEach((el) => { if (el.attrs.style) Object.assign(el._cs, parseDecls(el.attrs.style)); });
  const INHERIT = ['color', 'font-size', 'font-weight', 'line-height', 'text-align'];
  idx.all.forEach((el) => {
    const pcs = el.parent && el.parent._cs ? el.parent._cs : {};
    INHERIT.forEach((k) => { if (el._cs[k] === undefined && pcs[k] !== undefined) el._cs[k] = pcs[k]; });
  });
}

function styleOf(el) { return el._cs || {}; }
function borderWidth(cs) {
  let w = 0;
  if (cs['border-width']) { const n = pxNum(cs['border-width'].split(/\s+/)[0]); if (n) w = Math.max(w, n); }
  if (cs.border) {
    const m = /(\d+(?:\.\d+)?)px/.exec(cs.border);
    const style = cs.border;
    if (m && !/none/.test(style)) w = Math.max(w, parseFloat(m[1]));
  }
  ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'].forEach((k) => {
    const n = pxNum(cs[k] || '');
    if (n) w = Math.max(w, n);
  });
  return w;
}
function bgOf(el) {
  let cur = el;
  while (cur && cur.tag !== '#root') {
    const cs = styleOf(cur);
    const v = cs['background-color'] || cs.background;
    if (v && !/^transparent$/i.test(v.trim())) {
      if (/gradient/i.test(v)) return { raw: v, rgb: null };
      const c = parseColor(v);
      if (c) return { raw: v, rgb: c };
    }
    cur = cur.parent;
  }
  return { raw: '#ffffff', rgb: [255, 255, 255] };
}

// ── 颜色 ────────────────────────────────────────────────────────────────────
const NAMED = { white: [255, 255, 255], black: [0, 0, 0], red: [255, 0, 0], green: [0, 128, 0], gray: [128, 128, 128], grey: [128, 128, 128] };
function parseColor(v) {
  if (!v) return null;
  const s = String(v).trim().toLowerCase();
  if (!s || s === 'transparent' || s === 'inherit' || s === 'currentcolor') return null;
  if (NAMED[s]) return NAMED[s].slice();
  let m = /^#([0-9a-f]{3,8})$/.exec(s);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (h.length === 6) return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    return null;
  }
  m = /^rgba?\(([^)]+)\)$/.exec(s);
  if (m) {
    const p = m[1].split(',').map((x) => parseFloat(x));
    if (p.length >= 3 && !isNaN(p[0])) return [p[0], p[1], p[2]];
  }
  return null;
}
function relLum(rgb) {
  const f = rgb.map((x) => {
    const c = x / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
}
function contrast(a, b) {
  const l1 = relLum(a), l2 = relLum(b);
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}
function hsl(rgb) {
  const [r, g, b] = rgb.map((x) => x / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  const s = (l === 0 || l === 1) ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { s, l };
}
function hex(rgb) {
  return '#' + rgb.map((x) => ('0' + Math.round(x).toString(16)).slice(-2)).join('');
}

// ── 18 条规则 ──────────────────────────────────────────────────────────────
const STRUCT_TAGS = ['table', 'tr', 'td', 'th', 'thead', 'tbody', 'form'];
const STRUCT_CLS = ['form-group', 'list-item', 'tab-pane', 'collapse', 'tree-node', 'wf-pane',
  // 内联件不是布局容器，不计层（否则卡片里的 tag/按钮会被算成第三层）
  'btn', 'tag', 'badge', 'icon', 'dot', 'avatar', 'kpi-item', 'wf-kpi-item', 'input', 'select', 'textarea'];
function isStruct(el) {
  if (STRUCT_TAGS.indexOf(el.tag) >= 0) return true;
  return el.cls.some((c) => STRUCT_CLS.indexOf(c) >= 0);
}
function isVisibleBox(el) {
  const cs = styleOf(el);
  const bw = borderWidth(cs);
  const bgv = cs['background-color'] || cs.background;
  const hasBg = bgv && !/^transparent$/i.test(bgv.trim());
  const sh = cs['box-shadow'];
  const hasShadow = sh && sh.trim() !== 'none';
  return bw > 0 || !!hasBg || !!hasShadow;
}

function checkV03(root) {
  const out = [];
  walk(root, (el) => {
    if (el.tag === '#root' || isStruct(el) || !isVisibleBox(el)) return;
    let d = 0, p = el.parent;
    while (p && p.tag !== '#root') {
      if (p.tag !== 'body' && p.tag !== 'html' && !isStruct(p) && isVisibleBox(p)) d++;
      p = p.parent;
    }
    if (d + 1 > 2) out.push({ id: 'V-03', ok: false, msg: `${describe(el)} 可见容器深度 ${d + 1}（≤2）` });
  });
  return out.length ? out : [{ id: 'V-03', ok: true, msg: '可见容器深度 ≤2' }];
}
function describe(el) {
  const c = el.cls.length ? '.' + el.cls[0] : '';
  return el.tag + c;
}

const REGION_CLS = ['page-head', 'toolbar', 'table-toolbar', 'filter-bar', 'footer', 'batch-bar', 'op-bar'];
function regionOf(el) {
  let p = el.parent;
  while (p && p.tag !== '#root') {
    if (p.attrs['data-region']) return p.attrs['data-region'];
    const hit = p.cls.find((c) => REGION_CLS.indexOf(c) >= 0);
    if (hit) return hit;
    if (p.tag === 'header') return 'header';
    if (p.tag === 'footer') return 'footer';
    p = p.parent;
  }
  return 'unknown';
}

// ── V-06 工具栏布局（左按钮区 / 右查询区；口径：01-page-types §2.3 + patterns/02 §4）──
function roleOf(el, box) {
  let p = el.parent;
  while (p && p !== box) {
    if (p.cls.some((c) => /search/.test(c))) return 'search-suffix';
    p = p.parent;
  }
  const txt = textOf(el);
  const act = String(el.attrs['data-act'] || '').toLowerCase();
  if (act === 'refresh' || /刷新/.test(txt) || el.cls.some((c) => /refresh/.test(c))) return 'refresh';
  if (el.tag === 'input') {
    const t = (el.attrs.type || '').toLowerCase();
    if (t === 'date') return 'date';
    return 'search';
  }
  if (el.tag === 'select') return 'select';
  if (el.cls.some((c) => /date/.test(c))) return 'date';
  if (el.tag === 'button' || el.attrs['data-act'] !== undefined || el.cls.some((c) => /^btn/.test(c))) return 'action';
  return 'select';
}
// 资产顺序：按钮区(左) → 复合日期 → 选择器 → 搜索框 → 刷新(最右)
const ROLE_RANK = { action: 0, date: 1, select: 2, search: 3, refresh: 4 };
const ROLE_NAME = { action: '按钮区', date: '日期筛选器', select: '选择器', search: '搜索框', refresh: '刷新' };

function checkV06(root, rules, ctx) {
  const out = [];
  const boxes = findAll(root, (el) => el.attrs['data-region'] === 'filter-bar'
    || el.cls.indexOf('filter-bar') >= 0 || el.cls.indexOf('wf-filter-bar') >= 0);
  if (!boxes.length) return [{ id: 'V-06', ok: true, warn: true, msg: '未标筛选区（data-region="filter-bar"），跳过' }];
  let rowIssue = false;
  boxes.forEach((box) => {
    const ctrls = findAll(box, (el) => ['input', 'select', 'button', 'textarea'].indexOf(el.tag) >= 0
      || el.attrs['data-act'] !== undefined || el.cls.some((c) => ['btn', 'select', 'date', 'search'].indexOf(c) >= 0));
    if (!ctrls.length) return;
    // 掉行：控件落在 2 个以上"块级行容器"里（flex 容器内的并列子元素不算掉行）
    const rowNodes = new Set();
    ctrls.forEach((c) => {
      let node = c, p = c.parent;
      while (p && p !== box) { node = p; p = p.parent; }
      rowNodes.add(node === c ? box : node);
    });
    const boxDisplay = (styleOf(box).display || '').toLowerCase();
    if (rowNodes.size > 1 && !/flex|grid/.test(boxDisplay)) {
      rowIssue = true;
      out.push({ id: 'V-06', ok: false, msg: `工具栏控件落在 ${rowNodes.size} 个行容器（掉行）` });
    }
    const seq = ctrls.map((c) => ({ el: c, r: roleOf(c, box) })).filter((x) => x.r !== 'search-suffix');
    let last = -1, lastName = '';
    seq.forEach((x) => {
      const r = ROLE_RANK[x.r];
      if (r < last) {
        out.push({ id: 'V-06', ok: false, msg: `顺序不符：${ROLE_NAME[x.r]} 排在 ${ROLE_NAME[lastName]} 之后（应为 按钮区→日期→选择器→搜索框→刷新）` });
      } else { last = r; lastName = x.r; }
    });
  });
  // Δy ≤2px：有 bbox 时量测，无 bbox 时明确降级；已判掉行时不重复报同一缺陷
  const fb = ctx && ctx.metrics && ctx.metrics.filterBar;
  if (fb && fb.length && !rowIssue) {
    fb.forEach((row) => {
      const tops = (row.ctrls || []).map((c) => c.y).filter((y) => Number.isFinite(y));
      if (tops.length < 2) return;
      const dy = Math.max.apply(null, tops) - Math.min.apply(null, tops);
      if (dy > 2) out.push({ id: 'V-06', ok: false, part: 'measure', msg: `同行控件盒顶 Δy ${Math.round(dy)}px > 2px（${row.label}）` });
    });
  }
  if (out.length) return out.filter((o) => !o.ok);
  const noDy = !(fb && fb.length);
  return [{
    id: 'V-06', ok: true, warn: noDy,
    msg: noDy
      ? '工具栏分区与顺序合规；Δy 未量测（9222 未开，回执须登记）'
      : '工具栏：左按钮区 / 右查询区，顺序 日期→选择器→搜索框→刷新，Δy ≤2px（bbox 实测）'
  }];
}

function checkV07(root) {
  const acts = findAll(root, (el) => el.attrs['data-act']);
  const byAct = {};
  acts.forEach((el) => {
    const a = el.attrs['data-act'].trim();
    (byAct[a] = byAct[a] || []).push(el);
  });
  const out = [];
  Object.keys(byAct).forEach((a) => {
    const regions = [...new Set(byAct[a].map(regionOf))];
    if (regions.length > 1) out.push({ id: 'V-07', ok: false, msg: `data-act="${a}" 出现在 ${regions.length} 区（${regions.join(' / ')}）` });
  });
  const buttons = findAll(root, (el) => el.tag === 'button' || el.cls.indexOf('btn') >= 0);
  if (!acts.length && buttons.length >= 3) out.push({ id: 'V-07', ok: true, warn: true, msg: '有 3+ 按钮但未标 data-act，归属无法判' });
  return out.length ? out : [{ id: 'V-07', ok: true, msg: '每个 data-act 只在 1 个区域' }];
}

function checkV08(rules) {
  const bad = [], vals = new Set();
  rules.forEach((r) => {
    if (!r.inline && SPACING_WHITE.test(r.selector)) return;
    SPACING_PROPS.forEach((p) => {
      const v = r.decls[p];
      if (!v) return;
      v.split(/\s+/).forEach((tok) => {
        if (/^-?0(px)?$/i.test(tok)) return;
        const n = pxNum(tok);
        if (n === null) return;
        vals.add(n);
        if (LADDER.indexOf(n) < 0) bad.push({ sel: r.selector, prop: p, val: tok });
      });
    });
  });
  const out = [], seen = new Set();
  bad.forEach((b) => {
    const k = b.sel + b.prop + b.val;
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ id: 'V-08', ok: false, msg: `${b.sel}  ${b.prop}:${b.val}（不在阶梯 ${LADDER.join('/')}）` });
  });
  if (vals.size > 6) out.push({ id: 'V-08', ok: false, msg: `同页间距 ${vals.size} 种（上限 6）` });
  return out.length ? out : [{ id: 'V-08', ok: true, msg: `间距 ${vals.size} 种，全部在阶梯内` }];
}

function padSig(v) {
  const p = String(v).trim().split(/\s+/).map((x) => pxNum(x));
  if (p.some((x) => x === null)) return null;
  if (p.length === 1) return [p[0], p[0], p[0], p[0]];
  if (p.length === 2) return [p[0], p[1], p[0], p[1]];
  if (p.length === 3) return [p[0], p[1], p[2], p[1]];
  return p.slice(0, 4);
}
function checkV09(root) {
  const groups = {};
  findAll(root, (el) => el.cls.length > 0).forEach((el) => {
    const key = el.attrs['data-comp'] || el.cls[0];
    const cs = styleOf(el);
    if (!cs.padding) return;
    const sig = padSig(cs.padding);
    if (!sig) return;
    (groups[key] = groups[key] || []).push({ el, sig });
  });
  const out = [];
  Object.keys(groups).forEach((k) => {
    const g = groups[k];
    if (g.length < 2) return;
    const base = g[0].sig;
    g.slice(1).forEach((x) => {
      const vDiff = Math.abs(x.sig[0] - base[0]) + Math.abs(x.sig[2] - base[2]);
      const hDiff = Math.abs(x.sig[1] - base[1]) + Math.abs(x.sig[3] - base[3]);
      const same = vDiff === 0 && hDiff === 0;
      const grouped = vDiff <= 4 && hDiff <= 4;
      if (!same && !grouped) out.push({ id: 'V-09', ok: false, msg: `${k} 内 padding 不一（${base.join('/')} vs ${x.sig.join('/')}）` });
    });
  });
  const body = findAll(root, (el) => el.tag === 'body')[0];
  if (body) {
    const cs = styleOf(body);
    if (cs.padding) {
      const sig = padSig(cs.padding);
      if (sig && !(sig[0] === sig[1] && sig[1] === sig[2] && sig[2] === sig[3] && (sig[0] === 24 || sig[0] === 48))) {
        out.push({ id: 'V-09', ok: false, msg: `body padding ${sig.join('/')}（须四值相等且 = 24 / ≥1720 屏 48）` });
      }
    }
  }
  return out.length ? out : [{ id: 'V-09', ok: true, msg: '同类容器 padding 一致，页面级 = 24' }];
}

function checkV10(rules) {
  const out = [], sizes = new Set(), weights = new Set();
  rules.forEach((r) => {
    const fsd = r.decls['font-size'];
    if (fsd) {
      const n = toPx(fsd);
      if (n === null) out.push({ id: 'V-10', ok: true, warn: true, msg: `${r.selector} font-size:${fsd}（非 px/rem，未判）` });
      else { sizes.add(n); if (SIZE_TOKENS.indexOf(n) < 0) out.push({ id: 'V-10', ok: false, msg: `${r.selector}  font-size:${fsd}（不在字阶）` }); }
    }
    const fw = r.decls['font-weight'];
    if (fw) {
      const s = fw.trim().toLowerCase();
      const n = s === 'normal' ? 400 : s === 'bold' ? 700 : parseInt(s, 10);
      if (!isNaN(n)) { weights.add(n); if (WEIGHTS.indexOf(n) < 0) out.push({ id: 'V-10', ok: false, msg: `${r.selector}  font-weight:${fw}（只许 400 / 600）` }); }
    }
  });
  if (sizes.size > 5) out.push({ id: 'V-10', ok: false, msg: `同页字号 ${sizes.size} 档（上限 5）` });
  return out.some((o) => o.ok === false) ? out.filter((o) => !o.ok)
    : [{ id: 'V-10', ok: true, msg: `字号 ${sizes.size} 档 / 字重 ${weights.size} 档，均在册` }];
}

function checkV11(root) {
  const out = [];
  walk(root, (el) => {
    if (el.tag === '#root') return;
    if (!ownText(el)) return;
    const cs = styleOf(el);
    if (!cs['line-height']) return;
    const lhRaw = cs['line-height'].trim();
    if (/normal|^[\d.]+$/.test(lhRaw)) {
      out.push({ id: 'V-11', ok: false, msg: `${describe(el)}  line-height:${lhRaw}（必须显式 px）` });
      return;
    }
    const lh = toPx(lhRaw), fs = toPx(cs['font-size'] || '');
    if (lh === null || fs === null) { out.push({ id: 'V-11', ok: true, warn: true, msg: `${describe(el)} 行高/字号非 px，未判` }); return; }
    if (Math.abs(lh - fs - 8) > 1) out.push({ id: 'V-11', ok: false, msg: `${describe(el)}  line-height:${lhRaw} / font-size:${cs['font-size']}（差 ${lh - fs}，应为 8）` });
  });
  return out.some((o) => !o.ok) ? out.filter((o) => !o.ok || o.warn)
    : [{ id: 'V-11', ok: true, msg: '正文行高 = 字号 + 8' }];
}

function checkV12(root) {
  const out = [];
  findAll(root, (el) => el.tag === 'table').forEach((tb) => {
    const rows = findAll(tb, (el) => el.tag === 'tr');
    rows.forEach((tr) => {
      tr.children.forEach((td, idx) => {
        if (td.tag !== 'td') return;
        const bodyRows = rows.filter((r) => r.children.some((c) => c.tag === 'td'));
        const col = bodyRows.map((r) => r.children.filter((c) => c.tag === 'td')[idx]).filter(Boolean);
        if (!col.length) return;
        const numeric = col.filter((c) => /^\s*[¥$]?\d/.test(textOf(c))).length / col.length >= 0.8;
        if (!numeric) return;
        if (td !== col[0]) return;                    // 每列只报一次
        const cs = styleOf(td);
        if ((cs['text-align'] || '') !== 'right') out.push({ id: 'V-12', ok: false, msg: `第 ${idx + 1} 列数值未右对齐（${cs['text-align'] || 'left'}）` });
        if (!/tabular-nums/.test(cs['font-variant-numeric'] || '')) out.push({ id: 'V-12', ok: false, msg: `第 ${idx + 1} 列数值未声明 tabular-nums` });
      });
    });
  });
  return out.length ? out : [{ id: 'V-12', ok: true, msg: '数值列右对齐 + tabular-nums' }];
}

function checkV14(root) {
  const out = [];
  let colored = 0;
  walk(root, (el) => {
    if (el.tag === '#root') return;
    const cs = styleOf(el);
    ['background-color', 'background', 'color', 'border-color'].forEach((p) => {
      const raw = cs[p];
      if (!raw || /gradient/i.test(raw)) return;
      const rgb = parseColor(raw);
      if (!rgb) return;
      const { s, l } = hsl(rgb);
      const d = (Math.max(rgb[0], rgb[1], rgb[2]) - Math.min(rgb[0], rgb[1], rgb[2])) / 255;
      if (s < 0.18 || d <= 0.047) return;            // 冷调灰（#D3D7DE 这类）不判
      if (l > 0.80) return;                          // 浅底 / 描边色不判
      colored++;
      const h = hex(rgb);
      if (SEM.indexOf(h) < 0 && REDS.concat(['#1c6eff']).indexOf(h) < 0) {
        out.push({ id: 'V-14', ok: false, msg: `${describe(el)}  ${p}:${raw}（不在语义映射表）` });
      }
    });
    const bgv = cs.background || cs['background-color'] || '';
    if (/gradient/i.test(bgv) && (el.tag === 'body' || (el.cls.indexOf('page') >= 0))) {
      out.push({ id: 'V-14', ok: false, msg: `${describe(el)} 全屏渐变铺底（无出处）` });
    }
  });
  if (colored > 8) out.push({ id: 'V-14', ok: false, msg: `彩色块 ${colored} 个（上限 8）` });
  return out.length ? out : [{ id: 'V-14', ok: true, msg: `语义色全部在映射表内（彩色块 ${colored}）` }];
}

function checkV15(root) {
  const tags = findAll(root, (el) => el.cls.some((c) => ['tag', 'badge', 'wf-tag'].indexOf(c) >= 0) || el.attrs['data-tag'] !== undefined);
  const out = [];
  tags.forEach((el) => {
    const cs = styleOf(el);
    const bgv = cs['background-color'] || cs.background;
    const fgv = cs.color;
    if (!bgv) { out.push({ id: 'V-15', ok: false, msg: `${describe(el)} 无底色（三元组不全）` }); return; }
    const bg = parseColor(bgv), fg = parseColor(fgv || '');
    if (!bg) return;
    const { s, l } = hsl(bg);
    if (l < 0.90 && s > 0.60) out.push({ id: 'V-15', ok: false, msg: `${describe(el)} 背景 ${bgv}（L ${Math.round(l * 100)}% / S ${Math.round(s * 100)}%）实心高饱和` });
    if (fg && contrast(fg, bg) < 4.5) out.push({ id: 'V-15', ok: false, msg: `${describe(el)} 字底对比 ${contrast(fg, bg).toFixed(2)}:1（<4.5）` });
  });
  return out.length ? out : [{ id: 'V-15', ok: true, msg: '状态标签：浅底 + 深字 + 对比 ≥4.5' }];
}

function checkV16(root) {
  const out = [];
  walk(root, (el) => {
    if (el.tag === '#root' || el.children.length) return;
    const txt = ownText(el);
    if (!txt || txt.length < 2) return;
    const cs = styleOf(el);
    if (!cs.color) return;
    const fg = parseColor(cs.color);
    if (!fg) return;
    const bg = bgOf(el);
    if (!bg.rgb) { out.push({ id: 'V-16', ok: true, warn: true, msg: `${describe(el)} 背景为渐变，未判` }); return; }
    const fs = toPx(cs['font-size'] || '') || 14;
    const need = fs >= 24 ? 3 : 4.5;
    const r = contrast(fg, bg.rgb);
    if (r < need) out.push({ id: 'V-16', ok: false, msg: `${describe(el)} ${cs.color} on ${bg.raw}（${r.toFixed(2)}:1 < ${need}）` });
  });
  return out.length ? out : [{ id: 'V-16', ok: true, msg: '正文对比度 ≥4.5:1' }];
}

function hasShape(el) {
  let hit = false;
  walk(el, (x) => {
    if (x.tag === 'svg' || x.tag === 'img') hit = true;
    if (x.cls.some((c) => ['icon', 'dot', 'dot3', 'wf-icon'].indexOf(c) >= 0)) hit = true;
  });
  return hit;
}
function checkV17(root) {
  const out = [];
  const statuses = findAll(root, (el) => el.cls.some((c) => ['status', 'state', 'wf-status'].indexOf(c) >= 0) || el.attrs['data-semantic'] !== undefined);
  statuses.forEach((el) => {
    if (!textOf(el)) out.push({ id: 'V-17', ok: false, msg: `${describe(el)} 状态只有颜色，无文字` });
    else if (!hasShape(el)) out.push({ id: 'V-17', ok: false, msg: `${describe(el)} 状态无形状/图标（仅色 + 词）` });
  });
  return out.length ? out : [{ id: 'V-17', ok: true, msg: '状态均为 色 + 词 + 形' }];
}

function checkV18(root) {
  const out = [];
  const prims = findAll(root, (el) => el.cls.indexOf('btn-primary') >= 0);
  const byRegion = {};
  prims.forEach((el) => {
    const r = regionOf(el);
    (byRegion[r] = byRegion[r] || []).push(el);
    if (findAll(el, (x) => x.tag === 'svg' || x.tag === 'i' || x.tag === 'img').length) {
      out.push({ id: 'V-18', ok: false, msg: `${r} 主按钮带前置图标（${describe(el)}）` });
    }
  });
  Object.keys(byRegion).forEach((r) => {
    if (byRegion[r].length > 1) out.push({ id: 'V-18', ok: false, msg: `${r} 主按钮 ${byRegion[r].length} 个（每区 ≤1）` });
  });
  const dangers = findAll(root, (el) => el.cls.indexOf('btn-danger') >= 0);
  dangers.forEach((d) => {
    const r = regionOf(d);
    if (byRegion[r] && byRegion[r].length) out.push({ id: 'V-18', ok: false, msg: `${r} 危险按钮与主按钮同级实心` });
  });
  // v0.6.9：同区主左辅右——同一父容器里辅按钮不得排在主按钮之前（静态用 DOM 顺序）
  const isBtn = (el) => el.tag === 'button' || el.cls.some((c) => /^(btn|wf-btn)/.test(c));
  const isSec = (el) => isBtn(el) && el.cls.some((c) => /^(btn|wf-btn)(-secondary)?$/.test(c))
    && !el.cls.some((c) => /primary|danger/.test(c));
  findAll(root, () => true).forEach((p) => {
    const sibs = (p.children || []).filter(isBtn);
    const pi = sibs.findIndex((el) => el.cls.indexOf('btn-primary') >= 0);
    if (pi < 0) return;
    const si = sibs.findIndex(isSec);
    if (si >= 0 && si < pi) {
      const label = (el) => ((el.texts || []).join('').trim().slice(0, 12) || describe(el));
      out.push({ id: 'V-18', ok: false, msg: `${regionOf(sibs[pi])} 主按钮在辅按钮右侧（「${label(sibs[si])}」在「${label(sibs[pi])}」之前）` });
    }
  });
  return out.length ? out : [{ id: 'V-18', ok: true, msg: '每区 ≤1 主按钮，无图标、无同级危险、主左辅右' }];
}

function checkV19(rules) {
  const out = [];
  const tokenSet = new Set(Object.values(SHADOW_TOKENS).map(canonShadow));
  rules.forEach((r) => {
    const rad = r.decls['border-radius'];
    if (rad) {
      rad.trim().split(/\s+/).forEach((tok) => {
        if (tok === '0' || tok === '0px') return;
        const n = pxNum(tok);
        if (n !== null) { if (RADIUS_OK.indexOf(n) < 0) out.push({ id: 'V-19', ok: false, msg: `${r.selector}  border-radius:${rad}（合法只有 0 / 2）` }); return; }
        if (/^50%$/.test(tok)) { if (!AVATAR_WHITE.test(r.selector)) out.push({ id: 'V-19', ok: false, msg: `${r.selector}  border-radius:50%（只许头像 / 圆形图标）` }); return; }
        out.push({ id: 'V-19', ok: false, msg: `${r.selector}  border-radius:${rad}（非 px / 非 50%）` });
      });
    }
    const sh = r.decls['box-shadow'];
    if (sh) {
      const c = canonShadow(sh);
      if (c !== 'none') {
        const isFocus = /:focus/.test(r.selector);
        const blueGlow = /rgba\((?:28,110,255|24,144,255)/i.test(c) || /var\(--color-blue/.test(c);
        if (isFocus && blueGlow) out.push({ id: 'V-19', ok: false, msg: `${r.selector}  box-shadow:${sh}（禁止 Focus 蓝色外发光）` });
        else if (!tokenSet.has(c)) out.push({ id: 'V-19', ok: false, msg: `${r.selector}  box-shadow:${sh}（非 s1 / s2 / s3）` });
      }
    }
  });
  return out.length ? out : [{ id: 'V-19', ok: true, msg: '圆角 ∈ {0,2} / 阴影 ∈ {none,s1,s2,s3}' }];
}

function checkV20(root) {
  const out = [];
  walk(root, (el) => {
    if (el.tag === '#root') return;
    if (el.cls.indexOf('btn-danger') >= 0) return;
    const cs = styleOf(el);
    const vals = [cs['background-color'], cs.background, cs.color, cs['border-color']].filter(Boolean);
    vals.forEach((rawToCheck) => {
      if (/gradient/i.test(rawToCheck)) return;
      const rgb = parseColor(rawToCheck);
      if (!rgb) return;
      const h = hex(rgb);
      if (REDS.indexOf(h) < 0) return;
      if (el.attrs['data-semantic'] || el.attrs['data-brand'] !== undefined) return;
      if (findInAncestorText(el, RISK_WORDS)) return;
      const inViz = findAncestor(el, (x) => x.attrs['data-viz'] !== undefined);
      if (inViz) out.push({ id: 'V-20', ok: false, msg: `${describe(el)} ${rawToCheck} 用于可视化（排名/进度不是风险）` });
    });
  });
  return out.length ? out : [{ id: 'V-20', ok: true, msg: '红色只用于风险语境' }];
}
function findAncestor(el, pred) {
  let p = el;
  while (p && p.tag !== '#root') { if (pred(p)) return p; p = p.parent; }
  return null;
}
function findInAncestorText(el, re) {
  let p = el;
  while (p && p.tag !== '#root') {
    if (re.test(textOf(p))) return true;
    p = p.parent;
  }
  return false;
}

const SIX_STATES = ['empty', 'loading', 'partial', 'denied', 'expired', 'unknown'];
function checkV22(root) {
  const out = [];
  // 只认六态取值；data-state 被用来标"视图态"(default/grid/…) 的产物不参与
  const states = findAll(root, (el) => {
    if (el.cls.indexOf('wf-state') >= 0) return true;
    const v = el.attrs['data-state'];
    return v !== undefined && SIX_STATES.indexOf(v.trim().toLowerCase()) >= 0;
  });
  const byText = {};
  states.forEach((el) => {
    const t = textOf(el).replace(/\s+/g, '');
    if (!t) return;
    const st = el.attrs['data-state'] || 'state';
    (byText[t] = byText[t] || new Set()).add(st);
  });
  Object.keys(byText).forEach((t) => {
    if (byText[t].size > 1) out.push({ id: 'V-22', ok: false, msg: `同一句「${t.slice(0, 12)}」覆盖 ${byText[t].size} 种状态（${[...byText[t]].join('/')}）` });
  });
  return out.length ? out : [{ id: 'V-22', ok: true, msg: `${states.length} 处状态文案不重复` }];
}

function checkV23(root) {
  const out = [];
  const strips = findAll(root, (el) => el.cls.indexOf('wf-kpi--strip') >= 0);
  strips.forEach((strip) => {
    if (findAncestor(strip, (x) => x.attrs['data-hero'] !== undefined)) {
      out.push({ id: 'V-23', ok: false, msg: 'KPI 条位于 data-hero 内（不得当主图）' });
    }
    const items = findAll(strip, (el) => el.cls.indexOf('wf-kpi-item') >= 0);
    const nums = (textOf(strip).match(/\d+/g) || []).length;
    if (items.length < nums) out.push({ id: 'V-23', ok: false, msg: `数字 ${nums} 个 / 单元 ${items.length} 个（无单元容器）` });
    items.forEach((it) => {
      const label = findAll(it, (el) => el.cls.some((c) => /kpi-item__(label|name)/.test(c)))[0];
      const value = findAll(it, (el) => el.cls.some((c) => /kpi-item__(value|num)/.test(c)))[0];
      if (!label || !value) { out.push({ id: 'V-23', ok: false, msg: `${describe(it)} 缺 label 或 value` }); return; }
      const fsL = toPx(styleOf(label)['font-size'] || '') || 0;
      const fsV = toPx(styleOf(value)['font-size'] || '') || 0;
      const wL = parseInt(styleOf(label)['font-weight'] || '400', 10);
      const wV = parseInt(styleOf(value)['font-weight'] || '400', 10);
      const bySize = fsL > 0 && fsV / fsL >= 1.4;
      const byWeight = wV >= 600 && wL <= 400;
      if (!bySize && !byWeight) out.push({ id: 'V-23', ok: false, msg: `${describe(it)} value 与 label 同级同重（${fsV || '?'}/${fsL || '?'}）` });
    });
  });
  return out.length ? out : [{ id: 'V-23', ok: true, msg: 'KPI 组：单元容器 + 三层可辨' }];
}

function checkV24(root, ctx) {
  const out = [];
  const cards = findAll(root, (el) => el.cls.some((c) => ['card', 'wf-card', 'kpi-card'].indexOf(c) >= 0));
  if (cards.length < 2) return [{ id: 'V-24', ok: true, warn: true, msg: '卡片 <2，不判' }];

  // ① 静态：操作顺序 / 槽位签名
  const sigs = cards.map((c) => findAll(c, (el) => el.tag === 'button' || el.cls.some((x) => /^btn/.test(x)))
    .map((b) => [...b.cls].sort().join('.')).join('|'));
  const uniq = [...new Set(sigs)];
  if (uniq.length > 1) {
    out.push({ id: 'V-24', ok: false, msg: `卡片操作顺序不一致（${uniq.length} 种签名）` });
  }

  // ② 量测：顺序一致时，主操作的实际位置必须对齐（左缘 / 右缘极差 ≤2px）
  //    静态只看类名，看不出"第二张卡的按钮甩到右边"——这正是用户原话说的那个毛病
  const m = ctx && ctx.metrics;
  if (!m) {
    out.push({
      id: 'V-24', ok: true, warn: true,
      msg: (ctx && ctx.noMeasure ? '位置已按 --no-measure 关闭' : '位置未量测（9222 未开，降级不阻断）') + ' · 本轮只判了顺序',
    });
    return out;
  }
  const cs = (m.cards || []).filter((c) => (c.ops || []).length > 0);
  if (cs.length < 2) {
    out.push({ id: 'V-24', ok: true, warn: true, msg: `有操作的卡片仅 ${cs.length} 张，位置不判` });
    return out;
  }
  const picks = cs.map((c) => c.ops.find((o) => o.primary) || c.ops[c.ops.length - 1]);
  const span = (a) => Math.max.apply(null, a) - Math.min.apply(null, a);
  const dx = span(picks.map((p) => Math.round(p.x)));
  const dr = span(picks.map((p) => Math.round(p.right)));
  if (dx > 2 || dr > 2) {
    out.push({ id: 'V-24', ok: false, part: 'measure', msg: `卡片主操作位置不一致（左缘极差 ${dx}px / 右缘极差 ${dr}px > 2px）` });
    return out;
  }
  if (!out.length) out.push({ id: 'V-24', ok: true, msg: `卡片操作槽位与位置一致（${cs.length} 张实测）` });
  return out;
}

// ── V-05 容器撑满与留白（量测：内容占比 + 单侧连续空白；草图不判）──────────
// 判据：内容宽 ≥ 容器宽 80%、内容高 ≥ 容器高 60%；高 ≤72px 的宽扁块只判单侧空白 ≤20%；
//       任一块单侧连续空白 > 容器宽 25% 判 FAIL。尺寸取自 1440 视口实测 bbox。
function checkV05(ctx) {
  const m = ctx && ctx.metrics;
  if (!m) {
    return [{
      id: 'V-05', ok: true, warn: true,
      msg: (ctx && ctx.noMeasure ? '量测已按 --no-measure 关闭' : '未量测（9222 未开，本轮降级不阻断）') + ' · 容器撑满与留白（需 bbox）',
    }];
  }
  const out = [];
  let judged = 0;
  (m.blocks || []).forEach((b) => {
    // 门槛：够宽够厚才算「内容块」；h≥48 起判，否则宽扁条（≤72）永远进不了分支
    if (!(b.w >= 200 && b.h >= 48) || (b.nKids || 0) < 2) return;
    const innerW = Math.max(1, b.w - b.padL - b.padR);
    const innerH = Math.max(1, b.h - b.padT - b.padB);
    const fillW = b.cw / innerW;
    const fillH = b.ch / innerH;
    const gap = Math.max(b.gapL, b.gapR) / innerW;
    const tag = (b.cls || 'block').split(/\s+/)[0] || 'block';
    const name = tag + '「' + (b.text || '') + '」';
    judged++;
    if (b.h <= 72) {
      if (gap > 0.20) out.push({ id: 'V-05', ok: false, part: 'measure', msg: `宽扁块单侧空白 ${Math.round(gap * 100)}% > 20%（${name}）` });
      return;
    }
    if (fillW < 0.8) out.push({ id: 'V-05', ok: false, part: 'measure', msg: `内容宽仅占 ${Math.round(fillW * 100)}% < 80%（${name}）` });
    else if (fillH < 0.6) out.push({ id: 'V-05', ok: false, part: 'measure', msg: `内容高仅占 ${Math.round(fillH * 100)}% < 60%（${name}）` });
    if (gap > 0.25) out.push({ id: 'V-05', ok: false, part: 'measure', msg: `单侧连续空白 ${Math.round(gap * 100)}% > 25%（${name}）` });
  });
  if (!judged) return [{ id: 'V-05', ok: true, warn: true, msg: '无内容块（w≥200 / h≥48 / 子元素≥2），不判' }];
  if (!out.length) out.push({ id: 'V-05', ok: true, msg: `内容块撑满容器（${judged} 块实测，无大面积留白）` });
  return out;
}


// ── V-25 行内标签纵向对齐（静态近似：数值右对齐 + 槽位结构；left 极差需量测）──
function checkV25(root) {
  const out = [];
  findAll(root, (el) => el.tag === 'table').forEach((tb) => {
    const rows = findAll(tb, (el) => el.tag === 'tr').filter((tr) => tr.children.some((c) => c.tag === 'td'));
    if (rows.length < 2) return;
    const cells = rows.map((tr) => tr.children.filter((c) => c.tag === 'td'));
    const cols = Math.min.apply(null, cells.map((c) => c.length));
    for (let i = 0; i < cols; i++) {
      const col = cells.map((r) => r[i]).filter(Boolean);
      // 纯数值才算数值列：日期 / 版本号 / 「2.1.x 261」这类不算
      const numeric = col.filter((td) => /^[¥$]?\d[\d,]*(?:\.\d+)?\s*(?:%|台|个|次|项)?$/.test(textOf(td).trim())).length / col.length >= 0.8;
      if (!numeric) continue;
      const bad = col.filter((td) => (styleOf(td)['text-align'] || 'left') !== 'right');
      if (bad.length) out.push({ id: 'V-25', ok: false, msg: `第 ${i + 1} 列数值未右对齐（${bad.length} 处，如「${textOf(bad[0])}」）` });
    }
    const sigs = rows.map((tr) => findAll(tr, (el) => el.cls.indexOf('tag') >= 0)
      .map((el) => el.cls.filter((c) => c !== 'tag').join('.') || 'tag').join('|'));
    if (new Set(sigs).size > 1) out.push({ id: 'V-25', ok: false, msg: '各行标签槽位不一致（数量或类型不同）' });
  });
  return out.length ? out : [{ id: 'V-25', ok: true, msg: '数值列右对齐、标签槽位一致；left 极差待量测' }];
}

const REL_MAP = {
  '构成': ['stack', 'pie', 'compose'],
  '对比': ['bar', 'axis', 'column'],
  '时序': ['line', 'area', 'trend', 'tl'],
  '分布': ['hist', 'grid', 'scatter', 'mx'],
  '层级': ['tree', 'topo'],
  '流向': ['sankey', 'flow'],
  '排名': ['hbar', 'rank', 'bar'],
  '进度': ['progress', 'bar'],
};
// ── V-13 截断与换行（静态近似：声明级，无 scrollWidth 实测）────────────────
function checkV13(root) {
  const out = [];
  const textEls = findAll(root, (el) => {
    const cs = styleOf(el);
    return cs['text-overflow'] === 'ellipsis'
      || (cs['white-space'] === 'nowrap' && /hidden/.test(cs.overflow || ''));
  });
  textEls.forEach((el) => {
    const cs = styleOf(el);
    const label = '「' + textOf(el).slice(0, 16) + '」';
    if (cs['white-space'] === 'nowrap' && /hidden/.test(cs.overflow || '') && cs['text-overflow'] !== 'ellipsis') {
      out.push({ id: 'V-13', ok: false, msg: `文本溢出无截断${label}（静态近似：nowrap + overflow:hidden 但无 ellipsis）` });
      return;
    }
    if (!el.attrs.title && !el.attrs['data-tooltip'] && !el.attrs['aria-label']) {
      out.push({ id: 'V-13', ok: false, msg: `已截断但全文不可达${label}（缺 title / tooltip）` });
    }
  });
  findAll(root, (el) => /rotate\(\s*[1-9-]/.test(styleOf(el).transform || '')).forEach((el) => {
    const m = /rotate\(([^)]+)\)/.exec(styleOf(el).transform);
    out.push({ id: 'V-13', ok: false, msg: `标签旋转 ${m ? m[1] : '非 0°'}（标签不得旋转）` });
  });
  findAll(root, (el) => el.tag === 'table').forEach((tb) => {
    const rows = findAll(tb, (tr) => tr.tag === 'tr');
    const head = rows.find((tr) => findAll(tr, (c) => c.tag === 'th').length > 0);
    if (!head) return;
    const ths = head.children.filter((c) => c.tag === 'th');
    ths.forEach((th, i) => {
      if (!/标识|ID|金额|数量|时间|编号/.test(textOf(th))) return;
      const cells = rows.filter((tr) => tr !== head)
        .map((tr) => tr.children.filter((c) => c.tag === 'td')[i]).filter(Boolean);
      if (!cells.length) return;
      const narrow = cells.filter((td) => (pxNum(styleOf(td)['min-width']) || 0) < 84);
      if (narrow.length) {
        out.push({ id: 'V-13', ok: false, msg: `关键值列「${textOf(th)}」最小宽 < 12 字符（≈84px / ${narrow.length} 处）` });
      }
    });
  });
  if (!out.length) out.push({ id: 'V-13', ok: true, msg: '截断可达 / 标签未旋转 / 关键列够宽（静态近似）' });
  return out;
}

// ── V-27 承载空间与信息量（复用 data-hero，不新建钩子）──────────────────────
function checkV27(root) {
  const heroes = findAll(root, (el) => el.attrs['data-hero'] !== undefined);
  if (!heroes.length) return [{ id: 'V-27', ok: true, warn: true, msg: '未声明 data-hero（与 EX-1.4-22 同钩子），跳过' }];
  const out = [];
  const CARRIERS = ['canvas', 'axis', 'grid', 'stack', 'chain', 'rank', 'tl', 'topo', 'sankey', 'scatter'];
  const UNITS = /^(bar|seg|cell|node|tick|item|point|step|band)$/;
  heroes.forEach((hero) => {
    const carriers = findAll(hero, (el) => {
      if (el.attrs['data-kpi-strip'] !== undefined) return false;
      if (el.tag === 'svg' && el.attrs['data-carrier'] !== undefined) return true;
      return el.cls.some((c) => CARRIERS.indexOf(c) >= 0);
    });
    if (!carriers.length) {
      const cards = hero.children.filter((c) => c.cls.some((x) => /card|kpi|tile/.test(x)));
      if (cards.length >= 3) {
        out.push({ id: 'V-27', ok: false, msg: `hero 内 ${cards.length} 张卡片各带数字，无共享承载空间（卡片墙）` });
      } else {
        out.push({ id: 'V-27', ok: true, warn: true, msg: '认不出载体（类名可能不同），待核不判死' });
      }
      return;
    }
    const carrier = carriers[0];
    const units = findAll(carrier, (el) => UNITS.test(el.cls.join('|')) || ['rect', 'circle', 'line', 'path'].indexOf(el.tag) >= 0);
    // 命中 .grid / .canvas 这类**布局类**但没有柱 / 格 / 节点 = 认不出数据载体，按 md §4 只报 ⚠️ 待核
    if (!units.length) {
      out.push({ id: 'V-27', ok: true, warn: true, msg: '载体类名命中但无数据单元（可能是布局 grid），待核不判死' });
      return;
    }
    const nums = [...new Set((textOf(carrier).match(/\d[\d,]*(?:\.\d+)?/g) || [])
      .filter((n) => parseFloat(n.replace(/,/g, '')) >= 10))];
    const ratio = units.length ? nums.length / units.length : 0;
    if (units.length < 3) out.push({ id: 'V-27', ok: false, msg: `承载空间内数据单元 ${units.length} 个 < 3` });
    if (nums.length < 2) out.push({ id: 'V-27', ok: false, msg: `承载空间内真实数字 ${nums.length} 个 < 2（数字须落在载体上）` });
    if (ratio < 0.8) out.push({ id: 'V-27', ok: false, msg: `数字 / 单元 = ${Math.round(ratio * 100)}% < 80%（${nums.length}/${units.length}）` });
    if (!out.length) out.push({ id: 'V-27', ok: true, msg: `主图落在同一承载空间（${units.length} 单元 / ${nums.length} 数字，KPI 条不计）` });
  });
  return out;
}

function checkV26(root) {
  const out = [];
  const blocks = findAll(root, (el) => el.attrs['data-viz'] !== undefined);
  blocks.forEach((b) => {
    const rel = b.attrs['data-rel'];
    if (!rel) return;
    const kind = (b.attrs['data-viz-kind'] || '').trim();
    const allow = REL_MAP[rel];
    if (!kind) { out.push({ id: 'V-26', ok: true, warn: true, msg: `${describe(b)} data-rel=${rel} 但无 data-viz-kind` }); return; }
    if (!allow) { out.push({ id: 'V-26', ok: true, warn: true, msg: `${describe(b)} data-rel=${rel} 不在白名单` }); return; }
    if (allow.indexOf(kind) < 0) out.push({ id: 'V-26', ok: false, msg: `${describe(b)} rel=${rel} 却是 kind=${kind}（应为 ${allow.join('/')}）` });
  });
  if (!blocks.length) out.push({ id: 'V-26', ok: true, warn: true, msg: '无 data-viz，转走查' });
  return out.length ? out : [{ id: 'V-26', ok: true, msg: '每块 data-rel 与 kind 匹配' }];
}

// ── V-04 通栏克制（bbox 优先；无量测时按宽度声明静态近似）─────────────────
const VIZ_ALLOW = ['topo', 'sankey', 'mx', 'scatter', 'tl'];
const VIZ_CARRIER_CLS = /bar|line|area|pie|chart|axis|grid|stack|scatter|topo|sankey|rank|tl|mx|heat/i;

function inferVizKind(b) {
  if (b.attrs['data-viz-kind']) return b.attrs['data-viz-kind'].trim();
  const s = b.cls.join(' ');
  if (/heat|matrix/.test(s)) return 'mx';
  if (/gantt|timeline/.test(s)) return 'tl';
  if (/topo|network/.test(s)) return 'topo';
  if (/sankey|flow/.test(s)) return 'sankey';
  if (/scatter/.test(s)) return 'scatter';
  if (/pie|donut|ring/.test(s)) return 'pie';
  if (/area/.test(s)) return 'area';
  if (/line|trend/.test(s)) return 'line';
  if (/bar|column|rank/.test(s)) return 'bar';
  return '';
}
function staticViz(b) {
  const cs = styleOf(b);
  const w = (cs.width || '').trim();
  let ratio = /%$/.test(w) ? parseFloat(w) / 100 : null;
  const decl = b.attrs['data-viz-w'] || '';
  if (ratio === null && decl) {
    const d = decl.toLowerCase();
    if (/^(full|wide|all|100%?)$/.test(d)) ratio = 1;
    else if (/^(half|49%?|50%?)$/.test(d)) ratio = 0.5;
  }
  const units = findAll(b, (el) => el.attrs['data-point'] !== undefined
    || el.cls.some((c) => /^(point|tick|bar|cell|node)$/.test(c))).length;
  const points = parseInt(b.attrs['data-points'], 10);
  return {
    ratio: Number.isFinite(ratio) ? ratio : null,
    kind: inferVizKind(b),
    declared: decl,
    points: Number.isFinite(points) ? points : units,
    carrier: b.tag === 'svg' || b.tag === 'canvas' || findAll(b, (el) =>
      VIZ_CARRIER_CLS.test(el.cls.join(' ')) || el.attrs['data-carrier'] !== undefined).length > 0,
    kpi: !!findAncestor(b, (el) => el.attrs['data-kpi-strip'] !== undefined),
  };
}
function checkV04(root, rules, ctx) {
  const metrics = ctx && ctx.metrics;
  const blocks = findAll(root, (el) => el.attrs['data-viz'] !== undefined);
  if (!blocks.length) return [{ id: 'V-04', ok: true, warn: true, msg: '无 data-viz，转走查' }];
  const out = [];
  blocks.forEach((b, i) => {
    const measured = metrics && metrics.vizs && metrics.vizs[i];
    const v = measured || staticViz(b);
    const where = describe(b) + (v.kind ? ` kind=${v.kind}` : '');
    const ratio = v.ratio;
    if (ratio === null) {
      out.push({ id: 'V-04', ok: true, warn: true, msg: `${where} 宽度未声明且无量测，待核不判死` });
      return;
    }
    if (ratio < 0.85) return;
    if (ratio < 0.9) {
      out.push({ id: 'V-04', ok: true, warn: true, msg: `${where} 实测宽占比 ${Math.round(ratio * 100)}%（0.85~0.9 待核）` });
      return;
    }
    const pct = Math.round(ratio * 100) + '%';
    if (v.declared && /half|49%?|50%?|narrow/i.test(v.declared)) {
      out.push({ id: 'V-04', ok: false, msg: `${where} 实测通栏 ${pct} 但 data-viz-w=${v.declared}（声明不实）` });
      return;
    }
    if (VIZ_ALLOW.indexOf(v.kind) >= 0) return;
    if ((v.kind === 'line' || v.kind === 'area') && v.points >= 12) return;
    if (!v.carrier && v.kpi) return;
    if (v.kind === 'geo') {
      out.push({ id: 'V-04', ok: true, warn: true, msg: `${where} geo 未收录（EX-1.4-39），待核不判死` });
      return;
    }
    out.push({ id: 'V-04', ok: false, msg: `${where} 实测通栏 ${pct}，形态不在白名单` });
  });
  if (!out.length) out.push({ id: 'V-04', ok: true, msg: `通栏块形态合规（${blocks.length} 块）` });
  return out;
}

// ── V-21 表格视觉（bbox 优先；无量测时按 CSS 声明静态近似）─────────────────
function cellType(el) {
  const t = textOf(el).trim();
  if (/^\d{4}-\d/.test(t)) return 'd';
  if (/^[¥$]?\d/.test(t)) return 'n';
  return 't';
}
function staticTable(tb) {
  const rows = findAll(tb, (tr) => tr.tag === 'tr' && tr.children.some((c) => c.tag === 'td'));
  const ths = findAll(tb, (el) => el.tag === 'th');
  const tds = findAll(tb, (el) => el.tag === 'td');
  const csTh = styleOf(ths[0] || tb), csTd = styleOf(tds[0] || tb);
  const bgTh = csTh.background || csTh['background-color'] || '';
  const bgTd = csTd.background || csTd['background-color'] || '';
  const heights = rows.map((tr) => {
    const h = pxNum(styleOf(tr).height);
    return h === null ? 40 : h;
  });
  const types = rows.map((tr) => tr.children.filter((c) => c.tag === 'td').map(cellType));
  const zebra = RULES.some((r) => /nth-child\(\s*(?:even|2n)/i.test(r.selector)
    && /background/.test(Object.keys(r.decls).join(' ')));
  return {
    headerDistinct: (!!bgTh && !!bgTd && bgTh !== bgTd)
      || (csTh['font-weight'] || '') !== (csTd['font-weight'] || ''),
    heights, types, zebra,
    lines: tds.some((td) => borderWidth(styleOf(td)) > 0),
    sticky: ths.length > 0 && styleOf(ths[ths.length - 1]).position === 'sticky',
    overflow: tb.attrs['data-table-overflow'] === 'true',
  };
}
function rowHeightIssue(heights, types) {
  const groups = new Map();
  heights.forEach((h, i) => {
    const key = (types[i] || []).join(',');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(h);
  });
  for (const hs of groups.values()) {
    const min = Math.min.apply(null, hs), max = Math.max.apply(null, hs);
    if (max - min <= 1) continue;
    // comp-table §1.4.1/§1.4.9：单行 40、双行 60，同表不得混用（v0.7 起不再放行 40 的整数倍）
    const uniq = [...new Set(hs.map((h) => Math.round(h)))].sort((a, b) => a - b);
    return uniq.join('/');
  }
  return null;
}
function checkV21(root, rules, ctx) {
  const metrics = ctx && ctx.metrics;
  const tables = findAll(root, (el) => el.tag === 'table');
  if (!tables.length) return [{ id: 'V-21', ok: true, warn: true, msg: '无表格，不判' }];
  const out = [];
  tables.forEach((tb, i) => {
    const measured = metrics && metrics.tables && metrics.tables[i];
    const t = measured || staticTable(tb);
    const where = '表格' + (tb.attrs.id ? '#' + tb.attrs.id : i + 1);
    if (!t.headerDistinct) out.push({ id: 'V-21', ok: false, msg: `${where} 表头与正文无区分（底色与字重均相同）` });
    const badHeights = rowHeightIssue(t.heights || [], t.types || []);
    if (badHeights) out.push({ id: 'V-21', ok: false, msg: `${where} 行高 ${badHeights}（同列文本类型一致却不齐；单行 40 / 双行 60，不得混用）` });
    if (t.zebra && t.lines) out.push({ id: 'V-21', ok: false, msg: `${where} 斑马线与分割线并存` });
    if (t.overflow && !t.sticky) out.push({ id: 'V-21', ok: false, msg: `${where} 横向溢出但操作列不 sticky` });
  });
  if (!out.length) out.push({ id: 'V-21', ok: true, msg: `表格视觉合规（${tables.length} 张${metrics ? '，bbox 实测' : '，静态近似'}）` });
  return out;
}

// ── V-01 唯一 Container 与左基线（严格 bbox）───────────────────────────────
function checkV01(root, rules, ctx) {
  const p = ctx && ctx.metrics && ctx.metrics.page;
  if (!p) return [{ id: 'V-01', ok: true, warn: true, msg: '未量测（需 bbox）· 唯一 Container 与左基线' }];
  const out = [];
  const issue = (msg) => {
    if (p.viewport < 1280) out.push({ id: 'V-01', ok: true, warn: true, msg: '⚠️ 窄屏仅提示：' + msg });
    else out.push({ id: 'V-01', ok: false, msg });
  };
  if (!p.roots.length) return [{ id: 'V-01', ok: true, warn: true, msg: '认不出页面主容器，待核不判死' }];
  if (p.roots.length > 1) issue(`多个内容容器（${p.roots.length}：${p.roots.map((r) => r.label).join(' / ')}）`);
  const c = p.roots[0];
  if (c.maxWidth) issue(`全局 max-width=${c.maxWidth}（资产不允许）`);
  if (Math.abs(c.left - p.M) > 1) issue(`Container 左边界 ${Math.round(c.left)} / M ${p.M}（差 ${Math.round(Math.abs(c.left - p.M))}px）`);
  p.sections.forEach((s) => {
    if (Math.abs(s.left - c.left) > 1) issue(`${s.label} 左边界 ${Math.round(s.left)} / C ${Math.round(c.left)}（差 ${Math.round(Math.abs(s.left - c.left))}px）`);
  });
  if (!out.length) out.push({ id: 'V-01', ok: true, msg: `唯一 Container，左基线 ${Math.round(c.left)}px = M ${p.M}（${p.sections.length} 区对齐）` });
  return out;
}

// ── V-02 块落 24 栅格列线（严格 bbox）──────────────────────────────────────
const GRID_GUTTERS = [8, 16, 24, 32];
const GRID_SPANS = ['12:12', '16:8', '18:6', '20:4', '21:3', '8:8:8', '12:6:6', '12:8:4', '10:8:6'];
function spanOnGrid(spans) {
  return GRID_SPANS.indexOf(spans.slice().sort((a, b) => b - a).join(':')) >= 0;
}
function checkV02(root, rules, ctx) {
  const g = ctx && ctx.metrics && ctx.metrics.grid;
  if (!g) return [{ id: 'V-02', ok: true, warn: true, msg: '未量测（需 bbox）· 块落 24 栅格列线' }];
  if (!g.rows.length) return [{ id: 'V-02', ok: true, warn: true, msg: '无 data-grid-row，转走查' }];
  const out = [];
  const issue = (msg) => {
    if (g.viewport < 1280) out.push({ id: 'V-02', ok: true, warn: true, msg: '⚠️ 窄屏仅提示：' + msg });
    else out.push({ id: 'V-02', ok: false, msg });
  };
  g.rows.forEach((row) => {
    const G = row.gap;
    if (GRID_GUTTERS.indexOf(G) < 0) issue(`${row.label} gutter=${G}（只允许 8/16/24/32）`);
    const uniq = [...new Set((row.gaps || []).map((v) => Math.round(v)))];
    if (uniq.length > 1) issue(`${row.label} 同一 Row gutter 不一致（${row.gaps.join('/')}）`);
    const colW = (g.viewport - 2 * g.M - 23 * G) / 24;
    if (colW <= 0) { issue(`${row.label} 列宽非正（viewport ${g.viewport} / G ${G}）`); return; }
    const leftLines = [], rightLines = [];
    for (let k = 0; k <= 24; k++) leftLines.push(g.M + k * (colW + G));
    for (let k = 1; k <= 24; k++) rightLines.push(g.M + k * colW + (k - 1) * G);
    const nearest = (v, arr) => Math.min.apply(null, arr.map((x) => Math.abs(v - x)));
    row.items.forEach((it, i) => {
      const dl = nearest(it.left, leftLines), dr = nearest(it.right, rightLines);
      if (dl > 1.05 || dr > 1.05) {
        issue(`${row.label} 第 ${i + 1} 块「${it.label}」左 ${Math.round(it.left)}（Δ${dl.toFixed(1)}）/ 右 ${Math.round(it.right)}（Δ${dr.toFixed(1)}）不落列线`);
      }
    });
    const spans = row.items.map((it) => it.span);
    if (spans.some((s) => s === null)) {
      issue(`${row.label} 缺 data-span（flex:1 均分不可判）`);
      return;
    }
    const sum = spans.reduce((a, b) => a + b, 0);
    if (sum !== 24) issue(`${row.label} span 和 ${sum} ≠ 24（${spans.join(':')}）`);
    else if (!spanOnGrid(spans) && !row.items.every((it) => it.custom)) {
      issue(`${row.label} span ${spans.join(':')} 不在白名单且未标 data-custom-span`);
    }
  });
  if (!out.length) out.push({ id: 'V-02', ok: true, msg: `${g.rows.length} 个 Row 边缘落列线 / gutter 合法 / span 匹配（bbox 实测）` });
  return out;
}

const CHECKS = {
  'V-01': (root, rules, ctx) => checkV01(root, rules, ctx),
  'V-02': (root, rules, ctx) => checkV02(root, rules, ctx),
  'V-03': (root) => checkV03(root),
  'V-04': (root, rules, ctx) => checkV04(root, rules, ctx),
  'V-05': (root, rules, ctx) => checkV05(ctx),
  'V-06': (root, rules, ctx) => checkV06(root, rules, ctx),
  'V-07': (root) => checkV07(root),
  'V-08': (root, rules) => checkV08(rules),
  'V-09': (root) => checkV09(root),
  'V-10': (root, rules) => checkV10(rules),
  'V-11': (root) => checkV11(root),
  'V-12': (root) => checkV12(root),
  'V-13': (root) => checkV13(root),
  'V-14': (root) => checkV14(root),
  'V-15': (root) => checkV15(root),
  'V-16': (root) => checkV16(root),
  'V-17': (root) => checkV17(root),
  'V-18': (root) => checkV18(root),
  'V-19': (root, rules) => checkV19(rules),
  'V-20': (root) => checkV20(root),
  'V-21': (root, rules, ctx) => checkV21(root, rules, ctx),
  'V-22': (root) => checkV22(root),
  'V-23': (root) => checkV23(root),
  'V-24': (root, rules, ctx) => checkV24(root, ctx),
  'V-25': (root) => checkV25(root),
  'V-26': (root) => checkV26(root),
  'V-27': (root) => checkV27(root),
};

// 27 条全部已实现；保留空 PENDING 让 ALL_IDS / 回执逻辑不用分叉。
// 端口未开时严格量测项由 CHECKS 自己输出 ⚠️ 未量测，不阻断，回执按"未完成项"登记。
const PENDING = {};

const ALL_IDS = Object.keys(CHECKS).concat(Object.keys(PENDING)).sort();

// ── 执行 ────────────────────────────────────────────────────────────────────
function runChecks(html, only, profile, ctx) {
  ctx = ctx || {};
  RULES = extractRules(html).map((r) => { delete r._cand; return r; });
  const root = parseHTML(html);
  const idx = indexTree(root);
  applyStyles(idx, RULES);
  const ids = only && only.length ? only : ALL_IDS;
  const res = [];
  ids.forEach((id) => {
    if (!CHECKS[id]) {
      if (PENDING[id]) {
        res.push({
          id, ok: true, warn: true,
          msg: (ctx.noMeasure ? '量测已按 --no-measure 关闭' : '未量测（需浏览器实测，本轮降级不阻断）') + ' · ' + PENDING[id],
        });
      }
      return;
    }
    if (profile === 'sketch' && SKETCH_SKIP.indexOf(id) >= 0) {
      res.push({ id, ok: true, warn: true, msg: '草图阶段不判（灰块 / 文字当控件语汇）' });
      return;
    }
    res.push.apply(res, CHECKS[id](root, RULES, ctx));
  });
  return res;
}

function argOf(argv, name) {
  const hit = argv.find((a) => a.startsWith('--' + name + '='));
  return hit ? hit.slice(name.length + 3) : null;
}

// P0 裁定（2026-11-26）：V-05 留白与 V-24 坐标是**新增量测部分**，不是新判据。
// 静态部分照旧 FAIL；量测部分先 WARN 观察 14 天（至 2026-12-10），期间只计数不阻断。
// 到日期自动转 FAIL；可用 --measure-fail 提前转 FAIL（如误伤清单为空且决定提前收口）。
const MEASURE_WARN_UNTIL = '2026-12-10';

function report(file, res, profile, noMeasure, forceMeasureFail) {
  console.log(`\n  视觉门禁 · ${path.basename(file)} · profile=${profile}`);
  const today = new Date().toISOString().slice(0, 10);
  const inWarn = !noMeasure && !forceMeasureFail && today < MEASURE_WARN_UNTIL;
  if (inWarn) console.log(`  ⚠️  量测观察期（至 ${MEASURE_WARN_UNTIL}）：V-05 / V-24 的量测部分只计数不阻断；静态部分照旧 FAIL`);
  // 观察期只覆盖 P0 裁定的 V-05 / V-24（新增量测部分），V-06 的 Δy 不在其中
  const OBSERVE_IDS = ['V-05', 'V-24'];
  const shown = res.map((r) => (inWarn && r.part === 'measure' && OBSERVE_IDS.indexOf(r.id) >= 0 && !r.ok)
    ? { ...r, ok: true, warn: true, msg: '【观察期 WARN · 不阻断】' + r.msg }
    : r);
  shown.forEach((r) => console.log(`  ${r.warn ? '⚠️ ' : r.ok ? '✅' : '❌'} ${r.id}  ${r.msg}`));
  const fails = shown.filter((r) => !r.ok).length;
  const hit = new Set(shown.map((r) => r.id));
  const down = shown.filter((r) => r.warn && /未量测|--no-measure 关闭/.test(r.msg)).map((r) => r.id);
  const pend = new Set(shown.filter((r) => PENDING[r.id]).map((r) => r.id).concat(down));
  console.log(`  ── V 明细 ${hit.size}/${ALL_IDS.length} 条：机检 ${hit.size - pend.size} 条、未量测 ${pend.size} 条`
    + (pend.size ? (noMeasure ? '（--no-measure 关闭）' : '（⚠️ 不计通过，回执须登记为未完成项）') : ''));
  console.log(fails ? `  🚫 未过（${fails} 项）` : '  🎉 视觉专项通过');
  return fails ? 1 : 0;
}

const MEASURED_RULES = ['V-01', 'V-02', 'V-05', 'V-24'];
const OPTIONAL_MEASURED_RULES = ['V-04', 'V-21'];

async function selftest() {
  const dir = path.join(__dirname, 'fixtures', 'visual');
  if (!fs.existsSync(dir)) { console.error('找不到夹具目录：' + dir); process.exit(2); }
  const files = fs.readdirSync(dir).filter((f) => /^v-\d\d-(good|bad|badm|alt|bad-order)\.html$/.test(f)).sort();
  if (!files.length) { console.error('夹具目录为空：' + dir); process.exit(2); }
  const portOn = portAlive ? await portAlive() : false;
  if (!portOn) console.log('  ⚠️ 9222 未开：V-01 / V-02 / V-05 / V-24 量测用例跳过；V-04 / V-21 走静态近似（静态用例照跑）');
  let bad = 0, skip = 0, ran = 0;
  for (const f of files) {
    const id = 'V-' + f.slice(2, 4).toUpperCase();
    const kind = f.replace(/^v-\d\d-/, '').replace(/\.html$/, '');
    const file = path.join(dir, f);
    const html = fs.readFileSync(file, 'utf8');
    let metrics = null;
    if (portOn && (MEASURED_RULES.indexOf(id) >= 0 || OPTIONAL_MEASURED_RULES.indexOf(id) >= 0)) {
      try { metrics = await measure(file); } catch { metrics = null; }
    }
    if (MEASURED_RULES.indexOf(id) >= 0 && !metrics) {
      skip++;
      console.log(`  ⏭  ${f.padEnd(18)} 跳过（量测不可用）`);
      continue;
    }
    ran++;
    const res = runChecks(html, [id], 'wireframe', { metrics });
    const fails = res.filter((r) => !r.ok);
    const needRed = kind.startsWith('bad');
    const pass = needRed ? fails.length > 0 : fails.length === 0;
    if (!pass) bad++;
    const detail = fails.length ? fails[0].msg : (res.find((r) => r.warn) ? 'warn' : 'all green');
    console.log(`  ${pass ? '✅' : '❌'} ${f.padEnd(18)} ${needRed ? '应红' : '应绿'} → ${fails.length ? '红 ' + fails.length : '绿'}  ${detail}`);
  }
  console.log(bad
    ? `\n  🚫 --selftest 失败 ${bad} 个`
    : `\n  🎉 --selftest 通过（${ran} 个夹具${skip ? '，跳过 ' + skip + ' 个量测用例' : ''}）`);
  process.exit(bad ? 1 : 0);
}

function docCheck() {
  const root = path.resolve(__dirname, '..');
  const doc = path.join(root, '04-workflows-and-cases', '门禁-V-视觉专项-图例.html');
  const dir = path.join(__dirname, 'fixtures', 'visual');
  const docIds = new Set();
  const fixIds = new Set();
  if (fs.existsSync(doc)) {
    const re = /data-v=["']v-(\d{2})["']/gi;
    let m;
    const html = fs.readFileSync(doc, 'utf8');
    while ((m = re.exec(html))) docIds.add('V-' + m[1]);
  }
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      const m = /^(v-\d{2})-(?:good|bad|alt|badm|bad-order)\.html$/i.exec(f);
      if (m) fixIds.add(m[1].toUpperCase());
    }
  }
  const docs = [...docIds].sort();
  const fixes = [...fixIds].sort();
  const onlyDoc = docs.filter((x) => !fixIds.has(x));
  const onlyFix = fixes.filter((x) => !docIds.has(x));
  console.log('  ── --doc-check 图例册 ↔ 夹具对账（只比编号，不判视觉、不进门禁）');
  console.log(`     图例册 data-v ${docs.length} 条 / 夹具编号 ${fixes.length} 条`);
  if (onlyDoc.length) console.log(`     ❌ 只在图例册：${onlyDoc.join(' / ')}`);
  if (onlyFix.length) console.log(`     ❌ 只在夹具：${onlyFix.join(' / ')}`);
  if (docs.length && !onlyDoc.length && !onlyFix.length) {
    console.log('  🎉 --doc-check 通过：编号集合一致');
    process.exit(0);
  }
  console.log('  🚫 --doc-check 未过：编号集合不一致（或两侧均为空）');
  process.exit(1);
}
async function main() {
  const argv = process.argv.slice(2);
  if (argv.indexOf('--selftest') >= 0) return selftest();
  if (argv.indexOf('--doc-check') >= 0) return docCheck();
  const file = argv.find((a) => !a.startsWith('--'));
  if (!file) {
    console.error('用法：node tools/visual-audit.js <产物.html> --profile=sketch|wireframe [--only=V-08,V-19] [--no-measure] [--measure-fail]');
    console.error('     node tools/visual-audit.js --selftest');
    console.error('     node tools/visual-audit.js --doc-check');
    process.exit(2);
  }
  const profile = argOf(argv, 'profile') || 'wireframe';
  const noMeasure = argv.indexOf('--no-measure') >= 0;
  const forceMeasureFail = argv.indexOf('--measure-fail') >= 0;
  const only = (argOf(argv, 'only') || '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
  if (!fs.existsSync(file)) { console.error('文件不存在：' + file); process.exit(2); }

  // 量测：需要 V-05 / V-24 且未关量测时才拉浏览器；拿不到就降级，不阻断
  let metrics = null;
  const need = !only.length || ['V-01', 'V-02', 'V-04', 'V-05', 'V-06', 'V-21', 'V-24'].some((id) => only.indexOf(id) >= 0);
  if (!noMeasure && need && measure) {
    try {
      metrics = await measure(file);
    } catch (e) {
      console.error('  ⚠️ 量测失败，按未量测降级：' + e.message);
    }
    if (!metrics) console.error('  ⚠️ 9222 未开：V-01 / V-02 / V-05 / V-24 与 V-06 的 Δy 走 ⚠️ 未量测；V-04 / V-21 走静态近似（不阻断）');
  }
  process.exit(report(file, runChecks(fs.readFileSync(file, 'utf8'), only, profile, { noMeasure, metrics }), profile, noMeasure, forceMeasureFail));
}

main().catch((e) => { console.error('执行失败：' + e.message); process.exit(2); });
