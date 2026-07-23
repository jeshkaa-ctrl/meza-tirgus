import { C, F } from './ds'

const s = { color: C.textSec, fontSize: F.base, margin: '0 0 10px 0', lineHeight: 1.75 }
const li = { color: C.textSec, fontSize: F.base, marginBottom: 4, lineHeight: 1.75 }
const ul = { paddingLeft: 22, margin: '6px 0 10px 0' }
const h2 = { color: C.green, fontSize: F.md, fontWeight: 700, margin: '0 0 10px 0' }
const sec = { marginBottom: 28 }
const dim = { color: C.textDim, fontSize: F.xs, margin: 0 }

export default function NoteikumiPage({ onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: F.family }}>
      <header style={{
        background: 'rgba(17,31,17,0.9)', borderBottom: `1px solid ${C.greenBdr}`,
        backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 100,
        height: 52, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: C.textMut,
          fontSize: F.sm, cursor: 'pointer', fontFamily: F.family, minHeight: 44,
        }}>← Atpakaļ</button>
        <span style={{ color: C.green, fontWeight: 700, fontSize: F.md }}>Lietošanas noteikumi</span>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 80px', lineHeight: 1.8 }}>

        <p style={{ ...dim, marginBottom: 32 }}>
          Spēkā no: 2026. gada 23. jūlijs &nbsp;·&nbsp;
          Pakalpojuma sniedzējs: Meža Tirgus IK, Reģ.Nr. 50002233391 &nbsp;·&nbsp;
          mezatirgus.info@gmail.com
        </p>

        {/* 1 */}
        <section style={sec}>
          <h2 style={h2}>1. Vispārīgie noteikumi</h2>
          <p style={s}>1.1. Šie Lietošanas noteikumi ("Noteikumi") regulē attiecības starp Meža Tirgus IK ("Pakalpojuma sniedzējs", "mēs") un ikvienu personu, kas izmanto tīmekļa vietni meza-tirgus.lv un tajā pieejamos rīkus, kalkulatorus, saturu un pakalpojumus ("Platforma").</p>
          <p style={s}>1.2. Izmantojot Platformu, jūs apliecināt, ka esat iepazinušies ar šiem Noteikumiem un piekrītat tiem pilnībā. Ja nepiekrītat kādam no Noteikumu punktiem, lūdzam neizmantot Platformu.</p>
          <p style={s}>1.3. Pakalpojuma sniedzējs patur tiesības jebkurā laikā mainīt šos Noteikumus. Būtiskas izmaiņas tiks paziņotas Platformā vai uz reģistrēto e-pastu. Turpinot lietot Platformu pēc izmaiņu spēkā stāšanās, uzskatāms, ka esat tām piekritis.</p>
        </section>

        {/* 2 */}
        <section style={sec}>
          <h2 style={h2}>2. Platformas raksturs un darbības joma</h2>
          <p style={s}>2.1. Meža Tirgus ir digitāla platforma, kas piedāvā informatīvus rīkus, kalkulatorus un saturu meža īpašniekiem, mežsaimniekiem, mednieku kopienai un ar meža nozari saistītiem uzņēmumiem.</p>
          <p style={s}>2.2. Platforma <strong style={{ color: C.text }}>NAV</strong> meža inventarizācijas sistēma, mērniecības pakalpojums vai oficiāls valsts reģistrs. Platforma nodrošina aprēķinu, apkopošanas un vizualizācijas rīkus, kas darbojas, pamatojoties uz:</p>
          <ul style={ul}>
            <li style={li}>lietotāja pašrocīgi ievadītiem datiem (mērījumiem, novērojumiem, dokumentiem);</li>
            <li style={li}>publiski pieejamiem valsts datu avotiem (piemēram, Valsts meža dienesta, Valsts zemes dienesta, Latvijas Ģeotelpiskās informācijas aģentūras atvērtajiem datiem), kuru aktualitāte un precizitāte ir atkarīga no šo iestāžu datu publicēšanas biežuma un kvalitātes.</li>
          </ul>
          <p style={s}>2.3. Platforma nesaglabā lietotāju ievadītos datus kā oficiālu inventarizācijas reģistru un nav paredzēta kā vienīgais avots juridiski saistošu lēmumu pieņemšanai bez papildu pārbaudes.</p>
        </section>

        {/* 3 */}
        <section style={sec}>
          <h2 style={h2}>3. Atbildības ierobežojums — aprēķinu rezultāti</h2>
          <p style={s}>3.1. Platformā pieejamie kalkulatori un aprēķinu rīki (tostarp, bet ne tikai: kubatūras kalkulators, caurmēra mērījumi, cirsmas vērtēšana, dastojuma kalkulators, krautuves mērītājs, koksnes cenu kalkulators, apsaimniekošanas plāna aprēķini) veic tikai matemātisku un loģisku aprēķinu darbību, pamatojoties uz lietotāja ievadītajiem vai augšupielādētajiem datiem.</p>
          <p style={s}>3.2. Pakalpojuma sniedzējs neveic, nepārbauda un negarantē lauka mērījumu, inventarizācijas datu vai augšupielādēto dokumentu precizitāti. Aprēķinu rezultātu pareizība ir tieši un pilnībā atkarīga no:</p>
          <ul style={ul}>
            <li style={li}>lietotāja veikto mērījumu precizitātes (piemēram, caurmēra, augstuma, platības mērījumiem);</li>
            <li style={li}>augšupielādēto inventarizācijas dokumentu (VMD PDF u.c.) satura pareizības;</li>
            <li style={li}>izmantoto avota datu (VMD, VZD u.c.) aktualitātes brīdī, kad tie tika publicēti.</li>
          </ul>
          <p style={s}>3.3. Pakalpojuma sniedzējs neuzņemas atbildību par jebkādiem tiešiem vai netiešiem zaudējumiem, kas radušies:</p>
          <ul style={ul}>
            <li style={li}>lietotāja veikto mērījumu neprecizitātes dēļ;</li>
            <li style={li}>novecojušu vai neprecīzu avota datu (VMD, VZD, LĢIA u.c.) dēļ;</li>
            <li style={li}>lēmumiem, kas pieņemti, pamatojoties uz Platformas aprēķinu rezultātiem, bez neatkarīgas pārbaudes;</li>
            <li style={li}>trešo pušu (piemēram, sertificētu mežsaimniecības ekspertu, mērnieku) atzinumu neatbilstības Platformas aprēķinātajiem rezultātiem.</li>
          </ul>
          <p style={s}>3.4. Platformas aprēķinu rezultāti ir uzskatāmi par <strong style={{ color: C.text }}>informatīvu palīglīdzekli</strong>, nevis par sertificētu meža inventarizācijas, vērtēšanas vai mērniecības atzinumu. Juridiski saistošiem mērķiem (piemēram, ciršanas apliecinājumiem, īpašuma darījumiem, apdrošināšanas prasībām) lietotājam jāizmanto sertificētu speciālistu pakalpojumi.</p>
          <p style={s}>3.5. Meža apsaimniekošanas plāna (MAP) dokuments, ko ģenerē Platforma, ir sagatavots, pamatojoties uz lietotāja ievadītajiem terēna datiem, un tā atbilstība normatīvo aktu prasībām (piemēram, MK noteikumu Nr. 384 formātam) ir atkarīga no lietotāja ievadīto datu pilnības un precizitātes.</p>
        </section>

        {/* 4 */}
        <section style={sec}>
          <h2 style={h2}>4. Lietotāja pienākumi</h2>
          <p style={s}>4.1. Lietotājs apņemas:</p>
          <ul style={ul}>
            <li style={li}>sniegt Platformā patiesus un precīzus datus, ciktāl tas ir viņa rīcībā;</li>
            <li style={li}>neizmantot Platformu prettiesiskiem mērķiem;</li>
            <li style={li}>patstāvīgi pārbaudīt aprēķinu rezultātus pirms to izmantošanas juridiski nozīmīgos lēmumos;</li>
            <li style={li}>neveikt darbības, kas apdraud Platformas drošību vai darbību (piemēram, automatizētu datu izgūšanu bez atļaujas).</li>
          </ul>
          <p style={s}>4.2. Lietotājs ir pilnībā atbildīgs par savu piekļuves datu (e-pasta, paroles) konfidencialitāti.</p>
        </section>

        {/* 5 */}
        <section style={sec}>
          <h2 style={h2}>5. Abonementi un maksājumi</h2>
          <p style={s}>5.1. Platforma piedāvā gan bezmaksas, gan maksas funkcijas. Aktuālais cenrādis ir pieejams Platformā sadaļā "Abonements".</p>
          <p style={s}>5.2. Maksājumi tiek apstrādāti, izmantojot trešās puses maksājumu pakalpojumu sniedzēju (Montonio). Pakalpojuma sniedzējs neuzglabā lietotāju maksājumu karšu datus.</p>
          <p style={s}>5.3. Vienreizējie maksājumi (piemēram, PDF dokumentu lejupielāde, sludinājumu publicēšana) tiek iekasēti pirms attiecīgā pakalpojuma sniegšanas.</p>
          <p style={s}>5.4. Abonementa (Bizness plāna) maksājumi tiek atjaunoti manuāli — pirms perioda beigām lietotājs saņem paziņojumu ar maksājuma saiti. Ja maksājums netiek veikts, abonements tiek deaktivizēts, taču lietotāja iepriekš ievadītie dati netiek dzēsti.</p>
          <p style={s}>5.5. Saskaņā ar Patērētāju tiesību aizsardzības likumu, patērētājam ir tiesības atteikties no digitālā satura vai pakalpojuma līguma 14 dienu laikā, ja pakalpojuma sniegšana vēl nav uzsākta. Tā kā abonementa pakalpojumi (Bizness plāni) un vienreizējie maksājumi (PDF dokumenti, sludinājumi) tiek aktivizēti/piegādāti nekavējoties pēc maksājuma apstiprinājuma, iegādājoties šos pakalpojumus, lietotājs piekrīt, ka pakalpojuma sniegšana sākas nekavējoties, un tādējādi atsakās no 14 dienu atteikuma tiesībām attiecībā uz jau sniegtajiem/piegādātajiem pakalpojumiem. Ja pakalpojums vēl nav izmantots (piemēram, apmaksāts PDF vēl nav lejupielādēts), lietotājs var pieprasīt atmaksu, sazinoties ar mums 14 dienu laikā no maksājuma dienas.</p>
        </section>

        {/* 6 */}
        <section style={sec}>
          <h2 style={h2}>6. Intelektuālais īpašums</h2>
          <p style={s}>6.1. Platformas dizains, kods, saturs un aprēķinu metodoloģija pieder Pakalpojuma sniedzējam vai tiek izmantoti ar attiecīgu licenci.</p>
          <p style={s}>6.2. Lietotāja augšupielādētie dati (piemēram, VMD PDF dokumenti, fotoattēli) paliek lietotāja īpašumā.</p>
        </section>

        {/* 7 */}
        <section style={sec}>
          <h2 style={h2}>7. Datu avoti un to precizitāte</h2>
          <p style={s}>7.1. Platforma izmanto publiski pieejamus valsts datu avotus, tostarp:</p>
          <ul style={ul}>
            <li style={li}>Valsts meža dienesta (VMD) atvērtos datus;</li>
            <li style={li}>Valsts zemes dienesta (VZD) kadastra datus;</li>
            <li style={li}>Latvijas Ģeotelpiskās informācijas aģentūras (LĢIA) datus.</li>
          </ul>
          <p style={s}>7.2. Šo datu aktualitāte ir atkarīga no attiecīgo iestāžu publicēšanas grafika (parasti reizi ceturksnī). Pakalpojuma sniedzējs regulāri atjaunina datus, taču negarantē to reāllaika precizitāti.</p>
        </section>

        {/* 8 */}
        <section style={sec}>
          <h2 style={h2}>8. Pakalpojuma pieejamība</h2>
          <p style={s}>8.1. Pakalpojuma sniedzējs pieliek pūles, lai nodrošinātu Platformas nepārtrauktu darbību, taču negarantē 100% pieejamību. Platforma var būt īslaicīgi nepieejama tehniskās apkopes, ārēju datu avotu traucējumu vai citu no Pakalpojuma sniedzēja neatkarīgu apstākļu dēļ.</p>
        </section>

        {/* 9 */}
        <section style={sec}>
          <h2 style={h2}>9. Strīdu risināšana</h2>
          <p style={s}>9.1. Šiem Noteikumiem piemērojami Latvijas Republikas normatīvie akti.</p>
          <p style={s}>9.2. Strīdi tiek risināti pārrunu ceļā. Ja vienošanās netiek panākta, strīds risināms Latvijas Republikas tiesā.</p>
        </section>

        {/* 10 */}
        <section style={sec}>
          <h2 style={h2}>10. Kontaktinformācija</h2>
          <p style={s}>Jautājumu vai pretenziju gadījumā lūdzam sazināties: <a href="mailto:mezatirgus.info@gmail.com" style={{ color: C.green }}>mezatirgus.info@gmail.com</a></p>
        </section>

      </main>
    </div>
  )
}
