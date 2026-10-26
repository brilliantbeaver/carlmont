// Minimal DOM shim to run the app's built-in self-test in Node (no browser available).
// usage: node minidom_test.js path/to/_qa_selftest.html
const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'stop', 'use']);
const RAW = new Set(['script', 'style']);
function decode(s) { return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&'); }

class Node_ { constructor() { this.parentNode = null; this.childNodes = []; } }
class Text_ extends Node_ { constructor(t) { super(); this.nodeType = 3; this.data = t; } get textContent() { return this.data; } }
class El extends Node_ {
  constructor(tag) { super(); this.nodeType = 1; this.tagName = tag.toUpperCase(); this.localName = tag.toLowerCase(); this.attrs = {}; this.style = {}; this._listeners = {}; this.value = ''; this.checked = false; this.disabled = false; this.open = false; }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'value') this.value = String(v); }
  hasAttribute(k) { return k in this.attrs; }
  removeAttribute(k) { delete this.attrs[k]; }
  get id() { return this.attrs.id || ''; } set id(v) { this.attrs.id = String(v); }
  get className() { return this.attrs['class'] || ''; } set className(v) { this.attrs['class'] = v; }
  get classList() {
    const el = this; const list = () => (el.attrs['class'] || '').split(/\s+/).filter(Boolean);
    const set = (a) => { el.attrs['class'] = a.join(' '); };
    return { contains: (c) => list().includes(c), add: (...c) => set([...new Set(list().concat(c))]), remove: (...c) => set(list().filter(x => !c.includes(x))),
      toggle: (c, f) => { const has = list().includes(c); const want = f === undefined ? !has : !!f; if (want && !has) set(list().concat([c])); if (!want && has) set(list().filter(x => x !== c)); return want; } };
  }
  get dataset() {
    const el = this;
    return new Proxy({}, { get: (_, k) => { const a = 'data-' + String(k).replace(/[A-Z]/g, m => '-' + m.toLowerCase()); return el.attrs[a]; }, set: (_, k, v) => { el.attrs['data-' + String(k).replace(/[A-Z]/g, m => '-' + m.toLowerCase())] = String(v); return true; } });
  }
  get children() { return this.childNodes.filter(n => n.nodeType === 1); }
  get textContent() { return this.childNodes.map(n => n.textContent).join(''); }
  set textContent(t) { this.childNodes = []; this.appendChild(new Text_(String(t))); }
  get innerHTML() { return '[html]'; }
  set innerHTML(h) { this.childNodes = []; parseInto(this, String(h)); }
  appendChild(n) { if (n.parentNode) n.remove(); n.parentNode = this; this.childNodes.push(n); return n; }
  append(n) { return this.appendChild(n); }
  remove() { if (this.parentNode) { const p = this.parentNode; p.childNodes = p.childNodes.filter(x => x !== this); this.parentNode = null; } }
  addEventListener(t, f) { (this._listeners[t] = this._listeners[t] || []).push(f); }
  removeEventListener() { }
  dispatch(type, ev) { ev = ev || {}; ev.type = type; ev.target = ev.target || this; ev.preventDefault = () => { ev.defaultPrevented = true; }; ev.stopPropagation = () => { };
    let n = this; while (n) { (n._listeners && n._listeners[type] || []).forEach(f => f.call(n, ev)); if (n['on' + type] && n !== doc) n['on' + type](ev); n = n.parentNode; } }
  click() { if (this.disabled) return; this.dispatch('click'); }
  focus() { } blur() { } scrollIntoView() { }
  getBoundingClientRect() { return { top: 0, left: 0, width: 100, height: 100, bottom: 100, right: 100 }; }
  get offsetWidth() { return 100; }
  querySelectorAll(sel) { const out = []; walk(this, el => { if (matches(el, sel)) out.push(el); }); return out; }
  querySelector(sel) { const r = this.querySelectorAll(sel); return r[0] || null; }
  matches(sel) { return matches(this, sel); }
  closest(sel) { let n = this; while (n && n.nodeType === 1) { if (matches(n, sel)) return n; n = n.parentNode; } return null; }
}
function walk(root, fn) { for (const c of root.childNodes) { if (c.nodeType === 1) { fn(c); walk(c, fn); } } }

function parseInto(parent, h) {
  const stack = [parent]; let i = 0;
  const top = () => stack[stack.length - 1];
  while (i < h.length) {
    if (h.startsWith('<!--', i)) { const j = h.indexOf('-->', i); i = j < 0 ? h.length : j + 3; continue; }
    if (h[i] === '<' && h[i + 1] === '!') { const j = h.indexOf('>', i); i = j + 1; continue; }
    if (h[i] === '<' && h[i + 1] === '/') { const j = h.indexOf('>', i); const tag = h.slice(i + 2, j).trim().toLowerCase();
      for (let k = stack.length - 1; k > 0; k--) { if (stack[k].localName === tag) { stack.length = k; break; } } i = j + 1; continue; }
    if (h[i] === '<' && /[a-zA-Z]/.test(h[i + 1] || '')) {
      let j = i + 1; let inq = null;
      while (j < h.length) { const ch = h[j]; if (inq) { if (ch === inq) inq = null; } else if (ch === '"' || ch === "'") inq = ch; else if (ch === '>') break; j++; }
      const raw = h.slice(i + 1, j); const selfClose = raw.endsWith('/');
      const m = raw.match(/^([a-zA-Z][\w:-]*)/); const tag = m[1].toLowerCase();
      const el = new El(tag);
      const ar = /([\w:@.-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g; let mm; const rest = raw.slice(m[1].length);
      while ((mm = ar.exec(rest))) { if (mm[1] === '/') continue; const v = mm[3] !== undefined ? mm[3] : mm[4] !== undefined ? mm[4] : mm[5] !== undefined ? mm[5] : ''; el.attrs[mm[1].toLowerCase()] = decode(v); }
      if ('checked' in el.attrs) el.checked = true; if ('disabled' in el.attrs) el.disabled = true; if ('value' in el.attrs) el.value = el.attrs.value;
      top().appendChild(el); i = j + 1;
      if (RAW.has(tag)) { const k = h.toLowerCase().indexOf('</' + tag, i); el._raw = h.slice(i, k); el.appendChild(new Text_(el._raw)); i = h.indexOf('>', k) + 1; continue; }
      if (!selfClose && !VOID.has(tag)) stack.push(el);
      continue;
    }
    const j = h.indexOf('<', i); const t = h.slice(i, j < 0 ? h.length : j); if (t) top().appendChild(new Text_(decode(t))); i = j < 0 ? h.length : j;
  }
}

// --- selector engine: comma groups, descendant/child combinators, tag#id.class[attr][attr=v]:checked
function parseCompound(s) {
  const c = { tag: null, id: null, cls: [], attrs: [], pseudo: [] };
  const re = /^([a-zA-Z*][\w-]*)|#([\w-]+)|\.([\w-]+)|\[([\w-]+)(?:([~^$*]?=)["']?([^"'\]]*)["']?)?\]|:([\w-]+)/g; let m;
  while ((m = re.exec(s))) { if (m[0] === '') break; if (m[1]) c.tag = m[1].toLowerCase(); else if (m[2]) c.id = m[2]; else if (m[3]) c.cls.push(m[3]); else if (m[4]) c.attrs.push([m[4], m[5], m[6]]); else if (m[7]) c.pseudo.push(m[7]); }
  return c;
}
function matchCompound(el, c) {
  if (c.tag && c.tag !== '*' && el.localName !== c.tag) return false;
  if (c.id && el.attrs.id !== c.id) return false;
  const cl = (el.attrs['class'] || '').split(/\s+/);
  for (const x of c.cls) if (!cl.includes(x)) return false;
  for (const [k, op, v] of c.attrs) { if (!(k in el.attrs)) return false; if (op === '=' && el.attrs[k] !== v) return false; }
  for (const p of c.pseudo) { if (p === 'checked' && !el.checked) return false; }
  return true;
}
const selCache = {};
function compile(sel) {
  if (selCache[sel]) return selCache[sel];
  const groups = sel.split(',').map(g => { const toks = g.trim().replace(/\s*>\s*/g, ' > ').split(/\s+/); const parts = []; let comb = ' ';
    for (const t of toks) { if (t === '>') { comb = '>'; continue; } parts.push({ comb, c: parseCompound(t) }); comb = ' '; } return parts; });
  return (selCache[sel] = groups);
}
function matchParts(el, parts, idx) {
  if (!matchCompound(el, parts[idx].c)) return false;
  if (idx === 0) return true;
  const comb = parts[idx].comb; let p = el.parentNode;
  if (comb === '>') return p && p.nodeType === 1 && matchParts(p, parts, idx - 1);
  while (p && p.nodeType === 1) { if (matchParts(p, parts, idx - 1)) return true; p = p.parentNode; }
  return false;
}
function matches(el, sel) { return compile(sel).some(parts => matchParts(el, parts, parts.length - 1)); }

// --- document / window
const doc = new El('#document'); doc._listeners = {};
parseInto(doc, html.replace(/^<!DOCTYPE[^>]*>/i, ''));
doc.getElementById = (id) => doc.querySelector('#' + id);
doc.createElement = (t) => new El(t);
doc.addEventListener = (t, f) => { (doc._listeners[t] = doc._listeners[t] || []).push(f); };
doc.readyState = 'complete';
doc.activeElement = null;
const body = doc.querySelector('body'); doc.body = body;
const errors = [];
const win = { document: doc, scrollY: 0, scrollTo: () => { }, addEventListener: () => { }, requestAnimationFrame: (f) => f(), setTimeout: (f) => { try { f(); } catch (e) { errors.push(e); } return 1; }, clearTimeout: () => { }, setInterval: () => 1, clearInterval: () => { },
  confirm: () => true, alert: (m) => console.log('ALERT', m), print: () => { }, Blob: function () { }, URL: { createObjectURL: () => 'blob:', revokeObjectURL: () => { } }, FileReader: function () { }, console };
win.window = win;
const ctx = vm.createContext(win);
const scripts = doc.querySelectorAll('script');
for (const s of scripts) {
  try { vm.runInContext(s._raw, ctx, { filename: 'inline.js' }); } catch (e) { console.log('SCRIPT ERROR', e.stack); process.exitCode = 1; }
}
const pre = doc.getElementById('selftest');
console.log(pre ? pre.textContent : 'NO SELFTEST OUTPUT');
const eb = doc.getElementById('errbar');
if (eb && eb.style.display === 'block') console.log('ERRBAR:', eb.textContent);
if (errors.length) console.log('TIMEOUT ERRORS', errors.map(e => e.stack));
// quick UX checks
console.log('home path steps:', doc.querySelectorAll('.pstep').length, '| topic cards:', doc.querySelectorAll('.tcard').length, '| glossary items:', doc.querySelectorAll('.gl-item').length);

if (process.argv[3] === 'clicks') {
  const $ = (s) => doc.querySelector(s), $$ = (s) => doc.querySelectorAll(s);
  const act = () => { const t = $$('section.tab').find(s => s.classList.contains('active')); return t && t.id; };
  const res = [];
  function chk(c, m) { res.push((c ? 'PASS ' : 'FAIL ') + m); }
  try {
    $$('#home-cta button')[0].click(); chk(act() === 'tab-study' && $('article.topic.active').dataset.topic === '1', 'home CTA opens Learn topic 1');
    $('#topic-1 .topic-bar [data-topicnav="2"]').click(); chk($('article.topic.active').dataset.topic === '2', 'topic bar next -> 2');
    $('#topic-2 .chiplink').click(); chk($('article.topic.active').dataset.topic === '2', 'checklist chip stays in topic 2');
    $('#topic-2 [data-practice="2"]').click(); chk(act() === 'tab-practice' && !!$('#pq'), 'overview practice button starts Topic 2 drill');
    chk(!!$('.dots') && $$('.dots i').length === 10, 'session dots for 10 questions: ' + $$('.dots i').length);
    $('#pq .choice').click(); chk($('#pq-help').style.display === 'none', 'helper hides after choosing');
    $('#pq-check').click(); chk(!!$('#pq-fb .fb'), 'feedback after check');
    const rv = $('#pq-fb a.xref'); if (rv) { rv.click(); chk(act() === 'tab-study' && $('#backbtn').style.display === 'inline-flex', 'review link -> study + back button'); $('#backbtn').click(); chk(act() === 'tab-practice', 'back to question'); }
    $('nav.tabs [data-tab="home"]').click(); chk($$('.pstep.now').length === 1, 'home shows one NEXT step');
    $$('.tcard [data-action="learn:5"]')[0].click(); chk($('article.topic.active').dataset.topic === '5', 'topic card Learn -> topic 5');
    const sel = $('#tocsel'); sel.value = 's6-relabund'; sel.onchange(); chk($('article.topic.active').dataset.topic === '6', 'select jumps to topic 6 section');
    $('nav.tabs [data-tab="review"]').click(); chk($('#pane-glossary').classList.contains('active'), 'review opens glossary');
    $('.seg [data-pane="traps"]').click(); chk($('#pane-traps').classList.contains('active'), 'seg -> traps');
    $('#pane-traps a.xref').click(); chk(act() === 'tab-study', 'trap review link -> study');
    $('nav.tabs [data-tab="review"]').click(); $('.seg [data-pane="glossary"]').click(); $('[data-gtopic="4"]').click(); chk($$('.gl-item').length === 10, 'glossary filter topic 4: ' + $$('.gl-item').length);
    $('nav.tabs [data-tab="practice"]').click(); chk(!!$('.reco'), 'practice shows Recommended card');
    $('nav.tabs [data-tab="practice"]').click();
    const ends = $('#pq-quit'); if (ends) ends.click();
    const only = $$('.topicpick .only')[2]; if (only) { only.click(); chk(!!$('#pq') && $('#pq .qhead').textContent.indexOf('Topic 3') >= 0, 'Only this -> topic 3 session'); }
    $('nav.tabs [data-tab="mock"]').click(); $('#mk-start').click(); chk(!!$('#mq'), 'mock started'); $('#mk-quit').click(); chk(!!$('#mk-start'), 'mock quit -> intro');
    $('nav.tabs [data-tab="results"]').click(); chk(!!$('.nextbanner'), 'results next banner');
    $('nav.tabs [data-tab="study"]').click(); $('#topic-9 .topic-foot [data-goto="mock"]') && chk(true, 'topic 9 footer -> mock button exists');
  } catch (e) { res.push('EXCEPTION ' + e.stack); }
  console.log(res.join('\n'));
}
if (process.argv[3] === 'clicks') {
  const $ = (s) => doc.querySelector(s), $$ = (s) => doc.querySelectorAll(s);
  const act = () => { const t = $$('section.tab').find(s => s.classList.contains('active')); return t && t.id; };
  const out = [];
  try {
    $('nav.tabs [data-tab="practice"]').click();
    if ($('#pq-quit')) $('#pq-quit').click();
    if ($('#ps-new')) $('#ps-new').click();
    out.push((!!$('.reco') ? 'PASS' : 'FAIL') + ' practice setup shows Recommended card');
    $$('.topicpick .only')[0].click();
    const qid = $('#pq .qhead b').textContent; const Q = ctx.window.QUESTIONS.find(q => q.id === qid);
    $('#pq .choice[data-i="' + Q.answer + '"]').click(); $('#pq-check').click();
    const rv = $('#pq-fb a.xref'); out.push((rv ? 'PASS' : 'FAIL') + ' review link present after answer (' + qid + ' -> ' + (rv && rv.getAttribute('href')) + ')');
    rv.click(); out.push((act() === 'tab-study' && $('#backbtn').style.display === 'inline-flex' ? 'PASS' : 'FAIL') + ' review link opens study + back button; active topic ' + $('article.topic.active').dataset.topic);
    $('#backbtn').click(); out.push((act() === 'tab-practice' && !!$('#pq') ? 'PASS' : 'FAIL') + ' back returns to the same question: tab=' + act() + ' pq=' + !!$('#pq') + ' backbtn=' + $('#backbtn').style.display);
  } catch (e) { out.push('EXCEPTION ' + e.stack); }
  console.log(out.join('\n'));
}
