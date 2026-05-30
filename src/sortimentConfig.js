// Kopīga sortimentu konfigurācija — lieto CirsmaNovertesanaPage un DastojumsPanel
// Visas cenas ir €/m³, pielāgojamas katrā lapā atsevišķi

export const SORT_KEYS = [
  "log", "small", "veneer", "tara", "stara", "gulsnis",
  "pulp", "fire", "chips"
]

export const SORT_NAMES = {
  log:    "Zāģbaļķis",
  small:  "Sīkbaļķis",
  veneer: "Finieris",
  tara:   "Lapkoku tara",
  stara:  "Skujkoku tara",
  gulsnis:"Gūlsnis",
  pulp:   "Papīrmalka",
  fire:   "Malka",
  chips:  "Šķelda",
}

// Noklusētās tirgus cenas (€/m³) — lietotājs var mainīt
export const DEFAULT_PRICES = {
  log:    93,
  small:  65,
  veneer: 130,
  tara:   48,
  stara:  65,
  gulsnis:80,
  pulp:   50,
  fire:   38,
  chips:  12,
}

// Palīgfunkcija — aprēķina kopējo vērtību pēc sortimentiem un cenām
// sortimenti: { log: m3, small: m3, ... }
// prices: { log: €, small: €, ... } + papildu pielāgotie sortimenti
export function calcVertiba(sortimenti, prices) {
  let sum = 0
  const allKeys = new Set([...Object.keys(sortimenti), ...Object.keys(prices)])
  allKeys.forEach(k => {
    sum += (sortimenti[k] || 0) * (prices[k] || 0)
  })
  return sum
}

// Palīgfunkcija — summē sortimentu objektu sarakstu
export function sumSortimenti(saraksts) {
  const t = {}
  SORT_KEYS.forEach(k => { t[k] = 0 })
  saraksts.forEach(s => {
    Object.keys(s).forEach(k => { t[k] = (t[k] || 0) + (s[k] || 0) })
  })
  return t
}
