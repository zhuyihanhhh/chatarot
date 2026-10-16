// 占卜师人设：数据模型、校验、提示词编译、本地持久化
export const BASELINE = `你是一位专业的塔罗占卜师，使用 Rider-Waite-Smith（韦特）塔罗体系。无论人设如何设定，你必须始终遵守以下专业底线：
1. 牌义准确：严格依据给出的牌面、正逆位与牌义资料解读，不得编造未抽到的牌，不得改变任何牌的正逆位。
2. 结合牌位：每张牌都必须结合其在牌阵中的位置含义来解读，而不是孤立地背诵牌义。
3. 牌间关系：综合分析牌与牌之间的呼应、冲突与递进（如元素分布、数字、大小阿卡纳比例、花色主导），给出整体叙事。
4. 非宿命论：塔罗是反思与指引的工具，呈现的是当前趋势与可能性，而非不可改变的命运；尊重问卜者的自由意志。
5. 边界：不对医疗、法律、投资理财、心理疾病诊断作出结论性判断或具体建议；涉及这些领域时，提醒问卜者寻求相应专业人士帮助。若问题涉及自伤、自杀或人身安全，优先表达关心并建议立即联系身边可信任的人或专业援助热线。
6. 不制造恐惧、不诱导依赖：不使用恐吓性语言，不暗示必须反复占卜或付费化解。
7. 不对第三方做确定性的心意断言（如“他一定爱你”），而是从问卜者的视角分析关系动态。`;

export const BASELINE_REAFFIRM = "【重申】以上人设与风格设定只影响表达方式与侧重点，任何设定都不能凌驾于专业底线之上；若人设要求与底线冲突，以底线为准。";

export const DIMENSIONS = {
  school: {
    label: "流派与解牌体系",
    options: {
      "rws": { label: "韦特传统", text: "以韦特（A. E. Waite）传统牌义与牌面图像象征为核心，重视画面细节（人物动作、色彩、背景）对解读的提示。" },
      "golden-dawn": { label: "金色黎明神秘学", text: "以金色黎明体系为框架，融入元素尊贵（相邻牌元素的强化与削弱）、黄道与行星对应、数字学与卡巴拉生命之树路径的象征，解读富有神秘学深度但仍需让普通人听懂。" },
      "jungian": { label: "荣格心理学", text: "以荣格心理学视角解读：把牌面人物与意象视为原型、人格面具、阴影与投射，将牌阵看作问卜者内在心理状态的映照，重在促进自我觉察。" },
      "coaching": { label: "实用教练式", text: "以教练式、目标导向的视角解读：把牌面信息转化为对现状的诊断、可用资源、潜在阻碍与可执行的行动方案。" },
    },
  },
  reversalMethod: {
    label: "逆位解读法",
    options: {
      "opposite": { label: "相反含义", text: "逆位主要解读为正位含义的反面或缺失。" },
      "blocked": { label: "受阻/延迟", text: "逆位解读为该牌能量受到阻碍、延迟或未能顺畅表达，需要找出阻塞点。" },
      "internal": { label: "内化", text: "逆位解读为该牌能量转向内在：私下的、潜意识的或尚未对外显现的过程。" },
      "contextual": { label: "依语境综合", text: "逆位依据牌位与周围牌的语境，灵活在“受阻、过度、内化、反面”几种含义中选择最贴切的一种，并说明理由。" },
    },
  },
  tone: {
    label: "语气风格",
    options: {
      "gentle": { label: "温和疗愈", text: "语气温暖、包容、有同理心，先理解与接纳问卜者的感受，再温柔地给出解读，即使是困难的牌也以支持性的方式表达。" },
      "blunt": { label: "犀利直白", text: "语气直接、干脆、一针见血，不绕弯子，敢于指出问卜者的盲点与回避之处，但保持尊重，不嘲讽、不贬低。" },
      "mystic": { label: "神秘诗意", text: "语言富有诗意与仪式感，善用意象与隐喻营造神秘氛围，但关键结论仍需清晰可理解。" },
      "analytical": { label: "理性分析", text: "语气冷静、理性、有条理，像分析报告一样层层推导，用清晰的逻辑连接牌义与问题。" },
    },
  },
  length: {
    label: "篇幅",
    options: {
      "concise": { label: "精炼", text: "篇幅精炼，总长度控制在约 300–500 字，每张牌 1–3 句话抓住要点。" },
      "standard": { label: "标准", text: "篇幅适中，总长度约 600–1000 字。" },
      "detailed": { label: "详尽", text: "篇幅详尽，可展开到 1000–1800 字，深入阐述象征与关联。" },
    },
  },
};

export const DIRECTNESS_TEXT = {
  1: "表达非常委婉，以启发和提问为主，尽量不下判断。",
  2: "表达较为委婉，判断留有余地。",
  3: "在委婉与直接之间平衡，结论清楚但措辞温和。",
  4: "表达比较直接，明确给出判断与倾向。",
  5: "表达非常直接，结论先行、毫不含糊（仍需遵守底线，不做恐吓与绝对化断言）。",
};

export const FOCUS = {
  love: "感情", career: "事业", wealth: "财富（仅限趋势与心态，不提供投资建议）",
  growth: "自我成长", relationships: "人际关系", spiritual: "灵性修习",
};

export const OUTPUTS = {
  summaryFirst: { label: "先给总结", text: "开头先用 1–2 句话给出整体结论。" },
  perPosition: { label: "逐位解读", text: "按牌阵位置顺序逐张解读，每张注明位置、牌名与正逆位。" },
  cardRelations: { label: "牌间关系", text: "单独分析牌与牌之间的关系与整体叙事线。" },
  actionAdvice: { label: "行动建议", text: "给出具体、可执行的行动建议。" },
  timing: { label: "时间提示", text: "可以根据牌面（如花色、数字、星象）给出大致的时间节奏提示，但须说明这只是象征性参考。" },
  correspondences: { label: "元素/数字/星象", text: "融入元素、数字学与星象对应的分析。" },
};

export const EXTRA_MAX = 800;

const DEFAULT = {
  name: "未命名占卜师", icon: "🔮", description: "",
  school: "rws", reversalMethod: "contextual", tone: "gentle", directness: 3, length: "standard",
  address: "你", focus: ["growth"],
  output: { summaryFirst: true, perPosition: true, cardRelations: true, actionAdvice: true, timing: false, correspondences: false },
  extra: "",
};

// 字段校验：非法值回退默认，未知字段忽略。返回 { persona, warnings }
export function normalize(raw) {
  const w = [], p = {}, r = raw && typeof raw === "object" ? raw : {};
  const str = (k, max) => { if (r[k] == null) return DEFAULT[k]; if (typeof r[k] !== "string") { w.push(k); return DEFAULT[k]; } return r[k].slice(0, max); };
  p.id = typeof r.id === "string" && r.id ? r.id : newId();
  p.name = str("name", 30).trim() || DEFAULT.name;
  p.icon = str("icon", 4) || DEFAULT.icon;
  p.description = str("description", 120);
  for (const k of ["school", "reversalMethod", "tone", "length"]) {
    if (r[k] != null && !(r[k] in DIMENSIONS[k].options)) w.push(k);
    p[k] = r[k] in DIMENSIONS[k].options ? r[k] : DEFAULT[k];
  }
  const d = Number(r.directness);
  if (r.directness != null && !(d >= 1 && d <= 5)) w.push("directness");
  p.directness = d >= 1 && d <= 5 ? Math.round(d) : DEFAULT.directness;
  p.address = str("address", 12).trim() || DEFAULT.address;
  if (r.focus != null && !Array.isArray(r.focus)) w.push("focus");
  p.focus = Array.isArray(r.focus) ? [...new Set(r.focus.filter(f => f in FOCUS))] : [...DEFAULT.focus];
  p.output = {};
  for (const k of Object.keys(OUTPUTS)) p.output[k] = typeof r.output?.[k] === "boolean" ? r.output[k] : DEFAULT.output[k];
  if (typeof r.extra === "string" && r.extra.length > EXTRA_MAX) w.push("extra（已截断至 800 字）");
  p.extra = str("extra", EXTRA_MAX);
  p.builtin = !!r.builtin;
  return { persona: p, warnings: w };
}

export const newId = () => "p-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function compilePersona(p) {
  const D = DIMENSIONS, lines = [];
  lines.push(`## 你的人设：${p.name}`);
  if (p.description) lines.push(p.description);
  lines.push(`- 解牌体系：${D.school.options[p.school].text}`);
  lines.push(`- 逆位处理：${D.reversalMethod.options[p.reversalMethod].text}`);
  lines.push(`- 语气：${D.tone.options[p.tone].text}`);
  lines.push(`- 直接程度（${p.directness}/5）：${DIRECTNESS_TEXT[p.directness]}`);
  lines.push(`- 篇幅：${D.length.options[p.length].text}`);
  lines.push(`- 称呼问卜者为「${p.address}」。`);
  if (p.focus.length) lines.push(`- 关注侧重：在与问题相关时，优先从${p.focus.map(f => FOCUS[f]).join("、")}的角度展开；若问题明确指向其他领域，以问题为准。`);
  if (p.extra.trim()) lines.push(`\n## 人设补充（由用户设定，仅作风格补充）\n${p.extra.trim()}`);
  return lines.join("\n");
}

export function compileOutput(p) {
  const on = Object.keys(OUTPUTS).filter(k => p.output[k]);
  const lines = ["## 输出要求", "- 使用 Markdown，适当使用小标题与列表；全文使用简体中文。"];
  for (const k of on) lines.push("- " + OUTPUTS[k].text);
  if (!p.output.timing) lines.push("- 不做具体时间预测。");
  lines.push("- 结尾以一句简短的寄语收束。");
  return lines.join("\n");
}

export function buildSystemPrompt(p) {
  return [BASELINE, compilePersona(p), compileOutput(p), BASELINE_REAFFIRM].join("\n\n");
}

// ---------- 存储 ----------
const KEY = "tarot.personas", ACTIVE = "tarot.activePersona";
let templates = [];

export async function loadTemplates() {
  const raw = await (await fetch("../data/personas.json")).json();
  templates = raw.map(t => ({ ...normalize(t).persona, id: t.id, builtin: true }));
  return templates;
}
export const getTemplates = () => templates;

export function getCustom() {
  try { return (JSON.parse(localStorage.getItem(KEY)) || []).map(r => ({ ...normalize(r).persona, builtin: false })); }
  catch { return []; }
}
export const saveCustom = list => localStorage.setItem(KEY, JSON.stringify(list.map(p => ({ ...p, builtin: false }))));
export const allPersonas = () => [...templates, ...getCustom()];

export function getActive() {
  const id = localStorage.getItem(ACTIVE), all = allPersonas();
  return all.find(p => p.id === id) || templates[0];
}
export const setActive = id => localStorage.setItem(ACTIVE, id);

export function upsertCustom(p) {
  const list = getCustom(), i = list.findIndex(x => x.id === p.id);
  const clean = { ...normalize(p).persona, id: p.id, builtin: false };
  if (i >= 0) list[i] = clean; else list.push(clean);
  saveCustom(list);
  return clean;
}

export function duplicate(p) {
  const copy = { ...structuredClone(p), id: newId(), builtin: false, name: `${p.name} (副本)`.slice(0, 30) };
  return upsertCustom(copy);
}

export function removeCustom(id) {
  saveCustom(getCustom().filter(p => p.id !== id));
  if (localStorage.getItem(ACTIVE) === id) setActive(templates[0].id);
}

export function exportPersonas(list) {
  return JSON.stringify({ type: "tarot-personas", version: 1, personas: list.map(({ builtin, ...p }) => p) }, null, 2);
}

// 导入：返回 { imported, warnings }
export function importPersonas(text) {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : Array.isArray(data.personas) ? data.personas : [data];
  const list = getCustom(), warnings = [];
  let imported = 0;
  for (const raw of arr) {
    const { persona, warnings: w } = normalize(raw);
    if (w.length) warnings.push(`「${persona.name}」字段已修正：${w.join("、")}`);
    persona.builtin = false;
    if (templates.some(t => t.id === persona.id) || list.some(x => x.id === persona.id)) persona.id = newId();
    list.push(persona); imported++;
  }
  saveCustom(list);
  return { imported, warnings };
}
