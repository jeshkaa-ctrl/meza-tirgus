import { useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { forestEngine } from "./forestEngine"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
"pdfjs-dist/build/pdf.worker.min.mjs",
import.meta.url
).toString()

function StandardPage({onBack, onPilna}){
const [rows, setRows] = useState([])
const [izcirtumi, setIzcirtumi] = useState([])
const [jaunaudzes, setJaunaudzes] = useState([])
const [kadastrs, setKadastrs] = useState("")
const [saimnieciba, setSaimnieciba] = useState("")

const handlePDF = async(event) => {
  const file = event.target.files[0]
  if(!file) return
  const reader = new FileReader()
  reader.onload = async function(){
    const typedArray = new Uint8Array(this.result)
    const pdf = await pdfjsLib.getDocument(typedArray).promise
    let fullText = ""
    for(let page=1; page<=pdf.numPages; page++){
      const pageData = await pdf.getPage(page)
      const textContent = await pageData.getTextContent()
      textContent.items.forEach(item=>{ fullText+=item.str+" " })
    }
    parseNogabali(fullText)
  }
  reader.readAsArrayBuffer(file)
}

function parseNogabali(txt){
  const cleanTxt = txt.replace(/\s+/g," ").trim()
  const tokens = cleanTxt.split(" ")
  const result = []
  const izcirtumiArr = []
  const kadMatch = cleanTxt.match(/apzīmējums-\s*(\S+)/)
  if(kadMatch) setKadastrs(kadMatch[1])
  const saimMatch = cleanTxt.match(/Saimniecība:\s*([^\n]+)/)
  if(saimMatch) setSaimnieciba(saimMatch[1].trim().split(" ")[0])
  const izcirtumRegex = /(\d+) ([\d,.]+) Izcirtums (\w+).*?izpildes veids un gads: ([\wēāīūčšžģķļņ ]+?) (\d{4}).*?atjaunošanas gads: (\d{4})/g
  let icMatch
  while((icMatch=izcirtumRegex.exec(cleanTxt))!==null){
    izcirtumiArr.push({
      nog:icMatch[1], platiba:Number(icMatch[2].replace(",","."))||0,
      tips:icMatch[3], cirteVeids:icMatch[4].trim(),
      cirteGads:Number(icMatch[5]), atjaunGads:Number(icMatch[6]),
      formula:"", h:0, koki:0
    })
  }
  for(let i=0; i<tokens.length-3; i++){
    const num0 = parseFloat((tokens[i]||"").replace(",","."))
    const num1 = parseFloat((tokens[i+1]||"").replace(",","."))
    if(!isNaN(num0)&&!isNaN(num1)&&tokens[i+2]&&tokens[i+2].includes("Mežaudze")){
      let j = i+4
      let formula = ""
      const bonitates = ["Ia","I","II","III","IV","V"]
      while(tokens[j]&&tokens[j]!=="D"&&tokens[j]!=="M"&&!bonitates.includes(tokens[j])){
        formula += tokens[j]+" "; j++
      }
      if(tokens[j]&&tokens[j]!=="D"&&tokens[j]!=="M") j++
      const formulaStr = formula.trim()
      let dominantAge = Number(tokens[j+4])||0
      const izcelsanas = (tokens[j]==="M"||tokens[j]==="D")?tokens[j]:"D"
      result.push({
        nog:tokens[i]||"", platiba:parseFloat(tokens[i+1].replace(",","."))||0,
        tips:tokens[i+3]||"", formula:formulaStr, bon:tokens[j+1]||"",
        h:Number(tokens[j+2])||0, d:Number(tokens[j+3])||0, vec:dominantAge,
        biez:Number(tokens[j+5])||0,
        g:Number(tokens[j+6])>100?0:Number(tokens[j+6])||0,
        koki:Number(tokens[j+6])>100?Number(tokens[j+6]):Number(tokens[j+7])||0,
        krm3ha:Number(tokens[j+6])>100?Number(tokens[j+7])||0:Number(tokens[j+8])||0,
        speciesAges:{}, plantacija:false, harvestType:"", izcelsanas
      })
    }
  }
  const jaunaudzeArr = []
  const jaunaudzeRegex = /(\d+) ([\d,.]+) Mežaudze (\w+).*?jaunaudžu kopšanas gads:\s*(\d{4})/g
  let jaMatch
  while((jaMatch=jaunaudzeRegex.exec(cleanTxt))!==null){
    jaunaudzeArr.push({
      nog:jaMatch[1], platiba:Number(jaMatch[2].replace(",","."))||0,
      tips:jaMatch[3], kopšanasGads:Number(jaMatch[4])
    })
  }
  setRows(result)
  setIzcirtumi(izcirtumiArr)
  setJaunaudzes(jaunaudzeArr)
}

const landPrices = {Ap:4500,Vr:4500,Nd:2500,Db:2500,Vrs:3000,Dm:3000,Kp:3000}
const prices = {log:93,small:65,veneer:130,tara:48,pulp:50,fire:38,chips:15}
const sortimentNames = {log:"Zāģbaļķi",small:"Sīkbaļķi",veneer:"Finieris",tara:"Tara",pulp:"Papīrmalka",fire:"Malka",chips:"Šķelda"}

let sortimentTotals = {log:0,small:0,veneer:0,tara:0,pulp:0,fire:0,chips:0}
rows.forEach(row=>{
  const calc = forestEngine(row)||{}
  const sortiments = calc.sortiments||{}
  Object.keys(sortimentTotals).forEach(k=>{sortimentTotals[k]+=sortiments[k]||0})
})

const totalVolume = Object.values(sortimentTotals).reduce((a,b)=>a+b,0)
const totalMoney = Object.keys(sortimentTotals).reduce((sum,k)=>sum+sortimentTotals[k]*(prices[k]||0),0)
const totalLandValue = rows.reduce((sum,row)=>sum+row.platiba*(landPrices[row.tips]||0),0)+izcirtumi.reduce((sum,ic)=>sum+ic.platiba*(landPrices[ic.tips]||0),0)
const stadijumuVertiba = rows.reduce((sum,row)=>sum+(row.izcelsanas==="M"?row.platiba*1500:0),0)
const loggingCost = (16+12)*totalVolume
const roadsideValue = totalMoney - loggingCost
const economicValue = totalMoney + totalLandValue + stadijumuVertiba
const marketValue = rows.reduce((sum,row)=>{const calc=forestEngine(row);return sum+(calc.marketValue||0)},0)+totalLandValue+stadijumuVertiba

return(
<div style={{padding:"0",fontFamily:"Arial",minHeight:"100vh",background:"#f6f9f2"}}>
<div style={{maxWidth:"1000px",margin:"0 auto",padding:"24px"}}></div>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px",flexWrap:"wrap",gap:"8px"}}>
    <button onClick={onBack} style={{padding:"8px 16px",background:"#555",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>← Sākumlapa</button>
    <button onClick={onPilna} style={{padding:"8px 20px",background:"#225522",color:"white",border:"none",borderRadius:"4px",cursor:"pointer",fontWeight:"bold"}}>Turpināt pilnajā versijā →</button>
  </div>
  <h1 style={{color:"#225522",marginBottom:"4px"}}>Pamata versija</h1>
  <p style={{color:"#888",fontSize:"13px",marginBottom:"24px"}}>Augšupielādē meža inventarizācijas PDF un saņem īpašuma analīzi</p>
  <div style={{background:"#f0f6ec",border:"1px solid #225522",borderRadius:"8px",padding:"16px",marginBottom:"24px"}}>
    <b style={{color:"#225522"}}>📄 Augšupielādēt meža inventarizācijas PDF</b><br/>
    <input type="file" accept="application/pdf" onChange={handlePDF} style={{marginTop:"8px"}}/>
    {kadastrs && <span style={{marginLeft:"16px",fontSize:"12px",color:"#555"}}><b>Kadastrs:</b> {kadastrs} | <b>Saimniecība:</b> {saimnieciba}</span>}
  </div>
  {rows.length>0 && (
  <div style={{marginBottom:"24px",overflowX:"auto"}}>
    <h2 style={{color:"#225522"}}>Nogabalu analīze</h2>
    <table border="1" cellPadding="6" style={{fontSize:"11px",width:"100%"}}>
      <thead style={{background:"#225522",color:"white"}}>
        <tr><th>Nog</th><th>Platība</th><th>Tips</th><th>Formula</th><th>H</th><th>D</th><th>Vec</th><th>Ieteiktā cirte</th><th>Krāja m³</th><th>Vērtība €</th></tr>
      </thead>
      <tbody>
        {rows.map((r,i)=>{
          const calc = forestEngine(r)
          return(
            <tr key={i} style={{background:i%2===0?"white":"#f0f8f0"}}>
              <td>{r.nog}</td><td>{r.platiba}</td><td>{r.tips}</td><td>{r.formula}</td>
              <td>{r.h}</td><td>{r.d}</td><td>{r.vec}</td>
              <td style={{color:"#225522",fontWeight:"bold"}}>{calc.decision}</td>
              <td>{(calc.cutVolume||0).toFixed(1)}</td>
              <td>{(calc.marketValue||0).toFixed(0)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
  )}
  {jaunaudzes.length>0 && (
  <div style={{background:"#e8f5e9",border:"1px solid #388e3c",borderRadius:"6px",padding:"12px",marginBottom:"24px"}}>
    <b>Jaunaudžu kopšana</b>
    <table border="1" cellPadding="6" style={{marginTop:"8px",width:"100%",fontSize:"11px"}}>
      <thead style={{background:"#388e3c",color:"white"}}><tr><th>Nog</th><th>Platība</th><th>Tips</th><th>Kopšanas gads</th></tr></thead>
      <tbody>
        {jaunaudzes.map((ja,i)=>(
          <tr key={i}>
            <td>{ja.nog}</td><td>{ja.platiba} ha</td><td>{ja.tips}</td>
            <td style={{color:ja.kopšanasGads<=new Date().getFullYear()?"#c62828":"black",fontWeight:"bold"}}>
              {ja.kopšanasGads<=new Date().getFullYear()?ja.kopšanasGads+" — Kavēta kopšana":ja.kopšanasGads}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  )}
  {izcirtumi.length>0 && (
  <div style={{background:"#fff8e1",border:"1px solid #f9a825",borderRadius:"6px",padding:"12px",marginBottom:"24px"}}>
    <b>Izcirtumi — nepieciešama atjaunošana</b>
    <table border="1" cellPadding="6" style={{marginTop:"8px",width:"100%",fontSize:"11px"}}>
      <thead style={{background:"#f9a825"}}>
        <tr><th>Nog</th><th>Platība</th><th>Tips</th><th>Cirtes veids</th><th>Gads</th><th>Atjaunot līdz</th></tr>
      </thead>
      <tbody>
        {izcirtumi.map((ic,i)=>(
          <tr key={i} style={{background:ic.atjaunGads<=new Date().getFullYear()?"#ffcccc":"#fffde7"}}>
            <td>{ic.nog}</td><td>{ic.platiba} ha</td><td>{ic.tips}</td>
            <td>{ic.cirteVeids}</td><td>{ic.cirteGads}</td><td><b>{ic.atjaunGads}</b></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  )}
  {rows.length>0 && (
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"24px"}}>
    <div style={{background:"white",border:"2px solid #225522",borderRadius:"10px",padding:"20px"}}>
      <h3 style={{color:"#225522",marginTop:0}}>Saimnieciskā vērtība</h3>
      <div style={{fontSize:"28px",fontWeight:"bold",color:"#225522",marginBottom:"8px"}}>{economicValue.toFixed(0)} €</div>
      <p style={{fontSize:"12px",color:"#666",margin:0}}>Saimnieciskā vērtība atspoguļo īpašuma kopējo vērtību no saimnieciski-ekonomiskā viedokļa — ietver koksnes sortimentu vērtību, zemes vērtību pēc meža tipa, kā arī stādījumu vērtību ja tādi ir.</p>
    </div>
    <div style={{background:"white",border:"2px solid #1565c0",borderRadius:"10px",padding:"20px"}}>
      <h3 style={{color:"#1565c0",marginTop:0}}>Tirgus vērtība</h3>
      <div style={{fontSize:"28px",fontWeight:"bold",color:"#1565c0",marginBottom:"8px"}}>{marketValue.toFixed(0)} €</div>
      <p style={{fontSize:"12px",color:"#666",margin:0}}>Tirgus vērtība ir aplēstā cena par kādu īpašumu varētu pārdot brīvā tirgū. Tā ietver zemes tirgus vērtību, koksnes vērtību pēc aktuālajām tirgus cenām, kā arī stādījumu vērtību.</p>
    </div>
  </div>
  )}
  {rows.length>0 && (
  <div style={{background:"#f0f8f0",border:"1px solid #225522",borderRadius:"8px",padding:"16px",marginBottom:"24px",fontSize:"13px"}}>
    <b style={{color:"#225522"}}>Sortimentu kopsavilkums</b>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginTop:"12px"}}>
      <div><b>Kopā koksne:</b><br/>{totalVolume.toFixed(1)} m³</div>
      <div><b>Sortimentu vērtība:</b><br/>{totalMoney.toFixed(0)} €</div>
      <div><b>Krautuves vērtība:</b><br/>{roadsideValue.toFixed(0)} €</div>
      <div><b>Zemes vērtība:</b><br/>{totalLandValue.toFixed(0)} €</div>
      {stadijumuVertiba>0 && <div><b>Stādījumu vērtība:</b><br/>{stadijumuVertiba.toFixed(0)} €</div>}
    </div>
  </div>
  )}
  {rows.length>0 && (
  <div style={{background:"#1a3a1a",borderRadius:"10px",padding:"20px",textAlign:"center",marginBottom:"24px"}}>
  <p style={{color:"#aaa",fontSize:"13px",marginBottom:"12px"}}>Lai iegūtu detalizētu sortimentu sadalījumu, cirsmas skici, caurmēra mērījumus un rēķinu izveidi — kā arī iespēju labot augšupielādēto datu vērtības un formulas —</p>
    <button onClick={onPilna} style={{padding:"12px 32px",background:"#4caf50",color:"white",border:"none",borderRadius:"6px",fontSize:"15px",fontWeight:"bold",cursor:"pointer"}}>
      Turpināt pilnajā versijā →
    </button>
  </div>
  )}
</div>
)
}

export default StandardPage