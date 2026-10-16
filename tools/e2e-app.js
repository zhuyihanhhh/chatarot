// 端到端自检：在 /app/ 页面中注入执行，驱动真实 UI 走完整流程，返回报告
window.runE2E = async () => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const waitFor = async (fn, ms = 20000, what = "") => { const t0 = Date.now(); for (;;) { const v = fn(); if (v) return v; if (Date.now() - t0 > ms) throw new Error("timeout: " + what); await sleep(100); } };
  const rep = [], ok = (c, m) => rep.push((c ? "PASS " : "FAIL ") + m);
  const { S, P, Hist } = window.__tarot;
  try {
    await waitFor(() => $(".spread"), 10000, "home");
    // 1. 选牌阵 + 提问
    $('.spread[data-id="three"]').click();
    $("#q").value = "这份新工作适合我吗？";
    $("#go").click();
    await waitFor(() => $("#again"), 5000, "shuffle");
    $("#again").click(); await sleep(300); $("#done").click();
    await waitFor(() => $(".pile"), 5000, "cut");
    $$(".pile")[1].click();
    await waitFor(() => $(".fan-card"), 5000, "fan");
    ok($$(".fan-card").length === 78, "扇形展开 78 张");
    for (const i of [5, 30, 60]) { $$(".fan-card")[i].click(); await sleep(120); }
    $$(".fan-card")[5].click();
    ok($$(".pslot.filled").length === 3, "选满 3 张后不再接受");
    await waitFor(() => $("#table"), 5000, "table");
    const cards = S.instances.length === 0;
    ok(cards, "未翻开时不挂载 Live2D");
    const stems = new Set(window.__tarot_last = $$(".slot img.still").map(i => i.src));
    ok(stems.size === 3, "三张牌不重复");
    // 2. 翻牌
    $('.slot[data-i="0"]').click();
    await waitFor(() => S.instances.length === 1, 5000, "mount1");
    $("#revealAll").click();
    await waitFor(() => $$(".slot.revealed").length === 3, 5000, "revealAll");
    await waitFor(() => S.instances.length === 3, 5000, "mount3");
    await Promise.all(S.instances.map(i => i.ready));
    ok(S.instances.every(i => i.source === "baked"), "全部使用烘焙资源");
    ok($$(".front.live").length === 3, "Live2D 全部就绪");
    // 3. 解读（mock）
    await waitFor(() => $("#readBtn"), 3000, "readBtn");
    $("#readBtn").click();
    await waitFor(() => $(".stop"), 3000, "streaming");
    ok(true, "流式中显示停止按钮");
    await waitFor(() => !$(".stop") && $(".turn .md h3"), 15000, "reading done");
    ok($(".turn .md").textContent.includes("转变正在发生"), "Markdown 渲染解读内容");
    ok(Hist.list().length === 1, "完成后写入记录");
    const h0 = Hist.list()[0];
    ok(h0.flipOrder.join() === "1" && h0.flipMode === "mixed", `记录亲手翻牌顺序 (${h0.flipOrder}/${h0.flipMode})`);
    ok(h0.messages[1].content.includes("问卜者亲手翻牌的顺序：第1位「过去」") && h0.messages[1].content.includes("建议解读顺序"), "提示词包含解读顺序与翻牌记录");
    ok(S.spreads.length === 17, "共 17 种牌阵");
    // 4. 追问
    await waitFor(() => $("#fuq"), 3000, "followup box");
    $("#fuq").value = "那我该什么时候提离职？";
    $("#fu").requestSubmit();
    await waitFor(() => $$(".turn").length === 2 && !$(".stop") && $$(".turn")[1].textContent.includes("追问回应"), 15000, "followup done");
    ok($$(".turn .q").length === 1, "追问气泡");
    const h = Hist.list()[0];
    ok(h.turns.length === 2 && h.messages.length === 5, `记录含 2 轮、5 条消息 (${h.messages.length})`);
    // 5. 停止生成
    $("#fuq").value = "再说说感情？"; $("#fu").requestSubmit();
    await waitFor(() => $(".stop"), 3000, "stop btn"); await sleep(150); $(".stop").click();
    await waitFor(() => !$(".stop"), 3000, "stopped");
    ok($$(".turn")[2].textContent.includes("已停止生成"), "停止后保留部分内容");
    // 6. 人设管理
    $("#btnPersona").click();
    await waitFor(() => $(".pm"), 3000, "pm");
    ok($$(".pm-list li[data-id^='tpl-']").length === 5, "5 个内置模板");
    $(".pm-list li[data-id='tpl-jungian']").click(); await sleep(50);
    $("#useBtn").click(); await sleep(50);
    ok(P.getActive().id === "tpl-jungian", "切换为荣格模板");
    $("#dupBtn").click(); await sleep(50);
    const dup = P.getCustom()[0];
    ok(dup && dup.name.includes("副本") && P.getCustom().length === 1, "复制为自定义");
    $("#editBtn").click(); await sleep(50);
    $("#fExtra").value = "长".repeat(900); $("#f_tone").value = "blunt"; $("#fDir").value = 5;
    $("#saveBtn").click(); await sleep(50);
    const saved = P.getCustom()[0];
    ok(saved.extra.length === 800 && saved.tone === "blunt" && saved.directness === 5, "编辑保存（extra 限 800）");
    $("#previewBtn").click(); await sleep(50);
    const pv = $("#previewBox").textContent;
    ok(pv.startsWith("你是一位专业的塔罗占卜师") && pv.trim().endsWith("以底线为准。") && pv.includes("一针见血"), "预览：底线在首、重申在尾、含语气描述");
    const imp = P.importPersonas(JSON.stringify({ personas: [{ name: "导入测试", tone: "bad", directness: 9, focus: ["love", "xx"], foo: 1 }] }));
    const ip = P.getCustom().find(p => p.name === "导入测试");
    ok(imp.imported === 1 && imp.warnings.length === 1 && ip.tone === "gentle" && ip.directness === 3 && ip.focus.join() === "love", "导入非法字段回退默认");
    P.setActive(saved.id); P.removeCustom(saved.id);
    ok(P.getActive().id === "tpl-healer", "删除当前人设后回退首个模板");
    $(".modal-x").click();
    // 7. 回看记录
    $("#btnHistory").click();
    await waitFor(() => $(".hist li"), 3000, "history");
    $(".hist li .open").click();
    await waitFor(() => $$(".slot.revealed").length === 3 && $$(".turn").length >= 2, 5000, "reopen");
    ok($("#fuq") != null, "回看可继续追问");
    // 8. 凯尔特十字横置牌
    ok(S.spreads.find(s => s.id === "celtic").positions[1].rot === 90, "凯尔特第 2 位横置");
  } catch (e) { rep.push("ERROR " + e.message); }
  return rep.join("\n");
};
