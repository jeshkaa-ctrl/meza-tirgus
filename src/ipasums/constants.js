// VMD MVR sugas kodi — pārbaudīts pēc SHP un LVM GEO datiem
export const SUGAS_KARTE = {
  1:'Priede',      2:'Lapegle',     3:'Egle',        4:'Bērzs',
  5:'Melnalksnis', 6:'Baltalksnis', 7:'Goba',        8:'Apse',
  9:'Osis',        10:'Ozols',      11:'Liepa',       12:'Vītols',
  13:'Zemā priede',16:'Kļava',      19:'Papele',      21:'Robīnija',
  24:'Cita skujk.',32:'Cita lapk.',
}

export const SUGAS_KODS = {
  1:'P',  2:'Lg', 3:'E',  4:'B',
  5:'Bl', 6:'Ol', 7:'G',  8:'A',
  9:'Os', 10:'Oz',11:'Lp',12:'Vt',
  13:'Pm',16:'Kļ',19:'Pa', 21:'Rb',
  24:'Sk',32:'Lk',
}

export const SUGAS_KRASA = {
  1:'#d86010', 2:'#a06010', 3:'#6040a0', 4:'#2060c0',
  5:'#d03880', 6:'#e060a8', 7:'#a09060', 8:'#40a010',
  9:'#888800', 10:'#585858',11:'#e8d000',12:'#40b898',
  13:'#b06830',16:'#c0a000',19:'#60b060', 21:'#e0c090',
  24:'#906030',32:'#708060',
}

// LVM bonitātes kodi (bv10): 1=Ia, 2=I, 3=II, 4=III, 5=IV, 6=V
export const BONITATES = { 1:'Ia', 2:'I', 3:'II', 4:'III', 5:'IV', 6:'V' }

const VECUMA_ROBEZAS = {
  1:[20,40,80], 2:[20,40,80], 3:[20,40,80],
  4:[10,20,40], 5:[10,20,40], 6:[10,20,40],
  7:[20,40,80], 8:[10,20,40], 9:[10,20,40],
}

export function getVecumaGrupa(sugaKods, vecums) {
  const b = VECUMA_ROBEZAS[sugaKods] || [20, 40, 80]
  if (vecums <= b[0]) return 1
  if (vecums <= b[1]) return 2
  if (vecums <= b[2]) return 3
  return 4
}

export const NOGABALA_KRASA = {
  '1-1':'#ffd090','1-2':'#f49040','1-3':'#d86010','1-4':'#903008',
  '2-1':'#ffe080','2-2':'#e0a030','2-3':'#a06010','2-4':'#604010',
  '3-1':'#ddd0f0','3-2':'#9880c8','3-3':'#6040a0','3-4':'#2a0868',
  '4-1':'#b8d8f8','4-2':'#5090e0','4-3':'#2060c0','4-4':'#103080',
  '5-1':'#ffd8e8','5-2':'#ff80b0','5-3':'#d03880','5-4':'#781040',
  '6-1':'#ffe8f8','6-2':'#ffa8d8','6-3':'#e060a8','6-4':'#a02868',
  '7-1':'#d4c8b0','7-2':'#b8a880','7-3':'#a09060','7-4':'#806840',
  '10-1':'#c8c8c8','10-2':'#909090','10-3':'#585858','10-4':'#282828',
  '8-1':'#c0f0a0','8-2':'#70d040','8-3':'#40a010','8-4':'#205010',
  '9-1':'#e8e870','9-2':'#c0c020','9-3':'#888800','9-4':'#484800',
  '11-1':'#fffff0','11-2':'#ffff60','11-3':'#e8d000','11-4':'#a09000',
}

export const SORT_KRASA = {
  log:'#2e7d32', small:'#4caf50', veneer:'#fbbf24',
  tara:'#f97316', pulp:'#64748b', fire:'#ef4444', chips:'#92400e',
}

export const SORT_NOS = {
  log:    'Zāģbaļķis',
  small:  'Sīkbaļķis',
  veneer: 'Finieris',
  tara:   'Lapkoku tara',
  stara:  'Skujkoku tara',
  gulsnis:'Gūlsnis',
  pulp:   'Papīrmalka',
  fire:   'Malka',
  chips:  'Šķelda',
}

export const SORT_CENAS = { log:93, small:65, veneer:130, tara:48, stara:65, gulsnis:80, pulp:50, fire:38, chips:15 }

export const AIZSARDZIBA = {
  dabas_liegums:     { cirte:'aizliegta',  label:'🔴 Cirte aizliegta'        },
  biosfera_pamata:   { cirte:'ierobežota', label:'🟠 Ierobežota cirte'        },
  biosfera_neutrala: { cirte:'kopsana',    label:'🟡 Kopšanas cirte atļauta'  },
  aizsargjosla:      { cirte:'ierobežota', label:'🟠 Ierobežota cirte'        },
  mikroliegums:      { cirte:'aizliegta',  label:'🔴 Cirte aizliegta'        },
  nav:               { cirte:'briva',      label:'🟢 Nav ierobežojumu'        },
}

export function getLemumKrasa(lemums) {
  if (!lemums || lemums === '—') return '#757575'
  if (lemums === 'Cirte aizliegta')             return '#c62828'
  if (lemums.includes('Nav mežaudzes'))         return '#4a4a4a'
  if (lemums.includes('ierobežot'))             return '#e65100'
  if (lemums.includes('Kopšanas'))              return '#f9a825'
  if (lemums.includes('Necērtams') || lemums.includes('Jaunaudze')) return '#757575'
  if (lemums.includes('caurmēra'))              return '#42a5f5'
  if (lemums.includes('Kailcirte') || lemums.includes('Galvenā cirte')) return '#2e7d32'
  return '#4caf50'
}

export function getAizsardzibaStatus(features) {
  if (!features?.length) return AIZSARDZIBA.nav
  const prioritate = ['aizliegta', 'ierobežota', 'kopsana', 'briva']
  let labakais = AIZSARDZIBA.nav
  for (const f of features) {
    const tips = ((f.properties?.kategorija || f.properties?.tips || f.properties?.type || '')
      .toLowerCase().replace(/ /g, '_'))
    const rule = AIZSARDZIBA[tips]
    if (rule && prioritate.indexOf(rule.cirte) < prioritate.indexOf(labakais.cirte)) {
      labakais = rule
    }
  }
  return labakais
}
