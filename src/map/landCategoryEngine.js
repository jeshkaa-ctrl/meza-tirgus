// MK 384 — Meža apsaimniekošanas plāna kategoriju dzinējs
import { forestEngine } from '../forestEngine'
import { getBonitate }  from '../bonityEngine'
import { getVeidaugstums } from '../tables'

// ── Kategorijas ───────────────────────────────────────────────────────────────

export const KATEGORIJAS = {
  MA:  { nos: 'Mežaudze',                  grupa: 'mezs',  kraja: true,  ikona: '🌲' },
  IzA: { nos: 'Iznīkusi audze',            grupa: 'mezs',  kraja: true,  ikona: '🌪' },
  Izc: { nos: 'Izcirtums',                 grupa: 'mezs',  kraja: false, ikona: '🪵' },
  ML:  { nos: 'Meža lauce',                grupa: 'cita',  kraja: false, ikona: '🌿' },
  DBL: { nos: 'Dzīvnieku barošanas lauce', grupa: 'cita',  kraja: false, ikona: '🦌' },
  Vir: { nos: 'Virsājs',                   grupa: 'cita',  kraja: false, ikona: '🌾' },
  Sm:  { nos: 'Smiltājs',                  grupa: 'cita',  kraja: false, ikona: '🏜' },
  BA:  { nos: 'Bebru appludinājums',       grupa: 'cita',  kraja: false, ikona: '🦫' },
  PK:  { nos: 'Pārplūstošs klajums',       grupa: 'cita',  kraja: false, ikona: '💧' },
  Pu:  { nos: 'Purvs',                     grupa: 'cita',  kraja: false, ikona: '🪨' },
  Ce:  { nos: 'Ceļš',                      grupa: 'infra', kraja: false, ikona: '🛤' },
  Gr:  { nos: 'Grāvis',                    grupa: 'infra', kraja: false, ikona: '〰' },
  KvSt:{ nos: 'Kvartālstiga',              grupa: 'infra', kraja: false, ikona: '—'  },
  Kr:  { nos: 'Krautuve',                  grupa: 'infra', kraja: false, ikona: '📦' },
}

export const MEZA_TIPI = [
  { kods: 'Vr',  nos: 'Vr — Vēris'             },
  { kods: 'Dm',  nos: 'Dm — Damaksnis'          },
  { kods: 'Sl',  nos: 'Sl — Slapjais damaksnis' },
  { kods: 'Gs',  nos: 'Gs — Gārša'              },
  { kods: 'Ks',  nos: 'Ks — Kūdrājs'            },
  { kods: 'Lk',  nos: 'Lk — Liekns'             },
  { kods: 'Br',  nos: 'Br — Brūkleņu'           },
  { kods: 'Kl',  nos: 'Kl — Klāns'              },
]

export const BOJAJUMA_VEIDI = [
  'Vējgāze', 'Vējagrāve', 'Mizgrauži', 'Uguns',
  'Sniega lūzums', 'Sausums', 'Slimība', 'Cits',
]

export const SUGAS_OPCIJAS = [
  { kods: 'P',  nos: 'Priede'      },
  { kods: 'E',  nos: 'Egle'        },
  { kods: 'B',  nos: 'Bērzs'       },
  { kods: 'A',  nos: 'Apse'        },
  { kods: 'Oz', nos: 'Ozols'       },
  { kods: 'Os', nos: 'Osis'        },
  { kods: 'Bl', nos: 'Melnalksnis' },
  { kods: 'Ba', nos: 'Baltalksnis' },
  { kods: 'Lp', nos: 'Liepa'       },
]

// ── Aprēķins ──────────────────────────────────────────────────────────────────

export function aprēķināt(n) {
  if (!n) return { kraja: 0, krajaHa: 0, lēmums: '—', bonitate: '—', izcApjoms: 0 }
  const kat = KATEGORIJAS[n.kategorija]

  // Infrastruktūra un cita meža zeme — nav krājas
  if (!kat?.kraja) {
    let lēmums = '—'
    if (n.kategorija === 'Izc') {
      lēmums = `Meža atjaunošana${n.izcGads ? ` (izc. ${n.izcGads})` : ''}`
      if (n.izcAtjaunots) lēmums += ' ✓'
    } else if (kat) {
      lēmums = kat.nos
    }
    return { kraja: 0, krajaHa: 0, lēmums, bonitate: '—', izcApjoms: 0 }
  }

  // Iznīkusi audze
  if (n.kategorija === 'IzA') {
    const proc = parseFloat(n.bojajumsProc) || 0
    const lēmums = proc > 50
      ? `Sanitārā cirte — VMD atzinums (${n.bojajumsVeids || ''}${proc ? ` ${proc}%` : ''})`
      : `Iznīkusi audze — novērtēt atkārtoti`
    return { kraja: 0, krajaHa: 0, lēmums, bonitate: '—', izcApjoms: 0 }
  }

  // MA — pilns aprēķins
  const suga    = n.suga    || 'P'
  const vecums  = parseFloat(n.vecums)  || 0
  const h       = parseFloat(n.h)       || 0
  const g       = parseFloat(n.g)       || 0
  const d       = parseFloat(n.d)       || 0
  const platiba = parseFloat(n.platiba) || 0

  if (!vecums || !platiba) return { kraja: 0, krajaHa: 0, lēmums: '—', bonitate: '—', izcApjoms: 0 }

  // Bonitāte — no faktiskā H un vecuma
  let bonitate = n.bonitate || 'II'
  if (h > 0 && vecums > 10) {
    const bonAuto = getBonitate(suga, vecums, h)
    if (bonAuto) bonitate = bonAuto
  }

  // Krāja
  let krajaHa = 0
  if (g > 0 && h > 0) {
    const vAug = getVeidaugstums(h, suga)
    krajaHa = Math.round(g * vAug)
  }
  const kraja = Math.round(krajaHa * platiba)

  // Apsaimniekošanas lēmums
  let lēmums = '—'
  let izcApjoms = 0
  if (vecums > 10 && g > 0) {
    try {
      const rez = forestEngine({
        formula: `10${suga}`, vec: vecums, bon: bonitate,
        h, g, d: d || Math.round(h * 0.78), platiba,
        krm3ha: 0, harvestType: '', plantacija: false,
      })
      lēmums = rez.decision || '—'
      const lb = lēmums.toLowerCase()
      if (lb.includes('kailcirte') || lb.includes('galvenā cirte')) izcApjoms = kraja
      else if (lb.includes('kopšanas cirte')) izcApjoms = Math.round(kraja * 0.3)
    } catch { /* ignorē */ }
  }

  return { kraja, krajaHa, lēmums, bonitate, izcApjoms }
}

// ── Platību validācija ────────────────────────────────────────────────────────

export function validētPlatibas(nogabali, kadastraPlatiba) {
  const infra = ['Ce', 'Gr', 'KvSt', 'Kr']
  const summa = nogabali.reduce((s, n) => {
    if (infra.includes(n.kategorija)) return s
    return s + (parseFloat(n.platiba) || 0)
  }, 0)
  const starpiba = Math.abs(summa - kadastraPlatiba)
  return { summa: +summa.toFixed(2), starpiba: +starpiba.toFixed(2), ok: starpiba <= 0.3 }
}
