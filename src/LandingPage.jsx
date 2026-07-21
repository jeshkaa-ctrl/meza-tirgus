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

function LandingPage({onEnter, onStandard, user, onIziet, onReg, onSludinajumi, onLikumi, onTirgus, onPrivatums, onIpasums, onVeikals, onAdmin}){
return(
<div style={{fontFamily:F.family,minHeight:"100vh",background:DS.bg,maxWidth:"100%",overflowX:"hidden"}}>

  {/* ── HEADER ─────────────────────────────────────────────── */}
  <div style={{
    position:"sticky",top:0,zIndex:100,
    background:"rgba(10,20,10,0.95)",backdropFilter:"blur(8px)",
    borderBottom:"1px solid #1e3a1e",
    padding:"0 20px",height:52,
    display:"flex",alignItems:"center",justifyContent:"space-between",
  }}>
    <MezaTirgusLogo/>
    <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
      {user
        ? <>
            <span style={{color:"#7ab87a",fontSize:"13px",padding:"6px 12px",background:"rgba(76,175,80,0.08)",borderRadius:"8px",border:"1px solid #2d5a2d"}}>
              👤 {user.vards}
            </span>
            <button onClick={onIziet} style={{padding:"7px 14px",background:"transparent",color:"#7ab87a",border:"1px solid #2d5a2d",borderRadius:"8px",fontSize:"13px",cursor:"pointer",minHeight:36}}>
              Iziet
            </button>
          </>
        : <>
            <button onClick={onStandard} style={{padding:"7px 14px",background:"transparent",color:"#7ab87a",border:"1px solid #2d5a2d",borderRadius:"8px",fontSize:"13px",cursor:"pointer",minHeight:36}}>
              Pieteikties
            </button>
            <button onClick={onReg} style={{padding:"7px 14px",background:"linear-gradient(135deg,#2d5a2d,#1a3a1a)",color:"#4caf50",border:"1px solid #4caf50",borderRadius:"8px",fontSize:"13px",fontWeight:700,cursor:"pointer",minHeight:36}}>
              Reģistrēties
            </button>
          </>
      }
    </div>
  </div>

  {/* ── HERO ───────────────────────────────────────────────── */}
  <div style={{background:"linear-gradient(160deg, #0a1a0a 0%, #1a3a1a 60%, #0f2a0f 100%)",padding:"48px 20px 52px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",position:"relative"}}>
    <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",top:"-60px",right:"-60px",width:"300px",height:"300px",background:"radial-gradient(circle, rgba(76,175,80,0.08) 0%, transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-40px",left:"-40px",width:"200px",height:"200px",background:"radial-gradient(circle, rgba(76,175,80,0.05) 0%, transparent 70%)"}}/>
    </div>

    <div style={{position:"relative",zIndex:1,width:"100%",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <h1 style={{color:"white",fontSize:"clamp(22px,5vw,34px)",fontWeight:800,margin:"0 0 12px",letterSpacing:"-0.03em",lineHeight:1.2}}>
        Meža vērtība — vienā skatā
      </h1>
      <p style={{color:"#7ab87a",fontSize:"clamp(14px,3.5vw,16px)",maxWidth:"520px",margin:"0 auto 32px",lineHeight:1.6,padding:"0 4px"}}>
        Profesionāli rīki meža speciālistam — cirsmu vērtēšana, dastojumi, rēķini un pavadzīmes vienā platformā.
      </p>

      {/* GALVENĀ CTA */}
      <button onClick={onIpasums} style={{
        padding:"16px 28px",
        background:"linear-gradient(135deg, #4caf50, #2e7d32)",
        color:"white", border:"none", borderRadius:"12px",
        fontSize:"clamp(16px,4vw,19px)", fontWeight:800, cursor:"pointer",
        boxShadow:"0 6px 24px rgba(76,175,80,0.4)",
        minHeight:56, marginBottom:20,
        width:"100%", maxWidth:420, boxSizing:"border-box",
      }}>
        🗺 Ievadi kadastra numuru →
      </button>

      {/* DARBA LAPA — galvenā sekundārā CTA */}
      <button onClick={onEnter} style={{
        padding:"12px 24px",
        background:"rgba(76,175,80,0.12)",
        color:"#81c784", border:"1px solid #2e7d3288",
        borderRadius:"10px", fontSize:"15px", fontWeight:700,
        cursor:"pointer", minHeight:46,
        width:"100%", maxWidth:420, boxSizing:"border-box",
        marginBottom:16,
      }}>
        🔧 Izmēģināt visus rīkus →
      </button>

      {/* SEKUNDĀRĀ NAVIGĀCIJA */}
      <div style={{display:"flex",gap:"8px",justifyContent:"center",flexWrap:"wrap",maxWidth:480}}>
        <button onClick={onSludinajumi} style={{padding:"8px 16px",background:"rgba(255,255,255,0.04)",color:"#7ab87a",border:"1px solid #2d5a2d44",borderRadius:"8px",fontSize:"13px",cursor:"pointer",minHeight:38}}>
          📢 Sludinājumi
        </button>
        <button onClick={onLikumi} style={{padding:"8px 16px",background:"rgba(255,255,255,0.04)",color:"#7ab87a",border:"1px solid #2d5a2d44",borderRadius:"8px",fontSize:"13px",cursor:"pointer",minHeight:38}}>
          ⚖️ Meža likumi
        </button>
        <button onClick={onVeikals} style={{padding:"8px 16px",background:"rgba(255,255,255,0.04)",color:"#7ab87a",border:"1px solid #2d5a2d44",borderRadius:"8px",fontSize:"13px",cursor:"pointer",minHeight:38}}>
          🛒 Veikals
        </button>
      </div>
    </div>
  </div>

  <div style={{maxWidth:"960px",margin:"0 auto",padding:"0 20px",width:"100%",boxSizing:"border-box"}}>

    {/* ── KAS IR MEŽA TIRGUS ─────────────────────────────────── */}
    <div style={{background:"linear-gradient(135deg,#1a2e1a,#0f1f0f)",border:"1px solid #2d5a2d",borderRadius:"16px",padding:"36px 32px",margin:"32px 0 28px"}}>
      <h2 style={{color:"#4caf50",fontSize:"22px",textAlign:"center",marginBottom:"24px",fontWeight:800,letterSpacing:"-0.02em",marginTop:0}}>Kas ir Meža tirgus?</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))",gap:"1rem",marginBottom:"20px"}}>
        {[
          {icon:"🌲",title:"Meža rīki",text:"Cirsmu vērtēšana, dastojumi, caurmēra mērījumi, loģistika — viss vienā vietā."},
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

    {/* ── CENU KARTIŅAS (tikai Bezmaksas + Bizness) ─────────── */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"16px",marginBottom:"32px"}}>

      {/* BEZMAKSAS */}
      <div style={{background:"linear-gradient(160deg,#0f1f0f,#1a2e1a)",border:"1px solid #2d5a2d",borderRadius:"16px",padding:"28px",display:"flex",flexDirection:"column"}}>
        <div style={{color:"#4caf50",fontWeight:800,fontSize:"20px",marginBottom:"4px"}}>✓ Bezmaksas</div>
        <div style={{color:"#4a7a4a",fontSize:"12px",marginBottom:"8px"}}>Reģistrācija bez maksas</div>
        <div style={{color:"#4caf50",fontSize:"32px",fontWeight:800,marginBottom:"20px"}}>€0</div>
        {[
          {icon:"🌿",text:"Tirgus plūsma — posti, sludinājumi"},
          {icon:"⚖️",text:"Meža likuma un tirgus konsultants (AI)"},
          {icon:"📐",text:"Kubatūras kalkulators"},
          {icon:"📏",text:"Caurmēra mērīšana un bonitāte"},
          {icon:"🗺",text:"Cirsmas skice (bez PDF)"},
          {icon:"📢",text:"Sludinājumu un izsolu skatīšana"},
        ].map((t,i)=>(
          <div key={i} style={{fontSize:"13px",color:"#a8d8a8",padding:"7px 0",borderBottom:"1px solid #1e3a1e",display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{fontSize:"14px"}}>{t.icon}</span>{t.text}
          </div>
        ))}
        <button onClick={onReg} style={{marginTop:"auto",paddingTop:"20px",width:"100%",padding:"13px",background:"linear-gradient(135deg,#2d5a2d,#1a3a1a)",color:"#4caf50",border:"1px solid #4caf50",borderRadius:"8px",cursor:"pointer",fontWeight:700,fontSize:"14px"}}>
          Reģistrēties →
        </button>
      </div>

      {/* BIZNESA PLĀNI */}
      <div style={{background:"linear-gradient(160deg,#0d1f0d,#1a3a1a)",border:"2px solid #4caf50",borderRadius:"16px",padding:"28px",position:"relative",display:"flex",flexDirection:"column",boxShadow:"0 0 28px rgba(76,175,80,0.12)"}}>
        <div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:"#4caf50",color:"white",fontSize:"11px",fontWeight:700,padding:"3px 16px",borderRadius:"10px",whiteSpace:"nowrap"}}>BIZNESA PLĀNS</div>
        <div style={{color:"#4caf50",fontWeight:800,fontSize:"20px",marginBottom:"4px"}}>🏢 Bizness</div>
        <div style={{color:"#7ab87a",fontSize:"12px",marginBottom:"14px"}}>Profesionāliem meža uzņēmumiem</div>

        {/* 3 pakāpes */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px",marginBottom:"18px"}}>
          {[
            {nosaukums:"Sākuma",cena:"€29",pavadz:"50 pav./mēn."},
            {nosaukums:"Vidējais",cena:"€45",pavadz:"150 pav./mēn.",ieteicams:true},
            {nosaukums:"Neierob.",cena:"€69",pavadz:"♾ pav./mēn."},
          ].map((p,i)=>(
            <div key={i} style={{background:p.ieteicams?"rgba(76,175,80,0.15)":"rgba(76,175,80,0.05)",border:`1px solid ${p.ieteicams?"#4caf50":"#1e3a1e"}`,borderRadius:"8px",padding:"10px 4px",textAlign:"center"}}>
              <div style={{color:"#7ab87a",fontSize:"10px",fontWeight:600,marginBottom:"3px"}}>{p.nosaukums}</div>
              <div style={{color:"white",fontSize:"18px",fontWeight:800}}>{p.cena}</div>
              <div style={{color:"#4a7a4a",fontSize:"9px"}}>/mēn.</div>
              <div style={{color:"#4caf50",fontSize:"9px",marginTop:"4px",lineHeight:1.3}}>{p.pavadz}</div>
            </div>
          ))}
        </div>

        {[
          {icon:"📄",text:"PDF dokumenti (bez kartes)"},
          {icon:"🧾",text:"Rēķinu arhīvs"},
          {icon:"🚛",text:"Loģistikas kalkulators"},
          {icon:"🪵",text:"Pavadzīmju reģistrs ar AI"},
          {icon:"📢",text:"3 sludinājumi/mēn."},
          {icon:"🏪",text:"Iepirkuma vietu reģistrācija"},
        ].map((t,i)=>(
          <div key={i} style={{fontSize:"13px",color:"#a8d8a8",padding:"7px 0",borderBottom:"1px solid #1e3a1e",display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{fontSize:"14px"}}>{t.icon}</span>{t.text}
          </div>
        ))}
        <button onClick={onEnter} style={{marginTop:"20px",width:"100%",padding:"14px",background:"linear-gradient(135deg,#4caf50,#2e7d32)",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:700,fontSize:"15px",minHeight:48}}>
          Skatīt Biznesa plānus →
        </button>
      </div>
    </div>

    {/* ── VEIKALS BANNERIS (atsevišķa sadaļa) ───────────────── */}
    <div style={{
      background:"linear-gradient(135deg,#1a0f00,#2a1800,#1a0f00)",
      border:"1px solid #fbbf2444",
      borderRadius:"16px",padding:"28px 32px",marginBottom:"32px",
      display:"flex",alignItems:"center",justifyContent:"space-between",
      gap:"20px",flexWrap:"wrap",
      position:"relative",overflow:"hidden",
    }}>
      <div style={{position:"absolute",top:"-40px",right:"-40px",width:"180px",height:"180px",background:"radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)",pointerEvents:"none"}}/>
      <div>
        <div style={{color:"#fbbf24",fontSize:"11px",fontWeight:700,letterSpacing:"0.08em",marginBottom:"6px",textTransform:"uppercase"}}>Atsevišķs produkts</div>
        <div style={{color:"#ffe082",fontSize:"22px",fontWeight:800,marginBottom:"8px"}}>🛒 Meža tirgus Veikals</div>
        <div style={{color:"#a68a00",fontSize:"14px",lineHeight:1.6,maxWidth:"460px"}}>
          Meža produkti tiešsaistē — apaļkoki, malka, šķelda, stādi, meža darbarīki un piederumi. Piegāde uz Latviju.
        </div>
        <div style={{display:"flex",gap:"8px",marginTop:"12px",flexWrap:"wrap"}}>
          {["🪵 Apaļkoki","🔥 Malka","🌱 Stādi","🛠 Darbarīki"].map((t,i)=>(
            <span key={i} style={{fontSize:"11px",color:"#fbbf24",background:"rgba(251,191,36,0.1)",border:"1px solid #fbbf2433",borderRadius:"6px",padding:"3px 8px"}}>{t}</span>
          ))}
        </div>
      </div>
      <button onClick={onVeikals} style={{
        background:"linear-gradient(135deg,#fbbf24,#d97706)",
        color:"white",border:"none",borderRadius:"10px",
        padding:"14px 28px",fontSize:"15px",fontWeight:700,
        cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,minHeight:48,
      }}>
        Atvērt Veikalu →
      </button>
    </div>

    {/* ── AI ČATS DEMO ───────────────────────────────────────── */}
    <div style={{marginBottom:"32px"}}>
      <div style={{textAlign:"center",marginBottom:"16px"}}>
        <div style={{color:"#4caf50",fontSize:"13px",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:"4px"}}>Izmēģini tūlīt — bez reģistrācijas</div>
        <div style={{color:"#4a7a4a",fontSize:"12px"}}>AI konsultants meža likumos un tirgus jautājumos</div>
      </div>
      <JautaParMezuWidget onPilnsSkats={onLikumi} />
    </div>

    {/* ── KOPIENA ────────────────────────────────────────────── */}
    <div style={{background:"linear-gradient(135deg,#1a3a1a,#0f2a0f)",border:"1px solid #4caf50",borderRadius:"16px",padding:"28px 32px",marginBottom:"32px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"20px",flexWrap:"wrap"}}>
      <div>
        <div style={{color:"#4caf50",fontSize:"20px",fontWeight:800,marginBottom:"6px"}}>🌿 Meža tirgus kopiena</div>
        <div style={{color:"#81c784",fontSize:"14px",lineHeight:1.6,maxWidth:"480px"}}>
          Redzi ko dara meža kopiena — posti, pieredze, sludinājumi, jautājumi. Bezmaksas visiem. Piesakies un pievieno savu balsi.
        </div>
      </div>
      <button onClick={onTirgus} style={{background:"#4caf50",color:"white",border:"none",borderRadius:"10px",padding:"14px 28px",fontSize:"15px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
        Atvērt Tirgu →
      </button>
    </div>

    {/* ── KĀ TIEK VEIKTI APRĒĶINI ────────────────────────────── */}
    <div style={{background:"linear-gradient(160deg,#0f1f0f,#1a2e1a)",border:"1px solid #2d5a2d",borderRadius:"16px",padding:"32px",marginBottom:"40px"}}>
      <h3 style={{color:"#4caf50",marginTop:0,fontSize:"20px",fontWeight:800,textAlign:"center",marginBottom:"24px",letterSpacing:"-0.02em"}}>Kā tiek veikti aprēķini?</h3>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))",gap:"1rem"}}>
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

  {/* ── FOOTER ─────────────────────────────────────────────── */}
  <div style={{background:"#1a3a1a",padding:"24px",textAlign:"center",marginTop:"0"}}>
    <p style={{color:"#666",fontSize:"12px",margin:"0 0 8px"}}>© 2026 Meža tirgus · meža-tirgus.lv · Darbarīks meža speciālistam un meža īpašniekam</p>
    <button onClick={onPrivatums} style={{background:"none",border:"none",color:"#4a6a4a",fontSize:"11px",cursor:"pointer",textDecoration:"underline",fontFamily:"inherit"}}>
      Privātuma politika
    </button>
    {" · "}
    <button onClick={onAdmin} style={{background:"none",border:"none",color:"#3a4a3a",fontSize:"11px",cursor:"pointer",textDecoration:"underline",fontFamily:"inherit"}}>
      🔒
    </button>
  </div>

</div>
)
}

export default LandingPage
