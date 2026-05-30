/**
 * dastojumsEngine.js
 * Dastojuma uzmērīšanas kalkulācijas dzinējs
 * Meža tirgus — meža-tirgus.lv
 *
 * Aptver:
 *  1. H aprēķins no D + bonitātes (regresija pa sugām)
 *  2. 2. stāva automātiskā atpazīšana
 *  3. Kubatūra (V) no D un H pa sugām
 *  4. Atliekas (%) pa sugām un D klasēm
 *  5. Sortimentu sadalījums pa sugām
 *  6. Cirsmas kopsavilkums
 */

// ─── 1. SUGAS KODI ────────────────────────────────────────────────────────────

export const SUGAS = {
  P:  'Priede',
  E:  'Egle',
  B:  'Bērzs',
  A:  'Apse',
  Ba: 'Baltalksnis',
  Bl: 'Melnalksnis',
  Oz: 'Ozols',
  Os: 'Osis',
  Ap: 'Apšu grupas',
};

// Skujkoki
export const SKUJKOKI  = ['P', 'E'];
// Cietie lapu koki
export const CIETIE_LK = ['B', 'Oz', 'Os'];
// Mīkstie lapu koki
export const MĪKSTIE_LK = ['A', 'Ba', 'Bl'];

// ─── 2. H REGRESIJA: D → H (Latvijas LVM/Ilvess bāzes) ──────────────────────
// Formula: H = a + b * ln(D) — kalibrēta pa sugām un bonitātes klasēm
// Bonitāte: 1 (labākā) → 5 (sliktākā)
// Parametri [a, b] pa sugām un bonitāti

const H_PARAMS = {
  //         bon1        bon2        bon3        bon4        bon5
  P:  [[ 1.8, 9.2],  [ 1.2, 8.6],  [ 0.8, 8.0],  [ 0.2, 7.2],  [-0.5, 6.4]],
  E:  [[ 2.0, 9.0],  [ 1.4, 8.4],  [ 0.9, 7.8],  [ 0.3, 7.0],  [-0.4, 6.2]],
  B:  [[ 1.5, 8.8],  [ 1.0, 8.2],  [ 0.5, 7.6],  [-0.1, 6.8],  [-0.7, 6.0]],
  A:  [[ 1.6, 8.6],  [ 1.1, 8.0],  [ 0.6, 7.4],  [ 0.0, 6.6],  [-0.6, 5.8]],
  Ba: [[ 0.8, 7.5],  [ 0.4, 7.0],  [ 0.0, 6.5],  [-0.4, 6.0],  [-0.8, 5.4]],
  Bl: [[ 1.0, 7.8],  [ 0.6, 7.2],  [ 0.2, 6.7],  [-0.2, 6.1],  [-0.6, 5.5]],
  Oz: [[ 1.4, 8.5],  [ 0.9, 7.9],  [ 0.4, 7.3],  [-0.1, 6.5],  [-0.7, 5.7]],
  Os: [[ 1.6, 8.7],  [ 1.0, 8.1],  [ 0.5, 7.5],  [-0.1, 6.7],  [-0.6, 5.9]],
};

/**
 * Aprēķina koka augstumu no D1.3 un bonitātes.
 * @param {number} d_cm  — caurmērs cm
 * @param {string} suga  — sugas kods
 * @param {number} bon   — bonitāte 1–5
 * @returns {number} augstums metros
 */
export function calcH(d_cm, suga, bon = 3) {
  const params = H_PARAMS[suga] ?? H_PARAMS['B'];
  const bonIdx = Math.max(0, Math.min(4, Math.round(bon) - 1));
  const [a, b] = params[bonIdx];
  const h = a + b * Math.log(d_cm);
  // Fiziskie griesti pa sugām
  const hMax = { P: 36, E: 38, B: 32, A: 30, Ba: 22, Bl: 24, Oz: 34, Os: 34 };
  return Math.min(Math.max(h, 4), hMax[suga] ?? 30);
}

// ─── 3. 2. STĀVA ATPAZĪŠANA ───────────────────────────────────────────────────
/**
 * Nosaka vai koks ir 2. stāvs un aprēķina tā efektīvo augstumu.
 *
 * Loģika:
 *  - Katrai sugai uzskaita vidējo D 1. stāvā (koki ar "normālu" D)
 *  - Ja koka D < vidējais_D * OTRO_STAVU_SLIEKSNIS → 2. stāvs
 *  - 2. stāva augstums = min(calcH(d, suga, bon), 1. stāva vidējais H * 0.60)
 *
 * Sliekšņi (empīriski):
 *  - Skujkoki: 0.65 (tievāks par 65% no vidējā → 2. stāvs)
 *  - Lapu koki: 0.60
 */
const OTRO_STAVU_SLIEKSNIS = { P: 0.65, E: 0.65, B: 0.60, A: 0.60, Ba: 0.55, Bl: 0.55, Oz: 0.60, Os: 0.60 };

/**
 * Iezīmē 2. stāvu katrā kokā.
 * @param {Array} koki — masīvs ar { d_cm, suga, bon, kvalitate, ... }
 * @returns {Array} koki ar papildus laukiem: { otrsStavs, h_efektiva, h_teorija }
 */
export function apzimetOtroStavu(koki) {
  // Solis 1: pa katru sugu atrast vidējo D un vidējo H pirmajiem kokiem
  const sugaStats = {};
  for (const k of koki) {
    if (!sugaStats[k.suga]) sugaStats[k.suga] = { dSumma: 0, skaits: 0 };
    sugaStats[k.suga].dSumma += k.d_cm;
    sugaStats[k.suga].skaits += 1;
  }
  for (const s in sugaStats) {
    sugaStats[s].dVid = sugaStats[s].dSumma / sugaStats[s].skaits;
  }

  // Solis 2: pirmā gājienā atrast tikai 1. stāva kokus un to vidējo H
  const stavs1 = {};
  for (const k of koki) {
    const slieksnis = OTRO_STAVU_SLIEKSNIS[k.suga] ?? 0.60;
    const dVid = sugaStats[k.suga]?.dVid ?? k.d_cm;
    const irOtrs = k.d_cm < dVid * slieksnis;
    if (!irOtrs) {
      if (!stavs1[k.suga]) stavs1[k.suga] = { hSumma: 0, skaits: 0 };
      const h = calcH(k.d_cm, k.suga, k.bon ?? 3);
      stavs1[k.suga].hSumma += h;
      stavs1[k.suga].skaits += 1;
    }
  }
  for (const s in stavs1) {
    stavs1[s].hVid = stavs1[s].hSumma / stavs1[s].skaits;
  }

  // Solis 3: iezīmēt katru koku
  return koki.map(k => {
    const slieksnis = OTRO_STAVU_SLIEKSNIS[k.suga] ?? 0.60;
    const dVid = sugaStats[k.suga]?.dVid ?? k.d_cm;
    const otrsStavs = k.d_cm < dVid * slieksnis;
    const hTeorija = calcH(k.d_cm, k.suga, k.bon ?? 3);
    let hEfektiva = hTeorija;

    if (otrsStavs && stavs1[k.suga]?.hVid) {
      // 2. stāva koks nevar būt garāks par 60% no 1. stāva vidējā augstuma
      const hMax2stavs = stavs1[k.suga].hVid * 0.60;
      hEfektiva = Math.min(hTeorija, hMax2stavs);
      // Absolūtais minimums — 2. stāva koks vismaz 4m
      hEfektiva = Math.max(hEfektiva, 4);
    }

    return { ...k, otrsStavs, hTeorija, hEfektiva };
  });
}

// ─── 4. KUBATŪRA ──────────────────────────────────────────────────────────────
/**
 * Koka bruto kubatūra (m³) pēc GOST/Latvijas prakses.
 * V = (π/4) * (D/100)² * H * f
 * kur f = formas skaitlis (pilnuma koeficients) pa sugām
 */
const FORMAS_SKAITLIS = {
  P: 0.46, E: 0.44, B: 0.45, A: 0.44,
  Ba: 0.42, Bl: 0.43, Oz: 0.50, Os: 0.47,
};

export function calcV(d_cm, h_m, suga) {
  const f = FORMAS_SKAITLIS[suga] ?? 0.45;
  const r = d_cm / 200; // rādiuss metros
  return Math.PI * r * r * h_m * f;
}

// ─── 5. ATLIEKAS ─────────────────────────────────────────────────────────────
/**
 * Atliekas (m³) = daļa no bruto V kas paliek kā zari, galotnites u.c.
 * Lielākiem kokiem (B, A, Oz) vairāk atliekas jo biezāki zari.
 * Tabula: [D slieksnis cm, atlieku % no bruto V]
 */
const ATLIEKAS_TABULA = {
  //  [d_robeza, %]  — ņem pirmo kur d_cm <= d_robeza
  P:  [[12,0.10],[18,0.12],[26,0.14],[36,0.16],[99,0.18]],
  E:  [[12,0.12],[18,0.14],[26,0.16],[36,0.18],[99,0.20]],
  B:  [[12,0.14],[18,0.16],[26,0.20],[36,0.24],[99,0.28]], // lieli bērzi — daudz zaru
  A:  [[12,0.15],[18,0.18],[26,0.22],[36,0.26],[99,0.30]], // apse vissliktākā
  Ba: [[12,0.10],[18,0.13],[26,0.16],[99,0.18]],
  Bl: [[12,0.10],[18,0.13],[26,0.16],[99,0.18]],
  Oz: [[12,0.14],[18,0.18],[26,0.22],[36,0.26],[99,0.28]],
  Os: [[12,0.12],[18,0.15],[26,0.18],[36,0.22],[99,0.24]],
};

export function calcAtliekas(d_cm, suga, brutV) {
  const tabula = ATLIEKAS_TABULA[suga] ?? ATLIEKAS_TABULA['B'];
  const row = tabula.find(([d]) => d_cm <= d) ?? tabula[tabula.length - 1];
  const proc = row[1];
  return { proc, v: brutV * proc };
}

// ─── 6. SORTIMENTU SADALĪJUMS ─────────────────────────────────────────────────
/**
 * Esošās Meža tirgus sortimentu regulas (no forestEngine.js / qualityEngine.js):
 *
 * P/E/Lg  → baļķis (ja D≥18, Q1-Q3) / sīkbaļķis (D 12-17) / papīrmalka / malka
 * B       → finieris (D≥18, Q1-Q2) / sīkbaļķis / papīrmalka / malka
 * A       → zāģbaļķis tikai ja balts un bez mīkstās trupes; citādi malka
 * Ba      → tara (2.5m) + malka; NAV zāģbaļķu
 * Bl      → zāģbaļķis / papīrmalka; NAV papīrmalkas pēc Ba/Bl noteikuma
 * Oz/Os   → zāģbaļķis / malka; NAV papīrmalkas
 *
 * Kvalitātes klases ievadītas kā: 'resns'|'vidējs'|'tievs'|'malka'
 * Kartējums uz Q: resns=Q1, vidējs=Q2, tievs=Q3, malka=Q4
 */

const KVALITATE_MAP = { resns: 'Q1', vidējs: 'Q2', tievs: 'Q3', malka: 'Q4' };

/**
 * Aprēķina sortimentu sadalījumu vienam kokam.
 * @param {number} d_cm
 * @param {string} suga
 * @param {string} kvalitate  'resns'|'vidējs'|'tievs'|'malka'
 * @param {number} likvidV    — likvidā kubatūra (bruto - atliekas)
 * @param {number} sortGarums — ievadītais sortimenta garums (m), pa sugām
 * @returns {Object} sadalījums pa sortimentiem
 */
export function calcSortimenti(d_cm, suga, kvalitate, likvidV, sortGarums) {
  const q = KVALITATE_MAP[kvalitate] ?? 'Q4';
  const s = { balkis:0, snikbalkis:0, finieris:0, tara:0, papirmalka:0, malka:0 };

  if (kvalitate === 'malka') {
    s.malka = likvidV;
    return s;
  }

  // ── Skujkoki (P, E) ──────────────────────────────────────────────────────
  if (['P', 'E'].includes(suga)) {
    if (d_cm >= 18 && ['Q1','Q2','Q3'].includes(q)) {
      s.balkis = likvidV * 0.65;
      s.papirmalka = likvidV * 0.25;
      s.malka = likvidV * 0.10;
    } else if (d_cm >= 12) {
      s.snikbalkis = likvidV * 0.60;
      s.papirmalka = likvidV * 0.30;
      s.malka = likvidV * 0.10;
    } else {
      s.papirmalka = likvidV * 0.70;
      s.malka = likvidV * 0.30;
    }
  }

  // ── Bērzs ────────────────────────────────────────────────────────────────
  else if (suga === 'B') {
    if (d_cm >= 18 && ['Q1','Q2'].includes(q)) {
      s.finieris = likvidV * 0.60;
      s.papirmalka = likvidV * 0.30;
      s.malka = likvidV * 0.10;
    } else if (d_cm >= 14) {
      s.snikbalkis = likvidV * 0.55;
      s.papirmalka = likvidV * 0.35;
      s.malka = likvidV * 0.10;
    } else {
      s.papirmalka = likvidV * 0.65;
      s.malka = likvidV * 0.35;
    }
  }

  // ── Apse ─────────────────────────────────────────────────────────────────
  else if (suga === 'A') {
    // Zāģbaļķis tikai Q1-Q2 un D>=18 — citādi viss malka
    if (d_cm >= 18 && ['Q1','Q2'].includes(q)) {
      s.balkis = likvidV * 0.60;
      s.malka = likvidV * 0.40;
    } else {
      s.malka = likvidV;
    }
  }

  // ── Baltalksnis ──────────────────────────────────────────────────────────
  else if (suga === 'Ba') {
    // Tikai tara (2.5m sortiments) un malka — NAV zāģbaļķu, NAV papīrmalkas
    if (d_cm >= 8) {
      s.tara = likvidV * 0.55;
      s.malka = likvidV * 0.45;
    } else {
      s.malka = likvidV;
    }
  }

  // ── Melnalksnis ──────────────────────────────────────────────────────────
  else if (suga === 'Bl') {
    if (d_cm >= 14 && ['Q1','Q2','Q3'].includes(q)) {
      s.balkis = likvidV * 0.55;
      s.malka = likvidV * 0.45;
    } else {
      s.malka = likvidV;
    }
  }

  // ── Ozols / Osis ──────────────────────────────────────────────────────────
  else if (['Oz', 'Os'].includes(suga)) {
    if (d_cm >= 18 && ['Q1','Q2','Q3'].includes(q)) {
      s.balkis = likvidV * 0.65;
      s.malka = likvidV * 0.35;
    } else if (d_cm >= 12) {
      s.balkis = likvidV * 0.45;
      s.malka = likvidV * 0.55;
    } else {
      s.malka = likvidV;
    }
  }

  // ── Pārējie (noklusējums) ─────────────────────────────────────────────────
  else {
    s.malka = likvidV;
  }

  // Noapaļošana 4 decimāļi
  for (const k in s) s[k] = Math.round(s[k] * 10000) / 10000;
  return s;
}

// ─── 7. GALVENĀ FUNKCIJA — apstrādā visus kokus ───────────────────────────────
/**
 * Apstrādā visus cirsmā uzmērītos kokus.
 *
 * @param {Array} koki — [{
 *   id: string,
 *   suga: 'P'|'E'|'B'|'A'|'Ba'|'Bl'|'Oz'|'Os',
 *   d_cm: number,
 *   kvalitate: 'resns'|'vidējs'|'tievs'|'malka',
 *   bon: number,          // bonitāte 1-5 (noklusējums 3)
 *   nogabals: string,     // tikai atsaucei, neiespaido aprēķinu
 *   skaits: number,       // noklusējums 1
 * }]
 *
 * @param {Object} sugaGarumi — { P: 5, E: 5, B: 4, Ba: 2.5, ... }
 *   Manuāli ievadīts sortimenta garums katrai sugai
 *
 * @returns {Object} {
 *   koki: apstrādāti koki ar visiem aprēķiniem,
 *   kopsavilkums: { kopBruto, kopLikvidaa, kopAtliekas, sortimenti, paSugam }
 * }
 */
export function apstraadaKokus(koki, sugaGarumi = {}) {
  // 1. Iezīmēt 2. stāvu
  const kokiAr2Stavu = apzimetOtroStavu(
    koki.flatMap(k => Array(k.skaits ?? 1).fill(k).map((x, i) => ({ ...x, _idx: i })))
  );

  // 2. Aprēķināt katru koku
  const apstraadaati = kokiAr2Stavu.map(k => {
    const skaits = 1; // jau izpletināts augstāk
    const sortGarums = sugaGarumi[k.suga] ?? defaultSortGarums(k.suga);
    const h = k.hEfektiva;
    const brutV = calcV(k.d_cm, h, k.suga) * skaits;
    const { proc: atliPrc, v: atliV } = calcAtliekas(k.d_cm, k.suga, brutV);
    const likvidV = brutV - atliV;
    const sortimenti = calcSortimenti(k.d_cm, k.suga, k.kvalitate, likvidV, sortGarums);

    return {
      ...k,
      sortGarums,
      h,
      brutV: round4(brutV),
      atliV: round4(atliV),
      atliPrc,
      likvidV: round4(likvidV),
      sortimenti,
    };
  });

  // 3. Kopsavilkums
  const kopsavilkums = sagataavotKopsavilkumu(apstraadaati);

  return { koki: apstraadaati, kopsavilkums };
}

function defaultSortGarums(suga) {
  const defaults = { P:5, E:5, B:4, A:4, Ba:2.5, Bl:4, Oz:5, Os:5 };
  return defaults[suga] ?? 4;
}

function round4(v) { return Math.round(v * 10000) / 10000; }
function round2(v) { return Math.round(v * 100) / 100; }

// ─── 8. KOPSAVILKUMS ──────────────────────────────────────────────────────────
function sagataavotKopsavilkumu(koki) {
  const kopBruto   = koki.reduce((s, k) => s + k.brutV, 0);
  const kopAtliekas = koki.reduce((s, k) => s + k.atliV, 0);
  const kopLikvida  = koki.reduce((s, k) => s + k.likvidV, 0);

  // Sortimenti kopā
  const sortKopa = { balkis:0, snikbalkis:0, finieris:0, tara:0, papirmalka:0, malka:0 };
  for (const k of koki) {
    for (const [sort, v] of Object.entries(k.sortimenti)) {
      sortKopa[sort] = (sortKopa[sort] ?? 0) + v;
    }
  }
  for (const s in sortKopa) sortKopa[s] = round2(sortKopa[s]);

  // Pa sugām
  const paSugam = {};
  for (const k of koki) {
    if (!paSugam[k.suga]) paSugam[k.suga] = {
      skaits: 0, brutV: 0, likvidV: 0, atliV: 0,
      sortimenti: { balkis:0, snikbalkis:0, finieris:0, tara:0, papirmalka:0, malka:0 },
      otrsStavsSkaits: 0,
    };
    const ps = paSugam[k.suga];
    ps.skaits += 1;
    ps.brutV  += k.brutV;
    ps.likvidV += k.likvidV;
    ps.atliV  += k.atliV;
    if (k.otrsStavs) ps.otrsStavsSkaits += 1;
    for (const [sort, v] of Object.entries(k.sortimenti)) {
      ps.sortimenti[sort] = (ps.sortimenti[sort] ?? 0) + v;
    }
  }
  for (const s in paSugam) {
    const ps = paSugam[s];
    ps.brutV   = round2(ps.brutV);
    ps.likvidV = round2(ps.likvidV);
    ps.atliV   = round2(ps.atliV);
    for (const k in ps.sortimenti) ps.sortimenti[k] = round2(ps.sortimenti[k]);
  }

  // Pa nogabaliem (info)
  const paNogabaliem = {};
  for (const k of koki) {
    const n = k.nogabals ?? '—';
    if (!paNogabaliem[n]) paNogabaliem[n] = { skaits: 0, brutV: 0, likvidV: 0 };
    paNogabaliem[n].skaits += 1;
    paNogabaliem[n].brutV  += k.brutV;
    paNogabaliem[n].likvidV += k.likvidV;
  }
  for (const n in paNogabaliem) {
    paNogabaliem[n].brutV   = round2(paNogabaliem[n].brutV);
    paNogabaliem[n].likvidV = round2(paNogabaliem[n].likvidV);
  }

  const kopaSkaits = koki.length;
  const otrsStavsSkaits = koki.filter(k => k.otrsStavs).length;

  return {
    kopaSkaits,
    otrsStavsSkaits,
    kopBruto:    round2(kopBruto),
    kopAtliekas: round2(kopAtliekas),
    kopLikvida:  round2(kopLikvida),
    atliProcVid: kopBruto > 0 ? round2(kopAtliekas / kopBruto * 100) : 0,
    sortimenti:  sortKopa,
    paSugam,
    paNogabaliem,
  };
}

// ─── 9. EKSPORTA PALĪGFUNKCIJAS ───────────────────────────────────────────────

/** Formatē kopsavilkumu teksta veidā (priekš PDF/print) */
export function formatKopsavilkums(ks, cirsmaInfo = {}) {
  const datums = new Date().toLocaleDateString('lv-LV');
  const lines = [
    `DASTOJUMA UZMĒRĪŠANA`,
    `${datums}`,
    cirsmaInfo.kadastrs ? `Kadastra nr.: ${cirsmaInfo.kadastrs}` : '',
    cirsmaInfo.platiba  ? `Platība: ${cirsmaInfo.platiba} ha` : '',
    ``,
    `KOPSAVILKUMS`,
    `Uzmērīti koki: ${ks.kopaSkaits} (t.sk. 2. stāvs: ${ks.otrsStavsSkaits})`,
    ``,
    `Kopējā krāja (bruto):  ${ks.kopBruto} m³`,
    `Atliekas:              ${ks.kopAtliekas} m³ (${ks.atliProcVid}%)`,
    `Likvidā krāja:         ${ks.kopLikvida} m³`,
    ``,
    `SORTIMENTU SADALĪJUMS`,
    `  Baļķis/Zāģbaļķis:   ${ks.sortimenti.balkis} m³`,
    `  Sīkbaļķis:           ${ks.sortimenti.snikbalkis} m³`,
    `  Finieris (B):        ${ks.sortimenti.finieris} m³`,
    `  Tara (Ba 2.5m):      ${ks.sortimenti.tara} m³`,
    `  Papīrmalka:          ${ks.sortimenti.papirmalka} m³`,
    `  Malka:               ${ks.sortimenti.malka} m³`,
    ``,
    `PA SUGĀM`,
    ...Object.entries(ks.paSugam).map(([suga, d]) =>
      `  ${suga}: ${d.skaits} koki, bruto ${d.brutV} m³, likvid ${d.likvidV} m³` +
      (d.otrsStavsSkaits > 0 ? ` (2.stāvs: ${d.otrsStavsSkaits})` : '')
    ),
  ].filter(l => l !== undefined);

  return lines.join('\n');
}

