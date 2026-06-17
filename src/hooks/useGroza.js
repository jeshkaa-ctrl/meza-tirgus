import { useState, useEffect, useCallback } from 'react'

const KEY = 'mt_groze'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function useGroza() {
  const [groze, setGroze] = useState(load)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(groze))
  }, [groze])

  const pievieno = useCallback((product) => {
    setGroze(prev => {
      const ex = prev.find(i => i.product.id === product.id)
      if (ex) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { product, qty: 1 }]
    })
  }, [])

  const nonem = useCallback((productId) => {
    setGroze(prev => prev.filter(i => i.product.id !== productId))
  }, [])

  const mainit = useCallback((productId, qty) => {
    if (qty < 1) { nonem(productId); return }
    setGroze(prev => prev.map(i => i.product.id === productId ? { ...i, qty } : i))
  }, [nonem])

  const notirit = useCallback(() => setGroze([]), [])

  const skaits    = groze.reduce((s, i) => s + i.qty, 0)
  const kopsumma  = groze.reduce((s, i) => s + i.qty * (i.product.price_sell || 0), 0)

  return { groze, pievieno, nonem, mainit, notirit, skaits, kopsumma }
}
