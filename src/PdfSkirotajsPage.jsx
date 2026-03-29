import { useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { PDFDocument } from "pdf-lib"
import Tesseract from "tesseract.js"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

export default function PdfSkirotajsPage({onBack}) {
  const [ipasumi, setIpasumi] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState("")
  const [pdfBytes, setPdfBytes] = useState(null)

  const lasitLapu = async (page) => {
    // Vispirms mēģina nolasīt kā tekstu
    const tc = await page.getTextContent()
    const txt = tc.items.map(i => i.str).join("")
    const txtSpace = tc.items.map(i => i.str).join(" ")

    // Ja teksts ir garāks par 20 simboliem — izmanto to
    if(txt.length > 20) {
      return { txt, txtSpace }
    }

    // Ja nē — izmanto OCR
    const viewport = page.getViewport({scale: 2.0})
    const canvas = document.createElement("canvas")
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext("2d")
    await page.render({canvasContext: ctx, viewport}).promise

    const result = await Tesseract.recognize(canvas, "lav+eng", {
      logger: m => {
        if(m.status === "recognizing text") {
          setProgress(`OCR: ${Math.round(m.progress * 100)}%`)
        }
      }
    })
    const ocrTxt = result.data.text
    return { txt: ocrTxt.replace(/\s/g,""), txtSpace: ocrTxt }
  }

  const handlePDF = async (event) => {
    const file = event.target.files[0]
    if(!file) return
    setLoading(true)
    setIpasumi([])
    setProgress("")

    const arrayBuffer = await file.arrayBuffer()
    setPdfBytes(arrayBuffer)

    const pdf = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise
    const rezultati = {}

    for(let p = 1; p <= pdf.numPages; p++) {
      setProgress(`Apstrādā lapu ${p} no ${pdf.numPages}...`)
      const page = await pdf.getPage(p)
      const { txt, txtSpace } = await lasitLapu(page)

      // Meklē 11 ciparu kadastra numuru
      const kadMatch = txt.match(/(\d{11})/)
        || txtSpace.match(/Kadastrs?\s*:?\s*([\d\s]{11,14})/i)

      if(kadMatch) {
        const kad = kadMatch[1].replace(/\s/g,"")
        if(kad.length !== 11) continue

        const saimMatch = txtSpace.match(/Saimniec[iī]ba[:\s]+([^\n\r,]+)/i)
        const nosaukums = saimMatch ? saimMatch[1].trim().split(/\s+/).slice(0,3).join(" ") : "—"

        if(!rezultati[kad]) {
          rezultati[kad] = {kadastrs: kad, nosaukums, lapas: []}
        }
        rezultati[kad].lapas.push(p)
      }
    }

    setIpasumi(Object.values(rezultati))
    setLoading(false)
    setProgress("")
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
      a.download = `${ipasums.kadastrs}_${ipasums.nosaukums}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch(err) {
      alert("Kļūda lejupielādējot: " + err.message)
    }
  }

  const lejupieladetVisus = async () => {
    for(const ip of ipasumi) {
      await lejupieladet(ip)
      await new Promise(r => setTimeout(r, 500))
    }
  }

  return (
    <div style={{padding:"40px",fontFamily:"Arial",maxWidth:"900px"}}>
      <button onClick={onBack} style={{marginBottom:"16px",padding:"6px 14px",background:"#555",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>Atpakaļ</button>
      <h1 style={{color:"#225522"}}>🌲 PDF šķirotājs</h1>
      <p style={{color:"#555"}}>Augšupielādē PDF ar vairāku īpašumu cirsmu novērtējumiem — sistēma automātiski sadala pa kadastra numuriem. Darbojas gan ar teksta, gan skenētiem PDF failiem.</p>

      <input type="file" accept="application/pdf" onChange={handlePDF} style={{marginBottom:"20px"}}/>

      {loading && (
        <div style={{padding:"12px",background:"#e3f2fd",borderRadius:"6px",marginBottom:"16px"}}>
          <p style={{color:"#1565c0",margin:0}}>⏳ {progress || "Ielādē PDF..."}</p>
          <p style={{color:"#555",fontSize:"12px",margin:"4px 0 0"}}>Skenētu PDF analīze var aizņemt vairākas minūtes.</p>
        </div>
      )}

      {!loading && ipasumi.length === 0 && pdfBytes && (
        <p style={{color:"#c62828"}}>⚠️ Netika atrasts neviens kadastra numurs.</p>
      )}

      {ipasumi.length > 0 && (
        <div>
          <h2 style={{color:"#225522"}}>Atrasti {ipasumi.length} īpašumi:</h2>
          <table border="1" cellPadding="8" style={{width:"100%",borderCollapse:"collapse",marginBottom:"16px"}}>
            <thead style={{background:"#225522",color:"white"}}>
              <tr>
                <th>Kadastrs</th>
                <th>Nosaukums</th>
                <th>Lapas</th>
                <th>Skaits</th>
                <th>Lejupielādēt</th>
              </tr>
            </thead>
            <tbody>
              {ipasumi.map((ip, i) => (
                <tr key={i} style={{background:i%2===0?"white":"#f0f8f0"}}>
                  <td><b>{ip.kadastrs}</b></td>
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
            ⬇ Lejupielādēt visus ({ipasumi.length})
          </button>
        </div>
      )}
    </div>
  )
}