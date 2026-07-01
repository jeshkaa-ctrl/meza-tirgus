// CIC trofeju vērtēšanas aprēķinu dzinējs
// Formulas ir aptuvenas — galīgais vērtējums jāveic sertificētai CIC komisijai

export const SUGAS = [
  { id: 'staltbriedis', nos: 'Staltbriedis', emoji: '🦌', lat: 'Cervus elaphus',      zuv: '≥90 dienas' },
  { id: 'stirnazis',    nos: 'Stirnāzis',    emoji: '🦌', lat: 'Capreolus capreolus', zuv: '≥60 dienas' },
  { id: 'alnis',        nos: 'Alnis',         emoji: '🫎', lat: 'Alces alces',          zuv: '≥90 dienas' },
  { id: 'dambriedis',   nos: 'Dambriedis',    emoji: '🦌', lat: 'Dama dama',            zuv: '≥30 dienas' },
  { id: 'meza_kuilis',  nos: 'Meža kuilis',   emoji: '🐗', lat: 'Sus scrofa',           zuv: '—' },
]

export const MEDALAS = {
  staltbriedis: { bronza: 190, sudrabs: 210, zelts: 225 },
  stirnazis:    { bronza: 105, sudrabs: 115, zelts: 130 },
  alnis:        { bronza: 280, sudrabs: 300, zelts: 350 },
  dambriedis:   { bronza: 160, sudrabs: 170, zelts: 180 },
  meza_kuilis:  { bronza: 100, sudrabs: 115, zelts: 130 },
}

export function getMedala(suga, punkti) {
  const m = MEDALAS[suga]
  if (!m || punkti == null) return null
  if (punkti >= m.zelts)   return { tips: 'zelts',   emoji: '🥇', nos: 'ZELTS',   krasa: '#ffd700' }
  if (punkti >= m.sudrabs) return { tips: 'sudrabs', emoji: '🥈', nos: 'SUDRABS', krasa: '#c0c0c0' }
  if (punkti >= m.bronza)  return { tips: 'bronza',  emoji: '🥉', nos: 'BRONZA',  krasa: '#cd7f32' }
  return { tips: 'nav', emoji: '—', nos: 'Nav medaļas', krasa: '#888' }
}

const p2 = n => +n.toFixed(2)
const v = x => parseFloat(x) || 0

// Staltbriedis (Cervus elaphus)
// garums × 0.5, vidējie apkārtmēri × 1, platums × 0.5, žuburi × 1, svars × 1
export function aprKinStaltbriedis(d) {
  const gK = v(d.garumsK), gL = v(d.garumsL)
  const garums = (gK + gL) * 0.5

  const c1 = (v(d.ap1K) + v(d.ap1L)) / 2
  const c2 = (v(d.ap2K) + v(d.ap2L)) / 2
  const c3 = (v(d.ap3K) + v(d.ap3L)) / 2
  const apk = c1 + c2 + c3

  const plat  = v(d.platums) * 0.5
  const zub   = v(d.zuburi) * 1.0
  const svars = v(d.svarsKg) * 1.0
  const boni  = v(d.perlovojums) + v(d.krasa) + v(d.vainags)
  const atsk  = v(d.garAtsk) + v(d.apAtsk) + v(d.defAtsk)
  const total = garums + apk + plat + zub + svars + boni - atsk

  return {
    kopsumma: p2(total),
    rindas: [
      { nos: 'Ragu garums',          pkt: p2(garums), formk: `(${gK}+${gL}) × 0.5` },
      { nos: 'Apkārtmēri (vid.×3)',  pkt: p2(apk),    formk: `${p2(c1)}+${p2(c2)}+${p2(c3)}` },
      { nos: 'Ragu platums',         pkt: p2(plat),   formk: `${v(d.platums)} × 0.5` },
      { nos: 'Žuburi',               pkt: p2(zub),    formk: `${v(d.zuburi)} gab. × 1` },
      { nos: 'Svars',                pkt: p2(svars),  formk: `${v(d.svarsKg)} kg × 1` },
      { nos: 'Bonifikācijas',        pkt: p2(boni),   formk: `pērļ.${v(d.perlovojums)} krāsa${v(d.krasa)} vain.${v(d.vainags)}` },
      ...(atsk > 0 ? [{ nos: 'Atskaitījumi', pkt: -p2(atsk), formk: 'defekti/asimetrija' }] : []),
    ],
  }
}

// Stirnāzis (Capreolus capreolus)
// vidējais garums × 0.5, apkārtmēri vidēji × 1, svars(g)/50, tilpums(cm³) × 1
export function aprKinStirnazis(d) {
  const gK = v(d.garumsK), gL = v(d.garumsL)
  const garums = ((gK + gL) / 2) * 0.5

  const c1 = (v(d.roseK) + v(d.roseL)) / 2
  const c2 = (v(d.midK) + v(d.midL)) / 2

  const kor     = d.pilnaGalva ? 90 : 0
  const svarsKor = Math.max(0, v(d.svarsG) - kor)
  const svars   = svarsKor / 50

  const tilp  = v(d.tilpums)
  const boni  = v(d.skaistums) + v(d.perlovojums)
  const total = garums + c1 + c2 + svars + tilp + boni

  return {
    kopsumma: p2(total),
    rindas: [
      { nos: 'Garuma punkti',         pkt: p2(garums), formk: `(${gK}+${gL})/2 × 0.5` },
      { nos: 'Apk. pie rozes (vid.)', pkt: p2(c1),     formk: `(${v(d.roseK)}+${v(d.roseL)})/2` },
      { nos: 'Apk. vidū (vid.)',      pkt: p2(c2),     formk: `(${v(d.midK)}+${v(d.midL)})/2` },
      { nos: `Svars (−${kor}g)`,      pkt: p2(svars),  formk: `${svarsKor}g ÷ 50` },
      { nos: 'Tilpums',               pkt: p2(tilp),   formk: `${v(d.tilpums)} cm³ × 1` },
      { nos: 'Bonifikācijas',         pkt: p2(boni),   formk: `skais.${v(d.skaistums)} pērļ.${v(d.perlovojums)}` },
    ],
  }
}

// Alnis (Alces alces)
// platums × 1, lāpsta garums × 0.5, lāpsta platums × 1, atzari × 2, svars × 0.5
export function aprKinAlnis(d) {
  const plat = v(d.platums)
  const lgK = v(d.lgK), lgL = v(d.lgL)
  const lpK = v(d.lpK), lpL = v(d.lpL)
  const aK = v(d.atzariK), aL = v(d.atzariL)

  const platPkt = plat * 1.0
  const lgPkt   = (lgK + lgL) * 0.5
  const lpPkt   = (lpK + lpL) * 1.0
  const atzPkt  = (aK + aL) * 2.0
  const svPkt   = v(d.svarsKg) * 0.5
  const total   = platPkt + lgPkt + lpPkt + atzPkt + svPkt

  return {
    kopsumma: p2(total),
    rindas: [
      { nos: 'Ragu platums',    pkt: p2(platPkt), formk: `${plat} × 1` },
      { nos: 'Lāpstas garums',  pkt: p2(lgPkt),   formk: `(${lgK}+${lgL}) × 0.5` },
      { nos: 'Lāpstas platums', pkt: p2(lpPkt),   formk: `(${lpK}+${lpL}) × 1` },
      { nos: 'Atzari',          pkt: p2(atzPkt),  formk: `(${aK}+${aL}) × 2` },
      { nos: 'Svars',           pkt: p2(svPkt),   formk: `${v(d.svarsKg)} kg × 0.5` },
    ],
  }
}

// Dambriedis (Dama dama)
// raga garums × 0.5, lāpsta garums × 0.5, lāpsta platums × 1, acu žuburi × 0.5, roze × 0.5, svars × 2
export function aprKinDambriedis(d) {
  const rgK = v(d.rgK), rgL = v(d.rgL)
  const lgK = v(d.lgK), lgL = v(d.lgL)
  const lpK = v(d.lpK), lpL = v(d.lpL)
  const azK = v(d.azK), azL = v(d.azL)
  const raK = v(d.raK), raL = v(d.raL)

  const rgPkt = (rgK + rgL) * 0.5
  const lgPkt = (lgK + lgL) * 0.5
  const lpPkt = (lpK + lpL) * 1.0
  const azPkt = (azK + azL) * 0.5
  const raPkt = (raK + raL) * 0.5
  const svPkt = v(d.svarsKg) * 2.0
  const total = rgPkt + lgPkt + lpPkt + azPkt + raPkt + svPkt

  return {
    kopsumma: p2(total),
    rindas: [
      { nos: 'Raga garums',     pkt: p2(rgPkt), formk: `(${rgK}+${rgL}) × 0.5` },
      { nos: 'Lāpstas garums',  pkt: p2(lgPkt), formk: `(${lgK}+${lgL}) × 0.5` },
      { nos: 'Lāpstas platums', pkt: p2(lpPkt), formk: `(${lpK}+${lpL}) × 1` },
      { nos: 'Acu žuburi',      pkt: p2(azPkt), formk: `(${azK}+${azL}) × 0.5` },
      { nos: 'Rozešu apk.',     pkt: p2(raPkt), formk: `(${raK}+${raL}) × 0.5` },
      { nos: 'Svars',           pkt: p2(svPkt), formk: `${v(d.svarsKg)} kg × 2` },
    ],
  }
}

// Meža kuilis (Sus scrofa)
// garums × 2, apkārtmērs × 2, leņķa bonifikācija
export function aprKinKuilis(d) {
  const gK = v(d.garumsK), gL = v(d.garumsL)
  const aK = v(d.apK), aL = v(d.apL)
  const lenkis = v(d.lenkis)

  const garPkt = (gK + gL) * 2.0
  const apPkt  = (aK + aL) * 2.0
  let   lenBoni = 0
  if      (lenkis >= 76) lenBoni = 6
  else if (lenkis >= 61) lenBoni = 4
  else if (lenkis >= 46) lenBoni = 2
  else if (lenkis >= 30) lenBoni = 0
  else if (lenkis > 0)   lenBoni = -2

  const total = garPkt + apPkt + lenBoni

  return {
    kopsumma: p2(total),
    rindas: [
      { nos: 'Ilkņu garums',           pkt: p2(garPkt), formk: `(${gK}+${gL}) × 2` },
      { nos: 'Ilkņu apkārtmēri',       pkt: p2(apPkt),  formk: `(${aK}+${aL}) × 2` },
      { nos: `Šķel. leņķis (${lenkis}°)`, pkt: lenBoni, formk: 'bonifikācija' },
    ],
  }
}

export function aprKin(suga, dati) {
  switch (suga) {
    case 'staltbriedis': return aprKinStaltbriedis(dati)
    case 'stirnazis':    return aprKinStirnazis(dati)
    case 'alnis':        return aprKinAlnis(dati)
    case 'dambriedis':   return aprKinDambriedis(dati)
    case 'meza_kuilis':  return aprKinKuilis(dati)
    default: return null
  }
}
