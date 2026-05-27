// Latvijas pagastu kadastra kodi un centru koordinātes
// Kadastra numura pirmie 4 cipari = pagasta/pilsētas kods
// Koordinātes ir pagasta/pilsētas aptuvenie centri (precizitāte +/-10km)

export const PAGASTI = {
  // ── RĪGA UN RĪGAS APKĀRTNE ──────────────────────────────────────────
  "0100": { nos: "Rīga",                    lat: 56.9460, lng: 24.1059 },
  "8001": { nos: "Ādažu nov.",              lat: 57.0760, lng: 24.3220 },
  "8002": { nos: "Ādaži",                   lat: 57.0760, lng: 24.3220 },
  "8010": { nos: "Babītes pag.",            lat: 56.9200, lng: 23.9200 },
  "8011": { nos: "Salas pag.",              lat: 56.8800, lng: 24.0500 },
  "8012": { nos: "Piņķu pag.",              lat: 56.9500, lng: 23.9700 },
  "8013": { nos: "Babītes nov.",            lat: 56.9300, lng: 23.9400 },
  "8020": { nos: "Baldones nov.",           lat: 56.7400, lng: 24.3900 },
  "8021": { nos: "Baldone",                 lat: 56.7400, lng: 24.3900 },
  "8022": { nos: "Baldones pag.",           lat: 56.7300, lng: 24.4100 },
  "8030": { nos: "Carnikavas nov.",         lat: 57.1040, lng: 24.2230 },
  "8031": { nos: "Carnikava",              lat: 57.1040, lng: 24.2230 },
  "8040": { nos: "Garkalnes nov.",          lat: 57.0200, lng: 24.2800 },
  "8041": { nos: "Garkalne",               lat: 57.0200, lng: 24.2800 },
  "8042": { nos: "Garkalnes pag.",          lat: 57.0200, lng: 24.2800 },
  "8050": { nos: "Ikšķiles nov.",           lat: 56.8330, lng: 24.4980 },
  "8051": { nos: "Ikšķile",                lat: 56.8330, lng: 24.4980 },
  "8052": { nos: "Tīnūžu pag.",            lat: 56.8200, lng: 24.5100 },
  "8060": { nos: "Inčukalna nov.",          lat: 57.0880, lng: 24.6900 },
  "8061": { nos: "Inčukalns",              lat: 57.0880, lng: 24.6900 },
  "8062": { nos: "Inčukalna pag.",          lat: 57.0880, lng: 24.6900 },
  "8063": { nos: "Vangaži",                lat: 57.0910, lng: 24.5250 },
  "8070": { nos: "Ķekavas nov.",            lat: 56.8300, lng: 24.2200 },
  "8071": { nos: "Ķekava",                 lat: 56.8300, lng: 24.2200 },
  "8072": { nos: "Ķekavas pag.",            lat: 56.8100, lng: 24.2300 },
  "8073": { nos: "Daugmales pag.",          lat: 56.7800, lng: 24.3100 },
  "8080": { nos: "Mārupes nov.",            lat: 56.9000, lng: 24.0500 },
  "8081": { nos: "Mārupe",                 lat: 56.9000, lng: 24.0500 },
  "8082": { nos: "Mārupes pag.",            lat: 56.8900, lng: 24.0600 },
  "8090": { nos: "Olaines nov.",            lat: 56.7900, lng: 24.0200 },
  "8091": { nos: "Olaine",                 lat: 56.7900, lng: 24.0200 },
  "8092": { nos: "Olaines pag.",            lat: 56.7700, lng: 24.0400 },
  "8100": { nos: "Ropažu nov.",             lat: 56.9800, lng: 24.6200 },
  "8101": { nos: "Ropaži",                 lat: 56.9800, lng: 24.6200 },
  "8102": { nos: "Ropažu pag.",             lat: 56.9800, lng: 24.6200 },
  "8103": { nos: "Stopiņu pag.",            lat: 56.9200, lng: 24.3500 },
  "8110": { nos: "Salaspils nov.",          lat: 56.8600, lng: 24.3500 },
  "8111": { nos: "Salaspils",              lat: 56.8600, lng: 24.3500 },
  "8112": { nos: "Salaspils pag.",          lat: 56.8600, lng: 24.3500 },
  "8120": { nos: "Saulkrastu nov.",         lat: 57.2600, lng: 24.4100 },
  "8121": { nos: "Saulkrasti",             lat: 57.2600, lng: 24.4100 },
  "8122": { nos: "Saulkrastu pag.",         lat: 57.2500, lng: 24.3800 },
  "8130": { nos: "Siguldas nov.",           lat: 57.1530, lng: 24.8550 },
  "8131": { nos: "Sigulda",                lat: 57.1530, lng: 24.8550 },
  "8132": { nos: "Siguldas pag.",           lat: 57.1300, lng: 24.8800 },
  "8133": { nos: "Allažu pag.",             lat: 57.1800, lng: 24.9500 },
  "8134": { nos: "Mālpils pag.",            lat: 57.0100, lng: 24.9400 },
  "8135": { nos: "Mores pag.",              lat: 57.0600, lng: 25.0100 },

  // ── VIDZEME ──────────────────────────────────────────────────────────
  // Valmieras novads
  "9601": { nos: "Valmiera",               lat: 57.5413, lng: 25.4260 },
  "9621": { nos: "Beverīnas pag.",          lat: 57.5000, lng: 25.6000 },
  "9622": { nos: "Brenguļu pag.",           lat: 57.4300, lng: 25.5200 },
  "9623": { nos: "Kauguru pag.",            lat: 57.4700, lng: 25.3900 },
  "9624": { nos: "Dikļu pag.",              lat: 57.5500, lng: 25.2200 },
  "9625": { nos: "Ēveles pag.",             lat: 57.5200, lng: 25.1800 },
  "9626": { nos: "Jeru pag.",               lat: 57.4500, lng: 25.6500 },
  "9627": { nos: "Kocēnu pag.",             lat: 57.5200, lng: 25.3400 },
  "9628": { nos: "Lodes pag.",              lat: 57.5800, lng: 25.5400 },
  "9629": { nos: "Mazsalacas pag.",         lat: 57.8600, lng: 25.0500 },
  "9630": { nos: "Naukšēnu pag.",           lat: 57.9200, lng: 25.2000 },
  "9631": { nos: "Burtnieku pag.",          lat: 57.6900, lng: 25.2700 },
  "9632": { nos: "Matīšu pag.",             lat: 57.6200, lng: 25.5700 },
  "9633": { nos: "Rūjienas pag.",           lat: 57.8900, lng: 25.3300 },
  "9634": { nos: "Rūjiena",                lat: 57.8900, lng: 25.3300 },
  "9635": { nos: "Sēļu pag.",               lat: 57.5200, lng: 25.1800 },
  "9636": { nos: "Skaņkalna pag.",          lat: 57.7200, lng: 25.4100 },
  "9637": { nos: "Trikātas pag.",           lat: 57.6600, lng: 25.6500 },
  "9638": { nos: "Vaidavas pag.",           lat: 57.5500, lng: 25.5500 },
  "9639": { nos: "Vilpulkas pag.",          lat: 57.7500, lng: 25.6000 },
  "9640": { nos: "Zilākalna pag.",          lat: 57.6000, lng: 25.4500 },
  "9641": { nos: "Mazsalaca",              lat: 57.8600, lng: 25.0500 },
  "9642": { nos: "Naukšēni",               lat: 57.9200, lng: 25.2000 },
  "9643": { nos: "Burtnieki",              lat: 57.6900, lng: 25.2700 },
  "9644": { nos: "Bērzaines pag.",          lat: 57.3700, lng: 25.2200 },
  "9645": { nos: "Ķoņu pag.",               lat: 57.8500, lng: 25.3800 },
  "9646": { nos: "Brenguļu pag.",           lat: 57.4300, lng: 25.5200 },
  "9647": { nos: "Ramatas pag.",            lat: 57.4800, lng: 25.7500 },
  "9648": { nos: "Valmiermuižas pag.",      lat: 57.5700, lng: 25.3800 },

  // Cēsu novads
  "4201": { nos: "Cēsis",                  lat: 57.3120, lng: 25.2770 },
  "4211": { nos: "Amatas pag.",             lat: 57.1800, lng: 25.2500 },
  "4212": { nos: "Drabešu pag.",            lat: 57.2500, lng: 25.1000 },
  "4213": { nos: "Ieriķu pag.",             lat: 57.2800, lng: 25.0300 },
  "4214": { nos: "Jaunpiebalgas pag.",      lat: 57.1500, lng: 25.8700 },
  "4215": { nos: "Līgatnes pag.",           lat: 57.2400, lng: 25.0500 },
  "4216": { nos: "Nītaures pag.",           lat: 57.0800, lng: 25.1700 },
  "4217": { nos: "Priekuļu pag.",           lat: 57.3200, lng: 25.3900 },
  "4218": { nos: "Raiskuma pag.",           lat: 57.3500, lng: 25.1500 },
  "4219": { nos: "Skujenes pag.",           lat: 57.1200, lng: 25.0400 },
  "4220": { nos: "Stalbes pag.",            lat: 57.4000, lng: 25.1500 },
  "4221": { nos: "Straupes pag.",           lat: 57.3800, lng: 25.0500 },
  "4222": { nos: "Vaives pag.",             lat: 57.2800, lng: 25.3000 },
  "4223": { nos: "Vecpiebalgas pag.",       lat: 57.0600, lng: 25.8100 },
  "4224": { nos: "Zaubes pag.",             lat: 57.1500, lng: 25.0000 },

  // Smiltenes novads
  "9401": { nos: "Smiltene",               lat: 57.4230, lng: 25.9020 },
  "9411": { nos: "Variņu pag.",             lat: 57.4800, lng: 25.7500 },
  "9412": { nos: "Launkalnes pag.",         lat: 57.3400, lng: 25.8700 },
  "9413": { nos: "Palsmanes pag.",          lat: 57.4500, lng: 26.1200 },
  "9414": { nos: "Raņķu pag.",              lat: 57.5000, lng: 26.0500 },
  "9415": { nos: "Smiltenes pag.",          lat: 57.4200, lng: 25.9500 },
  "9416": { nos: "Brantu pag.",             lat: 57.5200, lng: 25.8500 },
  "9417": { nos: "Bilskas pag.",            lat: 57.4500, lng: 26.1000 },
  "9418": { nos: "Blomes pag.",             lat: 57.5000, lng: 25.9800 },
  "9419": { nos: "Grundzāles pag.",         lat: 57.5500, lng: 26.1500 },

  // Alūksnes novads
  "3601": { nos: "Alūksne",                lat: 57.4240, lng: 27.0450 },
  "3611": { nos: "Alsviķu pag.",            lat: 57.3800, lng: 26.9500 },
  "3612": { nos: "Annas pag.",              lat: 57.5500, lng: 26.8500 },
  "3613": { nos: "Ilzenes pag.",            lat: 57.4500, lng: 26.7500 },
  "3614": { nos: "Jaunalūksnes pag.",       lat: 57.3500, lng: 27.1500 },
  "3615": { nos: "Jaunannas pag.",          lat: 57.6000, lng: 26.9000 },
  "3616": { nos: "Kalncempju pag.",         lat: 57.5000, lng: 27.2000 },
  "3617": { nos: "Liepnas pag.",            lat: 57.5500, lng: 27.3000 },
  "3618": { nos: "Malienas pag.",           lat: 57.4000, lng: 26.8500 },
  "3619": { nos: "Mālupes pag.",            lat: 57.2500, lng: 26.8000 },
  "3620": { nos: "Mārkalnes pag.",          lat: 57.3000, lng: 27.0500 },
  "3621": { nos: "Pededzes pag.",           lat: 57.5000, lng: 27.1500 },
  "3622": { nos: "Strīķu pag.",             lat: 57.4800, lng: 27.1000 },
  "3623": { nos: "Veclaicenes pag.",        lat: 57.6500, lng: 26.7500 },
  "3624": { nos: "Zeltiņu pag.",            lat: 57.3500, lng: 26.7000 },
  "3625": { nos: "Ziemera pag.",            lat: 57.6000, lng: 27.1500 },

  // Gulbenes novads
  "5001": { nos: "Gulbene",                lat: 57.1750, lng: 26.7510 },
  "5011": { nos: "Beļavas pag.",            lat: 57.1500, lng: 26.5000 },
  "5012": { nos: "Daukstu pag.",            lat: 57.0500, lng: 26.6000 },
  "5013": { nos: "Druvienas pag.",          lat: 57.2500, lng: 26.5500 },
  "5014": { nos: "Galgauskas pag.",         lat: 57.2000, lng: 26.5000 },
  "5015": { nos: "Jaungulbenes pag.",       lat: 57.1000, lng: 26.8500 },
  "5016": { nos: "Lejasciema pag.",         lat: 57.3000, lng: 26.5500 },
  "5017": { nos: "Litenes pag.",            lat: 57.1000, lng: 26.6000 },
  "5018": { nos: "Lizuma pag.",             lat: 57.2400, lng: 26.3600 },
  "5019": { nos: "Līgo pag.",               lat: 57.0500, lng: 26.5500 },
  "5020": { nos: "Rankas pag.",             lat: 57.2500, lng: 26.8000 },
  "5021": { nos: "Stāmerienas pag.",        lat: 57.1500, lng: 26.8500 },
  "5022": { nos: "Stradu pag.",             lat: 57.0800, lng: 26.7500 },
  "5023": { nos: "Tirzas pag.",             lat: 57.3000, lng: 26.7000 },

  // Madonas novads
  "7001": { nos: "Madona",                 lat: 56.8570, lng: 26.2240 },
  "7011": { nos: "Aronas pag.",             lat: 56.9000, lng: 26.1000 },
  "7012": { nos: "Barkavas pag.",           lat: 56.7000, lng: 26.5000 },
  "7013": { nos: "Bērzaunes pag.",          lat: 56.8100, lng: 26.0300 },
  "7014": { nos: "Dzelzavas pag.",          lat: 56.9500, lng: 26.4000 },
  "7015": { nos: "Ērgļu pag.",              lat: 56.9000, lng: 25.6500 },
  "7016": { nos: "Indrānu pag.",            lat: 56.8000, lng: 26.4000 },
  "7017": { nos: "Jaunbebru pag.",          lat: 56.7500, lng: 26.1500 },
  "7018": { nos: "Kalsnavas pag.",          lat: 56.6800, lng: 25.9500 },
  "7019": { nos: "Lazdonas pag.",           lat: 56.8500, lng: 26.3500 },
  "7020": { nos: "Liezēres pag.",           lat: 57.0000, lng: 26.0000 },
  "7021": { nos: "Ļaudonas pag.",           lat: 56.8000, lng: 26.5500 },
  "7022": { nos: "Mētrienas pag.",          lat: 56.7000, lng: 26.3000 },
  "7023": { nos: "Murmastienes pag.",       lat: 56.9500, lng: 26.2000 },
  "7024": { nos: "Ošupes pag.",             lat: 56.7500, lng: 26.6500 },
  "7025": { nos: "Praulienas pag.",         lat: 56.9000, lng: 26.3500 },
  "7026": { nos: "Sarkaņu pag.",            lat: 56.9200, lng: 26.3200 },
  "7027": { nos: "Vestienas pag.",          lat: 56.9500, lng: 25.8500 },
  "7028": { nos: "Varakļānu pag.",          lat: 56.6100, lng: 26.7200 },
  "7029": { nos: "Lubānas pag.",            lat: 56.9000, lng: 26.7000 },

  // Limbažu novads
  "6601": { nos: "Limbaži",                lat: 57.5130, lng: 24.7130 },
  "6611": { nos: "Ainažu pag.",             lat: 57.8500, lng: 24.3600 },
  "6612": { nos: "Aloju pag.",              lat: 57.7700, lng: 24.8900 },
  "6613": { nos: "Braslavas pag.",          lat: 57.6500, lng: 24.8000 },
  "6614": { nos: "Limbažu pag.",            lat: 57.5200, lng: 24.7500 },
  "6615": { nos: "Salacgrīvas pag.",        lat: 57.7600, lng: 24.3500 },
  "6616": { nos: "Skultes pag.",            lat: 57.3400, lng: 24.4200 },
  "6617": { nos: "Umurgas pag.",            lat: 57.5000, lng: 24.8500 },
  "6618": { nos: "Viļķenes pag.",           lat: 57.5500, lng: 24.9500 },
  "6619": { nos: "Pāles pag.",              lat: 57.4500, lng: 24.9200 },

  // ── LATGALE ──────────────────────────────────────────────────────────
  // Rēzeknes novads
  "7801": { nos: "Rēzekne",                lat: 56.5013, lng: 27.3330 },
  "7811": { nos: "Audriņu pag.",            lat: 56.4500, lng: 27.4500 },
  "7812": { nos: "Čornajas pag.",           lat: 56.5500, lng: 27.5500 },
  "7813": { nos: "Dricānu pag.",            lat: 56.6000, lng: 27.2500 },
  "7814": { nos: "Feimaņu pag.",            lat: 56.4000, lng: 27.2000 },
  "7815": { nos: "Griškānu pag.",           lat: 56.5500, lng: 27.1500 },
  "7816": { nos: "Kaunatas pag.",           lat: 56.3500, lng: 27.3000 },
  "7817": { nos: "Lendžu pag.",             lat: 56.4500, lng: 27.6000 },
  "7818": { nos: "Maltas pag.",             lat: 56.3500, lng: 27.5000 },
  "7819": { nos: "Nautrēnu pag.",           lat: 56.6500, lng: 27.4000 },
  "7820": { nos: "Ozolaines pag.",          lat: 56.5000, lng: 27.2000 },
  "7821": { nos: "Pušas pag.",              lat: 56.2800, lng: 27.3500 },
  "7822": { nos: "Silmalas pag.",           lat: 56.3000, lng: 27.5500 },
  "7823": { nos: "Stoļerovas pag.",         lat: 56.4000, lng: 27.5500 },
  "7824": { nos: "Stružānu pag.",           lat: 56.7000, lng: 27.3000 },
  "7825": { nos: "Vērēmu pag.",             lat: 56.7500, lng: 27.5000 },

  // Preiļu novads
  "7601": { nos: "Preiļi",                 lat: 56.2990, lng: 26.7230 },
  "7611": { nos: "Aglonas pag.",            lat: 56.1500, lng: 27.0000 },
  "7612": { nos: "Aizkalnes pag.",          lat: 56.2500, lng: 26.5500 },
  "7613": { nos: "Pelēču pag.",             lat: 56.3500, lng: 26.5000 },
  "7614": { nos: "Preiļu pag.",             lat: 56.3000, lng: 26.7500 },
  "7615": { nos: "Riebiņu pag.",            lat: 56.3400, lng: 27.1100 },
  "7616": { nos: "Rušonas pag.",            lat: 56.2500, lng: 26.8500 },
  "7617": { nos: "Saunas pag.",             lat: 56.4000, lng: 26.6000 },
  "7618": { nos: "Vārkavas pag.",           lat: 56.2000, lng: 26.6000 },

  // Daugavpils novads
  "4401": { nos: "Daugavpils",             lat: 55.8747, lng: 26.5355 },
  "4411": { nos: "Ambeļu pag.",             lat: 55.9500, lng: 26.8000 },
  "4412": { nos: "Biķernieku pag.",         lat: 55.8500, lng: 26.3000 },
  "4413": { nos: "Demenes pag.",            lat: 55.9000, lng: 26.7000 },
  "4414": { nos: "Dubnas pag.",             lat: 55.7500, lng: 26.5000 },
  "4415": { nos: "Kalkūnes pag.",           lat: 55.9500, lng: 26.6500 },
  "4416": { nos: "Laucesas pag.",           lat: 55.8000, lng: 26.7500 },
  "4417": { nos: "Maļinovas pag.",          lat: 56.0000, lng: 26.9000 },
  "4418": { nos: "Medumu pag.",             lat: 55.9000, lng: 26.4000 },
  "4419": { nos: "Naujenes pag.",           lat: 55.8500, lng: 26.6000 },
  "4420": { nos: "Nīcgales pag.",           lat: 56.1500, lng: 26.2500 },
  "4421": { nos: "Salienas pag.",           lat: 55.7500, lng: 26.3000 },
  "4422": { nos: "Skrudalienas pag.",       lat: 55.8000, lng: 26.4000 },
  "4423": { nos: "Sventes pag.",            lat: 55.9500, lng: 26.5000 },
  "4424": { nos: "Tabores pag.",            lat: 55.8000, lng: 26.8500 },
  "4425": { nos: "Vecsalienas pag.",        lat: 55.7000, lng: 26.4500 },
  "4426": { nos: "Višķu pag.",              lat: 55.9000, lng: 26.5500 },

  // Jēkabpils novads
  "5601": { nos: "Jēkabpils",              lat: 56.4990, lng: 25.8790 },
  "5611": { nos: "Aknīstes pag.",           lat: 56.1600, lng: 25.7500 },
  "5612": { nos: "Atašienes pag.",          lat: 56.5000, lng: 26.0500 },
  "5613": { nos: "Dignājas pag.",           lat: 56.3500, lng: 26.1500 },
  "5614": { nos: "Dunava pag.",             lat: 56.4500, lng: 25.7000 },
  "5615": { nos: "Kalna pag.",              lat: 56.5500, lng: 26.1500 },
  "5616": { nos: "Krustpils pag.",          lat: 56.5300, lng: 25.8500 },
  "5617": { nos: "Leimaņu pag.",            lat: 56.5500, lng: 25.6000 },
  "5618": { nos: "Rubenes pag.",            lat: 56.4000, lng: 25.9000 },
  "5619": { nos: "Salas pag.",              lat: 56.4500, lng: 25.6000 },
  "5620": { nos: "Sēlpils pag.",            lat: 56.5000, lng: 25.9500 },
  "5621": { nos: "Viesītes pag.",           lat: 56.3500, lng: 25.5500 },

  // Ludzas novads
  "6801": { nos: "Ludza",                  lat: 56.5440, lng: 27.7200 },
  "6811": { nos: "Briģu pag.",              lat: 56.5000, lng: 27.8500 },
  "6812": { nos: "Cirmas pag.",             lat: 56.6000, lng: 27.7500 },
  "6813": { nos: "Istras pag.",             lat: 56.4000, lng: 27.9500 },
  "6814": { nos: "Isnaudas pag.",           lat: 56.6500, lng: 27.8500 },
  "6815": { nos: "Kārsavas pag.",           lat: 56.7800, lng: 27.6700 },
  "6816": { nos: "Nirzas pag.",             lat: 56.4500, lng: 27.8000 },
  "6817": { nos: "Ņukšu pag.",              lat: 56.3500, lng: 27.7500 },
  "6818": { nos: "Pildas pag.",             lat: 56.7500, lng: 28.0000 },
  "6819": { nos: "Rundēnu pag.",            lat: 56.5500, lng: 27.5500 },
  "6820": { nos: "Zilupes pag.",            lat: 56.3800, lng: 28.1200 },

  // Balvu novads
  "3801": { nos: "Balvi",                  lat: 57.1310, lng: 27.2640 },
  "3811": { nos: "Baltinavas pag.",         lat: 57.1000, lng: 27.6000 },
  "3812": { nos: "Bērzpils pag.",           lat: 57.1500, lng: 27.3500 },
  "3813": { nos: "Briežuciema pag.",        lat: 57.2500, lng: 27.1500 },
  "3814": { nos: "Kubulu pag.",             lat: 57.0500, lng: 27.2500 },
  "3815": { nos: "Lazdulejas pag.",         lat: 57.1500, lng: 27.5000 },
  "3816": { nos: "Rugāju pag.",             lat: 57.2500, lng: 27.4500 },
  "3817": { nos: "Šķilbēnu pag.",           lat: 57.1000, lng: 27.0500 },
  "3818": { nos: "Tilžas pag.",             lat: 57.2500, lng: 27.5500 },
  "3819": { nos: "Viļakas pag.",            lat: 57.1800, lng: 27.6700 },

  // ── ZEMGALE ──────────────────────────────────────────────────────────
  // Jelgavas novads
  "5401": { nos: "Jelgava",                lat: 56.6510, lng: 23.7130 },
  "5411": { nos: "Elejas pag.",             lat: 56.5500, lng: 23.6500 },
  "5412": { nos: "Glūdas pag.",             lat: 56.7000, lng: 23.7500 },
  "5413": { nos: "Jaunsvirlaukas pag.",     lat: 56.6000, lng: 23.9000 },
  "5414": { nos: "Kalnciema pag.",          lat: 56.8500, lng: 23.6800 },
  "5415": { nos: "Lielplatones pag.",       lat: 56.5000, lng: 23.6000 },
  "5416": { nos: "Līvbērzes pag.",          lat: 56.7500, lng: 23.5000 },
  "5417": { nos: "Platones pag.",           lat: 56.5500, lng: 23.5000 },
  "5418": { nos: "Sesavas pag.",            lat: 56.6000, lng: 23.8500 },
  "5419": { nos: "Svētes pag.",             lat: 56.7000, lng: 23.8500 },
  "5420": { nos: "Valgundes pag.",          lat: 56.6500, lng: 23.5000 },
  "5421": { nos: "Vircavas pag.",           lat: 56.5500, lng: 23.8000 },
  "5422": { nos: "Zaļenieku pag.",          lat: 56.5500, lng: 23.7000 },

  // Dobeles novads
  "4601": { nos: "Dobele",                 lat: 56.6250, lng: 23.2780 },
  "4611": { nos: "Annenieku pag.",          lat: 56.7000, lng: 23.2000 },
  "4612": { nos: "Auru pag.",               lat: 56.5500, lng: 23.1500 },
  "4613": { nos: "Bērzes pag.",             lat: 56.7500, lng: 23.4500 },
  "4614": { nos: "Bikstu pag.",             lat: 56.5000, lng: 23.2500 },
  "4615": { nos: "Dobeles pag.",            lat: 56.6000, lng: 23.3500 },
  "4616": { nos: "Jaunbērzes pag.",         lat: 56.6500, lng: 23.1500 },
  "4617": { nos: "Krimūnu pag.",            lat: 56.5000, lng: 23.4500 },
  "4618": { nos: "Naudītes pag.",           lat: 56.5500, lng: 23.5500 },
  "4619": { nos: "Penkules pag.",           lat: 56.5000, lng: 23.0000 },
  "4620": { nos: "Zebrenes pag.",           lat: 56.5500, lng: 23.0000 },

  // Bauskas novads
  "4001": { nos: "Bauska",                 lat: 56.4100, lng: 24.1900 },
  "4011": { nos: "Codes pag.",              lat: 56.4500, lng: 24.4000 },
  "4012": { nos: "Dāviņu pag.",             lat: 56.3000, lng: 24.2500 },
  "4013": { nos: "Gailīšu pag.",            lat: 56.4000, lng: 24.1000 },
  "4014": { nos: "Īslīces pag.",            lat: 56.4500, lng: 24.2000 },
  "4015": { nos: "Mežotnes pag.",           lat: 56.3500, lng: 24.0500 },
  "4016": { nos: "Rundāles pag.",           lat: 56.4000, lng: 24.0500 },
  "4017": { nos: "Svitenes pag.",           lat: 56.2500, lng: 24.3000 },
  "4018": { nos: "Vecsaules pag.",          lat: 56.3500, lng: 24.1500 },

  // Aizkraukles novads
  "3401": { nos: "Aizkraukle",             lat: 56.6010, lng: 25.0050 },
  "3411": { nos: "Aizkraukles pag.",        lat: 56.6200, lng: 25.0500 },
  "3412": { nos: "Kokneses pag.",           lat: 56.6500, lng: 25.4500 },
  "3413": { nos: "Neretas pag.",            lat: 56.2000, lng: 25.3000 },
  "3414": { nos: "Pļaviņu pag.",            lat: 56.6200, lng: 25.7000 },
  "3415": { nos: "Skrīveru pag.",           lat: 56.6700, lng: 25.1300 },
  "3416": { nos: "Vietalvas pag.",          lat: 56.7500, lng: 25.5500 },

  // ── KURZEME ──────────────────────────────────────────────────────────
  // Talsu novads
  "9001": { nos: "Talsi",                  lat: 57.2440, lng: 22.5860 },
  "9011": { nos: "Balgales pag.",           lat: 57.4000, lng: 22.7000 },
  "9012": { nos: "Ģibuļu pag.",             lat: 57.3000, lng: 22.4500 },
  "9013": { nos: "Ķūļciema pag.",           lat: 57.1500, lng: 22.7500 },
  "9014": { nos: "Laucienes pag.",          lat: 57.2000, lng: 22.7000 },
  "9015": { nos: "Lībagu pag.",             lat: 57.3000, lng: 22.8000 },
  "9016": { nos: "Lubes pag.",              lat: 57.4500, lng: 22.6500 },
  "9017": { nos: "Mērsraga pag.",           lat: 57.3600, lng: 23.1200 },
  "9018": { nos: "Rojas pag.",              lat: 57.5000, lng: 22.8000 },
  "9019": { nos: "Stendes pag.",            lat: 57.1500, lng: 22.5000 },
  "9020": { nos: "Strazdes pag.",           lat: 57.2500, lng: 22.5000 },
  "9021": { nos: "Valdgales pag.",          lat: 57.2000, lng: 22.3500 },
  "9022": { nos: "Virbu pag.",              lat: 57.1000, lng: 22.4000 },

  // Kuldīgas novads
  "6201": { nos: "Kuldīga",                lat: 56.9680, lng: 21.9740 },
  "6211": { nos: "Ēdoles pag.",             lat: 57.0500, lng: 21.8500 },
  "6212": { nos: "Gudenieku pag.",          lat: 56.8500, lng: 21.8000 },
  "6213": { nos: "Kurmāles pag.",           lat: 57.0000, lng: 21.7000 },
  "6214": { nos: "Laidu pag.",              lat: 56.8000, lng: 22.1500 },
  "6215": { nos: "Pelču pag.",              lat: 56.9000, lng: 22.1000 },
  "6216": { nos: "Rendas pag.",             lat: 57.0500, lng: 22.1500 },
  "6217": { nos: "Rumbas pag.",             lat: 57.0000, lng: 22.3000 },
  "6218": { nos: "Skrundas pag.",           lat: 56.6800, lng: 22.0200 },
  "6219": { nos: "Snēpeles pag.",           lat: 56.9500, lng: 21.8000 },
  "6220": { nos: "Turlavas pag.",           lat: 56.8000, lng: 21.9500 },

  // Liepājas novads
  "6401": { nos: "Liepāja",                lat: 56.5050, lng: 21.0110 },
  "6411": { nos: "Aizputes pag.",           lat: 56.7200, lng: 21.5900 },
  "6412": { nos: "Durbes pag.",             lat: 56.5800, lng: 21.3600 },
  "6413": { nos: "Grobiņas pag.",           lat: 56.5300, lng: 21.1700 },
  "6414": { nos: "Nīcas pag.",              lat: 56.3500, lng: 21.0500 },
  "6415": { nos: "Pāvilostas pag.",         lat: 56.8800, lng: 21.1800 },
  "6416": { nos: "Rucavas pag.",            lat: 56.1600, lng: 21.1600 },
  "6417": { nos: "Sakas pag.",              lat: 56.7500, lng: 21.3000 },
  "6418": { nos: "Vaiņodes pag.",           lat: 56.4000, lng: 21.8500 },

  // Ventspils novads
  "9801": { nos: "Ventspils",              lat: 57.3940, lng: 21.5640 },
  "9811": { nos: "Ances pag.",              lat: 57.4500, lng: 22.2500 },
  "9812": { nos: "Jūrkalnes pag.",          lat: 57.3000, lng: 21.6500 },
  "9813": { nos: "Piltenes pag.",           lat: 57.2200, lng: 21.6700 },
  "9814": { nos: "Popes pag.",              lat: 57.5000, lng: 22.0000 },
  "9815": { nos: "Puzes pag.",              lat: 57.3500, lng: 21.9500 },
  "9816": { nos: "Tārgales pag.",           lat: 57.4500, lng: 21.7500 },
  "9817": { nos: "Ugāles pag.",             lat: 57.3000, lng: 22.0500 },
  "9818": { nos: "Užavas pag.",             lat: 57.2500, lng: 21.6000 },
  "9819": { nos: "Ziras pag.",              lat: 57.2000, lng: 22.0500 },
  "9820": { nos: "Zlēku pag.",              lat: 57.3500, lng: 22.1500 },

  // ── PIERĪGA ──────────────────────────────────────────────────────────
  // Ogres novads
  "7401": { nos: "Ogre",                   lat: 56.8160, lng: 24.6030 },
  "7411": { nos: "Ķeipenes pag.",           lat: 56.9000, lng: 25.0000 },
  "7412": { nos: "Lauberes pag.",           lat: 56.8500, lng: 24.8000 },
  "7413": { nos: "Lielvārdes pag.",         lat: 56.7200, lng: 24.9700 },
  "7414": { nos: "Madlienas pag.",          lat: 56.9500, lng: 24.8500 },
  "7415": { nos: "Meņģeles pag.",           lat: 56.9500, lng: 24.7000 },
  "7416": { nos: "Ogresgala pag.",          lat: 56.8200, lng: 24.7000 },
  "7417": { nos: "Suntažu pag.",            lat: 56.9800, lng: 24.9500 },
  "7418": { nos: "Taurupes pag.",           lat: 56.9500, lng: 25.1500 },

  // Tukuma novads
  "9201": { nos: "Tukums",                 lat: 56.9670, lng: 23.1530 },
  "9211": { nos: "Degoles pag.",            lat: 56.9000, lng: 23.0500 },
  "9212": { nos: "Džūkstes pag.",           lat: 56.8000, lng: 23.0000 },
  "9213": { nos: "Engures pag.",            lat: 57.1500, lng: 23.2500 },
  "9214": { nos: "Irlavas pag.",            lat: 56.8500, lng: 22.9500 },
  "9215": { nos: "Jaunsātu pag.",           lat: 56.7500, lng: 23.1000 },
  "9216": { nos: "Kandavas pag.",           lat: 57.0300, lng: 22.7800 },
  "9217": { nos: "Lapmežciema pag.",        lat: 57.0800, lng: 23.4500 },
  "9218": { nos: "Lestenes pag.",           lat: 56.9000, lng: 22.9500 },
  "9219": { nos: "Pūres pag.",              lat: 57.0500, lng: 23.0500 },
  "9220": { nos: "Sēmes pag.",              lat: 57.2000, lng: 23.0500 },
  "9221": { nos: "Smārdes pag.",            lat: 57.1500, lng: 23.2500 },
  "9222": { nos: "Ķemeru pag.",             lat: 56.9500, lng: 23.4000 },

  // Saldus novads
  "8401": { nos: "Saldus",                 lat: 56.6670, lng: 22.4940 },
  "8411": { nos: "Blīdenes pag.",           lat: 56.7500, lng: 22.4500 },
  "8412": { nos: "Ezeres pag.",             lat: 56.6500, lng: 22.3000 },
  "8413": { nos: "Jaunlutriņu pag.",        lat: 56.7000, lng: 22.2000 },
  "8414": { nos: "Kursīšu pag.",            lat: 56.6000, lng: 22.5000 },
  "8415": { nos: "Lutriņu pag.",            lat: 56.7500, lng: 22.1500 },
  "8416": { nos: "Nīgrandes pag.",          lat: 56.7000, lng: 22.6500 },
  "8417": { nos: "Novadnieku pag.",         lat: 56.5500, lng: 22.4000 },
  "8418": { nos: "Pampāļu pag.",            lat: 56.6000, lng: 22.2500 },
  "8419": { nos: "Rubas pag.",              lat: 56.5500, lng: 22.5500 },
  "8420": { nos: "Šķēdes pag.",             lat: 56.7000, lng: 22.7500 },
  "8421": { nos: "Vadakstes pag.",          lat: 56.8000, lng: 22.5000 },
  "8422": { nos: "Zaņas pag.",              lat: 56.8500, lng: 22.3500 },
  "8423": { nos: "Zirņu pag.",              lat: 56.5500, lng: 22.3000 },

  // Valkas novads
  "9501": { nos: "Valka",                  lat: 57.7750, lng: 26.0130 },
  "9511": { nos: "Ērgļu pag.",              lat: 57.8000, lng: 25.8500 },
  "9512": { nos: "Kārķu pag.",              lat: 57.7000, lng: 25.8500 },
  "9513": { nos: "Launkalnes pag.",         lat: 57.7500, lng: 25.7500 },
  "9514": { nos: "Lejasciema pag.",         lat: 57.5500, lng: 25.9500 },
  "9515": { nos: "Valkas pag.",             lat: 57.8000, lng: 26.0500 },
  "9516": { nos: "Vijciema pag.",           lat: 57.6000, lng: 25.8000 },

  // Strenču novads (tagad Valmieras)
  "9682": { nos: "Sēļu pag.",               lat: 57.5200, lng: 25.1800 },
}

// Atrod pagasta koordinātes pēc kadastra numura
// Kadastra numurs formāts: "XXXX YYY ZZZZ" vai "XXXXXXXXXXXX"
export function getKrautuveKoordinates(kadastra) {
  if (!kadastra) return null

  // Notīra atstarpes un domuzīmes
  const tirs = kadastra.replace(/[\s\-]/g, "")

  // Ņem pirmos 4 ciparus
  const kods4 = tirs.substring(0, 4)

  if (PAGASTI[kods4]) {
    return {
      lat: PAGASTI[kods4].lat,
      lng: PAGASTI[kods4].lng,
      nosaukums: PAGASTI[kods4].nos,
      kods: kods4,
    }
  }

  // Mēģina ar pirmo 2 ciparu novadu kodu
  const kods2 = tirs.substring(0, 2)
  // Meklē tuvāko pagastu ar šo novada kodu
  const kandidati = Object.entries(PAGASTI).filter(([k]) => k.startsWith(kods2))
  if (kandidati.length > 0) {
    const [k, v] = kandidati[0]
    return { lat: v.lat, lng: v.lng, nosaukums: v.nos, kods: k }
  }

  return null
}
