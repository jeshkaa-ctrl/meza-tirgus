// Atlikumu faktori - zari, galotne, celms (nelikvīdā daļa)
// Likvīdā krāja = kopējā krāja × (1 - atlikas)
const atlikasFaktors = {
  P:  0.12,
  E:  0.13,
  B:  0.16,
  A:  0.18,
  Ba: 0.20,
  Bl: 0.20,
  M:  0.18,
  Oz: 0.14,
  Os: 0.15,
  G:  0.15,
}

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
  const isSkujkoks = ["P","E","Lg"].includes(suga)
  const isBerzs = suga === "B"
  const isApse = suga === "A"
  const isAlksnis = ["Ba","Bl","M"].includes(suga)
  const isOzols = suga === "Oz"
  const isOss = suga === "Os"
  const isGoba = suga === "G"

  if (kvalitate === "resni") {
    if (d >= 32) {
      if (isBerzs)    return {log:0.20, veneer:0.40, tara:0.20, pulp:0.15, fire:0.03, chips:0.02}
      if (isSkujkoks) return {log:0.65, small:0.15, pulp:0.12, fire:0.05, chips:0.03}
      if (isApse)     return {log:0.55, pulp:0.35, fire:0.07, chips:0.03}
      if (isAlksnis)  return {tara:0.45, fire:0.45, chips:0.10}
     if (isOzols)    return {log:0.70, tara:0.15, fire:0.12, chips:0.03}
      if (isOss)      return {log:0.65, tara:0.20, fire:0.12, chips:0.03}
      if (isGoba)     return {tara:0.65, fire:0.28, chips:0.07}
      return {log:0.55, small:0.15, tara:0.10, pulp:0.12, fire:0.05, chips:0.03}
    }
    if (d >= 24) {
      if (isBerzs)    return {log:0.10, veneer:0.30, tara:0.30, pulp:0.22, fire:0.05, chips:0.03}
      if (isSkujkoks) return {log:0.50, small:0.20, pulp:0.22, fire:0.05, chips:0.03}
      if (isApse)     return {log:0.45, pulp:0.42, fire:0.08, chips:0.05}
      if (isAlksnis)  return {tara:0.65, fire:0.28, chips:0.07}
      if (isOzols)    return {log:0.55, tara:0.25, fire:0.17, chips:0.03}
      if (isOss)      return {log:0.50, tara:0.28, fire:0.18, chips:0.04}
      if (isGoba)     return {tara:0.60, fire:0.32, chips:0.08}
      return {log:0.35, tara:0.20, pulp:0.30, fire:0.10, chips:0.05}
    }
    if (isSkujkoks) return {log:0.30, small:0.25, pulp:0.35, fire:0.07, chips:0.03}
    if (isApse)     return {log:0.20, pulp:0.60, fire:0.14, chips:0.06}
    if (isAlksnis)  return {tara:0.45, fire:0.45, chips:0.10}
    if (isOzols)    return {log:0.35, tara:0.30, fire:0.30, chips:0.05}
    if (isOss)      return {log:0.30, tara:0.32, fire:0.33, chips:0.05}
    if (isGoba)     return {tara:0.50, fire:0.40, chips:0.10}
    return {log:0.20, tara:0.20, pulp:0.45, fire:0.10, chips:0.05}
  }
  if (kvalitate === "videj") {
    if (d >= 24) {
      if (isSkujkoks) return {log:0.25, small:0.30, pulp:0.35, fire:0.07, chips:0.03}
      if (isBerzs)    return {veneer:0.15, tara:0.35, pulp:0.40, fire:0.07, chips:0.03}
      if (isApse)     return {pulp:0.75, fire:0.18, chips:0.07}
      if (isAlksnis)  return {tara:0.25, fire:0.65, chips:0.10}
      if (isOzols)    return {log:0.30, tara:0.35, fire:0.30, chips:0.05}
      if (isOss)      return {log:0.25, tara:0.38, fire:0.32, chips:0.05}
      if (isGoba)     return {tara:0.55, fire:0.35, chips:0.10}
      return {log:0.15, small:0.20, tara:0.20, pulp:0.35, fire:0.07, chips:0.03}
    }
    if (d >= 16) {
      if (isSkujkoks) return {small:0.45, pulp:0.42, fire:0.08, chips:0.05}
      if (isBerzs)    return {tara:0.40, pulp:0.45, fire:0.10, chips:0.05}
      if (isApse)     return {pulp:0.72, fire:0.20, chips:0.08}
      if (isAlksnis)  return {tara:0.30, fire:0.60, chips:0.10}
      if (isOzols)    return {tara:0.45, fire:0.45, chips:0.10}
      if (isOss)      return {tara:0.45, fire:0.45, chips:0.10}
      if (isGoba)     return {tara:0.45, fire:0.45, chips:0.10}
      return {small:0.25, tara:0.20, pulp:0.42, fire:0.08, chips:0.05}
    }
    // d < 16 — nav tara
   if (isAlksnis)              return {fire:0.82, chips:0.18}
    if (isBerzs)                return {pulp:0.65, fire:0.25, chips:0.10}
    if (isOzols || isOss || isGoba) return {fire:0.82, chips:0.18}
    return {pulp:0.60, fire:0.28, chips:0.12}
  }
 if (kvalitate === "tiev") {
    if (d >= 16) {
      if (isSkujkoks) return {small:0.30, pulp:0.55, fire:0.10, chips:0.05}
      if (isBerzs)    return {tara:0.20, pulp:0.60, fire:0.15, chips:0.05}
      if (isApse)     return {pulp:0.72, fire:0.20, chips:0.08}
      if (isAlksnis)  return {fire:0.80, chips:0.20}
      if (isOzols)    return {tara:0.30, fire:0.60, chips:0.10}
      if (isOss)      return {tara:0.30, fire:0.60, chips:0.10}
      if (isGoba)     return {tara:0.30, fire:0.60, chips:0.10}
      return {pulp:0.65, fire:0.25, chips:0.10}
    }
    if (isOzols || isOss || isGoba) return {tara:0.20, fire:0.70, chips:0.10}
    return {pulp:0.70, fire:0.20, chips:0.10}
  }
  return {fire:0.75, chips:0.25}
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

 const atlikas = atlikasFaktors[suga] || 0.15
  const likvida = kopaKraja * (1 - atlikas)
  const atlikasVol = kopaKraja * atlikas
  const lietkoksne = sortTotals.log + sortTotals.small + sortTotals.veneer + sortTotals.tara + sortTotals.pulp
  const malkaVol = sortTotals.fire + sortTotals.chips
  
  const vertiba = Object.entries(sortTotals).reduce((sum, [k, v]) => 
    sum + v * (cenas?.[k] || 0), 0)

  return {
    suga, hVid, kopaSkaits, kopaKraja,
    likvida, atlikasVol, atlikas,
    lietkoksne, malkaVol,
    sortTotals, vertiba, rindas
  }
}