import { useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { PDFDocument } from "pdf-lib"
import Tesseract from "tesseract.js"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

const defaultManuala = () => ({
  kadastrs: "", kvartals: "", nosaukums: "",
  log:0, pulp:0, fire:0, veneer:0, tara:0, chips:0
})

export default function PdfSkirotajsPage({onBack, savedState, onSaveState}) {
  const [normalie, setNormalie] = useState(savedState?.normalie || [])
  const [problemas, setProblemas] = useState(savedState?.problemas || [])
  const [manualas, setManualas] = useState(savedState?.manualas || [])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState("")
  const [pdfBytes, setPdfBytes] = useState(savedState?.pdfBytes || null)

  const lasitLapu = async (page) => {
    const tc = await page.getTextContent()
    const txt = tc.items.map(i => i.str).join("")
    const txtSpace = tc.items.map(i => i.str).join(" ")
    if(txt.length > 20) return { txt, txtSpace }

    const viewport = page.getViewport({scale: 2.0})
    const canvas = document.createElement("canvas")
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({canvasContext: canvas.getContext("2d"), viewport}).promise
    const result = await Tesseract.recognize(canvas, "lav+eng", {
      logger: m => { if(m.status === "recognizing text") setProgress(`OCR: ${Math.round(m.progress * 100)}%`) }
    })
    const ocrTxt = result.data.text
    return { txt: ocrTxt.replace(/\s/g,""), txtSpace: ocrTxt }
  }

  const iegutNosaukumu = (txtSpace, idx) => {
    const visiSaim = [...txtSpace.matchAll(/Saimniec[iī]ba\s*[":]?\s*["„]?\s*([^"„\n\r]+?)(?:\s*["""]?\s*(?:Īpašnieks|Novads|Ipasnieks)|\s{2,}|$)/gi)]
    const saim = visiSaim[idx] || visiSaim[0]
    if(!saim) return "—"
    return saim[1].trim().split(/\s+/).slice(0,4).join(" ")
  }

  const iegutKvartalu = (txtSpace, idx) => {
    const visi = [...txtSpace.matchAll(/Kvartal[^\s\d:]{0,4}\s*:?\s*(\d+)/gi)]
    const kv = visi[idx] || visi[0]
    return kv ? kv[1] : "—"
  }

  const handlePDF = async (event) => {
    const file = event.target.files[0]
    if(!file) return
    setLoading(true)
    setNormalie([])
    setProblemas([])
    setManualas([])
    setProgress("")

    const arrayBuffer = await file.arrayBuffer()
    const uint8 = new Uint8Array(arrayBuffer.slice(0))
    const uint8PdfLib = new Uint8Array(arrayBuffer.slice(0))
    setPdfBytes(uint8PdfLib)

    const pdf = await pdfjsLib.getDocument(uint8).promise
    const normalieMap = {}
    const problemasArr = []

    for(let p = 1; p <= pdf.numPages; p++) {
      setProgress(`Apstrādā lapu ${p} no ${pdf.numPages}...`)
      const page = await pdf.getPage(p)
      const { txt, txtSpace } = await lasitLapu(page)

      const visiKadastri = [...txtSpace.matchAll(/Kadastrs\s*:?\s*(\d{11})/gi)]

      if(visiKadastri.length === 0) {
        continue
      } else if(visiKadastri.length === 1) {
        const kad = visiKadastri[0][1]
        const nosaukums = iegutNosaukumu(txtSpace, 0)
        const kvartals = iegutKvartalu(txtSpace, 0)

        if(!normalieMap[kad]) {
          normalieMap[kad] = {kadastrs: kad, kvartals, nosaukums, lapas: []}
        }
        if(!normalieMap[kad].lapas.includes(p)) {
          normalieMap[kad].lapas.push(p)
        }
      } else {
        problemasArr.push({
          lapa: p,
          kadastri: visiKadastri.map(m => m[1]),
          nosaukums: iegutNosaukumu(txtSpace, 0)
        })
      }
    }

    const norm = Object.values(normalieMap)
    setNormalie(norm)
    setProblemas(problemasArr)
    setLoading(false)
    setProgress("")
    onSaveState?.({normalie: norm, problemas: problemasArr, manualas: [], pdfBytes: uint8PdfLib})
  }

  const lejupieladet = async (ipasums) => {
    try {
      const originalPdf = await PDFDocument.load(pdfBytes)
      const jaunsPdf = await PDFDocument.create()
      const lapas = await jaunsPdf.copyPages(originalPdf, ipasums.lapas.map(l => l-1))
      lapas.forEach(lapa => jaunsPdf.addPage(lapa))
      const bytes = await jaunsPdf.save()
      const blob = new Blob([bytes], {type: "application/pdf"})
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${ipasums.kadastrs}_kv${ipasums.kvartals}_${ipasums.nosaukums}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch(err) {
      alert("Kļūda lejupielādējot: " + err.message)
    }
  }

  const lejupieladetVisus = async () => {
    for(const ip of normalie) {
      await lejupieladet(ip)
      await new Promise(r => setTimeout(r, 500))
    }
  }

  const pievienotManualu = () => {
    const jaunas = [...manualas, defaultManuala()]
    setManualas(jaunas)
    onSaveState?.({normalie, problemas, manualas: jaunas, pdfBytes})
  }

  const updateManuala = (idx, field, value) => {
    const n = [...manualas]
    n[idx] = {...n[idx], [field]: value}
    setManualas(n)
    onSaveState?.({normalie, problemas, manualas: n, pdfBytes})
  }

  const dzestManualu = (idx) => {
    const n = manualas.filter((_,i) => i !== idx)
    setManualas(n)
    onSaveState?.({normalie, problemas, manualas: n, pdfBytes})
  }

  const sortimentNames = {
    log:"Zāģbaļķi", pulp:"Papīrmalka", fire:"Malka",
    veneer:"Finieris", tara:"Tara", chips:"Šķelda"
  }

  return (
    <div style={{padding:"40px",fontFamily:"Arial",maxWidth:"960px"}}>
      <button onClick={onBack} style={{marginBottom:"16px",padding:"6px 14px",background:"#555",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>Atpakaļ</button>
      <h1 style={{color:"#225522"}}>🌲 PDF šķirotājs</h1>
      <p style={{color:"#555"}}>Augšupielādē PDF ar vairāku īpašumu cirsmu novērtējumiem — sistēma automātiski sadala pa kadastra numuriem.</p>

      <input type="file" accept="application/pdf" onChange={handlePDF} style={{marginBottom:"20px"}}/>

      {loading && (
        <div style={{padding:"12px",background:"#e3f2fd",borderRadius:"6px",marginBottom:"16px"}}>
          <p style={{color:"#1565c0",margin:0}}>⏳ {progress || "Ielādē PDF..."}</p>
        </div>
      )}

      {normalie.length > 0 && (
        <div style={{marginBottom:"24px"}}>
          <h2 style={{color:"#225522"}}>✅ Automātiski sadalīti — {normalie.length} kadastri</h2>
          <table border="1" cellPadding="8" style={{width:"100%",borderCollapse:"collapse",marginBottom:"12px"}}>
            <thead style={{background:"#225522",color:"white"}}>
              <tr>
                <th>Kadastrs</th>
                <th>Kvartāls</th>
                <th>Nosaukums</th>
                <th>Lapas</th>
                <th>Skaits</th>
                <th>Lejupielādēt</th>
              </tr>
            </thead>
            <tbody>
              {normalie.map((ip, i) => (
                <tr key={i} style={{background:i%2===0?"white":"#f0f8f0"}}>
                  <td><b>{ip.kadastrs}</b></td>
                  <td style={{textAlign:"center"}}>{ip.kvartals}</td>
                  <td>{ip.nosaukums}</td>
                  <td style={{fontSize:"11px",color:"#555"}}>{ip.lapas.join(", ")}</td>
                  <td style={{textAlign:"center"}}>{ip.lapas.length}</td>
                  <td>
                    <button onClick={()=>lejupieladet(ip)} style={{padding:"4px 12px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>
                      ⬇ PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={lejupieladetVisus} style={{padding:"8px 20px",background:"#225522",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>
            ⬇ Lejupielādēt visus ({normalie.length})
          </button>
          <button onClick={()=>{
            setNormalie([]); setProblemas([]); setManualas([]); setPdfBytes(null)
            onSaveState?.(null)
          }} style={{marginLeft:"10px",padding:"8px 20px",background:"#c62828",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>
            🗑 Dzēst visu
          </button>
        </div>
      )}

      {problemas.length > 0 && (
        <div style={{marginBottom:"24px",padding:"16px",background:"#fff8e1",border:"1px solid #f9a825",borderRadius:"8px"}}>
          <h2 style={{color:"#e65100",margin:"0 0 12px"}}>⚠️ Problēmlapas — {problemas.length} lapas ar vairākiem kadastriem</h2>
          <p style={{fontSize:"12px",color:"#555",margin:"0 0 12px"}}>Šīs lapas satur vairākas cirsmas — aizpildi manuāli zemāk.</p>
          <table border="1" cellPadding="6" style={{width:"100%",borderCollapse:"collapse"}}>
            <thead style={{background:"#f9a825"}}>
              <tr>
                <th>Lapa</th>
                <th>Atrasti kadastri</th>
                <th>Nosaukums</th>
              </tr>
            </thead>
            <tbody>
              {problemas.map((p, i) => (
                <tr key={i} style={{background:"white"}}>
                  <td style={{textAlign:"center"}}>{p.lapa}</td>
                  <td style={{fontSize:"11px"}}>{p.kadastri.join(", ")}</td>
                  <td>{p.nosaukums}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(problemas.length > 0 || manualas.length > 0) && (
        <div style={{marginBottom:"24px"}}>
          <h2 style={{color:"#225522"}}>📝 Manuālā ievade</h2>
          <p style={{fontSize:"12px",color:"#555"}}>Aizpildi problēmlapu datus manuāli.</p>

          {manualas.map((m, idx) => (
            <div key={idx} style={{border:"1px solid #ccc",borderRadius:"6px",padding:"12px",marginBottom:"12px",background:"white"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                <b style={{color:"#225522"}}>Manuālā cirsma {idx+1}</b>
                <button onClick={()=>dzestManualu(idx)} style={{background:"#c62828",color:"white",border:"none",borderRadius:"4px",padding:"3px 10px",cursor:"pointer",fontSize:"11px"}}>Dzēst</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"10px"}}>
                <div>
                  <label style={{fontSize:"11px",fontWeight:"bold"}}>Kadastrs:</label><br/>
                  <input value={m.kadastrs} onChange={e=>updateManuala(idx,"kadastrs",e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}} placeholder="70460020132"/>
                </div>
                <div>
                  <label style={{fontSize:"11px",fontWeight:"bold"}}>Kvartāls:</label><br/>
                  <input value={m.kvartals} onChange={e=>updateManuala(idx,"kvartals",e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}} placeholder="7"/>
                </div>
                <div>
                  <label style={{fontSize:"11px",fontWeight:"bold"}}>Nosaukums:</label><br/>
                  <input value={m.nosaukums} onChange={e=>updateManuala(idx,"nosaukums",e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px"}} placeholder="Saulgrieži"/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:"8px"}}>
                {Object.keys(sortimentNames).map(k => (
                  <div key={k}>
                    <label style={{fontSize:"10px",fontWeight:"bold"}}>{sortimentNames[k]} m³:</label><br/>
                    <input type="number" value={m[k]||""} onChange={e=>updateManuala(idx,k,e.target.value)} style={{width:"100%",padding:"4px",border:"1px solid #ccc",borderRadius:"4px",fontSize:"12px"}}/>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button onClick={pievienotManualu} style={{padding:"8px 20px",background:"#1565c0",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>
            + Pievienot manuālu cirsmu
          </button>
        </div>
      )}

      {!loading && normalie.length === 0 && problemas.length === 0 && pdfBytes && (
        <p style={{color:"#c62828"}}>⚠️ Netika atrasts neviens kadastra numurs.</p>
      )}
    </div>
  )
}