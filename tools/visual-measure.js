#!/usr/bin/env node
"use strict";

/**
 * visual-measure.js —— V 组量测通道（只读取 bbox，不改页面状态）
 *
 * 前置：Chrome 以 --remote-debugging-port=9222 启动（可用环境变量 CDP_PORT 覆盖）。
 *       未开端口时 measure() 返回 null，调用方按"⚠️ 未量测"降级，不抛错、不阻断。
 *
 * ★ 会话复用（2026-11-26）：
 *   所有 measure() 调用共用**同一个带 #prism-visual-audit-session 锚点的标签页**。
 *   每次只 Page.navigate 换 URL，**不新建、不关闭标签页**——避免批量过门禁时浏览器闪屏。
 *   整批跑完后再显式关闭：node tools/visual-measure.js --close
 *   gate-ex.sh / gate-sp.sh 不自动关，多次门禁调用之间继续复用同一标签。
 *
 * 用法：measure | --close
 */

const fs = require("fs");
const path = require("path");

const PORT = process.env.CDP_PORT || "9222";
const BASE = `http://127.0.0.1:${PORT}`;
const MARK = "prism-visual-audit-session";
const SESSION_PAGE = path.join(__dirname, "fixtures", "visual", ".audit-session.html");

const BLOCK_SEL = ".blk, .sec, .panel, .card, [data-measure-block]";
const CARD_SEL = ".card, .wf-card, .kpi-card";

const MEASURE_JS = (blockSel, cardSel) => `(() => {
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const visible = (el) => { const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden') return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const inHandoff = (el) => !!(el.closest && el.closest('.handoff, details.handoff'));
  const isState = (el) => !!(el.closest && el.closest('.empty, .state, .blank, .nodata, [data-state], [data-empty]'));
  const out = { blocks: [], cards: [], vizs: [], tables: [], viewport: { w: innerWidth, h: innerHeight } };
  const contentEl = document.querySelector('main, [data-content], .content') || document.body;
  out.content = { w: Math.max(1, contentEl.clientWidth || document.body.clientWidth || innerWidth), tag: contentEl.tagName.toLowerCase() };

  const vpW = window.innerWidth;
  const M = vpW >= 1720 ? 48 : 24;
  out.page = { viewport: vpW, M, roots: [], sections: [] };
  const rootSel = '[data-page-root], main, [data-content], .content';
  const rootEls = Array.from(document.querySelectorAll(rootSel)).filter((el) => {
    if (!visible(el)) return false;
    if (el.closest && el.closest('aside, [data-sider], [data-banner]')) return false;
    return getComputedStyle(el).position !== 'fixed';
  });
  const outerRoots = rootEls.filter((el) => !rootEls.some((o) => o !== el && o.contains(el)));
  outerRoots.forEach((el) => {
    const r = rect(el);
    const s = getComputedStyle(el);
    out.page.roots.push({
      label: String(el.getAttribute('data-page-root') || el.tagName.toLowerCase()).slice(0, 40),
      x: r.x, w: r.w,
      left: r.x + (parseFloat(s.paddingLeft) || 0),
      maxWidth: s.maxWidth === 'none' ? '' : s.maxWidth
    });
  });
  const sectionSel = '[data-page-section], .page-head, .filter-bar, .filters, [data-hero], [data-viz], table, .pagination, .pager';
  const secEls = Array.from(document.querySelectorAll(sectionSel)).filter(visible);
  const outerSecs = secEls.filter((el) => !secEls.some((o) => o !== el && o.contains(el)));
  outerSecs.forEach((el) => {
    const r = rect(el);
    out.page.sections.push({
      label: String(el.getAttribute('data-page-section') || el.className || el.tagName.toLowerCase()).slice(0, 40),
      left: r.x, w: r.w
    });
  });

  out.grid = { viewport: vpW, M, rows: [] };
  document.querySelectorAll('[data-grid-row]').forEach((row) => {
    if (!visible(row)) return;
    const items = Array.from(row.children).filter(visible);
    if (items.length < 2) return;
    const rs = getComputedStyle(row);
    const gaps = items.slice(1).map((it, i) =>
      Math.round((it.getBoundingClientRect().x - items[i].getBoundingClientRect().right) * 10) / 10);
    out.grid.rows.push({
      label: String(row.getAttribute('data-grid-row') || row.className || 'Row').slice(0, 40),
      gap: parseFloat(rs.columnGap || rs.gap) || 0,
      gaps,
      items: items.map((it) => {
        const r = rect(it);
        return {
          label: String(it.textContent || '').trim().slice(0, 16),
          left: r.x, right: r.x + r.w,
          span: parseInt(it.getAttribute('data-span') || '', 10) || null,
          custom: it.hasAttribute('data-custom-span')
        };
      })
    });
  });

  document.querySelectorAll('[data-viz]').forEach((el) => {
    if (!visible(el)) return;
    const r = rect(el);
    const declaredPoints = parseInt(el.getAttribute('data-points') || '', 10);
    const units = el.querySelectorAll('[data-point], .point, .tick, .bar, .cell, .node').length;
    out.vizs.push({
      label: String(el.getAttribute('data-viz') || el.className || '').slice(0, 40),
      kind: el.getAttribute('data-viz-kind') || '',
      declared: el.getAttribute('data-viz-w') || '',
      w: r.w,
      ratio: r.w / out.content.w,
      points: Number.isFinite(declaredPoints) ? declaredPoints : units,
      carrier: !!el.querySelector('svg, canvas, [data-carrier], .bar, .line, .area, .pie, .chart, .axis, .grid, .stack, .scatter, .topo, .sankey, .rank, .tl, .mx'),
      kpi: !!(el.closest && el.closest('[data-kpi-strip]'))
    });
  });

  document.querySelectorAll('table').forEach((tb) => {
    if (!visible(tb)) return;
    const wrap = tb.parentElement;
    const sw = wrap ? wrap.scrollWidth : tb.scrollWidth;
    const cw = wrap ? wrap.clientWidth : tb.clientWidth;
    const ths = Array.from(tb.querySelectorAll('thead th'));
    const rows = Array.from(tb.querySelectorAll('tbody tr')).filter(visible);
    const bg = (e) => e ? getComputedStyle(e).backgroundColor : '';
    const fw = (e) => e ? getComputedStyle(e).fontWeight : '';
    const firstTd = tb.querySelector('tbody td');
    const types = rows.map((r) => Array.from(r.children).map((td) => {
      const t = (td.textContent || '').trim();
      return /^\d{4}-\d/.test(t) ? 'd' : /^[¥$]?\d/.test(t) ? 'n' : 't';
    }));
    const lastTh = ths[ths.length - 1];
    out.tables.push({
      label: String(tb.className || '').slice(0, 40),
      headerDistinct: !!(bg(ths[0]) !== bg(firstTd) || fw(ths[0]) !== fw(firstTd)),
      heights: rows.map((r) => Math.round(r.getBoundingClientRect().height * 10) / 10),
      types,
      zebra: rows.length > 1 && bg(rows[1]) !== bg(rows[0]) && bg(rows[1]) !== 'rgba(0, 0, 0, 0)',
      lines: Array.from(tb.querySelectorAll('tbody td')).some((td) => parseFloat(getComputedStyle(td).borderBottomWidth) > 0),
      sticky: !!lastTh && getComputedStyle(lastTh).position === 'sticky',
      overflow: sw > cw
    });
  });

  out.filterBar = [];
  document.querySelectorAll('[data-region="filter-bar"], .filter-bar, .wf-filter-bar').forEach((box) => {
    if (!visible(box)) return;
    const ctrls = Array.from(box.querySelectorAll('input, select, button, textarea, [data-act]'))
      .filter((el) => visible(el) && !(el.closest && el.closest('.search-wrap, [data-search], .comp-basic-search, .comp-pro-search')));
    out.filterBar.push({
      label: String(box.className || 'filter-bar').slice(0, 40),
      ctrls: ctrls.map((el) => {
        const r = rect(el);
        return {
          tag: el.tagName.toLowerCase(),
          type: String(el.getAttribute('type') || ''),
          text: String(el.textContent || '').trim().slice(0, 12),
          act: String(el.getAttribute('data-act') || ''),
          x: r.x, y: r.y, w: r.w, h: r.h
        };
      })
    });
  });

  document.querySelectorAll(${JSON.stringify(blockSel)}).forEach((el) => {
    if (inHandoff(el) || isState(el) || !visible(el)) return;
    const s = getComputedStyle(el);
    const r = rect(el);
    const kids = Array.from(el.children).filter((k) => {
      if (!visible(k)) return false;
      const ks = getComputedStyle(k);
      return ks.position !== 'fixed' && ks.position !== 'absolute';
    }).map(rect);
    if (!kids.length) return;
    const minX = Math.min.apply(null, kids.map((k) => k.x));
    const maxX = Math.max.apply(null, kids.map((k) => k.x + k.w));
    const minY = Math.min.apply(null, kids.map((k) => k.y));
    const maxY = Math.max.apply(null, kids.map((k) => k.y + k.h));
    out.blocks.push({
      cls: el.className && String(el.className).slice(0, 60),
      w: r.w, h: r.h,
      padL: parseFloat(s.paddingLeft) || 0, padR: parseFloat(s.paddingRight) || 0,
      padT: parseFloat(s.paddingTop) || 0, padB: parseFloat(s.paddingBottom) || 0,
      cw: (maxX - minX), ch: (maxY - minY),
      gapL: (minX - (r.x + (parseFloat(s.paddingLeft) || 0))),
      gapR: ((r.x + r.w - (parseFloat(s.paddingRight) || 0)) - maxX),
      nKids: el.children.length,
      text: (el.textContent || '').trim().slice(0, 24)
    });
  });

  document.querySelectorAll(${JSON.stringify(cardSel)}).forEach((el) => {
    if (inHandoff(el) || !visible(el)) return;
    const r = rect(el);
    const ops = Array.from(el.querySelectorAll('button, .btn, [data-act]')).filter(visible).map((b) => {
      const br = rect(b);
      const s = getComputedStyle(b);
      return { x: br.x, right: br.x + br.w, w: br.w, y: br.y, primary: /primary/.test(b.className || '') || /主/.test(b.textContent || '') || (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && /1c6eff|0d6efd|1864ff|cf171d/i.test(s.backgroundColor)) };
    });
    out.cards.push({ cls: el.className && String(el.className).slice(0, 60), x: r.x, w: r.w, h: r.h, ops: ops, label: (el.textContent || '').trim().slice(0, 24) });
  });
  return JSON.stringify(out);
})()`;

async function portAlive() {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 800);
    const res = await fetch(`${BASE}/json/version`, { signal: ctl.signal });
    clearTimeout(t);
    return res.ok;
  } catch { return false; }
}

async function listTargets() {
  const res = await fetch(`${BASE}/json/list`);
  if (!res.ok) throw new Error(`CDP /json/list HTTP ${res.status}`);
  return await res.json();
}

// 锚点在 URL 的 # 后面；即使被 Chrome 规范化，也可用标题兜底识别
function tagged(t) {
  const u = t.url || '';
  return t.type === 'page' && (u.includes('#' + MARK) || u.includes(encodeURIComponent(MARK)) || (t.title || '').includes(MARK));
}

async function findSession() {
  if (!(await portAlive())) return null;
  const all = await listTargets();
  const hit = all.filter(tagged).filter(t => t.webSocketDebuggerUrl);
  return hit.length ? hit[0] : null;
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.addEventListener("open", () => resolve(ws));
    ws.addEventListener("error", () => reject(new Error("CDP WebSocket 连接失败")));
  });
}

function client(ws) {
  let seq = 0;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });
  return (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fileUrl = (p) => "file://" + path.resolve(p) + "#" + MARK;

async function openSession() {
  for (const method of ["PUT", "GET"]) {
    try {
      const res = await fetch(`${BASE}/json/new?${encodeURIComponent(fileUrl(SESSION_PAGE))}`, { method });
      if (res.ok) {
        const t = await res.json();
        // 部分 Chrome 版本会剥掉 /json/new 的 hash，attach 后显式再导航一次打标
        const ws = await connect(t.webSocketDebuggerUrl);
        const send = client(ws);
        await send("Page.enable");
        await send("Page.navigate", { url: fileUrl(SESSION_PAGE) });
        ws.close();
        return t;
      }
    } catch { /* 换下一种 */ }
  }
  throw new Error("无法新建调试页（/json/new）");
}

/** 关闭全部量测会话标签页；跑完整批门禁后调用一次 */
async function closeSession() {
  if (!(await portAlive())) return 0;
  const all = await listTargets();
  const hit = all.filter(tagged);
  for (const t of hit) {
    try { await fetch(`${BASE}/json/close/${t.id}`); } catch { /* 忽略 */ }
  }
  return hit.length;
}

/**
 * 量测一份产物，返回 { content, page, grid, blocks, cards, vizs, tables, viewport }；端口未开返回 null。 支持 <html data-viewport-width="1760"> 覆盖断点视口。
 * 复用同一个标签页，只 navigate，不新建 / 不关闭。
 */
async function measure(file, opts = {}) {
  if (!(await portAlive())) return null;
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) throw new Error(`文件不存在：${abs}`);
  const html = fs.readFileSync(abs, 'utf8');
  const vp = /data-viewport-width=["'](\d+)["']/i.exec(html);
  const width = vp ? Math.max(320, Math.min(2560, parseInt(vp[1], 10))) : 1440;
  const target = (await findSession()) || (await openSession());
  const ws = await connect(target.webSocketDebuggerUrl);
  const send = client(ws);
  try {
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url: fileUrl(abs) });
    const deadline = Date.now() + (opts.timeout || 5000);
    for (;;) {
      const { result } = await send("Runtime.evaluate", { expression: "document.readyState", returnByValue: true });
      if (result && result.value === "complete") break;
      if (Date.now() > deadline) break;
      await sleep(60);
    }
    await sleep(80);
    const { result } = await send("Runtime.evaluate", {
      expression: MEASURE_JS(BLOCK_SEL, CARD_SEL), returnByValue: true, awaitPromise: false,
    });
    if (!result || typeof result.value !== "string") return null;
    return JSON.parse(result.value);
  } finally {
    ws.close(); // 只关 WebSocket 连接，**保留标签页**
  }
}

module.exports = { measure, portAlive, findSession, closeSession, BLOCK_SEL, CARD_SEL };

if (require.main === module) {
  const a = process.argv[2];
  if (a === "--close") {
    closeSession().then((n) => console.log(`已关闭 ${n} 个量测会话标签页`))
      .catch((e) => { console.error("关闭失败：" + e.message); process.exit(1); });
  } else if (a) {
    measure(a).then((m) => {
      if (!m) { console.error("⚠️ 9222 未开，量测不可用"); process.exit(3); }
      console.log(JSON.stringify(m, null, 2));
    }).catch((e) => { console.error("量测失败：" + e.message); process.exit(1); });
  } else {
    console.error("用法：node tools/visual-measure.js <产物.html> | --close");
    process.exit(2);
  }
}
