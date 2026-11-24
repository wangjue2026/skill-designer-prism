#!/usr/bin/env node
/**
 * 监控 / 概览页「可视化拆块」审计 —— EX-1.4-39 的机检实现
 *
 * 治的病：旧 EX-1.4-39 只数 `data-viz="` 字符串个数，
 * 于是「再贴一条全宽横条 + 造三个数」就能把 1 块伪装成 2 块，机检绿、页面仍违规。
 *
 * 口径（逐页，1.4 §43 / 准出 EX-1.4-39，自含、草图阶段不读通用设计决策）：
 *   A 页面名或形态命中 监控|概览|总览|大盘|驾驶舱|看板 → 本审计适用（顶部统计条 / KPI 条不计入块数）
 *   B 每块 data-viz 必须声明四件事，缺一即 FAIL：
 *       data-viz-q     这块回答的「3 秒问题」，≥5 字且不得笼统、不得与其它块互含
 *       data-viz-kind  bar|mx|chain|rank|trend|compose|tl|topo|sankey|scatter（块内须有可独立成图的载体类名）
 *       data-viz-w     full|half|main|aux —— full 只允许核心主图视觉 topo/sankey/mx/scatter；
 *                      普通图表 / 局部件 bar|trend|rank|compose|tl|chain 禁单块 full，
 *                      须横向并排 2–3 块或并入同一横向容器（一块拉满 = 凑版面）
 *       data-viz-src   数字真源锚点（页号 / 时间戳 / TR1 段），≥2 字；真假由人检，机检只逼其落字
 *   C 页级必须声明 data-viz-rel：
 *       parallel → 各块皆 half（并列 ≈1:1）
 *       primary / stack → 恰有一块为 main 或 full(核心主图)，其余 aux（主次 ≈2:1 / 主图 + 窄辅图）
 *   D 两块 numeric 集合完全相同（≥2 数）→ FAIL（换皮凑数）
 *   E 单块豁免收紧：MON 页不接受 data-single-viz 单独放行；
 *      仅 data-viz-multi="判断A|判断B" + 页内可见「这一张承载」→ 放行（多判断合一图）
 *   F 等高对齐：同一横向容器内多个件型容器须上下等高对齐，高度不可机检 → 列人检 warning
 *
 * 用法：
 *   node tools/viz-split-audit.js <草图.html>        # 打印 FAIL|/PASS|，退出码 0/1
 *   node tools/viz-split-audit.js --selftest          # 内置正反用例
 *   require('./viz-split-audit').audit(html)          # gate.js 调用，返回 {errors,warnings,pages}
 */
'use strict';

const MON = /监控|概览|总览|大盘|驾驶舱|看板|观察|overview|dashboard/i;
const KINDS = ['bar', 'mx', 'chain', 'rank', 'trend', 'compose', 'tl', 'topo', 'sankey', 'scatter'];
const HERO = ['topo', 'sankey', 'mx', 'scatter'];
const WIDTHS = ['main', 'aux', 'half', 'full'];
const VAGUE = new Set(['整体', '水位', '分布', '评分', '概览', '情况', '数据', '统计', '结果', '好坏', '明细']);
const CARRIER = /\b(bars|mx|chain|tl5|tlrow|rank|trend|compose|grid|chart|svg|topo|sankey|scatter|viz-[a-z0-9-]+)\b/;

const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const norm = (s) => strip(s).replace(/[，。？?！!、；;：:"'`（）()《》\[\]{}<>/]/g, '').toLowerCase();
const attr = (tag, n) => {
  const m = String(tag).match(new RegExp('(?:^|\\s)' + n + '="([^"]*)"'));
  return m ? m[1] : '';
};
const numsOf = (s) => (strip(s).match(/\d[\d,]*(?:\.\d+)?/g) || []).sort().join('|');

function vizBlocksOf(pageText) {
  const marks = [...pageText.matchAll(/data-viz="([^"]*)"/g)];
  return marks.map((m, i) => {
    const tagStart = pageText.lastIndexOf('<', m.index);
    const tagEnd = pageText.indexOf('>', m.index);
    const nextStart = i + 1 < marks.length ? pageText.lastIndexOf('<', marks[i + 1].index) : pageText.length;
    const tag = tagStart >= 0 && tagEnd > tagStart ? pageText.slice(tagStart, tagEnd + 1) : '';
    return {
      key: m[1],
      tag,
      body: pageText.slice(Math.max(0, tagEnd + 1), Math.max(0, nextStart)),
      q: attr(tag, 'data-viz-q'),
      kind: attr(tag, 'data-viz-kind'),
      w: attr(tag, 'data-viz-w'),
      src: attr(tag, 'data-viz-src'),
    };
  });
}

function audit(html) {
  const errors = [];
  const warnings = [];
  const pages = [];
  const text = String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  const blocks = text.split(/<div class="page"/).slice(1);

  blocks.forEach((blk) => {
    if (/class="same"/.test(blk.slice(0, 160))) return;
    const hd = (blk.match(/page-hd[\s\S]{0,400}?<\/div>/) || [''])[0];
    const nm = (hd.match(/<h3>([^<]+)<\/h3>/) || [, ''])[1];
    const fm = (hd.match(/class="form">([^<]+)</) || [, ''])[1];
    const pid = (hd.match(/class="pid">([^<]+)</) || [, ''])[1];
    if (!MON.test(nm + ' ' + fm)) return;

    const label = (pid || '?') + ' ' + nm;
    const vizes = vizBlocksOf(blk);
    const pageInfo = { pid, name: nm, count: vizes.length, questions: [], rel: attr(blk, 'data-viz-rel') };
    pages.push(pageInfo);

    // E 单块豁免：MON 页不接受 data-single-viz 单独放行
    const multi = blk.match(/data-viz-multi="([^"]*)"/);
    const multiOk = !!multi && /这一张承载/.test(strip(blk)) &&
      multi[1].split(/[|｜]/).map((x) => x.trim()).filter(Boolean).length >= 2;
    if (vizes.length < 2) {
      if (multiOk) return;
      if (/data-single-viz="[^"]+"/.test(blk)) {
        errors.push(label + '：监控 / 概览页不接受 data-single-viz 单独放行（单块只允许详情 / 诊断页，且图下写明「本页只做这一个判断」；多判断合一须标 data-viz-multi 并写明「这一张承载」）');
        return;
      }
      if (vizes.length === 0) {
        warnings.push(label + '：监控 / 概览页没有 data-viz 块（人检：纯表格是否够支撑判断链）');
        return;
      }
      errors.push(label + '：只有 ' + vizes.length + ' 块可视化，须 ≥2 块且各答一个不同 3 秒问题');
      return;
    }

    // B 逐块契约
    vizes.forEach((v) => {
      const tag = label + ' ' + (v.key || 'V?');
      const q = norm(v.q);
      pageInfo.questions.push(v.q);
      if (!q || q.length < 5 || VAGUE.has(q)) {
        errors.push(tag + '：data-viz-q 缺失 / 笼统（"' + v.q + '"），须写成一个具体的 3 秒问题（≥5 字）');
      }
      if (!KINDS.includes(v.kind)) {
        errors.push(tag + '：data-viz-kind 非法（"' + v.kind + '"），须为 ' + KINDS.join('/'));
      }
      if (!CARRIER.test(v.tag) && !CARRIER.test(v.body)) {
        errors.push(tag + '：块内无可独立成图的载体（bars / mx / chain / chart / 排行 / 时间线等），只是一段文字或统计条');
      }
      if (!WIDTHS.includes(v.w)) {
        errors.push(tag + '：data-viz-w 缺失 / 非法（"' + v.w + '"），须为 full/main/aux/half');
      } else if (v.w === 'full' && !HERO.includes(v.kind)) {
        errors.push(tag + '：data-viz-w="full" 单块横向全宽，但件型 "' + v.kind + '" 不是核心主图视觉（topo/sankey/mx/scatter）——普通图表 / 局部件须横向并排 2–3 块或并入同一横向容器，不得单块通栏');
      }
      if (!v.src || v.src.length < 2) {
        errors.push(tag + '：data-viz-src 缺失，数字无真源锚点（人检才可判真假，机检逼其落字）');
      }
    });

    // B 问题互含 / 重复
    const qs = vizes.map((v) => norm(v.q)).filter(Boolean);
    for (let i = 0; i < qs.length; i++) {
      for (let j = i + 1; j < qs.length; j++) {
        if (qs[i] === qs[j] || qs[i].includes(qs[j]) || qs[j].includes(qs[i])) {
          errors.push(label + '：' + vizes[i].key + ' 与 ' + vizes[j].key + ' 回答同一个 3 秒问题（"' + vizes[i].q + '" / "' + vizes[j].q + '"），不是真拆');
        }
      }
    }

    // D 数据换皮
    for (let i = 0; i < vizes.length; i++) {
      for (let j = i + 1; j < vizes.length; j++) {
        const a = numsOf(vizes[i].body), b = numsOf(vizes[j].body);
        if (a && a === b && a.split('|').length >= 2) {
          errors.push(label + '：' + vizes[i].key + ' 与 ' + vizes[j].key + ' 数字集合完全相同（' + a + '），两块是换皮凑数');
        }
      }
    }

    // C 关系声明与宽度一致
    const rel = attr(blk, 'data-viz-rel');
    if (!['parallel', 'primary', 'stack'].includes(rel)) {
      errors.push(label + '：缺 data-viz-rel（parallel / primary / stack），两块关系未声明，形不成判断链');
    } else {
      const ws = vizes.map((v) => v.w);
      const mains = ws.filter((w) => w === 'main' || w === 'full').length;
      if (rel === 'parallel' && ws.some((w) => w !== 'half')) {
        errors.push(label + '：声明 parallel（并列 ≈1:1）但宽度不全是 half（实际 ' + ws.join('/') + '）');
      }
      if ((rel === 'primary' || rel === 'stack') && mains !== 1) {
        errors.push(label + '：声明 ' + rel + '（主次）但 main / full 主块不是恰好 1 块（实际 ' + ws.join('/') + '）');
      }
      if (rel === 'stack' && !ws.includes('aux')) {
        errors.push(label + '：声明 stack（主图 + 窄辅图）但缺 aux 块（实际 ' + ws.join('/') + '）');
      }
    }

    warnings.push(label + '：人检 —— 逐块核对 data-viz-src 指向的真源；两块是否真能在 3 秒内答出不同问题');
    warnings.push(label + '：人检 —— 同一横向容器内多个件型容器须上下等高对齐（不得一块高一块矮、基线参差）');
  });

  return { errors, warnings: [...new Set(warnings)], pages };
}

function selftest() {
  const page = (pid, name, form, inner, extra) =>
    '<div class="page"><div class="page-hd"><span class="pid">' + pid + '</span><h3>' + name +
    '</h3><span class="form">' + form + '</span></div><div class="frame" ' + (extra || '') + '>' + inner + '</div></div>';
  const viz = (key, q, kind, w, src, body) =>
    '<div class="viz" data-viz="' + key + '" data-viz-q="' + q + '" data-viz-kind="' + kind +
    '" data-viz-w="' + w + '" data-viz-src="' + src + '"><div class="bars"><div class="brow">x</div><div class="brow">y</div></div>' + (body || '') + '</div>';
  const bare = (key) => '<div class="viz" data-viz="' + key + '"><div class="bars"><div class="brow">x</div></div></div>';

  const cases = [
    ['假拆：两块全宽横条、无声明', page('P1', '体验概览', '整页 · 概览 · 单视图', bare('V1') + bare('V2')), true],
    ['真拆·并列：两块 half、问题不同', page('P1', '体验概览', '整页 · 概览 · 单视图',
      viz('V1', '差评集中在哪两个节点', 'bar', 'half', 'P1 快照09:40') + viz('V2', '整体水位优多还是差多', 'compose', 'half', 'P1 快照09:40'),
      'data-viz-rel="parallel"'), false],
    ['真拆·主次：main + aux', page('P2', '体验监控', '整页 · 监控 · 单视图',
      viz('V1', '近六小时异常集中在哪个时段', 'bar', 'main', 'P2 快照09:40') + viz('V2', '哪几个对象最值得先动', 'rank', 'aux', 'P2 快照09:40'),
      'data-viz-rel="primary"'), false],
    ['两块回答同一问题', page('P1', '体验概览', '整页 · 概览 · 单视图',
      viz('V1', '今天整体体验好不好', 'bar', 'half', 'P1快照') + viz('V2', '今天整体体验好不好呀', 'compose', 'half', 'P1快照'),
      'data-viz-rel="parallel"'), true],
    ['单块 + data-single-viz 放行（应拒）', page('P1', '体验概览', '整页 · 概览 · 单视图', bare('V1'), 'data-single-viz="只做一个判断"'), true],
    ['多判断合一图放行', page('P1', '体验概览', '整页 · 概览 · 单视图',
      '<div class="viz" data-viz="V1"><div class="mx">x</div></div><p>这一张承载：整体好坏与集中点</p>',
      'data-viz-multi="整体好坏|集中在哪两处"'), false],
    ['两块数字集合完全相同', page('P1', '体验概览', '整页 · 概览 · 单视图',
      viz('V1', '差评集中在哪两个节点', 'bar', 'half', 'P1快照', '<span>39</span><span>17</span>') +
      viz('V2', '整体水位优多还是差多', 'compose', 'half', 'P1快照', '<span>17</span><span>39</span>'),
      'data-viz-rel="parallel"'), true],
    ['核心主图全宽放行：mx full + bar aux', page('P1', '体验概览', '整页 · 概览 · 单视图',
      viz('V1', '哪一片应用乘节点最差', 'mx', 'full', 'P1 快照09:40') + viz('V2', '差评集中在哪个节点', 'bar', 'aux', 'P1 快照09:40'),
      'data-viz-rel="primary"'), false],
    ['普通件单块全宽应拒：bar full', page('P1', '体验概览', '整页 · 概览 · 单视图',
      viz('V1', '差评集中在哪两个节点', 'bar', 'full', 'P1 快照09:40') + viz('V2', '整体水位优多还是差多', 'compose', 'aux', 'P1 快照09:40'),
      'data-viz-rel="primary"'), true],
  ];

  let fail = 0;
  cases.forEach(([name, html, wantError]) => {
    const r = audit(html);
    const got = r.errors.length > 0;
    const pass = got === wantError;
    if (!pass) fail++;
    console.log((pass ? 'PASS | ' : 'FAIL | ') + name + ' → ' + (got ? 'FAIL(' + r.errors.length + ')' : 'PASS') +
      (pass ? '' : ' 期望 ' + (wantError ? 'FAIL' : 'PASS')));
    if (!pass && r.errors.length) r.errors.forEach((e) => console.log('        - ' + e));
  });
  console.log('\n' + (fail ? '❌ selftest 失败 ' + fail + ' 例' : '✅ selftest 全部通过（' + cases.length + ' 例）'));
  process.exit(fail ? 1 : 0);
}

if (require.main === module) {
  if (process.argv[2] === '--selftest') selftest();
  else {
    const f = process.argv[2];
    if (!f) { console.log('用法: node tools/viz-split-audit.js <草图.html> | --selftest'); process.exit(2); }
    const r = audit(require('fs').readFileSync(f, 'utf-8'));
    r.errors.forEach((e) => console.log('FAIL | ' + e));
    if (!r.errors.length) console.log('PASS | 监控/概览页可视化拆块审计通过（' + r.pages.length + ' 页）');
    r.warnings.forEach((w) => console.log('WARN | ' + w));
    process.exit(r.errors.length ? 1 : 0);
  }
}

module.exports = { audit };
