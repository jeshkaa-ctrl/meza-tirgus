/**
 * Platformas komisijas slīdošā skala — izsoles noslēgumā
 *
 *  ≤ 10 000 €  →  1.5%  (maks. 150 €)
 *  ≤ 50 000 €  →  1.0%  (maks. 500 €)
 *  > 50 000 €  →  0.5%  (maks. 1000 €)
 */
export function calcCommission(finalPrice) {
  let rate, amount

  if (finalPrice <= 10000) {
    rate   = 0.015
    amount = Math.min(finalPrice * rate, 150)
  } else if (finalPrice <= 50000) {
    rate   = 0.010
    amount = Math.min(finalPrice * rate, 500)
  } else {
    rate   = 0.005
    amount = Math.min(finalPrice * rate, 1000)
  }

  const rounded = Math.round(amount * 100) / 100
  return {
    finalPrice,
    rate,
    ratePercent:  (rate * 100).toFixed(1) + '%',
    amount:       rounded,
    label:        `Platformas komisija: €${rounded.toFixed(2)}`,
    sellerGets:   Math.round((finalPrice - rounded) * 100) / 100,
  }
}

// Piemēri:
// calcCommission(5000)   → { amount: 75,   rate: 0.015, sellerGets: 4925 }
// calcCommission(20000)  → { amount: 200,  rate: 0.010, sellerGets: 19800 }
// calcCommission(80000)  → { amount: 400,  rate: 0.005, sellerGets: 79600 }
// calcCommission(250000) → { amount: 1000, rate: 0.005, sellerGets: 249000 } ← griesti
