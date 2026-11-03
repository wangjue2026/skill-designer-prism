#!/usr/bin/env node
/**
 * check-charts.js —— 图表资产一致性校验（md ↔ 机读镜像）
 *
 * 用法：node tools/check-charts.js
 * 退出码：0 = 全过（可能有警告）；1 = 有错误
 *
 * 校验项：
 *   C1 键一致：charts.json 里每个 chartKey 必须在 md 中出现
 *   C2 颜色覆盖：json 里每个 hex 必须能在 md 里找到（防止"json 有、文档没说"）
 *   C3 游离色值：md 里出现的 hex 必须在 json 里登记（allowlist 除外，防止裸值漂移）
 *   C4 链接：charts/*.md 的相对链接必须可解析
 *   C5 台账：裁决台账.md 必须存在且至少有 1 条裁决
 *   C6 demo 色值：demo/*.html 的 hex 必须登记
 *   C7 demo 覆盖：每个 chartKey 至少有一个 demo 片段引用
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CHARTS = path.join(ROOT, "03-design-assets/visual-styles/charts");
const JSON_PATH = path.join(CHARTS, "tokens/charts.json");
const LEDGER = path.join(CHARTS, "裁决台账.md");

// 允许在 md 出现、但不要求在 json 登记的色值（工具色/中性色等）
const HEX_ALLOW = new Set([
  "#FBFDFF", // tooltip 底色
  "#FFFFFF", // 描边白
  "#F7F9FC", // demo 页面底色（非图表 token）
]);

const errors = [];
const warnings = [];

function err(code, msg) { errors.push(code + " " + msg); }
function warn(code, msg) { warnings.push(code + " " + msg); }

function hexesOf(text) {
  const out = new Set();
  const re = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b/g;
  let m;
  while ((m = re.exec(text)) !== null) out.add(m[0].toUpperCase());
  return out;
}

// ---------- 载入 ----------
if (!fs.existsSync(JSON_PATH)) {
  console.error("✗ 找不到 " + path.relative(ROOT, JSON_PATH));
  process.exit(1);
}
let spec;
try {
  spec = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
} catch (e) {
  console.error("✗ charts.json 解析失败：" + e.message);
  process.exit(1);
}

const mdFiles = fs.readdirSync(CHARTS).filter((f) => f.endsWith(".md"));
if (mdFiles.length === 0) {
  console.error("✗ charts 目录下没有 md 资产");
  process.exit(1);
}
const mdText = {};
for (const f of mdFiles) mdText[f] = fs.readFileSync(path.join(CHARTS, f), "utf8");
const allMd = Object.values(mdText).join("\n");

// ---------- C1 键一致 ----------
const keys = Object.keys(spec.chartKeys || {});
for (const k of keys) {
  if (!allMd.includes(k)) err("C1", "机读键未在文档出现：" + k);
}

// ---------- C2 json 色值必须被文档说明 ----------
const specHexes = hexesOf(JSON.stringify(spec));
for (const h of specHexes) {
  if (!allMd.toUpperCase().includes(h)) err("C2", "json 里的色值文档未提及：" + h);
}

// ---------- C3 文档色值必须在 json 登记 ----------
for (const f of mdFiles) {
  for (const h of hexesOf(mdText[f])) {
    if (HEX_ALLOW.has(h)) continue;
    if (!specHexes.has(h)) warn("C3", f + " 出现未登记的色值 " + h + "（请补进 charts.json 或加入 allowlist）");
  }
}

// ---------- C4 链接可解析 ----------
for (const f of mdFiles) {
  const re = /\]\(([^)#]+\.(?:md|json))/g;
  let m;
  while ((m = re.exec(mdText[f])) !== null) {
    const target = path.resolve(CHARTS, m[1]);
    if (!fs.existsSync(target)) err("C4", f + " 链接失效：" + m[1]);
  }
}

// ---------- C6 demo 片段色值必须登记 ----------
const demoDir = path.join(CHARTS, "demo");
if (fs.existsSync(demoDir)) {
  const demos = fs.readdirSync(demoDir).filter((f) => f.endsWith(".html"));
  for (const f of demos) {
    const html = fs.readFileSync(path.join(demoDir, f), "utf8");
    for (const hx of hexesOf(html)) {
      if (HEX_ALLOW.has(hx)) continue;
      if (!specHexes.has(hx)) warn("C6", "demo/" + f + " 出现未登记色值 " + hx);
    }
  }
  console.log("demo 片段：" + demos.length + " 个");
}

// ---------- C7 每个图表键都要有 demo 片段覆盖 ----------
const demoDir2 = path.join(CHARTS, "demo");
if (fs.existsSync(demoDir2)) {
  const demos = fs.readdirSync(demoDir2).filter((f) => f.endsWith(".html"));
  const demoText = demos.map((f) => fs.readFileSync(path.join(demoDir2, f), "utf8")).join("\n");
  const uncovered = keys.filter((k) => !demoText.includes(k));
  for (const k of uncovered) warn("C7", "该键还没有 demo 片段：" + k);
}

// ---------- C5 裁决台账 ----------
if (!fs.existsSync(LEDGER)) {
  err("C5", "缺少 裁决台账.md（口径裁决必须留档）");
} else {
  const rows = fs.readFileSync(LEDGER, "utf8").split("\n").filter((l) => /^\|\s*\d{4}-\d{2}-\d{2}\s*\|/.test(l));
  if (rows.length === 0) err("C5", "裁决台账里没有带日期的裁决行");
}

// ---------- 输出 ----------
console.log("图表资产校验 —— " + mdFiles.length + " 份文档 / " + keys.length + " 个键 / " + specHexes.size + " 个登记色值");
for (const w of warnings) console.log("  ⚠ " + w);
for (const e of errors) console.log("  ✗ " + e);
if (errors.length === 0) {
  console.log("✅ 全部通过" + (warnings.length ? "（" + warnings.length + " 条警告）" : ""));
  process.exit(0);
} else {
  console.log("❌ 失败 " + errors.length + " 项");
  process.exit(1);
}
