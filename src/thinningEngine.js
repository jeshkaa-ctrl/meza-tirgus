import {speciesPriority, GminTable} from "./tables"

function getGmin(row){
const h = Math.min(Math.max(Math.round(row.h), 12), 35)
const m = row.formula?.match(/(\d+)(Bl|Ba|Oz|Os|P|E|B|A|M|G)/g) || []
let max = 0; let sp = "P"
m.forEach(x => {
const raw = parseInt(x.match(/\d+/)[0])
const pct = raw <= 10 ? raw*10 : raw
const s = x.match(/[A-Za-z]+/)[0]
if(pct > max){ max = pct; sp = s }
})
const col = ["P"].includes(sp) ? "P" :
["E"].includes(sp) ? "E" :
["B"].includes(sp) ? "B" :
["A","Ba","Bl","M"].includes(sp) ? "A" :
["Oz","G"].includes(sp) ? "Oz" :
["Os"].includes(sp) ? "Os" : "P"
return GminTable[h]?.[col] || 18
}

export function thinningDecision(row){
const matches = row.formula?.match(/(\d+)(Bl|Ba|Oz|Os|P|E|B|A|M|G)/g)
let sp = null
let max = 0
let speciesList = []

if(matches){
matches.forEach(m=>{
const rawPercent = parseInt(m.match(/\d+/)[0])
const percent = rawPercent <= 10 ? rawPercent * 10 : rawPercent
const species = m.match(/[A-Za-z]+/)[0]
speciesList.push({species, percent})
if(percent > max){ max = percent; sp = species }
})
}

if(row.h < 10) return "Jaunaudze"
if(row.h < 12) return "Necērtams"

const aPercent = speciesList.find(s=>s.species==="A")?.percent || 0
const baPercent = (speciesList.find(s=>s.species==="Ba")?.percent || 0) +
(speciesList.find(s=>s.species==="Bl")?.percent || 0)

if((aPercent >= 80 || baPercent >= 80) && !["P","E","B"].includes(sp)){
return "Necērtams"
}

const hasValuable = speciesList.some(s=>["P","E","B"].includes(s.species))
const minGval = getGmin(row)

if(hasValuable && (aPercent > 0 || baPercent > 0)){
if(row.h >= 15 && row.g > minGval) return "Kopšanas cirte"
if(row.h >= 10 && row.g > minGval) return "Kopšana nerentabla"
}

if(["P","E","B"].includes(sp)){
if(row.g <= minGval) return "Necērtams"
if(row.bon === "Ia" || row.bon === "I"){
if(row.h >= 12 && row.d >= 12) return "Kopšanas cirte"
}
if(row.h >= 15 && row.d >= 12) return "Kopšanas cirte"
return "Kopšana nerentabla"
}

return "Necērtams"
}

export function thinningSpecies(formula){
const matches=formula.match(/(\d+)(Bl|Ba|Oz|Os|P|E|B|A|M|G)/g)
if(!matches) return []
let species=[]
matches.forEach(m=>{
const rawPercent=parseInt(m.match(/\d+/)[0])
const percent=rawPercent<=10 ? rawPercent*10 : rawPercent
const sp=m.match(/[A-Za-z]+/)[0]
species.push({species:sp,percent})
})
species.sort((a,b)=>{
return speciesPriority.indexOf(b.species) - speciesPriority.indexOf(a.species)
})
return species
}

export function thinningRemoveG(row){
if(row.g > 100) return 0
const minG = getGmin(row)
if(row.g <= minG) return 0
return row.g - minG
}