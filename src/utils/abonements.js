import { supabase } from '../supabaseClient'

export async function iegutAbonementa(userId) {
  if (!userId) return null
  const { data } = await supabase
    .from('lietotaju_abonementi')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data || null
}

export function varPiekluvet(sub, modulis) {
  if (!sub) return false
  const today = new Date()
  if (sub.pro_lidz && new Date(sub.pro_lidz) > today) return true
  switch (modulis) {
    case 'rokasgramata': return !!(sub.rokasgramata_lidz && new Date(sub.rokasgramata_lidz) > today)
    case 'meza_riki':    return !!(sub.meza_riki_lidz    && new Date(sub.meza_riki_lidz)    > today)
    case 'bizness':      return !!(sub.bizness_lidz      && new Date(sub.bizness_lidz)      > today)
    default:             return false
  }
}

export function diezCikDienas(sub, modulis) {
  if (!sub) return null
  const today = new Date()
  const lauks = modulis === 'rokasgramata' ? sub.rokasgramata_lidz
              : modulis === 'meza_riki'    ? sub.meza_riki_lidz
              : modulis === 'bizness'      ? sub.bizness_lidz
              : modulis === 'pro'          ? sub.pro_lidz
              : null
  if (!lauks) return null
  const diff = Math.ceil((new Date(lauks) - today) / 86400000)
  return diff > 0 ? diff : null
}

export function abonementsNosaukums(sub, modulis) {
  if (!sub) return null
  const today = new Date()
  if (sub.pro_lidz && new Date(sub.pro_lidz) > today) return 'pro'
  const tipsLauks = modulis === 'rokasgramata' ? 'rokasgramata_tips'
                  : modulis === 'meza_riki'    ? 'meza_riki_tips'
                  : modulis === 'bizness'      ? 'bizness_tips'
                  : null
  if (!tipsLauks || !varPiekluvet(sub, modulis)) return null
  return sub[tipsLauks] || 'aktīvs'
}
