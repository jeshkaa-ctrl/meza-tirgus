import { useState, useEffect } from "react"
import { calcSortimentsByQuality } from "./qualityEngine"

// ── Tulkojumi ────────────────────────────────────────────────────────────────
const T = {
  LV: {
    appTitle: "Cirsmas novērtēšana",
    back: "← Atpakaļ",
    step0: "Sākums", step1: "Mērvietas", step2: "Augstumi", step3: "Piezīmes", step4: "Rezultāti",
    welcomeTitle: "🌲 Cirsmas novērtēšanas rīks",
    welcomeDesc: "Šis rīks palīdz meža īpašniekam un speciālistam ātri novērtēt cirsmas kubatūru un sortimentu vērtību tieši mežā — ar telefonu rokās.",
    whatYouGet: "Ko iegūsi pēc mērījumiem?",
    whatYouGetList: ["Koksnes kubatūru (m³/ha) pa sugām","Sortimentu sadalījumu pēc kvalitātes klases","Aptuveno cirsmas vērtību (€/ha un kopā €)","PDF pārskatu izdrukāšanai vai nosūtīšanai"],
    howTitle: "Kā strādāt?",
    howList: ["Ievadi cirsmas pamatdatus (saimniecība, kadastrs, platība)","Mežā izvēlies 4–6 parauglaukumus pa cirsmu","Katrā parauglaukumā izvēlies sugu, kvalitāti, ievadi G un diametrus","Pēc mērījumiem ievadi augstumu katrai sugai","Pievieno piezīmes un apskatī rezultātus"],
    startBtn: "Sākt →", continueBtn: "Turpināt iepriekšējo →", deleteOld: "Dzēst un sākt no jauna",
    infoTitle: "Cirsmas informācija",
    saimnieciba: "Saimniecība / Īpašuma nosaukums", kadastrs: "Kadastra numurs",
    nogabals: "Nogabala numurs", platiba: "Platība (ha)",
    nextToMeasure: "Sākt mērījumus →", savedMervietas: "mērvieta(-s) saglabāta(-s)",
    mervietasTitle: "Parauglaukumi (mērvietas)",
    mervietasInstr: "📍 Parauglaukumā ar Bitterliha lineālu nosaka šķērslaukumu (G) katrai sugai atsevišķi — cik koki iekrīt lineāla leņķī, tāds ir G m²/ha. Izvēlies sugu, kvalitātes klasi, ievadi G un izmēri diametrus.",
    mervieta: "Mērvieta", addMervieta: "+ Pievienot mērvietu",
    stavs1: "1. stāvs", stavs2: "2. stāvs",
    suga: "Suga", gValue: "G (m²/ha)", kvalitate: "Kvalitātes klase",
    addSuga: "+ Pievienot sugu", add2stavs: "Ir 2. stāvs", no2stavs: "Nav 2. stāva",
    measureDiam: "📏 Mērīt diametrus", diameters: "diametri", dPlaceholder: "D cm",
    stavs2suga: "Pievienot 2.stāva sugu", nextToHeights: "Turpināt → Augstumi",
    augstumTitle: "Koku augstumi",
    augstumInstr: "🌲 Izmēri vidējo augstumu katrai sugai ar augstummēru. Mēra 3–5 dominējošos kokus un ņem vidējo.",
    stavs1label: "(1. stāvs)", stavs2label: "(2. stāvs)", hPlaceholder: "m",
    nextToNotes: "Turpināt → Piezīmes",
    pamezs: "Pamežs", pamezsBiezs: "Biezs", pamezsVidejs: "Vidējs", pamezsNav: "Nav",
    pamezsInstr: "Pamežs — blīvs zemsedzes krūmu slānis. Biezs pamežs prasa tīrītājus pirms mašīnizstrādes.",
    pievesana: "Pievešana", pievesanaAtt: "Pievešanas attālums (m)", pievesanaApst: "Pievešanas apstākļi",
    labi: "Labi", videjis: "Vidēji", smagi: "Smagi",
    pievesanaInstr: "Attālums no cirsmas līdz ceļam. Labi: ciets ceļš; Vidēji: mitrs, bet pieejams; Smagi: purvaini vai šauri ceļi.",
    piezimesTitle: "Citas piezīmes", piezimesPlaceholder: "Papildu informācija par cirsmu...",
    cenasTitle: "Materiālu cenas (€/m³)", cenasInstr: "Noklusētās cenas atbilst vidējam Latvijas tirgum.",
    calculate: "Aprēķināt →",
    kubatura: "Krāja uz 1 hektāru", vertiba: "Vērtība uz 1 ha",
    kopKubatura: "Kopējā krāja cirsmai", kopVertiba: "Kopējā vērtība cirsmai",
    paSugam: "Pa sugām", sortiTitle: "Sortimenti kopā", piezimesSum: "Piezīmes",
    printPDF: "🖨 Drukāt / Saglabāt PDF", editBack: "← Labot", deleteAll: "🗑 Dzēst visu",
    noResults: "Nav pietiekami datu. Pārbaudi mērvietas un augstumu ievadi.",
    perHa: "m³/ha", eur: "€/ha",
    sugas: {P:"Priede",E:"Egle",B:"Bērzs",A:"Apse",M:"Melnalksnis",Oz:"Ozols",Os:"Osis",G:"Goba",Ba:"Baltalknis",Bl:"Blāķis"},
    sorti: {log:"Baļķis",small:"Sīkbaļķis",veneer:"Finieris",tara:"Tara",pulp:"Papīrmalka",fire:"Malka",chips:"Šķelda"},
    deleteMv: "Dzēst mērvietu?", deleteAllConfirm: "Dzēst visus datus?", deleteOldConfirm: "Dzēst iepriekšējos datus?",
    noMervietas: "Nav ievadītu mērvietu.",
  },
  EN: {
    appTitle: "Stand Assessment",
    back: "← Back",
    step0: "Start", step1: "Sample plots", step2: "Heights", step3: "Notes", step4: "Results",
    welcomeTitle: "🌲 Stand Assessment Tool",
    welcomeDesc: "This tool helps forest owners and specialists quickly assess stand volume and assortment value directly in the field.",
    whatYouGet: "What will you get?",
    whatYouGetList: ["Timber volume (m³/ha) by species","Assortment breakdown by quality class","Approximate stand value (€/ha and total €)","PDF report for printing or sharing"],
    howTitle: "How to use?",
    howList: ["Enter stand info (estate, cadastre, area)","Choose 4–6 sample plots in the forest","At each plot: select species, quality, enter G and measure diameters","Enter tree heights for each species","Add notes and review results"],
    startBtn: "Start →", continueBtn: "Continue previous →", deleteOld: "Delete and start over",
    infoTitle: "Stand Information",
    saimnieciba: "Estate / Property name", kadastrs: "Cadastre number",
    nogabals: "Compartment number", platiba: "Area (ha)",
    nextToMeasure: "Start measurements →", savedMervietas: "sample plot(s) saved",
    mervietasTitle: "Sample plots",
    mervietasInstr: "📍 At each sample plot, measure basal area (G) using a Bitterlich angle gauge for each species separately. Select species, quality class, enter G and measure diameters.",
    mervieta: "Plot", addMervieta: "+ Add sample plot",
    stavs1: "Layer 1", stavs2: "Layer 2",
    suga: "Species", gValue: "G (m²/ha)", kvalitate: "Quality class",
    addSuga: "+ Add species", add2stavs: "Has 2nd layer", no2stavs: "No 2nd layer",
    measureDiam: "📏 Measure diameters", diameters: "diameters", dPlaceholder: "D cm",
    stavs2suga: "Add 2nd layer species", nextToHeights: "Continue → Heights",
    augstumTitle: "Tree Heights",
    augstumInstr: "🌲 Measure average height for each species. Measure 3–5 dominant trees and take the average.",
    stavs1label: "(layer 1)", stavs2label: "(layer 2)", hPlaceholder: "m",
    nextToNotes: "Continue → Notes",
    pamezs: "Undergrowth", pamezsBiezs: "Dense", pamezsVidejs: "Medium", pamezsNav: "None",
    pamezsInstr: "Dense undergrowth often requires clearing before machine harvesting.",
    pievesana: "Extraction", pievesanaAtt: "Extraction distance (m)", pievesanaApst: "Extraction conditions",
    labi: "Good", videjis: "Medium", smagi: "Difficult",
    pievesanaInstr: "Distance from stand to road. Good: hard road; Medium: wet but passable; Difficult: boggy or narrow.",
    piezimesTitle: "Other notes", piezimesPlaceholder: "Additional information...",
    cenasTitle: "Timber prices (€/m³)", cenasInstr: "Default prices reflect average Latvian market.",
    calculate: "Calculate →",
    kubatura: "Volume per hectare", vertiba: "Value per ha",
    kopKubatura: "Total stand volume", kopVertiba: "Total stand value",
    paSugam: "By species", sortiTitle: "Assortments total", piezimesSum: "Notes",
    printPDF: "🖨 Print / Save PDF", editBack: "← Edit", deleteAll: "🗑 Delete all",
    noResults: "Insufficient data. Check sample plots and height input.",
    perHa: "m³/ha", eur: "€/ha",
    sugas: {P:"Pine",E:"Spruce",B:"Birch",A:"Aspen",M:"Black alder",Oz:"Oak",Os:"Ash",G:"Elm",Ba:"White alder",Bl:"Linden"},
    sorti: {log:"Sawlog",small:"Small log",veneer:"Veneer",tara:"Packaging",pulp:"Pulpwood",fire:"Firewood",chips:"Chips"},
    deleteMv: "Delete this plot?", deleteAllConfirm: "Delete all data?", deleteOldConfirm: "Delete previous data?",
    noMervietas: "No sample plots entered.",
  },
  RU: {
    appTitle: "Оценка лесосеки",
    back: "← Назад",
    step0: "Начало", step1: "Пр. площади", step2: "Высоты", step3: "Заметки", step4: "Результаты",
    welcomeTitle: "🌲 Инструмент оценки лесосеки",
    welcomeDesc: "Этот инструмент помогает владельцам леса и специалистам быстро оценить запас и стоимость лесосеки прямо в лесу.",
    whatYouGet: "Что вы получите?",
    whatYouGetList: ["Запас древесины (м³/га) по породам","Распределение по сортиментам с учётом качества","Стоимость лесосеки (€/га и итого €)","PDF-отчёт для печати или отправки"],
    howTitle: "Как пользоваться?",
    howList: ["Введите данные лесосеки (имение, кадастр, площадь)","Выберите 4–6 пробных площадей в лесу","На каждой площади: выберите породу, качество, введите G и диаметры","Введите высоту для каждой породы","Добавьте заметки и просмотрите результаты"],
    startBtn: "Начать →", continueBtn: "Продолжить предыдущее →", deleteOld: "Удалить и начать заново",
    infoTitle: "Информация о лесосеке",
    saimnieciba: "Имение / Название объекта", kadastrs: "Кадастровый номер",
    nogabals: "Номер выдела", platiba: "Площадь (га)",
    nextToMeasure: "Начать замеры →", savedMervietas: "пробная(-ых) площадь(-ей) сохранено",
    mervietasTitle: "Пробные площади",
    mervietasInstr: "📍 На пробной площади угловым шаблоном Биттерлиха определяется G для каждой породы отдельно. Выберите породу, класс качества, введите G и измерьте диаметры.",
    mervieta: "Площадь", addMervieta: "+ Добавить пробную площадь",
    stavs1: "1-й ярус", stavs2: "2-й ярус",
    suga: "Порода", gValue: "G (м²/га)", kvalitate: "Класс качества",
    addSuga: "+ Добавить породу", add2stavs: "Есть 2-й ярус", no2stavs: "Нет 2-го яруса",
    measureDiam: "📏 Измерить диаметры", diameters: "диаметров", dPlaceholder: "D см",
    stavs2suga: "Добавить породу 2-го яруса", nextToHeights: "Продолжить → Высоты",
    augstumTitle: "Высоты деревьев",
    augstumInstr: "🌲 Измерьте среднюю высоту каждой породы. Измеряйте 3–5 господствующих деревьев.",
    stavs1label: "(1-й ярус)", stavs2label: "(2-й ярус)", hPlaceholder: "м",
    nextToNotes: "Продолжить → Заметки",
    pamezs: "Подлесок", pamezsBiezs: "Густой", pamezsVidejs: "Средний", pamezsNav: "Нет",
    pamezsInstr: "Густой подлесок часто требует расчистки перед машинной заготовкой.",
    pievesana: "Трелёвка", pievesanaAtt: "Расстояние трелёвки (м)", pievesanaApst: "Условия трелёвки",
    labi: "Хорошие", videjis: "Средние", smagi: "Сложные",
    pievesanaInstr: "Расстояние от лесосеки до дороги. Хорошие: твёрдое покрытие; Средние: проезжаемо; Сложные: болото.",
    piezimesTitle: "Прочие заметки", piezimesPlaceholder: "Дополнительная информация...",
    cenasTitle: "Цены на материалы (€/м³)", cenasInstr: "Значения по умолчанию — средний рынок Латвии.",
    calculate: "Рассчитать →",
    kubatura: "Запас на 1 гектар", vertiba: "Стоимость на 1 га",
    kopKubatura: "Общий запас лесосеки", kopVertiba: "Общая стоимость лесосеки",
    paSugam: "По породам", sortiTitle: "Сортименты итого", piezimesSum: "Заметки",
    printPDF: "🖨 Печать / Сохранить PDF", editBack: "← Редактировать", deleteAll: "🗑 Удалить всё",
    noResults: "Недостаточно данных. Проверьте ввод площадей и высот.",
    perHa: "м³/га", eur: "€/га",
    sugas: {P:"Сосна",E:"Ель",B:"Берёза",A:"Осина",M:"Чёрная ольха",Oz:"Дуб",Os:"Ясень",G:"Вяз",Ba:"Белая ольха",Bl:"Липа"},
    sorti: {log:"Пиловочник",small:"Мелкий пил.",veneer:"Фанкряж",tara:"Тарная дощ.",pulp:"Балансы",fire:"Дрова",chips:"Щепа"},
    deleteMv: "Удалить эту площадь?", deleteAllConfirm: "Удалить все данные?", deleteOldConfirm: "Удалить предыдущие данные?",
    noMervietas: "Нет введённых пробных площадей.",
  }
}

const SUGAS = ["P","E","B","A","M","Oz","Os","G","Ba","Bl"]
const KVALITATES = ["A1","A","B","C","D","Papīrmalka","Malka"]
const KVAL_LBL = {A1:"A1 — Izcila",A:"A — Laba",B:"B — Vidēja",C:"C — Zema",D:"D — Ļoti zema",Papīrmalka:"Papīrmalka",Malka:"Malka"}
const FF = {P:0.46,E:0.46,B:0.42,A:0.42,M:0.42,Oz:0.42,Os:0.42,G:0.42,Ba:0.42,Bl:0.42}
const DEF_CENAS = {log:105,small:45,pulp:35,veneer:95,tara:48,fire:20,chips:15}
const SK = "cirsma_mobile_v4"
const CMAP = {log:"log",small:"small",veneer:"veneer",tara:"tara",pulp:"pulp",fire:"fire",chips:"chips"}

const saveLS = (d) => { try { localStorage.setItem(SK, JSON.stringify(d)) } catch(e) {} }
const loadLS = () => { try { const d = localStorage.getItem(SK); return d ? JSON.parse(d) : null } catch(e) { return null } }

// Stili
const c = {
  app: {fontFamily:"-apple-system,BlinkMacSystemFont,sans-serif",background:"#0f1a0f",minHeight:"100vh",color:"#e8f0e8",maxWidth:480,margin:"0 auto",paddingBottom:80},
  hdr: {background:"linear-gradient(135deg,#1a2e1a,#0f1a0f)",borderBottom:"1px solid #2d4a2d",padding:"10px 14px",position:"sticky",top:0,zIndex:100,display:"flex",alignItems:"center",gap:8},
  bkBtn: {background:"none",border:"1px solid #3d6b3d",color:"#7ab87a",borderRadius:8,padding:"6px 10px",fontSize:12,cursor:"pointer"},
  ttl: {fontSize:14,fontWeight:700,color:"#a8d8a8",margin:0,flex:1,textAlign:"center"},
  lRow: {display:"flex",gap:3},
  lBtn: (a) => ({padding:"4px 7px",borderRadius:6,border:a?"2px solid #4caf50":"1px solid #3d6b3d",background:a?"#1b5e20":"#0f1a0f",color:a?"#c8e6c8":"#7ab87a",fontSize:11,cursor:"pointer",fontWeight:a?700:400}),
  sec: {margin:"12px 16px",background:"#1a2e1a",borderRadius:12,border:"1px solid #2d4a2d",overflow:"hidden"},
  sh: {background:"#225522",padding:"10px 16px",fontSize:12,fontWeight:700,color:"#c8e6c8",letterSpacing:"0.05em",textTransform:"uppercase"},
  sb: {padding:16},
  ins: {background:"#0f1a0f",border:"1px solid #2d4a2d",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#7ab87a",marginBottom:12,lineHeight:1.5},
  lbl: {fontSize:11,color:"#7ab87a",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4,display:"block"},
  inp: {width:"100%",background:"#0f1a0f",border:"1px solid #3d6b3d",borderRadius:8,color:"#e8f0e8",padding:"10px 12px",fontSize:15,boxSizing:"border-box",outline:"none"},
  sel: {width:"100%",background:"#0f1a0f",border:"1px solid #3d6b3d",borderRadius:8,color:"#e8f0e8",padding:"10px 12px",fontSize:14,boxSizing:"border-box"},
  row: {display:"flex",gap:10,marginBottom:12},
  btn1: {background:"linear-gradient(135deg,#2e7d32,#1b5e20)",color:"white",border:"none",borderRadius:10,padding:"13px 20px",fontSize:15,fontWeight:700,cursor:"pointer",width:"100%",marginTop:8},
  btn2: {background:"#1a2e1a",color:"#7ab87a",border:"1px solid #3d6b3d",borderRadius:10,padding:"11px 16px",fontSize:14,cursor:"pointer",flex:1},
  btnD: {background:"#1a0f0f",color:"#e57373",border:"1px solid #5d2020",borderRadius:8,padding:"8px 12px",fontSize:13,cursor:"pointer"},
  btnO: {background:"linear-gradient(135deg,#e65100,#bf360c)",color:"white",border:"none",borderRadius:10,padding:"13px 20px",fontSize:15,fontWeight:700,cursor:"pointer",width:"100%",marginTop:8},
  chip: {display:"inline-flex",alignItems:"center",gap:4,background:"#0f1a0f",border:"1px solid #3d6b3d",borderRadius:20,padding:"4px 10px",fontSize:13,color:"#a8d8a8",margin:"2px"},
  chipX: {background:"none",border:"none",color:"#e57373",cursor:"pointer",fontSize:14,padding:0,lineHeight:1},
  nInp: {background:"#0f1a0f",border:"1px solid #3d6b3d",borderRadius:8,color:"#e8f0e8",padding:"10px 12px",fontSize:16,width:"100%",boxSizing:"border-box",textAlign:"center",outline:"none"},
  tog: (a) => ({flex:1,padding:"10px 8px",borderRadius:8,border:a?"2px solid #4caf50":"1px solid #3d6b3d",background:a?"#1b5e20":"#0f1a0f",color:a?"#c8e6c8":"#7ab87a",fontSize:13,fontWeight:a?700:400,cursor:"pointer",textAlign:"center"}),
  crd: {background:"#0f1a0f",border:"1px solid #2d4a2d",borderRadius:10,padding:"12px 14px",marginBottom:8},
  div: {height:1,background:"#2d4a2d",margin:"12px 0"},
  dot: (a,d) => ({width:a?24:8,height:8,borderRadius:4,background:d?"#4caf50":a?"#a8d8a8":"#2d4a2d",transition:"all 0.3s",cursor:"pointer"}),
  hero: {background:"linear-gradient(160deg,#1a3a1a,#0f1a0f)",margin:"12px 16px",borderRadius:14,padding:20,border:"1px solid #2d4a2d"},
  bul: {display:"flex",alignItems:"flex-start",gap:8,marginBottom:8,fontSize:13,color:"#a8d8a8"},
  bulN: {background:"#225522",color:"#c8e6c8",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,marginTop:1},
  kvBadge: {fontSize:10,background:"#2d4a2d",color:"#a8d8a8",borderRadius:4,padding:"2px 6px",marginLeft:6},
}

// ── Jauns tukšs parauglaukums ─────────────────────────────────────────────────
const jaunsMv = () => ({ id: Date.now(), sugas: [], otraisStavs: [] })

// ── Forma vienai sugai mērvietā ───────────────────────────────────────────────
function SugaForma({ t, stavs, onPievienot, esosasSugas }) {
  const [suga, setSuga] = useState("P")
  const [g, setG] = useState("")
  const [kval, setKval] = useState("A")

  const pievienot = () => {
    if (!g || parseFloat(g) <= 0) return
    onPievienot({ suga, g: parseFloat(g), kval })
    setG("")
    // Automātiski izvēlas nākamo sugu kas vēl nav pievienota
    const atlikušas = SUGAS.filter(s => !esosasSugas.includes(s))
    setSuga(atlikušas.length > 0 ? atlikušas[0] : "P")
    setKval("A")
  }

  return (
    <div style={{background:"#111f11",border:"1px solid #2d4a2d",borderRadius:8,padding:12,marginBottom:8}}>
      <div style={c.row}>
        <div style={{flex:2}}>
          <label style={c.lbl}>{t.suga}</label>
          <select style={c.sel} value={suga} onChange={e=>setSuga(e.target.value)}>
            {SUGAS.map(sg=><option key={sg} value={sg}>{sg} — {t.sugas[sg]}</option>)}
          </select>
        </div>
        <div style={{flex:1}}>
          <label style={c.lbl}>{t.gValue}</label>
          <input style={c.nInp} type="number" inputMode="numeric" value={g}
            onChange={e=>setG(e.target.value)} placeholder="0"/>
        </div>
      </div>
      <div style={{marginBottom:10}}>
        <label style={c.lbl}>{t.kvalitate}</label>
        <select style={c.sel} value={kval} onChange={e=>setKval(e.target.value)}>
          {KVALITATES.map(k=><option key={k} value={k}>{KVAL_LBL[k]||k}</option>)}
        </select>
      </div>
      <button style={{...c.btn2,width:"100%"}} onClick={pievienot}>{t.addSuga}</button>
    </div>
  )
}

export default function CirsmaNovertesanaMobile({ onBack }) {
  const sv = loadLS()
  const [lang, setLang] = useState(sv?.lang || "LV")
  const t = T[lang]
  const [solis, setSolis] = useState(-1)
  const [kadastrs, setKadastrs] = useState(sv?.kadastrs || "")
  const [saimnieciba, setSaimnieciba] = useState(sv?.saimnieciba || "")
  const [nogabals, setNogabals] = useState(sv?.nogabals || "")
  const [platiba, setPlatiba] = useState(sv?.platiba || "")
  const [mervietas, setMervietas] = useState(sv?.mervietas || [])
  const [augstumi, setAugstumi] = useState(sv?.augstumi || {})
  const [pamezs, setPamezs] = useState(sv?.pamezs || "")
  const [pievAtt, setPievAtt] = useState(sv?.pievAtt || "")
  const [pievApst, setPievApst] = useState(sv?.pievApst || "")
  const [piezimes, setPiezimes] = useState(sv?.piezimes || "")
  const [cenas, setCenas] = useState(sv?.cenas || {...DEF_CENAS})
  const [aktivaMv, setAktivaMv] = useState(null)
  const [jD, setJD] = useState("")
  const [aktSuga, setAktSuga] = useState(null)
  const [oSt, setOSt] = useState(false)

  const pl = parseFloat(platiba) || 0

  useEffect(() => {
    saveLS({ lang, solis, kadastrs, saimnieciba, nogabals, platiba, mervietas, augstumi, pamezs, pievAtt, pievApst, piezimes, cenas })
  }, [lang, solis, kadastrs, saimnieciba, nogabals, platiba, mervietas, augstumi, pamezs, pievAtt, pievApst, piezimes, cenas])

  const notirit = () => {
    if (!window.confirm(t.deleteAllConfirm)) return
    localStorage.removeItem(SK)
    setKadastrs(""); setSaimnieciba(""); setNogabals(""); setPlatiba("")
    setMervietas([]); setAugstumi({}); setPamezs(""); setPievAtt(""); setPievApst("")
    setPiezimes(""); setCenas({...DEF_CENAS}); setSolis(-1); setAktivaMv(null); setAktSuga(null)
  }

  // ── Aprēķini ─────────────────────────────────────────────────────────────
  const visasSugas = () => {
    const s = new Set()
    mervietas.forEach(mv => {
      mv.sugas?.forEach(x => s.add(x.suga))
      mv.otraisStavs?.forEach(x => s.add(x.suga))
    })
    return [...s]
  }

  const vidG = (suga, stavs=1) => {
    const gs = mervietas.map(mv =>
      stavs===1 ? (mv.sugas?.find(s=>s.suga===suga)?.g||0)
                : (mv.otraisStavs?.find(s=>s.suga===suga)?.g||0)
    )
    return gs.reduce((a,b)=>a+b,0) / (mervietas.length||1)
  }

  const vidD = (suga, stavs=1) => {
    const ds = []
    mervietas.forEach(mv => {
      const arr = stavs===1 ? mv.sugas : mv.otraisStavs
      const sg = arr?.find(s=>s.suga===suga)
      if (sg?.diametri?.length) ds.push(sg.diametri.reduce((a,b)=>a+b,0)/sg.diametri.length)
    })
    return ds.length ? ds.reduce((a,b)=>a+b,0)/ds.length : 0
  }

  const vidKval = (suga, stavs=1) => {
    const arr = stavs===1 ? "sugas" : "otraisStavs"
    const kvals = mervietas.map(mv=>mv[arr]?.find(s=>s.suga===suga)?.kval).filter(Boolean)
    if (!kvals.length) return "B"
    // Vidējā kvalitāte — ņem mediānu
    const sorted = kvals.map(k => KVALITATES.indexOf(k)).sort((a,b)=>a-b)
    return KVALITATES[sorted[Math.floor(sorted.length/2)]] || "B"
  }

  const rezultati = () => {
    const res = []
    visasSugas().forEach(suga => {
      [1,2].forEach(stavs => {
        const G = vidG(suga, stavs)
        if (G <= 0) return
        const H = parseFloat(stavs===1 ? (augstumi[`${suga}_1`]||augstumi[suga]) : augstumi[`${suga}_2`]) || 0
        if (H <= 0) return
        const kub = G * H * (FF[suga]||0.42)
        const vD = vidD(suga, stavs)
      const kval = vidKval(suga, stavs)
        const arr2 = stavs===1?"sugas":"otraisStavs"
        const mvSugas = mervietas.map(mv=>mv[arr2]?.find(s=>s.suga===suga)).filter(Boolean)
        const sortSums = {}
        mvSugas.forEach(sg => {
          const s = calcSortimentsByQuality(1, suga, sg.kval||"B", vD)
          Object.keys(s).forEach(k => { sortSums[k] = (sortSums[k]||0) + s[k] })
        })
        const n = mvSugas.length || 1
        const sort = {}
        Object.keys(sortSums).forEach(k => { sort[k] = sortSums[k] / n * kub })
        const vert = Object.keys(sort).reduce((s,k) => s+(sort[k]||0)*(cenas[CMAP[k]]||0), 0)
        res.push({ suga, stavs, G, H, vD, kub, sort, vert, kval })
      })
    })
    return res
  }

  // ── Mērvietu funkcijas ────────────────────────────────────────────────────
  const addMv = () => {
    const jaunasM = [...mervietas, jaunsMv()]
    setMervietas(jaunasM)
    setAktivaMv(jaunasM.length-1)
    setOSt(false)
  }

  const pievienotSugu = (idx, stavs, { suga, g, kval }) => {
    const arr = stavs===1 ? "sugas" : "otraisStavs"
    setMervietas(prev => prev.map((mv, i) => {
      if (i !== idx) return mv
      const ex = mv[arr].findIndex(s => s.suga === suga)
      if (ex >= 0) {
        const jauns = [...mv[arr]]
        jauns[ex] = { ...jauns[ex], g, kval }
        return { ...mv, [arr]: jauns }
      }
      return { ...mv, [arr]: [...mv[arr], { suga, g, kval, diametri: [] }] }
    }))
  }

  const delSugu = (idx, suga, stavs=1) => {
    const arr = stavs===1 ? "sugas" : "otraisStavs"
    setMervietas(prev => prev.map((mv,i) => i!==idx ? mv : { ...mv, [arr]: mv[arr].filter(s=>s.suga!==suga) }))
  }

  const addD = (idx, suga, d, stavs=1) => {
    const dN = parseFloat(d)
    if (!dN || dN < 4) return
    const arr = stavs===1 ? "sugas" : "otraisStavs"
    setMervietas(prev => prev.map((mv,i) => {
      if (i!==idx) return mv
      return { ...mv, [arr]: mv[arr].map(s => s.suga!==suga ? s : { ...s, diametri: [...(s.diametri||[]), dN] }) }
    }))
  }

  const delD = (idx, suga, di, stavs=1) => {
    const arr = stavs===1 ? "sugas" : "otraisStavs"
    setMervietas(prev => prev.map((mv,i) => {
      if (i!==idx) return mv
      return { ...mv, [arr]: mv[arr].map(s => s.suga!==suga ? s : { ...s, diametri: s.diametri.filter((_,j)=>j!==di) }) }
    }))
  }

  // ── PDF ──────────────────────────────────────────────────────────────────
  const exportPDF = () => {
    const today = new Date().toLocaleDateString("lv-LV")
    const res = rezultati()
    const kopKub = res.reduce((s,r)=>s+r.kub,0)
    const kopVert = res.reduce((s,r)=>s+r.vert,0)
    const sk = {}
    res.forEach(r => Object.keys(r.sort).forEach(k => { sk[k]=(sk[k]||0)+r.sort[k] }))

    const html = `<html><head><meta charset="UTF-8"><style>
body{font-family:Arial;font-size:10px;padding:20px;max-width:900px;margin:0 auto}
h2{text-align:center;font-size:13px;color:#225522}h3{font-size:11px;color:#225522;margin:12px 0 4px}
table{border-collapse:collapse;width:100%;margin:6px 0}
th{background:#225522;color:white;padding:4px 8px;font-size:9px;text-align:left}
td{border:1px solid #ccc;padding:3px 8px;font-size:10px}
.info td{border:none;padding:2px 6px}.total{font-weight:bold;background:#f0f8f0}.kops{background:#e8f5e9;font-weight:bold}
</style></head><body>
<h2>🌲 ${t.appTitle.toUpperCase()}</h2>
<table class="info"><tbody><tr>
<td><b>${t.saimnieciba}:</b> ${saimnieciba||"—"}</td>
<td><b>${t.kadastrs}:</b> ${kadastrs||"—"}</td>
<td><b>${t.nogabals}:</b> ${nogabals||"—"}</td>
<td><b>${t.platiba}:</b> ${pl>0?pl.toFixed(2)+" ha":"—"}</td>
<td><b>Datums:</b> ${today}</td>
</tr></tbody></table>

<h3>${t.mervietasTitle} (${mervietas.length})</h3>
<table><thead><tr><th>${t.mervieta}</th><th>${t.suga}</th><th>Stāvs</th><th>G (m²/ha)</th><th>Kval.</th><th>D (cm)</th><th>Vid.D</th></tr></thead><tbody>
${mervietas.map((mv,i)=>[
  ...(mv.sugas||[]).map(s=>{const vD=s.diametri?.length?(s.diametri.reduce((a,b)=>a+b,0)/s.diametri.length).toFixed(1):"—";return`<tr><td>${i+1}</td><td>${s.suga} — ${t.sugas[s.suga]}</td><td>1.</td><td>${s.g}</td><td>${s.kval||"—"}</td><td>${(s.diametri||[]).join(", ")||"—"}</td><td>${vD}</td></tr>`}),
  ...(mv.otraisStavs||[]).map(s=>{const vD=s.diametri?.length?(s.diametri.reduce((a,b)=>a+b,0)/s.diametri.length).toFixed(1):"—";return`<tr><td>${i+1}</td><td>${s.suga} — ${t.sugas[s.suga]}</td><td>2.</td><td>${s.g}</td><td>${s.kval||"—"}</td><td>${(s.diametri||[]).join(", ")||"—"}</td><td>${vD}</td></tr>`})
].join("")).join("")}
</tbody></table>

<h3>${t.paSugam}</h3>
<table><thead><tr><th>${t.suga}</th><th>Vid.Kval.</th><th>G</th><th>H</th><th>Vid.D</th><th>m³/ha</th>${pl>0?`<th>m³</th>`:""}
<th>€/ha</th>${pl>0?`<th>€</th>`:""}</tr></thead><tbody>
${res.map(r=>`<tr><td>${r.suga}${r.stavs===2?" (2.)":""} — ${t.sugas[r.suga]}</td><td>${r.kval}</td>
<td>${r.G.toFixed(2)}</td><td>${r.H}m</td><td>${r.vD.toFixed(1)}</td>
<td>${r.kub.toFixed(1)}</td>${pl>0?`<td>${(r.kub*pl).toFixed(1)}</td>`:""}
<td>${r.vert.toFixed(0)}</td>${pl>0?`<td>${(r.vert*pl).toFixed(0)}</td>`:""}</tr>`).join("")}
<tr class="total"><td colspan="5">KOPĀ</td>
<td>${kopKub.toFixed(1)} m³/ha</td>${pl>0?`<td>${(kopKub*pl).toFixed(1)} m³</td>`:""}
<td>${kopVert.toFixed(0)} €/ha</td>${pl>0?`<td>${(kopVert*pl).toFixed(0)} €</td>`:""}</tr>
</tbody></table>

<h3>${t.sortiTitle}</h3>
<table><thead><tr><th>Sortiments</th><th>m³/ha</th>${pl>0?`<th>m³</th>`:""}
<th>€/m³</th><th>€/ha</th>${pl>0?`<th>€</th>`:""}</tr></thead><tbody>
${Object.keys(sk).filter(k=>sk[k]>0.1).map(k=>`<tr>
<td>${t.sorti[k]||k}</td><td>${sk[k].toFixed(1)}</td>${pl>0?`<td>${(sk[k]*pl).toFixed(1)}</td>`:""}
<td>${cenas[k]||0}</td><td>${(sk[k]*(cenas[k]||0)).toFixed(0)}</td>${pl>0?`<td>${(sk[k]*pl*(cenas[k]||0)).toFixed(0)}</td>`:""}</tr>`).join("")}
</tbody></table>

${pamezs||pievAtt||piezimes?`<h3>${t.piezimesSum}</h3><table class="info"><tbody>
${pamezs?`<tr><td><b>${t.pamezs}:</b> ${pamezs}</td></tr>`:""}
${pievAtt?`<tr><td><b>${t.pievesanaAtt}:</b> ${pievAtt}m — ${pievApst}</td></tr>`:""}
${piezimes?`<tr><td>${piezimes}</td></tr>`:""}</tbody></table>`:""}

<div style="margin-top:20px;padding-top:12px;border-top:1px solid #ccc;display:flex;justify-content:space-between;font-size:10px">
<div>Novērtēja: ___________________________</div><div>${today}</div></div>
<p style="font-size:8px;color:#888;margin-top:12px">* Sagatavots ar Meža tirgus mobilā rīka palīdzību</p>
</body></html>`
    const win = window.open("","_blank"); win.document.write(html); win.document.close(); win.print()
  }

  const SOLI = [t.step0, t.step1, t.step2, t.step3, t.step4]

  const Hdr = () => (
    <div style={c.hdr}>
      <button style={c.bkBtn} onClick={onBack}>{t.back}</button>
      <h1 style={c.ttl}>{t.appTitle}</h1>
      <div style={c.lRow}>
        {["LV","EN","RU"].map(l=><button key={l} style={c.lBtn(lang===l)} onClick={()=>setLang(l)}>{l}</button>)}
      </div>
    </div>
  )

  const Dots = ({cur}) => (
    <div style={{display:"flex",justifyContent:"center",gap:6,padding:"10px 0"}}>
      {SOLI.map((_,i)=><div key={i} style={c.dot(i===cur,i<cur)} onClick={()=>setSolis(i)}/>)}
    </div>
  )

  // ── SĀKUMA EKRĀNS ─────────────────────────────────────────────────────────
  if (solis===-1) return (
    <div style={c.app}>
      <Hdr/>
      <div style={c.hero}>
        <div style={{fontSize:20,fontWeight:700,color:"#a8d8a8",marginBottom:10}}>{t.welcomeTitle}</div>
        <p style={{fontSize:13,color:"#7ab87a",lineHeight:1.6,margin:"0 0 16px"}}>{t.welcomeDesc}</p>
        <div style={{fontSize:13,fontWeight:700,color:"#c8e6c8",marginBottom:8}}>{t.whatYouGet}</div>
        {t.whatYouGetList.map((item,i)=>(
          <div key={i} style={c.bul}><div style={{color:"#4caf50",fontSize:16,marginTop:-1}}>✓</div><span>{item}</span></div>
        ))}
      </div>
      <div style={c.sec}>
        <div style={c.sh}>{t.howTitle}</div>
        <div style={c.sb}>
          {t.howList.map((item,i)=>(
            <div key={i} style={c.bul}><div style={c.bulN}>{i+1}</div><span>{item}</span></div>
          ))}
        </div>
      </div>
      <div style={{padding:"0 16px"}}>
        {sv?.mervietas?.length>0 ? <>
          <button style={c.btn1} onClick={()=>setSolis(1)}>{t.continueBtn}</button>
          <button style={{...c.btn2,width:"100%",marginTop:8}} onClick={()=>{if(window.confirm(t.deleteOldConfirm)){notirit()}}}>{t.deleteOld}</button>
        </> : <button style={c.btn1} onClick={()=>setSolis(0)}>{t.startBtn}</button>}
      </div>
    </div>
  )

  // ── SOLIS 0: INFO ─────────────────────────────────────────────────────────
  if (solis===0) return (
    <div style={c.app}><Hdr/><Dots cur={0}/>
      <div style={c.sec}>
        <div style={c.sh}>📋 {t.infoTitle}</div>
        <div style={c.sb}>
          {[[t.saimnieciba,saimnieciba,setSaimnieciba],[t.kadastrs,kadastrs,setKadastrs],[t.nogabals,nogabals,setNogabals]].map(([lbl,val,set])=>(
            <div key={lbl} style={{marginBottom:12}}>
              <label style={c.lbl}>{lbl}</label>
              <input style={c.inp} value={val} onChange={e=>set(e.target.value)} placeholder={lbl+"..."}/>
            </div>
          ))}
          <div style={{marginBottom:12}}>
            <label style={c.lbl}>{t.platiba}</label>
            <input style={c.inp} type="number" inputMode="decimal" value={platiba} onChange={e=>setPlatiba(e.target.value)} placeholder="0.00"/>
          </div>
        </div>
      </div>
      <div style={{padding:"0 16px"}}>
        <button style={c.btn1} onClick={()=>setSolis(1)}>{t.nextToMeasure}</button>
        {mervietas.length>0&&<div style={{marginTop:8,padding:"10px 14px",background:"#1a2e1a",borderRadius:10,border:"1px solid #2d4a2d",fontSize:13,color:"#7ab87a"}}>✓ {mervietas.length} {t.savedMervietas}</div>}
        <button style={{...c.btn2,width:"100%",marginTop:8}} onClick={()=>setSolis(-1)}>← {t.step0}</button>
      </div>
    </div>
  )

  // ── SOLIS 1: MĒRVIETAS ────────────────────────────────────────────────────
  if (solis===1) {
    const mv = aktivaMv!==null ? mervietas[aktivaMv] : null
    return (
      <div style={c.app}><Hdr/><Dots cur={1}/>
        <div style={c.sec}>
          <div style={c.sh}>📍 {t.mervietasTitle}</div>
          <div style={c.sb}>
            <div style={c.ins}>{t.mervietasInstr}</div>
            {mervietas.map((mv,i)=>(
              <div key={mv.id} style={{...c.crd,border:aktivaMv===i?"1px solid #4caf50":"1px solid #2d4a2d",cursor:"pointer"}}
                onClick={()=>setAktivaMv(aktivaMv===i?null:i)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontWeight:700,color:"#a8d8a8"}}>{t.mervieta} {i+1}</span>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:12,color:"#7ab87a"}}>{(mv.sugas?.length||0)+(mv.otraisStavs?.length||0)} suga(-s)</span>
                    <button style={c.btnD} onClick={e=>{e.stopPropagation();if(window.confirm(t.deleteMv)){
                      const jM=mervietas.filter((_,j)=>j!==i)
                      setMervietas(jM)
                      if(aktivaMv===i)setAktivaMv(null)
                      else if(aktivaMv>i)setAktivaMv(aktivaMv-1)
                    }}}>✕</button>
                  </div>
                </div>
                {mv.sugas?.map(sg=>(
                  <div key={sg.suga} style={{fontSize:12,color:"#7ab87a",marginTop:3}}>
                    {sg.suga}: G={sg.g} <span style={c.kvBadge}>{sg.kval}</span> | {sg.diametri?.length||0} {t.diameters}
                  </div>
                ))}
                {mv.otraisStavs?.length>0&&mv.otraisStavs.map(sg=>(
                  <div key={"2"+sg.suga} style={{fontSize:12,color:"#90a4ae",marginTop:2}}>
                    2. {sg.suga}: G={sg.g} <span style={c.kvBadge}>{sg.kval}</span> | {sg.diametri?.length||0} {t.diameters}
                  </div>
                ))}
              </div>
            ))}
            <button style={{...c.btn2,width:"100%"}} onClick={addMv}>+ {t.addMervieta}</button>
          </div>
        </div>

        {aktivaMv!==null&&mv&&(
          <div style={c.sec}>
            <div style={c.sh}>✏️ {t.mervieta} {aktivaMv+1}</div>
            <div style={c.sb}>
              {/* 1. STĀVS */}
              <div style={{fontSize:12,color:"#7ab87a",fontWeight:700,marginBottom:8}}>▶ {t.stavs1}</div>
              <SugaForma
                t={t}
                stavs={1}
                esosasSugas={mv.sugas?.map(s=>s.suga)||[]}
                onPievienot={(data)=>pievienotSugu(aktivaMv, 1, data)}
              />

              {/* Esošās sugas 1. stāvs */}
              {mv.sugas?.map(sg=>(
                <div key={sg.suga} style={c.crd}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{fontWeight:700,color:"#a8d8a8"}}>
                      {sg.suga} ({t.sugas[sg.suga]}) G={sg.g}
                      <span style={c.kvBadge}>{sg.kval}</span>
                    </span>
                    <button style={c.btnD} onClick={()=>delSugu(aktivaMv,sg.suga,1)}>✕</button>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                    {sg.diametri?.map((d,di)=>(
                      <span key={di} style={c.chip}>{d}
                        <button style={c.chipX} onClick={()=>delD(aktivaMv,sg.suga,di,1)}>×</button>
                      </span>
                    ))}
                  </div>
                  {aktSuga?.mvIdx===aktivaMv&&aktSuga?.suga===sg.suga&&aktSuga?.stavs===1 ? (
                    <div style={c.row}>
                      <input style={{...c.nInp,fontSize:20}} type="number" inputMode="numeric" value={jD}
                        onChange={e=>setJD(e.target.value)} placeholder={t.dPlaceholder} autoFocus
                        onKeyDown={e=>{if(e.key==="Enter"){addD(aktivaMv,sg.suga,jD,1);setJD("")}}}/>
                      <button style={{...c.btn1,marginTop:0,flex:1}}
                        onClick={()=>{addD(aktivaMv,sg.suga,jD,1);setJD("")}}>+</button>
                      <button style={c.btnD} onClick={()=>setAktSuga(null)}>✓</button>
                    </div>
                  ) : (
                    <button style={{...c.btn2,fontSize:12}}
                      onClick={()=>{setAktSuga({mvIdx:aktivaMv,suga:sg.suga,stavs:1});setJD("")}}>
                      {t.measureDiam} ({sg.diametri?.length||0}/{sg.g}) {sg.g-(sg.diametri?.length||0)>0?`— atliek ${sg.g-(sg.diametri?.length||0)}`:"✓"}
                    </button>
                  )}
                </div>
              ))}

              <div style={c.div}/>
              {/* 2. STĀVS toggle */}
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <button style={c.tog(!oSt)} onClick={()=>setOSt(false)}>{t.no2stavs}</button>
                <button style={c.tog(oSt)} onClick={()=>setOSt(true)}>{t.add2stavs}</button>
              </div>

              {oSt&&<>
                <div style={{fontSize:12,color:"#90a4ae",fontWeight:700,marginBottom:8}}>▶ {t.stavs2}</div>
                <SugaForma
                  t={t}
                  stavs={2}
                  esosasSugas={mv.otraisStavs?.map(s=>s.suga)||[]}
                  onPievienot={(data)=>pievienotSugu(aktivaMv, 2, data)}
                />
                {mv.otraisStavs?.map(sg=>(
                  <div key={"2"+sg.suga} style={{...c.crd,border:"1px solid #37474f"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <span style={{fontWeight:700,color:"#90a4ae"}}>
                        2. {sg.suga} G={sg.g}
                        <span style={c.kvBadge}>{sg.kval}</span>
                      </span>
                      <button style={c.btnD} onClick={()=>delSugu(aktivaMv,sg.suga,2)}>✕</button>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                      {sg.diametri?.map((d,di)=>(
                        <span key={di} style={c.chip}>{d}
                          <button style={c.chipX} onClick={()=>delD(aktivaMv,sg.suga,di,2)}>×</button>
                        </span>
                      ))}
                    </div>
                    {aktSuga?.mvIdx===aktivaMv&&aktSuga?.suga===sg.suga&&aktSuga?.stavs===2 ? (
                      <div style={c.row}>
                        <input style={{...c.nInp,fontSize:20}} type="number" inputMode="numeric" value={jD}
                          onChange={e=>setJD(e.target.value)} placeholder={t.dPlaceholder} autoFocus
                          onKeyDown={e=>{if(e.key==="Enter"){addD(aktivaMv,sg.suga,jD,2);setJD("")}}}/>
                        <button style={{...c.btn1,marginTop:0,flex:1}}
                          onClick={()=>{addD(aktivaMv,sg.suga,jD,2);setJD("")}}>+</button>
                        <button style={c.btnD} onClick={()=>setAktSuga(null)}>✓</button>
                      </div>
                    ) : (
                      <button style={{...c.btn2,fontSize:12}}
                        onClick={()=>{setAktSuga({mvIdx:aktivaMv,suga:sg.suga,stavs:2});setJD("")}}>
                        {t.measureDiam} ({sg.diametri?.length||0}/{sg.g}) {sg.g-(sg.diametri?.length||0)>0?`— atliek ${sg.g-(sg.diametri?.length||0)}`:"✓"}
                      </button>
                    )}
                  </div>
                ))}
              </>}
            </div>
          </div>
        )}

        <div style={{padding:"0 16px"}}>
          <button style={c.btn1} onClick={()=>setSolis(2)}>{t.nextToHeights}</button>
          <button style={{...c.btn2,width:"100%",marginTop:8}} onClick={()=>setSolis(0)}>← {t.step0}</button>
        </div>
      </div>
    )
  }

  // ── SOLIS 2: AUGSTUMI ─────────────────────────────────────────────────────
  if (solis===2) {
    const allS = visasSugas()
    return (
      <div style={c.app}><Hdr/><Dots cur={2}/>
        <div style={c.sec}>
          <div style={c.sh}>📐 {t.augstumTitle}</div>
          <div style={c.sb}>
            <div style={c.ins}>{t.augstumInstr}</div>
            {allS.length===0&&<div style={{color:"#7ab87a",fontSize:13}}>{t.noMervietas}</div>}
            {allS.map(suga=>{
              const ir2 = mervietas.some(mv=>mv.otraisStavs?.find(s=>s.suga===suga))
              return (
                <div key={suga} style={{marginBottom:16}}>
                  <label style={c.lbl}>{suga} — {t.sugas[suga]} {t.stavs1label}</label>
                  <input style={c.nInp} type="number" inputMode="numeric"
                    value={augstumi[`${suga}_1`]||augstumi[suga]||""}
                    onChange={e=>setAugstumi({...augstumi,[`${suga}_1`]:e.target.value,[suga]:e.target.value})}
                    placeholder={t.hPlaceholder}/>
                  {ir2&&<>
                    <label style={{...c.lbl,marginTop:8,color:"#90a4ae"}}>{suga} — {t.sugas[suga]} {t.stavs2label}</label>
                    <input style={{...c.nInp,borderColor:"#37474f"}} type="number" inputMode="numeric"
                      value={augstumi[`${suga}_2`]||""}
                      onChange={e=>setAugstumi({...augstumi,[`${suga}_2`]:e.target.value})}
                      placeholder={t.hPlaceholder}/>
                  </>}
                </div>
              )
            })}
          </div>
        </div>
        <div style={{padding:"0 16px"}}>
          <button style={c.btn1} onClick={()=>setSolis(3)}>{t.nextToNotes}</button>
          <button style={{...c.btn2,width:"100%",marginTop:8}} onClick={()=>setSolis(1)}>← {t.step1}</button>
        </div>
      </div>
    )
  }

  // ── SOLIS 3: PIEZĪMES + CENAS ─────────────────────────────────────────────
  if (solis===3) return (
    <div style={c.app}><Hdr/><Dots cur={3}/>
      <div style={c.sec}>
        <div style={c.sh}>🌿 {t.pamezs}</div>
        <div style={c.sb}>
          <div style={c.ins}>{t.pamezsInstr}</div>
          <div style={{display:"flex",gap:8}}>
            {[t.pamezsNav,t.pamezsVidejs,t.pamezsBiezs].map(v=><button key={v} style={c.tog(pamezs===v)} onClick={()=>setPamezs(v)}>{v}</button>)}
          </div>
        </div>
      </div>
      <div style={c.sec}>
        <div style={c.sh}>🚜 {t.pievesana}</div>
        <div style={c.sb}>
          <div style={c.ins}>{t.pievesanaInstr}</div>
          <label style={c.lbl}>{t.pievesanaAtt}</label>
          <input style={{...c.inp,marginBottom:12}} type="number" value={pievAtt} onChange={e=>setPievAtt(e.target.value)} placeholder="0"/>
          <label style={c.lbl}>{t.pievesanaApst}</label>
          <div style={{display:"flex",gap:8}}>
            {[t.labi,t.videjis,t.smagi].map(v=><button key={v} style={c.tog(pievApst===v)} onClick={()=>setPievApst(v)}>{v}</button>)}
          </div>
        </div>
      </div>
      <div style={c.sec}>
        <div style={c.sh}>📝 {t.piezimesTitle}</div>
        <div style={c.sb}>
          <textarea style={{...c.inp,height:80,resize:"vertical"}} value={piezimes}
            onChange={e=>setPiezimes(e.target.value)} placeholder={t.piezimesPlaceholder}/>
        </div>
      </div>
      <div style={c.sec}>
        <div style={c.sh}>💶 {t.cenasTitle}</div>
        <div style={c.sb}>
          <div style={c.ins}>{t.cenasInstr}</div>
          {Object.keys(cenas).map(k=>(
            <div key={k} style={{marginBottom:10}}>
              <label style={c.lbl}>{t.sorti[k]||k}</label>
              <input style={c.nInp} type="number" inputMode="decimal" value={cenas[k]}
                onChange={e=>setCenas({...cenas,[k]:parseFloat(e.target.value)||0})}/>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"0 16px"}}>
        <button style={c.btn1} onClick={()=>setSolis(4)}>{t.calculate}</button>
        <button style={{...c.btn2,width:"100%",marginTop:8}} onClick={()=>setSolis(2)}>← {t.step2}</button>
      </div>
    </div>
  )

  // ── SOLIS 4: REZULTĀTI ────────────────────────────────────────────────────
  if (solis===4) {
    const res = rezultati()
    const kopKub = res.reduce((s,r)=>s+r.kub,0)
    const kopVert = res.reduce((s,r)=>s+r.vert,0)
    const sk = {}
    res.forEach(r=>Object.keys(r.sort).forEach(k=>{sk[k]=(sk[k]||0)+r.sort[k]}))

    return (
      <div style={c.app}><Hdr/><Dots cur={4}/>
        {res.length===0 ? (
          <div style={c.sec}><div style={c.sb}><p style={{color:"#e57373",fontSize:13}}>{t.noResults}</p></div></div>
        ) : <>
          {/* Kopsavilkums */}
          <div style={{margin:"12px 16px",background:"linear-gradient(135deg,#1b5e20,#2e7d32)",borderRadius:14,padding:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
              <div style={{textAlign:"center",flex:1}}>
                <div style={{fontSize:10,color:"#a8d8a8",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4}}>{t.kubatura}</div>
                <div style={{fontSize:28,fontWeight:700,color:"white"}}>{kopKub.toFixed(1)}</div>
                <div style={{fontSize:12,color:"#a8d8a8"}}>m³/ha</div>
                <div style={{fontSize:11,color:"#c8e6c8",marginTop:4}}>{t.vertiba}</div>
                <div style={{fontSize:16,fontWeight:700,color:"#c8e6c8"}}>{kopVert.toFixed(0)} €/ha</div>
              </div>
              {pl>0&&<>
                <div style={{width:1,background:"rgba(255,255,255,0.2)",alignSelf:"stretch"}}/>
                <div style={{textAlign:"center",flex:1}}>
                  <div style={{fontSize:10,color:"#a8d8a8",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4}}>{t.kopKubatura}</div>
                  <div style={{fontSize:28,fontWeight:700,color:"#ffcc80"}}>{(kopKub*pl).toFixed(1)}</div>
                  <div style={{fontSize:12,color:"#a8d8a8"}}>m³ ({pl.toFixed(2)} ha)</div>
                  <div style={{fontSize:11,color:"#ffcc80",marginTop:4}}>{t.kopVertiba}</div>
                  <div style={{fontSize:16,fontWeight:700,color:"#ffcc80"}}>{(kopVert*pl).toFixed(0)} €</div>
                </div>
              </>}
            </div>
          </div>

          {/* Pa sugām */}
          <div style={c.sec}>
            <div style={c.sh}>🌲 {t.paSugam}</div>
            <div style={c.sb}>
              {res.map((r,i)=>(
                <div key={i} style={c.crd}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontWeight:700,color:"#a8d8a8"}}>
                      {r.suga}{r.stavs===2?" (2.)":""} — {t.sugas[r.suga]}
                      <span style={c.kvBadge}>{r.kval}</span>
                    </span>
                    <span style={{color:"#4caf50",fontWeight:700}}>{r.vert.toFixed(0)} €/ha</span>
                  </div>
                  <div style={{fontSize:12,color:"#7ab87a",marginTop:4}}>
                    G={r.G.toFixed(2)} m²/ha | H={r.H} m | Vid.D={r.vD.toFixed(1)} cm
                  </div>
                  <div style={{fontSize:12,color:"#4caf50",marginTop:2}}>
                    Krāja: <b>{r.kub.toFixed(1)} m³/ha</b>
                    {pl>0&&<span style={{color:"#ffcc80"}}> | <b>{(r.kub*pl).toFixed(1)} m³</b> cirsmai</span>}
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>
                    {Object.keys(r.sort).filter(k=>r.sort[k]>0.1).map(k=>(
                      <span key={k} style={{...c.chip,fontSize:11}}>{t.sorti[k]||k}: {r.sort[k].toFixed(1)}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sortimenti */}
          <div style={c.sec}>
            <div style={c.sh}>📦 {t.sortiTitle}</div>
            <div style={c.sb}>
              {Object.keys(sk).filter(k=>sk[k]>0.1).map(k=>(
                <div key={k} style={{padding:"8px 0",borderBottom:"1px solid #2d4a2d"}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{color:"#a8d8a8"}}>{t.sorti[k]||k}</span>
                    <div style={{textAlign:"right"}}>
                      <span style={{color:"#7ab87a"}}>{sk[k].toFixed(1)} m³/ha</span>
                      <span style={{color:"#4caf50",marginLeft:12,fontWeight:700}}>{(sk[k]*(cenas[k]||0)).toFixed(0)} €/ha</span>
                    </div>
                  </div>
                  {pl>0&&<div style={{textAlign:"right",fontSize:11,color:"#ffcc80",marginTop:2}}>
                    {(sk[k]*pl).toFixed(1)} m³ | {(sk[k]*pl*(cenas[k]||0)).toFixed(0)} € cirsmai
                  </div>}
                </div>
              ))}
            </div>
          </div>

          {/* Piezīmes */}
          {(pamezs||pievAtt||pievApst||piezimes)&&(
            <div style={c.sec}>
              <div style={c.sh}>📝 {t.piezimesSum}</div>
              <div style={c.sb}>
                {pamezs&&<div style={{fontSize:13,marginBottom:6}}>🌿 {t.pamezs}: <b>{pamezs}</b></div>}
                {pievAtt&&<div style={{fontSize:13,marginBottom:6}}>🚜 {pievAtt} m — {pievApst}</div>}
                {piezimes&&<div style={{fontSize:13,color:"#7ab87a"}}>{piezimes}</div>}
              </div>
            </div>
          )}
        </>}
        <div style={{padding:"0 16px"}}>
          <button style={c.btnO} onClick={exportPDF}>{t.printPDF}</button>
          <button style={{...c.btn2,width:"100%",marginTop:8}} onClick={()=>setSolis(3)}>{t.editBack}</button>
          <button style={{...c.btnD,width:"100%",marginTop:8}} onClick={notirit}>{t.deleteAll}</button>
        </div>
      </div>
    )
  }

  return null
}
