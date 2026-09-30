#!/usr/bin/env node
"use strict";

/**
 * cdp-capture.js —— 通过 Chrome 远程调试端口（CDP）抓取已登录环境的蒸馏取证素材
 *
 * 适用场景：目标环境已在规划人员的 Chrome 中登录，需要对其页面做只读取证
 *          （截图 / 文本 / DOM），不新建浏览器、不改动页面状态。
 *
 * 前置：Chrome 以 --remote-debugging-port=9222 启动（可用环境变量 CDP_PORT 覆盖）。
 *
 * 用法：
 *   node tools/cdp-capture.js list
 *       列出所有可取证页面（序号 | 标题 | URL）
 *   node tools/cdp-capture.js shot <URL或标题关键字> <输出png路径>
 *       对匹配页面整页截图（captureBeyondViewport）
 *   node tools/cdp-capture.js text <URL或标题关键字> [最多字符数]
 *       导出页面可见文本（document.body.innerText）
 *   node tools/cdp-capture.js eval <URL或标题关键字> "<JS表达式>"
 *       在页面上下文求值（只读用途）
 *   node tools/cdp-capture.js open <URL或标题关键字>
 *       将该标签置前（便于人工核对）
 *
 * 取证素材请存到仓库外（如 /tmp），避免内网截图与地址入库。
 */

const fs = require("fs");
const path = require("path");

const PORT = process.env.CDP_PORT || "9222";
const BASE = `http://127.0.0.1:${PORT}`;

async function listTargets() {
  const res = await fetch(`${BASE}/json/list`);
  if (!res.ok) throw new Error(`CDP /json/list HTTP ${res.status}`);
  const all = await res.json();
  return all.filter((t) => t.type === "page" && t.webSocketDebuggerUrl);
}

function pick(targets, keyword) {
  if (!keyword) return targets;
  const k = String(keyword).toLowerCase();
  return targets.filter(
    (t) =>
      (t.url || "").toLowerCase().includes(k) ||
      (t.title || "").toLowerCase().includes(k)
  );
}

function cdpClient(ws) {
  let seq = 0;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });
  return (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.addEventListener("open", () => resolve(ws));
    ws.addEventListener("error", () => reject(new Error("CDP WebSocket 连接失败")));
  });
}

async function withTarget(target, fn) {
  const ws = await connect(target.webSocketDebuggerUrl);
  try {
    return await fn(cdpClient(ws));
  } finally {
    ws.close();
  }
}

async function resolveOne(keyword) {
  const targets = await listTargets();
  const matched = pick(targets, keyword);
  if (matched.length === 0) {
    throw new Error(
      `未匹配到页面：${keyword}\n当前可取证页面：\n` +
        targets.map((t) => `- ${t.title} | ${t.url}`).join("\n")
    );
  }
  if (matched.length > 1) {
    process.stderr.write(
      `⚠️ 匹配到 ${matched.length} 个页面，取第一个：\n` +
        matched.map((t) => `  - ${t.title} | ${t.url}`).join("\n") +
        "\n"
    );
  }
  return matched[0];
}

async function cmdList() {
  const targets = await listTargets();
  if (targets.length === 0) {
    console.log("（无可用页面）");
    return;
  }
  targets.forEach((t, i) => {
    console.log(`${i + 1}. ${t.title || "(无标题)"}\n   ${t.url}`);
  });
}

async function cmdShot(keyword, out) {
  if (!keyword || !out) throw new Error("用法：shot <关键字> <输出png路径>");
  const target = await resolveOne(keyword);
  await withTarget(target, async (send) => {
    await send("Page.enable");
    const { data } = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
    });
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    fs.writeFileSync(path.resolve(out), Buffer.from(data, "base64"));
  });
  console.log(`✅ 截图已保存：${path.resolve(out)}\n   来源：${target.title} | ${target.url}`);
}

async function cmdText(keyword, maxChars) {
  if (!keyword) throw new Error("用法：text <关键字> [最多字符数]");
  const limit = Number(maxChars) || 8000;
  const target = await resolveOne(keyword);
  const text = await withTarget(target, async (send) => {
    const { result } = await send("Runtime.evaluate", {
      expression: "document.body ? document.body.innerText : ''",
      returnByValue: true,
    });
    return result.value || "";
  });
  console.log(`【${target.title}】${target.url}\n`);
  console.log(text.slice(0, limit));
  if (text.length > limit) console.log(`\n…（共 ${text.length} 字符，已截断）`);
}

async function cmdEval(keyword, expr) {
  if (!keyword || !expr) throw new Error('用法：eval <关键字> "<JS表达式>"');
  const target = await resolveOne(keyword);
  const value = await withTarget(target, async (send) => {
    const { result, exceptionDetails } = await send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) throw new Error(JSON.stringify(exceptionDetails));
    return result.value;
  });
  console.log(typeof value === "string" ? value : JSON.stringify(value, null, 2));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findByText(text) {
  return (send) =>
    send("Runtime.evaluate", {
      expression: `(function(){var t=${JSON.stringify(String(text))};var a=Array.from(document.querySelectorAll('*')).filter(function(e){return e.children.length===0 && (e.innerText||'').trim()===t});var el=a[0];if(!el)return null;var r=el.getBoundingClientRect();if(r.width===0&&r.height===0)return null;return {x:r.left+r.width/2,y:r.top+r.height/2};})()`,
      returnByValue: true,
    }).then(({ result }) => result.value);
}

async function findCenter(send, text) {
  return findByText(text)(send);
}

async function clickAt(send, p) {
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: p.x, y: p.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: p.x, y: p.y, button: "left", clickCount: 1 });
}

async function cmdClick(keyword, text) {
  if (!keyword || !text) throw new Error("用法：click <页面关键字> <要点击的文本>");
  const target = await resolveOne(keyword);
  await withTarget(target, async (send) => {
    const p = await findCenter(send, text);
    if (!p) throw new Error(`未找到可见文本为「${text}」的元素`);
    await clickAt(send, p);
  });
  console.log(`✅ 已点击「${text}」`);
}

const PROBE_EXPR = `(function(){
  var q=function(s){return document.querySelector(s)};
  var qa=function(s){return Array.from(document.querySelectorAll(s))};
  var hcells=qa('.sfv-table_header-cell');
  if(!hcells.length)hcells=qa('.ix-table-header-cell, th');
  var uniq=[];hcells.forEach(function(e){var x=(e.innerText||'').trim();if(x&&uniq.indexOf(x)<0&&uniq.length<30)uniq.push(x)});
  var b=q('.sfv-table_body')||q('.ix-table-body')||q('tbody');
  var r=q('.sfv-table_body-row')||q('.ix-table-body-row')||q('tbody tr');
  var pr=qa('*').filter(function(e){return e.children.length===0&&/共\\s*[0-9,]+\\s*项/.test(e.innerText||'')})[0];
  var card=qa('[class*=card]').filter(function(e){var b2=e.getBoundingClientRect();return b2.height>60&&b2.width>400});
  var tabs=[];qa('[class*=tab]').forEach(function(e){var s=(e.innerText||'').trim();if(s&&s.length<14&&tabs.indexOf(s)<0&&tabs.length<12)tabs.push(s)});
  return JSON.stringify({
    url:location.href,
    pageTitle:q('.layout-header__title')?q('.layout-header__title').innerText.replace(/\\s+/g,' / '):document.title,
    headers:uniq,
    rows:pr?(pr.parentElement.parentElement.innerText||'').replace(/\\s+/g,' ').slice(0,100):null,
    rowH:r?Math.round(r.getBoundingClientRect().height):null,
    bodyScroll:b?b.scrollWidth+'/'+b.clientWidth:null,
    cardish:card.length?'cards~'+card.length:null,
    colToggle:!!q('.sfv-table_toggle-columns'),
    fixedLines:qa('.sfv-table_column-fixed-line, .fixed-left-line, .fixed-right-line').length,
    tabs:tabs
  },null,1);
})()`;

async function cmdProbe(keyword) {
  const target = await resolveOne(keyword);
  const value = await withTarget(target, async (send) => {
    const { result } = await send("Runtime.evaluate", {
      expression: PROBE_EXPR,
      returnByValue: true,
    });
    return result.value;
  });
  console.log(value);
}

async function cmdNav(keyword, moduleLabel, itemLabel) {
  if (!keyword || !moduleLabel || !itemLabel)
    throw new Error("用法：nav <页面关键字> <一级模块名> <二级页面名>");
  const target = await resolveOne(keyword);
  const pickExpr = `(function(){
    var mod=${JSON.stringify(String(moduleLabel))}, item=${JSON.stringify(String(itemLabel))};
    var m=Array.from(document.querySelectorAll('li.ix-menu-sub.ix-menu-level-1')).filter(function(e){return (e.innerText||'').indexOf(mod)>=0})[0];
    if(!m) return {err:'MODULE_NOT_FOUND'};
    var it=Array.from(m.querySelectorAll('li.ix-menu-item.ix-menu-level-2')).filter(function(e){return (e.innerText||'').trim()===item})[0];
    if(!it) return {err:'ITEM_NOT_FOUND'};
    return {visible: it.getBoundingClientRect().height>0};
  })()`;
  await withTarget(target, async (send) => {
    const read = async (expr) =>
      (await send("Runtime.evaluate", { expression: expr, returnByValue: true })).result.value;
    let st = await read(pickExpr);
    if (st && st.err) throw new Error(`${moduleLabel} / ${itemLabel}：${st.err}`);
    if (!st || !st.visible) {
      await read(
        `Array.from(document.querySelectorAll('li.ix-menu-sub.ix-menu-level-1')).filter(function(e){return (e.innerText||'').indexOf(${JSON.stringify(
          String(moduleLabel)
        )})>=0})[0].click()`
      );
      await sleep(800);
    }
    const clicked = await read(
      `(function(){
        var m=Array.from(document.querySelectorAll('li.ix-menu-sub.ix-menu-level-1')).filter(function(e){return (e.innerText||'').indexOf(${JSON.stringify(
          String(moduleLabel)
        )})>=0})[0];
        if(!m) return 'MODULE_NOT_FOUND';
        var it=Array.from(m.querySelectorAll('li.ix-menu-item.ix-menu-level-2')).filter(function(e){return (e.innerText||'').trim()===${JSON.stringify(
          String(itemLabel)
        )}})[0];
        if(!it) return 'ITEM_NOT_FOUND';
        it.click(); return 'CLICKED';
      })()`
    );
    if (clicked !== "CLICKED") throw new Error(`${moduleLabel} / ${itemLabel}：${clicked}`);
  });
  console.log(`✅ 已进入「${moduleLabel} / ${itemLabel}」`);
}

async function cmdMouse(keyword, x, y, action) {
  if (!keyword || x === undefined || y === undefined)
    throw new Error("用法：mouse <页面关键字> <x> <y> [click]");
  const target = await resolveOne(keyword);
  await withTarget(target, async (send) => {
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: Number(x), y: Number(y) });
    if (action === "click") {
      await send("Input.dispatchMouseEvent", {
        type: "mousePressed", x: Number(x), y: Number(y), button: "left", clickCount: 1,
      });
      await send("Input.dispatchMouseEvent", {
        type: "mouseReleased", x: Number(x), y: Number(y), button: "left", clickCount: 1,
      });
    }
  });
  console.log(`✅ mouse ${action || "move"} @ ${x},${y}`);
}

async function cmdHover(keyword, text) {
  if (!keyword || !text) throw new Error("用法：hover <页面关键字> <要悬浮的文本>");
  const target = await resolveOne(keyword);
  await withTarget(target, async (send) => {
    const p = await findCenter(send, text);
    if (!p) throw new Error(`未找到可见文本为「${text}」的元素`);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y });
  });
  console.log(`✅ 已悬浮「${text}」`);
}

async function cmdOpen(keyword) {
  if (!keyword) throw new Error("用法：open <关键字>");
  const target = await resolveOne(keyword);
  await withTarget(target, async (send) => {
    await send("Page.bringToFront");
  });
  console.log(`✅ 已置前：${target.title} | ${target.url}`);
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  switch (cmd) {
    case "list":
      await cmdList();
      break;
    case "shot":
      await cmdShot(args[0], args[1]);
      break;
    case "text":
      await cmdText(args[0], args[1]);
      break;
    case "eval":
      await cmdEval(args[0], args[1]);
      break;
    case "open":
      await cmdOpen(args[0]);
      break;
    case "click":
      await cmdClick(args[0], args[1]);
      break;
    case "hover":
      await cmdHover(args[0], args[1]);
      break;
    case "nav":
      await cmdNav(args[0], args[1], args[2]);
      break;
    case "probe":
      await cmdProbe(args[0]);
      break;
    case "mouse":
      await cmdMouse(args[0], args[1], args[2], args[3]);
      break;
    default:
      console.log(
        [
          "CDP 蒸馏取证工具",
          "  node tools/cdp-capture.js list",
          "  node tools/cdp-capture.js shot <关键字> <输出png>",
          "  node tools/cdp-capture.js text <关键字> [最多字符数]",
          '  node tools/cdp-capture.js eval <关键字> "<JS表达式>"',
          "  node tools/cdp-capture.js open <关键字>",
          "  node tools/cdp-capture.js click <关键字> <要点击的文本>",
          "  node tools/cdp-capture.js hover <关键字> <要悬浮的文本>",
        ].join("\n")
      );
  }
}

main().catch((err) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
