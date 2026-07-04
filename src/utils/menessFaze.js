export function menessFaze(datums) {
  const d = new Date(datums)
  const zinamisJaunmenesis = new Date('2024-01-11')
  const dienas = (d - zinamisJaunmenesis) / (1000 * 60 * 60 * 24)
  const cikls = ((dienas % 29.53) + 29.53) % 29.53

  if (cikls < 1.85) return 'jaunais mēness'
  if (cikls < 7.38) return 'augoši'
  if (cikls < 14.77) return 'pilnmēness'
  if (cikls < 22.15) return 'dilstoši'
  return 'jaunais mēness'
}

export function menessFazeEmoji(faze) {
  const emojis = {
    'jaunais mēness': '🌑',
    'augoši': '🌒',
    'pilnmēness': '🌕',
    'dilstoši': '🌘',
  }
  return emojis[faze] || '🌙'
}
