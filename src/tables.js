export const speciesPriority = ["Ba","A","M","B","E","P","Oz","Os","G"]

export const rotationAge = {
P:  {Ia:101, I:101, II:101, III:121},
E:  {Ia:81,  I:81,  II:81,  III:81},
B:  {Ia:71,  I:71,  II:71,  III:51},
A:  {Ia:41,  I:41,  II:41,  III:41},
Ba: {Ia:41,  I:41,  II:41,  III:41},
Bl: {Ia:41,  I:41,  II:41,  III:41},
M:  {Ia:71,  I:71,  II:71,  III:71},
Oz: {Ia:101, I:101, II:121, III:121},
Os: {Ia:81,  I:81,  II:81,  III:81},
G:  {Ia:81,  I:81,  II:81,  III:81}
}

export const minDiameter = {
P:  {Ia:39, I:35, II:31, III:30},
E:  {Ia:31, I:29, II:29, III:27},
B:  {Ia:31, I:27, II:25, III:25},
A:  {Ia:25, I:23, II:21, III:21},
Ba: {Ia:22, I:20, II:18, III:18},
Bl: {Ia:22, I:20, II:18, III:18},
M:  {Ia:24, I:22, II:20, III:20},
Oz: {Ia:35, I:33, II:31, III:31},
Os: {Ia:31, I:29, II:27, III:27},
G:  {Ia:28, I:26, II:24, III:24}
}

export const GminTable = {
12:  {P:13, E:11, B:8,  A:10, Oz:9,  Os:7},
13:  {P:14, E:12, B:9,  A:10, Oz:10, Os:8},
14:  {P:14, E:12, B:10, A:11, Oz:10, Os:8},
15:  {P:16, E:14, B:10, A:11, Oz:11, Os:9},
16:  {P:17, E:15, B:11, A:12, Oz:12, Os:10},
17:  {P:18, E:16, B:11, A:12, Oz:12, Os:10},
18:  {P:19, E:17, B:12, A:13, Oz:14, Os:11},
19:  {P:19, E:19, B:12, A:13, Oz:15, Os:13},
20:  {P:20, E:20, B:13, A:14, Oz:16, Os:13},
21:  {P:21, E:22, B:14, A:15, Oz:17, Os:14},
22:  {P:21, E:23, B:14, A:16, Oz:17, Os:14},
23:  {P:21, E:24, B:16, A:16, Oz:18, Os:14},
24:  {P:21, E:24, B:16, A:18, Oz:18, Os:14},
25:  {P:22, E:26, B:17, A:19, Oz:19, Os:15},
26:  {P:22, E:26, B:17, A:19, Oz:20, Os:15},
27:  {P:22, E:27, B:17, A:20, Oz:20, Os:15},
28:  {P:22, E:28, B:18, A:21, Oz:21, Os:16},
29:  {P:22, E:28, B:18, A:22, Oz:21, Os:16},
30:  {P:22, E:29, B:19, A:22, Oz:22, Os:16},
31:  {P:23, E:30, B:19, A:23, Oz:22, Os:16},
32:  {P:23, E:30, B:20, A:23, Oz:22, Os:16},
33:  {P:23, E:31, B:20, A:24, Oz:23, Os:16},
34:  {P:23, E:31, B:21, A:24, Oz:23, Os:16},
35:  {P:23, E:32, B:21, A:24, Oz:23, Os:16}
}
// Minimālais koku skaits atjaunošanai (MK noteikumi Nr.308, spēkā no 30.06.2022.)
// P: 2000 gab/ha, pārējās sugas: 1500 gab/ha
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