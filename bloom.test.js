const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert');

const ROOT = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT, 'app', 'src', 'main', 'assets', 'index.html');
const JS_DIR = path.join(ROOT, 'web', 'src', 'js');

// 0. Repo hygiene check (no hardcoded personal machine paths)
const gradleProps = fs.readFileSync(path.join(ROOT, 'gradle.properties'), 'utf8');
assert(!/org\.gradle\.java\.home\s*=/.test(gradleProps), 'gradle.properties must not pin personal org.gradle.java.home');
assert(!/C:[/\\]Users[/\\]/i.test(gradleProps), 'gradle.properties must not contain hardcoded personal user paths');

// 1. Individually syntax-check every modular source file in web/src/js/
const jsModules = fs.readdirSync(JS_DIR).filter(f => f.endsWith('.js')).sort();
assert(jsModules.length > 0, 'Expected modular JS files under web/src/js/');
jsModules.forEach(file => {
  const code = fs.readFileSync(path.join(JS_DIR, file), 'utf8');
  new vm.Script(code, { filename: file });
});

// 2. Extract all script tags from built HTML and verify count + syntax
const html = fs.readFileSync(HTML_PATH, 'utf8');
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
const scripts = [];
let match;
while ((match = scriptRegex.exec(html)) !== null) {
  scripts.push(match[1]);
}
console.log(`Found ${scripts.length} <script> blocks (${jsModules.length} source modules)`);
assert(scripts.length === jsModules.length, `Expected ${jsModules.length} script blocks matching web/src/js modules, found ${scripts.length}`);

scripts.forEach((code, idx) => {
  new vm.Script(code, { filename: `script-${idx}.js` });
  console.log(`Syntax OK: script-${idx} (${jsModules[idx]})`);
});

// 3. Static check for data-act, data-form, data-chg coverage
const actsInHtml = new Set([...html.matchAll(/data-act="([^"$]+)"/g)].map(m => m[1]));
actsInHtml.add('jSelect');
actsInHtml.add('dayModal');
const formsInHtml = new Set([...html.matchAll(/data-form="([^"$]+)"/g)].map(m => m[1]));
const chgsInHtml = new Set([...html.matchAll(/data-chg="([^"$]+)"/g)].map(m => m[1]));

const lastScript = scripts[scripts.length - 1];
for (const a of actsInHtml) {
  assert(lastScript.includes(`case "${a}"`), `Missing click handler for data-act="${a}"`);
}
for (const f of formsInHtml) {
  assert(lastScript.includes(`case "${f}"`), `Missing submit handler for data-form="${f}"`);
}
for (const c of chgsInHtml) {
  assert(lastScript.includes(`"${c}"`), `Missing change handler for data-chg="${c}"`);
}
console.log(`Coverage OK: ${actsInHtml.size} data-act, ${formsInHtml.size} data-form, ${chgsInHtml.size} data-chg`);

// 4. Mock browser DOM & run all scripts
function makeEl(id = '', tag = 'div') {
  return {
    id, tagName: tag.toUpperCase(),
    innerHTML: '', textContent: '', className: '', value: '',
    dataset: {}, style: { setProperty() {} },
    children: [],
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(c) { this.children.push(c); return c; },
    remove() {},
    addEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getBoundingClientRect() { return { left: 100, top: 100, width: 40, height: 20 }; },
    closest() { return null; },
    click() {}
  };
}

const byId = {
  sidebar: makeEl('sidebar', 'aside'),
  view: makeEl('view', 'main'),
  bottomNav: makeEl('bottomNav', 'nav'),
  toasts: makeEl('toasts', 'div'),
  importFile: makeEl('importFile', 'input'),
  photoFile: makeEl('photoFile', 'input'),
};
const store = {};
const listeners = {};
let fakeNow = new Date(2026, 10, 22, 13, 30, 0); // 2026-11-22 (Sunday)

const FakeDate = class extends Date {
  constructor(...args) {
    if (args.length === 0) super(fakeNow.getTime());
    else super(...args);
  }
  static now() { return fakeNow.getTime(); }
};

const sandbox = {
  console, Math, JSON, Object, Array, Set, Map, Number, String, Boolean, Error,
  RegExp, Promise, Blob: class { constructor(a) { this.a = a; } },
  URL: { createObjectURL: () => 'blob:1', revokeObjectURL() {} },
  Date: FakeDate,
  setTimeout: () => 1,
  clearTimeout() {},
  setInterval: () => 1,
  clearInterval() {},
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  },
  window: { innerWidth: 1200, innerHeight: 800, scrollTo() {} },
  document: {
    body: makeEl('body', 'body'),
    hidden: false,
    createElement: (t) => makeEl('', t),
    getElementById: id => byId[id] || null,
    querySelector: sel => {
      if (sel.startsWith('#')) return byId[sel.slice(1)] || null;
      return null;
    },
    querySelectorAll: () => [],
    addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); }
  },
  FormData: class {
    constructor(obj) { this.m = obj || {}; }
    get(k) { return this.m[k] !== undefined ? this.m[k] : null; }
  },
  FileReader: class {},
  Image: class {},
  Notification: undefined
};
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
for (const code of scripts) {
  vm.runInContext(code, ctx);
}

const run = (code) => vm.runInContext(code, ctx);
const fireClick = (dataset) => {
  const el = makeEl();
  el.dataset = dataset;
  const ev = {
    target: { closest: (sel) => sel === '[data-act]' ? el : null },
    stopPropagation() {}
  };
  listeners.click.forEach(fn => fn(ev));
};
const fireSubmit = (formName, fields) => {
  const formEl = Object.assign(makeEl('', 'form'), { dataset: { form: formName }, ...fields });
  const ev = {
    target: { closest: (sel) => sel === 'form[data-form]' ? formEl : null },
    preventDefault() {}
  };
  listeners.submit.forEach(fn => fn(ev));
};

// Verify initial state & welcome screen
assert(run('S.courses.length === 8'), 'Default 8 courses loaded');
assert(byId.view.innerHTML.includes('Tuğba'), 'Home greeting rendered');
assert(byId.view.innerHTML.includes('Haftalık değerlendirmen hazır'), 'Sunday weekly report banner visible on 2026-11-22');
assert(run('shouldShowWelcome(today()) === true') && sandbox.document.body.children.some(c => c.id === 'welcomeScreen'), 'First open of day shows welcome screen');
fireClick({ act: 'startDay' });
assert(run('dayR(today()).welcomeSeen === true && load().days[today()].welcomeSeen === true && shouldShowWelcome(today()) === false'), 'Dismissing welcome persists welcomeSeen and skips re-asking today');
const wcSameDay = sandbox.document.body.children.filter(c => c.id === 'welcomeScreen').length;
run('init()');
assert(sandbox.document.body.children.filter(c => c.id === 'welcomeScreen').length === wcSameDay && run('UI.page === "home"'), 'Re-launching on same day skips welcome and opens directly to home');
fireClick({ act: 'showWelcome' });
assert(sandbox.document.body.children.filter(c => c.id === 'welcomeScreen').length === wcSameDay + 1, 'Settings showWelcome still opens welcome screen manually');
fireClick({ act: 'welcomeMood', m: 'iyi', k: run('today()') });
assert(run('dayR(today()).mood === "iyi" && dayR(today()).welcomeSeen === true && load().days[today()].mood === "iyi"'), 'Picking mood on welcome saves mood and marks welcomeSeen');
assert(run('(() => { S.days["2026-11-20"] = { mood: "iyi" }; return shouldShowWelcome("2026-11-20") === false; })()'), 'Legacy day with mood already set skips welcome');

// Test rendering EVERY page & tab
run(`
  const checks = [
    () => { UI.page = 'home'; ['today','tomorrow','week','cal'].forEach(t => { UI.homeTab = t; render(); }); },
    () => { UI.page = 'routines'; [false, true].forEach(e => { UI.routineEdit = e; render(); }); },
    () => { UI.page = 'water'; render(); },
    () => { UI.page = 'skincare'; ['morning','evening'].forEach(t => [false, true].forEach(e => { UI.skinTab = t; UI.skinEdit = e; render(); })); },
    () => { UI.page = 'exercise'; ['today','week','plan'].forEach(t => { UI.exTab = t; render(); }); },
    () => { UI.page = 'nutrition'; ['day','plan','suggest'].forEach(t => { UI.nutTab = t; render(); }); },
    () => {
      UI.page = 'school';
      ['courses','exams','grades','study'].forEach(t => { UI.schoolTab = t; render(); });
      UI.course = S.courses[0].id;
      ['general','topics','weeks','review'].forEach(t => { UI.courseTab = t; render(); });
      UI.course = null;
    },
    () => { UI.page = 'garden'; render(); },
    () => { UI.page = 'progress'; ['week','month'].forEach(r => { UI.progRange = r; render(); }); },
    () => { UI.page = 'journal'; ['entry','favs'].forEach(t => { UI.jTab = t; render(); }); },
    () => { UI.page = 'settings'; render(); },
  ];
  checks.forEach((fn, i) => {
    fn();
    if (document.getElementById('view').innerHTML.length <= 100) throw new Error('Empty render at ' + i);
  });
`);
console.log('All pages and tabs rendered cleanly!');

// Test interactive click & form handlers
const xpBeforeWater = run('S.xp.total');
const growthBeforeWater = run('S.garden.growth');
assert(run('hasItem("flowers") && hasItem("stones") && hasItem("pots")'), 'Starter garden items unlocked at Level 1');
const svgBeforeHide = run('gardenSVG()');
fireClick({ act: 'toggleGardenItem', id: 'pots' });
assert(run('S.garden.hidden.pots === true && !hasItem("pots")'), 'Garden item toggled hidden');
assert(run('gardenSVG()') !== svgBeforeHide, 'Hiding garden item updates gardenSVG');
fireClick({ act: 'toggleGardenItem', id: 'pots' });
assert(run('!S.garden.hidden.pots && hasItem("pots")'), 'Garden item toggled visible again');
assert(run('gardenThemeForTime(new Date(2026, 10, 24, 8, 0)).k === "sabah" && gardenThemeForTime(new Date(2026, 10, 24, 13, 0)).k === "oglen" && gardenThemeForTime(new Date(2026, 10, 24, 18, 30)).k === "aksam" && gardenThemeForTime(new Date(2026, 10, 24, 22, 30)).k === "gece" && gardenThemeForTime(new Date(2026, 10, 24, 3, 0)).k === "gece"'), 'Garden theme follows sabah/oglen/aksam/gece hours automatically');
assert(run('(() => { const d = gardenSVG(new Date(2026, 10, 24, 13, 0)), a = gardenSVG(new Date(2026, 10, 24, 18, 30)), n = gardenSVG(new Date(2026, 10, 24, 22, 30)); return d.includes("#CBE7F7") && !d.includes("twinkle") && a.includes("#CCAEDB") && n.includes("#332E56") && n.includes("twinkle"); })()'), 'Garden SVG sky brightens in daytime and darkens with stars at dusk/night');
assert(run('!pageGarden().includes("data-act=\\"gardenTheme\\"") && !pageSettings().includes("data-act=\\"gardenTheme\\"")'), 'Manual gardenTheme selector removed from garden and settings screens');

// Weight-only progress entry awards XP + growth immediately
const xpPreProg = run('S.xp.total');
const gPreProg = run('S.garden.growth');
fireSubmit('progress', { id: '', date: run('addDays(today(), -5)'), weight: '63.0', waist: '', hip: '', arm: '', leg: '', move: '', steps: '', energy: '', sleep: '', note: 'Tartı' });
assert(run('S.xp.total') === xpPreProg + 10, 'Weight-only progress awarded +10 XP');
assert(run('S.garden.growth') === gPreProg + 4, 'Weight-only progress awarded +4 garden growth');

fireClick({ act: 'setMood', m: 'harika', k: run('today()') });
assert(run('dayR(today()).mood === "harika"'), 'Mood saved via click');

fireClick({ act: 'addWater', ml: '500' });
assert(run('S.garden.growth') > gPreProg + 4, 'Single water addition immediately grows garden');
fireClick({ act: 'addWater', ml: '1500' });
assert(run('waterTotal(today()) === 2000'), 'Water total = 2000 via click');
assert(run('S.xp.total >= 15'), 'Water goal XP awarded');
assert(run('S.garden.bank === 2000'), 'Garden bank = 2000');

fireClick({ act: 'waterTree' });
assert(run('S.garden.watered === 1 && S.garden.bank === 1750 && S.garden.growth > 0'), 'Watered tree via click');

// Complete morning routine via clicks
const mIds = run('morningList(today()).map(t => t.id)');
mIds.forEach(id => fireClick({ act: 'toggleTask', id }));
assert(run('dayR(today()).xp.morning === 20'), 'Morning routine completion awarded +20 XP');
assert(run('levelInfo().level >= 2 && hasItem("butterflies") && gardenSVG().includes("bf1")'), 'Level 2 unlocks butterflies and renders bf1 in gardenSVG');

// Submit goal, meal, journal, progress, course, week, slide, exam, study
fireSubmit('addGoal', { k: run('today()'), text: '10 sayfa EKG oku' });
assert(run('dayR(today()).goals.length === 1'), 'Goal added via form');

fireSubmit('meal', { id: '', cat: 'ogle', name: 'Izgara somon', desc: 'Salata ile', date: run('today()'), time: '13:00', portion: '1 porsiyon', cal: '', protein: 'somon', veg: 'on', note: 'Çok iyi' });
assert(run('S.meals.length === 1 && S.meals[0].veg === true && S.meals[0].cal > 0'), 'Meal added via form with auto-calculated calories');

// Test calorie estimator edge cases
assert(run('(() => { const e = estimateCalories("Mercimek çorbası + yoğurt", "", "1 porsiyon", "ogle"); return e.kcal === 290 && e.matches.length === 2; })()'), 'Calorie estimator matches non-overlapping dishes (290 kcal)');
assert(run('estimateCalories("Tam tahıllı ekmek", "", "2 dilim", "kahvalti").kcal === 150'), 'Portion multiplier 2 dilim = 150 kcal');
assert(run('estimateCalories("Makarna", "", "yarım porsiyon", "ogle").kcal === 155'), 'Portion multiplier yarım porsiyon = 155 kcal');
assert(run('estimateCalories("Somon", "", "200 gr", "aksam").kcal >= 410'), 'Gram scaling 200 gr somon works');
assert(run('estimateCalories("Ev yapımı özel tabak", "", "", "ogle").fallback === true'), 'Unknown meal falls back cleanly by category');

// Test İçindekiler (ingredients-based realistic calorie calculator)
assert(run('estimateCalories("", "", "", "kahvalti", "1 yemek kaşığı zeytinyağı").kcal === 88'), '1 yemek kaşığı zeytinyağı = 88 kcal');
assert(run('estimateCalories("", "", "", "kahvalti", "1 yemek kasigi zeytinyagi").kcal === 88'), 'ASCII Turkish 1 yemek kasigi zeytinyagi = 88 kcal');
assert(run('estimateCalories("", "", "", "kahvalti", "1 tatlı kaşığı bal").kcal === 30'), '1 tatlı kaşığı bal = 30 kcal');
assert(run('(() => { const e = estimateCalories("", "", "", "kahvalti", "1 çay kaşığı bal"); return e.kcal === 15 && e.matches.length === 1; })()'), '1 çay kaşığı bal = 15 kcal without matching çay');
assert(run('(() => { const e = estimateCalories("", "", "", "kahvalti", "1 su bardağı süt"); return e.kcal === 110 && e.matches.length === 1; })()'), '1 su bardağı süt = 110 kcal without matching su');
assert(run('(() => { const e = estimateCalories("Özel kahvaltım", "", "", "kahvalti", "1 yemek kaşığı zeytinyağı\\n2 adet yumurta\\n30 gr beyaz peynir, 1 orta domates\\n1,5 yemek kaşığı yoğurt"); return e.fromIngredients && e.matches.length === 5 && e.kcal === 378; })()'), 'Multi-line ingredients calculate exact 378 kcal');
assert(run('(() => { const e = estimateCalories("", "", "", "ogle", "1 yemek kaşığı zeytinyağı, 1 kaşık gizli sos"); return e.unknown.length === 0 && e.matches.length === 2 && e.items[1].inferred === true && e.kcal === 115; })()'), 'Category inference handles custom sauce (88 + 27 = 115 kcal) with zero unknown');
assert(run('(() => { const e = estimateCalories("", "", "", "ogle", "1 dilim ekmeği, 2 kaşık yoğurdu, 100 gr tavuğu, 1 adet kabağı"); return e.unknown.length === 0 && e.items.every(x => !x.inferred) && e.items.length === 4; })()'), 'Turkish suffix & consonant softening stems matched cleanly');
assert(run('(() => { const e = estimateCalories("", "", "", "ogle", "1 adet avokoda, 100 gr brokkoli, 1 kase yoghurt"); return e.unknown.length === 0 && e.items.every(x => !x.inferred) && e.items.length === 3; })()'), 'Typo tolerance matches avokoda/brokkoli/yoghurt cleanly');
assert(run('(() => { const e = estimateCalories("", "", "", "ogle", "1 ölçek whey protein, 100 gr tatlı patates, 1 yemek kaşığı tahin helvası"); return e.unknown.length === 0 && e.items.every(x => !x.inferred) && e.items.length === 3; })()'), 'Expanded Turkish & fitness food database matches cleanly');
assert(run('(() => { const e = estimateCalories("", "", "", "ogle", "1 yemek kaşığı xplorax"); return e.unknown.length === 0 && e.items[0].inferred === true && e.kcal > 0; })()'), 'Completely novel brand falls back to universal unit-based estimate (zero unknown)');
run('S.customFoods.push({id: uid(), name: "Xplorax", kw: "xplorax", kcal100: 400, defUnit: "porsiyon"}); save();');
assert(run('(() => { const e = estimateCalories("", "", "", "ogle", "1 yemek kaşığı xplorax"); return e.items[0].inferred === false && e.kcal === 60; })()'), 'Custom learned food overrides universal estimate (1 yk = 60 kcal)');
fireClick({ act: 'openTeachFood', name: 'Test', kcal: '100' });
fireClick({ act: 'closeTeachFood' });
fireClick({ act: 'saveCustomFood' });

fireSubmit('meal', { id: '', cat: 'kahvalti', name: 'Kahvaltı tabağım', ingredients: '1 yemek kaşığı zeytinyağı\n2 adet yumurta\n30 gr beyaz peynir, 1 orta domates\n1,5 yemek kaşığı yoğurt', desc: '', date: run('today()'), time: '09:30', portion: '', cal: '', protein: 'yumurta + peynir', veg: 'on', note: 'Dengeli' });
assert(run('S.meals.length === 2 && S.meals[1].ingredients.includes("zeytinyağı") && S.meals[1].cal === 378 && S.meals[1].calManual === false'), 'Meal with ingredients computes and stores 378 kcal');

// Test Online Food Search (Open Food Facts) & Gemini AI Calorie Studio
assert(run('(() => { const p = parseOffProduct({code:"869001", product_name_tr:"Form Tam Buğday Kraker", brands:"Eti, Eti Gıda", serving_size:"38 g", nutriments:{"energy-kcal_100g":412, proteins_100g:9.8, carbohydrates_100g:68, fat_100g:9.5}}); return p && p.name === "Eti Form Tam Buğday Kraker" && p.kcal100 === 412 && p.servingG === 38 && p.prot100 === 9.8; })()'), 'parseOffProduct parses kcal, primary brand, serving grams, and macros');
assert(run('(() => { const p = parseOffProduct({code:"123", product_name:"Sütaş Ayran", nutriments:{"energy-kj_100g":167.36}}); return p && p.kcal100 === 40 && parseOffProduct({product_name:"Empty"}) === null; })()'), 'parseOffProduct falls back to kJ->kcal conversion and filters invalid items');
assert(run('searchLocalFoods("zeytinyağı").some(x => x.name === "Zeytinyağı" && x.kcal100 === 884)'), 'searchLocalFoods matches ING_DB immediately');
run('cacheOnlineFood(parseOffProduct({code:"99", product_name:"Fellas Protein Bar", serving_quantity:45, nutriments:{"energy-kcal_100g":360, proteins_100g:28}}), "fellas bar");');
assert(run('(() => { const e = estimateCalories("", "", "", "ara", "1 paket fellas bar"); return e.items[0].inferred === false && e.kcal === 162; })()'), 'Online food cached with alias kw resolves offline (45g * 360/100 = 162 kcal)');
assert(run('(() => { const p = buildGeminiMealPayload({cat:"aksam", name:"Tabak", ingredients:"150g somon, salata"}, "data:image/jpeg;base64,QUJD"); return p.contents[0].parts.length === 2 && p.contents[0].parts[1].inlineData.data === "QUJD" && p.generationConfig.responseMimeType === "application/json"; })()'), 'buildGeminiMealPayload encodes text prompt and base64 photo inlineData cleanly');
assert(run('(() => { const ai = parseGeminiMealResponse({candidates:[{content:{parts:[{text:"```json\\n{\\"total_kcal\\":455,\\"protein_g\\":32,\\"carbs_g\\":35,\\"fat_g\\":18,\\"protein_source\\":\\"Izgara somon\\",\\"has_veg\\":true,\\"note\\":\\"Dengeli!\\",\\"items\\":[{\\"name\\":\\"Somon\\",\\"amount\\":\\"150g\\",\\"grams\\":150,\\"kcal\\":310},{\\"name\\":\\"Salata\\",\\"amount\\":\\"1 kase\\",\\"grams\\":180,\\"kcal\\":145}]}\\n```"}]}}]}); return ai && ai.total_kcal === 455 && ai.protein_g === 32 && aiBreakdownHTML(ai).includes("32g") && aiBreakdownHTML(ai).includes("Dengeli!"); })()'), 'parseGeminiMealResponse parses fenced JSON, macros, and renders aiBreakdownHTML');
assert(run('(() => { const mf = mealFormHTML({}); const ps = pageSettings(); return mf.includes("id=\\"foodSearchInput\\"") && mf.includes("data-act=\\"foodSearchOnline\\"") && mf.includes("data-act=\\"aiCalcMeal\\"") && mf.includes("id=\\"aiSetupBox\\"") && ps.includes("data-form=\\"aiSettings\\""); })()'), 'Meal modal and Settings screen include search and Gemini AI controls');
fireSubmit('aiSettings', { aiKey: 'AIzaTest123', aiModel: 'gemini-2.5-flash' });
assert(run('S.settings.aiKey === "AIzaTest123" && load().settings.aiKey === "AIzaTest123" && pageSettings().includes("Bağlı ✓")'), 'aiSettings form saves Gemini key and updates Settings status');
fireClick({ act: 'clearAiKey' });
assert(run('S.settings.aiKey === "" && load().settings.aiKey === ""'), 'clearAiKey removes Gemini key');
fireSubmit('aiSettings', { aiKey: 'AIzaFinalKey', aiModel: 'gemini-2.0-flash' });
fireSubmit('meal', { id: '', cat: 'aksam', name: 'AI Somon Tabağı', ingredients: '150g somon, salata', desc: '', date: run('today()'), time: '19:30', portion: '1 tabak', cal: '455', macrosJson: '{"p":32,"c":35,"f":18}', calSource: 'ai', protein: 'Somon', veg: 'on', note: 'Harika' });
assert(run('(() => { const m = S.meals[2]; return m && m.cal === 455 && m.macros.p === 32 && m.calSource === "ai" && mealCard(m).includes("P 32g · K 35g · Y 18g"); })()'), 'Meal stores and renders AI macros and calSource');

fireSubmit('journal', { k: run('today()'), text: 'Güzel bir gün', q1: 'Kahve', q2: '', q3: 'Yürüyüş', q4: 'Sabah rutini', q5: 'Dinlenmek' });
assert(run('dayR(today()).xp.journal === 10'), 'Journal XP awarded via form');

fireSubmit('progress', { id: '', date: run('addDays(today(), -3)'), weight: '62.5', waist: '70', hip: '98', arm: '28', leg: '54', move: '25', steps: '6000', energy: '4', sleep: '7.5', note: '' });
fireSubmit('progress', { id: '', date: run('today()'), weight: '62.2', waist: '69.5', hip: '97.5', arm: '28', leg: '54', move: '30', steps: '7200', energy: '5', sleep: '8', note: 'Enerjik' });
assert(run('S.progress.length === 3'), 'Progress entries added via form');

const c0Id = run('S.courses[0].id');
run(`UI.course = "${c0Id}"`);
fireSubmit('topicAdd', { type: 'covered', text: 'Sinüs Taşikardisi' });
assert(run('S.courses[0].covered.some(x => x.text === "Sinüs Taşikardisi") && S.courses[0].todo.some(x => x.text === "Sinüs Taşikardisi")'), 'Adding covered topic automatically adds it to todo list');
fireSubmit('topicAdd', { type: 'todo', text: 'Sinüs Taşikardisi' });
fireSubmit('topicAdd', { type: 'covered', text: 'sinüs taşikardisi' });
assert(run('S.courses[0].covered.length === 1 && S.courses[0].todo.length === 1'), 'Duplicate topic additions are prevented across covered and todo');
fireSubmit('topicAdd', { type: 'todo', text: 'AV Bloklar' });
assert(run('(() => { const t = courseTopicsList(S.courses[0]); return t.length === 2 && t[0].text === "Sinüs Taşikardisi" && t[1].text === "AV Bloklar"; })()'), 'courseTopicsList merges and deduplicates covered and todo topics');

fireSubmit('week', { id: '', num: '5', date: run('today()'), title: 'Ritim Bozuklukları' });
const wId = run('S.courses[0].weeks[0].id');
assert(run(`(() => { const wh = weekFormHTML({}, 6, S.courses[0]); return wh.includes("weekTopicList") && wh.includes("Sinüs Taşikardisi") && wh.includes("AV Bloklar"); })()`), 'weekFormHTML includes course topics in datalist');
assert(run(`(() => { const sh = slideFormHTML("${wId}", {}, S.courses[0]); const selPart = (sh.match(/<select id="slideTopicSelect"[\\s\\S]*?<\\/select>/) || [""])[0]; const optCount = (selPart.match(/<option\\b/g) || []).length; return sh.includes('data-chg="pickSlideTopic"') && sh.includes('data-act="pickSlideTopic"') && optCount === 3 && selPart.includes('Sinüs Taşikardisi') && selPart.includes('AV Bloklar'); })()`), 'slideFormHTML offers course topics once per unique topic');
fireClick({ act: 'pickSlideTopic', val: 'AV Bloklar' });
fireSubmit('slide', { weekId: wId, id: '', no: '1', name: 'Sinüs Ritimleri', date: run('today()'), status: '2', notes: 'Önemli' });
fireSubmit('track', { weekId: wId, solved: '20', wrong: '2', covered: 'Sinüs\nAF', todo: 'VF', done: 'P dalgası', missing: '', review: 'AV blok' });
fireSubmit('exam', { id: '', courseId: c0Id, name: 'Vize', date: run('addDays(today(), 3)'), priority: 'Yüksek', topics: 'EKG', plan: 'Slayt tekrarı' });
fireSubmit('study', { courseId: c0Id, date: run('today()'), minutes: '45', topic: 'EKG ritimleri' });

// Test Sınav notlarım (grades), AKTS & Geçme Notu
assert(run('passGrade() === 60 && S.courses.every(c => c.ects === 3)'), 'Default passGrade is 60 and courses default to 3 AKTS');
assert(run('(() => { const m = merge(defaults(), {version:1, settings:{waterGoal:2000}, courses:[{id:"x",name:"Test"}]}); return m.settings.passGrade === 60 && m.courses[0].ects === 3; })()'), 'Migration fills missing passGrade=60 and course.ects=3');

fireSubmit('grade', { id: '', courseId: c0Id, type: 'Vize', score: '70', weight: '40', date: run('today()'), note: 'İlk sınav' });
assert(run(`courseGradeSummary("${c0Id}").need60 === 54`), 'Need 54 in 60% final to pass with 60');
fireSubmit('passGrade', { passGrade: '50' });
assert(run(`courseGradeSummary("${c0Id}").needPass === 37 && letterGrade(54).l === "DD" && letterGrade(54).passed === true`), 'Pass grade 50 updates needPass to 37 and 54 -> DD (passed)');
fireSubmit('passGrade', { passGrade: '60' });

fireSubmit('grade', { id: '', courseId: c0Id, type: 'Final', score: '85', weight: '60', date: run('today()'), note: '' });
assert(run(`courseGradeSummary("${c0Id}").avg === 79 && courseGradeSummary("${c0Id}").letter.l === "CB"`), 'Weighted average 79 (CB)');
fireSubmit('grade', { id: '', courseId: c0Id, type: 'Bütünleme', score: '95', weight: '60', date: run('today()'), note: 'Büt' });
assert(run(`courseGradeSummary("${c0Id}").avg === 85 && courseGradeSummary("${c0Id}").letter.l === "BA"`), 'Bütünleme supersedes Final -> 85 (BA)');

const c1Id = run('S.courses[1].id');
run(`S.courses[0].ects = 6; S.courses[1].ects = 2; save();`);
fireSubmit('grade', { id: '', courseId: c1Id, type: 'Final', score: '65', weight: '100', date: run('today()'), note: '' });
assert(run('(() => { const h = schoolGrades(); return h.includes("80") && h.includes("3.00"); })()'), 'AKTS-weighted overall average (80) and GPA (3.00) computed correctly');

fireSubmit('passGrade', { passGrade: '70' });
assert(run(`passGrade() === 70 && courseGradeSummary("${c1Id}").letter.l === "FF" && courseGradeSummary("${c1Id}").passed === false && courseGradeSummary("${c0Id}").passed === true`), 'Custom passGrade=70 marks 65 as FF (failed) and 85 as passed');
assert(run('(() => { const ps = pageSettings(); return ps.includes("data-chg=\\"courseEcts\\"") && ps.includes("data-form=\\"passGrade\\"") && ps.includes("Geçme notum"); })()'), 'Settings screen shows AKTS per course and Geçme notum form');

// Test Cilt Bakım Rutini (skincare)
assert(run('NAV_EXTRA.map(x => x.p).join(",") === "water,skincare,exercise,settings"'), 'NAV_EXTRA has water, skincare, exercise, settings');
assert(html.includes('data-page="water"') && html.includes('data-page="skincare"') && html.includes('data-page="exercise"') && html.includes('data-page="settings"'), 'Topbar includes exercise button beside water, skincare and settings');
assert(run('S.skincare.morning[0].step === "Diş fırçalama" && S.skincare.morning[0].fixed && S.skincare.morning[1].step === "Yüz yıkama" && S.skincare.morning[1].fixed'), 'Morning skincare starts with fixed Diş fırçalama then Yüz yıkama');
assert(run('S.skincare.evening[0].step === "Diş fırçalama" && S.skincare.evening[0].fixed && S.skincare.evening.some(x => x.step === "Yüz yıkama" && x.fixed)'), 'Evening skincare includes fixed Diş fırçalama and Yüz yıkama');
assert(run('merge(defaults(), {version:1, days:{}}).skincare.morning.length === 6'), 'Migration from old LocalStorage populates skincare defaults');

const mLen0 = run('S.skincare.morning.length'), eLen0 = run('S.skincare.evening.length');
fireSubmit('skinItem', { id: '', origTab: 'morning', when: 'both', icon: '👁️', step: 'Göz kremi', product: 'Kafein Göz Kremi', note: 'Yüzük parmağıyla nazikçe' });
assert(run(`S.skincare.morning.length === ${mLen0 + 1} && S.skincare.evening.length === ${eLen0 + 1}`), 'Adding product with both adds to morning and evening');
assert(run('S.skincare.morning.at(-1).id !== S.skincare.evening.at(-1).id'), 'Morning and evening copies have separate IDs');

const customMId = run('S.skincare.morning.at(-1).id');
const customEId = run('S.skincare.evening.at(-1).id');
fireSubmit('skinItem', { id: customMId, origTab: 'morning', when: 'morning', icon: '👁️', step: 'Göz kremi', product: 'Peptit Göz Kremi', note: 'Sabah ince tabaka' });
assert(run(`S.skincare.morning.at(-1).product === "Peptit Göz Kremi" && S.skincare.morning.length === ${mLen0 + 1}`), 'Editing skincare item updates product in place');

fireClick({ act: 'skinMove', tab: 'morning', id: customMId, dir: '-1' });
assert(run(`S.skincare.morning[${mLen0 - 1}].id === "${customMId}"`), 'Reordering skincare item moves it up');

fireClick({ act: 'skinDel', tab: 'morning', id: 'sk_m_teeth' });
assert(run('S.skincare.morning.some(x => x.id === "sk_m_teeth")'), 'Fixed skincare step cannot be deleted');

fireClick({ act: 'skinDel', tab: 'morning', id: customMId });
assert(run(`S.skincare.morning.length === ${mLen0} && !S.skincare.morning.some(x => x.id === "${customMId}")`), 'Custom skincare step can be deleted');

const skMIds = run('S.skincare.morning.map(x => x.id)');
skMIds.forEach(id => fireClick({ act: 'skinToggle', tab: 'morning', id }));
assert(run('dayR(today()).xp.skin_done_morning === 10'), 'Completing all morning skincare steps awards +10 XP');

// Test Egzersiz (exercise)
assert(run('(() => { const m = merge(defaults(), {version:1, days:{}}); return Array.isArray(m.exercise.logs) && [1,2,3,4,5,6,7].every(i => Array.isArray(m.exercise.plan[i])); })()'), 'Migration populates 7-day exercise plan and logs');
const todayDow = run('dow1(today())'), pCount0 = run(`S.exercise.plan[${todayDow}].length`);
fireSubmit('exPlan', { id: '', origDay: String(todayDow), day: String(todayDow), type: 'pilates', name: 'Test Egzersiz Planı', min: '20', sets: '3x10', note: 'Plan test' });
assert(run(`S.exercise.plan[${todayDow}].length === ${pCount0 + 1}`), 'Exercise added to weekly program');
const pNewId = run(`S.exercise.plan[${todayDow}].at(-1).id`);
fireSubmit('exPlan', { id: pNewId, origDay: String(todayDow), day: String(todayDow), type: 'pilates', name: 'Test Egzersiz Planı v2', min: '25', sets: '3x12', note: 'Güncel' });
assert(run(`S.exercise.plan[${todayDow}].at(-1).min === 25 && S.exercise.plan[${todayDow}].at(-1).name === "Test Egzersiz Planı v2"`), 'Planned exercise updated in place');

const moveBeforeEx = run('dayR(today()).move.min || 0'), xpBeforeEx = run('S.xp.total');
fireSubmit('exLog', { id: '', planId: '', date: run('today()'), name: 'Özel Yürüyüş Testi', type: 'yuruyus', min: '30', sets: '', feel: 'enerjik', note: 'Ferah' });
assert(run(`S.exercise.logs.length === 1 && dayR(today()).move.min === ${moveBeforeEx + 30} && S.xp.total > ${xpBeforeEx}`), 'Logging exercise updates daily move minutes and awards XP');
const exLog0Id = run('S.exercise.logs[0].id');
fireClick({ act: 'exLogDel', id: exLog0Id });
assert(run(`S.exercise.logs.length === 0 && dayR(today()).move.min === ${moveBeforeEx}`), 'Deleting exercise log restores daily move minutes');

fireClick({ act: 'exQuickPreset', idx: '0' });
assert(run('S.exercise.logs.length === 1'), 'Quick preset logs exercise in one tap');
fireClick({ act: 'exQuickDone', id: pNewId });
assert(run('S.exercise.logs.length === 2 && S.exercise.logs[1].planId === "' + pNewId + '"'), 'Completing planned exercise via exQuickDone logs today');
fireClick({ act: 'exPlanDel', day: String(todayDow), id: pNewId });
assert(run(`S.exercise.plan[${todayDow}].length === ${pCount0}`), 'Deleting planned exercise removes it from plan');
assert(run('exWeekView(weekStart(today())).includes("Test Egzersiz Planı v2")'), 'Weekly exercise table displays logged exercises');

// Re-render every view with populated data + modals
run(`
  UI.page = 'home'; ['today','tomorrow','week','cal'].forEach(t => { UI.homeTab = t; render(); });
  UI.page = 'routines'; [false, true].forEach(e => { UI.routineEdit = e; render(); });
  UI.page = 'water'; render();
  UI.page = 'skincare'; ['morning','evening'].forEach(t => [false, true].forEach(e => { UI.skinTab = t; UI.skinEdit = e; render(); }));
  UI.page = 'exercise'; ['today','week','plan'].forEach(t => { UI.exTab = t; render(); });
  UI.page = 'nutrition'; ['day','plan','suggest'].forEach(t => { UI.nutTab = t; render(); });
  UI.page = 'school'; ['courses','exams','grades','study'].forEach(t => { UI.schoolTab = t; render(); });
  UI.course = "${c0Id}"; ['general','topics','weeks','review'].forEach(t => { UI.courseTab = t; render(); });
  UI.course = null;
  UI.page = 'garden'; render();
  UI.page = 'progress'; ['week','month'].forEach(r => { UI.progRange = r; render(); });
  UI.page = 'journal'; ['entry','favs'].forEach(t => { UI.jTab = t; render(); });
  UI.page = 'settings'; render();
  openDayModal(today());
  openWeekReport(weekStart(today()));
  openReadModal('r1');
`);

// Test day rollover
const oldDay = run('today()');
const wcBeforeRoll = sandbox.document.body.children.filter(c => c.id === 'welcomeScreen').length;
fakeNow = new Date(2026, 10, 23, 8, 15, 0);
run('checkDayRollover()');
const newDay = run('today()');
assert(oldDay !== newDay, 'Day rolled over');
assert(run('UI.page === "home" && shouldShowWelcome(today()) === true'), 'New day resets to home and schedules welcome screen once');
assert(sandbox.document.body.children.filter(c => c.id === 'welcomeScreen').length === wcBeforeRoll + 1, 'Day rollover displays welcome screen for new morning');
fireClick({ act: 'startDay' });
assert(run(`dayR("${newDay}").welcomeSeen === true && load().days["${newDay}"].welcomeSeen === true && shouldShowWelcome("${newDay}") === false`), 'Dismissing new-day welcome persists welcomeSeen');
assert(run(`waterTotal("${oldDay}") === 2000`), 'Yesterday water preserved');
assert(run(`waterTotal("${newDay}") === 0`), 'Today water starts at 0');
assert(run('S.meals.length === 3'), 'Meals preserved across rollover');

// Test LocalStorage round-trip & merge
assert(run(`load().xp.total === S.xp.total`), 'XP persisted in LocalStorage');
assert(run(`load().courses[0].weeks.length === 1`), 'Course week persisted');
assert(run(`load().days["${oldDay}"].water.length === 2`), 'Old day water entries preserved in LocalStorage');
assert(run(`load().days["${oldDay}"].journal.text === "Güzel bir gün"`), 'Old day journal preserved in LocalStorage');
assert(run('load().grades.length === 4'), 'Grades persisted in LocalStorage');
assert(run('load().settings.passGrade === 70 && load().courses[0].ects === 6'), 'Pass grade and course AKTS persisted in LocalStorage');
assert(run('load().meals[1].ingredients.includes("zeytinyağı") && load().meals[1].cal === 378'), 'Meal ingredients persisted in LocalStorage');
assert(run('load().meals[2].macros.p === 32 && load().settings.aiKey === "AIzaFinalKey" && load().settings.aiModel === "gemini-2.0-flash"'), 'AI meal macros and Gemini settings persisted in LocalStorage');
assert(run('load().customFoods.some(x => x.kw === "xplorax" && x.kcal100 === 400)'), 'Custom foods persisted in LocalStorage');
assert(run(`load().skincare.evening.some(x => x.id === "${customEId}")`), 'Skincare custom steps persisted in LocalStorage');
assert(run('load().exercise.logs.length === 2 && load().exercise.plan[1].length >= 1'), 'Exercise plan and logs persisted in LocalStorage');

console.log('ALL VERIFICATION CHECKS PASSED!');
