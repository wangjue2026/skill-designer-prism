#!/usr/bin/env node
/**
 * 织雨 · 零依赖精密 SVG 几何绘图微引擎 (Craft-Layer Visualization Engine)
 *
 * 设计理念（工艺层与形态层解耦）：
 *   - 只负责「模型肉眼难以手算精确的纯几何与布局计算」（防重叠坐标、三次贝塞尔连线、
 *     桑基流带闭合路径、时间轴比例映射、色阶归一化），绝不锁死业务视觉风格与创新形态；
 *   - 支持在 Node 端预渲染为纯静态 SVG 字符串（嵌入单文件原型 HTML，无 JS 亦可见），
 *     也支持作为纯几何工具在浏览器端动态交互渲染。
 *
 * 导出函数：
 *   - renderLayeredTopoSVG(spec)  : 分层全局拓扑 / 攻击路径 / 机理图 SVG（自动算坐标 + 贝塞尔边）
 *   - renderSankeySVG(spec)       : 多列桑基流转图 SVG（自动按比例算柱高 + 闭合贝塞尔流带）
 *   - renderWaterfallHTML(spec)   : 精确比例时间轴 Trace 瀑布图 HTML
 */
'use strict';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * 分层拓扑 / 机理路径 SVG 渲染器
 * spec = {
 *   width?: 900, height?: 300,
 *   layers: [{ title: '入口层', nodes: [{ id, label, sub?, accent?, badge?, risk?, go? }] }],
 *   edges: [{ from, to, label?, risk?, dashed?, weight? }]
 * }
 */
function renderLayeredTopoSVG(spec) {
  const W = spec.width || 900;
  const H = spec.height || 300;
  const layers = spec.layers || [];
  const edges = spec.edges || [];
  const padX = 28, padTop = 36, padBot = 20;
  const colW = (W - padX * 2) / Math.max(layers.length, 1);
  const nodeW = Math.min(168, colW - 36);
  const nodeH = 54;
  const pos = {};
  const parts = [];

  // defs: 阴影滤镜 + 箭头
  parts.push(`<defs>
    <filter id="viz-sh" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.07"/>
    </filter>
    <marker id="arr-n" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#94A3B8"/>
    </marker>
    <marker id="arr-r" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#CF171D"/>
    </marker>
  </defs>`);

  // 泳道背景与节点坐标计算
  layers.forEach((layer, li) => {
    const cx = padX + colW * li + colW / 2;
    const laneX = padX + colW * li + 6;
    parts.push(`<rect x="${laneX.toFixed(1)}" y="8" width="${(colW - 12).toFixed(1)}" height="${H - 16}" rx="8" fill="#F8FAFC" stroke="#EEF1F6" stroke-dasharray="4 4"/>`);
    parts.push(`<text x="${cx.toFixed(1)}" y="26" text-anchor="middle" font-size="12" font-weight="600" fill="#64748B">${esc(layer.title || '')}</text>`);
    const nodes = layer.nodes || [];
    const availH = H - padTop - padBot;
    const stepY = availH / Math.max(nodes.length, 1);
    nodes.forEach((nd, ni) => {
      const x = cx - nodeW / 2;
      const y = padTop + stepY * ni + (stepY - nodeH) / 2;
      pos[nd.id] = { x, y, w: nodeW, h: nodeH, cx, cy: y + nodeH / 2, rx: x + nodeW, lx: x };
    });
  });

  // 贝塞尔连线（先画正常边，再画风险高亮边确保置顶）
  const orderedEdges = edges.slice().sort((a, b) => (a.risk ? 1 : 0) - (b.risk ? 1 : 0));
  orderedEdges.forEach((e) => {
    const a = pos[e.from], b = pos[e.to];
    if (!a || !b) return;
    const x1 = a.rx, y1 = a.cy, x2 = b.lx, y2 = b.cy;
    const dx = Math.max(36, (x2 - x1) * 0.45);
    const stroke = e.risk ? '#CF171D' : '#94A3B8';
    const sw = e.weight || (e.risk ? 2.4 : 1.5);
    const dash = e.dashed ? ' stroke-dasharray="5 4"' : '';
    const marker = e.risk ? 'url(#arr-r)' : 'url(#arr-n)';
    parts.push(`<path d="M ${x1.toFixed(1)},${y1.toFixed(1)} C ${(x1 + dx).toFixed(1)},${y1.toFixed(1)} ${(x2 - dx).toFixed(1)},${y2.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}" fill="none" stroke="${stroke}" stroke-width="${sw}"${dash} marker-end="${marker}"/>`);
    if (e.label) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 6;
      const lbW = Math.max(48, e.label.length * 9 + 16);
      parts.push(`<rect x="${(mx - lbW / 2).toFixed(1)}" y="${(my - 11).toFixed(1)}" width="${lbW}" height="18" rx="9" fill="${e.risk ? '#FFF1F0' : '#FFFFFF'}" stroke="${e.risk ? '#FCA5A5' : '#E2E8F0'}"/>`);
      parts.push(`<text x="${mx.toFixed(1)}" y="${(my + 2).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="${e.risk ? '600' : '400'}" fill="${e.risk ? '#991B1B' : '#475569'}">${esc(e.label)}</text>`);
    }
  });

  // 节点绘制
  layers.forEach((layer) => {
    (layer.nodes || []).forEach((nd) => {
      const p = pos[nd.id];
      const accent = nd.accent || (nd.risk ? '#CF171D' : '#1C6EFF');
      const border = nd.risk ? '#FCA5A5' : '#E2E8F0';
      const fill = nd.risk ? '#FFFBFB' : '#FFFFFF';
      const goAttr = nd.go ? ` data-go="${esc(nd.go)}" data-act="node-${esc(nd.id)}"` : '';
      parts.push(`<g class="svg-node"${goAttr} data-node="${esc(nd.id)}">`);
      parts.push(`  <rect x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" width="${p.w}" height="${p.h}" rx="8" fill="${fill}" stroke="${border}" stroke-width="${nd.risk ? 1.5 : 1}" filter="url(#viz-sh)"/>`);
      parts.push(`  <rect x="${p.x.toFixed(1)}" y="${(p.y + 8).toFixed(1)}" width="4" height="${p.h - 16}" rx="2" fill="${accent}"/>`);
      parts.push(`  <text x="${(p.x + 14).toFixed(1)}" y="${(p.y + 23).toFixed(1)}" font-size="12" font-weight="600" fill="#1E293B">${esc(nd.label)}</text>`);
      if (nd.sub) {
        parts.push(`  <text x="${(p.x + 14).toFixed(1)}" y="${(p.y + 41).toFixed(1)}" font-size="12" fill="#64748B">${esc(nd.sub)}</text>`);
      }
      if (nd.badge) {
        const bw = Math.max(24, String(nd.badge).length * 7 + 12);
        parts.push(`  <rect x="${(p.rx - bw - 6).toFixed(1)}" y="${(p.y - 8).toFixed(1)}" width="${bw}" height="17" rx="8.5" fill="${accent}"/>`);
        parts.push(`  <text x="${(p.rx - bw / 2 - 6).toFixed(1)}" y="${(p.y + 4).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" fill="#FFFFFF">${esc(nd.badge)}</text>`);
      }
      parts.push(`</g>`);
    });
  });

  return `<svg class="viz-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">\n${parts.join('\n')}\n</svg>`;
}

/**
 * 桑基流转图 SVG 渲染器（自动按流量占比计算节点高度与贝塞尔流带厚度）
 * spec = {
 *   width?: 880, height?: 260,
 *   columns: [[{ id, label, value, color? }], ...],
 *   flows: [{ from, to, value, color?, risk? }]
 * }
 */
function renderSankeySVG(spec) {
  const W = spec.width || 880;
  const H = spec.height || 260;
  const cols = spec.columns || [];
  const flows = spec.flows || [];
  const padX = 110, padY = 24, barW = 14, gapY = 12;
  const usableH = H - padY * 2;
  const stepX = cols.length > 1 ? (W - padX * 2 - barW) / (cols.length - 1) : 0;
  const nPos = {};
  const parts = [];

  cols.forEach((col, ci) => {
    const x = padX + stepX * ci;
    const sum = col.reduce((s, n) => s + (n.value || 1), 0) || 1;
    const totalGap = Math.max(0, col.length - 1) * gapY;
    const scale = (usableH - totalGap) / sum;
    let curY = padY;
    col.forEach((n) => {
      const h = Math.max(12, (n.value || 1) * scale);
      nPos[n.id] = { x, y: curY, h, val: n.value || 1, outY: curY, inY: curY, scale, color: n.color || '#1C6EFF', label: n.label, ci };
      curY += h + gapY;
    });
  });

  // 绘制闭合贝塞尔流带
  flows.forEach((f) => {
    const a = nPos[f.from], b = nPos[f.to];
    if (!a || !b) return;
    const hA = Math.max(2, (f.value / a.val) * a.h);
    const hB = Math.max(2, (f.value / b.val) * b.h);
    const x1 = a.x + barW, y1a = a.outY, y1b = a.outY + hA;
    const x2 = b.x, y2a = b.inY, y2b = b.inY + hB;
    a.outY += hA;
    b.inY += hB;
    const mx = (x1 + x2) / 2;
    const fill = f.color || (f.risk ? '#CF171D' : '#64748B');
    const op = f.risk ? '0.32' : '0.18';
    const d = `M ${x1.toFixed(1)},${y1a.toFixed(1)} C ${mx.toFixed(1)},${y1a.toFixed(1)} ${mx.toFixed(1)},${y2a.toFixed(1)} ${x2.toFixed(1)},${y2a.toFixed(1)} ` +
              `L ${x2.toFixed(1)},${y2b.toFixed(1)} C ${mx.toFixed(1)},${y2b.toFixed(1)} ${mx.toFixed(1)},${y1b.toFixed(1)} ${x1.toFixed(1)},${y1b.toFixed(1)} Z`;
    parts.push(`<path d="${d}" fill="${fill}" fill-opacity="${op}"><title>${esc(a.label)} → ${esc(b.label)}：${f.value}</title></path>`);
  });

  // 绘制节点柱与标签
  Object.keys(nPos).forEach((id) => {
    const n = nPos[id];
    parts.push(`<rect x="${n.x.toFixed(1)}" y="${n.y.toFixed(1)}" width="${barW}" height="${n.h.toFixed(1)}" rx="3" fill="${n.color}"/>`);
    const isLast = n.ci === cols.length - 1;
    const tx = isLast ? n.x + barW + 8 : (n.ci === 0 ? n.x - 8 : n.x + barW + 8);
    const anchor = n.ci === 0 ? 'end' : 'start';
    parts.push(`<text x="${tx.toFixed(1)}" y="${(n.y + n.h / 2 + 4).toFixed(1)}" text-anchor="${anchor}" font-size="12" font-weight="600" fill="#1E293B">${esc(n.label)} (${n.val})</text>`);
  });

  return `<svg class="viz-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">\n${parts.join('\n')}\n</svg>`;
}

/**
 * 精确比例时间轴 Trace 瀑布图 HTML 渲染器
 * spec = { totalMs: 600, spans: [{ label, startMs, durMs, depth?, risk?, ok?, tag?, go? }] }
 */
function renderWaterfallHTML(spec) {
  const total = Math.max(spec.totalMs || 100, 1);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(total * r) + 'ms');
  const rows = (spec.spans || []).map((s) => {
    const left = Math.min(96, Math.max(0, (s.startMs / total) * 100));
    const width = Math.max(4, Math.min(100 - left, (s.durMs / total) * 100));
    const padL = (s.depth || 0) * 16;
    const bg = s.risk ? '#CF171D' : (s.ok ? '#12A679' : '#1C6EFF');
    const rowBg = s.risk ? 'background:#FFF8F8;' : '';
    const goAttr = s.go ? ` data-go="${esc(s.go)}"` : '';
    return `<div style="display:grid;grid-template-columns:34% 66%;align-items:center;padding:8px 14px;border-bottom:1px solid #EEF1F6;font-size:12px;cursor:pointer;${rowBg}"${goAttr}>
      <div style="padding-left:${padL}px;color:#1F232B;font-weight:${s.risk ? 600 : 400}">${esc(s.label)}${s.tag ? ` <span style="font-size:12px;color:${bg};margin-left:4px">[${esc(s.tag)}]</span>` : ''}</div>
      <div style="position:relative;height:20px;background:repeating-linear-gradient(to right,transparent,transparent calc(25% - 1px),#EEF1F6 calc(25% - 1px),#EEF1F6 25%);border-radius:3px;">
        <div class="seg" style="position:absolute;left:${left.toFixed(1)}%;width:${width.toFixed(1)}%;top:2px;height:16px;border-radius:3px;background:${bg};color:#FFF;font-size:12px;line-height:16px;padding:0 6px;white-space:nowrap;">${s.durMs}ms</div>
      </div>
    </div>`;
  }).join('\n');
  return `<div style="background:#FFF;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,.04);">
    <div style="display:grid;grid-template-columns:34% 66%;padding:8px 14px;background:#F7F9FC;color:#64748B;font-size:12px;font-weight:600;border-bottom:1px solid #E5E8EF;">
      <div>调用链路节点</div>
      <div style="display:flex;justify-content:space-between;">${ticks.map((t) => `<span>${t}</span>`).join('')}</div>
    </div>
    ${rows}
  </div>`;
}

if (require.main === module && process.argv.indexOf('--selftest') >= 0) {
  const topo = renderLayeredTopoSVG({
    layers: [
      { title: '用户层', nodes: [{ id: 'u', label: '张明远', sub: '研发部' }] },
      { title: '工具层', nodes: [{ id: 'db', label: 'query_db', sub: '340ms', risk: true, badge: '拦截' }] }
    ],
    edges: [{ from: 'u', to: 'db', label: '越权 SQL', risk: true }]
  });
  const sankey = renderSankeySVG({
    columns: [[{ id: 'a', label: '网关', value: 80 }], [{ id: 'b', label: '阻断', value: 80, color: '#CF171D' }]],
    flows: [{ from: 'a', to: 'b', value: 80, risk: true }]
  });
  const wf = renderWaterfallHTML({ totalMs: 500, spans: [{ label: 'query_db', startMs: 120, durMs: 340, risk: true }] });
  if (!/<svg[\s\S]*<\/svg>/.test(topo) || !/<path/.test(sankey) || !/340ms/.test(wf)) {
    console.error('❌ viz-engine selftest failed');
    process.exit(1);
  }
  console.log('✅ viz-engine selftest passed (topo + sankey + waterfall)');
}

module.exports = { renderLayeredTopoSVG, renderSankeySVG, renderWaterfallHTML };
