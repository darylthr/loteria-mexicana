import type { PlayerBoard, WinPattern } from '../types/game'

const WIN_PATTERNS: Array<{ pattern: WinPattern; positions: number[] }> = [
  { pattern: 'full_board', positions: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] },
  { pattern: 'corners',    positions: [0, 3, 12, 15] },
  { pattern: 'row',        positions: [0, 1, 2, 3] },
  { pattern: 'row',        positions: [4, 5, 6, 7] },
  { pattern: 'row',        positions: [8, 9, 10, 11] },
  { pattern: 'row',        positions: [12, 13, 14, 15] },
  { pattern: 'column',     positions: [0, 4, 8, 12] },
  { pattern: 'column',     positions: [1, 5, 9, 13] },
  { pattern: 'column',     positions: [2, 6, 10, 14] },
  { pattern: 'column',     positions: [3, 7, 11, 15] },
  { pattern: 'diagonal',   positions: [0, 5, 10, 15] },
  { pattern: 'diagonal',   positions: [3, 6, 9, 12] },
  { pattern: 'square',     positions: [5, 6, 9, 10] },
]

export function detectWin(board: PlayerBoard): WinPattern | null {
  const marked = new Set(board.markedCards)
  for (const { pattern, positions } of WIN_PATTERNS) {
    if (positions.every(pos => board.cards[pos] !== undefined && marked.has(board.cards[pos].id))) {
      return pattern
    }
  }
  return null
}
