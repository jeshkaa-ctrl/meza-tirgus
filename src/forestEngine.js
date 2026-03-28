import {formFactor, rotationAge, minDiameter} from "./tables"
import {thinningDecision, thinningRemoveG} from "./thinningEngine"

const speciesPriority = ["Ba","Bl","A","M","G","B","E","P","Oz","Os"]

function parseFormula(formula){
if(!formula) return []
const matches = formula.match(/(\d+)(Bl|Ba|Oz|Os|P|E|B|A|M|G)/g)
if(!matches) return []
let species=[]
matches.forEach(m=>{
const rawPercent=parseInt(m.match(/\d+/)[0])
const percent=rawPercent<=10 ? rawPercent*10 : rawPercent
const sp=m.match(/[A-Za-z]+/)[0]
species.push({species:sp,percent:percent})
})
return species
}

function dominantSpecies(formula){
const list=parseFormula(formula)
let max=0
let dom=""
list.forEach(s=>{
if(s.percent>max){max=s.percent;dom=s.species}
})
return dom
}

function calcTreeCount(G,D){
if(!G || !D) return 0
const d=D/100
return (4*G)/(Math.PI*d*d)
}

function normalTreeCount(H){
if(H<10) return 3000
if(H<15) return 2000
if(H<20) return 1200
if(H<25) return 800
return 600
}

function calcSortiments(volume,decision,row){
const D=row.d
const sp=dominantSpecies(row.formula)
const age=row.vec

let stage="young"
if(D>=24 || age>=70){stage="mature"}
else if(D>=16){stage="middle"}

if(decision==="Kopšanas cirte"){
if(sp==="Ba"||sp==="Bl"||sp==="M"){
return{log:0,small:0,veneer:0,tara:volume*0.30,pulp:0,fire:volume*0.60,chips:volume*0.10}
}
if(sp==="A"){
return{log:0,small:0,veneer:0,tara:0,pulp:volume*0.70,fire:volume*0.20,chips:volume*0.10}
}
if(sp==="G"){
return{log:0,small:0,veneer:0,tara:0,pulp:0,fire:volume*0.70,chips:volume*0.30}
}
if(sp==="B"){
return{log:0,small:0,veneer:0,tara:0,pulp:volume*0.85,fire:volume*0.10,chips:volume*0.05}
}
if(sp==="P"||sp==="E"){
if(D<18){
return{log:0,small:0,veneer:0,tara:0,pulp:volume*0.85,fire:volume*0.15,chips:0}
}
if(D<26){
return{log:volume*0.15,small:volume*0.20,veneer:0,tara:0,pulp:volume*0.50,fire:volume*0.10,chips:volume*0.05}
}
return{log:volume*0.25,small:volume*0.35,veneer:0,tara:0,pulp:volume*0.30,fire:volume*0.07,chips:volume*0.03}
}
return{log:0,small:0,veneer:0,tara:0,pulp:volume*0.80,fire:volume*0.15,chips:volume*0.05}
}

if(sp==="Ba"||sp==="Bl"||sp==="M"){
return{log:0,small:0,veneer:0,tara:volume*0.45,pulp:volume*0.10,fire:volume*0.40,chips:volume*0.05}
}

if(sp==="G"){
return{log:0,small:0,veneer:0,tara:volume*0.20,pulp:volume*0.10,fire:volume*0.55,chips:volume*0.15}
}

if(sp==="A"){
if(D>=18){
return{log:0,small:0,veneer:0,tara:volume*0.35,pulp:volume*0.45,fire:volume*0.15,chips:volume*0.05}
}
return{log:0,small:0,veneer:0,tara:0,pulp:volume*0.75,fire:volume*0.15,chips:volume*0.10}
}

if(sp==="Oz"||sp==="Os"){
if(D>=30){
return{log:volume*0.55,small:volume*0.20,veneer:0,tara:volume*0.10,pulp:volume*0.10,fire:volume*0.03,chips:volume*0.02}
}
if(D>=20){
return{log:volume*0.40,small:volume*0.25,veneer:0,tara:volume*0.15,pulp:volume*0.15,fire:volume*0.03,chips:volume*0.02}
}
return{log:0,small:volume*0.30,veneer:0,tara:0,pulp:volume*0.55,fire:volume*0.10,chips:volume*0.05}
}

if(sp==="B"){
if(D>=18){
if(age>80){
return{log:volume*0.20,small:volume*0.15,veneer:volume*0.08,tara:volume*0.35,pulp:volume*0.15,fire:volume*0.05,chips:volume*0.02}
}
if(row.bon==="Ia"||row.bon==="I"){
return{log:volume*0.10,small:volume*0.10,veneer:volume*0.30,tara:volume*0.25,pulp:volume*0.20,fire:volume*0.03,chips:volume*0.02}
}
return{log:volume*0.10,small:volume*0.10,veneer:volume*0.15,tara:volume*0.30,pulp:volume*0.25,fire:volume*0.07,chips:volume*0.03}
}
return{log:0,small:0,veneer:0,tara:0,pulp:volume*0.85,fire:volume*0.10,chips:volume*0.05}
}

if(stage==="mature"){
return{log:volume*0.55,small:volume*0.22,veneer:0,tara:volume*0.03,pulp:volume*0.12,fire:volume*0.05,chips:volume*0.03}
}

if(D<18){return{log:0,small:0,veneer:0,tara:0,pulp:volume*0.85,fire:volume*0.10,chips:volume*0.05}}
if(D<26){return{log:volume*0.35,small:volume*0.20,veneer:0,tara:volume*0.10,pulp:volume*0.25,fire:volume*0.07,chips:volume*0.03}}
if(D<34){return{log:volume*0.50,small:volume*0.20,veneer:0,tara:volume*0.10,pulp:volume*0.12,fire:volume*0.05,chips:volume*0.03}}
return{log:volume*0.60,small:volume*0.20,veneer:0,tara:volume*0.08,pulp:volume*0.07,fire:volume*0.03,chips:volume*0.02}
}

function decisionEngine(row){
const sp=dominantSpecies(row.formula)

if((sp==="Ba"||sp==="Bl") && row.vec>=20 && row.h>=12){
return "Galvenā cirte (vecums)"
}

if(row.plantacija && (sp==="E"||sp==="P") && row.h>=12 && row.g>0){
return "Kopšanas cirte"
}

const rot=rotationAge[sp]?.[row.bon]
const minD=minDiameter[sp]?.[row.bon]
if(rot && row.vec>=rot){return "Galvenā cirte (vecums)"}
if(minD && row.d>=minD){return "Galvenā cirte (caurmērs)"}
return thinningDecision(row)
}

export function forestEngine(row){

const speciesList=parseFormula(row.formula)
speciesList.sort((a,b)=>{
return speciesPriority.indexOf(a.species)-speciesPriority.indexOf(b.species)
})

const decision = row.harvestType && row.harvestType !== "" ? row.harvestType : decisionEngine(row)
if(decision==="Kailcirte"){
const sp=dominantSpecies(row.formula)
const F=formFactor[sp]||0.5
const totalVol=row.g*row.h*F*row.platiba
const sortiments=calcSortiments(totalVol,"Kailcirte",row)
const prices={log:93,small:65,veneer:130,tara:48,pulp:50,fire:38,chips:15}
let cutVal=0
Object.keys(sortiments).forEach(k=>{cutVal+=(sortiments[k]||0)*(prices[k]||0)})
const costs=totalVol*30
const stumpage=cutVal-costs
return{
decision:"Kailcirte",
volume:totalVol,
cutVolume:totalVol,
sortiments:sortiments,
economicValue:cutVal,
marketValue:stumpage,
stumpageValue:stumpage,
cutValue:cutVal
}
}
if(decision==="Necērtams"){
return{
decision:decision,
volume:(row.krm3ha||0)*row.platiba,
cutVolume:0,
sortiments:{log:0,small:0,veneer:0,tara:0,pulp:0,fire:0,chips:0},
economicValue:0,marketValue:0,stumpageValue:0,cutValue:0
}
}

if(decision==="Jaunaudze"){
const totalInventoryVolume=(row.krm3ha||0)*row.platiba

if(row.plantacija){
const sp = dominantSpecies(row.formula)
const F = formFactor[sp] || 0.5
const calcVol = row.g * row.h * F * row.platiba
const plantVolume = calcVol > 0 ? calcVol : totalInventoryVolume

if(sp==="Ba" || sp==="Bl"){
const bon = row.bon
const D = row.d
const isGood = bon==="Ia" || bon==="I"
let fireRatio, chipsRatio, taraRatio
if(isGood && D>=18){
fireRatio=0.60; taraRatio=0.30; chipsRatio=0.10
} else if(isGood && D<18){
fireRatio=0.70; taraRatio=0.00; chipsRatio=0.30
} else if(!isGood && D>=18){
fireRatio=0.65; taraRatio=0.20; chipsRatio=0.15
} else {
fireRatio=0.75; taraRatio=0.00; chipsRatio=0.25
}
const fireVol  = plantVolume * fireRatio
const chipsVol = plantVolume * chipsRatio
const taraVol  = plantVolume * taraRatio
const cutVal   = fireVol*38 + chipsVol*15 + taraVol*48
const costs    = plantVolume * 30
const stumpage = cutVal - costs
return{
decision:"Kailcirte",
volume:plantVolume,
cutVolume:plantVolume,
sortiments:{log:0,small:0,veneer:0,tara:taraVol,pulp:0,fire:fireVol,chips:chipsVol},
economicValue:cutVal,
marketValue:stumpage,
stumpageValue:stumpage,
cutValue:cutVal
}
}

if(row.h < 12 || row.g === 0){
return{
decision:"Plantācija",
volume:plantVolume,
cutVolume:0,
sortiments:{log:0,small:0,veneer:0,tara:0,pulp:0,fire:0,chips:0},
economicValue:plantVolume*50,
marketValue:plantVolume*50,
stumpageValue:0,
cutValue:0
}
}
}

if(!row.plantacija){
return{
decision:"Jaunaudze",
volume:totalInventoryVolume,
cutVolume:0,
sortiments:{log:0,small:0,veneer:0,tara:0,pulp:0,fire:0,chips:0},
value:0
}
}
}

let totalVolume=0
let remainingG=0

if(decision==="Kopšanas cirte"){
remainingG=thinningRemoveG(row)
}

let speciesVolumes=[]
let loopSpecies=[...speciesList]

if(decision==="Kopšanas cirte"){
const priority=["Ba","Bl","A","M","G","B","E","P","Oz","Os"]
loopSpecies.sort((a,b)=>{
return priority.indexOf(a.species)-priority.indexOf(b.species)
})
}

loopSpecies.forEach(s=>{
const speciesG=row.g*(s.percent/100)
let G=speciesG
let cutG=speciesG

if(decision==="Kopšanas cirte"){
const removeG=Math.min(speciesG,remainingG)
remainingG-=removeG
cutG=removeG
}

const F=formFactor[s.species] || 0.5
const speciesAge=(row.speciesAges && row.speciesAges[s.species]) ? row.speciesAges[s.species] : row.vec
const volumeHaFull=row.g*(s.percent/100)*row.h*F
const volumeHaCut=decision==="Kopšanas cirte" ? (G>0 ? volumeHaFull*(cutG/G) : 0) : volumeHaFull

const fullVolume=volumeHaFull*row.platiba
const cutVolume=volumeHaCut*row.platiba
totalVolume+=fullVolume

speciesVolumes.push({species:s.species,volume:cutVolume,age:speciesAge})
})

let sortiments={log:0,small:0,veneer:0,tara:0,pulp:0,fire:0,chips:0}

speciesVolumes.forEach(s=>{
const rowCopy={...row,formula:"1"+s.species,vec:s.age}
const part=calcSortiments(s.volume,decision,rowCopy)
Object.keys(sortiments).forEach(k=>{
sortiments[k]+=part[k]||0
})
})

const prices={log:93,small:65,veneer:130,tara:48,pulp:50,fire:38,chips:15}

let cutValue=0
Object.keys(sortiments).forEach(k=>{
cutValue+=(sortiments[k]||0)*(prices[k]||0)
})

const remainingVolume=totalVolume-speciesVolumes.reduce((sum,s)=>sum+s.volume,0)
const remainingValue=remainingVolume*35
const economicValue=cutValue+remainingValue

if(decision==="Kopšanas cirte"){
const rotation=rotationAge[dominantSpecies(row.formula)]?.[row.bon]
if(rotation){
const maturity=row.vec/rotation
if(maturity>=0.75){
const factor=(maturity-0.75)*2
const potentialVolume=totalVolume*factor
cutValue+=potentialVolume*35
}
}
}

const harvestCost=18
const forwardCost=12
const costPerM3=harvestCost+forwardCost
const cutVolumeTotal=speciesVolumes.reduce((sum,s)=>sum+s.volume,0)
const harvestingCosts=cutVolumeTotal*costPerM3
const stumpageValue=cutValue-harvestingCosts
const marketValue=stumpageValue

return{
decision:decision,
volume:totalVolume,
cutVolume:cutVolumeTotal,
sortiments:sortiments,
economicValue:economicValue,
marketValue:marketValue,
stumpageValue:stumpageValue,
cutValue:cutValue
}
}