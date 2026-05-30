import { useSubscription } from '../hooks/useSubscription'

/**
 * Parāda `children` ja lietotājam ir tiesības uz `feature`.
 * Citādi parāda `fallback` (pēc noklusējuma null).
 *
 * Lietošana:
 *   <FeatureGate feature="pdf" fallback={<button>PDF — €2.50</button>}>
 *     <button onClick={downloadPdf}>Lejupielādēt PDF</button>
 *   </FeatureGate>
 */
export function FeatureGate({ feature, fallback = null, children }) {
  const { can, loading } = useSubscription()
  if (loading) return null
  if (can(feature)) return children
  return fallback
}
