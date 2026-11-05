#!/usr/bin/env node
/**
 * 可视化件件型对账（SP-W-12）
 *
 * 治的病：声明里写 VIZ-01-A2，线框却画成四张白底小卡——键有了、档没写、形态完全不同。
 * 过去所有可视化相关门禁只验"文字存在性"（有没有 VIZ- 前缀、有没有引用件型线框.md），
 * 形态这一层零校验，所以"资产很厚、落地变白卡"永远抓不住。
 *
 * 口径（逐页，按 <h5 id="page-"> 分段）：
 *   1 键在册       data-viz / 声明里的键必须在 件型落地契约.json
 *   2 件数对账     页内 data-viz 实例数 = 该页 viz-decl 块数（一件一声明）
 *   3 未打标探测   线框出现 probe 类名（wf-kpi/wf-topo/...）却没有 data-viz 根元素
 *   4 形态一致     strict 键的 required 类名必须全在；单元数 ≥ min_items
 *   5 值到位       声明「风格规范」命中契约 style_must 每组一个
 *
 * 用法：
 *   node tools/viz-audit.js <design-spec.html>     # 打印 FAIL|/PASS| 一行，退出码 0/1
 *   require('./viz-audit').audit(html)             # 返回 { errors, warnings, pages }
 */
'use strict';

const fs = require('fs');
const path = require('path');

const CONTRACT = path.join(__dirname, '..', '03-design-assets', 'visual-styles', '内容件', '件型落地契约.json');

function loadContract() {
  try {
    return JSON.parse(fs.readFileSync(CONTRACT, 'utf-8'));
  } catch (e) {
    return null;
  }
}

function stripTags(s) {
  return String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

function keysOf(text) {
  // 贪婪取完整形态后缀：VIZ-01-A2 不能退化成 VIZ-01
  return (String(text || '').match(/VIZ-\d{2}-[A-Z0-9]+|VIZ-\d{2}/g) || []);
}

function firstVizKey(text) {
  const m = String(text || '').match(/VIZ-\d{2}-[A-Z0-9]+|VIZ-\d{2}/);
  return m ? m[0] : null;
}

function audit(html, opts) {
  const contract = loadContract();
  const errors = [];
  const warnings = [];
  const pages = [];

  if (!contract || !Array.isArray(contract.keys) || !contract.keys.length) {
    return { errors: ['读不到件型落地契约.json（03-design-assets/visual-styles/内容件/件型落地契约.json），无法做件型对账'], warnings, pages };
  }
  const byKey = {};
  contract.keys.forEach((k) => { byKey[k.key] = k; });
  const probes = [...new Set(contract.keys.map((k) => k.probe).filter(Boolean))];

  // 去掉样式与脚本，避免 CSS 里的类名/字符串造成误判
  const clean = String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const hasAnyVizSignal = /data-viz=|class="viz-decl"|viz-decl/.test(clean);
  if (!hasAnyVizSignal) {
    return { errors, warnings, pages, skipped: true };
  }

  const segs = clean.split(/<h5[^>]*id="page-/).slice(1);
  if (!segs.length) {
    if (/data-viz=/.test(clean)) errors.push('可视化件不在任何 <h5 id="page-xx"> 页面小节内：说明书的件必须挂在具体页面下，否则无法对账');
    return { errors, warnings, pages };
  }

  segs.forEach((seg) => {
    const body = seg.split(/<h5[^>]*id="page-/)[0];
    const idM = body.match(/(Page-\d+)/);
    const pid = idM ? idM[1] : '某页';

    // 线框区：wf-container 起，到 wf-annotation 止
    const i = body.indexOf('<div class="wf-container"');
    const j = body.indexOf('<div class="wf-annotation"', i);
    const wf = i >= 0 ? body.slice(i, j > i ? j : undefined) : '';
    const wfText = stripTags(wf);

    // 页内声明
    const decls = [];
    const declRe = /<div class="viz-decl"[^>]*>([\s\S]*?)<\/div>/g;
    let dm;
    while ((dm = declRe.exec(body)) !== null) {
      const raw = dm[1];
      // 优先取「件型键」那一格，取不到再退化为块内第一个 VIZ 键
      let key = null;
      const cell = raw.match(/<b>\s*件型键\s*<\/b>[\s\S]{0,120}?<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/);
      if (cell) key = firstVizKey(stripTags(cell[1]));
      if (!key) key = firstVizKey(stripTags(raw));
      decls.push({ key, text: stripTags(raw) });
    }

    // 线框里的件实例：data-viz="KEY"
    const vizes = [];
    const dvRe = /<([a-zA-Z][\w-]*)([^>]*?)\sdata-viz="([^"]+)"([^>]*)>/g;
    let vm;
    while ((vm = dvRe.exec(wf)) !== null) {
      const cls = ((vm[2] || '') + ' ' + (vm[4] || '')).match(/class="([^"]*)"/);
      vizes.push({ key: vm[3].trim(), cls: cls ? cls[1] : '' });
    }

    if (!decls.length && !vizes.length && !probes.some((p) => new RegExp('\\b' + p + '\\b').test(wf))) return;

    const rec = { page: pid, keys: vizes.map((v) => v.key), decls: decls.map((d) => d.key) };
    pages.push(rec);

    // 1 键在册
    vizes.forEach((v) => {
      if (!byKey[v.key]) errors.push(pid + ' 线框里的件型键 `' + v.key + '` 不在册（件型落地契约.json 查无此键，属杜撰）');
    });
    decls.forEach((d) => {
      if (!d.key) errors.push(pid + ' 有一份《可视化件声明》没写件型键（须 VIZ-xx-<形态>）');
      else if (!byKey[d.key]) errors.push(pid + ' 声明的件型键 `' + d.key + '` 不在册（件型落地契约.json 查无此键，属杜撰）');
    });

    // 3 未打标探测：线框出现 probe 类名，但没有任何 data-viz 根元素带该 probe
    probes.forEach((p) => {
      const used = new RegExp('\\b' + p + '(?=[\\s"])').test(wf) || new RegExp('class="[^"]*\\b' + p + '\\b').test(wf);
      if (!used) return;
      const covered = vizes.some((v) => new RegExp('\\b' + p + '\\b').test(v.cls));
      if (!covered) errors.push(pid + ' 线框里有 `' + p + '` 件，却没有对应的 data-viz 根元素（画了没登记，无法对账件型）');
    });

    // 2 件数对账
    if (vizes.length !== decls.length) {
      errors.push(pid + ' 件数对不上：线框里 ' + vizes.length + ' 个可视化件 / 声明 ' + decls.length + ' 份（一件一声明，线框有几个件就要几份声明）');
    }

    // 双向对应
    vizes.forEach((v) => {
      if (byKey[v.key] && !decls.some((d) => d.key === v.key)) {
        errors.push(pid + ' 线框画了 `' + v.key + '` 但没有同键的《可视化件声明》');
      }
    });
    decls.forEach((d) => {
      if (d.key && byKey[d.key] && !vizes.some((v) => v.key === d.key)) {
        errors.push(pid + ' 声明了 `' + d.key + '` 但线框里没有这个键的 data-viz 根元素（声明与落地不是同一件）');
      }
    });

    // 4 形态一致（strict 键）
    decls.forEach((d) => {
      const c = d.key && byKey[d.key];
      if (!c) return;
      const need = c.required || [c.root_class];
      const missing = need.filter((cls) => !new RegExp('class="[^"]*\\b' + cls + '\\b').test(wf));
      if (missing.length) {
        errors.push(pid + ' 声明 `' + c.key + '` 与线框形态不一致：缺 ' + missing.map((x) => '`' + x + '`').join('、')
          + '（' + c.name + '·' + c.form + '；几何见 ' + (c.geometry || '件型线框.md') + '，有片段照 visual-styles/内容件/件型片段/ 拼）');
      }
      const unit = need[1];
      if (unit && c.min_items) {
        const n = (wf.match(new RegExp('\\b' + unit + '\\b', 'g')) || []).length;
        if (n < c.min_items) errors.push(pid + ' `' + c.key + '` 只画了 ' + n + ' 个 ' + unit + '，少于 ' + c.min_items + ' 个（该形态至少 ' + c.min_items + ' 个单元，少了就是退化成简图）');
      }
      // 5b 取值可追溯：声明必须给出取值出处（件型线框.md 节号）或显式写明推定
      if (!/件型线框\.md|§\s*\d|无实测值|按通用值推定/.test(d.text)) {
        errors.push(pid + ' `' + c.key + '` 声明没写取值出处（须引用 件型线框.md 的节号，或写明"无实测值，按通用值推定"）');
      }
      // 5 值到位
      if (c.style_must && c.style_must.length) {
        const bad = c.style_must.filter((group) => !group.some((pat) => new RegExp(pat, 'i').test(d.text)));
        if (bad.length) {
          errors.push(pid + ' `' + c.key + '` 的「风格规范」缺件型必写值：' + bad.map((g) => g.join(' 或 ')).join('；')
            + '（样式取 件型样式卡.md 同件 + token/README.md §六；不许只写"档 B"）');
        }
      }
    });
  });

  return { errors, warnings, pages, skipped: false };
}

if (require.main === module) {
  const spec = process.argv[2];
  if (!spec || !fs.existsSync(spec)) {
    console.log('用法: node tools/viz-audit.js <design-spec.html>');
    process.exit(2);
  }
  const res = audit(fs.readFileSync(spec, 'utf-8'));
  if (res.skipped) {
    console.log('PASS|说明书未出现可视化件（无 data-viz / viz-decl），本项自适应跳过');
    process.exit(0);
  }
  if (res.errors.length) {
    console.log('FAIL|' + [...new Set(res.errors)].join('；'));
    process.exit(1);
  }
  const n = res.pages.reduce((a, p) => a + p.keys.length, 0);
  console.log('PASS|件型对账通过：' + res.pages.length + ' 页 / ' + n + ' 个可视化件，键均在册、件数一致、形态与声明匹配');
  process.exit(0);
}

module.exports = { audit };
