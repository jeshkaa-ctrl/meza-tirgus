// Sortimentu sadalījums pēc sugas un kvalitātes klases
// Klases: A1, A, B, C, D, Malka
export const papirmalkaKlase = {
  P:  {log:0, veneer:0, tara:0, pulp:0.85, fire:0,    chips:0.15},
  E:  {log:0, veneer:0, tara:0, pulp:0.85, fire:0,    chips:0.15},
  Lg: {log:0, veneer:0, tara:0, pulp:0.85, fire:0,    chips:0.15},
  B:  {log:0, veneer:0, tara:0, pulp:0.85, fire:0,    chips:0.15},
  A:  {log:0, veneer:0, tara:0, pulp:0.85, fire:0,    chips:0.15},
  Ba: {log:0, veneer:0, tara:0, pulp:0,    fire:0.85, chips:0.15},
  Bl: {log:0, veneer:0, tara:0, pulp:0,    fire:0.85, chips:0.15},
  M:  {log:0, veneer:0, tara:0, pulp:0,    fire:0.85, chips:0.15},
  Oz: {log:0, veneer:0, tara:0, pulp:0,    fire:0.85, chips:0.15},
  Os: {log:0, veneer:0, tara:0, pulp:0,    fire:0.85, chips:0.15},
  G:  {log:0, veneer:0, tara:0, pulp:0,    fire:0.85, chips:0.15},
}
export const qualitySortiments = {
  P: {
    A1:   {log:0.92, small:0,    veneer:0,    tara:0,    pulp:0.05, fire:0,    chips:0.03},
    A:    {log:0.78, small:0,    veneer:0,    tara:0,    pulp:0.18, fire:0,    chips:0.04},
    B:    {log:0.52, small:0,    veneer:0,    tara:0,    pulp:0.42, fire:0,    chips:0.06},
    C:    {log:0.18, small:0,    veneer:0,    tara:0,    pulp:0.74, fire:0,    chips:0.08},
    D:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0.88, fire:0,    chips:0.12},
    Malka:{log:0,    small:0,    veneer:0,    tara:0,    pulp:0,    fire:0.85, chips:0.15},
  },
  E: {
    A1:   {log:0.82, small:0,    veneer:0,    tara:0,    pulp:0.14, fire:0,    chips:0.04},
    A:    {log:0.68, small:0,    veneer:0,    tara:0,    pulp:0.26, fire:0,    chips:0.06},
    B:    {log:0.44, small:0,    veneer:0,    tara:0,    pulp:0.48, fire:0,    chips:0.08},
    C:    {log:0.14, small:0,    veneer:0,    tara:0,    pulp:0.76, fire:0,    chips:0.10},
    D:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0.82, fire:0,    chips:0.18},
    Malka:{log:0,    small:0,    veneer:0,    tara:0,    pulp:0,    fire:0.85, chips:0.15},
  },
  Lg: {
    A1:   {log:0.82, small:0,    veneer:0,    tara:0,    pulp:0.14, fire:0,    chips:0.04},
    A:    {log:0.68, small:0,    veneer:0,    tara:0,    pulp:0.26, fire:0,    chips:0.06},
    B:    {log:0.44, small:0,    veneer:0,    tara:0,    pulp:0.48, fire:0,    chips:0.08},
    C:    {log:0.14, small:0,    veneer:0,    tara:0,    pulp:0.76, fire:0,    chips:0.10},
    D:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0.82, fire:0,    chips:0.18},
    Malka:{log:0,    small:0,    veneer:0,    tara:0,    pulp:0,    fire:0.85, chips:0.15},
  },
  B: {
    A1:   {log:0.20, small:0,    veneer:0.45, tara:0.20, pulp:0.12, fire:0,    chips:0.03},
    A:    {log:0.25, small:0,    veneer:0.25, tara:0.25, pulp:0.22, fire:0,    chips:0.03},
    B:    {log:0.20, small:0,    veneer:0,    tara:0.30, pulp:0.42, fire:0,    chips:0.08},
    C:    {log:0,    small:0,    veneer:0,    tara:0.20, pulp:0.68, fire:0,    chips:0.12},
    D:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0.78, fire:0,    chips:0.22},
    Malka:{log:0,    small:0,    veneer:0,    tara:0,    pulp:0,    fire:0.85, chips:0.15},
  },
  Ba: {
    A1:   {log:0,    small:0,    veneer:0,    tara:0.50, pulp:0.30, fire:0.15, chips:0.05},
    A:    {log:0,    small:0,    veneer:0,    tara:0.35, pulp:0.40, fire:0.20, chips:0.05},
    B:    {log:0,    small:0,    veneer:0,    tara:0.15, pulp:0.50, fire:0.28, chips:0.07},
    C:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0.55, fire:0.35, chips:0.10},
    D:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0,    fire:0.70, chips:0.30},
    Malka:{log:0,    small:0,    veneer:0,    tara:0,    pulp:0,    fire:0.85, chips:0.15},
  },
  Bl: {
    A1:   {log:0,    small:0,    veneer:0,    tara:0.25, pulp:0.40, fire:0.28, chips:0.07},
    A:    {log:0,    small:0,    veneer:0,    tara:0.10, pulp:0.50, fire:0.32, chips:0.08},
    B:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0.55, fire:0.35, chips:0.10},
    C:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0.45, fire:0.42, chips:0.13},
    D:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0,    fire:0.75, chips:0.25},
    Malka:{log:0,    small:0,    veneer:0,    tara:0,    pulp:0,    fire:0.85, chips:0.15},
  },
  A: {
    A1:   {log:0.60, small:0,    veneer:0,    tara:0,    pulp:0.35, fire:0,    chips:0.05},
    A:    {log:0.35, small:0,    veneer:0,    tara:0,    pulp:0.58, fire:0,    chips:0.07},
    B:    {log:0.10, small:0,    veneer:0,    tara:0,    pulp:0.80, fire:0,    chips:0.10},
    C:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0.82, fire:0,    chips:0.18},
    D:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0.60, fire:0.25, chips:0.15},
    Malka:{log:0,    small:0,    veneer:0,    tara:0,    pulp:0,    fire:0.85, chips:0.15},
  },
  Oz: {
    A1:   {log:0.70, small:0,    veneer:0,    tara:0,    pulp:0.20, fire:0.08, chips:0.02},
    A:    {log:0.50, small:0,    veneer:0,    tara:0,    pulp:0.30, fire:0.16, chips:0.04},
    B:    {log:0.25, small:0,    veneer:0,    tara:0,    pulp:0.45, fire:0.24, chips:0.06},
    C:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0.50, fire:0.40, chips:0.10},
    D:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0,    fire:0.75, chips:0.25},
    Malka:{log:0,    small:0,    veneer:0,    tara:0,    pulp:0,    fire:0.85, chips:0.15},
  },
  Os: {
    A1:   {log:0.65, small:0,    veneer:0,    tara:0,    pulp:0.25, fire:0.08, chips:0.02},
    A:    {log:0.45, small:0,    veneer:0,    tara:0,    pulp:0.35, fire:0.16, chips:0.04},
    B:    {log:0.20, small:0,    veneer:0,    tara:0,    pulp:0.50, fire:0.24, chips:0.06},
    C:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0.52, fire:0.38, chips:0.10},
    D:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0,    fire:0.75, chips:0.25},
    Malka:{log:0,    small:0,    veneer:0,    tara:0,    pulp:0,    fire:0.85, chips:0.15},
  },
  G: {
    A1:   {log:0.65, small:0,    veneer:0,    tara:0,    pulp:0.25, fire:0.08, chips:0.02},
    A:    {log:0.45, small:0,    veneer:0,    tara:0,    pulp:0.35, fire:0.16, chips:0.04},
    B:    {log:0.20, small:0,    veneer:0,    tara:0,    pulp:0.50, fire:0.24, chips:0.06},
    C:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0.52, fire:0.38, chips:0.10},
    D:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0,    fire:0.75, chips:0.25},
    Malka:{log:0,    small:0,    veneer:0,    tara:0,    pulp:0,    fire:0.85, chips:0.15},
  },
  M: {
    A1:   {log:0,    small:0,    veneer:0,    tara:0.20, pulp:0.40, fire:0.32, chips:0.08},
    A:    {log:0,    small:0,    veneer:0,    tara:0.10, pulp:0.45, fire:0.35, chips:0.10},
    B:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0.50, fire:0.38, chips:0.12},
    C:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0.42, fire:0.45, chips:0.13},
    D:    {log:0,    small:0,    veneer:0,    tara:0,    pulp:0,    fire:0.75, chips:0.25},
    Malka:{log:0,    small:0,    veneer:0,    tara:0,    pulp:0,    fire:0.85, chips:0.15},
  },
}

export function calcSortimentsByQuality(volume, suga, kvalitate, d=0) {
  if(kvalitate === "Papīrmalka") {
    const klase = papirmalkaKlase[suga] || papirmalkaKlase["P"]
    const result = {}
    Object.keys(klase).forEach(k => { result[k] = volume * klase[k] })
    return result
  }
  const sugas = qualitySortiments[suga] || qualitySortiments["P"]
  const klase = sugas[kvalitate] || sugas["C"]
  const result = {}
  Object.keys(klase).forEach(k => { result[k] = volume * klase[k] })

  // Ja D < 18cm — nav zāģbaļķu un finieru, pārdale uz papīrmalku/šķeldu
  if(d > 0 && d < 18) {
    const noLog = (result.log||0) + (result.veneer||0) + (result.tara||0)
    result.log = 0
    result.veneer = 0
    result.tara = d >= 12 ? noLog * 0.4 : 0
    result.pulp = (result.pulp||0) + noLog * (d >= 12 ? 0.45 : 0.75)
    result.chips = (result.chips||0) + noLog * (d >= 12 ? 0.15 : 0.25)
  }

  return result
}