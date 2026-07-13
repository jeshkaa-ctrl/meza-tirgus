import { useState, useEffect } from 'react'
import AppKarte from '../components/AppKarte'
import { iegutAbonementa, varPiekluvet, diezCikDienas, abonementsNosaukums } from '../utils/abonements'

export default function SakumsPage({ user, onNavigate, onReg, onIziet }) {
  const [sub, setSub] = useState(null)
  const [subIelade, setSubIelade] = useState(true)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [varInstalet, setVarInstalet] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone

  useEffect(() => {
    if (isStandalone) return
    if (isIOS) { setVarInstalet(true); return }
    if (window.deferredInstallPrompt) { setInstallPrompt(window.deferredInstallPrompt); setVarInstalet(true) }
    const h = e => { e.preventDefault(); setInstallPrompt(e); setVarInstalet(true) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  useEffect(() => {
    if (!user?.id) { setSub(null); setSubIelade(false); return }
    iegutAbonementa(user.id).then(d => { setSub(d); setSubIelade(false) })
  }, [user?.id])

  async function instaletApp() {
    if (isIOS) { setShowIosHint(true); return }
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') { setVarInstalet(false); setInstallPrompt(null) }
  }

  const piekluvet = (modulis) => varPiekluvet(sub, modulis)
  const dienas = (modulis) => diezCikDienas(sub, modulis)
  const tips = (modulis) => abonementsNosaukums(sub, modulis)

  const s = {
    wrap: { minHeight: '100vh', background: '#060d06', color: '#ddeadd', fontFamily: "'Inter',sans-serif", paddingBottom: 32 },
    hdr: {
      background: 'rgba(6,13,6,0.97)', borderBottom: '1px solid #1a3a1a',
      backdropFilter: 'blur(8px)', padding: '0 16px', height: 52,
      display: 'flex', alignItems: 'center', gap: 10,
      position: 'sticky', top: 0, zIndex: 10,
    },
    logo: { display: 'flex', alignItems: 'center', gap: 8, flex: 1 },
    virsraksts: { margin: 0, color: '#4caf50', fontSize: 15, fontWeight: 700 },
    sadalaHdr: { padding: '20px 16px 10px', display: 'flex', alignItems: 'baseline', gap: 8 },
    sadalaVirsraksts: { fontSize: 13, fontWeight: 700, color: '#81c784', textTransform: 'uppercase', letterSpacing: 0.5 },
    sabalaCena: { fontSize: 11, color: '#3a5a3a' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, padding: '0 16px' },
  }

  return (
    <div style={s.wrap}>
      {/* Galvene */}
      <div style={s.hdr}>
        <div style={s.logo}>
          <img src="/pwa-192x192.png" alt="" style={{ width: 28, height: 28, borderRadius: 6 }} />
          <h1 style={s.virsraksts}>Meža Tirgus</h1>
        </div>
        {varInstalet && !isStandalone && (
          <button onClick={instaletApp} style={{
            background: '#e8720c', color: '#fff', border: 'none',
            borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>📲 Instalēt</button>
        )}
        {user ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onNavigate('profils')} style={{
              background: 'transparent', border: '1px solid #2e7d32', color: '#81c784',
              borderRadius: 8, padding: '5px 10px', fontSize: 11, cursor: 'pointer',
            }}>👤</button>
            <button onClick={onIziet} style={{
              background: 'transparent', border: '1px solid #1a3a1a', color: '#4a6a4a',
              borderRadius: 8, padding: '5px 10px', fontSize: 11, cursor: 'pointer',
            }}>Iziet</button>
          </div>
        ) : (
          <button onClick={onReg} style={{
            background: '#e8720c', color: '#fff', border: 'none',
            borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>Pieteikties</button>
        )}
      </div>

      {/* iOS instalēšanas hints */}
      {showIosHint && (
        <div style={{ background: '#1a2510', border: '1px solid #e8720c', borderRadius: 12, margin: '8px 12px 0', padding: '12px 16px', position: 'relative' }}>
          <button onClick={() => setShowIosHint(false)} style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', color: '#7a8f52', fontSize: 18, cursor: 'pointer' }}>×</button>
          <div style={{ color: '#e8720c', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>📲 Instalēt iPhone/iPad:</div>
          <div style={{ color: '#b8c89a', fontSize: 13, lineHeight: 1.8 }}>
            1. Atver <strong style={{ color: '#e8f0d8' }}>Safari</strong><br />
            2. Nospied <strong style={{ color: '#e8f0d8' }}>□↑ Share</strong><br />
            3. <strong style={{ color: '#e8f0d8' }}>Add to Home Screen</strong>
          </div>
        </div>
      )}

      {/* HERO */}
      <div style={{ textAlign: 'center', padding: '24px 16px 20px', borderBottom: '1px solid #0f1f0f' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🌲</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#ddeadd', marginBottom: 6 }}>Meža Tirgus</div>
        <div style={{ fontSize: 13, color: '#5a8a5a', lineHeight: 1.6, maxWidth: 340, margin: '0 auto 16px' }}>
          Profesionālie rīki meža speciālistiem, medniekiem un meža uzņēmumiem
        </div>
        {!user && (
          <button onClick={onReg} style={{
            background: '#e8720c', color: '#fff', border: 'none',
            borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Reģistrēties bezmaksas →
          </button>
        )}
        {user && !subIelade && !sub && (
          <div style={{ fontSize: 12, color: '#4caf50' }}>
            Sveiks, {user.email?.split('@')[0]}! 👋
          </div>
        )}
      </div>

      {/* ═══ 1. BEZMAKSAS RĪKI ═══ */}
      <div style={s.sadalaHdr}>
        <div style={s.sadalaVirsraksts}>🆓 Bezmaksas rīki</div>
        <div style={s.sabalaCena}>bez reģistrācijas</div>
      </div>
      <div style={s.grid}>
        <AppKarte
          ikona="🪵" nosaukums="Kubikmetru kalkulators"
          apraksts="Tievgalis + garums → m³, sortimenti, PDF eksports"
          bezmaksas pieejams onClick={() => onNavigate('kubi')}
        />
        <AppKarte
          ikona="📏" nosaukums="Caurmēra mērījumi"
          apraksts="Ātra caurmēru ievade laukā, bonitāte, tūlītējs rezultāts"
          bezmaksas pieejams onClick={() => onNavigate('caurmers_mobile')}
        />
        <AppKarte
          ikona="✏️" nosaukums="Cirsmas skice"
          apraksts="KML/SHP → skice un koordinātas (bez PDF eksporta)"
          bezmaksas pieejams onClick={() => onNavigate('skice')}
        />
        <AppKarte
          ikona="📢" nosaukums="Sludinājumi"
          apraksts="Meža īpašumu un cirsmu sludinājumi — skatīt bez maksas"
          bezmaksas pieejams onClick={() => onNavigate('sludinajumi')}
        />
        <AppKarte
          ikona="⚖️" nosaukums="Meža likumu konsultants"
          apraksts="Jautā par MK noteikumiem, VMD, cirsmu tiesībām — AI atbild"
          bezmaksas pieejams onClick={() => onNavigate('jautaparmezu')}
        />
      </div>

      {/* ═══ 2. MEŽA SPECIĀLISTA RĪKI ═══ */}
      <div style={{ ...s.sadalaHdr, marginTop: 8 }}>
        <div style={s.sadalaVirsraksts}>🗺️ Meža speciālista rīki</div>
        <div style={s.sabalaCena}>€5.99/mēn · €24.99/gadā</div>
      </div>
      <div style={s.grid}>
        <AppKarte
          ikona="🗺️" nosaukums="Īpašuma analīze"
          apraksts="Kadastra nr. → LVM GEO automātiska analīze, karte, vērtība"
          funkcijas={['LVM GEO integrācija', 'Automātiska vērtēšana', 'Kartes skats']}
          pieejams={piekluvet('meza_riki')} abonements={tips('meza_riki')}
          diezDienas={dienas('meza_riki')}
          cenaM={5.99} cenaG={24.99}
          onClick={() => piekluvet('meza_riki') ? onNavigate('ipasums') : onNavigate('subscription')}
        />
        <AppKarte
          ikona="📊" nosaukums="Cirsmas novērtēšana"
          apraksts="PDF no VMD → nogabalu analīze, cirsmas vērtība automātiski"
          funkcijas={['VMD PDF analīze', 'Cirsmas vērtība', 'Nogabalu dati']}
          pieejams={piekluvet('meza_riki')} abonements={tips('meza_riki')}
          diezDienas={dienas('meza_riki')}
          cenaM={5.99} cenaG={24.99}
          onClick={() => piekluvet('meza_riki') ? onNavigate('cirsma') : onNavigate('subscription')}
        />
        <AppKarte
          ikona="📄" nosaukums="Cirsmas skice + PDF"
          apraksts="KML/SHP → skice, koordinātas, PDF VMD iesniegumam"
          funkcijas={['PDF eksports', 'VMD iesniegums', 'Koordinātas']}
          pieejams={piekluvet('meza_riki')} abonements={tips('meza_riki')}
          diezDienas={dienas('meza_riki')}
          cenaM={5.99} cenaG={24.99}
          onClick={() => piekluvet('meza_riki') ? onNavigate('skice') : onNavigate('subscription')}
        />
        <AppKarte
          ikona="🚚" nosaukums="Loģistikas kalkulators"
          apraksts="Transporta izmaksas, piegādes maršruti un aprēķini"
          pieejams={piekluvet('meza_riki')} abonements={tips('meza_riki')}
          diezDienas={dienas('meza_riki')}
          cenaM={5.99} cenaG={24.99}
          onClick={() => piekluvet('meza_riki') ? onNavigate('logistika') : onNavigate('subscription')}
        />
        <AppKarte
          ikona="📈" nosaukums="Dastojuma kalkulators"
          apraksts="Mežvērtes PDF → sortimentu apjomi, krautuves vērtība"
          pieejams={piekluvet('meza_riki')} abonements={tips('meza_riki')}
          diezDienas={dienas('meza_riki')}
          cenaM={5.99} cenaG={24.99}
          onClick={() => piekluvet('meza_riki') ? onNavigate('dastojums_pdf') : onNavigate('subscription')}
        />
        <AppKarte
          ikona="🗂️" nosaukums="Apsaimniekošanas plāns"
          apraksts="MAP laukā — nogabali, terēna dati, MK 384 PDF"
          funkcijas={['Nogabalu karte', 'MK 384 PDF', 'Terēna dati']}
          pieejams={piekluvet('meza_riki')} abonements={tips('meza_riki')}
          diezDienas={dienas('meza_riki')}
          cenaM={5.99} cenaG={24.99}
          onClick={() => piekluvet('meza_riki') ? onNavigate('map-plans') : onNavigate('subscription')}
        />
      </div>

      {/* ═══ 3. MEDNIEKA ROKASGRĀMATA ═══ */}
      <div style={{ ...s.sadalaHdr, marginTop: 8 }}>
        <div style={s.sadalaVirsraksts}>🦌 Mednieka rokasgrāmata</div>
        <div style={s.sabalaCena}>€5.99/mēn · €24.99/gadā</div>
      </div>
      <div style={s.grid}>
        <AppKarte
          ikona="🦌" nosaukums="Sugu katalogs"
          apraksts="Visi Latvijas medījamie — sugas, sezonas, atpazīšanas pazīmes"
          pieejams={!!(piekluvet('rokasgramata') || user)} abonements={tips('rokasgramata')}
          diezDienas={dienas('rokasgramata')}
          cenaM={5.99} cenaG={24.99}
          onClick={() => user ? onNavigate('mednieks') : onNavigate('subscription')}
        />
        <AppKarte
          ikona="🎯" nosaukums="Selektors"
          apraksts="Nofotografē dzīvnieku — AI saka nomedīt vai saudzēt ar pamatojumu"
          funkcijas={['AI foto analīze', 'Selekcijas lēmums', 'Vecuma novērtējums']}
          pieejams={!!(piekluvet('rokasgramata') || user)} abonements={tips('rokasgramata')}
          diezDienas={dienas('rokasgramata')}
          cenaM={5.99} cenaG={24.99}
          onClick={() => user ? onNavigate('mednieks') : onNavigate('subscription')}
        />
        <AppKarte
          ikona="⚖️" nosaukums="Jurists"
          apraksts="Jautā par medību likumiem, termiņiem, dokumentiem — AI atbild"
          pieejams={!!(piekluvet('rokasgramata') || user)} abonements={tips('rokasgramata')}
          diezDienas={dienas('rokasgramata')}
          cenaM={5.99} cenaG={24.99}
          onClick={() => user ? onNavigate('mednieks') : onNavigate('subscription')}
        />
        <AppKarte
          ikona="🏆" nosaukums="CIC kalkulators"
          apraksts="Trofeju novērtēšana pēc CIC formulas — bronza, sudrabs, zelts"
          pieejams={!!(piekluvet('rokasgramata') || user)} abonements={tips('rokasgramata')}
          diezDienas={dienas('rokasgramata')}
          cenaM={5.99} cenaG={24.99}
          onClick={() => user ? onNavigate('mednieks') : onNavigate('subscription')}
        />
        <AppKarte
          ikona="📓" nosaukums="Medību dienasgrāmata"
          apraksts="Fiksē novērojumus brīvā tekstā — AI analizē tendences un prognozē"
          funkcijas={['Brīvs teksts', 'AI analīze', 'Prognozes']}
          pieejams={!!(piekluvet('rokasgramata') || user)} abonements={tips('rokasgramata')}
          diezDienas={dienas('rokasgramata')}
          cenaM={5.99} cenaG={24.99}
          onClick={() => user ? onNavigate('mednieks') : onNavigate('subscription')}
        />
      </div>

      {/* ═══ 4. BIZNESS ═══ */}
      <div style={{ ...s.sadalaHdr, marginTop: 8 }}>
        <div style={s.sadalaVirsraksts}>💼 Bizness</div>
        <div style={s.sabalaCena}>€19/mēn · €159/gadā · līdz 5 lietotāji</div>
      </div>
      <div style={s.grid}>
        <AppKarte
          ikona="🧾" nosaukums="Rēķinu krātuve"
          apraksts="Rēķinu izveide, drukāšana, mēneša un gada pārskats"
          pieejams={piekluvet('bizness')} abonements={tips('bizness')}
          diezDienas={dienas('bizness')}
          cenaM={19} cenaG={159}
          onClick={() => piekluvet('bizness') ? onNavigate('rekini') : onNavigate('subscription')}
        />
        <AppKarte
          ikona="📦" nosaukums="Pavadzīmju reģistrs"
          apraksts="Foto → AI nolasīšana → datubāze. Personalizēts katram klientam"
          funkcijas={['OCR nolasīšana', 'Automātiska uzskaite', 'Klientu arhīvs']}
          pieejams={piekluvet('bizness')} abonements={tips('bizness')}
          diezDienas={dienas('bizness')}
          cenaM={19} cenaG={159}
          onClick={() => piekluvet('bizness') ? onNavigate('pavadzimes') : onNavigate('subscription')}
        />
        <AppKarte
          ikona="🏪" nosaukums="Manas iepirkuma vietas"
          apraksts="Reģistrē iepirkuma punktu un cenas — parādīsies loģistikas kalkulatorā"
          pieejams={piekluvet('bizness')} abonements={tips('bizness')}
          diezDienas={dienas('bizness')}
          cenaM={19} cenaG={159}
          onClick={() => piekluvet('bizness') ? onNavigate('pirceja_cenas') : onNavigate('subscription')}
        />
        <AppKarte
          ikona="👥" nosaukums="Uzņēmuma profils"
          apraksts="Profils platformā + līdz 5 lietotāji uzņēmumā, kopīga piekļuve"
          pieejams={piekluvet('bizness')} abonements={tips('bizness')}
          diezDienas={dienas('bizness')}
          cenaM={19} cenaG={159}
          onClick={() => onNavigate('subscription')}
        />
      </div>

      {/* ═══ 5. PRO ═══ */}
      <div style={{ margin: '20px 16px 0' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0d1a0d, #1a2a10)',
          border: '1px solid #f9a825',
          borderRadius: 16, padding: '20px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>⭐</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#ffd54f' }}>PRO — Viss kopā</div>
              <div style={{ fontSize: 12, color: '#8a7a3a' }}>€29/mēn · €199/gadā</div>
            </div>
            {piekluvet('pro') && (
              <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, color: '#ffd54f', background: '#1a1200', border: '1px solid #f9a825', borderRadius: 4, padding: '2px 7px' }}>AKTĪVS</span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
            {[
              '✅ Meža speciālista rīki',
              '✅ Mednieka rokasgrāmata',
              '✅ Bizness (5 lietotāji)',
              '✅ Izsoles publicēšana',
              '✅ Prioritārs atbalsts',
              '✅ Visas jaunās funkcijas',
            ].map((f, i) => (
              <div key={i} style={{ fontSize: 11, color: '#b8a04a' }}>{f}</div>
            ))}
          </div>
          <button onClick={() => onNavigate('subscription')} style={{
            width: '100%', background: '#f9a825', color: '#1a1000',
            border: 'none', borderRadius: 10, padding: '12px',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            {piekluvet('pro') ? 'Pārvaldīt PRO abonementu' : 'Sākt PRO — €29/mēn →'}
          </button>
        </div>
      </div>

      {/* ═══ ESOŠAJIEM LIETOTĀJIEM ═══ */}
      {user && !sub && !subIelade && (
        <div style={{ margin: '16px 16px 0', background: '#0a1a0a', border: '1px solid #2e7d32', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#4caf50', marginBottom: 6 }}>
            🎁 Jau reģistrējies?
          </div>
          <div style={{ fontSize: 12, color: '#5a8a5a', marginBottom: 10, lineHeight: 1.5 }}>
            Kā esošs lietotājs tu saņem <strong style={{ color: '#81c784' }}>3 mēnešus bezmaksas</strong> piekļuvi Mednieka Rokasgrāmatai.
          </div>
          <button onClick={() => onNavigate('mednieks')} style={{
            background: '#2e7d32', color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            Aktivizēt bezmaksas piekļuvi →
          </button>
        </div>
      )}

      {/* ═══ NAV REĢISTRĒTS ═══ */}
      {!user && (
        <div style={{ margin: '16px 16px 0', background: '#050c05', border: '1px solid #1a3a1a', borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#4caf50', marginBottom: 6 }}>
            🚀 Sāc bezmaksas izmēģinājumu
          </div>
          <div style={{ fontSize: 12, color: '#5a8a5a', marginBottom: 12, lineHeight: 1.5 }}>
            Reģistrējies un saņem <strong style={{ color: '#81c784' }}>30 dienas bezmaksas</strong> piekļuvi visiem premium rīkiem.
          </div>
          <button onClick={onReg} style={{
            width: '100%', background: '#e8720c', color: '#fff', border: 'none',
            borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Reģistrēties bezmaksas →
          </button>
        </div>
      )}
    </div>
  )
}
