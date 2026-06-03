// ACM — Āfrikas Cūku Mēris 🐗
// Rotējošs autentifikācijas tokens AI proxy pieprasījumiem.
// Mainās automātiski katru nedēļu. Bots bloķēti, lietotājs nejūt neko.

const NEDELA = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
const METODE = NEDELA % 4;

export function acmGeneretToken(sesijasId = '') {
  const min = Math.floor(Date.now() / 60000);

  switch (METODE) {
    case 0: {
      const baze = (NEDELA + sesijasId).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      return (baze * 7 + min).toString(36).substring(0, 12);
    }
    case 1: {
      const n = (NEDELA % 15) + 5;
      let a = 0, b = 1;
      for (let i = 0; i < n; i++) { [a, b] = [b, a + b]; }
      return (a % 1000).toString().padStart(3, '0') + min.toString(36);
    }
    case 2: {
      return min.toString().split('').reverse().join('') + (NEDELA % 97).toString();
    }
    case 3: {
      const xor = (NEDELA ^ min ^ sesijasId.length) >>> 0;
      return xor.toString(16).padStart(8, '0');
    }
    default:
      return min.toString(36);
  }
}

export function acmValidetToken(token, sesijasId = '') {
  for (let delta = -2; delta <= 2; delta++) {
    const t       = Date.now() + delta * 60000;
    const pagMin  = Math.floor(t / 60000);
    const pagNed  = Math.floor(t / (7 * 24 * 60 * 60 * 1000));
    const pagMet  = pagNed % 4;

    let pareizsToken;
    switch (pagMet) {
      case 0: {
        const baze = (pagNed + sesijasId).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        pareizsToken = (baze * 7 + pagMin).toString(36).substring(0, 12);
        break;
      }
      case 1: {
        const n = (pagNed % 15) + 5;
        let a = 0, b = 1;
        for (let i = 0; i < n; i++) { [a, b] = [b, a + b]; }
        pareizsToken = (a % 1000).toString().padStart(3, '0') + pagMin.toString(36);
        break;
      }
      case 2: {
        pareizsToken = pagMin.toString().split('').reverse().join('') + (pagNed % 97).toString();
        break;
      }
      case 3: {
        const xor = (pagNed ^ pagMin ^ sesijasId.length) >>> 0;
        pareizsToken = xor.toString(16).padStart(8, '0');
        break;
      }
      default:
        pareizsToken = pagMin.toString(36);
    }
    if (token === pareizsToken) return true;
  }
  return false;
}

// Palīgfunkcija — ģenerē fetch headers ar ACM tokensu
export function acmHeaders(userId = '') {
  return {
    'Content-Type': 'application/json',
    'x-acm-token': acmGeneretToken(userId),
    'x-sesija-id': userId,
  };
}
