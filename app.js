'use strict';
/* ═════════ Family Rate Pro · Smart OTP Pricing Engine ═════════ */
const $ = id => document.getElementById(id);
const taka  = n => (n < 0 ? '−৳' : '৳') + Math.abs(Math.round(n)).toLocaleString('en-IN');
const signed = n => (n > 0 ? '+৳' : n < 0 ? '−৳' : '৳') + Math.abs(Math.round(n)).toLocaleString('en-IN');

const gbSlabs  = [20,30,40,50,60,70,80,100];
const minSlabs = [100,200,300,400,500,800,1000,1500,2000];
const nearest  = (a,x) => a.reduce((p,v) => Math.abs(v-x) < Math.abs(p-x) ? v : p, a[0]);
const bnNum    = s => String(s).replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));

const OPERATORS = {
  airtel:{name:'এয়ারটেল',  c:'#e11d48'},
  robi:  {name:'রবি',       c:'#e2231a'},
  gp:    {name:'জিপি',      c:'#0072bc'},
  bl:    {name:'বাংলালিংক', c:'#ea580c'},
  tt:    {name:'টেলিটক',    c:'#0e9f4f'},
  otp:   {name:'OTP',       c:'#7c3aed'}
};

/* ── pure calculation engine ─────────────────────────────────
   cost=ফ্যামিলি প্যাকের ব্যালেন্স, target=টার্গেট সেল,
   dist=প্রতি জন ডিস্ট্রিবিউশন রেট, market=OTP-র মার্কেট ভ্যালু,
   risk=% বাফার (সদস্য না কেনা / দর কষাকষির ঝুঁকি)          */
function compute(i){
  const four    = i.dist * 4;                       // ৪ জনের ডিস্ট্রিবিউশন আয়
  const effFour = four * (1 - i.risk / 100);        // ঝুঁকি-সহ ডিস্ট্রিবিউশন আয়
  const floor   = Math.max(0, i.cost - effFour);    // নিরাপদ (min risk) OTP রেট
  const std     = Math.max(0, i.target - four);     // স্ট্যান্ডার্ড (টার্গেট) OTP রেট
  const undercut = i.market > 0 ? Math.max(5, Math.round(i.market * 0.05 / 5) * 5) : 0;
  const win      = i.market > 0 ? Math.max(0, i.market - undercut) : 0; // কম্পিটিটিভ রেট

  const safe = { rate: floor, total: floor + effFour, profit: floor + effFour - i.cost };
  const stan = { rate: std,   total: std + four,     profit: std + four - i.cost };
  const max  = i.market > 0 ? { rate: i.market, total: i.market + four, profit: i.market + four - i.cost } : null;

  const riskProfit = r => r + effFour - i.cost;      // ঝুঁকি-পরে লাভ
  const normProfit = r => r + four - i.cost;         // স্বাভাবিক লাভ
  const safeDistFor = r => {                          // r রেটে নিরাপদ থাকতে দরকারি dist
    const need = i.cost - r;
    if (need <= 0) return 0;
    const k = 4 * (1 - i.risk / 100);
    return k > 0 ? Math.ceil(need / k / 5) * 5 : Infinity;
  };

  let rec = std, tone = 'info', msg = '';
  if (i.market <= 0){
    msg = 'মার্কেট ভ্যালু দিলে প্রতিযোগিতা-সচেতন স্মার্ট রেট দেখাব।';
  } else if (win >= std){
    rec = win; tone = 'best';
    msg = `সেরা রেট! মার্কেট ${taka(i.market)}-এর চেয়ে ${taka(undercut)} কম — OTP পাওয়ার সম্ভাবনা বেশি, সাথে টার্গেটও পূরণ।`;
  } else if (win >= floor){
    rec = win; tone = 'good';
    msg = `নিরাপদ লাভ ${taka(normProfit(win))} — তবে টার্গেটের চেয়ে ${taka(std - win)} কম আয় হবে।`;
  } else if (floor <= i.market){
    rec = floor; tone = 'warn';
    msg = `ন্যূনতম ${taka(floor)} চাই — এর নিচে ঝুঁকি। ${taka(floor)}-এ দিলে জেতার সম্ভাবনাও আছে, ঝুঁকিতেও লস নেই।`;
  } else if (normProfit(win) >= 0){
    rec = win; tone = 'warn';
    msg = `সতর্ক: ${taka(win)}-এ লাভ ${taka(normProfit(win))}, কিন্তু ঝুঁকিতে লস ${taka(Math.abs(riskProfit(win)))} হতে পারে — ডিস্ট্রিবিউশন ${taka(safeDistFor(win))}+ হলে নিরাপদ।`;
  } else {
    rec = win; tone = 'bad';
    msg = `এই মার্কেটে লস ${taka(-normProfit(win))} — ডিল এড়ান, বা ডিস্ট্রিবিউশন ${taka(safeDistFor(win))}+ করুন।`;
  }

  const remainGB = Math.max(0, i.totalGB - i.otpGB), remainMin = Math.max(0, i.totalMin - i.otpMin);
  return {
    four, effFour, floor, std, win, undercut, risk: i.risk, market: i.market,
    safe, stan, max, rec, tone, msg,
    recTotal: rec + four, recProfit: normProfit(rec), recRiskProfit: riskProfit(rec),
    remainGB, remainMin,
    perGB: nearest(gbSlabs, remainGB / 4), perMin: nearest(minSlabs, remainMin / 4)
  };
}
/* ── end engine ─────────────────────────────────────────────── */

let stateOp = 'otp', last = null;

/* value setter with smooth pop animation */
function set(el, txt){
  if (el.textContent !== txt){
    el.textContent = txt;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  }
}
const pftCls = n => n > 0.5 ? 'pos' : n < -0.5 ? 'neg' : 'zero';

function setOperator(key){
  const o = OPERATORS[key] || OPERATORS.otp;
  stateOp = OPERATORS[key] ? key : 'otp';
  const el = $('operator');
  el.textContent = o.name;
  el.style.background = o.c + '18';
  el.style.borderColor = o.c + '44';
  el.style.color = o.c;
}

/* ── need-text parsing ── */
function detectOperator(t){
  if (/airtel|এয়ারটেল|এয়ারটেল|আইরটেল|আইরতেল/.test(t)) return 'airtel';
  if (/robi|রবি/.test(t)) return 'robi';
  if (/grameenphone|graminphone|gramin|গ্রামীণফোন|গ্রামীণ|গ্রামীন|\bgp\b|জিপি|গপি/.test(t)) return 'gp';
  if (/banglalink|বাংলালিংক/.test(t)) return 'bl';
  if (/teletalk|টেলিটক/.test(t)) return 'tt';
  return null;
}
function parseNeed(){
  const t = bnNum($('needText').value).toLowerCase().replace(/,/g, '');
  const op = detectOperator(t);
  let gb = null, min = null;
  const m = t.match(/(\d+(?:\.\d+)?)\s*(?:gb|গিবি|জিবি|জিব|g(?![a-z]))/);
  const n = t.match(/(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes|মিনিট|মিন)/);
  if (m) gb = +m[1];
  if (n) min = +n[1];
  if (gb === null || min === null){
    const p = t.match(/(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)/);
    if (p){ gb = gb ?? +p[1]; min = min ?? +p[2]; }
  }
  const st = $('parsedText');
  if (gb !== null && min !== null){
    $('otpGB').value = gb; $('otpMin').value = min;
    if (op) setOperator(op);
    const o = OPERATORS[stateOp];
    st.textContent = `✓ ${o.name} OTP — ${gb} GB + ${min} মিনিট শনাক্ত হয়েছে`;
    st.className = 'parsed ok';
    calc();
  } else if ($('needText').value.trim()){
    st.textContent = '⚠ GB ও মিনিট শনাক্ত হয়নি — নিচে হাতে লিখে নিন';
    st.className = 'parsed bad';
  } else {
    st.textContent = 'নীড টেক্সট পেস্ট করুন — অপারেটর, GB ও মিনিট অটো ডিটেক্ট হবে';
    st.className = 'parsed';
  }
}

/* ── render ── */
function render(c){
  set($('chipRemain'), `বাকি ${c.remainGB} GB + ${c.remainMin} মিনিট`);
  set($('chipPer'), `জনপ্রতি ≈ ${c.perGB} GB + ${c.perMin} মিনিট`);
  set($('chipFour'), `৪ জন × ${taka(+$('distributionRate').value || 0)} = ${taka(c.four)}`);
  set($('riskVal'), c.risk + '%');
  set($('riskHint'), c.risk > 0
    ? `ঝুঁকিতে ডিস্ট্রিবিউশন আয় ${taka(c.effFour)} (${taka(c.four - c.effFour)} কম)`
    : 'ঝুঁকি বাফার বন্ধ — সব সদস্য পুরো রেটে কিনবে ধরে হিসাব');

  set($('safeRate'), taka(c.safe.rate));
  set($('safeTot'), taka(c.safe.total));
  $('safePft').className = 'scnPft ' + pftCls(c.safe.profit);
  set($('safePft'), signed(c.safe.profit));

  set($('stdRate'), taka(c.stan.rate));
  set($('stdTot'), taka(c.stan.total));
  $('stdPft').className = 'scnPft ' + pftCls(c.stan.profit);
  set($('stdPft'), signed(c.stan.profit));

  $('maxPft').className = 'scnPft ' + (c.max ? pftCls(c.max.profit) : 'zero');
  set($('maxRate'), c.max ? taka(c.max.rate) : '—');
  set($('maxTot'), c.max ? taka(c.max.total) : '—');
  set($('maxPft'), c.max ? signed(c.max.profit) : '—');

  set($('recRate'), taka(c.rec));
  set($('recTot'), taka(c.recTotal));
  $('recPft').className = pftCls(c.recProfit);
  set($('recPft'), c.recProfit !== 0 ? signed(c.recProfit) : '৳0');
  $('recRisk').className = pftCls(c.recRiskProfit);
  set($('recRisk'), c.recRiskProfit !== 0 ? signed(c.recRiskProfit) : '৳0');

  const v = $('verdict');
  const changed = v.textContent !== c.msg;
  v.className = 'verdict ' + c.tone;
  if (changed){
    v.textContent = c.msg;
    v.classList.remove('pop'); void v.offsetWidth; v.classList.add('pop');
  }

  renderRuler(c);
}

/* ── rate ruler ── */
function renderRuler(c){
  const right = Math.max(c.market, c.std, c.floor, c.rec, 1) * 1.06;
  const pct = v => Math.min(98, Math.max(1.5, v / right * 100));
  const lim = c.market > 0 ? c.market : right;
  const seg = (el, a, b) => {
    a = Math.max(0, a); b = Math.min(lim, b);
    el.style.left  = pct(a) + '%';
    el.style.width = Math.max(0, pct(b) - pct(a)) + '%';
  };
  seg($('segLoss'), 0, c.floor);
  if (c.std >= lim){ seg($('segSafe'), c.floor, lim); seg($('segTarget'), lim, lim); }
  else { seg($('segSafe'), c.floor, c.std); seg($('segTarget'), c.std, lim); }
  if (c.market > 0) seg($('segGray'), c.market, right);
  else { $('segGray').style.width = '0%'; }

  $('mFloor').style.left = pct(c.floor) + '%';
  $('mStd').style.left   = pct(c.std) + '%';
  const mk = $('mMarket');
  if (c.market > 0){ mk.style.opacity = 1; mk.style.left = pct(c.market) + '%'; }
  else mk.style.opacity = 0;

  $('rPin').style.left = Math.min(92, Math.max(8, pct(c.rec))) + '%';
  $('rPin').textContent = '★ ' + Math.round(c.rec).toLocaleString('en-IN');

  set($('lgFloor'), taka(c.floor));
  set($('lgStd'), taka(c.std));
  const lm = $('lgMarket'), lw = $('lgMarketWrap');
  if (c.market > 0){ set(lm, taka(c.market)); lw.style.opacity = 1; }
  else lw.style.opacity = .35;
}

/* ── main calc ── */
function calc(){
  const i = {
    totalGB: +$('totalGB').value || 0, totalMin: +$('totalMin').value || 0,
    otpGB:   +$('otpGB').value || 0,   otpMin:   +$('otpMin').value || 0,
    cost:    +$('balance').value || 0, target:   +$('target').value || 0,
    market:  +$('otpMarket').value || 0, dist:   +$('distributionRate').value || 0,
    risk:    +$('risk').value || 0
  };
  last = compute(i);
  render(last);
  saveState();
}

/* ── persistence ── */
const IDS = ['needText','totalGB','totalMin','balance','target','otpGB','otpMin','otpMarket','distributionRate','risk'];
function saveState(){
  try{
    const s = { op: stateOp };
    IDS.forEach(id => s[id] = $(id).value);
    localStorage.setItem('frp', JSON.stringify(s));
  }catch(e){}
}
function loadState(){
  try{
    const s = JSON.parse(localStorage.getItem('frp'));
    if (!s) return false;
    IDS.forEach(id => { if (s[id] !== undefined && s[id] !== '') $(id).value = s[id]; });
    if (s.op) setOperator(s.op);
    return true;
  }catch(e){ return false; }
}

/* ── copy quote ── */
let toastTimer;
function toast(msg){
  const t = $('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1700);
}
$('copyBtn').addEventListener('click', async () => {
  if (!last) return;
  const o = OPERATORS[stateOp];
  const text = `${o.name} OTP — ${+$('otpGB').value || 0} GB + ${+$('otpMin').value || 0} মিনিট\nরেট: ${taka(last.rec)}${last.market > 0 ? ` (মার্কেট ${taka(last.market)})` : ''}`;
  try{
    await navigator.clipboard.writeText(text);
    toast('কোট কপি হয়েছে ✓');
  }catch(e){
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); toast('কোট কপি হয়েছে ✓'); }
    catch(err){ toast('কপি করা যায়নি'); }
    ta.remove();
  }
});

/* ── wiring ── */
IDS.forEach(id => $(id).addEventListener('input', () => { if (id === 'needText') parseNeed(); else calc(); }));
$('parseBtn').addEventListener('click', parseNeed);

const restored = loadState();
if (restored) $('parsedText').textContent = '✓ সেভ করা হিসাব লোড হয়েছে';
calc();

/* ── PWA ── */
let deferred;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('install').hidden = false; });
$('install').addEventListener('click', () => { if (deferred) deferred.prompt(); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
