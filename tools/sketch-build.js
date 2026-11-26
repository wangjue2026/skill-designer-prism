#!/usr/bin/env node
/**
 * 织雨 · 草图装配器（母版 + 场景×步骤矩阵 → 静态终稿 HTML）
 *
 * 用法:
 *   node tools/sketch-build.js <config.json> <out.html>
 *
 * config 约定（相对 config 所在目录）:
 * {
 *   "shell": "shell.html",            // 含 <!--SKETCH:PLANS--> 与 <!--SKETCH:PH--> 两个占位
 *   "masterDir": "pages",             // 每页一份母版：P1.html / P2.html …
 *   "plans": [
 *     { "id": "A", "label": "方案一", "panel": "pa", "prefix": "",
 *       "scenes": [
 *         { "id": "S1", "name": "…", "steps": [
 *           { "id": "S1-1", "name": "…", "intent": "…", "see": "…",
 *             "pages": [{ "id": "P1", "state": "default", "tab": "影响范围" }],
 *             "close": "末态：…" } ] } ] },
 *     { "id": "B", "label": "方案二", "panel": "pb", "prefix": "B-", "scenes": [ … ] }
 *   ]
 * }
 *
 * 规则:
 * 1) 每处出现都渲染一份完整母版，写 data-plan/scene/step/page/occ/state；
 * 2) data-ph-id / data-dx 追加 @<实例>，保证图上唯一；台账仍按基础编号合并；
 * 3) 生成后必须再跑 bash tools/gate-ex.sh 1.4 <out.html>，不通过视为生成失败；
 * 4) 只做复制、编号、装配，不做视觉生成。
 */
const fs = require('fs');
const path = require('path');

const cfgPath = process.argv[2];
const outPath = process.argv[3];
if (!cfgPath || !outPath) {
  console.error('用法: node tools/sketch-build.js <config.json> <out.html>');
  process.exit(2);
}
const cfgDir = path.dirname(path.resolve(cfgPath));
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const read = (p) => fs.readFileSync(path.isAbsolute(p) ? p : path.join(cfgDir, p), 'utf8');
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const strip = (s) => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const shell = read(cfg.shell);
const masterCache = {};
// 母版查找顺序：<masterDir>/<方案>/<页>.html → <masterDir>/A/<页>.html → <masterDir>/<页>.html
const master = (planId, pid) => {
  const key = planId + '/' + pid;
  if (masterCache[key]) return masterCache[key];
  const baseAbs = path.isAbsolute(cfg.masterDir) ? cfg.masterDir : path.join(cfgDir, cfg.masterDir);
  const tries = [
    path.join(baseAbs, planId, pid + '.html'),
    path.join(baseAbs, 'A', pid + '.html'),
    path.join(baseAbs, pid + '.html')
  ];
  for (const p of tries) {
    if (fs.existsSync(p)) { masterCache[key] = fs.readFileSync(p, 'utf8'); return masterCache[key]; }
  }
  throw new Error('找不到母版：' + pid + '（方案 ' + planId + '），试过 ' + tries.join(' / '));
};
const assetName = {};
cfg.plans.forEach((p) => p.scenes.forEach((s) => s.steps.forEach((st) => st.pages.forEach((pg) => {
  if (pg.name) assetName[pg.id] = pg.name;
}))));

const phRows = {}; // baseId -> { page, type, text, occ: [] }

function collectPh(pageId, html, occ) {
  const tagRe = /<[a-z]+[^>]*\bdata-ph="([^"]+)"[^>]*\bdata-ph-id="([^"]+)"[^>]*>/g;
  let m;
  while ((m = tagRe.exec(html))) {
    const base = m[2].split('@')[0];
    if (phRows[base]) { if (phRows[base].occ.indexOf(occ) < 0) phRows[base].occ.push(occ); continue; }
    const after = html.slice(m.index + m[0].length);
    const text = strip((after.match(/^([^<]*)/) || [, ''])[1]);
    phRows[base] = { page: pageId, type: m[1], text: text, occ: [occ] };
  }
}

function renderPage(plan, scene, step, pg) {
  const stepNo = step.id.split('-')[1];
  const occ = (plan.prefix || '') + scene.id + '-' + stepNo + '-' + pg.id;
  let h = master(plan.id, pg.id);
  const attrs = ' class="page" data-plan="' + plan.id + '" data-scene="' + scene.id +
    '" data-step="' + step.id + '" data-page="' + pg.id + '" data-occ="' + occ +
    '" data-state="' + (pg.state || 'default') + '"';
  h = h.replace(/<div class="page"[^>]*>/, '<div' + attrs + '>');
  h = h.replace(/data-ph-id="([^"]+)"/g, (mm, id) => 'data-ph-id="' + id + '@' + occ + '"');
  h = h.replace(/data-dx="([^"]+)"/g, (mm, id) => 'data-dx="' + id + '@' + occ + '"');
  if (pg.tab) {
    h = h.replace(/class="tabx on"/g, 'class="tabx"');
    h = h.replace(new RegExp('<span class="tabx">(' + escRe(pg.tab) + ')</span>'), '<span class="tabx on">$1</span>');
  }
  // 末态块放在页面块之后：既属于本步骤，又不落进 .frame（框内不许有解释句）
  if (pg.close) h = h + '\n<div class="scene-close">' + esc(pg.close) + '</div>';
  collectPh(pg.id, h, occ);
  return h;
}

function renderPlan(plan) {
  const nav = '<nav class="scene-tabs">' + plan.scenes.map((s, i) =>
    '<button class="scene-tab' + (i === 0 ? ' on' : '') + '" data-scene-tab="' + s.id + '">场景 ' + s.id + ' · ' + esc(s.name) + '</button>'
  ).join('') + '</nav>';
  const body = plan.scenes.map((sc, si) => {
    const steps = sc.steps.map((st, idx) => {
      const pages = st.pages.map((pg, pi) => renderPage(plan, sc, st, Object.assign({}, pg, {
        close: (pi === st.pages.length - 1 && st.close) ? st.close : pg.close
      }))).join('\n');
      const enter = (idx === 0) ? ' data-enter="' + st.pages[0].id + '"' : '';
      const close = st.close ? ' data-close="' + st.pages[st.pages.length - 1].id + '"' : '';
      const names = st.pages.map((pg) => pg.id + ' ' + esc(assetName[pg.id] || '')).join('、');
      return '<div class="step-hd" data-step="' + st.id + '" data-pages="' + st.pages.map((p) => p.id).join(' ') + '"' + enter + close + '>\n' +
        '  <b class="step-name">Step ' + (idx + 1) + '：【' + esc(st.name) + '】</b>\n' +
        '  <span class="step-intent">意图：' + esc(st.intent) + '</span>\n' +
        '  <span class="step-pages">关联界面：' + names + '</span>\n' +
        '</div>\n' +
        '  <div class="step-act" data-act="' + st.id + '">本步骤操作：' + esc(st.act || st.see || '') + '</div>\n' + pages;
    }).join('\n');
    return '<section class="scene' + (si === 0 ? ' on' : '') + '" data-scene="' + sc.id + '" data-name="' + esc(sc.name) + '">\n' + steps + '\n</section>';
  }).join('\n');
  const firstPlan = cfg.plans[0] && cfg.plans[0].id === plan.id;
  return '<section class="panel' + (firstPlan ? ' on' : '') + '" id="' + plan.panel + '" data-plan="' + plan.id + '">\n' + nav + '\n' + body + '\n</section>';
}

const tabs = '<div class="plan-tabs">' + cfg.plans.map((p, i) =>
  '<div class="tab' + (i === 0 ? ' on' : '') + '" data-tab="' + p.panel + '" data-plan="' + p.id + '" role="button" tabindex="0">' + esc(p.label) + '</div>'
).join('') + '</div>';

const plansHtml = tabs + '\n' + cfg.plans.map(renderPlan).join('\n');

let phHtml = '';
Object.keys(phRows).sort().forEach((base) => {
  const r = phRows[base];
  const caps = (r.text.indexOf('：') >= 0 ? r.text.slice(r.text.indexOf('：') + 1) : r.text)
    .split('/').map((x) => x.trim()).filter(Boolean).join(' / ');
  phHtml += '<tr><td>' + base + '</td><td>两套</td><td>' + r.page + '</td><td>' + r.type + '</td>' +
    '<td>页面内能力位</td><td>' + esc(r.text) + '</td><td>' + esc(caps) + '</td>' +
    '<td>按实例展开为可点控件，位置不变</td><td>' + r.occ.join(' / ') + '</td></tr>\n';
});

let out = shell.replace('<!--SKETCH:PLANS-->', plansHtml).replace('<!--SKETCH:PH-->', phHtml);
const outDir = path.dirname(path.resolve(outPath));
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, out, 'utf8');
console.log('装配完成: ' + outPath);
console.log('  方案 ' + cfg.plans.length + ' 套 / 页面实例 ' +
  cfg.plans.reduce((n, p) => n + p.scenes.reduce((m, s) => m + s.steps.reduce((k, st) => k + st.pages.length, 0), 0), 0) +
  ' 个 / 占位台账 ' + Object.keys(phRows).length + ' 行');
