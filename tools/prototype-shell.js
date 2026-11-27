#!/usr/bin/env node
/**
 * 织雨 · 1.4 概念高保真原型外壳生成器 (Concept High-Fidelity Prototype Shell)
 *
 * 设计目标（Batch 1 · B1-2）：
 *   1. 去框线化现代 B 端视觉基底（#F7F9FC 画布 + #FFFFFF 浮层/卡片，消灭 6 层边框套娃）；
 *   2. 顶部吸顶工具栏：方案一/方案二切换 + 右上角「显示设计标注」Toggle（默认关闭，画面零噪音）；
 *   3. 步骤驱动的可交互剧本条（Step 1 → Step N）：点击步骤自动切换画布状态/视图/浮层，支持 ←/→ 键盘导航；
 *   4. 标注层解耦：默认隐藏 .dx 虚线框、.pt 标号、.notes 与 .tkn，打开 Toggle 即叠加呈现；
 *   5. 兼容 gate-ex.sh 1.4（data-mode="prototype" 标记）与文末 <details class="handoff"> 交接区。
 *
 * 用法（CLI 生成空壳模板或作为模块引入）:
 *   node tools/prototype-shell.js --scaffold <out.html> [业务名]
 *   const { buildPrototypeHtml, PROTOTYPE_CSS, PROTOTYPE_JS } = require('./tools/prototype-shell.js');
 */
'use strict';
const fs = require('fs');
const path = require('path');

const PROTOTYPE_CSS = `
  :root {
    --bg-canvas: #F5F7FA;
    --bg-surface: #FFFFFF;
    --bg-subtle: #F7F9FC;
    --bg-muted: #EDF1F7;
    --text-primary: #1F232B;
    --text-secondary: #4E5969;
    --text-muted: #86909C;
    --border-hairline: #E5E8EF;
    --border-soft: #EEF1F6;
    --brand: #1C6EFF;
    --brand-soft: #E8F4FF;
    --brand-deep: #00258C;
    --crit: #CF171D;
    --crit-soft: #FFF1F0;
    --high: #FA721B;
    --high-soft: #FFF7E8;
    --ok: #12A679;
    --ok-soft: #E8F9F2;
    --shadow-card: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02);
    --shadow-float: 0 12px 32px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.05);
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
  }
  * { box-sizing: border-box; }
  body {
    font: 14px/1.6 -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif;
    color: var(--text-primary);
    background: var(--bg-canvas);
    margin: 0;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 1440px; margin: 0 auto; padding: 24px 24px 72px; }

  /* 页头与概览区（轻量去框线） */
  .doc-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
  .doc-head h1 { font-size: 20px; font-weight: 600; margin: 0; color: var(--text-primary); }
  .doc-sub { color: var(--text-secondary); font-size: 12px; margin: 4px 0 14px; }
  .meta-bar {
    background: var(--bg-surface); border-radius: var(--radius-md); padding: 10px 16px;
    margin: 0 0 16px; font-size: 12px; color: var(--text-secondary); box-shadow: var(--shadow-card);
  }
  .sec-title { font-size: 16px; font-weight: 600; margin: 24px 0 12px; color: var(--text-primary); }
  .card-flat {
    background: var(--bg-surface); border-radius: var(--radius-md); padding: 16px 20px;
    margin: 10px 0 16px; box-shadow: var(--shadow-card);
  }

  /* 信息架构树：右对齐级别列 */
  .ia-tree .row { display: flex; align-items: center; padding: 6px 4px; border-bottom: 1px dashed var(--border-soft); font-size: 14px; }
  .ia-tree .row:last-child { border-bottom: none; }
  .ia-tree .lv { margin-left: auto; color: var(--text-muted); font-size: 12px; background: var(--bg-subtle); padding: 2px 8px; border-radius: var(--radius-sm); }

  /* 通用表格（无竖线、轻横线） */
  table.clean { width: 100%; border-collapse: collapse; background: var(--bg-surface); border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-card); margin: 8px 0 16px; }
  table.clean th { background: var(--bg-subtle); color: var(--text-secondary); font-weight: 600; font-size: 12px; text-align: left; padding: 10px 14px; border-bottom: 1px solid var(--border-hairline); }
  table.clean td { font-size: 12px; color: var(--text-primary); padding: 10px 14px; border-bottom: 1px solid var(--border-soft); vertical-align: top; }
  table.clean tr:last-child td { border-bottom: none; }
  table.clean td.num, table.clean th.num { text-align: right; font-variant-numeric: tabular-nums; }

  /* 吸顶控制栏：方案切换 + 标注层 Toggle */
  .proto-toolbar {
    position: sticky; top: 0; z-index: 40;
    background: rgba(245, 247, 250, 0.92); backdrop-filter: blur(8px);
    padding: 12px 0; margin: 12px 0 8px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
  .plan-bar { display: inline-flex; background: #E4E8F0; padding: 3px; border-radius: 6px; gap: 4px; }
  .tab {
    border: none; background: transparent; color: var(--text-secondary);
    padding: 7px 18px; border-radius: 4px; font-size: 14px; font-weight: 400; cursor: pointer;
    transition: background .15s, color .15s;
  }
  .tab.on { background: var(--brand); color: #FFFFFF; font-weight: 600; box-shadow: 0 1px 3px rgba(28, 110, 255, 0.25); }

  /* 标注层 Toggle 开关 */
  .annot-toggle {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--bg-surface); border: 1px solid var(--border-hairline);
    border-radius: 20px; padding: 5px 12px; font-size: 12px; color: var(--text-secondary);
    cursor: pointer; user-select: none; box-shadow: var(--shadow-card);
  }
  .annot-toggle .switch {
    width: 28px; height: 16px; border-radius: 10px; background: #D3D7DE; position: relative; transition: background .15s;
  }
  .annot-toggle .switch::after {
    content: ""; position: absolute; top: 2px; left: 2px; width: 12px; height: 12px;
    border-radius: 50%; background: #FFFFFF; transition: transform .15s;
  }
  body.show-annot .annot-toggle { border-color: var(--brand); color: var(--brand-deep); background: var(--brand-soft); }
  body.show-annot .annot-toggle .switch { background: var(--brand); }
  body.show-annot .annot-toggle .switch::after { transform: translateX(12px); }

  /* 方案面板与场景互斥 */
  .panel { display: none; }
  .panel.on { display: block; }
  .scene-tabs { display: flex; gap: 8px; margin: 4px 0 12px; }
  .scene-tab {
    border: 1px solid var(--border-hairline); background: var(--bg-surface); color: var(--text-secondary);
    padding: 5px 14px; border-radius: 6px; font-size: 12px; cursor: pointer;
  }
  .scene-tab.on { background: var(--brand-soft); color: var(--brand-deep); border-color: var(--brand); font-weight: 600; }
  .scene { display: none; }
  .scene.on { display: block; }

  /* 步骤驱动剧本条 */
  .step-bar {
    display: flex; align-items: stretch; gap: 8px; margin: 0 0 14px;
    background: var(--bg-surface); padding: 10px 12px; border-radius: var(--radius-md); box-shadow: var(--shadow-card);
    overflow-x: auto;
  }
  .step-pill {
    flex: 1 1 0; min-width: 140px; border: 1px solid transparent; background: var(--bg-subtle);
    border-radius: 6px; padding: 8px 12px; text-align: left; cursor: pointer; transition: all .15s;
  }
  .step-pill:hover { background: #EEF4FF; }
  .step-pill.on { background: var(--brand-soft); border-color: var(--brand); }
  .step-pill .step-name { display: block; font-size: 14px; font-weight: 600; color: var(--text-primary); }
  .step-pill.on .step-name { color: var(--brand-deep); }
  .step-pill .step-intent { display: block; font-size: 12px; color: var(--text-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .step-pill .step-pages { display: none; }

  /* 当前步骤操作引导条（精简一行，不抢画面） */
  .step-strip {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 8px 14px; margin: 0 0 12px; border-radius: 6px;
    background: #FFFFFF; border-left: 3px solid var(--brand); box-shadow: var(--shadow-card);
    font-size: 12px; color: var(--text-secondary);
  }
  .step-strip .step-nav-btns { display: inline-flex; gap: 6px; flex: 0 0 auto; }
  .step-strip button {
    border: 1px solid var(--border-hairline); background: var(--bg-surface); color: var(--text-secondary);
    border-radius: 4px; padding: 3px 10px; font-size: 12px; cursor: pointer;
  }
  .step-strip button:hover { border-color: var(--brand); color: var(--brand); }
  .scene-close {
    margin-top: 12px; padding: 10px 14px; border-radius: 6px;
    background: var(--ok-soft); color: #015945; font-size: 12px; border-left: 3px solid var(--ok);
  }

  /* 产品画布（去框线高保真舞台） */
  .proto-stage {
    background: var(--bg-surface); border-radius: var(--radius-lg);
    box-shadow: var(--shadow-float); overflow: hidden; min-height: 520px; position: relative;
  }
  .page { display: none; }
  .page.active { display: block; }
  .page-hd {
    display: flex; align-items: center; gap: 8px; padding: 12px 20px;
    background: var(--bg-subtle); border-bottom: 1px solid var(--border-soft); flex-wrap: wrap;
  }
  .pid { background: #454C59; color: #FFFFFF; border-radius: 4px; padding: 2px 7px; font-size: 12px; font-weight: 600; }
  .page-hd h3 { margin: 0; font-size: 14px; font-weight: 600; }
  .page-hd .form { color: var(--text-muted); font-size: 12px; }
  .page-hd .from {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 12px; font-weight: 600; color: #1F232B;
    background: #E8EEF5; padding: 2px 10px; border-radius: 4px; margin-left: 4px;
  }
  .frame { padding: 20px; background: var(--bg-canvas); }

  /* 标注层默认完全隐形，开启 body.show-annot 时优雅浮现 */
  .dx { position: relative; border: 1px solid transparent; border-radius: var(--radius-md); transition: border-color .15s; }
  .pt, .notes, .tkn, .pane-tag, .view-decl { display: none; }
  body.show-annot .dx { border: 1.5px dashed var(--brand); padding: 8px; background: rgba(28, 110, 255, 0.02); }
  body.show-annot .pt {
    display: inline-flex; align-items: center; justify-content: center;
    position: absolute; top: -10px; right: -10px; width: 22px; height: 22px;
    background: var(--brand); color: #FFFFFF; border-radius: 50%; font-size: 12px; font-style: normal; font-weight: 600;
    box-shadow: 0 2px 6px rgba(28, 110, 255, 0.35); z-index: 5;
  }
  body.show-annot .notes {
    display: block; list-style: none; margin: 12px 20px 8px; padding: 12px 16px;
    background: #F8FAFF; border-left: 3px solid var(--brand); border-radius: 4px; font-size: 12px; color: var(--text-secondary);
  }
  body.show-annot .notes li { margin: 4px 0; line-height: 1.6; }
  body.show-annot .tkn {
    display: block; margin: 0 20px 14px; padding: 6px 12px; font-size: 12px; color: var(--text-muted);
    background: var(--bg-subtle); border-radius: 4px;
  }
  body.show-annot .view-decl {
    display: inline-block; margin-left: auto; font-size: 12px; color: var(--text-muted);
    background: var(--bg-muted); padding: 2px 8px; border-radius: 4px;
  }

  /* 按钮与占位 */
  .btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; border: 1px solid var(--border-hairline); border-radius: var(--radius-sm); font-size: 12px; color: var(--text-primary); background: var(--bg-surface); cursor: pointer; }
  .btn.p { background: var(--brand); color: #FFFFFF; border-color: var(--brand); font-weight: 600; }
  .btn.dis { background: var(--bg-subtle); color: var(--text-muted); border-color: var(--border-soft); cursor: not-allowed; }
  /* 概念高保真原型中 .cap 承载真实轻量 UI 控件组（不再用灰底斜体文字块破坏画面），.ph 用于数据缺口/不做声明 */
  .cap { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; font-style: normal; font-size: 12px; color: var(--text-secondary); }
  .ui-ctrl { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; background: var(--bg-surface); border: 1px solid var(--border-hairline); border-radius: 4px; font-size: 12px; color: var(--text-secondary); }
  .ui-ctrl.on { background: var(--brand-soft); border-color: var(--brand); color: var(--brand-deep); font-weight: 600; }
  .ui-input { display: inline-flex; align-items: center; justify-content: space-between; min-width: 150px; height: 28px; padding: 0 10px; background: var(--bg-surface); border: 1px solid var(--border-hairline); border-radius: 4px; font-size: 12px; color: var(--text-muted); }
  .ph { display: inline-flex; align-items: center; gap: 4px; background: #F2F4F7; color: #6F7785; font-size: 12px; padding: 4px 10px; border-radius: 4px; }

  /* 抽屉与弹窗（现代浮层阴影，无厚重边框） */
  .wf-drawer-ft { padding: 14px 20px; border-top: 1px solid var(--border-soft); display: flex; justify-content: flex-start; gap: 8px; background: var(--bg-surface); }
  .wf-modal-ft { padding: 14px 20px; border-top: 1px solid var(--border-soft); display: flex; justify-content: flex-end; gap: 8px; background: var(--bg-surface); }

  /* 页内 Tab 互斥切换 */
  .tabbar { display: flex; gap: 20px; border-bottom: 1px solid var(--border-hairline); margin: 12px 0; }
  .tabx { border: none; background: transparent; padding: 8px 2px; font-size: 14px; color: var(--text-secondary); cursor: pointer; border-bottom: 2px solid transparent; }
  .tabx.on { color: var(--brand); border-bottom-color: var(--brand); font-weight: 600; }
  .pane { display: none; }
  .pane.on { display: block; }

  /* ===== 工艺层基础原语（仅保留 V-23 必需钩子与 SVG 响应式容器；业务形态自由创作，不锁死模板） ===== */
  .wf-kpi--strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 0 0 16px; }
  .wf-kpi-item { background: var(--bg-surface); border-radius: var(--radius-md); padding: 14px 16px; box-shadow: var(--shadow-card); }
  .viz-svg { width: 100%; height: auto; display: block; font-family: inherit; }
  .viz-svg .svg-node { cursor: pointer; transition: opacity .15s, transform .15s; }
  .viz-svg .svg-node:hover { opacity: 0.9; }

  /* 文末折叠交接区 */
  details.handoff { margin-top: 32px; background: var(--bg-surface); border-radius: var(--radius-md); padding: 12px 18px; box-shadow: var(--shadow-card); }
  details.handoff summary { cursor: pointer; font-weight: 600; color: var(--text-secondary); font-size: 12px; }
`;

const PROTOTYPE_JS = `
(function () {
  // 1. 设计标注层 Toggle（默认关闭）
  var annotBtn = document.querySelector('[data-annot-toggle]');
  if (annotBtn) {
    annotBtn.addEventListener('click', function () {
      document.body.classList.toggle('show-annot');
      annotBtn.setAttribute('aria-pressed', document.body.classList.contains('show-annot') ? 'true' : 'false');
    });
  }

  // 2. 跨方案切换（切方案自动滚回原型起点并激活 S1 + Step 1）
  var planTabs = document.querySelectorAll('.tab[data-tab]');
  var anchor = document.querySelector('.proto-toolbar');
  planTabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var id = t.getAttribute('data-tab');
      planTabs.forEach(function (x) { x.classList.toggle('on', x === t); });
      document.querySelectorAll('.panel').forEach(function (p) { p.classList.toggle('on', p.id === id); });
      if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // 3. 场景切换（互斥）
  document.querySelectorAll('.panel').forEach(function (panel) {
    var sTabs = panel.querySelectorAll('.scene-tab[data-scene-tab]');
    sTabs.forEach(function (st) {
      st.addEventListener('click', function () {
        var sid = st.getAttribute('data-scene-tab');
        sTabs.forEach(function (x) { x.classList.toggle('on', x === st); });
        panel.querySelectorAll('.scene').forEach(function (sc) {
          sc.classList.toggle('on', sc.getAttribute('data-scene') === sid);
        });
      });
    });

    // 4. 步骤剧本驱动（切换当前激活步骤对应的页面与状态）
    panel.querySelectorAll('.scene').forEach(function (scene) {
      var pills = Array.prototype.slice.call(scene.querySelectorAll('.step-pill[data-step]'));
      var pages = Array.prototype.slice.call(scene.querySelectorAll('.page[data-step]'));
      var actOut = scene.querySelector('.step-act-live');
      function activateStep(idx) {
        if (idx < 0 || idx >= pills.length) return;
        var pill = pills[idx];
        var sid = pill.getAttribute('data-step');
        pills.forEach(function (x, i) { x.classList.toggle('on', i === idx); });
        var targetPage = pill.getAttribute('data-target-page') || '';
        pages.forEach(function (pg) {
          var match = pg.getAttribute('data-step') === sid || (targetPage && pg.getAttribute('data-page') === targetPage && pg.getAttribute('data-step') === sid);
          pg.classList.toggle('active', match);
        });
        if (actOut) actOut.textContent = pill.getAttribute('data-act-text') || '';
        scene.setAttribute('data-active-step', String(idx));
      }
      pills.forEach(function (pill, i) {
        pill.addEventListener('click', function () { activateStep(i); });
      });
      var prevBtn = scene.querySelector('[data-step-prev]');
      var nextBtn = scene.querySelector('[data-step-next]');
      if (prevBtn) prevBtn.addEventListener('click', function () { activateStep(Number(scene.getAttribute('data-active-step') || 0) - 1); });
      if (nextBtn) nextBtn.addEventListener('click', function () { activateStep(Number(scene.getAttribute('data-active-step') || 0) + 1); });
      if (pills.length) activateStep(0);
    });
  });

  // 5. 页内 Tab 互斥切换（不改变页面滚动位置）
  document.querySelectorAll('.tabbar').forEach(function (bar) {
    var btns = Array.prototype.slice.call(bar.querySelectorAll('.tabx'));
    var scope = bar.parentElement;
    var panes = Array.prototype.slice.call(scope.querySelectorAll(':scope > .pane, :scope > .dx > .pane'));
    btns.forEach(function (btn, idx) {
      btn.addEventListener('click', function () {
        var name = btn.textContent.trim();
        btns.forEach(function (b) { b.classList.toggle('on', b === btn); });
        panes.forEach(function (p, pi) {
          var dp = (p.getAttribute('data-pane') || '').trim();
          p.classList.toggle('on', dp ? dp === name : pi === idx);
        });
      });
    });
  });

  // 6. data-go 锚点点击跳转对应步骤/页面
  document.querySelectorAll('[data-go]').forEach(function (el) {
    el.addEventListener('click', function () {
      var target = el.getAttribute('data-go');
      var scene = el.closest('.scene');
      if (!scene || !target) return;
      var pills = Array.prototype.slice.call(scene.querySelectorAll('.step-pill[data-pages]'));
      for (var i = 0; i < pills.length; i++) {
        if ((pills[i].getAttribute('data-pages') || '').split(/\s+/).indexOf(target) >= 0) {
          pills[i].click();
          break;
        }
      }
    });
  });
})();
`;

function buildPrototypeHtml(opts) {
  const title = (opts && opts.title) || '概念高保真原型稿';
  const meta = (opts && opts.meta) || '示例环境 · 快照时间 · 规模声明。仿真数据，不构成客户事实。';
  const iaHtml = (opts && opts.iaHtml) || '<!-- IA 树与页面清单 -->';
  const compareHtml = (opts && opts.compareHtml) || '<!-- 两套方案对比表 -->';
  const plansHtml = (opts && opts.plansHtml) || '<!-- 方案一 / 方案二交互面板 -->';
  const handoffHtml = (opts && opts.handoffHtml) || '<!-- ph-ledger / dx-ledger / view-ledger / flow-ledger -->';
  const extraCss = (opts && opts.extraCss) || '';
  const extraJs = (opts && opts.extraJs) || '';
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>概念高保真原型 · ${title}</title>
<style>${PROTOTYPE_CSS}\n${extraCss}</style>
</head>
<body data-mode="prototype">
<div class="wrap">
  <div class="doc-head">
    <h1>概念高保真原型 · ${title}</h1>
  </div>
  <p class="doc-sub">概念方案原型（核心主战场页整屏准高保真，可点击步骤条与界面元素体验交互；点击右上角「显示设计标注」可查看设计思考与 Token）。</p>
  <div class="meta-bar">${meta}</div>

  ${iaHtml}
  ${compareHtml}

  <h2 class="sec-title">概念原型交互体验</h2>
  <div class="proto-toolbar">
    <div class="plan-bar">
      <div class="tab on" data-tab="pa" data-plan="A" role="button" tabindex="0">方案一</div>
      <div class="tab" data-tab="pb" data-plan="B" role="button" tabindex="0">方案二</div>
    </div>
    <button type="button" class="annot-toggle" data-annot-toggle data-act="toggle-annot" aria-pressed="false">
      <span class="switch"></span><span>显示设计标注</span>
    </button>
  </div>

  ${plansHtml}

  <hr style="display:none">
  <details class="handoff">
    <summary>📦 交接件（给下游 4.1 / 5.0 读，不参与方案阅读）</summary>
    ${handoffHtml}
  </details>
</div>
<script>${PROTOTYPE_JS}\n${extraJs}</script>
</body>
</html>`;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === '--scaffold' && args[1]) {
    const outPath = path.resolve(args[1]);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, buildPrototypeHtml({ title: args[2] || '示例业务' }), 'utf8');
    console.log('✅ 已生成概念高保真原型空壳: ' + outPath);
  } else {
    console.log('用法: node tools/prototype-shell.js --scaffold <out.html> [业务名]');
  }
}

module.exports = { buildPrototypeHtml, PROTOTYPE_CSS, PROTOTYPE_JS };
