// Design System — Meža Tirgus
// Centralizēti dizaina tokeni visai platformai

export const C = {
  // Foni
  bg:       '#080f08',
  bgCard:   '#111f11',
  bgInner:  '#1a2e1a',
  bgDeep:   '#040804',

  // Zaļie toņi
  green:    '#4caf50',
  greenDk:  '#225522',
  greenMd:  '#2e7d32',
  greenBdr: '#2d4a2d',
  greenBdrLt: '#3d6b3d',

  // Teksti
  text:     '#e8f5e9',
  textSec:  '#a8d8a8',
  textMut:  '#7ab87a',
  textDim:  '#557a55',
  textFade: '#3a5a3a',

  // Statusa krāsas
  error:    '#ef5350',
  errorBg:  '#1a0808',
  errorBdr: '#5a1a1a',
  warn:     '#ffa726',
  warnBg:   '#1a1208',
  success:  '#66bb6a',
  info:     '#42a5f5',

  // Caurspīdīgums
  overlay:  'rgba(0,0,0,0.7)',
  glass:    'rgba(17,31,17,0.9)',
}

export const F = {
  family: "'Inter', 'Segoe UI', Arial, sans-serif",
  xs:   '11px',
  sm:   '13px',
  base: '14px',
  md:   '15px',
  lg:   '16px',
  xl:   '20px',
  h3:   '18px',
  h2:   '22px',
  h1:   '28px',
  weightNormal: 400,
  weightMed:    500,
  weightBold:   700,
  weightBlack:  800,
  lineHeight:   1.6,
}

export const R = {
  sm:   '6px',
  md:   '8px',
  lg:   '12px',
  xl:   '16px',
  full: '9999px',
}

export const S = {
  xs:  '4px',
  sm:  '8px',
  md:  '12px',
  lg:  '16px',
  xl:  '24px',
  xxl: '32px',
  section: '40px',
}

// Poga stili
export const btn = {
  primary: {
    background: C.greenDk,
    color: '#fff',
    border: `1px solid ${C.green}`,
    borderRadius: R.md,
    padding: '10px 20px',
    fontSize: F.base,
    fontWeight: F.weightBold,
    cursor: 'pointer',
    fontFamily: F.family,
    minHeight: '44px',
    transition: 'all 0.15s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: S.sm,
    whiteSpace: 'nowrap',
  },
  secondary: {
    background: 'transparent',
    color: C.textSec,
    border: `1px solid ${C.greenBdr}`,
    borderRadius: R.md,
    padding: '10px 20px',
    fontSize: F.base,
    fontWeight: F.weightMed,
    cursor: 'pointer',
    fontFamily: F.family,
    minHeight: '44px',
    transition: 'all 0.15s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: S.sm,
    whiteSpace: 'nowrap',
  },
  danger: {
    background: 'transparent',
    color: C.error,
    border: `1px solid ${C.error}44`,
    borderRadius: R.md,
    padding: '10px 20px',
    fontSize: F.base,
    fontWeight: F.weightMed,
    cursor: 'pointer',
    fontFamily: F.family,
    minHeight: '44px',
    transition: 'all 0.15s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: S.sm,
  },
  ghost: {
    background: 'transparent',
    color: C.textMut,
    border: 'none',
    borderRadius: R.md,
    padding: '10px 16px',
    fontSize: F.base,
    fontWeight: F.weightMed,
    cursor: 'pointer',
    fontFamily: F.family,
    minHeight: '44px',
  },
  small: {
    background: C.bgInner,
    color: C.textSec,
    border: `1px solid ${C.greenBdr}`,
    borderRadius: R.sm,
    padding: '6px 12px',
    fontSize: F.sm,
    fontWeight: F.weightMed,
    cursor: 'pointer',
    fontFamily: F.family,
    minHeight: '32px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
}

// Karte
export const card = {
  base: {
    background: C.bgCard,
    border: `1px solid ${C.greenBdr}`,
    borderRadius: R.lg,
    padding: S.lg,
  },
  elevated: {
    background: C.bgCard,
    border: `1px solid ${C.greenBdrLt}`,
    borderRadius: R.lg,
    padding: S.xl,
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
  },
}

// Input lauks
export const input = {
  base: {
    background: C.bg,
    color: C.text,
    border: `1px solid ${C.greenBdr}`,
    borderRadius: R.md,
    padding: '10px 14px',
    fontSize: F.base,
    fontFamily: F.family,
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    minHeight: '44px',
    lineHeight: F.lineHeight,
  },
}

// Badge
export const badge = {
  green:  { background: `${C.green}22`, color: C.green,   border: `1px solid ${C.green}44`,   borderRadius: R.full, padding: '2px 8px', fontSize: F.xs, fontWeight: F.weightBold },
  blue:   { background: '#42a5f522',    color: '#42a5f5', border: '1px solid #42a5f544',        borderRadius: R.full, padding: '2px 8px', fontSize: F.xs, fontWeight: F.weightBold },
  orange: { background: '#ffa72622',    color: '#ffa726', border: '1px solid #ffa72644',        borderRadius: R.full, padding: '2px 8px', fontSize: F.xs, fontWeight: F.weightBold },
  red:    { background: '#ef535022',    color: '#ef5350', border: '1px solid #ef535044',        borderRadius: R.full, padding: '2px 8px', fontSize: F.xs, fontWeight: F.weightBold },
}

// Loading spinner CSS (injectēt kā <style> tagu)
export const spinnerCSS = `
@keyframes mt-spin { to { transform: rotate(360deg); } }
@keyframes mt-pulse { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
@keyframes mt-fade-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
.mt-spin { animation: mt-spin 0.8s linear infinite; }
.mt-fade { animation: mt-fade-in 0.2s ease; }
`
