// Shapefile + ZIP ģenerators — tīrs browser kods, bez bibliotēkām
// Ģenerē .zip ar .shp .shx .dbf .prj failiem (WGS84, viena poligona)

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[i] = c
  }
  return t
})()

function crc32(data) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

function u16le(dv, o, v) { dv.setUint16(o, v, true) }
function u32le(dv, o, v) { dv.setUint32(o, v, true) }
function u32be(dv, o, v) { dv.setUint32(o, v, false) }
function f64le(dv, o, v) { dv.setFloat64(o, v, true) }

// SHP — poligons (Shape Type 5)
function buildShp(ring) {
  const n = ring.length
  let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity
  ring.forEach(([x, y]) => {
    if (x < xmin) xmin = x; if (x > xmax) xmax = x
    if (y < ymin) ymin = y; if (y > ymax) ymax = y
  })

  const contentBytes = 4 + 32 + 4 + 4 + 4 + n * 16
  const totalBytes   = 100 + 8 + contentBytes
  const dv = new DataView(new ArrayBuffer(totalBytes))

  // Faila galvene
  u32be(dv, 0, 9994)
  u32be(dv, 24, totalBytes / 2)
  u32le(dv, 28, 1000)
  u32le(dv, 32, 5)
  f64le(dv, 36, xmin); f64le(dv, 44, ymin); f64le(dv, 52, xmax); f64le(dv, 60, ymax)

  // Ieraksta galvene
  u32be(dv, 100, 1)
  u32be(dv, 104, contentBytes / 2)

  // Poligona saturs
  let off = 108
  u32le(dv, off, 5);  off += 4
  f64le(dv, off, xmin); off += 8; f64le(dv, off, ymin); off += 8
  f64le(dv, off, xmax); off += 8; f64le(dv, off, ymax); off += 8
  u32le(dv, off, 1);  off += 4  // 1 part
  u32le(dv, off, n);  off += 4  // n points
  u32le(dv, off, 0);  off += 4  // part[0] = 0
  ring.forEach(([x, y]) => {
    f64le(dv, off, x); off += 8
    f64le(dv, off, y); off += 8
  })

  return { bytes: new Uint8Array(dv.buffer), xmin, xmax, ymin, ymax, contentBytes }
}

// SHX — indekss
function buildShx(contentBytes, xmin, xmax, ymin, ymax) {
  const dv = new DataView(new ArrayBuffer(108))
  u32be(dv, 0, 9994)
  u32be(dv, 24, 54)      // 108 baiti / 2 = 54 vārdi
  u32le(dv, 28, 1000)
  u32le(dv, 32, 5)
  f64le(dv, 36, xmin); f64le(dv, 44, ymin); f64le(dv, 52, xmax); f64le(dv, 60, ymax)
  u32be(dv, 100, 50)             // ieraksta nobīde: 100 baiti / 2 = 50 vārdi
  u32be(dv, 104, contentBytes / 2)
  return new Uint8Array(dv.buffer)
}

// DBF — minimāls (lauks NR)
function buildDbf(nrText) {
  const fieldLen  = 20
  const recSize   = 1 + fieldLen
  const hdrSize   = 32 + 32 + 1   // galvene + 1 lauks + terminator
  const enc       = new TextEncoder()
  const buf       = new Uint8Array(hdrSize + recSize)
  const dv        = new DataView(buf.buffer)
  const now       = new Date()

  buf[0] = 3
  buf[1] = now.getFullYear() % 100; buf[2] = now.getMonth() + 1; buf[3] = now.getDate()
  u32le(dv, 4, 1)
  u16le(dv, 8, hdrSize); u16le(dv, 10, recSize)

  // Lauka apraksts (NR, Character)
  buf.set(enc.encode('NR'), 32)
  buf[32 + 11] = 67   // 'C' = Character
  buf[32 + 16] = fieldLen

  buf[64] = 0x0D  // terminator

  // Ieraksts
  buf[65] = 0x20  // aktīvs ieraksts
  const val = String(nrText).slice(0, fieldLen)
  buf.set(enc.encode(val.padEnd(fieldLen, ' ')), 66)

  return buf
}

const PRJ = 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]'

// Minimāls ZIP (store, bez kompresijas)
function createZip(files) {
  const enc      = new TextEncoder()
  const locals   = []
  const centrals = []
  let localOff   = 0

  for (const { name, data } of files) {
    const nameB = enc.encode(name)
    const crc   = crc32(data)
    const dlen  = data.length

    const loc = new Uint8Array(30 + nameB.length)
    const ldv = new DataView(loc.buffer)
    u32le(ldv, 0, 0x04034B50)
    u16le(ldv, 4, 20); u16le(ldv, 6, 0); u16le(ldv, 8, 0)
    u16le(ldv, 10, 0); u16le(ldv, 12, 0)
    u32le(ldv, 14, crc); u32le(ldv, 18, dlen); u32le(ldv, 22, dlen)
    u16le(ldv, 26, nameB.length); u16le(ldv, 28, 0)
    loc.set(nameB, 30)

    const cen = new Uint8Array(46 + nameB.length)
    const cdv = new DataView(cen.buffer)
    u32le(cdv, 0, 0x02014B50)
    u16le(cdv, 4, 20); u16le(cdv, 6, 20); u16le(cdv, 8, 0); u16le(cdv, 10, 0)
    u16le(cdv, 12, 0); u16le(cdv, 14, 0)
    u32le(cdv, 16, crc); u32le(cdv, 20, dlen); u32le(cdv, 24, dlen)
    u16le(cdv, 28, nameB.length); u16le(cdv, 30, 0); u16le(cdv, 32, 0)
    u16le(cdv, 34, 0); u16le(cdv, 36, 0); u32le(cdv, 38, 0); u32le(cdv, 42, localOff)
    cen.set(nameB, 46)

    locals.push(loc, data)
    centrals.push(cen)
    localOff += loc.length + dlen
  }

  const cenSize = centrals.reduce((s, c) => s + c.length, 0)
  const eocd = new Uint8Array(22)
  const edv  = new DataView(eocd.buffer)
  u32le(edv, 0, 0x06054B50)
  u16le(edv, 4, 0); u16le(edv, 6, 0)
  u16le(edv, 8, files.length); u16le(edv, 10, files.length)
  u32le(edv, 12, cenSize); u32le(edv, 16, localOff); u16le(edv, 20, 0)

  const parts  = [...locals, ...centrals, eocd]
  const total  = parts.reduce((s, p) => s + p.length, 0)
  const out    = new Uint8Array(total)
  let off      = 0
  parts.forEach(p => { out.set(p, off); off += p.length })
  return out
}

// Galvenā eksporta funkcija
export function downloadPolygonSHP(coords, nrText = '1') {
  // coords: [[lng, lat], ...] — atvērts gredzens
  const ring = [...coords, coords[0]]

  const { bytes: shpBytes, xmin, xmax, ymin, ymax, contentBytes } = buildShp(ring)
  const shxBytes = buildShx(contentBytes, xmin, xmax, ymin, ymax)
  const dbfBytes = buildDbf(nrText)
  const prjBytes = new TextEncoder().encode(PRJ)

  const safeName = ('nog_' + String(nrText).replace(/[^a-zA-Z0-9_-]/g, '_')) || 'nogabals'

  const zip = createZip([
    { name: safeName + '.shp', data: shpBytes },
    { name: safeName + '.shx', data: shxBytes },
    { name: safeName + '.dbf', data: dbfBytes },
    { name: safeName + '.prj', data: prjBytes },
  ])

  const url = URL.createObjectURL(new Blob([zip], { type: 'application/zip' }))
  const a   = Object.assign(document.createElement('a'), { href: url, download: safeName + '.zip' })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
