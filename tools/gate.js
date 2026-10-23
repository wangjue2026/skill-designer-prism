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

// EX-1.2-03：界面痕迹 = 名词控件 + 动词路径 + 通知渠道（名词词表抓不到后两类）
const UI_WORDS = /(弹窗|抽屉|标签页|按钮|下拉框|复选框|搜索框|筛选栏|一屏|跳转|往返|点击|悬浮|Tab|页签|卡片|列设置|点开|点进|打开|进去|上来一趟|切到|排在前|发到|收到|滑出|弹出|手机|短信|邮件)/;
// EX-1.2-04：虚词 + 绝对词（绝对词不可验收，也不会让句子更高）
const EMPTY_WORDS = /(大幅|极致|更加|显著|全新|赋能|体验升级|明显提升|任何时刻|全过程|一次说清|百分之百)/;
// EX-1.2-04：脚手架开头（判档判据被抄进句子）
const SCAFFOLD_WORDS = /^[^，。；]{0,12}(不用|不再|无需|不必)/;
// EX-1.2-05：门槛跃迁必含词
const GATEKEEP_WORDS = /(0\s*基础|零基础|无需经验|不需经验|一线|不出二线|普通用户|新同事|非专家|新手)/;
// EX-1.2-06：可测锚必含词
const ANCHOR_WORDS = /(\d+|一位|一名|一台|一个时间点|三个|三样|两项|一次|一条|一件|五段|十分钟|一刻钟)/;
// EX-1.2-07：幼稚化（语域）计数
const PRONOUN_WORDS = /(这一次|那一个|这一段|这一条|同一条|某个人|某个应用|这一个)/g;
const VERB_COMP_WORDS = /(调回|找回|查回|说清|讲清|交出去|发出去|关上|接上|排在前|上来一趟|捞出来|落下来|接住)/g;
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
      if (ui) bad('EX-1.2-03', '第 ' + (i + 1) + ' 条出现界面痕迹「' + ui[0] + '」（控件/交互路径/通知渠道）');
      const emp = t.body.match(EMPTY_WORDS);
      if (emp) bad('EX-1.2-04', '第 ' + (i + 1) + ' 条出现虚词或绝对词「' + emp[0] + '」');
      const sc = t.body.match(SCAFFOLD_WORDS);
      if (sc) bad('EX-1.2-04', '第 ' + (i + 1) + ' 条以「' + sc[1] + '」作句首骨架（判据不得抄进句子，须写能力陈述句）');
      else if (!/(不再|不必|无需|不用)/.test(t.body)) wr('EX-1.2-04', '第 ' + (i + 1) + ' 条读不出"谁因此不必再做什么"');
      if (t.body.length < 25) wr('EX-1.2-04', '第 ' + (i + 1) + ' 条偏短，可能是口号');
      if (!GATEKEEP_WORDS.test(t.body)) bad('EX-1.2-05', '第 ' + (i + 1) + ' 条缺门槛跃迁（原角色→新角色：0 基础/无需经验/一线/不出二线/新同事/非专家）');
      if (!ANCHOR_WORDS.test(t.body)) bad('EX-1.2-06', '第 ' + (i + 1) + ' 条缺可测锚（一位/三个/一次/五段/一条策略/十分钟…）');
      const pr = (t.body.match(PRONOUN_WORDS) || []).length;
      const vc = (t.body.match(VERB_COMP_WORDS) || []).length;
      if (pr > 2) bad('EX-1.2-07', '第 ' + (i + 1) + ' 条指示代词 ' + pr + ' 个（≤2），须换成业务名词');
      if (vc > 2) bad('EX-1.2-07', '第 ' + (i + 1) + ' 条动补短语 ' + vc + ' 个（≤2），口语化，非承诺书语域');
    });
    if (targets.length && !fail) ok('EX-1.2-02/03/04/05/06/07', '标题为场景名、无界面痕迹、无虚词、无脚手架开头、门槛与锚齐全、语域达标');
  }

  if (stage === '1.3') {
    const md = readOrDie(file, 'node tools/gate.js ex 1.3 <03-突破点.md>');
    head('EX-1.3 体验突破点');
    const ids = [...new Set((md.match(/B\d+/g) || []))];
    if (ids.length < 2 || ids.length > 5) bad('EX-1.3-01', '突破点 ' + ids.length + ' 处，应为 2~5 处');
    else ok('EX-1.3-01', '突破点 ' + ids.length + ' 处：' + ids.join(' / '));
    const lines = md.split(/\r?\n/);
    ids.forEach((b) => {
      const idx = lines.findIndex((l) => l.indexOf(b) !== -1);
      if (idx < 0) return;
      // 突破点与设计点子 1 对 1 合并后，来源可能写在紧随其后的一行，按块取
      const block = lines.slice(idx, idx + 6).join("\n");
      if (!/(目标|入口\s*[12]|D\d\d-EP|EP-)/.test(block)) bad("EX-1.3-02", b + " 没有标来源（目标 / 入口 1 / 入口 2）");
      if (!/(场景|S[1-9])/.test(block) && !/场景/.test(md)) bad("EX-1.3-03", b + " 落不到具体场景");
    });
    if (!/档/.test(md)) wr('EX-1.3-04', '未见三档点子（常规/优化/创新），人检是否真拉开');
    if (!fail) ok('EX-1.3-02/03', '每条有来源且可落场景');
  }

  if (stage === '1.4') {
    const html = readOrDie(file, 'node tools/gate.js ex 1.4 <草图-x.html>');
    head('EX-1.4 草图与方向闸门');
    // 01 两套方案（名称只叫方案一 / 方案二）
    const a1 = (html.match(/方案一/g) || []).length;
    const a2 = (html.match(/方案二/g) || []).length;
    if (a1 < 2 || a2 < 2) bad('EX-1.4-01', '未识别出两套方案（方案一 / 方案二 各需出现 ≥2 次）');
    else ok('EX-1.4-01', '两套方案齐（方案一 ' + a1 + ' 处 / 方案二 ' + a2 + ' 处）');
    if (/基线版/.test(html)) bad('EX-1.4-01', '出现基线版（不该被摆出来选）');
    // 02 对比表（整体设计说明 + 设计思考点）
    if (!/整体设计说明/.test(html)) bad('EX-1.4-02', '顶部缺「整体设计说明」对比表');
    if (!/思考点/.test(html)) bad('EX-1.4-02', '缺「设计思考点」对比表（两套各列各的，条数可不等）');
    if (/整体设计说明/.test(html) && /思考点/.test(html)) ok('EX-1.4-02', '对比表齐（整体说明 + 思考点）');
    // 03 相同页交代（占位条），不许跳转
    const same = (html.match(/两方案相同|与方案一相同|不重复画/g) || []).length;
    if (same < 1) wr('EX-1.4-03', '未见相同页的占位交代（如"P4 ×××：与方案一相同"）');
    else ok('EX-1.4-03', '相同页已有占位交代 ' + same + ' 处');
    if (/见共用页面|见下方共用/.test(html)) bad('EX-1.4-03', '出现"见共用页面"跳转，链路断裂');
    // 04 图下标号说明
    const notes = (html.match(/做法/g) || []).length;
    if (notes < 3) bad('EX-1.4-04', '图下标号说明不足（"做法"实得 ' + notes + ' 处）');
    else ok('EX-1.4-04', '图下标号说明 ' + notes + ' 段');
    // 05 禁用内部词（先剥掉 style/script，避免色值误判）
    const plain = html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '');
    const banned = ['采信', '回执', '留痕', '处置', '裁决', '认领'];
    const hit = banned.filter(function (w) { return plain.indexOf(w) >= 0; });
    const bx = plain.match(/\bB[1-5]\b/g) || [];
    if (bx.length) hit.push(bx.join('、'));
    if (hit.length) bad('EX-1.4-05', '出现内部词 / 经验编号：' + hit.join('、'));
    else ok('EX-1.4-05', '无内部词与经验编号');
    // 06 页面规模置顶 + 用户选定（人检）
    if (!/本次需求一共\s*N?\s*[\d一二三四五六七八九十]+\s*个页面/.test(html)) wr('EX-1.4-06', '未见"本次需求一共 N 个页面"置顶');
    wr('EX-1.4-06', '人检：用户是否明确选定一套？选定结果要写进下游「方案来源：」，否则不得进 Part2');

    // 07 文案表达（用户视角，机检可判的部分）
    var blocks = html.split(/<div class="page"/).slice(1);
    var noWhy = [], noPair = [], tooLong = [], badgeMiss = [];
    blocks.forEach(function (blk, idx) {
      var head0 = (blk.match(/page-hd[\s\S]*?<\/div>/) || [''])[0];
      var pid = (head0.match(/class="pid">([^<]+)</) || [, '第' + (idx + 1) + '块'])[1];
      var notes = (blk.match(/<ul class="notes">[\s\S]*?<\/ul>/g) || []).join('');
      if (!notes) { noWhy.push(pid); return; }
      // 只数"做法/为什么"这两个标签，避免正文里引用「为什么」造成误判
      var how = (notes.match(/<b>做法<\/b>/g) || []).length;
      var why = (notes.match(/<b>为什么<\/b>/g) || []).length;
      if (why === 0) noWhy.push(pid);
      else if (how !== why) noPair.push(pid + '(' + how + '/' + why + ')');
      // 图上标号 vs 图下说明编号
      var pts = {}, ns = {};
      (blk.match(/<i class="pt">(\d+)<\/i>/g) || []).forEach(function (s) { pts[(s.match(/(\d+)/) || [])[1]] = 1; });
      (blk.match(/<span class="n">(\d+)<\/span>/g) || []).forEach(function (s) { ns[(s.match(/(\d+)/) || [])[1]] = 1; });
      var pk = Object.keys(pts).sort().join(','), nk = Object.keys(ns).sort().join(',');
      if (pk !== nk) badgeMiss.push(pid + '（图上 ' + (pk || '无') + ' / 图下 ' + (nk || '无') + '）');
      // 单条说明过长（一段超过 160 字，说明没想清）
      (notes.match(/<li>[\s\S]*?<\/li>/g) || []).forEach(function (li) {
        var t = li.replace(/<[^>]*>/g, '').replace(/\s+/g, '');
        if (t.length > 200) tooLong.push(pid);
      });
    });
    if (noWhy.length) bad('EX-1.4-07', '这些页面没有图下"为什么"说明：' + noWhy.join('、'));
    if (noPair.length) bad('EX-1.4-07', '「做法」与「为什么」条数不配对：' + noPair.join('、'));
    if (badgeMiss.length) bad('EX-1.4-07', '图上标号与图下说明编号不一致：' + badgeMiss.join('；'));
    if (tooLong.length) wr('EX-1.4-07', '这些页面的单条说明过长（>200 字），拆成两句：' + Array.from(new Set(tooLong)).join('、'));
    // 空洞词 / 营销词
    var hollow = ['提升体验', '优化体验', '更清晰', '更高效', '更智能', '更省心', '大幅提升', '赋能', '极致', '闭环', '收口', '影响面', '态势'];
    var hollowHit = hollow.filter(function (w) { return plain.indexOf(w) >= 0; });
    if (hollowHit.length) bad('EX-1.4-07', '出现空洞词 / 营销词：' + hollowHit.join('、') + '（换成"能看见什么、能做什么"）');
    // 主按钮文案必须说明做什么，不许只写"确定/提交/保存"
    var dumbBtn = plain.match(/>(确定|提交|保存|是|否)</g) || [];
    if (dumbBtn.length) wr('EX-1.4-07', '有按钮只写"' + dumbBtn[0].replace(/[><]/g, '') + '"，应写明做什么（如"确定并下发"）');
    if (!noWhy.length && !noPair.length && !badgeMiss.length && !hollowHit.length) {
      ok('EX-1.4-07', '文案：每页有做法+为什么、标号与说明一一对应、无空洞词');
    }
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
  if (parts === 2) {
    const hasTabs = /class="doc-tabs"/.test(html);
    const p2Default = /<section[^>]*id="pane-part2"[^>]*class="tab-pane on"|<section[^>]*class="tab-pane on"[^>]*id="pane-part2"/.test(html);
    if (!hasTabs || !p2Default) bad('SP-S-01', '缺少 Part1 / Part2 双 Tab，或默认未选中 Part2（应为 .doc-tabs + 段落 section#pane-part2 带 class on）');
    else ok('SP-S-01', '两段式 Part1 / Part2 · 双 Tab 默认选中 Part2');
  } else bad('SP-S-01', 'part 标题 ' + parts + ' 个，应为 2（或旧五章）');
  // 门禁结论与确认话术只在对话里给，不进交付文档
  if (/class="checkpoint"|<h3[^>]*>\s*8\.\s*设计说明书准出门禁检视/.test(html)) {
    bad('SP-S-01', '说明书内仍有第 8 节门禁检视 / 末尾 checkpoint 浮层——这两块只在对话里说，不进交付文档');
  }
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
