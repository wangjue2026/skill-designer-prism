#!/usr/bin/env node
/**
 * check-links.js —— 仓库文档链接可达性校验（常规校验 · 与 check-charts.js 并列）
 *
 * 用途：扫全部 .md 里的相对链接，确认目标文件真实存在。目录改名 / 文件搬迁后最容易留下的
 *      就是"链接还写着旧路径"，本脚本用来把这类静默失效挡在提交之前。
 *
 * 用法：
 *   node tools/check-links.js               # 校验全仓（跳过 _output / .git / node_modules）
 *   node tools/check-links.js --all         # 连 _output 一起扫
 *   node tools/check-links.js --quiet       # 只报结论与断链
 *   node tools/check-links.js --json        # 机读输出（CI / 其他脚本消费）
 *   node tools/check-links.js <目录或文件>   # 只校验指定范围
 *
 * 判定规则：
 *   1. 只看 Markdown 行内链接与图片：[text](href) / ![alt](src)
 *   2. 跳过 http(s) / mailto: / tel: / 纯锚点(#xxx) / 空链接
 *   3. **代码块（```…```）与行内代码（`…`）内的一律不算链接** —— 线框示意图里常有
 *      `[失败原因](link)` 这类样式标注，不能被误判成断链
 *   4. 目标按"引用方所在目录"解析（各目录相对路径，不能用统一根目录）
 *   5. 忽略 href 的 #锚点与 ?query 部分；百分号编码自动解码（中文路径必须能过）
 *
 * 退出码：0 = 全部可达；1 = 存在断链（提交前必须先修）
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const INCLUDE_ALL = args.includes('--all');
const JSON_OUT = args.includes('--json');
const QUIET = args.includes('--quiet');
const scope = args.find((a) => !a.startsWith('--'));

const SKIP_DIRS = new Set(['.git', 'node_modules']);
if (!INCLUDE_ALL) SKIP_DIRS.add('_output');

const MD_EXTS = new Set(['.md', '.markdown']);

function collect(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return MD_EXTS.has(path.extname(target)) ? [target] : [];
  const out = [];
  for (const e of fs.readdirSync(target, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(target, e.name);
    if (e.isDirectory()) out.push(...collect(p));
    else if (MD_EXTS.has(path.extname(e.name))) out.push(p);
  }
  return out;
}

/** 去掉代码块与行内代码，避免把线框里的示意文字当链接 */
function stripCode(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
    .replace(/`[^`\n]*`/g, '');
}

const LINK_RE = /!?\[([^\]]{0,80})\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

const files = collect(scope ? path.resolve(ROOT, scope) : ROOT).sort();
let total = 0;
const broken = [];

for (const f of files) {
  const raw = fs.readFileSync(f, 'utf8');
  const text = stripCode(raw);
  let m;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(text)) !== null) {
    let href = m[2].trim();
    if (!href) continue;
    if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(href)) continue;
    if (href.startsWith('#')) continue;
    total++;
    const clean = href.split('#')[0].split('?')[0];
    if (!clean) continue;
    let decoded = clean;
    try { decoded = decodeURIComponent(clean); } catch (e) { /* 保留原样 */ }
    const target = path.resolve(path.dirname(f), decoded);
    if (!fs.existsSync(target)) {
      broken.push({
        file: path.relative(ROOT, f),
        text: (m[1] || '').slice(0, 40),
        href,
      });
    }
  }
}

if (JSON_OUT) {
  console.log(JSON.stringify({ files: files.length, links: total, broken }, null, 2));
} else {
  if (!QUIET) console.log('链接可达性校验 —— ' + files.length + ' 份文档 / ' + total + ' 条相对链接');
  if (broken.length === 0) {
    console.log('✅ 全部通过（0 断链）');
  } else {
    console.log('❌ 发现 ' + broken.length + ' 条断链：');
    for (const b of broken) {
      console.log('  - ' + b.file + '  ->  ' + b.href + (b.text ? '   [文字：' + b.text + ']' : ''));
    }
    console.log('\n修法提示：目录改名 / 文件搬迁后，链接要按"引用方所在目录"重算相对路径；' +
      '指向已不存在产物的链接应删除或降级为纯文本，不要留死链。');
  }
}

process.exit(broken.length === 0 ? 0 : 1);
