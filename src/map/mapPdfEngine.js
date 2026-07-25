import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Roboto fonts ar latviešu burtu atbalstu ───────────────────────────────────
let _fontCache = {}
let _logoDataUrl = undefined

async function ladeLogo() {
  if (_logoDataUrl !== undefined) return _logoDataUrl
  try {
    const r = await fetch('/pwa-192x192.png')
    if (!r.ok) { _logoDataUrl = null; return null }
    const buf = await r.arrayBuffer()
    const bytes = new Uint8Array(buf)
    let binary = ''
    const CHUNK = 0x8000
    for (let i = 0; i < bytes.length; i += CHUNK)
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK))
    _logoDataUrl = 'data:image/png;base64,' + btoa(binary)
  } catch { _logoDataUrl = null }
  return _logoDataUrl
}

async function ladeFontu(doc) {
  const toBase64 = async (url) => {
    if (_fontCache[url]) return _fontCache[url]
    const buf = await fetch(url).then(r => r.arrayBuffer())
    const bytes = new Uint8Array(buf)
    let binary = ''
    const CHUNK = 0x8000
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK))
    }
    _fontCache[url] = btoa(binary)
    return _fontCache[url]
  }
  const reg  = await toBase64('/fonts/Roboto-Regular.ttf')
  doc.addFileToVFS('Roboto-Regular.ttf', reg)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')

  const bold = await toBase64('/fonts/Roboto-Bold.ttf')
  doc.addFileToVFS('Roboto-Bold.ttf', bold)
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')

  doc.setFont('Roboto', 'normal')
}

// ── Dizaina konstantes ────────────────────────────────────────────────────────

const GRN  = [27, 74, 27]       // tumši zaļš — galvenes fons
const GRN2 = [46, 125, 50]      // vidēji zaļš — apakšgalvenes
const GRN3 = [200, 230, 200]    // gaišs zaļš — alternatīvās rindas
const GRN4 = [240, 248, 240]    // ļoti gaišs — subtabulu fons
const WHT  = [255, 255, 255]
const BLK  = [30, 30, 30]
const DIM  = [100, 100, 100]
const A4W  = 210
const A4H  = 297
const MAR  = 14                  // kreisā/labā mala mm

// ── Kopfuss un galvene ────────────────────────────────────────────────────────

function zimetGalveni(doc, titullapa, kadastrs) {
  doc.setFillColor(...GRN)
  doc.rect(0, 0, A4W, 12, 'F')
  if (_logoDataUrl) {
    try { doc.addImage(_logoDataUrl, 'PNG', MAR, 1, 10, 10) } catch {}
  }
  doc.setFont('Roboto', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...WHT)
  doc.text('MEŽA TIRGUS  ·  meža-tirgus.lv', _logoDataUrl ? MAR + 12 : MAR, 8)
  const kad = `Kadastrs: ${kadastrs}  ·  ${titullapa?.nosaukums || ''}  ·  ${titullapa?.novads || ''}`
  doc.text(kad, A4W - MAR, 8, { align: 'right' })
}

function zimetKopfusu(doc, lapasNr, lapasKopā) {
  doc.setDrawColor(200, 220, 200)
  doc.setLineWidth(0.3)
  doc.line(MAR, A4H - 10, A4W - MAR, A4H - 10)
  doc.setFont('Roboto', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...DIM)
  doc.text('Sagatavots ar Meža tirgus platformu  ·  meža-tirgus.lv', MAR, A4H - 6)
  doc.text(`${lapasNr} / ${lapasKopā}`, A4W - MAR, A4H - 6, { align: 'right' })
}

// ── Lapa 1: Titullapa ────────────────────────────────────────────────────────

function lapaTitullapa(doc, titullapa, kadastrs, nogabali, gads) {
  const W = A4W

  // Galvenais virsraksts
  doc.setFillColor(...GRN)
  doc.rect(0, 14, W, 36, 'F')

  doc.setFont('Roboto', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...WHT)
  doc.text('MEŽA INVENTARIZĀCIJAS APRAKSTS', W / 2, 29, { align: 'center' })

  doc.setFontSize(12)
  doc.setFont('Roboto', 'normal')
  doc.text(`no ${gads}. līdz ${gads + 20}. gadam`, W / 2, 39, { align: 'center' })
  doc.text('Meža apsaimniekošanas plāns', W / 2, 46, { align: 'center' })

  // Logo augšā labajā stūrī
  if (_logoDataUrl) {
    try { doc.addImage(_logoDataUrl, 'PNG', W - 44, 15, 20, 20) } catch {
      doc.setFillColor(...GRN2)
      doc.roundedRect(W - 52, 15, 38, 10, 2, 2, 'F')
      doc.setFont('Roboto', 'bold'); doc.setFontSize(10); doc.setTextColor(...WHT)
      doc.text('MEŽA TIRGUS', W - 33, 21.5, { align: 'center' })
    }
  } else {
    doc.setFillColor(...GRN2)
    doc.roundedRect(W - 52, 15, 38, 10, 2, 2, 'F')
    doc.setFont('Roboto', 'bold'); doc.setFontSize(10); doc.setTextColor(...WHT)
    doc.text('MEŽA TIRGUS', W - 33, 21.5, { align: 'center' })
  }

  // Pamatinformācija — tabulas veidā
  let y = 60
  const infoRindas = [
    ['Zemes īpašnieks',         titullapa?.ipasnieks || '—'],
    ['Novads',                  titullapa?.novads    || '—'],
    ['Pagasts',                 titullapa?.pagasts   || '—'],
    ['Īpašuma nosaukums',       titullapa?.nosaukums || '—'],
    ['Kadastra nr.',            kadastrs || '—'],
    ['Uzraugāmā mežniecība',   titullapa?.mezniecia || '—'],
    ['Inventarizācijas periods', `${gads}. – ${gads + 20}. gads`],
    ['Datums',                  new Date().toLocaleDateString('lv-LV')],
  ]

  doc.setFillColor(...GRN4)
  doc.rect(MAR, y - 4, W - 2 * MAR, infoRindas.length * 9 + 4, 'F')
  doc.setDrawColor(...GRN3)
  doc.setLineWidth(0.3)
  doc.rect(MAR, y - 4, W - 2 * MAR, infoRindas.length * 9 + 4)

  infoRindas.forEach(([lauks, val], i) => {
    const ry = y + i * 9
    if (i % 2 === 1) {
      doc.setFillColor(220, 240, 220)
      doc.rect(MAR, ry - 4, W - 2 * MAR, 9, 'F')
    }
    doc.setFont('Roboto', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...DIM)
    doc.text(lauks, MAR + 3, ry + 1.5)
    doc.setFont('Roboto', 'normal')
    doc.setTextColor(...BLK)
    doc.text(String(val), MAR + 70, ry + 1.5)
  })

  y += infoRindas.length * 9 + 10

  // Platību kopsavilkums
  const kopplatiba   = nogabali.reduce((s, n) => s + (n.platiba || 0), 0)
  const mezaZemePl   = nogabali.filter(n => !['Ce','Gr','KvSt','Kr'].includes(n.kategorija)).reduce((s, n) => s + (n.platiba || 0), 0)
  const mezaPl       = nogabali.filter(n => ['MA','IzA'].includes(n.kategorija)).reduce((s, n) => s + (n.platiba || 0), 0)

  doc.setFont('Roboto', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...GRN)
  doc.text('Zemes vienības platību sadalījums', MAR, y)
  y += 4

  autoTable(doc, {
    startY: y,
    margin: { left: MAR, right: MAR },
    head: [['Kadastra apzīmējums', 'Ģeom. platība (ha)', 'Meža zemes platība (ha)', 'Meža platība (ha)']],
    body: [[
      kadastrs,
      kopplatiba.toFixed(2),
      mezaZemePl.toFixed(2),
      mezaPl.toFixed(2),
    ]],
    styles: { fontSize: 9, font: 'Roboto', cellPadding: 3 },
    headStyles: { fillColor: GRN, textColor: WHT, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: GRN4 },
    theme: 'grid',
  })

  y = doc.lastAutoTable.finalY + 10

  // Kopplatības karte
  const platKartes = [
    { label: 'Kopplatība',         val: kopplatiba.toFixed(2), krasa: GRN  },
    { label: 'Meža zemes platība', val: mezaZemePl.toFixed(2), krasa: GRN2 },
    { label: 'Meža platība',       val: mezaPl.toFixed(2),     krasa: [56,142,60] },
    { label: 'Nogabalu skaits',    val: String(nogabali.length), krasa: [100,130,100] },
  ]

  platKartes.forEach((k, i) => {
    const x = MAR + i * ((W - 2 * MAR + 4) / 4)
    const cw = (W - 2 * MAR) / 4 - 4
    doc.setFillColor(...k.krasa)
    doc.roundedRect(x, y, cw, 18, 2, 2, 'F')
    doc.setTextColor(...WHT)
    doc.setFont('Roboto', 'bold')
    doc.setFontSize(14)
    doc.text(k.val, x + cw / 2, y + 10, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('Roboto', 'normal')
    doc.text(k.label, x + cw / 2, y + 16, { align: 'center' })
  })
}

// ── Lapa 2: Kopsavilkuma tabulas ─────────────────────────────────────────────

function lapaKopsavilkums(doc, nogabali, titullapa, kadastrs) {
  zimetGalveni(doc, titullapa, kadastrs)

  const tblOpts = (startY) => ({
    startY,
    margin: { left: MAR, right: MAR },
    styles: { fontSize: 8, font: 'Roboto', cellPadding: { top: 2, right: 4, bottom: 2, left: 4 } },
    headStyles: { fillColor: GRN, textColor: WHT, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: GRN4 },
    footStyles: { fillColor: GRN3, fontStyle: 'bold', textColor: BLK },
    theme: 'grid',
  })

  const tblVirsraksts = (doc, teksts, y) => {
    doc.setFont('Roboto', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...GRN)
    doc.text(teksts, MAR, y)
    return y + 3
  }

  let y = 16

  // ─── 1. tabula: Kategoriju sadalījums ────────────────────────────────────────
  const KAT_NOS = {
    MA:'Mežaudze', IzA:'Iznīkusi audze', Izc:'Izcirtums',
    ML:'Meža lauce', DBL:'Dzīvn. bar. lauce', Vir:'Virsājs',
    Sm:'Smiltājs', BA:'Bebru applud.', PK:'Pārpl. klajums', Pu:'Purvs',
    Ce:'Ceļš', Gr:'Grāvis', KvSt:'Kvartālstiga', Kr:'Krautuve',
  }
  const katGrupa = {}
  nogabali.forEach(n => {
    katGrupa[n.kategorija] = (katGrupa[n.kategorija] || 0) + (n.platiba || 0)
  })
  const kopPl = Object.values(katGrupa).reduce((s, v) => s + v, 0)
  const kat1Body = Object.entries(katGrupa)
    .sort((a, b) => b[1] - a[1])
    .map(([k, pl]) => [KAT_NOS[k] || k, k, pl.toFixed(2), `${((pl / kopPl) * 100).toFixed(1)}%`])

  y = tblVirsraksts(doc, '1. Meža zemes sadalījums pēc kategorijām', y)
  autoTable(doc, {
    ...tblOpts(y),
    head: [['Kategorija', 'Kods', 'Platība (ha)', '%']],
    body: kat1Body,
    foot: [['KOPĀ', '', kopPl.toFixed(2), '100.0%']],
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
  })
  y = doc.lastAutoTable.finalY + 8

  // ─── 2. tabula: Apsaimniekošanas kritēriji ───────────────────────────────────
  const pasApskata = {
    'Kailcirte / Galvenā cirte': 0,
    'Kopšanas cirte':           0,
    'Sanitārā cirte':           0,
    'Meža atjaunošana':         0,
    'Jaunaudze — kopšana':      0,
    'Nav pasākuma':             0,
  }
  nogabali.forEach(n => {
    if (!n.lēmums || n.lēmums === '—') { pasApskata['Nav pasākuma'] += n.platiba || 0; return }
    const l = n.lēmums.toLowerCase()
    if (l.includes('kailcirte') || l.includes('galvenā cirte')) pasApskata['Kailcirte / Galvenā cirte'] += n.platiba || 0
    else if (l.includes('kopšanas cirte')) pasApskata['Kopšanas cirte'] += n.platiba || 0
    else if (l.includes('sanitārā')) pasApskata['Sanitārā cirte'] += n.platiba || 0
    else if (l.includes('atjaunošana')) pasApskata['Meža atjaunošana'] += n.platiba || 0
    else if (l.includes('jaunaudze')) pasApskata['Jaunaudze — kopšana'] += n.platiba || 0
    else pasApskata['Nav pasākuma'] += n.platiba || 0
  })
  const aps2Body = Object.entries(pasApskata)
    .filter(([, v]) => v > 0)
    .map(([k, pl]) => [k, pl.toFixed(2), `${((pl / kopPl) * 100).toFixed(1)}%`])
  const apsKopa = Object.values(pasApskata).reduce((s, v) => s + v, 0)

  y = tblVirsraksts(doc, '2. Mežaudžu sadalījums pēc plānotajiem pasākumiem', y)
  autoTable(doc, {
    ...tblOpts(y),
    head: [['Plānotais pasākums', 'Platība (ha)', '%']],
    body: aps2Body,
    foot: [['KOPĀ', apsKopa.toFixed(2), '100.0%']],
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
  })
  y = doc.lastAutoTable.finalY + 8

  // Pārējās tabulas liek nākamajā lapā ja nepietiek vietas
  const SUGAS_SECIBA = ['Priede','Egle','Bērzs','Apse','Melnalksnis','Baltalksnis','Ozols','Osis','Liepa','Cita']
  const BON_SECIBA   = ['Ia', 'I', 'II', 'III', 'IV', 'V']
  const VEC_GRUPAS   = ['Jaunaudze', 'Vid. vecuma', 'Briestaudze', 'Pieaugusi', 'Pāraugusi']

  const maMezaudzes = nogabali.filter(n => n.kategorija === 'MA' && n.vecums > 0)

  // ─── 3. tabula: Suga × Bonitāte ──────────────────────────────────────────────
  const sugaBon = {}
  maMezaudzes.forEach(n => {
    const s = n.sugaNos || 'Cita'
    if (!sugaBon[s]) sugaBon[s] = {}
    sugaBon[s][n.bonitate] = ((sugaBon[s][n.bonitate] || 0) + n.platiba)
  })

  const sb3Head = [['Suga', ...BON_SECIBA, 'Kopā (ha)']]
  const sb3Body = []
  const bonKopa = {}
  SUGAS_SECIBA.forEach(suga => {
    if (!sugaBon[suga]) return
    const rinda = [suga]
    let kopa = 0
    BON_SECIBA.forEach(b => {
      const v = sugaBon[suga][b] || 0
      rinda.push(v > 0 ? v.toFixed(2) : '—')
      kopa += v
      bonKopa[b] = (bonKopa[b] || 0) + v
    })
    rinda.push(kopa.toFixed(2))
    sb3Body.push(rinda)
  })
  const sb3Kopa = ['KOPĀ', ...BON_SECIBA.map(b => bonKopa[b] ? bonKopa[b].toFixed(2) : '—'), maMezaudzes.reduce((s,n)=>s+n.platiba,0).toFixed(2)]

  if (y + 40 > A4H - 20) { doc.addPage(); zimetGalveni(doc, titullapa, kadastrs); y = 16 }
  y = tblVirsraksts(doc, '3. Mežaudžu sadalījums pēc valdošajām sugām un bonitātēm (ha)', y)
  autoTable(doc, {
    ...tblOpts(y),
    head: sb3Head,
    body: sb3Body,
    foot: [sb3Kopa],
    columnStyles: Object.fromEntries([...BON_SECIBA.map((_, i) => [i + 1, { halign: 'right' }]), [BON_SECIBA.length + 1, { halign: 'right', fontStyle: 'bold' }]]),
  })
  y = doc.lastAutoTable.finalY + 8

  // ─── 4. tabula: Suga × Vecuma grupa ──────────────────────────────────────────
  function vecumaGrupa(suga, vec) {
    const softwood = ['Priede', 'Egle', 'Ozols', 'Osis']
    const lim = softwood.includes(suga) ? [20, 40, 60, 80] : [10, 20, 40, 60]
    if (vec <= lim[0]) return 'Jaunaudze'
    if (vec <= lim[1]) return 'Vid. vecuma'
    if (vec <= lim[2]) return 'Briestaudze'
    if (vec <= lim[3]) return 'Pieaugusi'
    return 'Pāraugusi'
  }

  const sugaVec = {}
  const vecKopa = {}
  maMezaudzes.forEach(n => {
    const s = n.sugaNos || 'Cita'
    const vg = vecumaGrupa(s, n.vecums)
    if (!sugaVec[s]) sugaVec[s] = {}
    sugaVec[s][vg] = ((sugaVec[s][vg] || 0) + n.platiba)
    vecKopa[vg] = ((vecKopa[vg] || 0) + n.platiba)
  })

  const sv4Head = [['Suga', ...VEC_GRUPAS, 'Kopā (ha)']]
  const sv4Body = []
  SUGAS_SECIBA.forEach(suga => {
    if (!sugaVec[suga]) return
    const rinda = [suga]
    let kopa = 0
    VEC_GRUPAS.forEach(vg => {
      const v = sugaVec[suga][vg] || 0
      rinda.push(v > 0 ? v.toFixed(2) : '—')
      kopa += v
    })
    rinda.push(kopa.toFixed(2))
    sv4Body.push(rinda)
  })
  const sv4Kopa = ['KOPĀ', ...VEC_GRUPAS.map(vg => vecKopa[vg] ? vecKopa[vg].toFixed(2) : '—'), maMezaudzes.reduce((s,n)=>s+n.platiba,0).toFixed(2)]

  if (y + 40 > A4H - 20) { doc.addPage(); zimetGalveni(doc, titullapa, kadastrs); y = 16 }
  y = tblVirsraksts(doc, '4. Mežaudžu sadalījums pēc valdošajām sugām un vecuma grupām (ha)', y)
  autoTable(doc, {
    ...tblOpts(y),
    head: sv4Head,
    body: sv4Body,
    foot: [sv4Kopa],
    columnStyles: Object.fromEntries([...VEC_GRUPAS.map((_, i) => [i + 1, { halign: 'right' }]), [VEC_GRUPAS.length + 1, { halign: 'right', fontStyle: 'bold' }]]),
  })
  y = doc.lastAutoTable.finalY + 8

  // ─── 5. tabula: Suga × Augšanas apstākļu tipa grupa ──────────────────────────
  const TIPU_GRUPAS = {
    Vr:'Sausieņi', Dm:'Sausieņi', Gs:'Sausieņi', Vc:'Sausieņi',
    Sl:'Slapjaiņi', Lk:'Slapjaiņi', Ln:'Slapjaiņi',
    Kg:'Purvaiņi',
  }
  const TIPU_GRUPU_SEC = ['Sausieņi', 'Slapjaiņi', 'Purvaiņi', 'Nav norādīts']

  const sugaTips = {}
  const tipsKopa = {}
  maMezaudzes.forEach(n => {
    const s = n.sugaNos || 'Cita'
    const tg = TIPU_GRUPAS[n.mezaTips] || 'Nav norādīts'
    if (!sugaTips[s]) sugaTips[s] = {}
    sugaTips[s][tg] = ((sugaTips[s][tg] || 0) + n.platiba)
    tipsKopa[tg] = ((tipsKopa[tg] || 0) + n.platiba)
  })

  const activeTipas = TIPU_GRUPU_SEC.filter(g => tipsKopa[g] > 0)
  const st5Head = [['Suga', ...activeTipas, 'Kopā (ha)']]
  const st5Body = []
  SUGAS_SECIBA.forEach(suga => {
    if (!sugaTips[suga]) return
    const rinda = [suga]
    let kopa = 0
    activeTipas.forEach(g => {
      const v = sugaTips[suga][g] || 0
      rinda.push(v > 0 ? v.toFixed(2) : '—')
      kopa += v
    })
    rinda.push(kopa.toFixed(2))
    st5Body.push(rinda)
  })
  const st5Kopa = ['KOPĀ', ...activeTipas.map(g => tipsKopa[g] ? tipsKopa[g].toFixed(2) : '—'), maMezaudzes.reduce((s,n)=>s+n.platiba,0).toFixed(2)]

  if (st5Body.length > 0) {
    if (y + 40 > A4H - 20) { doc.addPage(); zimetGalveni(doc, titullapa, kadastrs); y = 16 }
    y = tblVirsraksts(doc, '5. Mežaudžu sadalījums pēc sugām un augšanas apstākļu tipa grupām (ha)', y)
    autoTable(doc, {
      ...tblOpts(y),
      head: st5Head,
      body: st5Body,
      foot: [st5Kopa],
      columnStyles: Object.fromEntries([
        ...activeTipas.map((_, i) => [i + 1, { halign: 'right' }]),
        [activeTipas.length + 1, { halign: 'right', fontStyle: 'bold' }],
      ]),
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // ─── 6. tabula: Aizsardzības pazīmju sadalījums ──────────────────────────────
  const aizsKopa = {}
  const kopPlAll = nogabali.reduce((s, n) => s + (n.platiba || 0), 0)
  nogabali.forEach(n => {
    const a = n.rawProps?.aizsardziba
    const key = (a != null && String(a).trim() && String(a).trim() !== '0')
      ? String(a).trim()
      : 'Bez aizsardzības pazīmēm'
    aizsKopa[key] = (aizsKopa[key] || 0) + (n.platiba || 0)
  })
  const aizs6Body = Object.entries(aizsKopa)
    .sort((a, b) => b[1] - a[1])
    .map(([k, pl]) => [k, pl.toFixed(2), `${((pl / kopPlAll) * 100).toFixed(1)}%`])

  if (aizs6Body.length > 0) {
    if (y + 30 > A4H - 20) { doc.addPage(); zimetGalveni(doc, titullapa, kadastrs); y = 16 }
    y = tblVirsraksts(doc, '6. Nogabalu sadalījums pēc aizsardzības pazīmēm', y)
    autoTable(doc, {
      ...tblOpts(y),
      head: [['Aizsardzības pazīme', 'Platība (ha)', '%']],
      body: aizs6Body,
      foot: [['KOPĀ', kopPlAll.toFixed(2), '100.0%']],
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    })
  }
}

// ── Lapa 3+: Nogabalu tabula ─────────────────────────────────────────────────

function lapaNogabali(doc, nogabali, titullapa, kadastrs) {
  zimetGalveni(doc, titullapa, kadastrs)

  doc.setFont('Roboto', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...GRN)
  doc.text('Nogabalu raksturojošie rādītāji', MAR, 20)

  const KAT_NOS = {
    MA:'Mežaudze', IzA:'Iznīkusi audze', Izc:'Izcirtums',
    ML:'Meža lauce', DBL:'DBL', Vir:'Virsājs',
    Sm:'Smiltājs', BA:'Bebru appl.', PK:'Pārl. klaj.', Pu:'Purvs',
    Ce:'Ceļš', Gr:'Grāvis', KvSt:'KvStiga', Kr:'Krautuve',
  }

  // Galvenā rinda + papildu stāvu rindas + apraksta rinda
  const rows = []
  const rowMeta = []

  nogabali.forEach((n, nogIdx) => {
    const haKraja = n.kategorija === 'MA' && n.krajaHa > 0

    const izcAtj = typeof n.izcAtjaunots === 'number' && n.izcAtjaunots > 1900 ? n.izcAtjaunots : 0
    const izcG   = parseInt(n.izcGads || n.rawProps?.izc_gads) || 0
    const izcVal = izcAtj ? `M ${izcAtj}` : izcG > 1900 ? String(izcG) : '—'

    rows.push([
      n.nr_text,
      n.platiba?.toFixed(2) || '—',
      KAT_NOS[n.kategorija] || n.kategorija,
      n.mezaTips || '—',
      izcVal,
      n.bonitate || '—',
      haKraja ? (n.h || '—') : '—',
      haKraja ? (n.d || '—') : '—',
      haKraja ? (n.vecums || '—') : '—',
      haKraja ? (n.bieziba?.toFixed(1) || '—') : '—',
      haKraja ? (n.g || '—') : '—',
      haKraja ? (n.krajaHa || '—') : '—',
      haKraja ? (n.kraja || '—') : '—',
    ])
    rowMeta.push({ type: 'main', nogIdx })

    // Papildus stāvu rindas — subdominējošās sugas (izlaiž dominējošo)
    const papildStavi = (n.slani || []).filter(s => s.sKods !== n.sugaKods)
    papildStavi.forEach(s => {
      const sKrajaHa = s.kub > 0 && n.platiba > 0 ? Math.round(s.kub / n.platiba) : 0
      rows.push([
        '', '', `  ↳ ${s.nos || '—'}`, '—', '—', '—',
        s.hEff > 0 ? s.hEff : '—',
        s.dEff > 0 ? s.dEff : '—',
        s.vec  > 0 ? s.vec  : '—',
        '—',
        s.gEff > 0 ? s.gEff.toFixed(1) : '—',
        sKrajaHa > 0 ? sKrajaHa : '—',
        s.kub  > 0 ? s.kub  : '—',
      ])
      rowMeta.push({ type: 'stav', nogIdx })
    })

    // Apraksta rinda (colSpan=13)
    const dalas = []
    if (n.audzeFormula && n.audzeFormula !== '—') dalas.push(`Audze: ${n.audzeFormula}`)
    if (n.lēmums && n.lēmums !== '—') dalas.push(`Pasākums: ${n.lēmums}`)
    if (n.izcApjoms > 0) dalas.push(`Izcērt: ${n.izcApjoms} m³`)
    if (n.bojajumsVeids) dalas.push(`Bojājumi: ${n.bojajumsVeids}${n.bojajumsProc ? ` ${n.bojajumsProc}%` : ''}`)
    if (n.piezimes) dalas.push(`Piezīme: ${n.piezimes}`)

    rows.push([{
      content: dalas.length ? dalas.join('  ·  ') : ' ',
      colSpan: 13,
      styles: {
        fontSize: 7, textColor: DIM,
        cellPadding: { top: 1, right: 4, bottom: 2, left: 8 },
        fillColor: GRN4,
      },
    }])
    rowMeta.push({ type: 'desc', nogIdx })
  })

  autoTable(doc, {
    startY: 23,
    margin: { left: MAR, right: MAR },
    head: [[
      'Nr', 'ha', 'Kategorija', 'Mežs\nTips', 'Izc.',
      'Bon', 'H\nm', 'D\ncm', 'Vec', 'Biez',
      'G\nm²/ha', 'Krāja\nm³/ha', 'Kop.\nkrāja m³',
    ]],
    body: rows,
    styles: { fontSize: 8, font: 'Roboto', cellPadding: { top: 2, right: 3, bottom: 2, left: 3 } },
    headStyles: { fillColor: GRN, textColor: WHT, fontStyle: 'bold', fontSize: 7.5, valign: 'middle' },
    columnStyles: {
      0:  { cellWidth: 9,  halign: 'center' },
      1:  { cellWidth: 13, halign: 'right'  },
      2:  { cellWidth: 22 },
      3:  { cellWidth: 13 },
      4:  { cellWidth: 11, halign: 'center', fontSize: 7 },
      5:  { cellWidth: 10, halign: 'center' },
      6:  { cellWidth: 10, halign: 'right'  },
      7:  { cellWidth: 10, halign: 'right'  },
      8:  { cellWidth: 10, halign: 'right'  },
      9:  { cellWidth: 9,  halign: 'right'  },
      10: { cellWidth: 13, halign: 'right'  },
      11: { cellWidth: 16, halign: 'right'  },
      12: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
    },
    theme: 'grid',
    didParseCell: (data) => {
      if (data.section !== 'body') return
      const meta = rowMeta[data.row.index]
      if (!meta || data.cell.raw?.colSpan) return
      if (meta.type === 'stav') {
        data.cell.styles.fillColor = [228, 236, 250]
        data.cell.styles.fontSize = 7.5
        data.cell.styles.textColor = [40, 70, 130]
      } else if (meta.type === 'main' && meta.nogIdx % 2 === 1) {
        data.cell.styles.fillColor = GRN3
      }
    },
    didDrawPage: () => {
      zimetGalveni(doc, titullapa, kadastrs)
    },
  })

  // Kopsavilkuma rinda apakšā
  const lapasKopa = doc.lastAutoTable.finalY + 6
  if (lapasKopa > A4H - 25) return

  const kopPl    = nogabali.reduce((s, n) => s + (n.platiba || 0), 0)
  const kopKraja = nogabali.reduce((s, n) => s + (n.kraja || 0), 0)
  const kopIzc   = nogabali.reduce((s, n) => s + (n.izcApjoms || 0), 0)

  doc.setFillColor(...GRN3)
  doc.rect(MAR, lapasKopa - 1, A4W - 2 * MAR, 10, 'F')
  doc.setFont('Roboto', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...BLK)
  doc.text(`Kopā: ${kopPl.toFixed(2)} ha`, MAR + 2, lapasKopa + 5)
  doc.text(`Kopējā krāja: ${kopKraja.toLocaleString('lv-LV')} m³`, MAR + 55, lapasKopa + 5)
  doc.text(`Izcērtamais apjoms: ${kopIzc.toLocaleString('lv-LV')} m³`, MAR + 120, lapasKopa + 5)
}

// ── Pēdējā lapa: Mežaudžu plāns ─────────────────────────────────────────────

async function lapaKarte(doc, mapElement, nogabali, titullapa, kadastrs) {
  zimetGalveni(doc, titullapa, kadastrs)

  doc.setFont('Roboto', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...GRN)
  doc.text('Mežaudžu plāns', MAR, 20)

  let karteY = 24
  const kartH = 180
  const kartW = A4W - 2 * MAR

  // Pārbauda vai nogabaliem ir ģeometrija
  const hasGeom = nogabali.some(n => n.geojson?.geometry != null)

  if (!hasGeom || !mapElement) {
    // Nav ģeometrijas — rāda informatīvu ziņu
    doc.setFillColor(...GRN4)
    doc.rect(MAR, karteY, kartW, kartH, 'F')
    doc.setDrawColor(...GRN3)
    doc.setLineWidth(0.5)
    doc.rect(MAR, karteY, kartW, kartH)
    doc.setFont('Roboto', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...DIM)
    const cx = A4W / 2, cy = karteY + kartH / 2
    doc.text('Kartes attēls nav pieejams —', cx, cy - 12, { align: 'center' })
    doc.text('nogabalu ģeometrija netika ielādēta.', cx, cy - 4, { align: 'center' })
    doc.setFontSize(8)
    doc.text('Kad LVM GEO pieejams un nogabali ielādēti ar ģeometriju,', cx, cy + 6, { align: 'center' })
    doc.text('karte tiek centrēta uz īpašumu ar krāsotiem nogabaliem.', cx, cy + 13, { align: 'center' })
    karteY += kartH + 4
  } else {
    // Mēģina uzņemt ekrānuzņēmumu
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(mapElement, {
        useCORS:    true,
        allowTaint: false,
        scale:      1.5,
        logging:    false,
        backgroundColor: '#1a2e1a',
      })
      const imgData = canvas.toDataURL('image/jpeg', 0.85)
      doc.addImage(imgData, 'JPEG', MAR, karteY, kartW, kartH)
      karteY += kartH + 4
    } catch {
      doc.setFillColor(26, 46, 26)
      doc.rect(MAR, karteY, kartW, kartH, 'F')
      doc.setFont('Roboto', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 150, 100)
      doc.text('[ Kartes attēls nav pieejams — atvērt lietojumprogrammu ]', A4W / 2, karteY + kartH / 2, { align: 'center' })
      karteY += kartH + 4
    }
  }

  // Krāsu leģenda
  const LEGENDE = [
    { krasa: [210, 80, 16],  nos: 'Priede' },
    { krasa: [64, 64, 160],  nos: 'Egle'   },
    { krasa: [32, 96, 192],  nos: 'Bērzs'  },
    { krasa: [64, 160, 16],  nos: 'Apse'   },
    { krasa: [208, 56, 128], nos: 'Melnalksnis' },
    { krasa: [136, 136, 0],  nos: 'Osis'   },
    { krasa: [120, 120, 120],nos: 'Cita suga' },
  ]

  doc.setFont('Roboto', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...GRN)
  doc.text('Krāsu leģenda', MAR, karteY + 4)
  karteY += 6

  LEGENDE.forEach((l, i) => {
    const x = MAR + i * 26
    doc.setFillColor(...l.krasa)
    doc.rect(x, karteY, 5, 5, 'F')
    doc.setFont('Roboto', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...BLK)
    doc.text(l.nos, x + 6, karteY + 4)
  })

  // Datums + paraksts
  karteY += 12
  doc.setFont('Roboto', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...DIM)
  doc.text(`Sagatavots: ${new Date().toLocaleDateString('lv-LV')}  ·  Meža tirgus  ·  meža-tirgus.lv`, MAR, karteY)
}

// ── Galvenā eksporta funkcija ─────────────────────────────────────────────────

export async function generateMAPpdf(opts) {
  const { kadastrs: _kad, titullapa, nogabali, mapElement } = opts
  const kadastrs = _kad || '—'
  const gads = new Date().getFullYear()

  const doc = new jsPDF('p', 'mm', 'a4')
  await Promise.all([ladeFontu(doc), ladeLogo()])

  // Lapa 1 — Titullapa
  lapaTitullapa(doc, titullapa, kadastrs, nogabali, gads)
  zimetKopfusu(doc, 1, 4)

  // Lapa 2 — Kopsavilkums
  doc.addPage()
  lapaKopsavilkums(doc, nogabali, titullapa, kadastrs)
  zimetKopfusu(doc, 2, 4)

  // Lapa 3+ — Nogabali
  doc.addPage()
  lapaNogabali(doc, nogabali, titullapa, kadastrs)

  // Lapa pēdējā — Karte
  doc.addPage()
  await lapaKarte(doc, mapElement, nogabali, titullapa, kadastrs)

  // Lapas numuri visās lapās
  const kopLapas = doc.getNumberOfPages()
  for (let i = 1; i <= kopLapas; i++) {
    doc.setPage(i)
    zimetKopfusu(doc, i, kopLapas)
  }

  const faila_nos = `MAP_${kadastrs}_${gads}.pdf`
  doc.save(faila_nos)
  return faila_nos
}
