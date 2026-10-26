/* Ecosystems Study Guide — interactive practice engine.
   Self-contained; no network; no browser storage. Progress lives in memory
   and can be saved/restored with a downloaded .json file. */
(function () {
  'use strict';

  // ---------- error banner (makes problems visible) ----------
  function showError(msg) {
    var b = document.getElementById('errbar');
    if (!b) return;
    b.style.display = 'block';
    b.textContent = 'Something went wrong in this page: ' + msg + '\nTry reloading. If it keeps happening, open the file in Google Chrome.';
  }
  window.addEventListener('error', function (e) { showError(e.message || String(e)); });

  var Q = window.QUESTIONS || [];
  var FIGS = window.FIGS || {};
  var SECTIONS = window.SECTIONS || {};
  var TOPICS = window.TOPICS || {};
  var GLOSSARY = window.GLOSSARY || [];
  var LET = ['A', 'B', 'C', 'D'];
  var QMAP = {};
  Q.forEach(function (q) { QMAP[q.id] = q; });
  var DRILLS = Q.filter(function (q) { return q.id.indexOf('M-') !== 0; });
  var MOCK = Q.filter(function (q) { return q.id.indexOf('M-') === 0; });
  var TOPIC_IDS = Object.keys(TOPICS).map(Number).sort(function (a, b) { return a - b; });

  // ---------- state ----------
  var state = { attempts: {}, mockHistory: [], visited: {}, dirty: false, lastSaved: null };
  // attempts[qid] = {first:int|null, second:int|null, correct:bool, hint:bool, mode:'practice'|'mock', t:ms, n:int}

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('on'); }, 2200); }
  function levelOrder(l) { return { core: 0, apply: 1, challenge: 2 }[l] || 1; }
  function secTitle(sid) { return (SECTIONS[sid] && SECTIONS[sid].title) || sid; }
  function topicName(n) { return (TOPICS[n] && TOPICS[n].name) || ('Topic ' + n); }

  var figCounter = 0;
  function figHTML(id) {
    var s = FIGS[id];
    if (!s) return '';
    var sfx = '-q' + (++figCounter);
    s = s.replace(/\bid="([^"]+)"/g, 'id="$1' + sfx + '"')
         .replace(/url\(#([^)]+)\)/g, 'url(#$1' + sfx + ')')
         .replace(/(xlink:)?href="#([^"]+)"/g, function (m, x, ref) { return (x || '') + 'href="#' + ref + sfx + '"'; });
    return '<div class="qfig">' + s + '</div>';
  }

  function markDirty() { state.dirty = true; updateSaveState(); updateBadges(); }

  // ---------- tabs ----------
  var currentTab = 'home';
  function showTab(name, opts) {
    opts = opts || {};
    currentTab = name;
    $$('section.tab').forEach(function (s) { s.classList.toggle('active', s.id === 'tab-' + name); });
    $$('nav.tabs button').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === name)); });
    if (name === 'home') renderHome();
    if (name === 'study' && !opts.keepTopic) activateTopic(currentTopic, false);
    if (name === 'results') renderResults();
    if (name === 'review' && !opts.keepPane) showPane(currentPane);
    if (name === 'practice' && !practice.active) renderPracticeSetup();
    if (name === 'mock' && !mock.active && !mock.submitted) renderMockIntro();
    if (!opts.keepScroll) window.scrollTo(0, 0);
  }

  // ---------- topics (Learn) ----------
  var currentTopic = 1;
  function activateTopic(n, scrollTop) {
    currentTopic = n;
    state.visited[n] = true;
    $$('article.topic').forEach(function (a) { a.classList.toggle('active', Number(a.dataset.topic) === n); });
    $$('.toc-topic').forEach(function (t) { t.classList.toggle('active', Number(t.dataset.topic) === n); });
    var sel = $('#tocsel'); if (sel) sel.value = 't' + n;
    updateOverviewStatus();
    if (scrollTop) window.scrollTo(0, 0);
  }
  function updateOverviewStatus() {
    $$('[data-ovstatus]').forEach(function (el) {
      var st = topicStats(Number(el.dataset.ovstatus));
      el.innerHTML = '<span class="chip ' + st.status + '">' + STATUS_TXT[st.status] + '</span>' +
        (st.att ? ' <span class="muted" style="font-size:13px">' + st.cor + '/' + st.att + ' right first try</span>' : '');
    });
  }

  // ---------- quick-review panes ----------
  var currentPane = 'glossary';
  var PANES = { glossary: 1, traps: 1, card: 1 };
  function showPane(name) {
    currentPane = name;
    $$('#tab-review .pane').forEach(function (p) { p.classList.toggle('active', p.id === 'pane-' + name); });
    $$('#tab-review .seg button').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.pane === name)); });
  }

  // ---------- cross-references to study sections ----------
  var backCtx = null;
  function goSection(sid, fromQuestion) {
    if (fromQuestion) {
      backCtx = { tab: currentTab, y: window.scrollY };
      $('#backbtn').style.display = 'inline-flex';
    }
    if (PANES[sid]) { showPane(sid); showTab('review', { keepPane: true }); return; }
    var el = document.getElementById(sid);
    if (!el) return;
    var art = el.closest('article.topic');
    var tabSec = el.closest('section.tab');
    var tab = tabSec ? tabSec.id.replace('tab-', '') : 'study';
    if (art) { activateTopic(Number(art.dataset.topic), false); showTab('study', { keepScroll: true, keepTopic: true }); }
    else if (tab === 'review') { var pane = el.closest('.pane'); if (pane) showPane(pane.id.replace('pane-', '')); showTab('review', { keepScroll: true, keepPane: true }); }
    else showTab(tab, { keepScroll: true });
    var isTop = /^t\d$/.test(sid);
    setTimeout(function () {
      var y = isTop ? 0 : el.getBoundingClientRect().top + window.scrollY - 104;
      window.scrollTo(0, y);
      if (!isTop) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
    }, 30);
  }
  function goBack() {
    if (!backCtx) return;
    var c = backCtx; backCtx = null;
    $('#backbtn').style.display = 'none';
    showTab(c.tab, { keepScroll: true });
    setTimeout(function () { window.scrollTo(0, c.y); }, 30);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a.xref, a.tocl');
    if (a) {
      e.preventDefault();
      var sid = a.getAttribute('href').slice(1);
      goSection(sid, !!a.closest('.qcard, .fb, details.missed, #tab-results, #tab-mock'));
      return;
    }
    var tn = e.target.closest('[data-topicnav]');
    if (tn) { e.preventDefault(); goSection('t' + tn.dataset.topicnav, false); return; }
    var pn = e.target.closest('.seg [data-pane]');
    if (pn) { e.preventDefault(); showPane(pn.dataset.pane); return; }
    var gc = e.target.closest('[data-gtopic]');
    if (gc) { e.preventDefault(); glosTopic = gc.dataset.gtopic; renderGlossary(); return; }
    var act = e.target.closest('[data-action]');
    if (act) { e.preventDefault(); if (!act.disabled) runAction(act.dataset.action); return; }
    var p = e.target.closest('[data-practice]');
    if (p) { e.preventDefault(); startPractice({ topics: [Number(p.dataset.practice)] }); return; }
    var t = e.target.closest('[data-goto]');
    if (t) { e.preventDefault(); showTab(t.dataset.goto); }
  });

  // ---------- question card ----------
  function qHeadHTML(q, label) {
    return '<div class="qhead"><span class="tag topic">Topic ' + q.topic + ' · ' + esc(topicName(q.topic)) + '</span>' +
      '<span class="tag ' + q.level + '">' + q.level + '</span>' +
      '<span>' + esc(q.subtopic || '') + '</span>' +
      '<span style="margin-left:auto">' + (label || '') + ' <b>' + q.id + '</b></span></div>';
  }
  function choicesHTML(q) {
    return '<div class="choices" role="group" aria-label="Answer choices">' + q.choices.map(function (c, i) {
      return '<button class="choice" data-i="' + i + '"><span class="L">' + LET[i] + '</span><span>' + c + '</span></button>';
    }).join('') + '</div>';
  }
  function fullExplanationHTML(q, chosen) {
    var good = chosen === q.answer;
    var h = '<div class="fb ' + (good ? 'good' : 'reveal') + '" aria-live="polite">';
    h += '<h4>' + (good ? '✔ Correct — ' + LET[q.answer] : 'The correct answer is ' + LET[q.answer]) + '</h4>';
    h += '<div>' + q.explanation + '</div>';
    var whys = q.why_wrong.map(function (w, i) { return i === q.answer ? '' : '<li><b class="L">' + LET[i] + '</b>' + w + '</li>'; }).join('');
    h += '<div style="margin-top:10px;font-weight:700;font-size:14px">Why the other choices are wrong</div><ul class="why">' + whys + '</ul>';
    if (q.trap) h += '<span class="trapchip">Trap tested: ' + esc(q.trap) + '</span>';
    h += '<div class="row" style="margin-top:10px"><a class="xref" href="#' + q.review + '">📖 Review: ' + esc(secTitle(q.review)) + '</a></div>';
    if (q.source) h += '<div class="src">Grounded in: ' + esc(q.source) + '</div>';
    h += '</div>';
    return h;
  }

  // ---------- next best step ----------
  function nextStep() {
    var visitedN = Object.keys(state.visited).length;
    var tried = DRILLS.filter(function (q) { return state.attempts[q.id]; }).length;
    var miss = missedIds();
    var i, n, st;
    if (!tried && visitedN <= 1 && !state.mockHistory.length) return { label: '📖 Start with Topic 1: ' + topicName(1), desc: 'Read the first topic, then practice it right away.', action: 'learn:1', step: 1 };
    for (i = 0; i < TOPIC_IDS.length; i++) { n = TOPIC_IDS[i]; st = topicStats(n); if (state.visited[n] && st.att === 0) return { label: '✏️ Practice Topic ' + n + ': ' + topicName(n), desc: 'You opened this topic — now check yourself (' + st.total + ' questions).', action: 'practice:' + n, step: 2 }; }
    for (i = 0; i < TOPIC_IDS.length; i++) { n = TOPIC_IDS[i]; st = topicStats(n); if (!state.visited[n] && st.att === 0) return { label: '📖 Learn Topic ' + n + ': ' + topicName(n), desc: 'Next topic on your study path.', action: 'learn:' + n, step: 1 }; }
    for (i = 0; i < TOPIC_IDS.length; i++) { n = TOPIC_IDS[i]; st = topicStats(n); if (st.att < st.total) return { label: '✏️ Finish Topic ' + n + ' drills', desc: (st.total - st.att) + ' questions not tried yet.', action: 'practice:' + n + ':new', step: 2 }; }
    if (!state.mockHistory.length) return { label: '⏱ Take the Mock Test', desc: 'All drills tried — time for 25 questions in 30 minutes.', action: 'mock', step: 3 };
    if (miss.length) return { label: '🔁 Retry ' + miss.length + ' missed question' + (miss.length > 1 ? 's' : ''), desc: 'Fixing misses is the fastest way to raise your score.', action: 'retry', step: 4 };
    return { label: '🗂 Write your index card', desc: 'Everything is fixed — make your card, then retake the mock test.', action: 'card', step: 5 };
  }
  function runAction(a) {
    var p = a.split(':');
    if (p[0] === 'learn') goSection('t' + p[1], false);
    else if (p[0] === 'practice') startPractice({ topics: [Number(p[1])], which: p[2] || 'all', order: 'ordered' });
    else if (p[0] === 'mock') showTab('mock');
    else if (p[0] === 'retry') { var m = missedIds(); if (m.length) startPractice({ ids: m }); else toast('Nothing to retry yet.'); }
    else if (p[0] === 'card') goSection('card');
    else if (p[0] === 'glossary') goSection('glossary');
    else if (p[0] === 'topics') { var el = $('#home-topics'); if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 150); }
  }

  // ---------- HOME ----------
  function renderHome() {
    var ns = nextStep();
    var cta = $('#home-cta');
    if (cta) cta.innerHTML = '<button class="btn" data-action="' + ns.action + '">' + esc(ns.label) + ' ▶</button>' +
      '<button class="btn secondary" data-action="topics">Browse the 9 topics</button><button class="btn ghost" data-action="glossary">🔤 Glossary</button>' +
      '<div class="muted" style="width:100%;font-size:13.5px;margin-top:2px">Recommended next — ' + esc(ns.desc) + '</div>';
    var visitedN = Object.keys(state.visited).length;
    var tried = DRILLS.filter(function (q) { return state.attempts[q.id]; }).length;
    var cor = DRILLS.filter(function (q) { var a = state.attempts[q.id]; return a && a.correct; }).length;
    var miss = missedIds().length;
    var best = state.mockHistory.length ? Math.max.apply(null, state.mockHistory.map(function (m) { return m.score; })) : null;
    var steps = [
      { t: '📖 Learn', d: 'Read the 9 topics: diagrams, tables, your handouts, traps.', st: visitedN + ' of 9 topics opened', done: visitedN >= 9, btn: '<button class="btn small secondary" data-goto="study">Open Learn</button>' },
      { t: '✏️ Practice', d: DRILLS.length + ' drill questions with hints, a second try, and explanations.', st: tried ? tried + ' / ' + DRILLS.length + ' tried · ' + Math.round(100 * cor / tried) + '% first try' : 'Not started', done: tried >= DRILLS.length, btn: '<button class="btn small secondary" data-goto="practice">Practice</button>' },
      { t: '⏱ Mock test', d: '25 questions · 30 minutes · no hints — just like the real test.', st: best !== null ? 'Best: ' + best + ' / 25' : 'Not taken yet', done: best !== null, btn: '<button class="btn small secondary" data-goto="mock">Mock test</button>' },
      { t: '🔁 Fix misses', d: 'Retry only what you missed; each one links back to its study section.', st: (tried || best !== null) ? (miss ? miss + ' to retry' : 'Nothing to fix 🎉') : '—', done: !!(tried || best !== null) && !miss, btn: '<button class="btn small secondary" data-action="retry"' + (miss ? '' : ' disabled') + '>Retry missed</button>' },
      { t: '🗂 Index card', d: 'Write your 3" × 5" card by hand, using the model.', st: 'Allowed on the test', done: false, btn: '<button class="btn small secondary" data-action="card">See the model</button>' }
    ];
    var path = $('#home-path');
    if (path) path.innerHTML = steps.map(function (s2, k) {
      var now = (k + 1) === ns.step;
      return '<div class="pstep' + (s2.done ? ' done' : '') + (now ? ' now' : '') + '">' + (now ? '<span class="now-tag">Next</span>' : '') +
        '<div class="num">' + (s2.done ? '✓' : (k + 1)) + '</div><h4>' + s2.t + '</h4><div class="d">' + s2.d + '</div><div class="st">' + s2.st + '</div><div>' + s2.btn + '</div></div>';
    }).join('');
    var grid = $('#home-topics');
    if (grid) grid.innerHTML = TOPIC_IDS.map(function (n) {
      var T = TOPICS[n], st = topicStats(n), p = st.pct === null ? 0 : st.pct;
      return '<div class="tcard"><div class="top"><div class="ti">' + T.icon + '</div><div><div class="tn">TOPIC ' + n + '</div><div class="tt">' + esc(T.name) + '</div></div></div>' +
        '<div class="cl">' + T.checklist.map(esc).join(' · ') + '</div>' +
        '<div class="meta"><span class="chip ' + st.status + '">' + STATUS_TXT[st.status] + '</span><div class="bar"><div style="width:' + p + '%;background:' + (st.status === 'm' ? 'var(--green)' : st.status === 'g' ? 'var(--gold)' : 'var(--red)') + '"></div></div><span class="muted">' + st.total + ' Qs</span></div>' +
        '<div class="row" style="gap:8px"><button class="btn small" data-action="learn:' + n + '">📖 Learn</button><button class="btn small secondary" data-practice="' + n + '">✏️ Practice</button></div></div>';
    }).join('');
  }

  // ---------- GLOSSARY ----------
  var glosTopic = 'all';
  function renderGlossary() {
    var qEl = $('#glos-q'); if (!qEl) return;
    var q = (qEl.value || '').trim().toLowerCase();
    $('#glos-chips').innerHTML = '<button data-gtopic="all" class="' + (glosTopic === 'all' ? 'on' : '') + '">All topics</button>' + TOPIC_IDS.map(function (n) {
      return '<button data-gtopic="' + n + '" class="' + (String(glosTopic) === String(n) ? 'on' : '') + '" title="' + esc(topicName(n)) + '">' + TOPICS[n].icon + ' ' + n + '</button>';
    }).join('');
    var items = GLOSSARY.filter(function (g) { return (glosTopic === 'all' || String(g.t) === String(glosTopic)) && (!q || (g.term + ' ' + g.def).toLowerCase().indexOf(q) >= 0); });
    function hl(t) {
      var x = esc(t); if (!q) return x;
      var qq = esc(q), i = x.toLowerCase().indexOf(qq);
      return i < 0 ? x : x.slice(0, i) + '<mark>' + x.slice(i, i + qq.length) + '</mark>' + x.slice(i + qq.length);
    }
    var h = '';
    TOPIC_IDS.forEach(function (n) {
      var its = items.filter(function (g) { return g.t === n; });
      if (!its.length) return;
      h += '<div class="glos-group"><h4>' + TOPICS[n].icon + ' Topic ' + n + ' · ' + esc(topicName(n)) + '</h4><div class="glos-grid">' + its.map(function (g) {
        return '<div class="gl-item"><div class="gl-term">' + hl(g.term) + '</div><div class="gl-def">' + hl(g.def) + '</div><a class="xref" href="#' + g.sid + '">Learn more → ' + esc(secTitle(g.sid)) + '</a></div>';
      }).join('') + '</div></div>';
    });
    $('#glos-list').innerHTML = h || '<p class="muted">No terms match "' + esc(q) + '". Try a shorter word.</p>';
  }

  // ---------- PRACTICE ----------
  var practice = { active: false };

  function topicStats(n) {
    var qs = DRILLS.filter(function (q) { return q.topic === n; });
    var att = qs.filter(function (q) { return state.attempts[q.id]; });
    var cor = att.filter(function (q) { return state.attempts[q.id].correct; });
    var mq = MOCK.filter(function (q) { return q.topic === n; });
    var matt = mq.filter(function (q) { return state.attempts[q.id]; });
    var mcor = matt.filter(function (q) { return state.attempts[q.id].correct; });
    var allAtt = att.length + matt.length, allCor = cor.length + mcor.length;
    var pct = allAtt ? Math.round(100 * allCor / allAtt) : null;
    var status = 'ns';
    if (allAtt) status = pct >= 80 && att.length >= Math.ceil(qs.length / 2) ? 'm' : (pct >= 60 ? 'g' : 'r');
    return { total: qs.length, att: att.length, cor: cor.length, mtotal: mq.length, matt: matt.length, mcor: mcor.length, pct: pct, status: status };
  }
  var STATUS_TXT = { ns: 'Not started', r: 'Needs review', g: 'Getting there', m: 'Mastered' };

  function missedIds(pool) {
    return (pool || Q).filter(function (q) { var a = state.attempts[q.id]; return a && !a.correct; }).map(function (q) { return q.id; });
  }

  function renderPracticeSetup() {
    practice.active = false;
    var root = $('#practice-root');
    var ns = nextStep();
    var h = '<div class="panel reco"><div class="txt"><div class="eyebrow">Recommended next</div><b>' + esc(ns.label) + '</b><div class="muted" style="font-size:14px">' + esc(ns.desc) + '</div></div><button class="btn" data-action="' + ns.action + '">Go ▶</button></div>' +
      '<div class="panel"><h2 style="margin:0 0 4px">Practice drills</h2>' +
      '<p style="margin:0 0 6px">Pick topics, then answer one question at a time. <b>Hint</b> gives a nudge. If your first try is wrong, you\'ll see why that choice is wrong and get <b>one more try</b>. Only <b>first-try</b> answers count toward your score.</p>' +
      '<div class="row" style="margin:6px 0"><button class="btn small ghost" id="pk-all">Select all</button><button class="btn small ghost" id="pk-none">Clear</button></div>' +
      '<div class="topicpick">';
    TOPIC_IDS.forEach(function (n) {
      var s = topicStats(n);
      h += '<label><input type="checkbox" value="' + n + '" checked><span><b>' + TOPICS[n].icon + ' ' + n + '. ' + esc(topicName(n)) + '</b><br><span class="meta">' + s.total + ' questions · ' +
        (s.att ? s.cor + '/' + s.att + ' right first try' : 'not started') + '</span></span><span class="dot ' + (s.status === 'ns' ? '' : s.status) + '" title="' + STATUS_TXT[s.status] + '"></span><button class="btn small ghost only" data-practice="' + n + '" title="Practice only this topic">Only this ▶</button></label>';
    });
    h += '</div><div class="opts"><fieldset><legend>Which questions</legend>' +
      '<label><input type="radio" name="which" value="all" checked> All</label>' +
      '<label><input type="radio" name="which" value="new"> Not tried yet</label>' +
      '<label><input type="radio" name="which" value="missed"> Only ones I missed</label></fieldset>' +
      '<fieldset><legend>Order</legend><label><input type="radio" name="order" value="ordered" checked> Easy → hard</label>' +
      '<label><input type="radio" name="order" value="shuffle"> Shuffle</label></fieldset>' +
      '<fieldset><legend>Also include</legend><label><input type="checkbox" id="incMock"> Mock-test questions (after you\'ve taken it)</label></fieldset></div>' +
      '<div class="row"><button class="btn" id="pk-start">Start practice ▶</button><span class="kbd">Keyboard: A–D or 1–4 to choose · Enter to check / next · H for hint</span></div></div>';
    var miss = missedIds();
    if (miss.length) h += '<div class="panel"><b>You have ' + miss.length + ' missed question' + (miss.length > 1 ? 's' : '') + '.</b> <button class="btn small gold" id="pk-missed" style="margin-left:8px">Retry all missed</button></div>';
    root.innerHTML = h;
    $('#pk-all').onclick = function () { $$('.topicpick input').forEach(function (i) { i.checked = true; }); };
    $('#pk-none').onclick = function () { $$('.topicpick input').forEach(function (i) { i.checked = false; }); };
    $('#pk-start').onclick = function () {
      var topics = $$('.topicpick input:checked').map(function (i) { return Number(i.value); });
      if (!topics.length) { toast('Pick at least one topic.'); return; }
      startPractice({ topics: topics, which: $('input[name=which]:checked').value, order: $('input[name=order]:checked').value, incMock: $('#incMock').checked });
    };
    if ($('#pk-missed')) $('#pk-missed').onclick = function () { startPractice({ ids: missedIds() }); };
  }

  function startPractice(opts) {
    var ids;
    if (opts.ids) ids = opts.ids.slice();
    else {
      var pool = (opts.incMock ? Q : DRILLS).filter(function (q) { return opts.topics.indexOf(q.topic) >= 0; });
      if (opts.which === 'new') pool = pool.filter(function (q) { return !state.attempts[q.id]; });
      if (opts.which === 'missed') pool = pool.filter(function (q) { var a = state.attempts[q.id]; return a && !a.correct; });
      if (opts.order === 'shuffle') pool = shuffle(pool);
      else pool.sort(function (a, b) { return a.topic - b.topic || levelOrder(a.level) - levelOrder(b.level) || (a.id < b.id ? -1 : 1); });
      ids = pool.map(function (q) { return q.id; });
    }
    if (!ids.length) { toast('No questions match those choices.'); showTab('practice'); renderPracticeSetup(); return; }
    practice = { active: true, ids: ids, i: 0, results: [] };
    showTab('practice');
    renderPracticeQ();
  }

  function renderPracticeQ() {
    var root = $('#practice-root');
    var q = QMAP[practice.ids[practice.i]];
    practice.cur = { tries: [], hint: false, done: false, sel: null };
    var pct = Math.round(100 * practice.i / practice.ids.length);
    var prog;
    if (practice.ids.length <= 40) {
      prog = '<div class="dots" aria-label="Session progress">' + practice.ids.map(function (id, k) {
        var r = practice.results[k];
        return '<i class="' + (k === practice.i ? 'cur' : r ? (r.correct ? 'ok' : 'no') : '') + '" title="Question ' + (k + 1) + '"></i>';
      }).join('') + '<span class="lbl">' + practice.results.filter(function (r) { return r.correct; }).length + ' right first try so far</span></div>';
    } else prog = '<div class="progressbar"><div style="width:' + pct + '%"></div></div>';
    root.innerHTML = prog +
      '<div class="qcard" id="pq">' + qHeadHTML(q, 'Question ' + (practice.i + 1) + ' of ' + practice.ids.length + ' ·') +
      (q.figure ? figHTML(q.figure) : '') +
      '<div class="stem">' + q.stem + '</div>' + choicesHTML(q) +
      '<div class="helper" id="pq-help">Choose an answer, then click <b>Check answer</b>. Stuck? Try the 💡 Hint.</div>' +
      '<div id="pq-hint"></div><div id="pq-fb"></div>' +
      '<div class="qactions"><button class="btn gold" id="pq-hintbtn">💡 Hint</button>' +
      '<button class="btn" id="pq-check" disabled>Check answer</button>' +
      '<span class="spacer"></span><button class="btn ghost small" id="pq-quit">End session</button></div></div>';
    $$('#pq .choice').forEach(function (b) { b.onclick = function () { pickPractice(Number(b.dataset.i)); }; });
    $('#pq-hintbtn').onclick = showHint;
    $('#pq-check').onclick = checkPractice;
    $('#pq-quit').onclick = function () { finishPractice(true); };
  }
  function pickPractice(i) {
    var c = practice.cur; if (c.done) return;
    if (c.tries.indexOf(i) >= 0) return;
    c.sel = i;
    var hp = $('#pq-help'); if (hp) hp.style.display = 'none';
    $$('#pq .choice').forEach(function (b) { b.classList.toggle('sel', Number(b.dataset.i) === i); });
    $('#pq-check').disabled = false;
  }
  function showHint() {
    var q = QMAP[practice.ids[practice.i]];
    practice.cur.hint = true;
    $('#pq-hint').innerHTML = '<div class="hintbox">💡 <b>Hint:</b> ' + q.hint + '</div>';
    $('#pq-hintbtn').disabled = true;
  }
  function checkPractice() {
    var c = practice.cur, q = QMAP[practice.ids[practice.i]];
    if (c.done) { nextPractice(); return; }
    if (c.sel === null) return;
    var i = c.sel; c.tries.push(i);
    var btn = $('#pq .choice[data-i="' + i + '"]');
    if (i === q.answer) { finalizePractice(); return; }
    btn.classList.remove('sel'); btn.classList.add('wrong'); btn.disabled = true;
    c.sel = null; $('#pq-check').disabled = true;
    if (c.tries.length === 1) {
      $('#pq-fb').innerHTML = '<div class="fb bad" aria-live="polite"><h4>✘ Not quite — here\'s why ' + LET[i] + ' is wrong</h4><div>' + q.why_wrong[i] + '</div>' +
        '<div style="margin-top:8px"><b>Try once more.</b>' + (c.hint ? '' : ' A hint is now shown above.') + '</div></div>';
      if (!c.hint) showHint();
    } else finalizePractice();
  }
  function finalizePractice() {
    var c = practice.cur, q = QMAP[practice.ids[practice.i]];
    c.done = true;
    var firstOk = c.tries[0] === q.answer;
    var prev = state.attempts[q.id];
    state.attempts[q.id] = { first: c.tries[0], second: c.tries.length > 1 ? c.tries[1] : null, correct: firstOk, hint: c.hint, mode: 'practice', t: Date.now(), n: (prev ? prev.n : 0) + 1 };
    practice.results.push({ id: q.id, correct: firstOk, hint: c.hint });
    markDirty();
    $$('#pq .choice').forEach(function (b) {
      var k = Number(b.dataset.i); b.disabled = true; b.classList.remove('sel');
      if (k === q.answer) b.classList.add('right'); else if (c.tries.indexOf(k) < 0) b.classList.add('dim');
    });
    $('#pq-fb').innerHTML = fullExplanationHTML(q, c.tries[c.tries.length - 1]);
    if (!firstOk && c.tries[c.tries.length - 1] === q.answer) {
      $('#pq-fb .fb h4').textContent = '✔ Got it on the second try — ' + LET[q.answer] + ' (counts as a miss so you can retry it later)';
    }
    var chk = $('#pq-check'); chk.disabled = false;
    chk.textContent = practice.i + 1 < practice.ids.length ? 'Next question ▶' : 'See summary ▶';
    $('#pq-hintbtn').disabled = true;
    try { chk.focus({ preventScroll: true }); } catch (e) { }
    $('#pq-fb').scrollIntoView({ block: 'nearest' });
  }
  function nextPractice() {
    practice.i++;
    if (practice.i >= practice.ids.length) finishPractice(false); else { renderPracticeQ(); window.scrollTo(0, 0); }
  }
  function finishPractice(early) {
    var r = practice.results;
    practice.active = false;
    if (!r.length) { renderPracticeSetup(); return; }
    var ok = r.filter(function (x) { return x.correct; }).length;
    var miss = r.filter(function (x) { return !x.correct; });
    var h = '<div class="panel"><div class="row" style="align-items:flex-end"><div><div class="scorebig">' + ok + ' / ' + r.length + '</div><div style="color:var(--muted)">right on the first try' + (early ? ' (session ended early)' : '') + '</div></div>' +
      '<div style="margin-left:auto" class="row">' + (miss.length ? '<button class="btn gold" id="ps-retry">Retry the ' + miss.length + ' I missed</button>' : '') +
      '<button class="btn secondary" id="ps-new">New practice set</button><button class="btn blue" data-goto="results">My Results</button></div></div></div>';
    if (miss.length) {
      h += '<div class="panel"><h3 style="margin-top:0">Review what you missed</h3>';
      miss.forEach(function (m) { h += missedDetailsHTML(QMAP[m.id]); });
      h += '</div>';
    } else h += '<div class="panel">🎉 Perfect first-try score on this set. Try a new set or take the Mock Test.</div>';
    $('#practice-root').innerHTML = h;
    if ($('#ps-retry')) $('#ps-retry').onclick = function () { startPractice({ ids: miss.map(function (m) { return m.id; }) }); };
    $('#ps-new').onclick = renderPracticeSetup;
    window.scrollTo(0, 0);
  }

  function missedDetailsHTML(q) {
    var a = state.attempts[q.id] || {};
    var yours = a.first === null || a.first === undefined ? 'no answer' : LET[a.first];
    return '<details class="missed"><summary><span class="tag topic">T' + q.topic + '</span><b>' + q.id + '</b> <span style="font-weight:500">' +
      esc(q.subtopic || '') + '</span><span style="margin-left:auto;font-size:13px;color:var(--muted)">you: ' + yours + ' · answer: ' + LET[q.answer] + '</span></summary><div class="body">' +
      (q.figure ? figHTML(q.figure) : '') + '<div class="stem" style="font-size:16px">' + q.stem + '</div><ol type="A" style="margin:0 0 8px">' +
      q.choices.map(function (c, i) { return '<li' + (i === q.answer ? ' style="font-weight:700;color:var(--green-d)"' : (i === a.first ? ' style="color:var(--red)"' : '')) + '>' + c + '</li>'; }).join('') +
      '</ol>' + fullExplanationHTML(q, a.first) + '</div></details>';
  }

  // keyboard shortcuts in practice
  document.addEventListener('keydown', function (e) {
    if (e.target.matches('input, textarea, select')) return;
    if (currentTab === 'practice' && practice.active && $('#pq')) {
      var k = e.key.toUpperCase();
      var idx = 'ABCD'.indexOf(k); if (idx < 0) idx = '1234'.indexOf(k);
      if (idx >= 0 && !practice.cur.done) { e.preventDefault(); pickPractice(idx); }
      else if (k === 'H' && !practice.cur.done) { e.preventDefault(); if (!practice.cur.hint) showHint(); }
      else if (e.key === 'Enter' && !$('#pq-check').disabled && document.activeElement && !document.activeElement.matches('a')) { e.preventDefault(); checkPractice(); }
    } else if (currentTab === 'mock' && mock.active) {
      var k2 = e.key.toUpperCase();
      var i2 = 'ABCD'.indexOf(k2); if (i2 < 0) i2 = '1234'.indexOf(k2);
      if (i2 >= 0) { e.preventDefault(); mockPick(i2); }
      else if (e.key === 'ArrowRight') mockGo(mock.i + 1);
      else if (e.key === 'ArrowLeft') mockGo(mock.i - 1);
    }
  });

  // ---------- MOCK TEST ----------
  var mock = { active: false, submitted: false };
  function renderMockIntro() {
    var best = state.mockHistory.length ? Math.max.apply(null, state.mockHistory.map(function (m) { return m.score; })) : null;
    $('#mock-root').innerHTML = '<div class="panel" style="max-width:900px;margin:0 auto"><h2 style="margin:0 0 6px">Mock Test — 25 questions, 30 minutes</h2>' +
      '<p>This mirrors the real assessment: <b>25 multiple-choice questions</b> covering all 9 topics, <b>no hints and no feedback</b> until you submit. Use the number grid to jump around, and <b>⚑ Flag</b> questions you want to revisit.</p>' +
      '<ul><li>Have your index card ready if you\'ve made one (that\'s allowed on the real test).</li><li>The timer keeps running if you switch tabs — just like the real thing.</li><li>After you submit, you\'ll see every question with the correct answer, an explanation, and a link to the study section.</li></ul>' +
      '<div class="row" style="margin-top:10px"><label style="font-size:15px"><input type="checkbox" id="mk-timer" checked> Use the 30-minute timer</label>' +
      '<span class="spacer" style="flex:1"></span><button class="btn" id="mk-start">Start mock test ▶</button></div>' +
      (best !== null ? '<p style="margin-top:10px;color:var(--muted)">Best score so far: <b>' + best + ' / 25</b> (' + state.mockHistory.length + ' attempt' + (state.mockHistory.length > 1 ? 's' : '') + ')</p>' : '') + '</div>';
    $('#mk-start').onclick = function () { startMock($('#mk-timer').checked); };
  }
  function startMock(useTimer) {
    mock = { active: true, submitted: false, ids: MOCK.map(function (q) { return q.id; }), answers: {}, flags: {}, i: 0, start: Date.now(), timer: useTimer, limit: 30 * 60 };
    clearInterval(mock.iv);
    if (useTimer) mock.iv = setInterval(tickMock, 1000);
    renderMockQ();
  }
  function tickMock() {
    if (!mock.active) { clearInterval(mock.iv); return; }
    var left = mock.limit - Math.floor((Date.now() - mock.start) / 1000);
    var el = $('#mk-timer-disp');
    if (el) { el.textContent = '⏱ ' + fmtTime(Math.max(0, left)); el.classList.toggle('low', left <= 300); }
    if (left <= 0) { clearInterval(mock.iv); toast("Time's up! Your test was submitted."); submitMock(true); }
  }
  function fmtTime(s) { var m = Math.floor(s / 60), x = s % 60; return m + ':' + (x < 10 ? '0' : '') + x; }
  function renderMockQ() {
    var q = QMAP[mock.ids[mock.i]];
    var answered = Object.keys(mock.answers).length;
    var nav = mock.ids.map(function (id, k) {
      return '<button data-k="' + k + '" class="' + (mock.answers[id] !== undefined ? 'ans ' : '') + (mock.flags[id] ? 'flag ' : '') + (k === mock.i ? 'cur' : '') + '" aria-label="Question ' + (k + 1) + '">' + (k + 1) + '</button>';
    }).join('');
    var left = mock.limit - Math.floor((Date.now() - mock.start) / 1000);
    $('#mock-root').innerHTML = '<div class="mockbar">' + (mock.timer ? '<span class="timer" id="mk-timer-disp">⏱ ' + fmtTime(Math.max(0, left)) + '</span>' : '<span class="timer">No timer</span>') +
      '<span><b>' + answered + '</b> of 25 answered</span><span style="flex:1"></span><button class="btn ghost small" id="mk-quit">Quit (no score)</button><button class="btn warn" id="mk-submit">Submit test</button></div>' +
      '<div class="navgrid">' + nav + '</div>' +
      '<div class="qcard" id="mq"><div class="qhead"><span class="tag">Mock test</span><span style="margin-left:auto">Question <b>' + (mock.i + 1) + '</b> of 25</span></div>' +
      (q.figure ? figHTML(q.figure) : '') + '<div class="stem">' + q.stem + '</div>' + choicesHTML(q) +
      '<div class="qactions"><button class="btn ghost" id="mk-prev"' + (mock.i === 0 ? ' disabled' : '') + '>◀ Previous</button>' +
      '<button class="btn ghost" id="mk-flag">' + (mock.flags[q.id] ? '⚑ Unflag' : '⚑ Flag for review') + '</button><span class="spacer"></span>' +
      '<button class="btn" id="mk-next">' + (mock.i < 24 ? 'Next ▶' : 'Review & submit') + '</button></div></div>';
    var a = mock.answers[q.id];
    if (a !== undefined) $('#mq .choice[data-i="' + a + '"]').classList.add('sel');
    $$('#mq .choice').forEach(function (b) { b.onclick = function () { mockPick(Number(b.dataset.i)); }; });
    $$('.navgrid button').forEach(function (b) { b.onclick = function () { mockGo(Number(b.dataset.k)); }; });
    $('#mk-prev').onclick = function () { mockGo(mock.i - 1); };
    $('#mk-next').onclick = function () { if (mock.i < 24) mockGo(mock.i + 1); else confirmSubmit(); };
    $('#mk-flag').onclick = function () { mock.flags[q.id] = !mock.flags[q.id]; renderMockQ(); };
    $('#mk-submit').onclick = confirmSubmit;
    $('#mk-quit').onclick = function () { if (confirm('Quit the mock test? Your answers will not be scored or saved.')) { clearInterval(mock.iv); mock = { active: false, submitted: false }; renderMockIntro(); } };
  }
  function mockPick(i) {
    var q = QMAP[mock.ids[mock.i]];
    mock.answers[q.id] = i;
    $$('#mq .choice').forEach(function (b) { b.classList.toggle('sel', Number(b.dataset.i) === i); });
    var nb = $('.navgrid button[data-k="' + mock.i + '"]'); if (nb) nb.classList.add('ans');
    var cnt = $('.mockbar b'); if (cnt) cnt.textContent = Object.keys(mock.answers).length;
  }
  function mockGo(k) { if (k < 0 || k > 24) return; mock.i = k; renderMockQ(); }
  function confirmSubmit() {
    var un = 25 - Object.keys(mock.answers).length;
    var fl = Object.keys(mock.flags).filter(function (k) { return mock.flags[k]; }).length;
    var msg = 'Submit your mock test now?';
    if (un) msg += '\n\nYou have ' + un + ' unanswered question' + (un > 1 ? 's' : '') + '.';
    if (fl) msg += '\nYou flagged ' + fl + ' question' + (fl > 1 ? 's' : '') + ' for review.';
    if (window.confirm(msg)) submitMock(false);
  }
  function submitMock(timeUp) {
    clearInterval(mock.iv);
    mock.active = false; mock.submitted = true;
    var secs = Math.round((Date.now() - mock.start) / 1000);
    var score = 0;
    mock.ids.forEach(function (id) {
      var q = QMAP[id], a = mock.answers[id];
      var ok = a === q.answer; if (ok) score++;
      var prev = state.attempts[id];
      state.attempts[id] = { first: a === undefined ? null : a, second: null, correct: ok, hint: false, mode: 'mock', t: Date.now(), n: (prev ? prev.n : 0) + 1 };
    });
    state.mockHistory.push({ date: new Date().toISOString(), score: score, total: 25, seconds: secs, timeUp: !!timeUp, answers: mock.answers });
    markDirty();
    renderMockResults(score, secs);
  }
  function renderMockResults(score, secs) {
    var byT = {};
    mock.ids.forEach(function (id) { var q = QMAP[id]; byT[q.topic] = byT[q.topic] || { n: 0, ok: 0 }; byT[q.topic].n++; if (mock.answers[id] === q.answer) byT[q.topic].ok++; });
    var rows = TOPIC_IDS.map(function (n) {
      var t = byT[n] || { n: 0, ok: 0 }; var p = t.n ? Math.round(100 * t.ok / t.n) : 0;
      return '<tr><td><b>' + n + '.</b> ' + esc(topicName(n)) + '</td><td>' + t.ok + ' / ' + t.n + '</td><td><div class="bar"><div style="width:' + p + '%;background:' + (p >= 80 ? 'var(--green)' : p >= 50 ? 'var(--gold)' : 'var(--red)') + '"></div></div></td>' +
        '<td>' + (t.ok < t.n ? '<a class="xref" href="#t' + n + '">Review topic</a>' : '✔') + '</td></tr>';
    }).join('');
    var pct = Math.round(100 * score / 25);
    var h = '<div class="panel" style="max-width:900px;margin:0 auto 18px"><div class="row" style="align-items:flex-end"><div><div class="scorebig">' + score + ' / 25</div>' +
      '<div style="color:var(--muted)">' + pct + '% · time used ' + fmtTime(secs) + (mock.timer ? ' of 30:00' : '') + '</div></div><span style="flex:1"></span>' +
      '<button class="btn gold" id="mr-retry">Practice the ones I missed</button><button class="btn secondary" id="mr-again">Retake mock test</button></div>' +
      '<p style="margin:12px 0 4px">' + (pct >= 88 ? '🌟 Excellent — you\'re ready. Skim the Common Traps tab once more.' : pct >= 72 ? '👍 Solid! Review the topics marked below and retry your misses.' : '📚 Keep going — focus on the red topics below, re-read those sections, then retry your misses.') + '</p>' +
      '<table class="mastery" style="margin-top:10px"><tr><th>Topic</th><th>Score</th><th style="width:30%">Bar</th><th></th></tr>' + rows + '</table></div>';
    h += '<div class="panel" style="max-width:900px;margin:0 auto"><div class="row"><h3 style="margin:0">Question-by-question review</h3><span style="flex:1"></span>' +
      '<label><input type="checkbox" id="mr-onlymiss"> Show only missed</label></div><div class="navgrid" style="margin-top:12px">' +
      mock.ids.map(function (id, k) { return '<button data-k="' + k + '" class="' + (mock.answers[id] === QMAP[id].answer ? 'ok' : 'no') + '">' + (k + 1) + '</button>'; }).join('') + '</div><div id="mr-list">';
    mock.ids.forEach(function (id, k) {
      var q = QMAP[id], a = mock.answers[id], ok = a === q.answer;
      h += '<div class="qcard mr-item" data-ok="' + ok + '" id="mr-' + k + '" style="margin:14px 0;max-width:none;box-shadow:0 0 0 1px var(--line)">' +
        qHeadHTML(q, (ok ? '✔' : '✘') + ' Q' + (k + 1) + ' ·') + (q.figure ? figHTML(q.figure) : '') + '<div class="stem">' + q.stem + '</div>' +
        '<div class="choices">' + q.choices.map(function (c, i) {
          return '<div class="choice ' + (i === q.answer ? 'right' : (i === a ? 'wrong' : 'dim')) + '"><span class="L">' + LET[i] + '</span><span>' + c + (i === a ? ' <b>(your answer)</b>' : '') + '</span></div>';
        }).join('') + '</div>' + (a === undefined ? '<p style="color:var(--red);font-weight:700">Not answered.</p>' : '') +
        '<div class="hintbox" style="margin-top:10px">💡 <b>Hint you could have used:</b> ' + q.hint + '</div>' + fullExplanationHTML(q, a) + '</div>';
    });
    h += '</div></div>';
    $('#mock-root').innerHTML = h;
    var miss = mock.ids.filter(function (id) { return mock.answers[id] !== QMAP[id].answer; });
    $('#mr-retry').onclick = function () { if (!miss.length) { toast('Nothing missed — nice!'); return; } startPractice({ ids: miss }); };
    $('#mr-again').onclick = function () { mock.submitted = false; renderMockIntro(); };
    $('#mr-onlymiss').onchange = function (e) { $$('.mr-item').forEach(function (d) { d.style.display = (e.target.checked && d.dataset.ok === 'true') ? 'none' : ''; }); };
    $$('#tab-mock .navgrid button').forEach(function (b) { b.onclick = function () { var el = $('#mr-' + b.dataset.k); if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 120); }; });
    window.scrollTo(0, 0);
  }

  // ---------- RESULTS ----------
  function renderResults() {
    var root = $('#results-root');
    var drAtt = DRILLS.filter(function (q) { return state.attempts[q.id]; });
    var drCor = drAtt.filter(function (q) { return state.attempts[q.id].correct; });
    var best = state.mockHistory.length ? Math.max.apply(null, state.mockHistory.map(function (m) { return m.score; })) : null;
    var h = '<div class="savebar noprint"><div class="note"><b>Your progress lives only in this open page.</b> Click <b>Download progress</b> before you close it, then <b>Load progress</b> next time to pick up where you left off. ' +
      '<span id="savestate"></span></div><button class="btn blue small" id="r-save">⬇ Download progress</button>' +
      '<label class="btn secondary small" style="cursor:pointer">⬆ Load progress<input type="file" id="r-load" accept=".json,application/json" class="sr-only"></label>' +
      '<button class="btn ghost small" id="r-print">🖨 Print my report</button><button class="btn ghost small" id="r-reset">Reset</button></div>';
    var ns = nextStep();
    h += '<div class="nextbanner noprint"><div class="txt"><div class="eyebrow" style="color:#975a16">Your next best step</div><b>' + esc(ns.label) + '</b><div class="muted" style="font-size:14px">' + esc(ns.desc) + '</div></div><button class="btn" data-action="' + ns.action + '">Go ▶</button></div>';
    h += '<div class="panel"><h2 style="margin:0 0 10px">My Results</h2><div class="statgrid">' +
      '<div class="stat"><div class="n">' + drAtt.length + ' / ' + DRILLS.length + '</div><div class="l">drill questions tried</div></div>' +
      '<div class="stat"><div class="n">' + (drAtt.length ? Math.round(100 * drCor.length / drAtt.length) + '%' : '—') + '</div><div class="l">right on first try (drills)</div></div>' +
      '<div class="stat"><div class="n">' + (best !== null ? best + ' / 25' : '—') + '</div><div class="l">best mock-test score</div></div></div>' +
      '<p style="font-size:13px;color:var(--muted);margin:10px 0 0">Status uses your most recent first-try answer to each question (drills + mock). <b>Mastered</b> = 80%+ with at least half the drills tried · <b>Getting there</b> = 60–79% · <b>Needs review</b> = under 60%.</p></div>';
    h += '<div class="panel"><h3 style="margin-top:0">Mastery by topic</h3><div class="tablewrap"><table class="mastery"><tr><th>Topic</th><th>Drills tried</th><th>First-try correct</th><th>Mock</th><th style="width:16%">Progress</th><th>Status</th><th class="noprint">Next step</th></tr>';
    TOPIC_IDS.forEach(function (n) {
      var s = topicStats(n);
      var p = s.pct === null ? 0 : s.pct;
      h += '<tr><td><b>' + n + '.</b> ' + esc(topicName(n)) + '</td><td>' + s.att + ' / ' + s.total + '</td><td>' + (s.att ? s.cor + ' (' + Math.round(100 * s.cor / s.att) + '%)' : '—') + '</td>' +
        '<td>' + (s.matt ? s.mcor + ' / ' + s.matt : '—') + '</td><td><div class="bar"><div style="width:' + p + '%;background:' + (s.status === 'm' ? 'var(--green)' : s.status === 'g' ? 'var(--gold)' : 'var(--red)') + '"></div></div></td>' +
        '<td><span class="chip ' + s.status + '">' + STATUS_TXT[s.status] + '</span></td><td class="noprint"><div class="row" style="gap:6px"><a class="xref" href="#t' + n + '">Study</a>' +
        '<button class="btn small secondary" data-practice="' + n + '">Practice</button></div></td></tr>';
    });
    h += '</table></div></div>';

    // focus list
    var weak = TOPIC_IDS.map(function (n) { return { n: n, s: topicStats(n) }; }).filter(function (x) { return x.s.status === 'r' || x.s.status === 'g'; })
      .sort(function (a, b) { return a.s.pct - b.s.pct; }).slice(0, 4);
    var missAll = missedIds();
    if (weak.length || missAll.length) {
      h += '<div class="panel"><h3 style="margin-top:0">Your focus list</h3>';
      if (weak.length) {
        h += '<ol class="focuslist">';
        weak.forEach(function (w) {
          var secs = {};
          Q.filter(function (q) { var a = state.attempts[q.id]; return q.topic === w.n && a && !a.correct; }).forEach(function (q) { secs[q.review] = (secs[q.review] || 0) + 1; });
          var secLinks = Object.keys(secs).map(function (sid) { return '<a class="xref" href="#' + sid + '">' + esc(secTitle(sid)) + '</a> (' + secs[sid] + ' missed)'; }).join(' · ');
          h += '<li><b>Topic ' + w.n + ' — ' + esc(topicName(w.n)) + '</b> <span class="chip ' + w.s.status + '">' + w.s.pct + '%</span><br>Re-read: ' + (secLinks || '<a class="xref" href="#t' + w.n + '">the whole topic</a>') +
            '<br><span style="color:var(--muted);font-size:14px">Class handouts: ' + esc(TOPICS[w.n].handouts) + '</span></li>';
        });
        h += '</ol>';
      }
      h += '</div>';
    }
    h += '<div class="panel"><div class="row"><h3 style="margin:0">Missed questions (' + missAll.length + ')</h3><span style="flex:1"></span>' +
      (missAll.length ? '<button class="btn gold small noprint" id="r-retry">Retry all missed</button>' : '') + '</div>';
    if (!missAll.length) h += '<p style="color:var(--muted)">No missed questions yet. Answer some drills or take the mock test, and anything you miss will show up here with full explanations.</p>';
    TOPIC_IDS.forEach(function (n) {
      var ids = missAll.filter(function (id) { return QMAP[id].topic === n; });
      if (!ids.length) return;
      h += '<h4 style="margin:16px 0 4px;color:var(--green-d)">Topic ' + n + ' · ' + esc(topicName(n)) + '</h4>';
      ids.forEach(function (id) { h += missedDetailsHTML(QMAP[id]); });
    });
    h += '</div>';
    if (state.mockHistory.length) {
      h += '<div class="panel"><h3 style="margin-top:0">Mock test history</h3><table class="mastery"><tr><th>#</th><th>Date</th><th>Score</th><th>Time</th></tr>' +
        state.mockHistory.map(function (m, k) { return '<tr><td>' + (k + 1) + '</td><td>' + new Date(m.date).toLocaleString() + '</td><td><b>' + m.score + ' / 25</b></td><td>' + fmtTime(m.seconds) + (m.timeUp ? ' (time up)' : '') + '</td></tr>'; }).join('') + '</table></div>';
    }
    root.innerHTML = h;
    $('#r-save').onclick = saveProgress;
    $('#r-load').onchange = loadProgress;
    $('#r-print').onclick = printReport;
    $('#r-reset').onclick = function () { if (confirm('Erase all progress in this page? (Download it first if you want to keep it.)')) { state.attempts = {}; state.mockHistory = []; state.visited = {}; state.dirty = false; mock = { active: false, submitted: false }; updateBadges(); renderResults(); toast('Progress reset.'); } };
    if ($('#r-retry')) $('#r-retry').onclick = function () { startPractice({ ids: missedIds() }); };
    updateSaveState();
  }

  // ---------- save / load / print ----------
  function saveProgress() {
    var data = { app: 'ecosystems-study-guide', version: 1, saved: new Date().toISOString(), attempts: state.attempts, mockHistory: state.mockHistory, visited: state.visited };
    var blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
    var a = document.createElement('a');
    var d = new Date();
    a.download = 'ecosystems-progress-' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + '.json';
    a.href = URL.createObjectURL(blob);
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    state.dirty = false; state.lastSaved = new Date();
    updateSaveState(); toast('Progress file downloaded.');
  }
  function loadProgress(e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var d = JSON.parse(r.result);
        if (d.app !== 'ecosystems-study-guide' || typeof d.attempts !== 'object') throw new Error('not a progress file from this study guide');
        var known = {}; Object.keys(d.attempts).forEach(function (k) { if (QMAP[k]) known[k] = d.attempts[k]; });
        state.attempts = known; state.mockHistory = Array.isArray(d.mockHistory) ? d.mockHistory : [];
        state.visited = (d.visited && typeof d.visited === 'object') ? d.visited : {};
        state.dirty = false; state.lastSaved = d.saved ? new Date(d.saved) : null;
        updateBadges(); renderResults();
        toast('Progress loaded: ' + Object.keys(known).length + ' answered questions.');
      } catch (err) { alert('Could not load that file: ' + err.message); }
    };
    r.readAsText(f);
  }
  function printReport() {
    showTab('results');
    $$('#tab-results details').forEach(function (d) { d.open = true; });
    document.body.classList.add('print-report');
    setTimeout(function () { window.print(); }, 50);
  }
  window.addEventListener('afterprint', function () { document.body.classList.remove('print-report'); });
  function updateSaveState() {
    var el = $('#savestate'); if (!el) return;
    var n = Object.keys(state.attempts).length;
    el.innerHTML = !n ? '' : state.dirty ? '<span class="unsaved">● You have unsaved progress.</span>' : (state.lastSaved ? '✔ Saved ' + state.lastSaved.toLocaleTimeString() : '');
  }
  window.addEventListener('beforeunload', function (e) { if (state.dirty && Object.keys(state.attempts).length) { e.preventDefault(); e.returnValue = ''; } });

  // ---------- badges / TOC dots ----------
  function updateBadges() {
    var n = missedIds().length;
    var b = $('#missedcount'); if (b) { b.textContent = n; b.style.display = n ? 'inline-block' : 'none'; }
    $$('.toc .dot[data-topic]').forEach(function (d) { var s = topicStats(Number(d.dataset.topic)); d.className = 'dot ' + (s.status === 'ns' ? '' : s.status); d.title = STATUS_TXT[s.status]; });
    updateOverviewStatus();
    if (currentTab === 'home') renderHome();
    var hs = $('#home-stats');
    if (hs) {
      var att = Object.keys(state.attempts).length;
      var cor = Object.keys(state.attempts).filter(function (k) { return state.attempts[k].correct; }).length;
      hs.innerHTML = '<div class="stat"><div class="n">' + Q.length + '</div><div class="l">practice questions</div></div>' +
        '<div class="stat"><div class="n">' + att + '</div><div class="l">answered so far</div></div>' +
        '<div class="stat"><div class="n">' + (att ? Math.round(100 * cor / att) + '%' : '—') + '</div><div class="l">first-try correct</div></div>';
    }
  }

  // ---------- study TOC: highlight current section ----------
  function setupTOC() {
    var sel = $('#tocsel');
    if (sel) sel.onchange = function () { goSection(sel.value, false); };
    var ticking = false;
    window.addEventListener('scroll', function () {
      var tt = $('#totop'); if (tt) tt.style.display = (currentTab === 'study' && window.scrollY > 700) ? 'inline-flex' : 'none';
      if (currentTab !== 'study' || ticking) return; ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var art = $('article.topic.active'); if (!art) return;
        var cur = null;
        $$('h3[id]', art).forEach(function (h) { if (h.getBoundingClientRect().top < 150) cur = h.id; });
        $$('.toc a.tocl').forEach(function (a) { a.classList.toggle('cur', !!cur && a.getAttribute('href') === '#' + cur); });
      });
    });
    var tt = $('#totop'); if (tt) tt.onclick = function () { window.scrollTo(0, 0); };
    var gq = $('#glos-q'); if (gq) gq.addEventListener('input', renderGlossary);
  }

  // ---------- init ----------
  function init() {
    $$('nav.tabs button').forEach(function (b) { b.onclick = function () { if (b.dataset.tab === 'mock' && mock.active) { showTab('mock', { keepScroll: true }); return; } showTab(b.dataset.tab); }; });
    $('#backbtn').onclick = goBack;
    setupTOC();
    renderGlossary();
    activateTopic(1, false);
    state.visited = {};
    updateBadges();
    showTab('home');
    if (window.SELFTEST) runSelfTest();
    if (window.QA) { try { window.QA({ showTab: showTab, startPractice: startPractice, pickPractice: pickPractice, checkPractice: checkPractice, showHint: showHint, goSection: goSection, startMock: startMock, mockPick: mockPick, mockGo: mockGo, submitMock: submitMock, finishPractice: finishPractice, state: state, Q: Q, QMAP: QMAP, MOCK: MOCK, DRILLS: DRILLS, practice: function () { return practice; } }); } catch (err) { showError('QA: ' + err.message); } }
  }

  // ---------- automated self-test (only in the test build) ----------
  function runSelfTest() {
    var log = [], fails = 0;
    function ok(c, m) { log.push((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; }
    try {
      ok(Q.length === 101, 'question count ' + Q.length);
      Q.forEach(function (q) { if (q.figure && !FIGS[q.figure]) ok(false, 'missing fig ' + q.figure); if (!SECTIONS[q.review]) ok(false, 'missing section ' + q.review); });
      // practice every drill: wrong first then right
      startPractice({ topics: TOPIC_IDS, which: 'all', order: 'ordered' });
      var steps = 0;
      while (practice.active && steps < 500) {
        var q = QMAP[practice.ids[practice.i]];
        var wrong = (q.answer + 1) % 4;
        if (practice.i % 3 === 0) { pickPractice(wrong); checkPractice(); ok(!!$('#pq-fb .fb.bad'), 'wrong feedback ' + q.id); pickPractice(q.answer); checkPractice(); }
        else { pickPractice(q.answer); checkPractice(); }
        ok(!!$('#pq-fb .fb'), 'explanation shown ' + q.id);
        checkPractice(); steps++;
      }
      ok(Object.keys(state.attempts).length === DRILLS.length, 'all drills recorded ' + Object.keys(state.attempts).length);
      var missed = missedIds().length; ok(missed > 0, 'missed list ' + missed);
      showTab('results'); ok(!!$('table.mastery'), 'results render');
      // xref navigation
      goSection('s4-density', true); ok(currentTab === 'study' && $('article.topic.active').dataset.topic === '4', 'goSection opens topic 4'); goBack(); ok(currentTab === 'results', 'back works');
      goSection('traps', false); ok(currentTab === 'review' && $('#pane-traps').classList.contains('active'), 'traps pane');
      goSection('glossary', false); $('#glos-q').value = 'evenness'; renderGlossary(); ok($$('.gl-item').length >= 1, 'glossary search ' + $$('.gl-item').length); $('#glos-q').value = ''; renderGlossary();
      showTab('home'); ok($$('.pstep').length === 5 && $$('.tcard').length === 9, 'home path + topic cards');
      runAction('learn:7'); ok($('article.topic.active').dataset.topic === '7', 'learn action');
      // mock
      showTab('mock'); startMock(true);
      MOCK.forEach(function (mq, k) { mockGo(k); mockPick(k % 5 === 0 ? (mq.answer + 1) % 4 : mq.answer); });
      submitMock(false);
      ok(state.mockHistory.length === 1 && state.mockHistory[0].score === 20, 'mock score ' + state.mockHistory[0].score);
      showTab('results'); ok($$('#tab-results details.missed').length === missedIds().length, 'missed details ' + $$('details.missed').length);
      // retry missed
      startPractice({ ids: missedIds() }); ok(practice.active && practice.ids.length === missedIds().length, 'retry missed set ' + practice.ids.length);
      finishPractice(true);
      ok(document.querySelectorAll('svg').length > 30, 'svgs in page ' + document.querySelectorAll('svg').length);
    } catch (err) { ok(false, 'EXCEPTION ' + err.message + ' ' + (err.stack || '')); }
    var pre = document.createElement('pre');
    pre.id = 'selftest';
    pre.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999;max-height:60vh;overflow:auto;background:' + (fails ? '#fff5f5' : '#f0fff4') + ';border:3px solid ' + (fails ? '#c53030' : '#2f855a') + ';padding:10px;font-size:13px;margin:0';
    pre.title = 'click to hide'; pre.onclick = function () { pre.remove(); };
    pre.textContent = '(QA build, not for students; click to hide) SELF-TEST: ' + (fails ? fails + ' FAILURES' : 'ALL PASSED') + ' (' + log.length + ' checks)\n' + log.filter(function (l) { return l.indexOf('FAIL') === 0; }).join('\n') + '\n' + log.slice(-12).join('\n');
    document.body.appendChild(pre);
    state.dirty = false;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
