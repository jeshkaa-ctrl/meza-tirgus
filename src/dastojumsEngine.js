// Curtis regresijas koeficienti h aprēķinam no d
const curtisA = {
  P: 3.8, E: 3.2, B: 4.1, A: 3.5,
  Ba: 3.0, Bl: 3.0, M: 3.3, Oz: 4.5, Os: 3.8, G: 3.5
}

// Formas faktori (veidakstumi) pa d klasēm katrai sugai
// V = π × (d/200)² × h × f
const formFactorByD = {
  P:  {8:0.55,12:0.52,16:0.50,20:0.48,24:0.47,28:0.46,32:0.45,36:0.44,40:0.44,44:0.43,48:0.43,52:0.42,56:0.42,60:0.42,64:0.41,68:0.41},
  E:  {8:0.57,12:0.54,16:0.52,20:0.50,24:0.49,28:0.48,32:0.47,36:0.46,40:0.46,44:0.45,48:0.45,52:0.44,56:0.44,60:0.43,64:0.43,68:0.43},
  B:  {8:0.58,12:0.55,16:0.53,20:0.51,24:0.50,28:0.49,32:0.48,36:0.47,40:0.47,44:0.46,48:0.46,52:0.45,56:0.45,60:0.44,64:0.44,68:0.44},
  A:  {8:0.54,12:0.51,16:0.49,20:0.47,24:0.46,28:0.45,32:0.44,36:0.43,40:0.43,44:0.42,48:0.42,52:0.41,56:0.41,60:0.41,64:0.40,68:0.40},
  Ba: {8:0.50,12:0.48,16:0.46,20:0.44,24:0.43,28:0.42,32:0.41,36:0.40,40:0.40,44:0.39,48:0.39,52:0.38,56:0.38,60:0.38,64:0.37,68:0.37},
  Bl: {8:0.50,12:0.48,16:0.46,20:0.44,24:0.43,28:0.42,32:0.41,36:0.40,40:0.40,44:0.39,48:0.39,52:0.38,56:0.38,60:0.38,64:0.37,68:0.37},
  M:  {8:0.52,12:0.50,16:0.48,20:0.46,24:0.45,28:0.44,32:0.43,36:0.42,40:0.42,44:0.41,48:0.41,52:0.40,56:0.40,60:0.40,64:0.39,68:0.39},
  Oz: {8:0.56,12:0.54,16:0.52,20:0.50,24:0.49,28:0.48,32:0.47,36:0.46,40:0.46,44:0.45,48:0.45,52:0.44,56:0.44,60:0.43,64:0.43,68:0.43},
  Os: {8:0.54,12:0.52,16:0.50,20:0.48,24:0.47,28:0.46,32:0.45,36:0.44,40:0.44,44:0.43,48:0.43,52:0.42,56:0.42,60:0.42,64:0.41,68:0.41},
  G:  {8:0.54,12:0.52,16:0.50,20:0.48,24:0.47,28:0.46,32:0.45,36:0.44,40:0.44,44:0.43,48:0.43,52:0.42,56:0.42,60:0.42,64:0.41,68:0.41},
}

// Aprēķina koka augstumu no d un vidējā audzes augstuma (Curtis formula)
export function calcH(d, hVid, suga) {
  const a = curtisA[suga] || 3.5
  if (!hVid || !d) return 0
  const h = 1.3 + (hVid - 1.3) / Math.pow(1 + a / d, 2) * Math.pow(1 + a / Math.sqrt(hVid * 10), 2)
  return Math.max(2, Math.round(h * 10) / 10)
}

// Aprēķina viena koka tilpumu
export function calcVolume(d, h, suga) {
  if (!d || !h) return 0
  const dClass = Math.round(d / 4) * 4
  const f = (formFactorByD[suga] || formFactorByD.P)[dClass] || 0.45
  return Math.PI * Math.pow(d / 200, 2) * h * f
}

// Sortimentu sadalījums pēc d klases un kvalitātes
export function calcSortiments(d, suga, kvalitate) {
  // Resni (d >= 24): zāģbaļķi + finieris
  // Vidēji (d 16-20): sīkbaļķi + tara  
  // Tievāki (d 8-12): papīrmalka
  // Malka: malka + šķelda
  
  if (kvalitate === "resni") {
    if (d >= 32) return {log: 0.65, veneer: 0.15, tara: 0.10, pulp: 0.05, fire: 0.03, chips: 0.02}
    if (d >= 24) return {log: 0.55, veneer: 0.10, tara: 0.15, pulp: 0.12, fire: 0.05, chips: 0.03}
    return {log: 0.40, tara: 0.25, pulp: 0.20, fire: 0.10, chips: 0.05}
  }
  if (kvalitate === "videj") {
    if (d >= 24) return {log: 0.40, tara: 0.25, pulp: 0.20, fire: 0.10, chips: 0.05}
    if (d >= 16) return {small: 0.35, tara: 0.25, pulp: 0.25, fire: 0.10, chips: 0.05}
    return {pulp: 0.60, fire: 0.25, chips: 0.15}
  }
  if (kvalitate === "tiev") {
    if (d >= 16) return {small: 0.25, tara: 0.20, pulp: 0.35, fire: 0.15, chips: 0.05}
    return {pulp: 0.55, fire: 0.30, chips: 0.15}
  }
  // malka
  return {fire: 0.70, chips: 0.30}
}

// Galvenā dastojuma aprēķina funkcija
export function calcDastojums(stavs, cenas) {
  const {suga, hVid, merijumi} = stavs
  // merijumi: [{d, resni, videj, tiev, malka}, ...]
  
  let kopaSkaits = 0
  let kopaKraja = 0
  const sortTotals = {log:0, small:0, veneer:0, tara:0, pulp:0, fire:0, chips:0}
  const rindas = []

  for (const row of merijumi) {
    const {d, resni=0, videj=0, tiev=0, malka=0} = row
    const h = calcH(d, hVid, suga)
    const volPerTree = calcVolume(d, h, suga)
    
    const kategorijas = [
      {n: resni, kval: "resni"},
      {n: videj, kval: "videj"},
      {n: tiev,  kval: "tiev"},
      {n: malka, kval: "malka"},
    ]
    
    let rindaKraja = 0
    const rindaSorts = {log:0, small:0, veneer:0, tara:0, pulp:0, fire:0, chips:0}
    
    for (const {n, kval} of kategorijas) {
      if (!n) continue
      const vol = volPerTree * n
      rindaKraja += vol
      kopaSkaits += n
      const sorts = calcSortiments(d, suga, kval)
      for (const [k, pct] of Object.entries(sorts)) {
        rindaSorts[k] = (rindaSorts[k] || 0) + vol * pct
        sortTotals[k] = (sortTotals[k] || 0) + vol * pct
      }
    }
    
    kopaKraja += rindaKraja
    const skaitsRinda = resni + videj + tiev + malka
    if (skaitsRinda > 0) {
      rindas.push({d, h, skaits: skaitsRinda, kraja: rindaKraja, sorts: rindaSorts})
    }
  }

  const lietkoksne = sortTotals.log + sortTotals.small + sortTotals.veneer + sortTotals.tara + sortTotals.pulp
  const malkaVol = sortTotals.fire + sortTotals.chips
  
  const vertiba = Object.entries(sortTotals).reduce((sum, [k, v]) => 
    sum + v * (cenas?.[k] || 0), 0)

  return {
    suga, hVid, kopaSkaits, kopaKraja,
    lietkoksne, malkaVol,
    sortTotals, vertiba, rindas
  }
}