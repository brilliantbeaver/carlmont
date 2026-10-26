#!/usr/bin/env python3
"""Assemble the single-file interactive study guide (and a self-test build)."""
import json, os, re, sys, collections
import markdown

ROOT = '/sessions/zealous-vigilant-wright/mnt/outputs'
G = os.path.join(ROOT, 'guide')
FIGDIR = os.path.join(ROOT, 'figs')
T = os.path.join(ROOT, 'tools')

TOPICS = {
    1: {'name': 'Earth Systems Science', 'handouts': 'Earth Systems Science Graphic Organizer'},
    2: {'name': 'Ecological Relationships', 'handouts': 'Ecological Relationships notes; Gizmos Ecosystems STEM Case (Atlas National Park)'},
    3: {'name': 'Food Chains, Webs & Energy', 'handouts': 'Creating Chains and Webs (Redwood Forest); Gizmos Ecosystems Handbook'},
    4: {'name': 'Limiting Factors & Carrying Capacity', 'handouts': 'Limiting Factors & Carrying Capacity worksheet; Carrying Capacity Simulation & Explanatory Model'},
    5: {'name': 'Succession, Fragmentation & Fire', 'handouts': 'Habitat Fragmentation Simulation; Life from Stone (Yosemite); CZU / Big Basin notes; Wildfires: What is happening in California?'},
    6: {'name': 'Biodiversity', 'handouts': 'Sampling Diversity'},
    7: {'name': 'What is an Ecosystem?', 'handouts': 'Gizmos Ecosystems Handbook ("What is an Ecosystem")'},
    8: {'name': 'Graphs (DRY MIX)', 'handouts': 'DRY MIX Graphing Vocabulary Notes; Carrying Capacity Simulation graph; wildfire graph analysis'},
    9: {'name': 'Scientific Argumentation (CER)', 'handouts': 'Sampling Diversity; Habitat Fragmentation recommendations; Gizmo case study'},
}
STUDY_FILES = ['t1_t2.md', 't3_t4.md', 't5_t6.md', 't7_t9.md']
ALL_MD = ['home.md'] + STUDY_FILES + ['traps.md', 'indexcard.md']
HEAD_RE = re.compile(r'^(#{2,3}) (.+?) \{#([\w-]+)\}\s*$', re.M)


def plain(s):
    return re.sub(r'[*_`]', '', s).strip()


def read(name):
    return open(os.path.join(G, name), encoding='utf-8').read()


def load_svg(fid):
    s = open(os.path.join(FIGDIR, fid + '.svg'), encoding='utf-8').read()
    s = re.sub(r'<\?xml[^>]*\?>', '', s).strip()
    return s


def collect_sections():
    secs = collections.OrderedDict()
    for f in ALL_MD:
        topic = None
        for m in HEAD_RE.finditer(read(f)):
            lvl, title, sid = len(m.group(1)), plain(m.group(2)), m.group(3)
            tm = re.match(r't(\d)$', sid)
            if tm:
                topic = int(tm.group(1))
            secs[sid] = {'title': title, 'level': lvl, 'file': f, 'topic': topic}
    return secs


def render_md(text, secs, figs_used, captions, mode='html'):
    figs = []
    pr = []

    def figsub(m):
        fid, cap = m.group(1), (m.group(2) or '').strip()
        figs.append((fid, cap))
        figs_used.add(fid)
        captions[fid] = cap
        return '\n\nFIGPH%dX\n\n' % (len(figs) - 1)

    def prsub(m):
        pr.append(int(m.group(1)))
        return '\n\nPRACPH%dX\n\n' % (len(pr) - 1)

    def refsub(m):
        sid = m.group(1)
        if sid not in secs:
            raise SystemExit('unknown ref ' + sid)
        return '<a class="xref" href="#%s">%s</a>' % (sid, secs[sid]['title'])

    text = re.sub(r'\[\[fig:([\w-]+)(?:\|([^\]]*))?\]\]', figsub, text)
    text = re.sub(r'\[\[practice:(\d)\]\]', prsub, text)
    text = re.sub(r'\[\[ref:([\w-]+)\]\]', refsub, text)
    md = markdown.Markdown(extensions=['tables', 'attr_list', 'md_in_html'])
    h = md.convert(text)
    h = h.replace('<table>', '<div class="tablewrap"><table>').replace('</table>', '</table></div>')
    for i, (fid, cap) in enumerate(figs):
        if mode == 'html':
            fig = '<figure class="fig" id="fig-%s"><div class="svgwrap">%s</div>%s</figure>' % (
                fid, load_svg(fid), ('<figcaption>%s</figcaption>' % cap) if cap else '')
        else:
            fig = '<figure data-fig="%s"><figcaption>%s</figcaption></figure>' % (fid, cap)
        h = re.sub(r'<p>\s*FIGPH%dX\s*</p>' % i, lambda _m, fig=fig: fig, h)
        h = h.replace('FIGPH%dX' % i, fig)
    for i, n in enumerate(pr):
        if mode == 'html':
            cta = ('<div class="practice-cta"><div class="txt"><b>Check yourself on Topic %d.</b> %s questions with hints and explanations.</div>'
                   '<button class="btn" data-practice="%d">Practice Topic %d ▶</button></div>') % (n, '{{N%d}}' % n, n, n)
        else:
            cta = '<p class="practice-cta">Practice: Topic %d drills (questions T%d-xx in the Practice Questions section).</p>' % (n, n)
        h = re.sub(r'<p>\s*PRACPH%dX\s*</p>' % i, lambda _m, cta=cta: cta, h)
        h = h.replace('PRACPH%dX' % i, cta)
    assert 'FIGPH' not in h and 'PRACPH' not in h
    return h


def load_questions():
    qs = []
    for f in ['qA.json', 'qB.json', 'qC.json', 'qD.json', 'qM.json']:
        qs += json.load(open(os.path.join(ROOT, 'questions', f), encoding='utf-8'))
    order = {t: i for i, t in enumerate(range(1, 10))}
    drills = sorted([q for q in qs if not q['id'].startswith('M-')], key=lambda q: (q['topic'], q['id']))
    mock = sorted([q for q in qs if q['id'].startswith('M-')], key=lambda q: q['id'])
    for q in drills + mock:
        e = re.sub(r'^\s*Correct\s*[:\-\u2014\u2013,.!]*\s*', '', q['explanation'])
        q['explanation'] = e[:1].upper() + e[1:]
    return drills + mock


ICONS = {1: '🌍', 2: '🤝', 3: '🍃', 4: '📈', 5: '🔥', 6: '🐞', 7: '🏞️', 8: '📊', 9: '🧠'}
CHECKLIST = {
    1: [('Earth Systems Science', 's1-ess'), ('Atmosphere', 's1-spheres'), ('Hydrosphere', 's1-spheres'), ('Biosphere', 's1-spheres'), ('Geosphere', 's1-spheres'), ('Sphere interactions', 's1-interact')],
    2: [('Symbiosis', 's2-symbiosis'), ('Mutualism', 's2-symbiosis'), ('Commensalism', 's2-symbiosis'), ('Parasitism', 's2-symbiosis'), ('Predator / prey', 's2-predprey'), ('Inter- & intraspecific competition', 's2-competition'), ('Keystone species', 's2-keystone')],
    3: [('Trophic levels (autotroph, heterotroph)', 's3-trophic'), ('Producers & consumers', 's3-trophic'), ('Food chains & webs', 's3-arrows'), ('Decomposers', 's3-decomposers'), ('Metabolism', 's3-energy'), ('Flow of energy (10%)', 's3-energy')],
    4: [('Limiting factors', 's4-limiting'), ('Density-dependent vs. -independent', 's4-density'), ('Exponential growth', 's4-growth'), ('Carrying capacity', 's4-growth'), ('Overshoot · decline · recovery', 's4-overshoot'), ('Cyclical / periodic', 's4-cycles')],
    5: [('Habitat fragmentation', 's5-fragmentation'), ('Primary succession', 's5-primary'), ('Secondary succession', 's5-secondary'), ('Pioneer species & climax community', 's5-organisms'), ('Crown & surface fires', 's5-fire'), ('Fire severity', 's5-fire'), ('Disturbances', 's5-fire'), ('CZU fire case study', 's5-czu')],
    6: [('Biodiversity', 's6-biodiversity'), ('Richness / evenness', 's6-richeven'), ('Relative abundance', 's6-relabund')],
    7: [('Ecosystem', 's7-ecosystem'), ('Equilibrium', 's7-equilibrium'), ('Biotic / abiotic factors', 's7-biotic')],
    8: [('X & Y axes · IV & DV · DRY MIX', 's8-drymix'), ('Line vs. bar graphs', 's8-graphtypes'), ('Reading graphs', 's8-reading')],
    9: [('Claim', 's9-cer'), ('Evidence', 's9-cer'), ('Reasoning', 's9-cer')],
}


def esc(x):
    return x.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


def drop_sections(md_text, drop_ids):
    parts = re.split(r'(?m)^(?=## )', md_text)
    keep = [pt for pt in parts if not any('{#%s}' % d in pt.split('\n', 1)[0] for d in drop_ids)]
    return ''.join(keep)


def build(selftest=False, qa=None, name=None):
    secs = collect_sections()
    figs_used, captions = set(), {}
    home = render_md(drop_sections(read('home.md'), ['home-how', 'home-map']), secs, figs_used, captions)
    study_raw = '\n'.join(render_md(read(f), secs, figs_used, captions) for f in STUDY_FILES)
    traps = render_md(read('traps.md'), secs, figs_used, captions)
    card = render_md(read('indexcard.md'), secs, figs_used, captions)
    glossary = json.load(open(os.path.join(G, 'glossary.json'), encoding='utf-8'))
    for gl in glossary:
        assert gl['sid'] in secs, gl
    qs = load_questions()
    for q in qs:
        assert q['review'] in secs, (q['id'], q['review'])
        if q['figure']:
            assert os.path.exists(os.path.join(FIGDIR, q['figure'] + '.svg')), q['figure']
    cnt = collections.Counter(q['topic'] for q in qs if not q['id'].startswith('M-'))
    for n in CHECKLIST:
        for _, sid in CHECKLIST[n]:
            assert sid in secs, sid

    # ---- split study into one <article> per topic, add overview + footer navigation
    chunks = re.split(r'(?=<h2 id="t\d">)', study_raw)
    chunks = [c for c in chunks if c.strip()]
    assert len(chunks) == 9, len(chunks)
    arts = []
    for c in chunks:
        n = int(re.match(r'<h2 id="t(\d)">', c).group(1))
        name_ = TOPICS[n]['name']
        c = re.sub(r'<div class="practice-cta">.*?</div>\s*<button[^>]*>.*?</button></div>', '', c, flags=re.S)
        terms = [g for g in glossary if g['t'] == n]
        chips = ''.join('<a class="chiplink xref" href="#%s">%s</a>' % (sid, esc(lbl)) for lbl, sid in CHECKLIST[n])
        dl = ''.join('<div class="kt"><dt>%s</dt><dd>%s</dd></div>' % (esc(g['term']), esc(g['def'])) for g in terms)
        overview = ('<div class="overview">'
                    '<div class="ov-main"><div class="ov-h">✅ On Ms. Hero\'s checklist — click to jump</div><div class="chips">%s</div>'
                    '<div class="ov-hand">📄 <b>Class handouts:</b> %s</div></div>'
                    '<div class="ov-side"><div class="ov-h">🎯 Check yourself</div><div class="ov-n"><b>%d</b> practice questions</div>'
                    '<div class="ov-status" data-ovstatus="%d"></div><button class="btn small" data-practice="%d">Practice Topic %d ▶</button></div>'
                    '<details class="ov-terms"><summary>🔤 Key terms in this topic (%d) — definitions at a glance</summary><dl>%s</dl></details>'
                    '</div>') % (chips, esc(TOPICS[n]['handouts']), cnt[n], n, n, n, len(terms), dl)
        # insert overview right after the "Know it cold" callout
        m = re.search(r'<div class="callout know">.*?</div>', c, flags=re.S)
        c = c[:m.end()] + overview + c[m.end():] if m else c
        prog = ''.join('<i class="%s"></i>' % ('on' if k == n else ('done' if k < n else '')) for k in range(1, 10))
        prev_btn = ('<button class="btn ghost small" data-topicnav="%d">◀ Topic %d</button>' % (n - 1, n - 1)) if n > 1 else ''
        next_btn = ('<button class="btn ghost small" data-topicnav="%d">Topic %d ▶</button>' % (n + 1, n + 1)) if n < 9 else ''
        bar = ('<div class="topic-bar noprint"><span class="tb-ico">%s</span><span class="tb-txt">Topic <b>%d</b> of 9</span>'
               '<span class="tb-prog" aria-hidden="true">%s</span><span class="spacer"></span>%s%s</div>') % (ICONS[n], n, prog, prev_btn, next_btn)
        if n < 9:
            nxt = '<button class="btn secondary" data-topicnav="%d">Next: %s Topic %d · %s ▶</button>' % (n + 1, ICONS[n + 1], n + 1, esc(TOPICS[n + 1]['name']))
        else:
            nxt = '<button class="btn secondary" data-goto="mock">Next: ⏱ Take the Mock Test ▶</button>'
        prv = ('<button class="btn ghost" data-topicnav="%d">◀ Topic %d · %s</button>' % (n - 1, n - 1, esc(TOPICS[n - 1]['name']))) if n > 1 else '<span></span>'
        foot = ('<div class="topic-foot noprint"><div class="tf-practice"><div class="txt"><b>%s Check yourself on Topic %d.</b> %d questions with hints, explanations, and links back to this page.</div>'
                '<button class="btn" data-practice="%d">Practice Topic %d ▶</button></div><div class="tf-nav">%s%s</div></div>') % (ICONS[n], n, cnt[n], n, n, prv, nxt)
        # add icon to topic heading
        c = c.replace('<h2 id="t%d">' % n, '<h2 id="t%d"><span class="h2ico" aria-hidden="true">%s</span>' % (n, ICONS[n]), 1)
        arts.append('<article class="topic%s" id="topic-%d" data-topic="%d">%s%s%s</article>' % (' active' if n == 1 else '', n, n, bar, c, foot))
    study = '\n'.join(arts)

    # ---- TOC: topics with their subsections (subsections shown for the active topic)
    toc, tocsel = [], []
    groups = collections.OrderedDict()
    for sid, s_ in secs.items():
        if s_['file'] in STUDY_FILES and s_['topic']:
            groups.setdefault(s_['topic'], []).append((sid, s_))
    for n, items in groups.items():
        subs = ''.join('<a class="tocl s" href="#%s">%s</a>' % (sid, esc(s_['title'])) for sid, s_ in items if s_['level'] == 3)
        toc.append('<div class="toc-topic%s" data-topic="%d"><a class="tocl t" href="#t%d"><span class="tico">%s</span><span class="tname">%d. %s</span><span class="dot" data-topic="%d"></span></a><div class="toc-subs">%s</div></div>'
                   % (' active' if n == 1 else '', n, n, ICONS[n], n, esc(TOPICS[n]['name']), n, subs))
        tocsel.append('<optgroup label="%s Topic %d · %s"><option value="t%d">Topic %d overview</option>%s</optgroup>' % (
            ICONS[n], n, esc(TOPICS[n]['name']), n, n, ''.join('<option value="%s">%s</option>' % (sid, esc(s_['title'])) for sid, s_ in items if s_['level'] == 3)))
    tocsel.append('<optgroup label="Quick review"><option value="glossary">Glossary of key terms</option><option value="traps">Common traps</option><option value="card">Index card model</option></optgroup>')

    topics_js = {}
    for k, v in TOPICS.items():
        topics_js[str(k)] = dict(v, icon=ICONS[k], checklist=[lbl for lbl, _ in CHECKLIST[k]], n=cnt[k])
    qfigs = sorted({q['figure'] for q in qs if q['figure']})
    data = {
        'QUESTIONS': qs,
        'FIGS': {f: load_svg(f) for f in qfigs},
        'SECTIONS': {sid: {'title': s_['title'], 'topic': s_['topic']} for sid, s_ in secs.items()},
        'TOPICS': topics_js,
        'GLOSSARY': glossary,
    }
    datajs = '\n'.join('window.%s = %s;' % (k, json.dumps(v, ensure_ascii=False).replace('</', '<\\/')) for k, v in data.items())

    shell = open(os.path.join(T, 'shell.html'), encoding='utf-8').read()
    out = (shell.replace('{{CSS}}', open(os.path.join(T, 'app.css'), encoding='utf-8').read())
           .replace('{{HOME}}', home).replace('{{STUDY}}', study).replace('{{TOC}}', '\n'.join(toc))
           .replace('{{TOCSEL}}', ''.join(tocsel)).replace('{{TRAPS}}', traps).replace('{{CARD}}', card)
           .replace('{{NQ}}', str(len(qs))).replace('{{DATA}}', datajs)
           .replace('{{SELFTEST}}', ('<script>window.SELFTEST=true;</script>' if selftest else '') + (('<script>window.QA=' + qa + ';</script>') if qa else ''))
           .replace('{{JS}}', open(os.path.join(T, 'app.js'), encoding='utf-8').read()))
    assert not re.findall(r'\{\{[A-Z]+\}\}', out), re.findall(r'\{\{\w+\}\}', out)
    ids = re.findall(r'\sid="([^"]+)"', out)
    dup = [k for k, v in collections.Counter(ids).items() if v > 1]
    if dup:
        print('WARNING duplicate ids:', dup[:20])
    name = name or ('selftest.html' if selftest else 'Ecosystems_Study_Guide.html')
    path = os.path.join(ROOT, name)
    open(path, 'w', encoding='utf-8').write(out)
    print(name, round(len(out.encode()) / 1024), 'KB;', len(qs), 'questions;', len(figs_used), 'guide figures;', len(qfigs), 'question figures;', len(glossary), 'glossary terms')
    return secs, captions


if __name__ == '__main__':
    build(False)
    if '--selftest' in sys.argv:
        build(True, name='_qa_selftest.html')
