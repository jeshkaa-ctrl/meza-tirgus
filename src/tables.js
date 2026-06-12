export const speciesPriority = ["Ba","Bl","A","M","B","E","P","Oz","Os","G"]

// Minimālie cirtes vecumi (gadi) pēc MK noteikumiem par koku ciršanu mežā
export const rotationAge = {
  P:  {Ia:101, I:101, II:101, III:121, IV:131, V:141, Va:141},
  E:  {Ia:81,  I:81,  II:81,  III:81,  IV:101, V:121, Va:121},
  B:  {Ia:71,  I:71,  II:71,  III:71,  IV:71,  V:71,  Va:71},
  A:  {Ia:41,  I:41,  II:41,  III:41,  IV:41,  V:41,  Va:41},
  Ba: null,
  Bl: {Ia:71,  I:71,  II:71,  III:71,  IV:71,  V:71,  Va:71},
  M:  {Ia:71,  I:71,  II:71,  III:71,  IV:91,  V:91,  Va:91},
  Oz: {Ia:101, I:101, II:121, III:121, IV:141, V:141, Va:141},
  Os: {Ia:101, I:101, II:101, III:101, IV:101, V:121, Va:121},
  G:  {Ia:81,  I:81,  II:81,  III:101, IV:101, V:121, Va:121}
}

// Minimālie cirtes caurmēri (cm) pēc bonitātes
export const minDiameter = {
  P:  {Ia:39, I:35, II:31, III:30, IV:30, V:30,  Va:30},
  E:  {Ia:31, I:29, II:29, III:27, IV:27, V:27,  Va:27},
  B:  {Ia:31, I:27, II:25, III:25, IV:25, V:25,  Va:25},
  A:  {Ia:25, I:23, II:21, III:21, IV:21, V:21,  Va:21},
  Ba: {Ia:22, I:20, II:18, III:18, IV:18, V:18,  Va:18},
  Bl: {Ia:22, I:20, II:18, III:18, IV:18, V:18,  Va:18},
  M:  {Ia:24, I:22, II:20, III:20, IV:20, V:20,  Va:20},
  Oz: {Ia:35, I:33, II:31, III:31, IV:31, V:31,  Va:31},
  Os: {Ia:31, I:29, II:27, III:27, IV:27, V:27,  Va:27},
  G:  {Ia:28, I:26, II:24, III:24, IV:24, V:24,  Va:24}
}

export const GminTable = {
  12: {P:13, E:11, B:8,  A:10, Oz:9,  Os:7},
  13: {P:14, E:12, B:9,  A:10, Oz:10, Os:8},
  14: {P:14, E:12, B:10, A:11, Oz:10, Os:8},
  15: {P:16, E:14, B:10, A:11, Oz:11, Os:9},
  16: {P:17, E:15, B:11, A:12, Oz:12, Os:10},
  17: {P:18, E:16, B:11, A:12, Oz:12, Os:10},
  18: {P:19, E:17, B:12, A:13, Oz:14, Os:11},
  19: {P:19, E:19, B:12, A:13, Oz:15, Os:13},
  20: {P:20, E:20, B:13, A:14, Oz:16, Os:13},
  21: {P:21, E:22, B:14, A:15, Oz:17, Os:14},
  22: {P:21, E:23, B:14, A:16, Oz:17, Os:14},
  23: {P:21, E:24, B:16, A:16, Oz:18, Os:14},
  24: {P:21, E:24, B:16, A:18, Oz:18, Os:14},
  25: {P:22, E:26, B:17, A:19, Oz:19, Os:15},
  26: {P:22, E:26, B:17, A:19, Oz:20, Os:15},
  27: {P:22, E:27, B:17, A:20, Oz:20, Os:15},
  28: {P:22, E:28, B:18, A:21, Oz:21, Os:16},
  29: {P:22, E:28, B:18, A:22, Oz:21, Os:16},
  30: {P:22, E:29, B:19, A:22, Oz:22, Os:16},
  31: {P:23, E:30, B:19, A:23, Oz:22, Os:16},
  32: {P:23, E:30, B:20, A:23, Oz:22, Os:16},
  33: {P:23, E:31, B:20, A:24, Oz:23, Os:16},
  34: {P:23, E:31, B:21, A:24, Oz:23, Os:16},
  35: {P:23, E:32, B:21, A:24, Oz:23, Os:16}
}

// Kritiskais šķērslaukums sanitārajai cirtei
export const GkritTable = {
  12: {P:7,  E:6,  B:4,  A:5,  Ba:5, Oz:5,  Os:4},
  13: {P:8,  E:6,  B:5,  A:6,  Ba:6, Oz:5,  Os:4},
  14: {P:8,  E:7,  B:5,  A:6,  Ba:6, Oz:6,  Os:5},
  15: {P:8,  E:7,  B:5,  A:6,  Ba:6, Oz:6,  Os:5},
  16: {P:8,  E:7,  B:6,  A:6,  Ba:6, Oz:6,  Os:5},
  17: {P:8,  E:8,  B:6,  A:7,  Ba:7, Oz:6,  Os:6},
  18: {P:8,  E:8,  B:6,  A:7,  Ba:7, Oz:7,  Os:6},
  19: {P:8,  E:8,  B:6,  A:7,  Ba:7, Oz:7,  Os:6},
  20: {P:9,  E:8,  B:6,  A:8,  Ba:8, Oz:7,  Os:6},
  21: {P:9,  E:8,  B:7,  A:8,  Ba:8, Oz:7,  Os:6},
  22: {P:9,  E:9,  B:7,  A:8,  Ba:8, Oz:8,  Os:6},
  23: {P:9,  E:9,  B:7,  A:8,  Ba:8, Oz:8,  Os:6},
  24: {P:9,  E:9,  B:7,  A:9,  Ba:9, Oz:8,  Os:7},
  25: {P:9,  E:10, B:8,  A:9,  Ba:9, Oz:8,  Os:7},
  26: {P:9,  E:10, B:8,  A:9,  Ba:9, Oz:8,  Os:7},
  27: {P:9,  E:10, B:8,  A:10, Ba:10,Oz:9,  Os:7},
  28: {P:9,  E:10, B:8,  A:10, Ba:10,Oz:9,  Os:7},
  29: {P:9,  E:10, B:8,  A:10, Ba:10,Oz:9,  Os:7},
  30: {P:9,  E:10, B:8,  A:10, Ba:10,Oz:9,  Os:7},
  31: {P:9,  E:11, B:8,  A:10, Ba:10,Oz:9,  Os:7},
  32: {P:9,  E:11, B:9,  A:10, Ba:10,Oz:9,  Os:7},
  33: {P:10, E:11, B:9,  A:11, Ba:11,Oz:10, Os:7},
  34: {P:10, E:11, B:9,  A:11, Ba:11,Oz:10, Os:7},
  35: {P:10, E:11, B:9,  A:11, Ba:11,Oz:10, Os:7},
}

// Minimālais atjaunošanas koku skaits (gab/ha) — MK Nr.308 (30.06.2022.)
export const normalTreeCount = {
  P:    2000,
  E:    1500,
  B:    1500,
  liepa:1500,
  A:    1500,
  Ba:   1500,
  Bl:   1500,
  M:    1500,
  Oz:   1500,
  Os:   1500,
  G:    1500,
}

// MK noteikumi Nr.228 — Veidaugstumu tabula (V = G × veidaugstums × ha)
// Kolonnas: P=priede, E=egle, Oz=ozols, Os=osis, B=bērzs, Bl=melnalksnis, A=apse, Ba=baltalksnis
// Liepa (VMD kods 11) → Ba vērtības (tuvākā suga)
export const veidaugstumi = {
  9:  { P:5.26, E:5.62, Oz:4.63, Os:5.25, B:4.75, Bl:4.95, A:4.9,  Ba:5.09 },
  10: { P:5.71, E:6.09, Oz:5.04, Os:5.7,  B:5.14, Bl:5.36, A:5.29, Ba:5.41 },
  11: { P:6.14, E:6.55, Oz:5.45, Os:6.13, B:5.53, Bl:5.78, A:5.71, Ba:5.74 },
  12: { P:6.54, E:7.05, Oz:5.87, Os:6.55, B:5.92, Bl:6.2,  A:6.15, Ba:6.15 },
  13: { P:6.96, E:7.39, Oz:6.28, Os:6.97, B:6.31, Bl:6.62, A:6.59, Ba:6.52 },
  14: { P:7.34, E:7.87, Oz:6.69, Os:7.39, B:6.7,  Bl:7.05, A:7.03, Ba:6.92 },
  15: { P:7.69, E:8.27, Oz:7.1,  Os:7.8,  B:7.1,  Bl:7.48, A:7.48, Ba:7.29 },
  16: { P:8.07, E:8.75, Oz:7.52, Os:8.2,  B:7.49, Bl:7.9,  A:7.91, Ba:7.61 },
  17: { P:8.44, E:9.12, Oz:7.93, Os:8.6,  B:7.88, Bl:8.34, A:8.35, Ba:7.97 },
  18: { P:8.81, E:9.49, Oz:8.35, Os:9.0,  B:8.28, Bl:8.74, A:8.8,  Ba:8.37 },
  19: { P:9.14, E:9.85, Oz:8.78, Os:9.4,  B:8.68, Bl:9.15, A:9.24, Ba:8.73 },
  20: { P:9.5,  E:10.2, Oz:9.2,  Os:9.79, B:9.09, Bl:9.6,  A:9.69, Ba:8.98 },
  21: { P:9.85, E:10.54,Oz:9.62, Os:10.19,B:9.49, Bl:10.05,A:10.14,Ba:9.38 },
  22: { P:10.25,E:10.76,Oz:10.06,Os:10.58,B:9.9,  Bl:10.51,A:10.59,Ba:9.74 },
  23: { P:10.61,E:10.95,Oz:10.49,Os:10.96,B:10.32,Bl:10.96,A:11.04,Ba:10.14},
  24: { P:11.0, E:11.39,Oz:10.92,Os:11.35,B:10.73,Bl:11.42,A:11.5, Ba:10.49},
  25: { P:11.4, E:11.83,Oz:11.37,Os:11.74,B:11.16,Bl:11.9, A:11.95,Ba:10.89},
  26: { P:11.8, E:12.14,Oz:11.81,Os:12.12,B:11.58,Bl:12.36,A:12.41,Ba:11.26},
  27: { P:12.15,E:12.57,Oz:12.26,Os:12.5, B:12.01,Bl:12.84,A:12.86,Ba:11.65},
  28: { P:12.55,E:13.01,Oz:12.72,Os:12.89,B:12.44,Bl:13.32,A:13.32,Ba:12.0 },
  29: { P:12.9, E:13.45,Oz:13.18,Os:13.27,B:12.88,Bl:13.8, A:13.78,Ba:12.35},
  30: { P:13.28,E:13.8, Oz:13.63,Os:13.65,B:13.3, Bl:14.27,A:14.24,Ba:12.72},
  31: { P:13.66,E:14.15,Oz:14.07,Os:14.03,B:13.72,Bl:14.74,A:14.69,Ba:13.1 },
  32: { P:14.04,E:14.49,Oz:14.52,Os:14.41,B:14.15,Bl:15.21,A:15.15,Ba:13.48},
  33: { P:14.42,E:14.83,Oz:14.96,Os:14.79,B:14.57,Bl:15.68,A:15.61,Ba:13.85},
  34: { P:14.8, E:15.17,Oz:15.41,Os:15.16,B:15.0, Bl:16.15,A:16.07,Ba:14.23},
  35: { P:15.18,E:15.51,Oz:15.85,Os:15.54,B:15.42,Bl:16.62,A:16.52,Ba:14.61},
  36: { P:15.56,E:15.85 },
  37: { P:15.94,E:16.19 },
  38: { P:16.32,E:16.52 },
  39: { P:16.7, E:16.86 },
  40: { P:17.08,E:17.19 },
}

// Veidaugstuma uzmeklēšana pēc augstuma un sugas koda
// Ja konkrētai sugai nav tabulas vērtības — izmanto G × H × formFactor (atgriežot veidaugstumu)
export function getVeidaugstums(h, kods) {
  if (!h || h <= 0) return 0
  const hInt = Math.max(9, Math.min(40, Math.round(h)))
  // Meklē tabulā; ja augstāk par 35m un nav vērtības — izmanto H=35 vērtību
  const row = veidaugstumi[hInt]
    ?? veidaugstumi[35]
    ?? {}
  return row[kods] ?? (h * (formFactor[kods] ?? 0.45))
}

// Vidējie veidakstumi pa sugām (rezerves vērtības kad augstums nav zināms)
export const formFactor = {
  P:  0.45,
  E:  0.48,
  B:  0.52,
  A:  0.42,
  Ba: 0.38,
  Bl: 0.38,
  M:  0.46,
  Oz: 0.52,
  Os: 0.50,
  G:  0.52
}
