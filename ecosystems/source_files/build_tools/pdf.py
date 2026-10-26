#!/usr/bin/env python3
"""Build the print PDF (study guide + question booklet + hints + answer key + weakness tracker)."""
import os, re, sys, html, collections
sys.path.insert(0, os.path.dirname(__file__))
import build
from bs4 import BeautifulSoup, NavigableString, Tag
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
                                Image, PageBreak, KeepTogether, CondPageBreak, Flowable)
from reportlab.lib.fonts import addMapping

ROOT = build.ROOT
PNG = os.path.join(ROOT, 'png', 'print')
OUT = os.path.join(ROOT, 'Ecosystems_Study_Guide_Print.pdf')
FD = '/usr/share/fonts/truetype/dejavu/'
pdfmetrics.registerFont(TTFont('DV', FD + 'DejaVuSansCondensed.ttf'))
pdfmetrics.registerFont(TTFont('DV-B', FD + 'DejaVuSansCondensed-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DV-I', FD + 'DejaVuSansCondensed-Oblique.ttf'))
pdfmetrics.registerFont(TTFont('DV-BI', FD + 'DejaVuSansCondensed-BoldOblique.ttf'))
pdfmetrics.registerFont(TTFont('DVM', FD + 'DejaVuSansMono.ttf'))
pdfmetrics.registerFont(TTFont('DVH', FD + 'DejaVuSans-Bold.ttf'))
addMapping('DV', 0, 0, 'DV'); addMapping('DV', 1, 0, 'DV-B'); addMapping('DV', 0, 1, 'DV-I'); addMapping('DV', 1, 1, 'DV-BI')

INK = colors.HexColor('#1f2937'); MUTED = colors.HexColor('#6b7280'); LINE = colors.HexColor('#d9dee5')
GREEN = colors.HexColor('#2f855a'); GREEN_D = colors.HexColor('#22543d'); GREEN_L = colors.HexColor('#e6f4ea')
BLUE = colors.HexColor('#2b6cb0'); BLUE_L = colors.HexColor('#e8f1fb'); RED = colors.HexColor('#c53030'); RED_L = colors.HexColor('#fdecec')
GOLD = colors.HexColor('#b7791f'); GOLD_L = colors.HexColor('#fdf6e3'); PURPLE = colors.HexColor('#6b46c1'); PURPLE_L = colors.HexColor('#f1ecfb')
HEAD_BG = colors.HexColor('#eef5f0')
CALLOUT = {'know': (GREEN, GREEN_L, 'KNOW IT COLD'), 'handout': (BLUE, BLUE_L, 'FROM YOUR CLASS HANDOUTS'),
           'trap': (RED, RED_L, 'WATCH OUT'), 'tip': (GOLD, GOLD_L, 'TEST TIP'), 'model': (PURPLE, PURPLE_L, 'MODEL ANSWERS')}

PAGE_W, PAGE_H = letter
LM = RM = 0.7 * inch
TM = 0.7 * inch; BM = 0.75 * inch
W = PAGE_W - LM - RM

S = {}
S['body'] = ParagraphStyle('body', fontName='DV', fontSize=9.6, leading=13.2, textColor=INK, spaceAfter=5)
S['small'] = ParagraphStyle('small', parent=S['body'], fontSize=8.4, leading=11)
S['cell'] = ParagraphStyle('cell', parent=S['body'], fontSize=8.4, leading=10.6, spaceAfter=0)
S['cellh'] = ParagraphStyle('cellh', parent=S['cell'], fontName='DV-B', textColor=GREEN_D)
S['h1'] = ParagraphStyle('h1', fontName='DVH', fontSize=22, leading=27, textColor=GREEN_D, spaceAfter=8)
S['h2'] = ParagraphStyle('h2', keepWithNext=1, fontName='DVH', fontSize=17, leading=21, textColor=GREEN_D, spaceBefore=6, spaceAfter=8)
S['h3'] = ParagraphStyle('h3', keepWithNext=1, fontName='DVH', fontSize=12.2, leading=15.5, textColor=INK, spaceBefore=10, spaceAfter=5)
S['h4'] = ParagraphStyle('h4', keepWithNext=1, fontName='DVH', fontSize=10.5, leading=13.5, textColor=GREEN_D, spaceBefore=8, spaceAfter=3)
S['cap'] = ParagraphStyle('cap', parent=S['body'], fontName='DV-I', fontSize=8.3, leading=10.5, textColor=MUTED, alignment=TA_CENTER, spaceAfter=8)
S['label'] = ParagraphStyle('label', fontName='DV-B', fontSize=7.4, leading=9, spaceAfter=1)
S['li'] = ParagraphStyle('li', parent=S['body'], leftIndent=14, bulletIndent=3, spaceAfter=2.5)
S['qhead'] = ParagraphStyle('qhead', keepWithNext=1, fontName='DV-B', fontSize=9, leading=11, textColor=GREEN_D, spaceBefore=4, spaceAfter=2)
S['stem'] = ParagraphStyle('stem', parent=S['body'], fontSize=10, leading=13.6, spaceAfter=3)
S['choice'] = ParagraphStyle('choice', parent=S['body'], fontSize=9.6, leading=12.6, leftIndent=22, firstLineIndent=-16, spaceAfter=1.5)
S['ans'] = ParagraphStyle('ans', parent=S['body'], fontSize=9, leading=12, spaceAfter=2)
S['why'] = ParagraphStyle('why', parent=S['ans'], fontSize=8.5, leading=11.2, leftIndent=16, firstLineIndent=-12, textColor=colors.HexColor('#374151'), spaceAfter=1)
S['card'] = ParagraphStyle('card', parent=S['body'], fontSize=7.9, leading=10.2, spaceAfter=3)
S['center'] = ParagraphStyle('center', parent=S['body'], alignment=TA_CENTER)

EMOJI = re.compile('[\U0001F000-\U0001FAFF⏰-⏿️⭐]')


def clean(t):
    return EMOJI.sub('', t)


def inline(node, top=True):
    """Convert an HTML node's children to reportlab paragraph markup."""
    out = []
    for c in node.children:
        if isinstance(c, NavigableString):
            out.append(html.escape(clean(str(c)), quote=False))
            continue
        if not isinstance(c, Tag):
            continue
        n = c.name
        inner = inline(c, False)
        if n in ('strong', 'b'):
            out.append('<b>%s</b>' % inner)
        elif n in ('em', 'i'):
            out.append('<i>%s</i>' % inner)
        elif n == 'code':
            out.append('<font face="DVM" size="8.5">%s</font>' % inner)
        elif n == 'sub':
            out.append('<sub>%s</sub>' % inner)
        elif n == 'sup':
            out.append('<super>%s</super>' % inner)
        elif n == 'br':
            out.append('<br/>')
        elif n == 'a':
            href = c.get('href', '')
            if href.startswith('#') and 'xref' in (c.get('class') or []):
                out.append('<a href="%s" color="#2b6cb0"><u>%s</u></a>' % (href, inner))
            else:
                out.append(inner)
        elif n == 'p':
            out.append(inner + '<br/>')
        else:
            out.append(inner)
    s = ''.join(out)
    if top:
        s = re.sub(r'(<br/>)+$', '', s.strip())
    return s


def P(text, style='body'):
    return Paragraph(text, S[style] if isinstance(style, str) else style)


class Outline(Flowable):
    """Zero-size flowable that registers a bookmark + outline entry."""
    def __init__(self, title, key, level):
        super().__init__(); self.title, self.key, self.level = title, key, level
        self.width = self.height = 0
    def wrap(self, *a):
        return (0, 0)
    def draw(self):
        c = self.canv
        c.bookmarkPage(self.key)
        c.addOutlineEntry(clean(self.title), self.key, self.level, closed=self.level > 0)


def heading(text_markup, plain, sid, style, level):
    fl = []
    if sid:
        fl.append(Outline(plain, 'ol-' + sid, level))
        text_markup = '<a name="%s"/>%s' % (sid, text_markup)
    fl.append(P(text_markup, style))
    return fl


def col_widths(rows, avail, ncols, fs=8.4):
    need = [0.0] * ncols   # min width: longest word in bold
    lens = [0.0] * ncols   # desired: text length
    for r in rows:
        for i, c in enumerate(r[:ncols]):
            t = html.unescape(re.sub(r'<[^>]+>', '', c))
            words = t.split() or ['x']
            lw = max(pdfmetrics.stringWidth(w, 'DV-B', fs) for w in words)
            need[i] = max(need[i], lw + 10)
            lens[i] = max(lens[i], min(pdfmetrics.stringWidth(t, 'DV', fs), 230))
    w = need[:]
    rem = avail - sum(w)
    if rem > 0:
        extra = [max(l - n, 0) for l, n in zip(lens, need)]
        tot = sum(extra) or 1
        w = [n + rem * e / tot for n, e in zip(need, extra)]
    sc = avail / sum(w)
    return [x * sc for x in w]


def table_flow(tbl, avail, qt=False):
    rows = []
    heads = []
    for tr in tbl.find_all('tr'):
        cells = tr.find_all(['th', 'td'])
        rows.append([inline(c) for c in cells])
        heads.append(all(c.name == 'th' for c in cells))
    if not rows:
        return []
    ncols = max(len(r) for r in rows)
    for r in rows:
        r += [''] * (ncols - len(r))
    # drop an empty header row
    if heads and heads[0] and all(not re.sub(r'<[^>]+>', '', x).strip() for x in rows[0]):
        rows, heads = rows[1:], heads[1:]
    fs = 8.4 if ncols < 8 else 7.0
    cs = ParagraphStyle('c%d' % ncols, parent=S['cell'], fontSize=fs, leading=fs * 1.27)
    hs = ParagraphStyle('h%d' % ncols, parent=cs, fontName='DV-B', textColor=GREEN_D)
    if qt:
        cs = ParagraphStyle('qc', parent=cs, alignment=TA_CENTER); hs = ParagraphStyle('qh', parent=hs, alignment=TA_CENTER)
    data = [[Paragraph(c, hs if heads[i] else cs) for c in r] for i, r in enumerate(rows)]
    widths = col_widths(rows, avail if not qt else min(avail, ncols * 1.45 * inch), ncols, fs)
    t = Table(data, colWidths=widths, repeatRows=1 if heads and heads[0] else 0, hAlign='LEFT')
    st = [('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LINEBELOW', (0, 0), (-1, -1), 0.4, LINE),
          ('BOX', (0, 0), (-1, -1), 0.6, LINE), ('LEFTPADDING', (0, 0), (-1, -1), 4), ('RIGHTPADDING', (0, 0), (-1, -1), 4),
          ('TOPPADDING', (0, 0), (-1, -1), 2.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5), ('BACKGROUND', (0, 0), (-1, -1), colors.white)]
    if qt:
        st.append(('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#b8c2cc')))
    for i, h in enumerate(heads):
        if h:
            st.append(('BACKGROUND', (0, i), (-1, i), HEAD_BG))
    t.setStyle(TableStyle(st))
    return [t, Spacer(1, 6)]


def fig_flow(fid, cap, maxw=W, maxh=4.6 * inch):
    path = os.path.join(PNG, fid + '.png')
    from PIL import Image as PI
    iw, ih = PI.open(path).size
    w = maxw; h = w * ih / iw
    if h > maxh:
        h = maxh; w = h * iw / ih
    img = Image(path, width=w, height=h)
    img.hAlign = 'CENTER'
    parts = [Spacer(1, 4), img]
    if cap:
        parts.append(P(html.escape(clean(cap), quote=False), 'cap'))
    else:
        parts.append(Spacer(1, 6))
    return [KeepTogether(parts)]


def wrap_callout(flows, kind):
    edge, bg, label = CALLOUT.get(kind, (MUTED, colors.whitesmoke, ''))
    lab = ParagraphStyle('lab' + kind, parent=S['label'], textColor=edge)
    flows = [f for f in flows if not isinstance(f, Spacer)]
    if flows:
        flows[0] = [P(label, lab), flows[0]]
    else:
        flows = [P(label, lab)]
    out = []
    for i, f in enumerate(flows):
        t = Table([[f]], colWidths=[W])
        t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), bg), ('LINEBEFORE', (0, 0), (0, -1), 4, edge),
                               ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                               ('TOPPADDING', (0, 0), (-1, -1), 6 if i == 0 else 1.5),
                               ('BOTTOMPADDING', (0, 0), (-1, -1), 6 if i == len(flows) - 1 else 1.5)]))
        out.append(t)
    if len(out) >= 2:
        out = [KeepTogether(out[:2])] + out[2:]
    out.append(Spacer(1, 7))
    return out


def blocks(container, avail=W, level_map=None):
    """Convert block-level HTML children into flowables."""
    fl = []
    for c in container.children:
        if isinstance(c, NavigableString):
            if str(c).strip():
                fl.append(P(html.escape(clean(str(c)).strip(), quote=False)))
            continue
        if not isinstance(c, Tag):
            continue
        n = c.name
        cls = c.get('class') or []
        if n == 'h2':
            sid = c.get('id')
            txt = inline(c); plain = c.get_text()
            if sid and re.match(r'(t\d|traps|card)$', sid):
                fl.append(CondPageBreak(PAGE_H - TM - BM - 2))
                fl.append(SectionMark(plain))
            lvl = (level_map or {}).get(sid, 0)
            fl += heading(txt, plain, sid, 'h2', lvl)
        elif n == 'h3':
            sid = c.get('id')
            fl.append(CondPageBreak(1.3 * inch))
            fl += heading(inline(c), c.get_text(), sid, 'h3', 1 if sid else 0)
        elif n == 'h4':
            fl.append(P(inline(c), 'h4'))
        elif n == 'p':
            if 'practice-cta' in cls:
                fl.append(P('<i>' + inline(c) + '</i>', 'small'))
            else:
                t = inline(c)
                if t:
                    fl.append(P(t))
        elif n in ('ul', 'ol'):
            for k, li in enumerate(c.find_all('li', recursive=False)):
                bullet = '•' if n == 'ul' else '%d.' % (k + 1)
                fl.append(Paragraph(inline(li), S['li'], bulletText=bullet))
            fl.append(Spacer(1, 3))
        elif n == 'div' and 'tablewrap' in cls:
            fl += table_flow(c.find('table'), avail)
        elif n == 'table':
            fl += table_flow(c, avail)
        elif n == 'div' and 'callout' in cls:
            kind = [k for k in cls if k in CALLOUT]
            inner = blocks(c, avail - 20)
            fl += wrap_callout(inner, kind[0] if kind else '')
        elif n == 'figure':
            fl += fig_flow(c.get('data-fig'), c.get_text().strip())
        elif n == 'div' and 'idx-card' in cls:
            title = c.find(class_='idx-title')
            items = [P('<b>%s</b>' % inline(title), ParagraphStyle('ct', parent=S['card'], textColor=RED, fontName='DV-B'))]
            for p in c.find_all('p'):
                items.append(P(inline(p), 'card'))
            t = Table([[items]], colWidths=[W])
            t.setStyle(TableStyle([('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#b9b4a0')), ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fffef5')),
                                   ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10), ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8)]))
            fl += [t, Spacer(1, 12)]
        elif n == 'hr':
            fl.append(Spacer(1, 6))
        elif n == 'div':
            fl += blocks(c, avail)
        else:
            t = inline(c)
            if t:
                fl.append(P(t))
    return fl


def soup_of(md_name, secs):
    h = build.render_md(build.read(md_name), secs, set(), {}, mode='pdf')
    return BeautifulSoup(h, 'html.parser')


# ---------------- question rendering ----------------
LET = 'ABCD'


def stem_flows(stem_html, style='stem'):
    sp = BeautifulSoup('<div>' + stem_html + '</div>', 'html.parser').div
    fl, buf = [], []
    def flush():
        if buf:
            t = ''.join(buf).strip()
            t = re.sub(r'^(<br/>)+|(<br/>)+$', '', t)
            if t:
                fl.append(P(t, style))
            buf.clear()
    for c in sp.children:
        if isinstance(c, Tag) and c.name == 'table':
            flush(); fl += table_flow(c, W, qt=True)
        else:
            tmp = BeautifulSoup('<span></span>', 'html.parser').span
            tmp.append(c.__copy__() if isinstance(c, Tag) else NavigableString(str(c)))
            buf.append(inline(tmp, False))
    flush()
    return fl


def q_inline(s):
    return inline(BeautifulSoup('<span>' + s + '</span>', 'html.parser').span, True)


def question_block(q, num_label):
    head = '<a name="q-%s"/>%s  <font color="#6b7280" size="7.8">· Topic %d · %s · %s</font>' % (
        q['id'], num_label, q['topic'], q['level'], html.escape(q.get('subtopic') or ''))
    parts = [P(head, 'qhead')]
    if q['figure']:
        parts += fig_flow(q['figure'], '', maxw=W * 0.74, maxh=3.0 * inch)
    parts += stem_flows(q['stem'])
    for i, ch in enumerate(q['choices']):
        parts.append(P('<b>%s.</b>  %s' % (LET[i], q_inline(ch)), 'choice'))
    parts.append(Spacer(1, 9))
    return KeepTogether(parts)


def answer_block(q, secs):
    a = q['answer']
    head = '<b>%s</b>  <font color="#2f855a"><b>Answer: %s</b></font>  <font color="#6b7280" size="7.8">· Topic %d · %s</font>' % (
        q['id'], LET[a], q['topic'], html.escape(q.get('subtopic') or ''))
    parts = [P(head, ParagraphStyle('ah', parent=S['ans'], spaceBefore=5))]
    parts.append(P(q_inline(q['explanation']), 'ans'))
    for i, w in enumerate(q['why_wrong']):
        if i != a and w:
            parts.append(P('<b>%s</b>  %s' % (LET[i], q_inline(w)), 'why'))
    extra = []
    if q.get('trap'):
        extra.append('<font color="#c53030"><b>Trap:</b> %s</font>' % html.escape(q['trap']))
    extra.append('<b>Review:</b> <a href="#%s" color="#2b6cb0"><u>%s</u></a>' % (q['review'], html.escape(secs[q['review']]['title'])))
    parts.append(P(' &nbsp;·&nbsp; '.join(extra), ParagraphStyle('ex', parent=S['why'], leftIndent=0, firstLineIndent=0, spaceAfter=4)))
    t = Table([[parts]], colWidths=[W])
    t.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, -1), 0.5, LINE), ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                           ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 4)]))
    return t


# ---------------- document ----------------
class Doc(BaseDocTemplate):
    def __init__(self, fn, **kw):
        super().__init__(fn, pagesize=letter, leftMargin=LM, rightMargin=RM, topMargin=TM, bottomMargin=BM,
                         title='Ecosystems Unit — Study Guide & Practice (Print)', author='Study guide for Ms. Hero\'s ECOSYSTEMS unit',
                         subject='High school ecology test prep', **kw)
        fr = Frame(LM, BM, W, PAGE_H - TM - BM, id='f', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates([PageTemplate(id='p', frames=[fr], onPage=self.deco)])
        self.section = ''

    def deco(self, canv, doc):
        canv.saveState()
        if doc.page > 1:
            canv.setFont('DV', 7.6); canv.setFillColor(MUTED)
            canv.drawString(LM, PAGE_H - 0.45 * inch, 'Ecosystems Unit — Study Guide & Practice')
            canv.drawRightString(PAGE_W - RM, PAGE_H - 0.45 * inch, self.section)
            canv.setStrokeColor(LINE); canv.setLineWidth(0.5)
            canv.line(LM, PAGE_H - 0.5 * inch, PAGE_W - RM, PAGE_H - 0.5 * inch)
            canv.drawCentredString(PAGE_W / 2, 0.42 * inch, '— %d —' % doc.page)
        canv.restoreState()

    def afterFlowable(self, f):
        if isinstance(f, SectionMark):
            self.section = f.name


class SectionMark(Flowable):
    def __init__(self, name):
        super().__init__(); self.name = name
    def wrap(self, *a):
        return (0, 0)
    def draw(self):
        pass


def cover(secs, qs):
    fl = [Spacer(1, 0.9 * inch)]
    fl.append(P('ECOSYSTEMS UNIT', ParagraphStyle('k', fontName='DVH', fontSize=12, textColor=GREEN, leading=15)))
    fl.append(P('Study Guide &amp; Practice Questions', ParagraphStyle('t', fontName='DVH', fontSize=30, leading=36, textColor=GREEN_D, spaceAfter=10)))
    fl.append(P("Ms. Hero's assessment: 25 multiple-choice questions · 30 minutes · one handwritten 3\" × 5\" index card allowed",
                ParagraphStyle('s', parent=S['body'], fontSize=11.5, leading=15, textColor=MUTED, spaceAfter=18)))
    fl += fig_flow('earth-spheres', '', maxw=W * 0.8, maxh=3.6 * inch)
    rows = [['What\'s inside', 'Page section'],
            ['Start here — test format, 5-day plan, topic map, gaps from your handouts', 'Start Here'],
            ['Study guide — 9 topics with diagrams, tables, handout callouts, traps, model answers', 'Topics 1–9'],
            ['Common traps (30 confused pairs) · Index-card model', 'Review tools'],
            ['%d practice questions: %d topic drills + a 25-question mock test' % (len(qs), len([q for q in qs if not q['id'].startswith('M-')])), 'Practice'],
            ['Hints (peek only if stuck) · Answer key with full explanations', 'Answers'],
            ['Weakness tracker — map every missed question to the section to re-read', 'Tracker']]
    t = Table([[P('<b>%s</b>' % r[0] if i == 0 else r[0], 'cell'), P('<b>%s</b>' % r[1] if i == 0 else r[1], 'cell')] for i, r in enumerate(rows)],
              colWidths=[W * 0.74, W * 0.26])
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), HEAD_BG), ('LINEBELOW', (0, 0), (-1, -1), 0.4, LINE), ('BOX', (0, 0), (-1, -1), 0.6, LINE),
                           ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4)]))
    fl += [Spacer(1, 10), t, Spacer(1, 14)]
    fl.append(P('The interactive version (<b>Ecosystems_Study_Guide.html</b>) has the same content plus instant feedback, hints, retries, '
                'and a results tracker. Question IDs (e.g., T4-03, M-12) and answer letters are identical in both versions. '
                'Graphs labeled "practice data — illustrative" are not real records.', 'small'))
    fl.append(PageBreak())
    return fl


def main():
    secs = build.collect_sections()
    qs = build.load_questions()
    drills = [q for q in qs if not q['id'].startswith('M-')]
    mock = [q for q in qs if q['id'].startswith('M-')]
    story = cover(secs, qs)

    # ---- Start here
    story += [SectionMark('Start here'), Outline('Start here', 'ol-start', 0), P('<a name="start"/>Start Here', 'h1')]
    home = soup_of('home.md', secs)
    lm = {k: 1 for k in secs if k.startswith('home-')}
    for h2 in home.find_all('h2'):
        h2.name = 'h3'
    # print-specific "how to use" tweak
    story += blocks(home, level_map=lm)

    # ---- Study guide
    for f in build.STUDY_FILES:
        sp = soup_of(f, secs)
        story += blocks(sp)
    # ---- traps + card
    story += blocks(soup_of('traps.md', secs))
    story += blocks(soup_of('indexcard.md', secs))

    # ---- practice booklet
    story.append(PageBreak()); story.append(SectionMark('Practice questions'))
    story += [Outline('Practice Questions', 'ol-practice', 0), P('<a name="practice"/>Practice Questions', 'h1')]
    story.append(P('Answer on a separate sheet (or circle the letter). <b>Part A</b> drills are grouped by topic and run easy → hard. '
                   '<b>Part B</b> is a full 25-question mock test — time yourself for 30 minutes and don\'t peek at hints. '
                   'Stuck on a drill? The <a href="#hints" color="#2b6cb0"><u>Hints</u></a> section nudges you without giving the answer away. '
                   'Then check the <a href="#answers" color="#2b6cb0"><u>Answer Key</u></a> and record misses in the '
                   '<a href="#tracker" color="#2b6cb0"><u>Weakness Tracker</u></a>.'))
    story.append(P('Part A — Topic Drills (%d questions)' % len(drills), 'h2'))
    cur = None
    for q in drills:
        if q['topic'] != cur:
            cur = q['topic']
            story.append(CondPageBreak(2.2 * inch))
            story.append(Outline('Topic %d drills — %s' % (cur, build.TOPICS[cur]['name']), 'ol-dr%d' % cur, 1))
            story.append(P('Topic %d · %s' % (cur, build.TOPICS[cur]['name']), 'h3'))
        story.append(question_block(q, q['id']))
    story.append(PageBreak())
    story.append(Outline('Part B — Mock Test', 'ol-mock', 1))
    story.append(P('<a name="mock"/>Part B — Mock Test (25 questions · 30 minutes)', 'h2'))
    story.append(P('Set a timer for 30 minutes. Answer every question — there is no penalty for guessing. You may use your index card. '
                   'Score yourself with the answer key: 23–25 excellent · 18–22 solid · below 18, focus on your weakest topics in the tracker.'))
    for k, q in enumerate(mock):
        story.append(question_block(q, '%d.  (%s)' % (k + 1, q['id'])))

    # ---- hints
    story.append(PageBreak()); story.append(SectionMark('Hints'))
    story += [Outline('Hints', 'ol-hints', 0), P('<a name="hints"/>Hints — peek only if you\'re stuck', 'h1')]
    story.append(P('Each hint nudges your thinking without revealing the answer. On the real test there are no hints, so try first!', 'small'))
    hrows = [[P('<b>%s</b>' % q['id'], 'cell'), P(q_inline(q['hint']), 'cell')] for q in qs]
    ht = Table([[P('<b>ID</b>', 'cellh'), P('<b>Hint</b>', 'cellh')]] + hrows, colWidths=[0.7 * inch, W - 0.7 * inch], repeatRows=1)
    ht.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), HEAD_BG), ('LINEBELOW', (0, 0), (-1, -1), 0.35, LINE), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                            ('TOPPADDING', (0, 0), (-1, -1), 2), ('BOTTOMPADDING', (0, 0), (-1, -1), 2)]))
    story.append(ht)

    # ---- answer key
    story.append(PageBreak()); story.append(SectionMark('Answer key'))
    story += [Outline('Answer Key & Explanations', 'ol-answers', 0), P('<a name="answers"/>Answer Key &amp; Explanations', 'h1')]
    story.append(P('Quick key', 'h3'))
    cells = [(q['id'], LET[q['answer']]) for q in qs]
    per = 8
    grid = []
    for i in range(0, len(cells), per):
        row = []
        for idc, a in cells[i:i + per]:
            row += [P('<font size="7.6">%s</font>' % idc, 'cell'), P('<b>%s</b>' % a, 'cell')]
        row += [''] * (2 * per - len(row))
        grid.append(row)
    gw = W / per
    gt = Table(grid, colWidths=[gw * 0.66, gw * 0.34] * per)
    gt.setStyle(TableStyle([('GRID', (0, 0), (-1, -1), 0.3, LINE), ('BACKGROUND', (0, 0), (-1, -1), colors.white),
                            ('TOPPADDING', (0, 0), (-1, -1), 2), ('BOTTOMPADDING', (0, 0), (-1, -1), 2), ('LEFTPADDING', (0, 0), (-1, -1), 3)]
                           + [('BACKGROUND', (2 * j + 1, 0), (2 * j + 1, -1), GREEN_L) for j in range(per)]))
    story += [gt, Spacer(1, 10)]
    story.append(P('Full explanations — Part A drills', 'h3'))
    for q in drills:
        story.append(answer_block(q, secs))
    story.append(CondPageBreak(2 * inch))
    story.append(P('Full explanations — Part B mock test', 'h3'))
    for k, q in enumerate(mock):
        story.append(answer_block(q, secs))

    # ---- weakness tracker
    story.append(PageBreak()); story.append(SectionMark('Weakness tracker'))
    story += [Outline('Weakness Tracker', 'ol-tracker', 0), P('<a name="tracker"/>Weakness Tracker', 'h1')]
    story.append(P('<b>Step 1.</b> After checking your answers, circle every question ID you missed below. '
                   '<b>Step 2.</b> Count your misses per topic. <b>Step 3.</b> If you missed <b>2 or more</b> drills in a topic, or <b>any</b> mock question in it, '
                   're-read the sections listed for the questions you missed (page 2 of this tracker), re-read the class handouts, and redo those questions.'))
    rows = [[P('<b>Topic</b>', 'cellh'), P('<b>Drill question IDs</b> (circle misses)', 'cellh'), P('<b>Missed</b>', 'cellh'),
             P('<b>Mock IDs</b>', 'cellh'), P('<b>Missed</b>', 'cellh'), P('<b>Class handouts to re-read</b>', 'cellh')]]
    for n in range(1, 10):
        d = [q['id'] for q in drills if q['topic'] == n]
        m = ['%s' % q['id'] for q in mock if q['topic'] == n]
        rows.append([P('<b>%d.</b> %s' % (n, build.TOPICS[n]['name']), 'cell'), P('  '.join(d), 'cell'), P('___ / %d' % len(d), 'cell'),
                     P('  '.join(m), 'cell'), P('___ / %d' % len(m), 'cell'), P(html.escape(build.TOPICS[n]['handouts']), 'cell')])
    tt = Table(rows, colWidths=[1.25 * inch, 2.05 * inch, 0.6 * inch, 0.95 * inch, 0.55 * inch, W - 5.4 * inch], repeatRows=1)
    tt.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), HEAD_BG), ('GRID', (0, 0), (-1, -1), 0.35, LINE), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                            ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4)]))
    story += [tt, Spacer(1, 10)]
    story.append(P('Status guide', 'h3'))
    story.append(P('<b>Mastered</b> — 80%+ right on the first try · <b>Getting there</b> — 60–79% · <b>Needs review</b> — under 60%. '
                   'Work on "Needs review" topics first; they are the fastest points to gain.'))
    story.append(CondPageBreak(3 * inch))
    story.append(P('Every question → the exact section to re-read', 'h3'))
    rows = [[P('<b>✗?</b>', 'cellh'), P('<b>ID</b>', 'cellh'), P('<b>What it tests</b>', 'cellh'), P('<b>Re-read this section</b>', 'cellh'), P('<b>Trap</b>', 'cellh')]]
    for q in qs:
        rows.append([P('☐', 'cell'), P('<b>%s</b>' % q['id'], 'cell'), P(html.escape(q.get('subtopic') or ''), 'cell'),
                     P('<a href="#%s" color="#2b6cb0">%s</a>' % (q['review'], html.escape(secs[q['review']]['title'])), 'cell'),
                     P(html.escape(q.get('trap') or ''), ParagraphStyle('tr', parent=S['cell'], fontSize=7.4, leading=9.2, textColor=colors.HexColor('#9b2c2c')))])
    xt = Table(rows, colWidths=[0.32 * inch, 0.55 * inch, 2.1 * inch, 1.9 * inch, W - 4.87 * inch], repeatRows=1)
    xt.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), HEAD_BG), ('LINEBELOW', (0, 0), (-1, -1), 0.3, LINE), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                            ('TOPPADDING', (0, 0), (-1, -1), 2), ('BOTTOMPADDING', (0, 0), (-1, -1), 2)]))
    story.append(xt)

    doc = Doc(OUT)
    doc.build(story)
    print('wrote', OUT)


if __name__ == '__main__':
    main()
