import React, { useState } from "react"
import { SUGAS, MEDALAS, getMedala, aprKin } from "./cicEngine"

// ─── Stils ───────────────────────────────────────────────────────────────────
const s = {
  app:   { minHeight: "100vh", background: "#060d06", color: "#ddeadd", fontFamily: "'Inter',sans-serif" },
  hdr:   { background: "rgba(6,13,6,0.97)", borderBottom: "1px solid #1a3a1a", backdropFilter: "blur(8px)", padding: "0 16px", height: 52, display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 10 },
  back:  { background: "transparent", border: "none", color: "#4caf50", fontSize: 22, cursor: "pointer", padding: "0 4px", minWidth: 36, minHeight: 44 },
  title: { margin: 0, color: "#4caf50", fontSize: 15, fontWeight: 700 },
  body:  { padding: "16px", maxWidth: 680, margin: "0 auto" },
  card:  { background: "#0a140a", border: "1px solid #1a3a1a", borderRadius: 12, padding: 16, marginBottom: 14 },
  btn:   { background: "linear-gradient(135deg,#2e7d32,#1b5e20)", color: "white", border: "none", borderRadius: 8, padding: "13px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", minHeight: 48 },
  btnSm: { background: "#0a1a0a", color: "#4caf50", border: "1px solid #1a3a1a", borderRadius: 6, padding: "7px 14px", fontSize: 12, cursor: "pointer", minHeight: 36 },
  lbl:   { fontSize: 12, color: "#81c784", marginBottom: 4, display: "block" },
  inp:   { width: "100%", background: "#040c04", border: "1px solid #1a3a1a", borderRadius: 6, color: "#ddeadd", fontSize: 15, padding: "9px 10px", outline: "none", boxSizing: "border-box" },
  row2:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  note:  { fontSize: 11, color: "#5a8a5a", marginTop: 4 },
  warn:  { background: "#1a1400", border: "1px solid #4a3800", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#ffb74d", marginBottom: 14 },
}

// ─── Helper komponentes ────────────────────────────────────────────────────────
function Fld({ label, note, ...inp }) {
  return (
    <div>
      <label style={s.lbl}>{label}</label>
      <input style={s.inp} type="number" min="0" step="0.1" {...inp} />
      {note && <div style={s.note}>{note}</div>}
    </div>
  )
}

function Fld2({ lblK, lblL, nameK, nameL, note, vals, set }) {
  return (
    <div>
      <div style={s.row2}>
        <div>
          <label style={s.lbl}>{lblK || "K (kreisais)"}</label>
          <input style={s.inp} type="number" min="0" step="0.1"
            value={vals[nameK] || ""} onChange={e => set(nameK, e.target.value)} />
        </div>
        <div>
          <label style={s.lbl}>{lblL || "L (labais)"}</label>
          <input style={s.inp} type="number" min="0" step="0.1"
            value={vals[nameL] || ""} onChange={e => set(nameL, e.target.value)} />
        </div>
      </div>
      {note && <div style={s.note}>{note}</div>}
    </div>
  )
}

function BoniSlide({ label, max, name, vals, set }) {
  const val = parseInt(vals[name]) || 0
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <label style={s.lbl}>{label}</label>
        <span style={{ fontSize: 13, color: "#4caf50", fontWeight: 700 }}>{val}</span>
      </div>
      <input type="range" min="0" max={max} step="1"
        value={val} onChange={e => set(name, e.target.value)}
        style={{ width: "100%", accentColor: "#4caf50" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#5a8a5a" }}>
        <span>0</span><span>{max}</span>
      </div>
    </div>
  )
}

// ─── Pamācības (Solis 2) ───────────────────────────────────────────────────────
const PAMACIBAS = {
  staltbriedis: [
    { t: "📏 Raga garums", b: "Mēra pa ārējo liekumu no rozes centra līdz raga galam. Mēra katru ragu atsevišķi (K un L)." },
    { t: "⭕ Apkārtmēri", b: "Mēra katrā ragā 3 vietās: (1) tieši virs rozes, (2) ragā vidū, (3) visvājākajā vietā starp 2. un 3. žuburu. Kopā = 6 mērījumi." },
    { t: "↔ Platums", b: "Lielākais iekšējais platums starp ragiem — vietā, kur attālums ir maksimāls." },
    { t: "🌿 Žuburi", b: "Skaita visas zarotiņas ≥2 cm garumā abos rags kopā. Galvenais raga gals arī skaitās." },
    { t: "⚖ Svars", b: "Kopsvars kg. Svēr tikai žāvētus ragus ar galvaskausa plāksni (≥90 dienas žāvēšana)." },
    { t: "✨ Bonifikācijas", b: "Pērļojums (0-4), krāsa (0-4), vainags (0-4). Maksimums 12 punkti." },
  ],
  stirnazis: [
    { t: "📏 Garums", b: "Pa ārējo liekumu no rozes centra līdz raga galam. Katrs rags atsevišķi." },
    { t: "⭕ Apkārtmēri", b: "2 vietās katrā ragā: tieši virs rozes un raga vidū. Kopā = 4 mērījumi." },
    { t: "⚖ Svars (gramos!)", b: "Sver tikai ragus ar galvaskausa plāksni (bez apakšžokļa). Ja galvā ir augšžoklis — atzīmē, automātiski atņem 90g korekciju." },
    { t: "💧 Tilpums (hidrostatiskā metode)", b: "Iegremdē ragus ar galvaskausu ūdenī. Mēra pārvietoto ūdeni cm³. Šis mērījums dod visvairāk punktu!" },
    { t: "✨ Bonifikācijas", b: "Skaistums + simetrija (0-5): vairāk par formas skaistumu. Pērļojums (0-4)." },
    { t: "⏰ Žāvēšana", b: "Minimums 60 dienas pirms galīgā CIC vērtējuma!" },
  ],
  alnis: [
    { t: "↔ Platums", b: "Lielākais platums starp abu lāpstu ārmalām — horizontāli." },
    { t: "📏 Lāpstas garums", b: "No rozes centra līdz tālākajam lāpstas galam. Katrai lāpstai atsevišķi." },
    { t: "📐 Lāpstas platums", b: "Lielākais lāpstas platums — perpendikulāri garumsasij. Katrai lāpstai." },
    { t: "🌿 Atzari", b: "Atsevišķi skaita katras lāpstas atzaru skaitu. Lāpstas malas ierobojumi netiek skaitīti." },
    { t: "⚖ Svars", b: "Ragu kopsvars kg (ar galvaskausa plāksni, bez apakšžokļa). ≥90 dienas žāvēšana." },
  ],
  dambriedis: [
    { t: "📏 Raga garums", b: "Pa ārējo liekumu no rozes līdz raga galam. Min. 60 cm katram ragam bronzas medaļai." },
    { t: "📐 Lāpstas garums", b: "No zarošanās punkta (kur rags sāk izvērsties lāpstā) līdz lāpstas tālākajam galam. Min. 30 cm bronzai." },
    { t: "↔ Lāpstas platums", b: "Lielākais lāpstas platums. Min. 14 cm bronzai." },
    { t: "🌿 Acu žuburi", b: "Pirmie žuburi tieši virs rozes — mēra garumu cm. Min. 16 cm bronzai." },
    { t: "⭕ Rozešu apkārtmērs", b: "Tieši virs rozes. Ap 20 cm bronzas līmenī." },
    { t: "⚖ Svars", b: "Kopsvars kg. Min. 3 kg bronzai. Žāvēšana ≥30 dienas!" },
  ],
  meza_kuilis: [
    { t: "📏 Ilkņu garums", b: "Pa ārējo liekumu (apkārtloki) no ilkņa pamata līdz galam. Katrs ilknis atsevišķi." },
    { t: "⭕ Apkārtmērs vidū", b: "Ilkņa biezākajā vietā — aptuveni ilkņa vidus punktā. Katrs atsevišķi." },
    { t: "📐 Šķelšanās leņķis", b: "Starp abiem augšžokļa ilkņiem — mēra ar transportieri. Liels leņķis = papildu punkti." },
    { t: "💡 Vērtēšanas nianses", b: "Ilkņi jāizņem no žokļa — vērtē tikai izņemtus ilkņus. Nav žāvēšanas prasības." },
  ],
}

// ─── Mērījumu formas (Solis 3) ────────────────────────────────────────────────
function FormaStaltbriedis({ vals, set, rezims }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {rezims === 'tikko' && (
        <div style={s.warn}>⚠️ Tikko nomedīts: svars ar audiem — galīgais CIC pēc sagatavošanas (≥90 d. žāvēšana). Apkārtmēri sarūk žāvējot.</div>
      )}
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 8 }}>RAGU GARUMI (cm)</div>
        <Fld2 lblK="K — kreisais rags" lblL="L — labais rags" nameK="garumsK" nameL="garumsL" vals={vals} set={set} note="Pa ārējo liekumu roze→gals" />
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 8 }}>APKĀRTMĒRI (cm) — 3 vietas × 2 ragi</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: "#5a8a5a", marginBottom: 6 }}>Pie rozes (tieši virs rozes):</div>
            <Fld2 lblK="K — pie rozes" lblL="L — pie rozes" nameK="ap1K" nameL="ap1L" vals={vals} set={set} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#5a8a5a", marginBottom: 6 }}>Raga vidus:</div>
            <Fld2 lblK="K — vidū" lblL="L — vidū" nameK="ap2K" nameL="ap2L" vals={vals} set={set} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#5a8a5a", marginBottom: 6 }}>Augšā (starp 2. un 3. žuburu):</div>
            <Fld2 lblK="K — augšā" lblL="L — augšā" nameK="ap3K" nameL="ap3L" vals={vals} set={set} />
          </div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 8 }}>PLATUMS UN ŽUBURI</div>
        <div style={s.row2}>
          <Fld label="Platums max iekšējais (cm)" value={vals.platums || ""} onChange={e => set("platums", e.target.value)} />
          <Fld label="Žuburi kopā (skaits)" value={vals.zuburi || ""} onChange={e => set("zuburi", e.target.value)} note="Visi ≥2 cm" />
        </div>
      </div>
      <div>
        <Fld label="Svars (kg)" value={vals.svarsKg || ""} onChange={e => set("svarsKg", e.target.value)} note={rezims === 'tikko' ? "⚠️ Provizoriski — mēra ar audiem" : "Žāvēti ragi ar galvaskausa plāksni"} />
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 10 }}>BONIFIKĀCIJAS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <BoniSlide label="Pērļojums (0–4)" max={4} name="perlovojums" vals={vals} set={set} />
          <BoniSlide label="Krāsa (0–4)" max={4} name="krasa" vals={vals} set={set} />
          <BoniSlide label="Vainags (0–4)" max={4} name="vainags" vals={vals} set={set} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 8 }}>ATSKAITĪJUMI (ja ir defekti)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Fld label="Garuma asimetrija (pkt)" value={vals.garAtsk || ""} onChange={e => set("garAtsk", e.target.value)} />
          <Fld label="Apkārtmēra asimetrija (pkt)" value={vals.apAtsk || ""} onChange={e => set("apAtsk", e.target.value)} />
          <Fld label="Defekti (pkt)" value={vals.defAtsk || ""} onChange={e => set("defAtsk", e.target.value)} />
        </div>
      </div>
    </div>
  )
}

function FormaStirnazis({ vals, set, rezims }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {rezims === 'tikko' && (
        <div style={s.warn}>⚠️ Tikko nomedīts: tūlīt var mērīt garumus un apkārtmērus. Tilpumu un svaru — pēc sagatavošanas (≥60 d. žāvēšana).</div>
      )}
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 8 }}>RAGU GARUMI (cm)</div>
        <Fld2 lblK="K — kreisais" lblL="L — labais" nameK="garumsK" nameL="garumsL" vals={vals} set={set} note="Pa ārējo liekumu roze→gals" />
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 8 }}>APKĀRTMĒRI (cm)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: "#5a8a5a", marginBottom: 6 }}>Pie rozes:</div>
            <Fld2 lblK="K — pie rozes" lblL="L — pie rozes" nameK="roseK" nameL="roseL" vals={vals} set={set} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#5a8a5a", marginBottom: 6 }}>Raga vidū:</div>
            <Fld2 lblK="K — vidū" lblL="L — vidū" nameK="midK" nameL="midL" vals={vals} set={set} />
          </div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 8 }}>SVARS UN TILPUMS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Fld label="Svars (gramos!)" value={vals.svarsG || ""} onChange={e => set("svarsG", e.target.value)} note="Tikai ragi + galvaskausa plāksne, BEZ apakšžokļa" />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#ddeadd", cursor: "pointer" }}>
            <input type="checkbox" checked={!!vals.pilnaGalva} onChange={e => set("pilnaGalva", e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#4caf50" }} />
            Galva ar augšžokli (−90g korekcija)
          </label>
          <Fld label="Tilpums (cm³) — hidrostatiskā metode" value={vals.tilpums || ""}
            onChange={e => set("tilpums", e.target.value)} note="Iegremdē ūdenī, mēra pārvietotos ūdeni" />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 10 }}>BONIFIKĀCIJAS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <BoniSlide label="Skaistums + simetrija (0–5)" max={5} name="skaistums" vals={vals} set={set} />
          <BoniSlide label="Pērļojums (0–4)" max={4} name="perlovojums" vals={vals} set={set} />
        </div>
      </div>
    </div>
  )
}

function FormaAlnis({ vals, set, rezims }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {rezims === 'tikko' && (
        <div style={s.warn}>⚠️ Tikko nomedīts: provizoriski. Galīgais CIC pēc žāvēšanas (≥90 dienas).</div>
      )}
      <Fld label="Ragu platums max (cm)" value={vals.platums || ""} onChange={e => set("platums", e.target.value)} note="Lielākais platums starp ārmalām" />
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 8 }}>LĀPSTU GARUMI (cm)</div>
        <Fld2 lblK="K — kreisā lāpsta" lblL="L — labā lāpsta" nameK="lgK" nameL="lgL" vals={vals} set={set} note="No rozes centra līdz tālākajam galam" />
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 8 }}>LĀPSTU PLATUMI (cm)</div>
        <Fld2 lblK="K platums" lblL="L platums" nameK="lpK" nameL="lpL" vals={vals} set={set} note="Lielākais platums perpendikulāri garumsasij" />
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 8 }}>ATZARU SKAITS</div>
        <Fld2 lblK="K — atzari" lblL="L — atzari" nameK="atzariK" nameL="atzariL" vals={vals} set={set} note="Skaita tikai lāpstu atzarus (ne lāpstas malas)" />
      </div>
      <Fld label="Svars kopā (kg)" value={vals.svarsKg || ""} onChange={e => set("svarsKg", e.target.value)}
        note={rezims === 'tikko' ? "⚠️ Provizoriski — mēra ar audiem" : "Žāvēti ragi ar galvaskausa plāksni"} />
    </div>
  )
}

function FormaDambriedis({ vals, set, rezims }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {rezims === 'tikko' && (
        <div style={s.warn}>⚠️ Tikko nomedīts: provizoriski. Galīgais CIC pēc žāvēšanas (≥30 dienas — īsākais no visiem!).</div>
      )}
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 8 }}>RAGU GARUMI (cm) <span style={{ color: "#5a8a5a", fontWeight: 400 }}>min. 60 bronzai</span></div>
        <Fld2 lblK="K — raga garums" lblL="L — raga garums" nameK="rgK" nameL="rgL" vals={vals} set={set} note="Pa ārējo liekumu" />
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 8 }}>LĀPSTU GARUMI (cm) <span style={{ color: "#5a8a5a", fontWeight: 400 }}>min. 30</span></div>
        <Fld2 lblK="K — lāpsta garums" lblL="L — lāpsta garums" nameK="lgK" nameL="lgL" vals={vals} set={set} note="No zarošanās līdz lāpstas galam" />
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 8 }}>LĀPSTU PLATUMI (cm) <span style={{ color: "#5a8a5a", fontWeight: 400 }}>min. 14</span></div>
        <Fld2 lblK="K — lāpsta platums" lblL="L — lāpsta platums" nameK="lpK" nameL="lpL" vals={vals} set={set} />
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 8 }}>ACU ŽUBURI (cm) <span style={{ color: "#5a8a5a", fontWeight: 400 }}>min. 16</span></div>
        <Fld2 lblK="K — acu žuburs" lblL="L — acu žuburs" nameK="azK" nameL="azL" vals={vals} set={set} note="Pirmais žuburs virs rozes" />
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 8 }}>ROZEŠU APKĀRTMĒRI (cm)</div>
        <Fld2 lblK="K — roze" lblL="L — roze" nameK="raK" nameL="raL" vals={vals} set={set} note="~20 cm bronzas līmenī" />
      </div>
      <Fld label="Svars kopā (kg) — min. 3 kg bronzai" value={vals.svarsKg || ""} onChange={e => set("svarsKg", e.target.value)}
        note={rezims === 'tikko' ? "⚠️ Provizoriski — mēra ar audiem" : "Žāvēti ragi ar galvaskausa plāksni"} />
    </div>
  )
}

function FormaKuilis({ vals, set }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 8 }}>ILKŅU GARUMI (cm)</div>
        <Fld2 lblK="K — kreisais ilknis" lblL="L — labais ilknis" nameK="garumsK" nameL="garumsL" vals={vals} set={set} note="Pa ārējo liekumu no pamata līdz galam" />
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 8 }}>ILKŅU APKĀRTMĒRI VIDŪ (cm)</div>
        <Fld2 lblK="K — apkārtmērs" lblL="L — apkārtmērs" nameK="apK" nameL="apL" vals={vals} set={set} />
      </div>
      <div>
        <label style={s.lbl}>Šķelšanās leņķis starp ilkņiem (grādi)</label>
        <input style={s.inp} type="number" min="0" max="180" step="1"
          value={vals.lenkis || ""} onChange={e => set("lenkis", e.target.value)} />
        <div style={s.note}>
          {(vals.lenkis >= 76) ? "6 punkti (vislabākais)" :
           (vals.lenkis >= 61) ? "4 punkti" :
           (vals.lenkis >= 46) ? "2 punkti" :
           (vals.lenkis >= 30) ? "0 punkti" :
           (vals.lenkis > 0)   ? "−2 punkti" : "Izmanto transportieri laukā"}
        </div>
      </div>
    </div>
  )
}

// ─── Rezultāts (Solis 4) ──────────────────────────────────────────────────────
function Rezultats({ suga, rez, rezims, onAtpakal }) {
  const m = getMedala(suga.id, rez.kopsumma)
  const lim = MEDALAS[suga.id]

  return (
    <div>
      {/* Medaļa */}
      <div style={{ ...s.card, borderColor: m.krasa, textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{m.emoji}</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: m.krasa }}>{rez.kopsumma}</div>
        <div style={{ fontSize: 11, color: "#5a8a5a", marginBottom: 4 }}>CIC punkti</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: m.krasa, marginBottom: 4 }}>{m.nos}</div>
        <div style={{ fontSize: 12, color: "#5a8a5a" }}>{suga.nos} · {suga.lat}</div>
        {rezims === 'tikko' && (
          <div style={{ marginTop: 12, fontSize: 11, color: "#ffb74d", background: "#1a1400", borderRadius: 6, padding: "6px 12px", display: "inline-block" }}>
            ⚠️ PROVIZORISKAIS APRĒĶINS — galīgais pēc sagatavošanas ({suga.zuv})
          </div>
        )}
      </div>

      {/* Punktu sadalījums */}
      <div style={s.card}>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 12 }}>PUNKTU SADALĪJUMS</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {rez.rindas.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #1a3a1a" }}>
                <td style={{ padding: "8px 0", fontSize: 13, color: "#ddeadd" }}>{r.nos}</td>
                <td style={{ padding: "8px 0", fontSize: 11, color: "#5a8a5a", textAlign: "right", paddingRight: 12 }}>{r.formk}</td>
                <td style={{ padding: "8px 0", fontSize: 14, fontWeight: 700, color: r.pkt < 0 ? "#ef5350" : "#4caf50", textAlign: "right", minWidth: 50 }}>
                  {r.pkt > 0 ? "+" : ""}{r.pkt}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: "2px solid #2d4a2d" }}>
              <td colSpan={2} style={{ padding: "10px 0", fontSize: 14, fontWeight: 700, color: "#ddeadd" }}>KOPĀ</td>
              <td style={{ padding: "10px 0", fontSize: 16, fontWeight: 900, color: m.krasa, textAlign: "right" }}>{rez.kopsumma}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Medaļu robežas */}
      <div style={s.card}>
        <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 10 }}>MEDAĻU ROBEŽAS — {suga.nos}</div>
        {[
          { e: "🥇", n: "Zelts",   v: `${lim.zelts}+`,             k: "#ffd700", ok: rez.kopsumma >= lim.zelts },
          { e: "🥈", n: "Sudrabs", v: `${lim.sudrabs}–${lim.zelts - 0.01}`, k: "#c0c0c0", ok: rez.kopsumma >= lim.sudrabs && rez.kopsumma < lim.zelts },
          { e: "🥉", n: "Bronza",  v: `${lim.bronza}–${lim.sudrabs - 0.01}`, k: "#cd7f32", ok: rez.kopsumma >= lim.bronza && rez.kopsumma < lim.sudrabs },
        ].map(row => (
          <div key={row.n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid #1a3a1a", opacity: row.ok ? 1 : 0.4 }}>
            <span style={{ fontSize: 18 }}>{row.e}</span>
            <span style={{ fontSize: 13, color: row.k, fontWeight: row.ok ? 700 : 400, flex: 1 }}>{row.n}</span>
            <span style={{ fontSize: 13, color: "#5a8a5a" }}>{row.v} pkt</span>
            {row.ok && <span style={{ fontSize: 11, color: row.k }}>✓</span>}
          </div>
        ))}
        {rez.kopsumma < lim.bronza && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#5a8a5a" }}>
            Līdz bronzai vēl {p2(lim.bronza - rez.kopsumma)} punkti
          </div>
        )}
      </div>

      <div style={{ ...s.card, borderColor: "#1a2d1a" }}>
        <div style={{ fontSize: 11, color: "#5a7a5a", lineHeight: 1.6 }}>
          ⚠️ Šis aprēķins ir aptuvens un informatīvs. Oficiālo CIC vērtējumu veic 3 cilvēku komisija ar vismaz 1 sertificētu CIC ekspertu. Zelta medaļas trofejām nepieciešama mednieka un platības īpašnieka zvēresta liecība. Latvijā lielākā CIC trofeja vērtēšanas izstāde — "Mednieks" Ķīpsalā.
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button style={s.btn} onClick={onAtpakal}>← Labot mērījumus</button>
        <button style={s.btnSm} onClick={() => window.print()}>🖨 Drukāt</button>
      </div>
    </div>
  )
}

const p2 = n => +n.toFixed(2)

// ─── Galvenā lapa ─────────────────────────────────────────────────────────────
export default function CICKalkulatorsPage({ onBack }) {
  const [solis, setSolis] = useState(1)
  const [suga, setSuga]   = useState(null)
  const [rezims, setRezims] = useState("tikko")
  const [merij, setMerij] = useState({})
  const [rez, setRez]     = useState(null)

  const setM = (k, v) => setMerij(prev => ({ ...prev, [k]: v }))

  const izveletieSugas = (sg) => { setSuga(sg); setSolis(2); setMerij({}); setRez(null) }
  const uz3 = () => setSolis(3)
  const uz4 = () => {
    const r = aprKin(suga.id, merij)
    setRez(r)
    setSolis(4)
  }
  const atpakalsUz3 = () => setSolis(3)
  const jauns = () => { setSuga(null); setSolis(1); setMerij({}); setRez(null) }

  const sugaObj = suga && SUGAS.find(s => s.id === suga.id)

  return (
    <div style={s.app}>
      {/* Galvene */}
      <div style={s.hdr}>
        <button style={s.back} onClick={solis === 1 ? onBack : () => setSolis(solis - 1)}>←</button>
        <h1 style={s.title}>🏆 CIC Trofeju Kalkulators</h1>
        {suga && <span style={{ fontSize: 11, color: "#2e7d32", marginLeft: 4 }}>{sugaObj?.nos}</span>}
      </div>

      {/* Soļu indikators */}
      {solis > 1 && (
        <div style={{ background: "#080f08", borderBottom: "1px solid #1a3a1a", padding: "8px 16px" }}>
          <div style={{ display: "flex", gap: 8, maxWidth: 680, margin: "0 auto" }}>
            {["Suga", "Pamācība", "Mērījumi", "Rezultāts"].map((n, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 10,
                color: solis === i+1 ? "#4caf50" : solis > i+1 ? "#2e7d32" : "#3a5a3a",
                fontWeight: solis === i+1 ? 700 : 400 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", margin: "0 auto 2px",
                  background: solis > i ? (solis === i+1 ? "#4caf50" : "#2e7d32") : "#1a3a1a",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: solis >= i+1 ? "#fff" : "#3a5a3a" }}>
                  {i + 1}
                </div>
                {n}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={s.body}>

        {/* SOLIS 1 — Sugas izvēle */}
        {solis === 1 && (
          <div>
            <div style={{ ...s.card, marginBottom: 20 }}>
              <div style={{ fontSize: 15, color: "#4caf50", fontWeight: 700, marginBottom: 10 }}>🏆 CIC Trofeju Vērtēšanas Kalkulators</div>
              <div style={{ background: "#0d1a0d", border: "1px solid #2d4a2d", borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: "#ffb74d", fontWeight: 700, marginBottom: 6 }}>⚠️ SVARĪGI PIRMS SĀCI</div>
                <div style={{ fontSize: 13, color: "#b0c8b0", lineHeight: 1.7 }}>
                  Šis kalkulators <strong style={{ color: "#ddeadd" }}>nav CIC eksperts</strong>. Tas palīdz saprast, ko esi nomedījis — vai trofeja ir bronzas, sudraba vai zelta līmenī — un ar ko doties pie eksperta.<br /><br />
                  Rezultāts būs <strong style={{ color: "#ddeadd" }}>tuvu realitātei</strong>, bet par <strong style={{ color: "#ddeadd" }}>pilnvērtīgu, oficiālu CIC vērtējumu</strong> — griezies pie sertificēta CIC eksperta.
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#5a8a5a" }}>
                Lielākā trofeja vērtēšanas izstāde Latvijā — <span style={{ color: "#81c784" }}>"Mednieks" Ķīpsalā</span>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#81c784", fontWeight: 700, marginBottom: 12 }}>IZVĒLIES SUGU</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SUGAS.map(sg => {
                const lim = MEDALAS[sg.id]
                return (
                  <button key={sg.id} onClick={() => izveletieSugas(sg)}
                    style={{ background: "#0a140a", border: "1px solid #1a3a1a", borderRadius: 12, padding: "14px 16px",
                      cursor: "pointer", textAlign: "left", transition: "border-color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#4caf50"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#1a3a1a"}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 28 }}>{sg.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#ddeadd" }}>{sg.nos}</div>
                        <div style={{ fontSize: 11, color: "#5a8a5a", fontStyle: "italic" }}>{sg.lat}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: "#5a8a5a" }}>Zelts no</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#ffd700" }}>{lim.zelts} pkt</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* SOLIS 2 — Pamācība */}
        {solis === 2 && suga && (
          <div>
            <div style={s.card}>
              <div style={{ fontSize: 14, color: "#4caf50", fontWeight: 700, marginBottom: 4 }}>
                {suga.emoji} {suga.nos} — Kā mērīt?
              </div>
              <div style={{ fontSize: 11, color: "#5a8a5a", marginBottom: 14 }}>
                Iepazīsties ar mērīšanas metodiku pirms ievadīt skaitļus.
              </div>
              {(PAMACIBAS[suga.id] || []).map((p, i) => (
                <div key={i} style={{ borderBottom: "1px solid #1a3a1a", paddingBottom: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#81c784", marginBottom: 4 }}>{p.t}</div>
                  <div style={{ fontSize: 13, color: "#b0c8b0", lineHeight: 1.6 }}>{p.b}</div>
                </div>
              ))}
            </div>

            {/* Mērījumu režīms */}
            <div style={s.card}>
              <div style={{ fontSize: 12, color: "#81c784", fontWeight: 700, marginBottom: 12 }}>MĒRĪJUMU REŽĪMS</div>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { v: "tikko", l: "Tikko nomedīts", d: "Provizoriskais aprēķins" },
                  { v: "sagatavota", l: "Sagatavota trofeja", d: `Žāvēta ${suga.zuv}` },
                ].map(r => (
                  <button key={r.v} onClick={() => setRezims(r.v)}
                    style={{ flex: 1, padding: "10px 12px", borderRadius: 8, cursor: "pointer", textAlign: "center",
                      background: rezims === r.v ? "#1b5e20" : "#0a140a",
                      border: `1px solid ${rezims === r.v ? "#4caf50" : "#1a3a1a"}`,
                      color: rezims === r.v ? "#ddeadd" : "#5a8a5a" }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{r.l}</div>
                    <div style={{ fontSize: 10, marginTop: 2 }}>{r.d}</div>
                  </button>
                ))}
              </div>
            </div>

            <button style={{ ...s.btn, width: "100%" }} onClick={uz3}>
              Turpināt uz mērījumiem →
            </button>
          </div>
        )}

        {/* SOLIS 3 — Mērījumu forma */}
        {solis === 3 && suga && (
          <div>
            <div style={s.card}>
              <div style={{ fontSize: 14, color: "#4caf50", fontWeight: 700, marginBottom: 16 }}>
                {suga.emoji} {suga.nos} — Ievadi mērījumus
              </div>
              {suga.id === 'staltbriedis' && <FormaStaltbriedis vals={merij} set={setM} rezims={rezims} />}
              {suga.id === 'stirnazis'    && <FormaStirnazis    vals={merij} set={setM} rezims={rezims} />}
              {suga.id === 'alnis'        && <FormaAlnis        vals={merij} set={setM} rezims={rezims} />}
              {suga.id === 'dambriedis'   && <FormaDambriedis   vals={merij} set={setM} rezims={rezims} />}
              {suga.id === 'meza_kuilis'  && <FormaKuilis       vals={merij} set={setM} />}
            </div>
            <button style={{ ...s.btn, width: "100%" }} onClick={uz4}>
              🏆 Aprēķināt CIC punktus
            </button>
          </div>
        )}

        {/* SOLIS 4 — Rezultāts */}
        {solis === 4 && suga && rez && (
          <Rezultats suga={suga} rez={rez} rezims={rezims}
            onAtpakal={atpakalsUz3} />
        )}

        {/* Atpakaļ uz sugu izvēli */}
        {solis > 1 && solis < 4 && (
          <div style={{ marginTop: 8 }}>
            <button style={s.btnSm} onClick={jauns}>← Mainīt sugu</button>
          </div>
        )}
        {solis === 4 && (
          <div style={{ marginTop: 10 }}>
            <button style={s.btnSm} onClick={jauns}>← Jauns aprēķins</button>
          </div>
        )}

      </div>
    </div>
  )
}
