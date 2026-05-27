export const PAGASTI = {
  "0100": { nos: "Rīga", lat: 56.9460, lng: 24.1059 },
  "9601": { nos: "Valmiera", lat: 57.5413, lng: 25.4260 },
  "9622": { nos: "Brenguļu pag.", lat: 57.4300, lng: 25.5200 },
  "9644": { nos: "Bērzaines pag.", lat: 57.3700, lng: 25.2200 },
  "9646": { nos: "Brenguļu pag.", lat: 57.4300, lng: 25.5200 },
  "9682": { nos: "Sēļu pag.", lat: 57.5200, lng: 25.1800 },
  "4201": { nos: "Cēsis", lat: 57.3120, lng: 25.2770 },
  "9401": { nos: "Smiltene", lat: 57.4230, lng: 25.9020 },
  "3601": { nos: "Alūksne", lat: 57.4240, lng: 27.0450 },
  "5001": { nos: "Gulbene", lat: 57.1750, lng: 26.7510 },
  "7001": { nos: "Madona", lat: 56.8570, lng: 26.2240 },
  "6601": { nos: "Limbaži", lat: 57.5130, lng: 24.7130 },
  "7801": { nos: "Rēzekne", lat: 56.5013, lng: 27.3330 },
  "7601": { nos: "Preiļi", lat: 56.2990, lng: 26.7230 },
  "4401": { nos: "Daugavpils", lat: 55.8747, lng: 26.5355 },
  "5601": { nos: "Jēkabpils", lat: 56.4990, lng: 25.8790 },
  "6801": { nos: "Ludza", lat: 56.5440, lng: 27.7200 },
  "3801": { nos: "Balvi", lat: 57.1310, lng: 27.2640 },
  "5401": { nos: "Jelgava", lat: 56.6510, lng: 23.7130 },
  "4601": { nos: "Dobele", lat: 56.6250, lng: 23.2780 },
  "4001": { nos: "Bauska", lat: 56.4100, lng: 24.1900 },
  "3401": { nos: "Aizkraukle", lat: 56.6010, lng: 25.0050 },
  "9001": { nos: "Talsi", lat: 57.2440, lng: 22.5860 },
  "6201": { nos: "Kuldīga", lat: 56.9680, lng: 21.9740 },
  "6401": { nos: "Liepāja", lat: 56.5050, lng: 21.0110 },
  "9801": { nos: "Ventspils", lat: 57.3940, lng: 21.5640 },
  "7401": { nos: "Ogre", lat: 56.8160, lng: 24.6030 },
  "9201": { nos: "Tukums", lat: 56.9670, lng: 23.1530 },
  "8401": { nos: "Saldus", lat: 56.6670, lng: 22.4940 },
  "9501": { nos: "Valka", lat: 57.7750, lng: 26.0130 },
  "8001": { nos: "Ādaži", lat: 57.0760, lng: 24.3220 },
  "8050": { nos: "Ikšķile", lat: 56.8330, lng: 24.4980 },
  "8130": { nos: "Sigulda", lat: 57.1530, lng: 24.8550 },
}

export function getKrautuveKoordinates(kadastra) {
  if (!kadastra) return null
  const tirs = kadastra.replace(/[\s\-]/g, "")
  const kods4 = tirs.substring(0, 4)
  if (PAGASTI[kods4]) {
    return { lat: PAGASTI[kods4].lat, lng: PAGASTI[kods4].lng, nosaukums: PAGASTI[kods4].nos, kods: kods4 }
  }
  const kods2 = tirs.substring(0, 2)
  const kandidati = Object.entries(PAGASTI).filter(([k]) => k.startsWith(kods2))
  if (kandidati.length > 0) {
    const [k, v] = kandidati[0]
    return { lat: v.lat, lng: v.lng, nosaukums: v.nos, kods: k }
  }
  return null
}