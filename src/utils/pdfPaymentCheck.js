import { supabase } from '../supabaseClient'

const FREE_EMAIL    = 'mezatirgus.info@gmail.com'
const MAP_PRICE     = 5.00
const PDF_PRICE     = 2.50
const BIZNESS_PLANS = ['business', 'business_sakuma', 'business_videjais', 'business_neierobezots']

export async function parbauditVaiMaksaPdf(lietotajs, pdfTips) {
  let email = lietotajs?.email || lietotajs?.epasts
  let uid   = lietotajs?.id

  if (!email || !uid) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!email) email = user?.email
    if (!uid)   uid   = user?.id
  }

  // a) Bezmaksas konts
  if (email === FREE_EMAIL) return { allowed: true }

  // b) Viesa maksājums (bez konta) — pārbauda sessionStorage merchant_ref
  //    Šeit jo drīzāk, jo guest users nekad nesasniedz c/d/e sadaļas
  if (!uid) {
    const guestInfo = (() => {
      try { return JSON.parse(sessionStorage.getItem('mt_pdf_payment') || 'null') } catch { return null }
    })()
    if (guestInfo?.isGuest && guestInfo?.merchantRef && guestInfo?.pdfTips === pdfTips) {
      const { data: guestPaid } = await supabase
        .from('pdf_payments')
        .select('id')
        .eq('merchant_ref', guestInfo.merchantRef)
        .eq('pdf_tips', pdfTips)
        .eq('apmaksats', true)
        .eq('izmantots', false)
        .maybeSingle()
      if (guestPaid) {
        supabase.from('pdf_payments').update({ izmantots: true }).eq('id', guestPaid.id).catch(() => {})
        sessionStorage.removeItem('mt_pdf_payment')
        return { allowed: true }
      }
    }
    // Nav konta un nav derīga viesa maksājuma
    if (pdfTips === 'MAP') return { allowed: false, price: MAP_PRICE, pdfTips }
    return { allowed: false, price: PDF_PRICE, pdfTips }
  }

  // c) Pārbauda vienreizējo PDF maksājumu (der gan MAP, gan parasti PDF)
  if (uid) {
    const { data: paid } = await supabase
      .from('pdf_payments')
      .select('id')
      .eq('user_id', uid)
      .eq('pdf_tips', pdfTips)
      .eq('apmaksats', true)
      .eq('izmantots', false)
      .gt('beidzas', new Date().toISOString())
      .maybeSingle()

    if (paid) {
      // Atzīmē kā izmantotu — katrs maksājums der vienam PDF
      supabase.from('pdf_payments').update({ izmantots: true }).eq('id', paid.id).catch(() => {})
      return { allowed: true }
    }
  }

  // d) MAP PDF — vienmēr 5€
  if (pdfTips === 'MAP') return { allowed: false, price: MAP_PRICE, pdfTips }

  // e) Pārējie PDF — pārbauda aktīvo Bizness abonementu
  if (uid) {
    const { data } = await supabase
      .from('subscriptions')
      .select('plan_id, status, current_period_end')
      .eq('user_id', uid)
      .in('plan_id', BIZNESS_PLANS)
      .eq('status', 'active')
      .maybeSingle()

    if (data) {
      const nav_beigusies = !data.current_period_end || new Date(data.current_period_end) > new Date()
      if (nav_beigusies) return { allowed: true }
    }
  }

  return { allowed: false, price: PDF_PRICE, pdfTips }
}
