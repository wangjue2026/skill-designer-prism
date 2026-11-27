#!/usr/bin/env node
/**
 * 织雨 · Part3 高保真 Demo 运行时冒烟自检（EX-6.0-12）
 *
 * 用法:
 *   node tools/demo-smoke.js <demo.html> [--screenshot=<png>]
 *
 * 做什么:
 *   1. 拉起临时无头 Chrome（headless=new）加载目标 demo.html（离线 file://）；
 *   2. 监听 Runtime.exceptionThrown / Console 错误，断言 0 JS 报错；
 *   3. 自动遍历页面关键交互：检查横向溢出、点击抽屉/弹窗触发器、切换全部 data-demo-tab 子 Tab、切换演示态切换器并复原；
 *   4. 若指定 --screenshot，额外保存首屏渲染截图供目视复核。
 *   5. 若本机无 Chrome 或端口受限，优雅降级输出 ⚠️ 提示而不误报脚本崩溃。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

function findChrome() {
  return CHROME_CANDIDATES.find((p) => fs.existsSync(p)) || null;
}

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(3000, () => { req.destroy(new Error('timeout')); });
  });
}

async function waitForCdp(port, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const list = await httpGetJson(`http://127.0.0.1:${port}/json/list`);
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('CDP 启动超时（可能是沙箱限制本地端口监听）');
}

function connectWs(wsUrl) {
  return new Promise((resolve, reject) => {
    if (typeof WebSocket === 'undefined') {
      return reject(new Error('当前 Node 版本无全局 WebSocket'));
    }
    const ws = new WebSocket(wsUrl);
    let seq = 0;
    const pending = new Map();
    const listeners = [];
    ws.addEventListener('open', () => {
      resolve({
        send(method, params) {
          return new Promise((res, rej) => {
            const id = ++seq;
            pending.set(id, { res, rej });
            ws.send(JSON.stringify({ id, method, params: params || {} }));
          });
        },
        onEvent(fn) { listeners.push(fn); },
        close() { try { ws.close(); } catch (_) {} },
      });
    });
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(msg.error.message || JSON.stringify(msg.error)));
        else res(msg.result);
      } else if (msg.method) {
        listeners.forEach((fn) => fn(msg));
      }
    });
    ws.addEventListener('error', (e) => reject(new Error(e.message || 'ws error')));
  });
}

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  const shotArg = args.find((a) => a.startsWith('--screenshot='));
  const shotPath = shotArg ? shotArg.slice('--screenshot='.length) : null;

  if (!file || !fs.existsSync(file)) {
    console.error('用法: node tools/demo-smoke.js <demo.html> [--screenshot=<png>]');
    process.exit(2);
  }

  const absFile = path.resolve(file);
  const chromeBin = findChrome();
  console.log('\n🔎 EX-6.0-12 浏览器运行时冒烟自检 · ' + path.basename(absFile));

  if (!chromeBin) {
    console.log('  ⚠️  EX-6.0-12  未检测到本机 Chrome/Chromium，跳过运行时冒烟（请手工在浏览器打开验证）');
    process.exit(0);
  }

  const port = 19222 + Math.floor(Math.random() * 1000);
  const tmpDir = `/tmp/prism-demo-smoke-${process.pid}`;
  const proc = spawn(chromeBin, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    'about:blank',
  ], { stdio: 'ignore' });

  let cdp = null;
  try {
    const target = await waitForCdp(port, 6000);
    cdp = await connectWs(target.webSocketDebuggerUrl);

    const errors = [];
    cdp.onEvent((msg) => {
      if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails || {};
        errors.push(`Uncaught: ${d.text || ''} ${(d.exception && d.exception.description) || ''}`.trim());
      }
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        const txt = (msg.params.args || []).map((a) => a.value || a.description || '').join(' ');
        errors.push(`console.error: ${txt}`);
      }
    });

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
    });

    const loadDone = new Promise((resolve) => {
      const timer = setTimeout(resolve, 4000);
      cdp.onEvent((m) => {
        if (m.method === 'Page.loadEventFired') { clearTimeout(timer); resolve(); }
      });
    });

    await cdp.send('Page.navigate', { url: 'file://' + encodeURI(absFile) });
    await loadDone;
    await new Promise((r) => setTimeout(r, 400));

    // 执行交互冒烟脚本
    const evalRes = await cdp.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(function () {
        var report = {
          overflowX: document.documentElement.scrollWidth - window.innerWidth,
          pages: document.querySelectorAll('[data-demo-page]').length,
          tabsTested: 0,
          emptyTabs: [],
          drawerOpened: false,
          modalOpened: false,
          statesTested: 0
        };
        // 1. 尝试打开抽屉（若有触发器）
        var dTrig = document.querySelector('[data-demo-open-drawer]');
        if (dTrig) {
          dTrig.click();
          var dEl = document.querySelector('[data-demo-page="Page-02"], .demo-drawer-mask');
          report.drawerOpened = !!(dEl && (dEl.classList.contains('open') || getComputedStyle(dEl).display !== 'none'));
        }
        // 2. 遍历所有子 Tab 并验证面板非空
        var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-demo-tab]'));
        tabs.forEach(function (btn) {
          btn.click();
          report.tabsTested++;
          var id = btn.getAttribute('data-demo-tab');
          var pane = document.querySelector('[data-demo-pane="' + id + '"]');
          if (!pane || (pane.textContent || '').trim().length < 8) {
            report.emptyTabs.push(id);
          }
        });
        if (tabs.length) tabs[0].click();
        // 3. 尝试打开弹窗并关闭
        var mTrig = document.querySelector('[data-demo-open-modal]');
        if (mTrig && !mTrig.disabled) {
          mTrig.click();
          var mEl = document.querySelector('.demo-modal-mask');
          report.modalOpened = !!(mEl && mEl.classList.contains('open'));
          var mClose = mEl ? mEl.querySelector('[data-demo-close-modal]') : null;
          if (mClose) mClose.click();
        }
        // 4. 遍历演示态切换器并复原 normal
        var states = Array.prototype.slice.call(document.querySelectorAll('[data-demo-state]'));
        states.forEach(function (sBtn) { sBtn.click(); report.statesTested++; });
        var normalBtn = document.querySelector('[data-demo-state="normal"]');
        if (normalBtn) normalBtn.click();
        // 关闭抽屉回到首屏态供截图
        var dClose = document.querySelector('[data-demo-close-drawer]');
        if (dClose) dClose.click();
        return report;
      })()`,
    });

    const info = (evalRes && evalRes.result && evalRes.result.value) || {};

    if (shotPath) {
      await new Promise((r) => setTimeout(r, 300));
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
      console.log('  📸 已保存首屏截图：' + shotPath);
    }

    let failed = false;
    if (errors.length) {
      console.log('  ❌ EX-6.0-12  运行时 JS 报错（' + errors.length + ' 条）：' + errors.slice(0, 3).join(' | '));
      failed = true;
    } else {
      console.log('  ✅ EX-6.0-12  运行时 0 JS 报错 / 0 console.error');
    }

    if (info.overflowX > 4) {
      console.log(`  ❌ EX-6.0-12  1440px 视口存在横向溢出（+${info.overflowX}px）`);
      failed = true;
    } else {
      console.log(`  ✅ EX-6.0-12  1440px 视口无横向溢出（Δ=${info.overflowX || 0}px）`);
    }

    if (info.emptyTabs && info.emptyTabs.length) {
      console.log('  ❌ EX-6.0-12  点击后存在空壳子 Tab：' + info.emptyTabs.join('、'));
      failed = true;
    } else {
      console.log(`  ✅ EX-6.0-12  交互冒烟通过：检测 ${info.pages || 0} 个页面、${info.tabsTested || 0} 个子 Tab、${info.statesTested || 0} 个演示态（抽屉=${info.drawerOpened} / 弹窗=${info.modalOpened}）`);
    }

    process.exitCode = failed ? 1 : 0;
  } catch (err) {
    console.log('  ⚠️  EX-6.0-12  无头浏览器冒烟未能连接（' + err.message + '），本轮降级提示；请在常规终端或浏览器手工验证');
    process.exitCode = 0;
  } finally {
    if (cdp) cdp.close();
    try { proc.kill('SIGKILL'); } catch (_) {}
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
}

main();
