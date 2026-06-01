/**
 * dastojumsMeritajsEngine.js  v2
 * Dastojuma uzmērīšanas aprēķinu dzinējs — Meža tirgus
 *
 * Stumbra profils: Kozak vienkāršotais modelis (LLU MF 2015)
 * Zonas: Resnā (D≥18), Vidējā (14-18), Tievā (8-14), P.malka (4-8)
 * Atlikumi: fiksēts % pa sugām no stumbra krājas
 */

// ─── Sugas ────────────────────────────────────────────────────────────────────
export const SUGAS = {
  P:'Priede', E:'Egle', B:'Bērzs', A:'Apse',
  Ba:'Baltalksnis', Bl:'Melnalksnis', Oz:'Ozols', Os:'Osis',
};

export const SKUJKOKI   = ['P','E'];
export const CIETIE_LK  = ['B','Oz','Os'];
export const MĪKSTIE_LK = ['A','Ba','Bl'];

// ─── 1. H regresija D → H ─────────────────────────────────────────────────────
// Formula: H = a + b * ln(D), kalibrēta pa sugām un bonitāti
const H_PARAMS = {
  P:  [[ 1.8,9.2],[ 1.2,8.6],[ 0.8,8.0],[ 0.2,7.2],[-0.5,6.4]],
  E:  [[ 2.0,9.0],[ 1.4,8.4],[ 0.9,7.8],[ 0.3,7.0],[-0.4,6.2]],
  B:  [[ 1.5,8.8],[ 1.0,8.2],[ 0.5,7.6],[-0.1,6.8],[-0.7,6.0]],
  A:  [[ 1.6,8.6],[ 1.1,8.0],[ 0.6,7.4],[ 0.0,6.6],[-0.6,5.8]],
  Ba: [[ 0.8,7.5],[ 0.4,7.0],[ 0.0,6.5],[-0.4,6.0],[-0.8,5.4]],
  Bl: [[ 1.0,7.8],[ 0.6,7.2],[ 0.2,6.7],[-0.2,6.1],[-0.6,5.5]],
  Oz: [[ 1.4,8.5],[ 0.9,7.9],[ 0.4,7.3],[-0.1,6.5],[-0.7,5.7]],
  Os: [[ 1.6,8.7],[ 1.0,8.1],[ 0.5,7.5],[-0.1,6.7],[-0.6,5.9]],
};
const H_MAX = { P:36, E:38, B:32, A:30, Ba:22, Bl:24, Oz:34, Os:34 };

export function calcH(d_cm, suga, bon=3) {
  const params = H_PARAMS[suga] ?? H_PARAMS['B'];
  const idx    = Math.max(0, Math.min(4, Math.round(bon) - 1));
  const [a, b] = params[idx];
  return Math.min(Math.max(a + b * Math.log(d_cm), 4), H_MAX[suga] ?? 30);
}

// ─── 2. 2. stāva atpazīšana ───────────────────────────────────────────────────
const OTRO_STAVU_SLIEKSNIS = {
  P:0.65, E:0.65, B:0.60, A:0.60, Ba:0.55, Bl:0.55, Oz:0.60, Os:0.60,
};

export function apzimetOtroStavu(koki) {
  const sugaStats = {};
  for (const k of koki) {
    if (!sugaStats[k.suga]) sugaStats[k.suga] = { dSumma:0, skaits:0 };
    sugaStats[k.suga].dSumma += k.d_cm;
    sugaStats[k.suga].skaits += 1;
  }
  for (const s in sugaStats) sugaStats[s].dVid = sugaStats[s].dSumma / sugaStats[s].skaits;

  const stavs1 = {};
  for (const k of koki) {
    const slieksnis = OTRO_STAVU_SLIEKSNIS[k.suga] ?? 0.60;
    const dVid      = sugaStats[k.suga]?.dVid ?? k.d_cm;
    if (k.d_cm >= dVid * slieksnis) {
      if (!stavs1[k.suga]) stavs1[k.suga] = { hSumma:0, skaits:0 };
      stavs1[k.suga].hSumma += calcH(k.d_cm, k.suga, k.bon ?? 3);
      stavs1[k.suga].skaits  += 1;
    }
  }
  for (const s in stavs1) stavs1[s].hVid = stavs1[s].hSumma / stavs1[s].skaits;

  return koki.map(k => {
    const slieksnis  = OTRO_STAVU_SLIEKSNIS[k.suga] ?? 0.60;
    const dVid       = sugaStats[k.suga]?.dVid ?? k.d_cm;
    const otrsStavs  = k.d_cm < dVid * slieksnis;
    const hTeorija   = calcH(k.d_cm, k.suga, k.bon ?? 3);
    let   hEfektiva  = hTeorija;
    if (otrsStavs && stavs1[k.suga]?.hVid) {
      hEfektiva = Math.max(Math.min(hTeorija, stavs1[k.suga].hVid * 0.60), 4);
    }
    return { ...k, otrsStavs, hTeorija, hEfektiva };
  });
}

// ─── 3. Kubatūra ─────────────────────────────────────────────────────────────
const FORMAS_SKAITLIS = {
  P:0.46, E:0.44, B:0.45, A:0.44, Ba:0.42, Bl:0.43, Oz:0.50, Os:0.47,
};

export function calcV(d_cm, h_m, suga) {
  const f = FORMAS_SKAITLIS[suga] ?? 0.45;
  const r = d_cm / 200;
  return Math.PI * r * r * h_m * f;
}

// ─── 4. STUMBRA PROFILS — Kozak vienkāršotais modelis ────────────────────────
// h_robeza = H * (1 - (d_robeza / D)^(1/forma))
// D — krūšaugsuma caurmērs, H — koka augstums, d_robeza — meklējamais caurmērs
//
// Formas koeficients pa sugām:
const STUMBRA_FORMA = {
  P:0.65, E:0.62, B:0.68, A:0.72, Ba:0.70, Bl:0.68, Oz:0.65, Os:0.66,
};

// Aprēķina augstumu (m no zemes) kur stumbra diametrs = d_rob
function hPieDiametra(D, H, d_rob, forma) {
  if (d_rob >= D) return 0;    // šis caurmērs ir lielāks par koka D — zona sākas no zemes
  if (d_rob <= 0) return H;
  return H * (1 - Math.pow(d_rob / D, 1 / forma));
}

/**
 * Aprēķina zonas garumus stumbra profilā.
 * @returns {{ h18, h14, h8, h4 }} — augstumi metros kur stumbra D = 18/14/8/4 cm
 */
export function stumbaProfileis(D_cm, H_m, suga) {
  const f = STUMBRA_FORMA[suga] ?? 0.65;
  return {
    h18: hPieDiametra(D_cm, H_m, 18, f),
    h14: hPieDiametra(D_cm, H_m, 14, f),
    h8:  hPieDiametra(D_cm, H_m,  8, f),
    h4:  hPieDiametra(D_cm, H_m,  4, f),
  };
}

// ─── 5. ATLIKUMI — fiksēts % pa sugām ────────────────────────────────────────
// No VMD PDF analīzes (Nogabals_8__9.pdf)
const ATLIEKAS_PROC = {
  P:0.125, E:0.148, B:0.139, A:0.133, Ba:0.147, Bl:0.143, Oz:0.130, Os:0.135,
};

// Dabīgā malkas proporcija no ne-malkas kokiem (statistisks % no brutV)
// Ba un A — zema kvalitāte, dod daudz malkas
const MALKA_PROC = {
  P:0.021, E:0.053, B:0.020, A:0.206, Ba:0.740, Bl:0.250, Oz:0.030, Os:0.040,
};

// ─── 6. SADALĪJUMS PA STUMBRA ZONĀM — Kozak volumetriskā integrācija ─────────
//
// Koka stumbra tilpums nav lineāri sadalīts pa augstumu — apakšā ir vairāk.
// Kozak taper modelis: d(h) = D × (1 - h/H)^forma
//
// Volumetriskā frakcija no h1 līdz h2:
//   V_zona/V_kopā = (1-h1/H)^(2f+1) - (1-h2/H)^(2f+1)
//
// Iegūts integrējot:
//   V = ∫ (π/4)×d(h)² dh = (π/4)×D²×H × ∫(1-h/H)^(2f) dh
//
// Pārbaude: Priede D=28cm H=28m
//   h18 = 13.8m → resnā frakcija = 0.9754 - 0.2095 = 76.6% ✓ (briefings: ≈76%)
//
function zonesFrakcija(h1, h2, H, forma) {
  const exp = 2 * forma + 1;
  const f1  = Math.pow(Math.max(0, 1 - h1 / H), exp);
  const f2  = Math.pow(Math.max(0, 1 - h2 / H), exp);
  return Math.max(0, f1 - f2);
}

/**
 * Sadala likvidV pa VMD stumbra zonām ar Kozak volumetrisko integrāciju.
 * Zonu summa = likvidV (normalizēta).
 *
 * Validācija (Briefings):
 *   P D=28 H=28: resnā ≈76%  ✓
 *   P D=28 H=28: atlikumi ≈12.5% (no ATLIEKAS_PROC) ✓
 */
function sadaliStumbu(D_cm, H_m, suga, likvidV) {
  const { h18, h14, h8, h4 } = stumbaProfileis(D_cm, H_m, suga);
  const f    = STUMBRA_FORMA[suga] ?? 0.65;
  const CELMS = 0.3;

  // Volumetriskās frakcijas pa zonām (Kozak modelis)
  const fResna  = zonesFrakcija(CELMS, h18, H_m, f);  // D ≥ 18cm
  const fVideja = zonesFrakcija(h18,   h14, H_m, f);  // D 14-18cm
  const fTieva  = zonesFrakcija(h14,   h8,  H_m, f);  // D 8-14cm
  const fPmalka = zonesFrakcija(h8,    h4,  H_m, f);  // D 4-8cm (P.malka)
  // Galotne D<4cm + celms (0-0.3m) ietilpst atlikumos — nav zonās

  // Summa izmantojamo zonu frakcijām (≈97-99% no koka)
  const fKopa = fResna + fVideja + fTieva + fPmalka;

  if (fKopa <= 0) {
    // Ļoti mazs koks (D<4cm) — viss iet atlikumos
    return { resnaV:0, vidaV:0, tievaV:0, pmalkaV:0 };
  }

  // Normalizē zonas tā lai to summa = likvidV (precīza grāmatvedība)
  return {
    resnaV:  round4(likvidV * fResna  / fKopa),
    vidaV:   round4(likvidV * fVideja / fKopa),
    tievaV:  round4(likvidV * fTieva  / fKopa),
    pmalkaV: round4(likvidV * fPmalka / fKopa),
  };
}

// ─── 7. GALVENĀ FUNKCIJA — pēc VMD cirsmas novērtējuma standarta ─────────────
/**
 * Aprēķina kubatūru un sadala pa VMD kolonnu shēmu.
 * Lietotāja ievadītie vidējie augstumi (sugaH) aizstāj regresijas calcH().
 * calcSortimenti() NETIEK izmantots — šis rīks ir tikai uzmērīšana.
 *
 * @param {Array}  koki   — [{suga, d_cm, kvalitate, skaits, bon, nogabals}]
 * @param {Object} sugaH  — { P:22.5, E:18.0, ... } vidējie augstumi pa sugām
 * @returns {{ paSugam, kopa }}
 */
export function sadaliKvalitates(koki, sugaH) {
  // Iezīmē 2. stāvu (loģika nemainās)
  const kokiAr2 = apzimetOtroStavu(
    koki.flatMap(k => Array(k.skaits ?? 1).fill(k).map(x => ({ ...x })))
  );

  const paSugam = {};

  for (const k of kokiAr2) {
    // a) Augstums: lietotāja ievadītais → precīzāks par regresiju
    const hVid = sugaH[k.suga] ?? calcH(k.d_cm, k.suga, k.bon ?? 3);
    const h    = k.otrsStavs ? Math.max(hVid * 0.60, 4) : hVid;

    // b) Brutā kubatūra
    const brutV = calcV(k.d_cm, h, k.suga);

    // Atlikumi — fiksēts % no brutV
    const atliPrc = ATLIEKAS_PROC[k.suga] ?? 0.14;
    const atliV   = brutV * atliPrc;
    const likvidV = brutV - atliV;

    // c+d) Sadalījums pa zonām un malku
    let resnaV, vidaV, tievaV, pmalkaV, malkaV;

    if (k.kvalitate === 'malka') {
      // Viss likvīdais tilpums iet uz Malku
      resnaV = vidaV = tievaV = pmalkaV = 0;
      malkaV = likvidV;
    } else {
      // Sadalīt pa stumbra zonām
      const z = sadaliStumbu(k.d_cm, h, k.suga, likvidV);
      resnaV  = z.resnaV;
      vidaV   = z.vidaV;
      tievaV  = z.tievaV;
      pmalkaV = z.pmalkaV;

      // Dabīgā malka — noņem no plānākajām zonām (P.malka → Tievā)
      const naturalMalka = brutV * (MALKA_PROC[k.suga] ?? 0);
      malkaV = Math.min(naturalMalka, pmalkaV + tievaV); // nevar būt vairāk par tievākajām zonām
      let rem = malkaV;
      const pNem = Math.min(pmalkaV, rem); rem -= pNem;
      const tNem = Math.min(tievaV, rem);
      pmalkaV = round4(pmalkaV - pNem);
      tievaV  = round4(tievaV  - tNem);
      malkaV  = round4(malkaV);
    }

    if (!paSugam[k.suga]) {
      paSugam[k.suga] = {
        skaits:0, brutV:0, atliV:0, likvidV:0,
        resnaV:0, vidaV:0, tievaV:0, pmalkaV:0, malkaV:0,
        otrsStavsSkaits:0,
      };
    }
    const ps = paSugam[k.suga];
    ps.skaits++;
    ps.brutV   += brutV;
    ps.atliV   += atliV;
    ps.likvidV += likvidV;
    ps.resnaV  += resnaV;
    ps.vidaV   += vidaV;
    ps.tievaV  += tievaV;
    ps.pmalkaV += pmalkaV;
    ps.malkaV  += malkaV;
    if (k.otrsStavs) ps.otrsStavsSkaits++;
  }

  // Noapaļo un aprēķina kopsummas
  const kopa = {
    skaits:0, brutV:0, atliV:0, likvidV:0,
    resnaV:0, vidaV:0, tievaV:0, pmalkaV:0, malkaV:0,
    lietkoksneV:0, pardosanaiV:0,
  };

  for (const sg in paSugam) {
    const ps = paSugam[sg];
    for (const f of ['brutV','atliV','likvidV','resnaV','vidaV','tievaV','pmalkaV','malkaV']) {
      ps[f] = round2(ps[f]);
      kopa[f] += ps[f];
    }
    // e) Lietkoksne = Resnā + Vidējā + Tievā + P.malka
    ps.lietkoksneV = round2(ps.resnaV + ps.vidaV + ps.tievaV + ps.pmalkaV);
    // Paredzēts pārdošanai = Lietkoksne + Malka (= Stumbra krāja - Atlikumi)
    ps.pardosanaiV = round2(ps.lietkoksneV + ps.malkaV);
    ps.videjaKoks  = ps.skaits > 0 ? round2(ps.brutV / ps.skaits) : 0;
    kopa.skaits += ps.skaits;
  }

  for (const f of ['brutV','atliV','likvidV','resnaV','vidaV','tievaV','pmalkaV','malkaV']) {
    kopa[f] = round2(kopa[f]);
  }
  kopa.lietkoksneV = round2(kopa.resnaV + kopa.vidaV + kopa.tievaV + kopa.pmalkaV);
  kopa.pardosanaiV = round2(kopa.lietkoksneV + kopa.malkaV);
  kopa.videjaKoks  = kopa.skaits > 0 ? round2(kopa.brutV / kopa.skaits) : 0;

  return { paSugam, kopa };
}

// ─── Palīgfunkcijas ───────────────────────────────────────────────────────────
function round2(v) { return Math.round(v * 100) / 100; }
function round4(v) { return Math.round(v * 10000) / 10000; }

// ─── Vēsturiskās funkcijas (backward compat, vairs neizmanto galvenajā plūsmā) ─
// apstraadaKokus() atstāts vecajiem importiem
export function apstraadaKokus(koki, sugaGarumi = {}) {
  return { koki: [], kopsavilkums: null };
}
export function formatKopsavilkums(ks) { return ''; }
