const TARIFI = [
  { km: 5,   cena: 5.73 },
  { km: 10,  cena: 6.05 },
  { km: 20,  cena: 6.37 },
  { km: 50,  cena: 7.43 },
  { km: 100, cena: 11.25 },
  { km: 150, cena: 16.45 },
  { km: 200, cena: 20.59 },
  { km: 250, cena: 24.94 },
  { km: 300, cena: 29.19 },
  { km: 350, cena: 31.47 },
]

export function getTransportsCena(km) {
  if (km <= 5) return TARIFI[0].cena
  if (km >= 350) return TARIFI[TARIFI.length - 1].cena
  for (let i = 0; i < TARIFI.length - 1; i++) {
    const a = TARIFI[i], b = TARIFI[i + 1]
    if (km >= a.km && km <= b.km) {
      const t = (km - a.km) / (b.km - a.km)
      return Math.round((a.cena + t * (b.cena - a.cena)) * 100) / 100
    }
  }
  return TARIFI[TARIFI.length - 1].cena
}

export function aprekinattalumu(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2)**2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return Math.round(R * c * 1.35)
}