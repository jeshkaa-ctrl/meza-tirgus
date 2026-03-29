// Bonitātes noteikšana pēc sugas grupas, vecuma un augstuma
// 4. tabula — Audžu bonitātes

// Skuju koki + cietie lapu koki: P, E, Lg, Oz, Os, G
const bonitateSkuju = {
  10:  {Ia:[6,5],  I:[5,4],   II:[4,3],  III:[3,2], IV:[2,1]},
  20:  {Ia:[12,10],I:[9,8],   II:[7,6],  III:[6,5], IV:[4,3], V:[2,1]},
  30:  {Ia:[16,14],I:[12,13], II:[10,11],III:[9,8],  IV:[7,6], V:[5,4],  Va:[3,2]},
  40:  {Ia:[20,18],I:[17,15], II:[14,13],III:[12,10],IV:[9,8], V:[7,5],  Va:[4,3]},
  50:  {Ia:[24,21],I:[20,18], II:[17,15],III:[14,12],IV:[11,9],V:[8,6],  Va:[5,4]},
  60:  {Ia:[28,24],I:[23,20], II:[19,17],III:[16,14],IV:[13,11],V:[10,8],Va:[7,5]},
  70:  {Ia:[30,26],I:[26,22], II:[21,19],III:[18,16],IV:[15,12],V:[11,9],Va:[8,6]},
  80:  {Ia:[32,28],I:[27,24], II:[23,21],III:[20,17],IV:[16,14],V:[13,11],Va:[10,7]},
  90:  {Ia:[34,30],I:[29,26], II:[25,23],III:[22,19],IV:[18,15],V:[14,12],Va:[11,8]},
  100: {Ia:[35,31],I:[30,27], II:[26,24],III:[23,20],IV:[19,16],V:[15,13],Va:[12,9]},
  110: {Ia:[36,32],I:[31,29], II:[28,25],III:[24,21],IV:[20,17],V:[16,13],Va:[12,10]},
  120: {Ia:[38,34],I:[33,30], II:[29,26],III:[25,22],IV:[21,18],V:[17,14],Va:[13,10]},
  130: {Ia:[38,34],I:[33,30], II:[29,26],III:[25,22],IV:[21,18],V:[17,14],Va:[13,10]},
  140: {Ia:[39,35],I:[34,31], II:[30,27],III:[26,23],IV:[22,19],V:[18,14],Va:[13,10]},
  150: {Ia:[39,35],I:[34,31], II:[30,27],III:[26,23],IV:[22,19],V:[18,14],Va:[13,10]},
  160: {Ia:[40,36],I:[35,31], II:[30,27],III:[26,23],IV:[22,19],V:[18,14],Va:[13,10]},
}

// Mīkstie lapu koki: B, Bl, Ba, A, M
const bonitateLapu = {
  5:   {Ia:[5,5],  I:[4,4],   II:[3,3],  III:[2,2], IV:[1.5,1.5],V:[1,1]},
  10:  {Ia:[7,7],  I:[6,6],   II:[5,5],  III:[4,4], IV:[3,3],    V:[2,2],  Va:[1,1]},
  15:  {Ia:[11,11],I:[10,9],  II:[8,7],  III:[6,6], IV:[5,5],    V:[4,3],  Va:[2,1.5]},
  20:  {Ia:[14,14],I:[13,12], II:[11,10],III:[9,8],  IV:[7,6],   V:[5,4],  Va:[3,2]},
  25:  {Ia:[16,16],I:[15,13], II:[12,11],III:[10,9], IV:[8,7],   V:[6,5],  Va:[4,3]},
  30:  {Ia:[18,18],I:[17,16], II:[15,13],III:[12,11],IV:[10,8],  V:[7,6],  Va:[5,4]},
  35:  {Ia:[20,20],I:[19,17], II:[16,14],III:[13,12],IV:[11,10], V:[9,7],  Va:[6,5]},
  40:  {Ia:[21,21],I:[20,19], II:[18,16],III:[15,13],IV:[12,11], V:[10,8], Va:[7,5]},
  45:  {Ia:[23,23],I:[22,20], II:[19,17],III:[16,14],IV:[13,11.5],V:[11,8.5],Va:[8,5.5]},
  50:  {Ia:[25,25],I:[24,21], II:[20,18],III:[17,15],IV:[14,12], V:[11,8.5],Va:[8,6]},
  55:  {Ia:[26,26],I:[25,23], II:[22,19],III:[18,16],IV:[15,13], V:[12,9], Va:[8,6]},
  60:  {Ia:[27,27],I:[26,24], II:[23,20],III:[19,16.5],IV:[16,13.5],V:[13,9.5],Va:[9,6.5]},
  65:  {Ia:[28,28],I:[27,24.5],II:[24,21],III:[20,17],IV:[16,13.5],V:[13,10],Va:[9,7]},
  70:  {Ia:[28.5,28.5],I:[28,25],II:[24,21.5],III:[21,18],IV:[17,14],V:[13,10.5],Va:[10,7.5]},
  75:  {Ia:[29,29],I:[28,25.5],II:[25,22],III:[21,18.5],IV:[18,14.5],V:[14,11],Va:[10,8]},
  80:  {Ia:[30,30],I:[29,26], II:[25,23],III:[22,19],IV:[18,15],  V:[14,12],Va:[11,8.5]},
  85:  {Ia:[31,31],I:[30,27], II:[26,23.5],III:[23,20],IV:[19,15.5],V:[15,13],Va:[12,8.5]},
  90:  {Ia:[31,31],I:[30,27], II:[26,23.5],III:[23,20],IV:[19,15.5],V:[15,13],Va:[12,8.5]},
  100: {Ia:[31,31],I:[30,28], II:[27,24],III:[23,21],IV:[20,16],  V:[15,13],Va:[12,8.5]},
  110: {Ia:[32,32],I:[31.85,31.85],II:[28,25],III:[24,21],IV:[20,17],V:[16,13.5],Va:[13,9]},
  120: {Ia:[33,33],I:[32,29], II:[28,26],III:[25,22],IV:[21,18],  V:[17,13.5],Va:[13,9]},
}

const skujuSugas = ["P","E","Lg","Oz","Os","G"]
const lapuSugas  = ["B","Bl","Ba","A","M"]

export function getBonitate(suga, vecums, h) {
  const isSkuju = skujuSugas.includes(suga)
  const tabula = isSkuju ? bonitateSkuju : bonitateLapu

  // Noapaļo vecumu uz tuvāko tabulas rindu
  const vecumi = Object.keys(tabula).map(Number).sort((a,b)=>a-b)
  let tuvakaisVec = vecumi[0]
  for (const v of vecumi) {
    if (vecums >= v) tuvakaisVec = v
    else break
  }

  const rinda = tabula[tuvakaisVec]
  if (!rinda) return "II" // noklusējums

  // Pārbauda kurā bonitātē iekrīt augstums
  const bonOrder = ["Ia","I","II","III","IV","V","Va"]
  for (const bon of bonOrder) {
    const range = rinda[bon]
    if (!range) continue
    const [max, min] = range
    if (h >= min && h <= max) return bon
    if (bon === "Ia" && h > max) return "Ia"
  }
  return "Va"
}