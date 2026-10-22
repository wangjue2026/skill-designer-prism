#!/usr/bin/env node
/**
 * 织雨 · 门禁引擎（两用：执行环节准出 EX / 说明书整体准出 SP）
 *
 * 口径唯一来源：04-workflows-and-cases/准出门禁总表.md
 * 本脚本只做机检（M）项；人检（H）项在输出里以 ⚠️ 提示，由交付时人工核对。
 *
 * 用法:
 *   node tools/gate.js ex 1.1 _output/<业务名>/01-场景与Job-x.md
 *   node tools/gate.js ex 1.2 _output/<业务名>/02-体验目标-x.md _output/<业务名>/01-场景与Job-x.md
 *   node tools/gate.js ex 1.3 _output/<业务名>/03-突破点-x.md
 *   node tools/gate.js ex 1.4 _output/<业务名>/草图-x.html
 *   node tools/gate.js sp _output/<业务名>/design-spec-x.html
 */
const fs = require('fs');

const MODE = process.argv[2];
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
let fail = 0, warn = 0;
const ok = (id, m) => console.log('  ✅ ' + id + '  ' + m);
const bad = (id, m) => { console.log('  ❌ ' + id + '  ' + m); fail++; };
const wr = (id, m) => { console.log('  ⚠️ ' + id + '  ' + m); warn++; };
const head = (m) => console.log('\n🔎 ' + m);

const UI_WORDS = /(弹窗|抽屉|标签页|按钮|下拉框|复选框|搜索框|筛选栏|一屏|跳转|往返|点击|悬浮|Tab|页签|卡片|列设置)/;
const EMPTY_WORDS = /(大幅|极致|更加|显著|全新|赋能|体验升级|明显提升)/;
const STAGE_WORDS = /(追踪|结果|查看|定位|详情|下发|提交|编辑|导入|导出|新建)/;
const ABSTRACT_TITLES = /^(说得清|看不全|敢信|敢信状态|看得清|追得下去|分得清|分得清看不见|不用自己拼|更快|更准|更省)$/;

function readOrDie(p, usage) {
  if (!p || !fs.existsSync(p)) { console.log('用法: ' + usage); process.exit(2); }
  return fs.readFileSync(p, 'utf8');
}

/* ============================ EX ============================ */
function runEX() {
  const stage = process.argv[3];
  const file = process.argv[4];
  const upstream = process.argv[5];
  console.log('============================================================');
  console.log(' 织雨 · 执行环节准出门禁 EX-' + stage + '（口径见 准出门禁总表.md）');
  console.log(' 目标文件: ' + file);
  console.log('============================================================');

  if (stage === '1.1') {
    const md = readOrDie(file, 'node tools/gate.js ex 1.1 <01-场景与Job.md>');
    head('EX-1.1 场景与 Job');
    const nameRe = /^\|\s*\*{0,2}(S\d+)\.\s*([^|*]+)/gm;
    const scenes = [];
    let m;
    while ((m = nameRe.exec(md))) scenes.push({ id: m[1], name: m[2].trim() });
    if (scenes.length < 2 || scenes.length > 5) bad('EX-1.1-01', '主场景 ' + scenes.length + ' 条，应为 2~5 条');
    else ok('EX-1.1-01', '主场景 ' + scenes.length + ' 条');
    const badName = scenes.filter((s) => STAGE_WORDS.test(s.name));
    if (badName.length) bad('EX-1.1-02', '场景名含阶段词：' + badName.map((s) => s.name).join('、'));
    else ok('EX-1.1-02', '场景名无阶段/操作词');
    // 逐行取单元格：cells[0]=场景 cells[1]=角色 cells[2]=Job cells[3]=痛点
    const sRows = md.split(/\r?\n/).filter((l) => /^\|\s*\*{0,2}S\d+\./.test(l));
    const jobBad = [], painBad = [];
    sRows.forEach((l) => {
      const cells = l.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.replace(/\*\*/g, '').trim());
      const id = (cells[0] || '').split('.')[0];
      const job = cells[2] || '';
      const pain = cells[3] || '';
      if (job.length < 10 || !/(维护|交付|把|一份|台账|清单|建立|取证|交代|形成一个)/.test(job)) jobBad.push(id);
      if (pain.length < 6) painBad.push(id);
    });
    if (jobBad.length) bad('EX-1.1-03', 'Job 不像"一份要交付的东西 + 覆盖工作"：' + jobBad.join('、'));
    else ok('EX-1.1-03', '每个场景的 Job 均成形（一份东西 + 工作内容）');
    if (painBad.length) wr('EX-1.1-04', '这些场景的痛点为空或过短（人检补齐 + 标"用户困在"）：' + painBad.join('、'));
    else wr('EX-1.1-04', '痛点已填，仍需人检：每条标出"用户困在"（烦/看不全/不敢信/说不清）');
    if (/REQ-\d|S\d+-P\d/.test(md)) bad('EX-1.1-05', '编号外泄（REQ-xxx / Sx-Py）');
    else ok('EX-1.1-05', '无编号外泄');
  }

  if (stage === '1.2') {
    const md = readOrDie(file, 'node tools/gate.js ex 1.2 <02-体验目标.md> [01-场景与Job.md]');
    head('EX-1.2 体验目标');
    const lineRe = /^\s*[-*]?\s*\*\*([^*]+)\*\*\s*[：:]\s*(.+)$/gm;
    const targets = [];
    let m;
    while ((m = lineRe.exec(md))) targets.push({ title: m[1].trim(), body: m[2].trim() });
    if (!targets.length) bad('EX-1.2-02', '未找到 `**场景名**：一句话` 格式的目标行');

    let upScenes = [];
    if (upstream && fs.existsSync(upstream)) {
      const up = fs.readFileSync(upstream, 'utf8');
      const r = /^\|\s*\*{0,2}(S\d+)\.\s*([^|*]+)/gm;
      let x;
      while ((x = r.exec(up))) upScenes.push(x[2].trim());
    }
    if (upScenes.length && targets.length !== upScenes.length) bad('EX-1.2-01', '目标 ' + targets.length + ' 条 ≠ 场景 ' + upScenes.length + ' 条');
    else if (!upScenes.length && (targets.length < 2 || targets.length > 5)) bad('EX-1.2-01', '目标 ' + targets.length + ' 条，应在 2~5（或传上游场景文件做严格比对）');
    else ok('EX-1.2-01', '目标 ' + targets.length + ' 条，与场景数一致');

    const seen = {};
    targets.forEach((t, i) => {
      if (upScenes.length && upScenes.indexOf(t.title) === -1) bad('EX-1.2-02', '第 ' + (i + 1) + ' 条标题「' + t.title + '」不是 1.1 的场景名');
      else if (!upScenes.length && ABSTRACT_TITLES.test(t.title)) bad('EX-1.2-02', '第 ' + (i + 1) + ' 条标题「' + t.title + '」是自造短语，不是场景名');
      if (seen[t.title]) bad('EX-1.2-01', '场景「' + t.title + '」出现多条目标');
      seen[t.title] = 1;
      const ui = t.body.match(UI_WORDS);
      if (ui) bad('EX-1.2-03', '第 ' + (i + 1) + ' 条出现界面控件词「' + ui[0] + '」');
      const emp = t.body.match(EMPTY_WORDS);
      if (emp) bad('EX-1.2-04', '第 ' + (i + 1) + ' 条出现虚词「' + emp[0] + '」');
      if (!/(不再|不必|无需|不用)/.test(t.body)) wr('EX-1.2-04', '第 ' + (i + 1) + ' 条读不出"谁因此不必再做什么"');
      if (t.body.length < 25) wr('EX-1.2-04', '第 ' + (i + 1) + ' 条偏短，可能是口号');
    });
    if (targets.length && !fail) ok('EX-1.2-02/03', '标题均为场景名、无界面控件词');
  }

  if (stage === '1.3') {
    const md = readOrDie(file, 'node tools/gate.js ex 1.3 <03-突破点.md>');
    head('EX-1.3 体验突破点');
    const ids = [...new Set((md.match(/B\d+/g) || []))];
    if (ids.length < 2 || ids.length > 5) bad('EX-1.3-01', '突破点 ' + ids.length + ' 处，应为 2~5 处');
    else ok('EX-1.3-01', '突破点 ' + ids.length + ' 处：' + ids.join(' / '));
    const lines = md.split(/\r?\n/);
    ids.forEach((b) => {
      const line = lines.find((l) => l.indexOf(b) !== -1);
      if (!line) return;
      if (!/(目标|入口\s*[12]|D\d\d-EP|EP-)/.test(line)) bad('EX-1.3-02', b + ' 没有标来源（目标 / 入口 1 / 入口 2）');
      if (!/(场景|S[1-9])/.test(line) && !/场景/.test(md)) bad('EX-1.3-03', b + ' 落不到具体场景');
    });
    if (!/档/.test(md)) wr('EX-1.3-04', '未见四档点子（基线/优化/创新/变革），人检是否想透');
    if (!fail) ok('EX-1.3-02/03', '每条有来源且可落场景');
  }

  if (stage === '1.4') {
    const html = readOrDie(file, 'node tools/gate.js ex 1.4 <草图-x.html>');
    head('EX-1.4 草图与方向闸门');
    if (!/高水位/.test(html) || !/稳水位/.test(html) || !/方案一/.test(html) || !/方案二/.test(html)) {
      bad('EX-1.4-01', '未识别出"方案一·高水位 + 方案二·稳水位"两套');
    } else ok('EX-1.4-01', '两套方案齐（高水位 / 稳水位）');
    if (/基线版/.test(html)) bad('EX-1.4-01', '出现基线版（不该被摆出来选）');
    const same = (html.match(/两方案相同/g) || []).length;
    if (same < 1) bad('EX-1.4-03', '未见"两方案相同"标注，共性页可能被省略');
    else ok('EX-1.4-03', '共性页已标"两方案相同" ' + same + ' 处');
    if (/见共用页面|见下方共用/.test(html)) bad('EX-1.4-03', '出现"见共用页面"跳转，链路断裂');
    const diffs = (html.match(/与另一方案的\s*3\s*条差异/g) || []).length;
    if (diffs < 2) bad('EX-1.4-02', '每个 tab 顶部应有"与另一方案的 3 条差异"，实得 ' + diffs + ' 处');
    else wr('EX-1.4-02', '两套各有 3 条差异摘要；档位差与"人少干了哪件事"需人检');
    if (!/请选择一个方案/.test(html)) wr('EX-1.4-05', '未见"请选择一个方案"选择区');
    wr('EX-1.4-05', '人检：用户是否明确选定一套？选定结果要写进下游「方案来源：」，否则不得进 Part2');
  }

  if (stage === '4.1') {
    const html = readOrDie(file, 'node tools/gate.js ex 4.1 <草图或页面清单.html>');
    head('EX-4.1 页面清单与装配（覆盖率 / 继承对账）');
    // EX-4.1-01 覆盖率：动作覆盖表
    const rows = html.match(/<tr>[\s\S]*?<\/tr>/g) || [];
    const coverRows = rows.filter((r) => {
      const cells = (r.match(/<td[^>]*>[\s\S]*?<\/td>/g) || []).map(strip);
      return cells.length >= 4 && /(安装|升级|卸载|解绑|批量|配置|导入|导出|标签|新增|编辑|删除|查看|合并|拆分|指派|处置|停用|启用)/.test(cells[1] || '');
    });
    if (!coverRows.length) {
      bad('EX-4.1-01', '未识别到「业务对象 × 动作/状态」覆盖表：定稿页面清单前必须逐项认领页面落点');
    } else {
      const noPage = [];
      const noMark = [];
      coverRows.forEach((r) => {
        const cells = (r.match(/<td[^>]*>[\s\S]*?<\/td>/g) || []).map(strip);
        const act = (cells[1] || '').slice(0, 10);
        if (!(cells[2] || '').trim()) noPage.push(act);
        if (!/(是|否|本期不做)/.test(cells[3] || '')) noMark.push(act);
      });
      if (noPage.length) bad('EX-4.1-01', '这些动作没有页面落点：' + noPage.join('、'));
      else ok('EX-4.1-01', '动作覆盖表 ' + coverRows.length + ' 项，均有页面落点');
      if (noMark.length) wr('EX-4.1-01', '这些动作未标"本期是否做"：' + noMark.join('、'));
      const noDo = coverRows.filter((r) => /<td[^>]*>[^<]*本期不做/.test(r) || /未做|不做/.test(strip(r))).length;
      if (noDo) wr('EX-4.1-01', '有 ' + noDo + ' 项标了"本期不做"，交付时须口头点一次，不许埋在表里');
    }
    // EX-4.1-02 继承对账：页面清单齐（页面 / 名称 / 形态 / 职责）
    const pageRows = rows.filter((r) => /^\s*<tr[^>]*>\s*<td[^>]*>\s*P\d+\s*<\/td>/.test(r));
    const uniq = new Set();
    pageRows.forEach((r) => {
      const cells = (r.match(/<td[^>]*>[\s\S]*?<\/td>/g) || []).map(strip);
      const id = cells[0];
      if (uniq.has(id)) return;
      uniq.add(id);
      if (cells.length < 4 || !cells[2] || !cells[3]) wr('EX-4.1-02', '页面 ' + id + ' 缺"形态"或"职责"，无法与草图对账');
    });
    if (uniq.size) ok('EX-4.1-02', '页面清单 ' + uniq.size + ' 页，字段可对账');
    else bad('EX-4.1-02', '未找到页面清单');
    wr('EX-4.1-02', '人检：页面数 / 主结构 / 进入关系 / 突破点落点与 1.4 选定草图逐项对，结构差异 >30% 回 1.4（内部回退，不新增停顿）');
    return finish('EX-4.1');
  }

  if (['1.1', '1.2', '1.3', '1.4'].indexOf(stage) === -1) {
    console.log('不支持的环节：' + stage + '（可用 1.1 / 1.2 / 1.3 / 1.4 / 4.1；EX-HO、EX-BC、EX-6.0 为静默自检或人检项）');
    process.exit(2);
  }
  return finish('EX-' + stage);
}

/* ============================ SP ============================ */
function runSP() {
  const specPath = process.argv[3];
  const html = readOrDie(specPath, 'node tools/gate.js sp <design-spec-x.html>');
  console.log('============================================================');
  console.log(' 织雨 · 说明书整体准出门禁 SP（口径见 准出门禁总表.md）');
  console.log(' 目标文件: ' + specPath);
  console.log('============================================================');
  const noSketch = html.replace(/<details class="sketch-fold">[\s\S]*?<\/details>/g, '');

  /* SP-S */
  head('SP-S 结构与规模');
  const parts = (html.match(/<h2[^>]*class="part"/g) || []).length;
  if (parts === 2) ok('SP-S-01', '两段式 Part1 / Part2');
  else bad('SP-S-01', 'part 标题 ' + parts + ' 个，应为 2（或旧五章）');
  const scenes = [];
  let m;
  const sRe = /<td><b>(S\d+)\.\s*([^<]+)<\/b><\/td>/g;
  while ((m = sRe.exec(html))) scenes.push({ id: m[1], name: strip(m[2]) });
  if (scenes.length < 2 || scenes.length > 5) bad('SP-S-03', '主场景 ' + scenes.length + ' 条，应为 2~5');
  else ok('SP-S-03', '主场景 ' + scenes.length + ' 条');
  const badName = scenes.filter((s) => STAGE_WORDS.test(s.name));
  if (badName.length) bad('SP-S-03', '场景名含阶段词：' + badName.map((s) => s.name).join('、'));
  const roleCards = (html.match(/class="role-card/g) || []).length;
  if (roleCards === 2) ok('SP-S-04', '角色卡片 2 张（主 + 次）');
  else bad('SP-S-04', '角色卡片 ' + roleCards + ' 张，应固定 2 张');
  // 页面清单只认第 5 节，避免把交互逻辑表里的 P1/P2 行误计
  const sec5only = (html.split(/<h3[^>]*>\s*5\./)[1] || '').split(/<h2[^>]*class="part"/)[0];
  const pIds = new Set();
  (sec5only.match(/<tr>[\s\S]*?<\/tr>/g) || []).forEach((r) => {
    const x = r.match(/<td>(P\d+)<\/td>/);
    if (x) pIds.add(x[1]);
  });
  const pageH4 = (html.match(/<h4>\s*7\.\d+\s+Page-\d+/g) || []).length;
  if (pIds.size >= 1 && pageH4 >= 1 && pIds.size === pageH4) ok('SP-S-02', '页面清单 ' + pIds.size + ' 页 = 分页面小节 ' + pageH4 + ' 个');
  else bad('SP-S-02', '页面清单 ' + pIds.size + ' 页 ≠ 第 7 节页面小节 ' + pageH4 + ' 个');
  wr('SP-S-05', '人检内容预算：目标 ≤5 / 突破点 ≤5 / 每页映射 ≤8 行 / 无废列');

  /* SP-A */
  head('SP-A 资产真实性');
  wr('SP-A-01~06', '组件 / 模板 / 色值 / 按钮 / 引用 / 经验落点 六项由 design-spec-selfcheck.sh 机检，见文末汇总');

  /* SP-W */
  head('SP-W 线框与可视化');
  if (/__/.test(noSketch)) {
    const n = (noSketch.match(/__/g) || []).length;
    bad('SP-W-04', '线框区仍有 ' + n + ' 处 `__` 占位（草图区免检）');
  } else ok('SP-W-04', '线框区无占位符');
  wr('SP-W-01~05', '表单结构 / 线框规范 / 可视化件 / UI 文案 由 selfcheck 机检');

  /* SP-C */
  head('SP-C 内容一致性（Part1 与 Part2 是否对得上）');
  const t3 = html.split(/<h3[^>]*>\s*3\./)[1] || '';
  const sec3 = t3.split(/<h3[^>]*>\s*4\./)[0] || '';
  const lis = (sec3.match(/<li>[\s\S]*?<\/li>/g) || []);
  if (!sec3) bad('SP-C-01', '未定位到第 3 节体验目标');
  else {
    if (lis.length !== scenes.length) bad('SP-C-01', '目标 ' + lis.length + ' 条 ≠ 场景 ' + scenes.length + ' 条');
    else ok('SP-C-01', '目标条数 = 场景数');
    const seen = [];
    lis.forEach((li, i) => {
      const b = li.match(/<b>([\s\S]*?)<\/b>/);
      const text = strip(li);
      const title = b ? strip(b[1]) : '';
      if (!scenes.some((s) => s.name === title)) {
        bad('SP-C-01', '第 ' + (i + 1) + ' 条标题「' + title + '」不是场景名（1.2：逐字照抄，不自造短语）');
      } else seen.push(title);
      const ui = text.match(UI_WORDS);
      if (ui) bad('SP-C-02', '第 ' + (i + 1) + ' 条出现界面控件词「' + ui[0] + '」');
    });
    scenes.forEach((s) => { if (seen.indexOf(s.name) === -1) bad('SP-C-01', '场景「' + s.name + '」没有对应目标'); });
  }
  const bx = [...new Set((html.match(/<td>\s*B\d+\s*<\/td>/g) || []).map((x) => x.replace(/[^B0-9]/g, '')))];
  if (bx.length < 2 || bx.length > 5) bad('SP-C-03', '突破点 ' + bx.length + ' 处，应为 2~5');
  const rows = (html.match(/<tr>[\s\S]*?<\/tr>/g) || []);
  bx.forEach((b) => {
    const row = rows.find((r) => r.indexOf('<td>' + b + '</td>') !== -1);
    if (!row) { bad('SP-C-03', '找不到 ' + b + ' 的行'); return; }
    const tds = (row.match(/<td[^>]*>[\s\S]*?<\/td>/g) || []).map(strip);
    const src = tds[tds.length - 1] || '';
    if (!src || src === '—') bad('SP-C-03', b + ' 缺来源');
  });
  const s62 = (html.split(/<h4[^>]*>\s*6\.2/)[1] || '').split(/<h3[^>]*>\s*7\./)[0];
  if (!s62) bad('SP-C-04', '未定位到 6.2');
  else {
    bx.forEach((b) => { if (s62.indexOf(b) === -1) bad('SP-C-03', b + ' 未在 6.2 落到场景'); });
    scenes.forEach((s) => {
      const n = s.id.replace('S', '');
      if (!new RegExp('场景\\s*' + n).test(s62)) bad('SP-C-04', '场景 ' + s.id + '「' + s.name + '」在 6.2 没有对应行');
    });
  }
  const sec5 = (html.split(/<h3[^>]*>\s*5\./)[1] || '').split(/<h2[^>]*class="part"/)[0];
  const pRows = (sec5.match(/<tr>[\s\S]*?<\/tr>/g) || []).filter((r) => /<td>P\d+<\/td>/.test(r));
  const done = new Set();
  pRows.forEach((r) => {
    const id = r.match(/<td>(P\d+)<\/td>/)[1];
    if (done.has(id)) return;
    done.add(id);
    if (!/B\d/.test(strip(r))) bad('SP-C-05', '页面 ' + id + ' 未承接任何突破点');
  });
  if (!/方案来源：/.test(html)) bad('SP-C-06', '缺「方案来源：」（用户选定 / 明示跳过），闸门不可追溯');
  else ok('SP-C-06', strip((html.match(/方案来源：?[^<\n]{0,40}/) || [''])[0]));

  /* SP-D */
  head('SP-D 自包含（六节编码契约）');
  const NEED = [
    ['SP-D-01', /交互逻辑与状态机/, '①交互逻辑与状态机'],
    ['SP-D-01', /数据口径与演示数据集/, '②数据口径与演示数据集'],
    ['SP-D-01', /组件、\s*Token 与全局样式/, '③组件、Token 与全局样式'],
    ['SP-D-01', /固定文案与状态词表/, '④固定文案与状态词表'],
    ['SP-D-01', /验收清单/, '⑤验收清单'],
    ['SP-D-01', /实现边界/, '⑥实现边界'],
  ];
  const miss = NEED.filter((x) => !x[1].test(html)).map((x) => x[2]);
  if (miss.length) bad('SP-D-01', '缺编码契约：' + miss.join('、'));
  else ok('SP-D-01', '六节编码契约齐备');
  wr('SP-D-02~06', '人检：状态机逐页边界 / 每个数字有真源 / 责任边界句逐字 / 自测步骤可照做 / 不做清单齐');

  return finish('SP');
}

function finish(tag) {
  console.log('\n============================================================');
  if (fail === 0) {
    console.log('🎉 ' + tag + ' 机检通过' + (warn ? '（另有 ' + warn + ' 项人检提示，交付时需人工核对）' : '') + '。');
    process.exit(0);
  }
  console.log('🚫 ' + tag + ' 未通过（' + fail + ' 项）。按编号退回对应环节，不许带病往下一步。');
  process.exit(1);
}

if (MODE === 'ex') runEX();
else if (MODE === 'sp') runSP();
else {
  console.log('用法: node tools/gate.js <ex|sp> <环节|说明书> <文件> [上游文件]');
  process.exit(2);
}
