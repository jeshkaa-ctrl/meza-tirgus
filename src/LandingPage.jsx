import React from "react"
import { C as DS, F } from "./ds"
import JautaParMezuWidget from "./components/JautaParMezuWidget"

function MezaTirgusLogo(){
return(
<svg width="200" height="52" viewBox="0 0 200 52" xmlns="http://www.w3.org/2000/svg">
<rect width="200" height="52" rx="8" fill="#0f1a0f"/>
  <polygon points="22,38 30,18 38,38" fill="#2e7d32"/>
  <polygon points="18,38 30,12 42,38" fill="#1b5e20" opacity="0.6"/>
  <rect x="27" y="37" width="6" height="8" rx="1" fill="#1b5e20"/>
  <line x1="52" y1="8" x2="52" y2="44" stroke="#1e3a1e" strokeWidth="1"/>
  <text x="64" y="24" fontFamily="Arial" fontSize="15" fontWeight="800" fill="#4caf50" letterSpacing="1">MEŽA</text>
  <text x="64" y="40" fontFamily="Arial" fontSize="15" fontWeight="800" fill="#81c784" letterSpacing="1">TIRGUS</text>
  <circle cx="188" cy="10" r="4" fill="#4caf50"/>
</svg>
)
}

// ========== GALVENA APP ==========
function LandingPage({onEnter, onStandard, user, onIziet, onReg, onSludinajumi, onLikumi, onTirgus}){
return(
<div style={{fontFamily:F.family,minHeight:"100vh",background:DS.bg,maxWidth:"100%",overflowX:"hidden"}}>

  {/* HERO */}
 <div style={{background:"linear-gradient(160deg, #0a1a0a 0%, #1a3a1a 60%, #0f2a0f 100%)",padding:"56px 40px 64px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
  {/* Dekoratīvs fona elements */}
  <div style={{position:"absolute",top:"-60px",right:"-60px",width:"300px",height:"300px",background:"radial-gradient(circle, rgba(76,175,80,0.08) 0%, transparent 70%)",pointerEvents:"none"}}/>
  <div style={{position:"absolute",bottom:"-40px",left:"-40px",width:"200px",height:"200px",background:"radial-gradient(circle, rgba(76,175,80,0.05) 0%, transparent 70%)",pointerEvents:"none"}}/>

  <MezaTirgusLogo/>

  <h1 style={{color:"white",fontSize:"32px",fontWeight:800,margin:"24px 0 8px",letterSpacing:"-0.03em",lineHeight:1.2}}>
    Meža vērtība — vienā skatā
  </h1>
  <p style={{color:"#7ab87a",fontSize:"16px",maxWidth:"520px",margin:"0 auto 32px",lineHeight:1.6}}>
    Profesionāli rīki meža speciālistam — cirsmu vērtēšana, dastojumi, rēķini un pavadzīmes vienā platformā.
  </p>

  <div style={{display:"flex",gap:"12px",justifyContent:"center",flexWrap:"wrap"}}>
    <button onClick={onStandard} style={{padding:"13px 32px",background:"linear-gradient(135deg, #4caf50, #2e7d32)",color:"white",border:"none",borderRadius:"8px",fontSize:"15px",fontWeight:700,cursor:"pointer",boxShadow:"0 4px 16px rgba(76,175,80,0.3)"}}>
      Sākt bezmaksas →
    </button>
    {user
      ? <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          <span style={{color:"#7ab87a",fontSize:"14px",padding:"8px 14px",background:"rgba(255,255,255,0.05)",borderRadius:"8px",border:"1px solid #2d5a2d"}}>👤 {user.vards}</span>
          <button onClick={onIziet} style={{padding:"11px 20px",background:"transparent",color:"#7ab87a",border:"1px solid #2d5a2d",borderRadius:"8px",fontSize:"14px",cursor:"pointer"}}>Iziet</button>
        </div>
      : <button onClick={onReg} style={{padding:"13px 32px",background:"transparent",color:"white",border:"2px solid rgba(255,255,255,0.3)",borderRadius:"8px",fontSize:"15px",cursor:"pointer",fontWeight:600}}>Reģistrēties</button>
    }
    <button onClick={onSludinajumi} style={{padding:"13px 28px",background:"transparent",color:"#7ab87a",border:"1px solid #2d5a2d",borderRadius:"8px",fontSize:"15px",cursor:"pointer"}}>
      📢 Sludinājumi
    </button>
    <button onClick={onLikumi} style={{padding:"13px 28px",background:"transparent",color:"#a8d8a8",border:"1px solid #2d5a2d",borderRadius:"8px",fontSize:"15px",cursor:"pointer"}}>
      ⚖️ Meža likumi
    </button>
    <div style={{position:"relative",display:"inline-block"}}
      onMouseEnter={e=>e.currentTarget.querySelector('.pilna-menu').style.display='block'}
      onMouseLeave={e=>e.currentTarget.querySelector('.pilna-menu').style.display='none'}>
      <button onClick={onEnter} style={{padding:"13px 28px",background:"transparent",color:"#4caf50",border:"2px solid #4caf50",borderRadius:"8px",fontSize:"15px",cursor:"pointer",fontWeight:600}}>
        Pilnā versija ▾
      </button>
      <div className="pilna-menu" style={{display:"none",position:"absolute",top:"100%",left:0,background:"#1a2e1a",border:"1px solid #2d5a2d",borderRadius:"8px",padding:"8px 0",minWidth:"220px",zIndex:100,marginTop:"6px",boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}>
        {["📐 Cirsmas skice","📏 Caurmēra mērījumi","🌲 Dastojumu aprēķini","🧾 Rēķinu izveide","📊 Cirsmu vērtēšana"].map((t,i)=>(
          <div key={i} onClick={onEnter} style={{padding:"10px 16px",fontSize:"13px",color:"#a8d8a8",cursor:"pointer",borderBottom:"1px solid #1a2e1a"}}
            onMouseEnter={e=>e.currentTarget.style.background="#225522"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{t}</div>
        ))}
      </div>
    </div>
  </div>
</div>

  {/* JAUTĀ PAR MEŽU WIDGET */}
  <div style={{maxWidth:"900px",margin:"0 auto",padding:"32px 24px 0",width:"100%",boxSizing:"border-box"}}>
    <JautaParMezuWidget onPilnsSkats={onLikumi} />
  </div>

  {/* KAS IR MEŽA TIRGUS */}
  <div style={{maxWidth:"900px",margin:"0 auto",padding:"24px 24px 0",textAlign:"center",width:"100%",boxSizing:"border-box",background:"#080f08"}}>
<div style={{background:"linear-gradient(135deg, #1a2e1a, #0f1f0f)",border:"1px solid #2d5a2d",borderRadius:"16px",padding:"40px",marginBottom:"24px"}}>
  <h2 style={{color:"#4caf50",fontSize:"24px",textAlign:"center",marginBottom:"24px",fontWeight:800,letterSpacing:"-0.02em"}}>Kas ir Meža tirgus?</h2>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"24px",marginBottom:"24px"}}>
    {[
      {icon:"🌲",title:"Meža rīki",text:"Cirsmu vērtēšana, dastojumi, caurmēra mērījumi — viss vienā vietā."},
      {icon:"🤝",title:"Savienojam",text:"Īpašnieki, mežsaimnieki, harvesteru operatori — vienā platformā."},
      {icon:"📱",title:"Laukā & birojā",text:"Mobilās aplikācijas laukā, pilnā versija birojā — aprēķini reāllaikā."},
    ].map((item,i)=>(
      <div key={i} style={{textAlign:"center",padding:"20px 16px",background:"rgba(76,175,80,0.05)",borderRadius:"10px",border:"1px solid #1e3a1e"}}>
        <div style={{fontSize:"32px",marginBottom:"10px"}}>{item.icon}</div>
        <div style={{color:"#4caf50",fontWeight:700,fontSize:"14px",marginBottom:"6px"}}>{item.title}</div>
        <div style={{color:"#7ab87a",fontSize:"13px",lineHeight:1.6}}>{item.text}</div>
      </div>
    ))}
  </div>
  <p style={{textAlign:"center",color:"#4a7a4a",fontSize:"13px",margin:0,fontStyle:"italic"}}>
    🔒 Jūsu dati nekur netiek saglabāti. Meža tirgus nav inventarizācijas sistēma — tā ir tikšanās vieta cilvēkiem, kuriem rūp mežs.
  </p>
</div>

    {/* PLĀNI — 3 kartiņas */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"16px",marginBottom:"24px"}}>

      {/* BEZMAKSAS */}
      <div style={{background:"linear-gradient(160deg,#0f1f0f,#1a2e1a)",border:"1px solid #2d5a2d",borderRadius:"16px",padding:"24px",display:"flex",flexDirection:"column"}}>
        <div style={{color:"#4caf50",fontWeight:800,fontSize:"20px",marginBottom:"4px"}}>✓ Bezmaksas</div>
        <div style={{color:"#4a7a4a",fontSize:"12px",marginBottom:"4px"}}>Sāc bez maksas uzreiz</div>
        <div style={{color:"#4caf50",fontSize:"24px",fontWeight:800,marginBottom:"16px"}}>€0</div>
        {[
          {icon:"🌿",text:"Tirgus plūsma — posti, bildes, sludinājumi"},
          {icon:"⚖️",text:"Meža likuma un tirgus konsultants"},
          {icon:"📐",text:"Kubatūras kalkulators"},
          {icon:"📏",text:"Caurmēra mērīšana un bonitāte"},
          {icon:"🗺",text:"Cirsmas skice (bez PDF)"},
          {icon:"📢",text:"Sludinājumu un izsolu skatīšana"},
        ].map((t,i)=>(
          <div key={i} style={{fontSize:"13px",color:"#a8d8a8",padding:"6px 0",borderBottom:"1px solid #1e3a1e",display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{fontSize:"14px"}}>{t.icon}</span>{t.text}
          </div>
        ))}
        <button onClick={onStandard} style={{marginTop:"auto",paddingTop:"16px",width:"100%",padding:"12px",background:"linear-gradient(135deg,#2d5a2d,#1a3a1a)",color:"#4caf50",border:"1px solid #4caf50",borderRadius:"8px",cursor:"pointer",fontWeight:700,fontSize:"14px"}}>
          Sākt bez maksas →
        </button>
      </div>

      {/* PRO */}
      <div style={{background:"linear-gradient(160deg,#0d1f0d,#1a3a1a)",border:"2px solid #4caf50",borderRadius:"16px",padding:"24px",position:"relative",display:"flex",flexDirection:"column",boxShadow:"0 0 24px rgba(76,175,80,0.15)"}}>
        <div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:"#4caf50",color:"white",fontSize:"11px",fontWeight:700,padding:"3px 14px",borderRadius:"10px",whiteSpace:"nowrap"}}>POPULĀRĀKAIS</div>
        <div style={{color:"#4caf50",fontWeight:800,fontSize:"20px",marginBottom:"4px"}}>★ Pro</div>
        <div style={{color:"#7ab87a",fontSize:"12px",marginBottom:"4px"}}>Meža speciālistiem</div>
        <div style={{marginBottom:"16px"}}>
          <span style={{color:"white",fontSize:"24px",fontWeight:800}}>€19</span>
          <span style={{color:"#7ab87a",fontSize:"13px"}}>/mēn.</span>
          <div style={{color:"#4caf50",fontSize:"11px",marginTop:"2px"}}>vai €159/gadā — ietaupa €69</div>
        </div>
        {[
          {icon:"📄",text:"Neierobežoti PDF (skices, novērtējumi, atskaites)"},
          {icon:"📱",text:"Mobilā cirsmu novērtēšana laukā"},
          {icon:"🌲",text:"Dastojuma uzmērīšana (VMD standarts)"},
          {icon:"📸",text:"Kubatūras mērītājs ar AI foto analīzi"},
          {icon:"🚛",text:"Loģistikas kalkulators"},
          {icon:"📂",text:"Cirsmu un dastojumu arhīvs"},
          {icon:"📢",text:"Sludinājuma publicēšana"},
          {icon:"🏷",text:"Izsoles dalība (pirkšana)"},
          {icon:"🧾",text:"Rēķinu krātuve"},
        ].map((t,i)=>(
          <div key={i} style={{fontSize:"13px",color:"#a8d8a8",padding:"6px 0",borderBottom:"1px solid #1e3a1e",display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{fontSize:"14px"}}>{t.icon}</span>{t.text}
          </div>
        ))}
        <button onClick={onEnter} style={{marginTop:"auto",paddingTop:"16px",width:"100%",padding:"12px",background:"linear-gradient(135deg,#4caf50,#2e7d32)",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:700,fontSize:"14px"}}>
          Izmēģināt Pro →
        </button>
      </div>

      {/* KOMERCIJA */}
      <div style={{background:"linear-gradient(160deg,#1a1000,#2a1f00)",border:"1px solid #fbbf24",borderRadius:"16px",padding:"24px",display:"flex",flexDirection:"column"}}>
        <div style={{color:"#fbbf24",fontWeight:800,fontSize:"20px",marginBottom:"4px"}}>🏢 Komercija</div>
        <div style={{color:"#7a6a00",fontSize:"12px",marginBottom:"4px"}}>Uzņēmumiem un tirgotājiem</div>
        <div style={{marginBottom:"16px"}}>
          <span style={{color:"white",fontSize:"24px",fontWeight:800}}>€59</span>
          <span style={{color:"#a68a00",fontSize:"13px"}}>/mēn.</span>
          <div style={{color:"#fbbf24",fontSize:"11px",marginTop:"2px"}}>vai €490/gadā</div>
        </div>
        {[
          {icon:"✓",text:"Viss no Pro"},
          {icon:"🏷",text:"Izsoles publicēšana un vadīšana"},
          {icon:"🪵",text:"Pavadzīmju reģistrs ar OCR"},
          {icon:"📤",text:"VMD PDF eksports"},
          {icon:"👥",text:"Līdz 5 lietotāji uzņēmumā"},
          {icon:"🏢",text:"Uzņēmuma profils platformā"},
        ].map((t,i)=>(
          <div key={i} style={{fontSize:"13px",color:"#ffe082",padding:"6px 0",borderBottom:"1px solid #3a2e00",display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{fontSize:"14px"}}>{t.icon}</span>{t.text}
          </div>
        ))}
        <a href="mailto:jeshkaa@inbox.lv" style={{marginTop:"auto",paddingTop:"16px",width:"100%",padding:"12px",background:"linear-gradient(135deg,#fbbf24,#e65100)",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:700,fontSize:"14px",textDecoration:"none",textAlign:"center",boxSizing:"border-box",display:"block"}}>
          Sazināties →
        </a>
      </div>
    </div>

    {/* TIRGUS BANNERIS */}
    <div style={{background:"linear-gradient(135deg,#1a3a1a,#0f2a0f)",border:"1px solid #4caf50",borderRadius:"16px",padding:"28px",marginBottom:"40px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"20px",flexWrap:"wrap"}}>
      <div>
        <div style={{color:"#4caf50",fontSize:"20px",fontWeight:800,marginBottom:"6px"}}>🌿 Meža tirgus kopiena</div>
        <div style={{color:"#81c784",fontSize:"14px",lineHeight:1.6,maxWidth:"480px"}}>
          Redzi ko dara meža kopiena — posti, pieredze, sludinājumi, jautājumi.
          Bezmaksas visiem. Piesakies un pievieno savu balsi.
        </div>
      </div>
      <button onClick={onTirgus} style={{background:"#4caf50",color:"white",border:"none",borderRadius:"10px",padding:"14px 28px",fontSize:"15px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
        Atvērt Tirgu →
      </button>
    </div>

   {/* KĀ TIEK APRĒĶINĀTS */}
    <div style={{background:"linear-gradient(160deg,#0f1f0f,#1a2e1a)",border:"1px solid #2d5a2d",borderRadius:"16px",padding:"32px",marginBottom:"40px"}}>
      <h3 style={{color:"#4caf50",marginTop:0,fontSize:"20px",fontWeight:800,textAlign:"center",marginBottom:"24px",letterSpacing:"-0.02em"}}>Kā tiek veikti aprēķini?</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"16px"}}>
        {[
          {icon:"🪵",title:"Kubatūra",text:"Pēc Latvijā atzītajiem formas faktoriem katrai koku sugai atsevišķi."},
          {icon:"📊",title:"Bonitāte",text:"Pēc augstuma un vecuma attiecības — Latvijas meža bonitātes tabulām."},
          {icon:"🌲",title:"Sortimentu sadalījums",text:"Pēc vidējā caurmēra un kvalitātes klases katrai sugai."},
          {icon:"💰",title:"Tirgus vērtība",text:"Balstīta uz aktuālajām sortimentu cenām ko var atjaunināt jebkurā brīdī."},
          {icon:"📐",title:"Cirsmas krāja",text:"Pēc šķērslaukuma un vidējā augstuma — Latvijas meža inventarizācijas metodika."},
          {icon:"✓",title:"Precizitāte",text:"Aprēķinu precizitāte ir tieši atkarīga no inventarizācijas datu precizitātes."},
        ].map((item,i)=>(
          <div key={i} style={{background:"rgba(76,175,80,0.05)",border:"1px solid #1e3a1e",borderRadius:"10px",padding:"16px"}}>
            <div style={{fontSize:"24px",marginBottom:"8px"}}>{item.icon}</div>
            <div style={{color:"#4caf50",fontWeight:700,fontSize:"13px",marginBottom:"6px"}}>{item.title}</div>
            <div style={{color:"#7ab87a",fontSize:"12px",lineHeight:1.6}}>{item.text}</div>
          </div>
        ))}
      </div>
    </div>

  </div>
  {/* FOOTER */}
  <div style={{background:"#1a3a1a",padding:"24px",textAlign:"center",marginTop:"20px"}}>
    <p style={{color:"#666",fontSize:"12px",margin:0}}>© 2026 Meža tirgus · meža-tirgus.lv · Darbarīks meža speciālistam un meža īpašniekam</p>
  </div>

</div>
)
}

export default LandingPage
