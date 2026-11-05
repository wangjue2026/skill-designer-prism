#!/usr/bin/env node
/**
 * 织雨 · 门禁引擎（两用：执行环节准出 EX / 说明书整体准出 SP）
 *
 * 口径唯一来源：04-workflows-and-cases/准出门禁总表.md
 * 本脚本只做机检（M）项；人检（H）项在输出里以 ⚠️ 提示，由交付时人工核对。
 *
 * 用法:
 *   node tools/gate.js ex 1.1 _output/<业务名>/01-主场景-x.md
 *   node tools/gate.js ex 1.2 _output/<业务名>/02-体验目标-x.md _output/<业务名>/01-主场景-x.md
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
// EX-1.1-02：主场景名必须命中职责词（面状命名），否则还是"点"
const DUTY_WORDS = /(运营|运维|管理|治理|盘点|交付|上架|值守|复核|审计|维护)/;
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
    const md = readOrDie(file, 'node tools/gate.js ex 1.1 <01-主场景.md>');
    head('EX-1.1 主场景拆解');
    const nameRe = /^\|\s*\*{0,2}(S\d+)\.\s*([^|*]+)/gm;
    const scenes = [];
    let m;
    while ((m = nameRe.exec(md))) scenes.push({ id: m[1], name: m[2].trim() });
    if (scenes.length < 2 || scenes.length > 5) bad('EX-1.1-01', '主场景 ' + scenes.length + ' 条，应为 2~5 条');
    else ok('EX-1.1-01', '主场景 ' + scenes.length + ' 条');
    const badName = scenes.filter((s) => STAGE_WORDS.test(s.name));
    const noDuty = scenes.filter((s) => !DUTY_WORDS.test(s.name));
    if (badName.length) bad('EX-1.1-02', '场景名含阶段词：' + badName.map((s) => s.name).join('、'));
    else if (noDuty.length) bad('EX-1.1-02', '场景名缺职责词（运营/运维/管理/治理/盘点/交付/上架/值守/复核/审计/维护），仍是"点"：' + noDuty.map((s) => s.name).join('、'));
    else ok('EX-1.1-02', '场景名为职责级命名（含职责词、无阶段词）');
    // 逐行取单元格：cells[0]=场景 cells[1]=角色 cells[2]=主场景 cells[3]=痛点
    const sRows = md.split(/\r?\n/).filter((l) => /^\|\s*\*{0,2}S\d+\./.test(l));
    const dutyBad = [], painBad = [], thinDuty = [];
    sRows.forEach((l) => {
      const cells = l.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.replace(/\*\*/g, '').trim());
      const id = (cells[0] || '').split('.')[0];
      // 4 列交付表：场景 / 角色 / 要办成的事 / 痛点；6~7 列内部底稿多「触发情境」与「痛点概括」，列位后移
      const wide = cells.length >= 6;
      const duty = wide ? cells[3] || '' : cells[2] || '';
      const pain = wide ? cells[4] || '' : cells[3] || '';
      if (duty.length < 10 || !/(维护|交付|把|一份|台账|清单|建立|取证|交代|形成一个)/.test(duty)) dutyBad.push(id);
      const items = duty.split(/[、；;，,/]/).map((x) => x.trim()).filter((x) => x.length >= 2);
      if (items.length < 3) thinDuty.push(id);
      if (pain.length < 6) painBad.push(id);
    });
    if (dutyBad.length) bad('EX-1.1-03', '主场景内容不像"一份要交付的东西 + 覆盖工作"：' + dutyBad.join('、'));
    else ok('EX-1.1-03', '每条主场景均成形（一份东西 + 工作内容）');
    if (painBad.length) wr('EX-1.1-04', '这些场景的痛点为空或过短（人检补齐 + 标"用户困在"）：' + painBad.join('、'));
    else wr('EX-1.1-04', '痛点已填，仍需人检：每条标出"用户困在"（烦/看不全/不敢信/说不清）；场景须落在本次业务域内，域外职责只记一行');
    if (thinDuty.length) wr('EX-1.1-06', '这些场景的"要办成的事"子事项少于 3 项（还停在点上，回 Step 1 换职责）：' + thinDuty.join('、'));
    else ok('EX-1.1-06', '每条主场景覆盖 ≥3 个子事项');
    if (/REQ-\d|S\d+-P\d/.test(md)) bad('EX-1.1-05', '编号外泄（REQ-xxx / Sx-Py）');
    else ok('EX-1.1-05', '无编号外泄');
  }

  if (stage === '1.2') {
    const md = readOrDie(file, 'node tools/gate.js ex 1.2 <02-体验目标.md> [01-主场景.md]');
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
      // 只保留页面自身（到下一个 h2 / 分隔线为止，避免把文末映射表算进最后一页）
      blk = blk.split(/<hr[^>]*>|<h2[^>]*>/)[0];
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
    // 空洞词 / 营销词（「已闭环」是 PRD 状态枚举名而非营销话术，扫描前先剔除，否则合法状态名被误拦）
    var hollow = ['提升体验', '优化体验', '更清晰', '更高效', '更智能', '更省心', '大幅提升', '赋能', '极致', '闭环', '收口', '影响面', '态势'];
    var plainForHollow = plain.replace(/已闭环/g, '');
    var hollowHit = hollow.filter(function (w) { return plainForHollow.indexOf(w) >= 0; });
    if (hollowHit.length) bad('EX-1.4-07', '出现空洞词 / 营销词：' + hollowHit.join('、') + '（换成"能看见什么、能做什么"）');
    // 主按钮文案必须说明做什么，不许只写"确定/提交/保存"
    var dumbBtn = plain.match(/>(确定|提交|保存|是|否)</g) || [];
    if (dumbBtn.length) wr('EX-1.4-07', '有按钮只写"' + dumbBtn[0].replace(/[><]/g, '') + '"，应写明做什么（如"确定并下发"）');
    if (!noWhy.length && !noPair.length && !badgeMiss.length && !hollowHit.length) {
      ok('EX-1.4-07', '文案：每页有做法+为什么、标号与说明一一对应、无空洞词');
    }

    // 08 页面命名合规：名词化 / ≤6 字 / 无问句与指示代词（清单表的页面名须用 <b> 包裹）
    var nm = [];
    var rowRe = /<tr><td>P\d+<\/td><td><b>([^<]+)<\/b><\/td>/g;
    var mm;
    while ((mm = rowRe.exec(html))) nm.push(mm[1].trim());
    if (!nm.length) {
      // 无页面清单表时，从页面头取名字（<span class="pid">P1</span><h3>名称</h3>），两套同名只算一次
      var hdRe = /<span class="pid">(P\d+)<\/span>\s*<h3>([^<]+)<\/h3>/g;
      var seen = {};
      while ((mm = hdRe.exec(html))) { if (!seen[mm[1]]) { seen[mm[1]] = 1; nm.push(mm[2].trim()); } }
    }
    var badName = nm.filter(function (n) {
      var core = n.replace(/\s/g, '');
      return core.length > 6
        || /(谁|哪|怎么|什么|一次|这一片|这一条|还有|总览|口径)/.test(core)
        || /^(打开|查看|选择|进入|处理|交给|查询|新建|新增|编辑|删除)/.test(core);
    });
    if (!nm.length) wr('EX-1.4-08', '未识别到页面清单（需形如 <tr><td>P1</td><td><b>页面名</b></td>），无法校命名');
    else if (badName.length) bad('EX-1.4-08', '页面名不合规（须名词化 / ≤6 字 / 无问句与指示代词）：' + badName.join('、'));
    else ok('EX-1.4-08', '页面名合规 ' + nm.length + ' 个：' + nm.join(' / '));

    // 09 信息架构四件套（先 IA 后页面）
    var iaNeed = ['模块定位', '功能域', '映射'];
    if (/class="[^"]*tabbar/.test(html)) iaNeed.push('view-ledger');
    var iaMiss = iaNeed.filter(function (k) { return plain.indexOf(k) < 0; });
    if (iaMiss.length) bad('EX-1.4-09', '缺信息架构件：' + iaMiss.join('、') + '（四件套：模块定位 / 功能域树 / 页面×对象×动作映射 / 页内视图清单 view-ledger）');
    else ok('EX-1.4-09', '信息架构件齐（模块定位 / 功能域树 / 映射表' + (iaNeed.length > 3 ? ' / 页内视图清单' : '') + '）');

    // 10 不线上化的能力必须写线下承接
    if (/本期不做|不线上化/.test(plain) && !/线下/.test(plain)) bad('EX-1.4-10', '声明了本期不做 / 不线上化，但没写线下承接方式');
    else ok('EX-1.4-10', '不线上化能力已交代线下承接方式（或无此声明）');

    // 11 标题专业化：块标题必须写成 <b class="t">，并按名词规则校验（黑名单查不住无限组合的口语）
    var tArr = [];
    var tRe = /<b class="t">([^<]{1,30})<\/b>/g;
    var ttm;
    while ((ttm = tRe.exec(plain))) tArr.push(ttm[1].trim());
    var SPOKEN2 = /(我|你|他|这|那|哪|谁|什么|怎么|为什么|吗|呢|吧)/;
    var VERB_HEAD = /^(不是|按|一起|先问|交给|导出|标记|给我|挑一个|选一个|发给|看一下|看下|打开|新增|创建|发布新)/;
    var PUNCT = /[，。；？！,]/;
    var NOMINAL = /(范围|对象|分组|条件|级别|通知|静默|优先级|状态|记录|历史|校验|清单|模型|指标|阈值|权重|等级|分布|走势|归因|预演|比例|名单|依据|行程|结论|材料|方式|规则|配置|概览|事件|诊断|策略|趋势|详情|说明|摘要|设置|计划|目标|统计|汇总|切换|排序|判定|建议|原因|版本|发布|形态|探针|分段|步骤|操作|入口|维度|评分|内容|信息|区域|时段)/;
    var badT = tArr.filter(function (t) {
      return PUNCT.test(t) || SPOKEN2.test(t) || VERB_HEAD.test(t) || t.length > 12 || !NOMINAL.test(t);
    });
    if (!tArr.length) {
      wr('EX-1.4-11', '未识别到块标题（须写成 <b class="t">标题</b>　内容），无法校标题命名');
    } else if (badT.length) {
      bad('EX-1.4-11', '块标题不是名词短语（含标点/口语词/动词开头/超 12 字/无名词词尾）：' + badT.map(function (t) { return '「' + t + '」'; }).join('、'));
    } else {
      ok('EX-1.4-11', '块标题全部为名词短语 ' + tArr.length + ' 个');
    }

    // 12 配置类页面必备项不得省略：策略/配置页需同时出现 对象/触发/通知/生效/状态
    var cfgMiss = [];
    blocks.forEach(function (blk, idx) {
      blk = blk.split(/<hr[^>]*>|<h2[^>]*>/)[0];
      if (/class="same"/.test(blk)) return; // 占位条页面没有内容，不要求必备项
      var hd = (blk.match(/page-hd[\s\S]*?<\/div>/) || [''])[0];
      var nm = (hd.match(/<h3>([^<]+)<\/h3>/) || [, ''])[1];
      var pid0 = (hd.match(/class="pid">([^<]+)</) || [, 'P' + (idx + 1)])[1];
      var need = null;
      // 集合页（列表）只承载"找 / 看 / 启停"，通知与合并属于详情页，不在列表页要求
      var listPage = /列表/.test((hd.match(/class="form">([^<]+)</) || [, ''])[1]) || /集合页/.test(hd);
      if (/策略/.test(nm)) need = listPage
        ? [/(监测对象|对象范围|对象与分组)/, /(触发|判定条件)/, /(生效|启停|状态)/]
        : [/(监测对象|对象范围|对象与分组)/, /(触发|判定条件)/, /(通知|送达|收件人)/, /(生效|启停|状态)/, /(合并|静默|重复)/];
      else if (/采集/.test(nm)) need = [/(接入形态|探针|采集点)/, /(检查|校验)/, /(对象圈定|监测对象|对象范围)/, /(生效|状态|数据可见)/];
      else if (/模型/.test(nm)) need = [/(指标)/, /(阈值)/, /(权重|等级)/, /(版本|发布)/];
      if (need) {
        var missN = need.filter(function (re) { return !re.test(blk); }).length;
        if (missN >= 2) cfgMiss.push(pid0 + ' ' + nm + '（缺 ' + missN + ' 项）');
      }
    });
    if (cfgMiss.length) bad('EX-1.4-12', '配置类页面缺必备项（对象范围 / 触发条件 / 通知配置 / 生效状态）：' + cfgMiss.join('、'));
    else ok('EX-1.4-12', '配置类页面必备项齐（或本文件无配置页）');

    // 13 仿真数据：声明 + 无占位符 + 标识/时间戳密度
    var simDecl = /(仿真|示例|快照)/.test(plain);
    var ph = (plain.match(/__/g) || []).length;
    var ids = (plain.match(/[A-Z]{2,4}-\d{2,4}/g) || []).length;
    var ts = (plain.match(/\d{2}:\d{2}(:\d{2})?/g) || []).length;
    if (!simDecl) bad('EX-1.4-13', '未见仿真数据声明（页头须写示例环境 + 快照时间 + 规模）');
    else if (ph > 0) bad('EX-1.4-13', '仍有 ' + ph + ' 处 __ 占位，须替换为仿真数据');
    else if (ids < 2 || ts < 3) wr('EX-1.4-13', '仿真密度不足（对象标识 ' + ids + ' 处 / 时间戳 ' + ts + ' 处），建议补到 2+ 与 3+');
    else ok('EX-1.4-13', '仿真数据齐（声明 + 标识 ' + ids + ' / 时间戳 ' + ts + ' / 无占位符）');

    // 14 能力项必须在图上占位、且位置正确（列表页：筛选/时间在表格之前、排序有落点）
    var capMiss = [];
    blocks.forEach(function (blk, idx) {
      blk = blk.split(/<hr[^>]*>|<h2[^>]*>/)[0];
      if (/class="same"/.test(blk)) return; // 占位条页面不参与能力位检查
      var hd = (blk.match(/page-hd[\s\S]*?<\/div>/) || [''])[0];
      var nm = (hd.match(/<h3>([^<]+)<\/h3>/) || [, ''])[1];
      var form = (hd.match(/class="form">([^<]+)</) || [, ''])[1];
      var pid0 = (hd.match(/class="pid">([^<]+)</) || [, 'P' + (idx + 1)])[1];
      var isList = /列表/.test(form) || /(事件|台账|清单|名单|任务)$/.test(nm);
      // 剔除「P3 视图①」这类跨页引用（映射表里引用别页的视图名，不是本页多面信息）
      var blkPlain = strip(blk).replace(/P\d+\s*视图[①②③④⑤1-5]/g, '');
      // 页内 Tab：一个页面有多面信息时，必须画 Tab 切换条并标当前选中；不许用「视图①②」自造词
      var viewMarks = (blkPlain.match(/视图[①②③④⑤1-5]/g) || []).length;
      var tabMarks = (blkPlain.match(/页内\s*Tab|Tab\s*[:：]/g) || []).length;
      if (viewMarks >= 2 && tabMarks === 0) {
        capMiss.push(pid0 + ' 用「视图①②…」代替了页内 Tab（没画切换条，下游认不出这是 Tab）');
      } else if (viewMarks >= 1 && tabMarks > 0) {
        capMiss.push(pid0 + ' 仍保留「视图①②…」自造词，应统一写「页内 Tab：…」');
      }
      if (tabMarks >= 2 && !/(当前选中|选中态|class="[^"]*tab)/.test(blk)) {
        capMiss.push(pid0 + ' 写了页内 Tab 名但没画切换条 / 没标当前选中');
      }
      if (!isList || !/<table/.test(blk)) return;
      var filterRe = /(筛选|时间范围|日期范围|时间窗)/;
      var filterPos = blk.search(filterRe);
      if (filterPos < 0) {
        capMiss.push(pid0 + ' 无筛选/时间范围能力位');
      } else if (filterPos > blk.indexOf('<table')) {
        capMiss.push(pid0 + ' 筛选/时间在表格之后（应在页头右侧或表格工具栏）');
      }
      if (!/(排序|按[^，。]{0,8}排序|↓|↑)/.test(strip(blk))) capMiss.push(pid0 + ' 无排序能力位');
    });
    if (capMiss.length) bad('EX-1.4-14', '能力项占位不全或位置不对：' + capMiss.join('；') + '（能力项要占位，不许只写正文）');
    else ok('EX-1.4-14', '列表类页面筛选/排序能力位齐且位置正确（或本文件无列表页）');

    // 15 占位可交接（EX-1.4-17）：五类语义标记 + 占位清单 + 编号闭合
    var phEls = html.match(/<[a-z]+[^>]*class="(?:[^"]*\s)?(?:ph|cap|same)(?:\s[^"]*)?"[^>]*>/g) || [];
    var noType = [], noId = [], dupId = [], allIds = [], seenPh = {};
    phEls.forEach(function (tag) {
      if (!/data-ph="(CAP|KEEP|SAME|OFF|DATA)"/.test(tag)) noType.push(tag.replace(/[<>]/g, '').slice(0, 50));
      if (!/data-ph-id="[^"]+"/.test(tag)) noId.push(tag.replace(/[<>]/g, '').slice(0, 50));
    });
    (html.match(/data-ph-id="([^"]+)"/g) || []).forEach(function (s) {
      var id = s.replace(/^data-ph-id="/, '').replace(/"$/, '');
      if (seenPh[id]) dupId.push(id); else { seenPh[id] = 1; allIds.push(id); }
    });
    var typeNoId = (html.match(/<[a-z]+[^>]*data-ph="(CAP|KEEP|SAME|OFF|DATA)"[^>]*>/g) || []).filter(function (t) { return !/data-ph-id="[^"]+"/.test(t); });
    var ledger = (html.match(/<table[^>]*class="[^"]*ph-ledger[^"]*"[\s\S]*?<\/table>/) || [''])[0];
    var ledgerIds = ledger ? Array.from(new Set(ledger.match(/PH-[A-Za-z0-9-]+/g) || [])) : [];
    var missInLedger = allIds.filter(function (id) { return ledgerIds.indexOf(id) < 0; });
    var missOnFig = ledgerIds.filter(function (id) { return allIds.indexOf(id) < 0; });
    var typesUsed = ['CAP', 'KEEP', 'SAME', 'OFF', 'DATA'].filter(function (t) { return new RegExp('\\b' + t + '\\b').test(ledger); });
    // 交接件位置：必须在所有页面之后（放文末折叠区），不许夹在方案前面/中间干扰阅读
    var ledgerAt = html.search(/<table[^>]*class="[^"]*ph-ledger/);
    var lastPageAt = html.lastIndexOf('<div class="page"');
    if (ledger && ledgerAt > 0 && lastPageAt > 0 && ledgerAt < lastPageAt) {
      bad('EX-1.4-17', '占位清单夹在方案前面/中间：它是给下游的交接件，须移到文末并用 <details class="handoff"> 折叠，不干扰用户读方案');
    }
    if (!ledger) bad('EX-1.4-17', '缺占位清单（<table class="ph-ledger">）：下游无法判断每个灰块该展开、沿用、不做还是补数据');
    if (noType.length) bad('EX-1.4-17', '这些占位没有类型（data-ph=CAP/KEEP/SAME/OFF/DATA）：' + noType.slice(0, 3).join('；'));
    if (noId.length) bad('EX-1.4-17', '这些占位没有唯一编号（data-ph-id）：' + noId.slice(0, 3).join('；'));
    if (typeNoId.length) bad('EX-1.4-17', '这些元素写了类型但没写编号：' + typeNoId.slice(0, 3).join('；'));
    if (dupId.length) bad('EX-1.4-17', '占位编号重复：' + Array.from(new Set(dupId)).join('、'));
    if (ledger && missInLedger.length) bad('EX-1.4-17', '图上占位未登记进清单：' + missInLedger.join('、'));
    if (ledger && missOnFig.length) bad('EX-1.4-17', '清单里的编号在图上找不到对应占位：' + missOnFig.join('、'));
    if (ledger && typesUsed.indexOf('CAP') < 0) bad('EX-1.4-17', '占位清单里没有 CAP（能力位）：本需求至少应有一处能力位占位');
    var capNoItems = [];
    if (ledger && !/能力项/.test(ledger)) {
      bad('EX-1.4-17', '占位清单缺「能力项」列：下游没有可逐条对账的能力清单，CAP 就只能靠读文案猜');
    } else if (ledger) {
      (ledger.match(/<tr>[\s\S]*?<\/tr>/g) || []).forEach(function (r) {
        var cells = (r.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/g) || []).map(function (c) { return c.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); });
        if (cells.length < 8 || !/^CAP\b/i.test(cells[3] || '')) return;
        var its = (cells[6] || '').split('/').filter(function (x) { return x.trim().length >= 2; });
        if (!its.length) capNoItems.push(cells[0] || '（无编号）');
      });
      if (capNoItems.length) bad('EX-1.4-17', '这些 CAP 占位没填「能力项」：' + capNoItems.join('、') + '（用 / 分隔，一个词对应下游一个控件组）');
    }
    if (ledger && !noType.length && !noId.length && !typeNoId.length && !dupId.length && !missInLedger.length && !missOnFig.length && typesUsed.indexOf('CAP') >= 0) {
      ok('EX-1.4-17', '占位可交接：' + allIds.length + ' 条带类型与编号，清单 ' + ledgerIds.length + ' 行（' + typesUsed.join(' / ') + '）');
    }

    // 18 页内 Tab 面板齐全且拆到块（EX-1.4-18）：N 个 Tab = N 块 data-pane 面板，每块 ≥2 个命名区块，禁一句话代替面板
    var paneLack = [];
    var ALT_PANE = /(此处换成|内容同上|其余同上|此处略|面板略|另\s*[一二三四五1-5]\s*个\s*Tab\s*(内容)?(同上|略))/;
    blocks.forEach(function (blk2, idx2) {
      var b2 = blk2.split(/<hr[^>]*>|<h2[^>]*>/)[0];
      if (/class="same"/.test(b2)) return;
      var hd2 = (b2.match(/page-hd[\s\S]*?<\/div>/) || [''])[0];
      var pid2 = (hd2.match(/class="pid">([^<]+)</) || [, 'P' + (idx2 + 1)])[1];
      var bar = (b2.match(/<div[^>]*class="[^"]*tabbar[^"]*"[\s\S]*?<\/div>/) || [''])[0];
      var tabs = [];
      (bar.match(/<([a-zA-Z]+)[^>]*class="[^"]*tabx[^"]*"[^>]*>[^<]+<\/\1>/g) || []).forEach(function (s) {
        var n = s.replace(/<[^>]+>/g, '').trim();
        if (n) tabs.push(n);
      });
      var panes = [];
      (b2.match(/data-pane="([^"]+)"/g) || []).forEach(function (s) {
        panes.push(s.replace(/^data-pane="/, '').replace(/"$/, '').trim());
      });
      var altHit = (b2.match(ALT_PANE) || [])[0];
      if (!tabs.length) { if (altHit) paneLack.push(pid2 + '：用「' + altHit + '」代替面板内容'); return; }
      if (!panes.length) { paneLack.push(pid2 + '：有 ' + tabs.length + ' 个页内 Tab（' + tabs.join(' / ') + '），但一块面板内容都没画'); return; }
      var missPane = tabs.filter(function (t) { return panes.indexOf(t) < 0; });
      if (missPane.length) paneLack.push(pid2 + '：缺面板「' + missPane.join('」「') + '」（Tab ' + tabs.length + ' 个 / 面板 ' + panes.length + ' 块）');
      if (altHit) paneLack.push(pid2 + '：用「' + altHit + '」代替面板内容');
      // 逐面拆到块：每个 pane 内 ≥2 个 <b class="t"> 命名区块；只有 1 块须标 data-thin="sys"
      var pAt = [], pRe2 = /data-pane="([^"]+)"/g, pM2;
      while ((pM2 = pRe2.exec(b2))) pAt.push({ name: pM2[1], at: pM2.index });
      pAt.forEach(function (o, i) {
        var seg = b2.slice(o.at, i + 1 < pAt.length ? pAt[i + 1].at : b2.length);
        var tagStart = b2.lastIndexOf('<div', o.at);
        var tag = b2.slice(tagStart, b2.indexOf('>', o.at) + 1);
        var titles = (seg.match(/class="t"/g) || []).length;
        var textLen = seg.replace(/<[^>]*>/g, '').replace(/\s+/g, '').length;
        var thin = /data-thin="sys"/.test(tag);
        if (thin) {
          if (titles < 1) paneLack.push(pid2 + ' 面板「' + o.name + '」标了 data-thin="sys" 但没有内容小标题（<b class="t">）');
          return;
        }
        if (titles < 2) paneLack.push(pid2 + ' 面板「' + o.name + '」只有 ' + titles + ' 个命名区块（<b class="t">），至少要 2 个；只有一块时须标 data-thin="sys" 并写清系统接管了什么');
        else if (textLen < 24) paneLack.push(pid2 + ' 面板「' + o.name + '」有标题没内容（去标签后仅 ' + textLen + ' 字）');
      });
    });
    if (paneLack.length) {
      bad('EX-1.4-18', '页内 Tab 面板不齐 / 未拆到块：' + paneLack.join('；') + '（N 个 Tab 必须有 N 块面板，每块挂 data-pane="<Tab 名>" 且内拆 ≥2 个 <b class="t"> 命名区块；禁止「切到 X 时此处换成」这类替代句）');
    } else {
      ok('EX-1.4-18', '页内 Tab 面板齐全且逐面拆到块：每个 Tab 都有对应 data-pane 面板，面板内 ≥2 个命名区块，无替代句');
    }

    // 19 场景链路可走通（EX-1.4-19）：flow-ledger + 图上 data-go/data-from + 连通性
    var flowLedger = (html.match(/<table[^>]*class="[^"]*flow-ledger[\s\S]*?<\/table>/) || [''])[0];
    var pidPos = [], pidRe2 = /<span class="pid">\s*(P\d+)\s*<\/span>/g, pm3;
    while ((pm3 = pidRe2.exec(html))) pidPos.push({ id: pm3[1], at: pm3.index });
    var pidSet = [];
    pidPos.forEach(function (p) { if (pidSet.indexOf(p.id) < 0) pidSet.push(p.id); });
    var edges = [], goRe2 = /data-go="\s*(P\d+)\s*"/g, gm2;
    while ((gm2 = goRe2.exec(html))) {
      var src = '';
      pidPos.forEach(function (p) { if (p.at <= gm2.index) src = p.id; });
      edges.push({ from: src, to: gm2[1], at: gm2.index });
    }
    var flow19 = [];
    if (!flowLedger) flow19.push('缺场景链路表（<table class="flow-ledger">）');
    else if (!/S\d/.test(flowLedger)) flow19.push('flow-ledger 里没有 S1~Sn 场景行');
    if (!pidSet.length) flow19.push('未识别到页面（<span class="pid">Pn</span>）');
    if (!edges.length) flow19.push('全篇没有跨页入口锚点（data-go），页面之间只能靠文字讲');
    var badTarget = edges.filter(function (e) { return pidSet.indexOf(e.to) < 0; }).map(function (e) { return e.from + '→' + e.to; });
    if (badTarget.length) flow19.push('这些锚点指向不存在的页：' + Array.from(new Set(badTarget)).join('、'));
    // 入边：被 data-go 指向 / 根页 / 显式声明 data-entry="root"
    var root = pidSet[0];
    var inbound = {};
    edges.forEach(function (e) { inbound[e.to] = true; });
    var noIn = pidSet.filter(function (p) { return p !== root && !inbound[p]; });
    if (noIn.length) flow19.push('这些页面没有入边（凭空出现）：' + noIn.join('、'));
    // 连通性
    if (pidSet.length) {
      var seen = {}, queue = [root];
      seen[root] = true;
      while (queue.length) {
        var cur = queue.shift();
        edges.forEach(function (e) { if (e.from === cur && !seen[e.to]) { seen[e.to] = true; queue.push(e.to); } });
      }
      var unreach = pidSet.filter(function (p) { return !seen[p]; });
      if (unreach.length) flow19.push('从 ' + root + ' 走不到这些页：' + unreach.join('、'));
      if (edges.length && edges.length < pidSet.length - 1) flow19.push('锚点边数 ' + edges.length + ' 少于页面数 ' + pidSet.length + ' 所要求的 ' + (pidSet.length - 1) + '，链路不完整');
    }
    if (flow19.length) {
      bad('EX-1.4-19', '场景链路走不通：' + flow19.join('；') + '（每条 Sx 要能在图上从第一屏点到末态屏：页头写"进入/去向"、图上标 data-go / data-from、并交 flow-ledger）');
    } else {
      ok('EX-1.4-19', '场景链路可走通：' + pidSet.length + ' 页 / ' + edges.length + ' 条跨页锚点，从 ' + root + ' 可达全部页面，flow-ledger 有场景行');
    }

    // 20 页内视图清单闭合（EX-1.4-20）：view-ledger 一视图一行，面板 data-view 与表对应
    var viewLedger = (html.match(/<table[^>]*class="[^"]*view-ledger[\s\S]*?<\/table>/) || [''])[0];
    var view20 = [];
    var hasTabbar = /class="[^"]*tabbar/.test(html);
    var viewIds = [];
    (html.match(/data-view="([^"]+)"/g) || []).forEach(function (s) {
      var v = s.replace(/^data-view="/, '').replace(/"$/, '').trim();
      if (v && viewIds.indexOf(v) < 0) viewIds.push(v);
    });
    if (hasTabbar) {
      if (!viewLedger) {
        view20.push('有页内 Tab 但缺页内视图清单（<table class="view-ledger">）');
      } else {
        if (!/视图编号/.test(viewLedger) || !/主导图形/.test(viewLedger) || !/关键区块/.test(viewLedger)) {
          view20.push('view-ledger 表头须含「视图编号 / 主导图形 / 关键区块」三列');
        }
        var vRows = (viewLedger.match(/<tr>[\s\S]*?<\/tr>/g) || []);
        var ledgerViews = [], vBadBlock = [];
        vRows.forEach(function (r) {
          var cs = (r.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/g) || []).map(function (c) { return c.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); });
          if (!cs.length || !/^P\d+-V\d+/.test(cs[0] || '')) return;
          ledgerViews.push(cs[0]);
          var blocks = (cs[5] || '').split('/').filter(function (x) { return x.trim().length >= 2; });
          if (blocks.length < 2) vBadBlock.push(cs[0] + '（关键区块 ' + blocks.length + ' 项）');
        });
        if (!ledgerViews.length) view20.push('view-ledger 没有数据行（形如 P2-V1）');
        var noView = viewIds.filter(function (v) { return ledgerViews.indexOf(v) < 0; });
        if (noView.length) view20.push('这些面板的 data-view 在清单里找不到：' + noView.join('、'));
        var noPane = ledgerViews.filter(function (v) { return viewIds.indexOf(v) < 0; });
        if (noPane.length) view20.push('这些视图登记了却没有对应面板：' + noPane.join('、'));
        if (vBadBlock.length) view20.push('这些视图的关键区块不足 2 项（等于没拆开）：' + vBadBlock.join('、'));
      }
    }
    if (view20.length) {
      bad('EX-1.4-20', '页内视图清单不闭合：' + view20.join('；') + '（每个 Tab 是一个承载单元：view-ledger 一行 + 面板 ≥2 个命名区块，两边编号逐字一致）');
    } else {
      ok('EX-1.4-20', hasTabbar ? ('页内视图清单闭合：' + viewIds.length + ' 个视图，面板与清单一一对应') : '无页内 Tab，本项不适用');
    }
  }

  if (stage === '4.1') {
    const html = readOrDie(file, 'node tools/gate.js ex 4.1 <草图或页面清单.html>');
    const scanArg = process.argv[5];
    head('EX-4.1 页面清单与装配（覆盖率 / 继承对账 / 逐页决策域扫读）');
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

    // EX-4.1-03 功能域继承：草图的 IA 树 ↔ 页面清单的「所属功能域」列
    var doms = [];
    var dmRe = /[├└]─\s*([^\s·<]+)\s*·/g;
    var dm;
    while ((dm = dmRe.exec(html))) doms.push(dm[1].trim());
    var pageDom = [];
    var prRe = /<tr><td>P\d+<\/td><td><b>[^<]+<\/b><\/td><td>([^<]+)<\/td>/g;
    var pm;
    while ((pm = prRe.exec(html))) pageDom.push(pm[1].trim());
    if (!doms.length) {
      if (/功能域/.test(html)) wr('EX-4.1-03', '未识别到 IA 树（形如「├─ 体验观测 · Observation」），无法核对功能域继承');
      else wr('EX-4.1-03', '未见功能域：1.4 的 IA 未带下来，说明书第 7 节会失去章节骨架');
    } else if (pageDom.length) {
      var orphan = pageDom.filter(function (d) { return doms.indexOf(d) < 0; });
      if (orphan.length) bad('EX-4.1-03', '页面清单里的功能域在 IA 树中不存在：' + orphan.join('、'));
      else ok('EX-4.1-03', '功能域继承一致 ' + doms.length + ' 个：' + doms.join(' / '));
    } else {
      var missDom = doms.filter(function (d) { return html.indexOf(d) < 0; });
      if (missDom.length) bad('EX-4.1-03', '页面清单缺这些功能域：' + missDom.join('、'));
      else ok('EX-4.1-03', '功能域已继承 ' + doms.length + ' 个（清单未带列，按关键字核对）');
    }
    wr('EX-4.1-02', '人检：页面数 / 主结构 / 进入关系 / 突破点落点与 1.4 选定草图逐项对，结构差异 >30% 回 1.4（内部回退，不新增停顿）');

    // EX-4.1-05 逐页决策域扫读表（第三参数传扫读表；未传只告警）
    if (!scanArg || !fs.existsSync(scanArg)) {
      wr('EX-4.1-05', '未传逐页决策域扫读表，无法核对每页必查域是否扫全（用法：bash tools/gate-ex.sh 4.1 <草图.html> _output/<业务名>/04-扫读-<业务名>.md）');
    } else {
      const scan = fs.readFileSync(scanArg, 'utf8');
      const pageRows = [];
      scan.split(/\r?\n/).forEach((ln) => {
        if (!/^\s*\|/.test(ln)) return;
        const raw = ln.split('|');
        const cells = raw.slice(1, raw.length - 1).map((x) => x.trim());
        if (!cells.length || /^:?-{2,}/.test(cells[0] || '')) return;
        const pidm = (cells[0] || '').match(/Page-\d+/);
        if (!pidm) return;
        pageRows.push({ pid: pidm[0], cells: cells });
      });
      if (!pageRows.length) {
        bad('EX-4.1-05', '扫读表里没有 Page-xx 行：逐页决策域扫读未做（表头须为 页面 / 内容要素 / 必查域 / 取值 / 命中 / 落地 / 落点）');
      } else {
        const noDom = [], noExp = [];
        pageRows.forEach((r) => {
          if (!/D-?\d\d/.test(r.cells[2] || '')) noDom.push(r.pid);
          if (!/D\d\d-EP\d+/.test(r.cells[4] || '') && !/业务独立推导/.test(r.cells[4] || '')) noExp.push(r.pid);
        });
        if (noDom.length) bad('EX-4.1-05', '这些页没有「必查域」：' + noDom.join('、') + '（先按桥协议 Step 2.5 扫内容要素，再定必查域）');
        if (noExp.length) bad('EX-4.1-05', '这些页没有命中编号：' + noExp.join('、') + '（命中列须写 D0x-EPxx + 档位，或「业务独立推导（含场景号）」）');
        if (uniq.size && pageRows.length < uniq.size) bad('EX-4.1-05', '扫读表只覆盖 ' + pageRows.length + ' 页，页面清单有 ' + uniq.size + ' 页');
        if (!noDom.length && !noExp.length && (!uniq.size || pageRows.length >= uniq.size)) ok('EX-4.1-05', '逐页决策域扫读 ' + pageRows.length + ' 页，页页有必查域与命中编号');
      }
    }
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
  const pageH5 = (html.match(/<h5[^>]*>\s*Page-\d+/g) || []).length;
  const pageH4old = (html.match(/<h4[^>]*>\s*7\.\d+\s+Page-\d+/g) || []).length;
  const pageCnt = pageH5 || pageH4old;
  if (pIds.size >= 1 && pageCnt >= 1 && pIds.size === pageCnt) ok('SP-S-02', '页面清单 ' + pIds.size + ' 页 = 分页面小节 ' + pageCnt + ' 个');
  else bad('SP-S-02', '页面清单 ' + pIds.size + ' 页 ≠ 第 7 节页面小节 ' + pageCnt + ' 个（页面小节写成 <h5 id="page-0x">Page-0x …</h5>）');
  wr('SP-S-05', '人检内容预算：目标 ≤5 / 突破点 ≤5 / 每页映射 ≤8 行 / 无废列');
  // SP-S-06 IA 单一来源：5.1 页面清单必须带「所属功能域」列（继承 1.4 草图，不重拆）
  if (!/所属功能域/.test(sec5only)) bad('SP-S-06', '5.1 页面清单缺「所属功能域」列：IA 唯一来源是 1.4 草图，缺此列会让功能域在说明书断链、第 7 节失去章节骨架');
  else ok('SP-S-06', '页面清单带「所属功能域」列（继承 1.4 的 IA）');

  // SP-S-07 第 7 节按功能域分组：<h4 class="domain">7.x 功能域名</h4>，名字须与 5.1 的「所属功能域」一致
  const sec7only = (html.split(/<h3[^>]*>\s*7\./)[1] || '').split(/<h2[^>]*class="part"/)[0];
  const domHeads = [];
  const domRe = /<h4[^>]*class="[^"]*domain[^"]*"[^>]*>\s*7\.\d+\s*([^<]+)/g;
  let dmh;
  while ((dmh = domRe.exec(html))) domHeads.push(dmh[1].trim());
  if (!domHeads.length) {
    wr('SP-S-07', '第 7 节未按功能域分组（旧结构：按页面编号平铺）。建议迁移为 <h4 class="domain">7.x 功能域名</h4> + 组内 <h5>Page-0x</h5>');
  } else {
    const d5 = new Set();
    (sec5only.match(/<tr>[\s\S]*?<\/tr>/g) || []).forEach((r) => {
      const cells = (r.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || []).map((c) => strip(c));
      if (/^P\d+$/.test((cells[0] || '').trim()) && cells[2]) d5.add(cells[2].trim());
    });
    const domPools = [...d5];
    const domOnly = domHeads.filter((d) => !/规则|契约|状态机|口径|数据集|验收|边界/.test(d));
    const matchDom = (d) => domPools.some((x) => d.indexOf(x) >= 0 || x.indexOf(d) >= 0);
    const orphan = domPools.length ? domOnly.filter((d) => !matchDom(d)) : [];
    const missing = domPools.length ? domPools.filter((x) => !domOnly.some((d) => d.indexOf(x) >= 0 || x.indexOf(d) >= 0)) : [];
    if (orphan.length) bad('SP-S-07', '第 7 节分组名在 5.1「所属功能域」里找不到：' + orphan.join('、'));
    else if (missing.length) bad('SP-S-07', '这些功能域在 5.1 里有、第 7 节没有对应分组：' + missing.join('、'));
    else ok('SP-S-07', '第 7 节按功能域分组 ' + domHeads.length + ' 组：' + domHeads.join(' / '));
  }

  /* SP-A */
  head('SP-A 资产真实性');
  wr('SP-A-01~06', '组件 / 模板 / 色值 / 按钮 / 引用 / 经验落点 六项由 design-spec-selfcheck.sh 机检，见文末汇总');

  /* SP-W */
  head('SP-W 线框与可视化');
  if (/__/.test(noSketch)) {
    const n = (noSketch.match(/__/g) || []).length;
    bad('SP-W-04', '线框区仍有 ' + n + ' 处 `__` 占位（草图区免检）');
  } else ok('SP-W-04', '线框区无占位符');

  // SP-W-06 占位已展开：线框区不得残留草图占位形态；列表页能力位必须落成真实控件
  const noStyle = noSketch.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '');
  const phPat = /class="(?:[^"]*\s)?(?:ph|cap|same)(?:\s[^"]*)?"|data-ph="|到线框再补|线框再补|待线框|本页不展开|此处占位|占位待补/g;
  let phHit = null, phCount = 0;
  while ((phHit = phPat.exec(noStyle)) !== null) phCount++;
  if (phCount) bad('SP-W-06', '线框区残留草图占位形态 ' + phCount + ' 处（如「' + (noStyle.match(phPat) || [''])[0] + '」）：按 1.4 占位清单展开成真实控件 / 登记沿用 / 进实现边界');
  const capLack = [];
  noStyle.split(/<h5[^>]*id="page-/).slice(1).forEach((s) => {
    const body = s.split(/<h5[^>]*id="page-/)[0];
    const idM = body.match(/(Page-\d+)/);
    const pid = idM ? idM[1] : '某页';
    const i = body.indexOf('<div class="wf-container">');
    const j = body.indexOf('<div class="wf-annotation">', i);
    const wf = i >= 0 ? body.slice(i, j > i ? j : undefined) : '';
    if (!wf) { capLack.push(pid + '（未找到线框容器）'); return; }
    if (/page-(table|dashboard|list)/.test(body)) {
      const miss = [];
      // 筛选能力可按控件结构判定：不要求界面文案出现「筛选」字样（否则会逼人把说明文字塞进 UI）
      if (!/(筛选|时间范围|日期范围|时间窗|wf-datefilter|wf-prosearch|wf-select)/.test(wf)) miss.push('筛选/时间范围');
      if (!/(排序|↑|↓)/.test(wf)) miss.push('排序');
      if (!/(分页|共\s*\d+\s*条|第\s*\d+\s*\/\s*\d+\s*页|每页)/.test(wf)) miss.push('分页');
      if (miss.length) capLack.push(pid + '（缺 ' + miss.join(' / ') + '）');
    }
    if (/page-form-/.test(body) && wf.indexOf('wf-btn-primary') < 0) capLack.push(pid + '（表单页线框缺主操作按钮）');
  });
  if (capLack.length) bad('SP-W-06', '线框能力位不全：' + capLack.join('；') + '（草图上的能力位在线框里找不到 = 这条能力被交付丢了）');
  const italic = (noStyle.match(/font-style\s*:\s*italic/g) || []).length;
  if (italic) bad('SP-W-06', '线框区出现 ' + italic + ' 处斜体：草图的占位语汇（灰底 + 12px 斜体）不得复刻进线框，须按组件规范与 Token 重新设计（5.0 铁律 24）');
  if (!phCount && !capLack.length) ok('SP-W-06', '占位已展开：线框无草图占位残留，列表/概览页筛选·排序·分页齐，表单页有主操作');

  // 5.2 草图折叠区：存在即须声明"仅存档、实现以第 7 节为准"（否则读者与 Coding AI 会把草图占位当设计稿）
  const fold = html.match(/<details[^>]*class="[^"]*sketch-fold[^"]*"[\s\S]*?<\/details>/);
  if (fold && !/存档|以第\s*7\s*节|以第7节|不得作为实现依据/.test(fold[0].slice(0, 800))) {
    wr('SP-W-06', '5.2 草图折叠区未声明"仅存档、实现以第 7 节为准"：按 5.0 铁律 15.1 补 data-purpose="archive" + 摘要「📦 存档：…」+ 区内首行声明，否则读者会把草图占位当设计稿');
  }

  /* SP-W-07 占位能力逐条落地（跨文件：草图 ph-ledger ↔ 说明书映射清单） */
  const sketchArg = process.argv[4];
  if (!sketchArg || !fs.existsSync(sketchArg)) {
    wr('SP-W-07', '未传草图路径，无法核对占位能力是否逐条落地（用法：bash tools/gate-sp.sh <spec> <草图>）');
  } else {
    const sk = fs.readFileSync(sketchArg, 'utf8');
    const led = (sk.match(/<table[^>]*class="[^"]*ph-ledger[^"]*"[\s\S]*?<\/table>/) || [''])[0];
    if (!led) bad('SP-W-07', '草图里没有 ph-ledger 占位清单，无法核对能力是否逐条落地（先跑 gate-ex.sh 1.4）');
    else {
      const caps = [];
      (led.match(/<tr>[\s\S]*?<\/tr>/g) || []).forEach((r) => {
        const cells = (r.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/g) || []).map(strip);
        if (cells.length < 8 || !/^CAP\b/i.test(cells[3] || '')) return;
        const m = (cells[2] || '').match(/(?:Page-)?(\d+)/);
        if (!m) return;
        const items = (cells[6] || '').split('/').map((x) => x.trim()).filter((x) => x.length >= 2);
        if (!items.length) return;
        caps.push({ pid: 'Page-' + ('0' + m[1]).slice(-2), items: items });
      });
      const missItems = [];
      caps.forEach((c) => {
        const num = c.pid.replace('Page-', '');
        const at = noStyle.search(new RegExp('<h5[^>]*id="page-0*' + num + '"'));
        if (at < 0) { missItems.push(c.pid + '（第 7 节找不到该页小节）'); return; }
        const rest = noStyle.slice(at);
        const nxt = rest.indexOf('<h5', 1);
        const body = nxt > 0 ? rest.slice(0, nxt) : rest;
        let scope = body;
        const tStart = body.search(/映射清单/);
        if (tStart >= 0) {
          const tbl = body.slice(tStart).match(/<table[\s\S]*?<\/table>/);
          if (tbl) scope = tbl[0];
        }
        const lack = c.items.filter((it) => scope.indexOf(it) < 0);
        if (lack.length) missItems.push(c.pid + ' 缺「' + lack.join(' / ') + '」');
      });
      if (missItems.length) bad('SP-W-07', '草图占位里的能力没有逐条落到线框映射清单：' + missItems.join('；') + '（每条 CAP 的每个能力项都要在「界面区域 / 业务能力项」里占一行）');
      else ok('SP-W-07', '占位能力逐条落地：' + caps.length + ' 组 CAP 能力清单均已在对应页映射清单中出现');
    }
  }
  /* SP-W-08 控件形态未照抄草图：时间筛选必须是复合日期筛选器 / 复合搜索框；表单分区标题不许用序号 */
  const wf08 = [];
  noStyle.split(/<h5[^>]*id="page-/).slice(1).forEach((s) => {
    const body = s.split(/<h5[^>]*id="page-/)[0];
    const idM = body.match(/(Page-\d+)/);
    const pid = idM ? idM[1] : '某页';
    const i = body.indexOf('<div class="wf-container">');
    const j = body.indexOf('<div class="wf-annotation">', i);
    const wf = i >= 0 ? body.slice(i, j > i ? j : undefined) : '';
    if (!wf) return;
    // 抓「用一排时间快捷项分段按钮冒充时间筛选」这一具体形态；不再按文本关键词判，避免把说明文字算成控件
    if (/wf-seg[\s\S]{0,700}?(今日|今天)[\s\S]{0,300}?(昨日|昨天|近\s*[0-9]+\s*天|近\s*[0-9]+\s*个月)/.test(wf)) {
      wf08.push(pid + ' 用一排时间快捷项的分段按钮当时间筛选：应换 comp-date-picker 复合日期筛选器（左快捷区 88px + 右日期区 340px 共享外边框、高 32px、最小宽 428px）');
    }
    if (/[①②③④⑤⑥⑦⑧⑨]/.test(wf)) {
      wf08.push(pid + ' 线框里出现 ①②③ 序号：区块 / 表单分区标题须用 design-form §5.4 蓝色竖条标题（wf-form-title），不许用序号充当分组');
    }
  });
  if (wf08.length) bad('SP-W-08', '控件形态仍照抄草图：' + wf08.join('；'));
  else ok('SP-W-08', '控件形态合规：时间筛选为复合日期筛选器 / 复合搜索框，分区标题无序号');

  /* SP-W-09 多视图页面：页内 Tab / 分段切换的每个面板都要有线框内容（不许只画默认面板） */
  const tabLack = [];
  noStyle.split(/<h5[^>]*id="page-/).slice(1).forEach((s) => {
    const body = s.split(/<h5[^>]*id="page-/)[0];
    const idM = body.match(/(Page-\d+)/);
    const pid = idM ? idM[1] : '某页';
    const i = body.indexOf('<div class="wf-container">');
    const j = body.indexOf('<div class="wf-annotation">', i);
    const wf = i >= 0 ? body.slice(i, j > i ? j : undefined) : '';
    if (!wf) return;
    const tabsBlock = (wf.match(/<div class="wf-tabs">[\s\S]*?<\/div>/) || [''])[0];
    if (!tabsBlock) return;
    const tabNames = (tabsBlock.match(/<span[^>]*>([^<]*)<\/span>/g) || []).map((x) => x.replace(/<[^>]+>/g, '').trim());
    const paneCount = (wf.match(/wf-pane-label/g) || []).length;
    if (paneCount < tabNames.length) {
      tabLack.push(pid + '：' + tabNames.length + ' 个页内 Tab（' + tabNames.join(' / ') + '），线框只画了 ' + paneCount + ' 个面板内容');
    } else {
      // 每个面板标签之后必须有实质线框块（只挂标签、内容是空的，照样判缺）
      const segs = wf.split('wf-pane-label').slice(1);
      segs.forEach((seg, k) => {
        const text = seg.replace(/<[^>]+>/g, '').replace(/\s+/g, '');
        const blocks = (seg.match(/<(div|table|tr|ul|svg)/g) || []).length;
        const nm = tabNames[k] || ('第 ' + (k + 1) + ' 个');
        if (text.length < 12) tabLack.push(pid + ' 面板「' + nm + '」只有标签没有内容');
        else if (blocks < 1) tabLack.push(pid + ' 面板「' + nm + '」没有线框结构（只有一句文字）');
      });
    }
  });
  if (tabLack.length) bad('SP-W-09', '多视图页面面板缺失或空壳：' + tabLack.join('；') + '（每个 Tab 面板都要有线框内容并挂 wf-pane-label，缺一个就会在 Demo 里变成空白页）');
  else ok('SP-W-09', '多视图页面面板齐：所有页内 Tab 均有对应线框面板且有实际结构');

  /* SP-W-10 有特征物必有决策域经验：线框里画了什么，本页映射清单就必须有对应 D0x-EPxx（带档位） */
  const domLack = [];
  noStyle.split(/<h5[^>]*id="page-/).slice(1).forEach((s) => {
    const body = s.split(/<h5[^>]*id="page-/)[0];
    const idM = body.match(/(Page-\d+)/);
    const pid = idM ? idM[1] : '某页';
    const i = body.indexOf('<div class="wf-container">');
    const j = body.indexOf('<div class="wf-annotation">', i);
    const wf = i >= 0 ? body.slice(i, j > i ? j : undefined) : '';
    if (!wf) return;
    // 本页映射清单：优先取「映射清单」字样之后的第一个表，退化为页内第一个表
    let scope = body;
    const tStart = body.search(/映射清单/);
    if (tStart >= 0) {
      const tbl = body.slice(tStart).match(/<table[\s\S]*?<\/table>/);
      if (tbl) scope = tbl[0];
    } else {
      const tbl = body.match(/<table[\s\S]*?<\/table>/);
      if (tbl) scope = tbl[0];
    }
    const isListPage = /page-(table|dashboard|list)/.test(body);
    const need = [];
    // ① 筛选控件 → D-09（至少 2 条：壳 + 触发/回显/排序）
    const hasFilter = /wf-datefilter|wf-prosearch|wf-basic-search/.test(wf) || (isListPage && /wf-select/.test(wf));
    if (hasFilter) {
      const n = new Set(scope.match(/D09-EP\d+/g) || []);
      if (n.size < 2) need.push('有筛选控件但本页只有 ' + n.size + ' 条 D09-EPxx（至少 2 条：壳 + 触发/回显/排序）');
    }
    // ①b 引用了 D09-EP02 就必须写档位，且线框结构与档位一致
    const m02 = scope.match(/D09-EP02[^<]{0,48}/);
    if (m02) {
      const tier = (m02[0].match(/[①②③④⑤⑥⑦]/) || [''])[0];
      if (!tier) need.push('引用 D09-EP02 但没写档位（①②③…⑦），无法核对线框是否照档位落地');
      else if (/[④⑤]/.test(tier) && !/wf-prosearch/.test(wf)) need.push('声明 D09-EP02 ' + tier + '（复合搜索框）但线框里没有 wf-prosearch');
      else if (/[②③]/.test(tier) && (wf.match(/wf-select/g) || []).length < 2) need.push('声明 D09-EP02 ' + tier + '（行内平铺）但线框平铺下拉不足 2 个');
    }
    // ② 表格 → D-02 或 D-03
    if (/<table|wf-table/.test(wf) && !/D0[23]-EP\d+/.test(scope)) need.push('有表格但缺 D-02 / D-03（壳选型或密度）');
    // ③ 表单录入 → D-07
    if (/wf-form-item|wf-form-title|wf-textarea/.test(wf) && !/D07-EP\d+/.test(scope)) need.push('有表单录入但缺 D-07（控件选型）');
    // ④ 批量 / 导入导出 → D-10
    if (/批量|导入|导出/.test(wf) && !/D10-EP\d+/.test(scope)) need.push('有批量/导入导出但缺 D-10（入口与流程）');
    // ⑤ 危险动作 → D-05
    if (/删除|停用|禁用|下线|覆盖/.test(wf) && !/D05-EP\d+/.test(scope)) need.push('有删除/停用类动作但缺 D-05（拦到什么程度）');
    // ⑥ 统计 / 图表 / 可视化件 → D-11（整页看数则 D-08）
    // 探针改为"件型原语 + data-viz"（旧探针含 <svg，会被普通图标误伤；且只认字样不认结构）
    const VIZ_PROBES = /data-viz=|wf-kpi|wf-segbar|wf-topo|wf-rank|wf-steps|wf-flow|wf-split|wf-preview|wf-objcard|wf-diagram|wf-timeline|wf-chart/;
    if (VIZ_PROBES.test(wf) && !/D11-EP\d+|D08-EP\d+/.test(scope)) need.push('有统计/图表件但缺 D-11 或 D-08（件型与嵌入）');
    // ⑦ 页内 Tab → D-06 或 D-01
    if (/wf-tabs|wf-pane-label/.test(wf) && !/D06-EP\d+|D01-EP\d+/.test(scope)) need.push('有页内 Tab 但缺 D-06 / D-01（层级与动线）');
    if (need.length) domLack.push(pid + '：' + need.join('；'));
  });
  if (domLack.length) bad('SP-W-10', '有特征物却没有对应决策域经验（= 没学习就自由发挥）：' + domLack.join(' ｜ ') + '（按桥协议 Step 2.5 逐项补扫，映射清单写 D0x-EPxx + 档位，不许只写域号）');
  else ok('SP-W-10', '每页特征物均有对应决策域经验编号（筛选 / 表格 / 表单 / 批量 / 统计 / Tab）');

  /* SP-W-11 跨页动线闭合：每页批注写清「进入 / 去向」，提到的页面必须真实存在 */
  const flowLack = [];
  const specPageIds = [];
  (noStyle.match(/<h5[^>]*id="page-[^"]*"[^>]*>([\s\S]*?)<\/h5>/g) || []).forEach((h) => {
    const m = h.match(/(Page-\d{2})/);
    if (m && specPageIds.indexOf(m[1]) < 0) specPageIds.push(m[1]);
  });
  noStyle.split(/<h5[^>]*id="page-/).slice(1).forEach((s) => {
    const body = s.split(/<h5[^>]*id="page-/)[0];
    const idM = body.match(/(Page-\d{2})/);
    const pid = idM ? idM[1] : '某页';
    const secText = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const noIn = !/进入/.test(secText);
    const noOut = !/去向/.test(secText);
    if (noIn || noOut) flowLack.push(pid + ' 未写「' + (noIn ? '进入' : '') + (noIn && noOut ? ' / ' : '') + (noOut ? '去向' : '') + '」');
    const refs = (secText.match(/Page-\d{2}/g) || []).filter((x) => x !== pid);
    const ghost = refs.filter((x) => specPageIds.indexOf(x) < 0);
    if (ghost.length) flowLack.push(pid + ' 提到了不存在的页：' + Array.from(new Set(ghost)).join('、'));
  });
  if (flowLack.length) bad('SP-W-11', '跨页动线断链：' + flowLack.join('；') + '（每页批注首句写清"从 X 的哪个入口进来、办完去 Y"，提到的页必须存在）');
  else ok('SP-W-11', '跨页动线闭合：' + specPageIds.length + ' 页均写明进入 / 去向，引用页均存在');

  wr('SP-W-01~05', '表单结构 / 线框规范 / 可视化件 / UI 文案 由 selfcheck 机检');

  /* SP-W-12 可视化件件型对账（实现 tools/viz-audit.js，数据源 件型落地契约.json）
     治「声明写 VIZ-01-A2、线框画成四张白卡」：键在册 / 件数与声明对齐 / 未打标 / 形态一致 / 必写值到位 */
  const vizAudit = require('./viz-audit');
  const vres = vizAudit.audit(noStyle);
  if (vres.errors.length) bad('SP-W-12', '件型落地对账失败：' + [...new Set(vres.errors)].join('；'));
  else if (vres.skipped) ok('SP-W-12', '本说明书未出现可视化件，跳过件型对账');
  else ok('SP-W-12', '件型对账通过：' + vres.pages.length + ' 页可视化件均在册、件数与声明一致、形态与声明匹配');

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
