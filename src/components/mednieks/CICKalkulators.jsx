// Plāns iesaiņojums ap CICKalkulatorsPage loģiku — bez galvenes
// Importē visu no cicEngine, renderē tikai content (bez App shell)
import { useState } from 'react'
import { SUGAS, MEDALAS, getMedala, aprKin } from '../../cicEngine'
import { EtikasTeksts } from './EtikasTeksts'
import { ETIKAS_TEKSTI } from '../../data/etika'

// Atkārtoti izmanto cicEngine — skatīt src/cicEngine.js pilnai loģikai
// Šī komponente ir vienkāršots skats rokasgrāmatas ietvaros

export default function CICKalkulators() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#81c784' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>CIC Trofeju Kalkulators</div>
      <div style={{ fontSize: 13, color: '#5a8a5a', marginBottom: 24, lineHeight: 1.6 }}>
        Pilns CIC kalkulators pieejams atsevišķā lapā ar 4 soļu vadli, pamācībām un detalizētu punktu sadalījumu.
      </div>
      <div style={{ background: '#0a140a', border: '1px solid #2d4a2d', borderRadius: 10, padding: 16, marginBottom: 24, textAlign: 'left' }}>
        <div style={{ fontSize: 12, color: '#81c784', fontWeight: 700, marginBottom: 8 }}>PIEEJAMĀS SUGAS:</div>
        {SUGAS.map(s => {
          const lim = MEDALAS[s.id]
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #1a3a1a' }}>
              <span style={{ fontSize: 20 }}>{s.emoji}</span>
              <span style={{ flex: 1, fontSize: 13, color: '#ddeadd' }}>{s.nos}</span>
              <span style={{ fontSize: 11, color: '#ffd700' }}>🥇 {lim.zelts}+ pkt</span>
            </div>
          )
        })}
      </div>
      <EtikasTeksts teksts={ETIKAS_TEKSTI.cic.bezMedalas} />
    </div>
  )
}
