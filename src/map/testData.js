// Testa dati — 76760040019 īpašums (Saulkrastu novads)
// Izmanto PDF ģenerēšanas testēšanai bez LVM GEO

export const TEST_KADASTRS = '76760040019'

export const TEST_TITULLAPA = {
  novads:    'Saulkrastu novads',
  pagasts:   'Saulkrastu pagasts',
  nosaukums: 'Priedes',
}

// Nogabali pēc 76760040019_Inventarizacijas_datu_apkopojums.pdf datiem
export const TEST_NOGABALI = [
  {
    id: 'n1', nr: 1, nr_text: '1',
    kategorija: 'MA', platiba: 3.24,
    suga: 'P', sugaNos: 'Priede', vecums: 85, h: 26, g: 32, d: 28,
    bieziba: 0.9, mezaTips: 'Vr', bonitate: 'I',
    audzeFormula: '10P', krajaHa: 290, kraja: 940, lēmums: 'Kailcirte',
    izcApjoms: 940, bojajumsVeids: '', bojajumsProc: 0,
    mapManuali: true,
  },
  {
    id: 'n2', nr: 2, nr_text: '2',
    kategorija: 'MA', platiba: 2.87,
    suga: 'E', sugaNos: 'Egle', vecums: 62, h: 24, g: 36, d: 24,
    bieziba: 1.0, mezaTips: 'Gs', bonitate: 'I',
    audzeFormula: '8E 2B', krajaHa: 320, kraja: 919, lēmums: 'Kailcirte',
    izcApjoms: 919, bojajumsVeids: '', bojajumsProc: 0,
    mapManuali: true,
  },
  {
    id: 'n3', nr: 3, nr_text: '3',
    kategorija: 'MA', platiba: 1.95,
    suga: 'B', sugaNos: 'Bērzs', vecums: 45, h: 22, g: 28, d: 20,
    bieziba: 0.8, mezaTips: 'Dm', bonitate: 'II',
    audzeFormula: '7B 3A', krajaHa: 195, kraja: 380, lēmums: 'Kopšanas cirte',
    izcApjoms: 114, bojajumsVeids: '', bojajumsProc: 0,
    mapManuali: true,
  },
  {
    id: 'n4', nr: 4, nr_text: '4',
    kategorija: 'MA', platiba: 4.10,
    suga: 'P', sugaNos: 'Priede', vecums: 110, h: 30, g: 38, d: 34,
    bieziba: 0.85, mezaTips: 'Vr', bonitate: 'Ia',
    audzeFormula: '9P 1E', krajaHa: 380, kraja: 1558, lēmums: 'Kailcirte',
    izcApjoms: 1558, bojajumsVeids: '', bojajumsProc: 0,
    mapManuali: true,
  },
  {
    id: 'n5', nr: 5, nr_text: '5',
    kategorija: 'MA', platiba: 2.33,
    suga: 'A', sugaNos: 'Apse', vecums: 38, h: 18, g: 22, d: 18,
    bieziba: 0.7, mezaTips: 'Sl', bonitate: 'II',
    audzeFormula: '6A 4B', krajaHa: 140, kraja: 326, lēmums: 'Kopšanas cirte',
    izcApjoms: 98, bojajumsVeids: 'Mizgrauži', bojajumsProc: 25,
    mapManuali: true,
  },
  {
    id: 'n6', nr: 6, nr_text: '6',
    kategorija: 'MA', platiba: 1.62,
    suga: 'E', sugaNos: 'Egle', vecums: 28, h: 10, g: 14, d: 11,
    bieziba: 0.9, mezaTips: 'Dm', bonitate: 'II',
    audzeFormula: '8E 2B', krajaHa: 85, kraja: 138, lēmums: 'Jaunaudze — retināt',
    izcApjoms: 0, bojajumsVeids: '', bojajumsProc: 0,
    mapManuali: true,
  },
  {
    id: 'n7', nr: 7, nr_text: '7',
    kategorija: 'MA', platiba: 2.18,
    suga: 'Bl', sugaNos: 'Melnalksnis', vecums: 52, h: 20, g: 26, d: 22,
    bieziba: 0.8, mezaTips: 'Lk', bonitate: 'II',
    audzeFormula: '10Bl', krajaHa: 185, kraja: 403, lēmums: 'Kailcirte',
    izcApjoms: 403, bojajumsVeids: '', bojajumsProc: 0,
    mapManuali: true,
  },
  {
    id: 'n8', nr: 8, nr_text: '8',
    kategorija: 'Izc', platiba: 1.45,
    suga: '', sugaNos: '—', vecums: 0, h: 0, g: 0, d: 0,
    bieziba: 0, mezaTips: '', bonitate: '—',
    audzeFormula: '—', krajaHa: 0, kraja: 0,
    lēmums: 'Meža atjaunošana (izc. 2022)',
    izcApjoms: 0, izcGads: 2022, izcAtjaunots: true,
    bojajumsVeids: '', bojajumsProc: 0,
    mapManuali: true,
  },
  {
    id: 'n9', nr: 9, nr_text: '9',
    kategorija: 'ML', platiba: 1.12,
    suga: '', sugaNos: '—', vecums: 0, h: 0, g: 0, d: 0,
    bieziba: 0, mezaTips: '', bonitate: '—',
    audzeFormula: '—', krajaHa: 0, kraja: 0,
    lēmums: 'Meža lauce',
    izcApjoms: 0, bojajumsVeids: '', bojajumsProc: 0,
    mapManuali: true,
  },
  {
    id: 'n10', nr: 10, nr_text: '10',
    kategorija: 'Pu', platiba: 0.97,
    suga: '', sugaNos: '—', vecums: 0, h: 0, g: 0, d: 0,
    bieziba: 0, mezaTips: '', bonitate: '—',
    audzeFormula: '—', krajaHa: 0, kraja: 0,
    lēmums: 'Purvs',
    izcApjoms: 0, bojajumsVeids: '', bojajumsProc: 0,
    mapManuali: true,
  },
]
