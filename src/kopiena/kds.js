// Tirgus Dizaina Sistēma — gaišā tēma
export const K = {
  // Foni
  bg:        '#F5F8F3',
  bgCard:    '#FFFFFF',
  bgInput:   '#F9FBF7',
  bgHover:   '#F0F5EC',
  bgActive:  '#E8F2E3',

  // Primārā zaļā
  primary:   '#3B6D11',
  primaryDk: '#2D540D',
  primaryLt: '#EDF5E8',
  primaryMd: '#5A9E2F',

  // Apmales
  border:    '#E2EDE0',
  borderMd:  '#C8DBBF',

  // Teksti
  text:      '#1A2415',
  textSec:   '#4A6340',
  textMut:   '#7A9370',
  textFade:  '#A8BEA0',

  // Statusa krāsas
  error:     '#C62828',
  errorBg:   '#FFF5F5',
  warn:      '#E65100',
  warnBg:    '#FFF8F0',
  info:      '#1565C0',
  infoBg:    '#F0F4FF',

  // Lomas badges
  lomas: {
    mežsaimnieks:  { bg: '#E8F5E2', color: '#2D6B11', border: '#A8D89A' },
    meža_ipasnieks:{ bg: '#FFFBE6', color: '#8A6800', border: '#FFD966' },
    izstradatājs:  { bg: '#E8F0FE', color: '#1A56C9', border: '#93B4F5' },
    konsultants:   { bg: '#E8F0FE', color: '#1A56C9', border: '#93B4F5' },
    mednieks:      { bg: '#FFF3E8', color: '#A83A00', border: '#F5B393' },
    cits:          { bg: '#F5F5F5', color: '#5A5A5A', border: '#CCCCCC' },
  }
}

export const KF = {
  family: "'Inter', 'Segoe UI', Arial, sans-serif",
  xs:   '11px',
  sm:   '13px',
  base: '14px',
  md:   '15px',
  lg:   '16px',
  xl:   '20px',
  h3:   '18px',
  h2:   '22px',
  bold: 700,
  semi: 600,
  med:  500,
}

export const KR = {
  sm:   '6px',
  md:   '10px',
  lg:   '14px',
  xl:   '18px',
  full: '9999px',
}

export const LOMAS_NOSAUKUMI = {
  mežsaimnieks:   'Mežsaimnieks',
  meža_ipasnieks: 'Meža īpašnieks',
  izstradatājs:   'Mežizstrādātājs',
  konsultants:    'Konsultants',
  mednieks:       'Mednieks',
  cits:           'Cits',
}

export function getLomaStyle(loma) {
  return K.lomas[loma] || K.lomas.cits
}

export function laicinsAtspalsts(ts) {
  if (!ts) return ''
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 60)  return 'Tikko'
  if (diff < 3600) return `${Math.floor(diff / 60)} min.`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `${Math.floor(diff / 86400)} d`
  return new Date(ts).toLocaleDateString('lv-LV', { day: 'numeric', month: 'short' })
}

export function iniciāļi(vards) {
  if (!vards) return '?'
  return vards.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
