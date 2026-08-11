import type { PlayerBoard, PrizeSlot, WinPattern } from '../models/game.js'

// Positions on a 4×4 board, row-major:
//   0  1  2  3
//   4  5  6  7
//   8  9 10 11
//  12 13 14 15
export const WIN_PATTERNS: Array<{ pattern: WinPattern; positions: number[] }> = [
  { pattern: 'corners', positions: [0, 3, 12, 15] },
  { pattern: 'row', positions: [0, 1, 2, 3] },
  { pattern: 'row', positions: [4, 5, 6, 7] },
  { pattern: 'row', positions: [8, 9, 10, 11] },
  { pattern: 'row', positions: [12, 13, 14, 15] },
  { pattern: 'column', positions: [0, 4, 8, 12] },
  { pattern: 'column', positions: [1, 5, 9, 13] },
  { pattern: 'column', positions: [2, 6, 10, 14] },
  { pattern: 'column', positions: [3, 7, 11, 15] },
  { pattern: 'diagonal', positions: [0, 5, 10, 15] },
  { pattern: 'diagonal', positions: [3, 6, 9, 12] },
  { pattern: 'square', positions: [0, 1, 4, 5] },
  { pattern: 'square', positions: [1, 2, 5, 6] },
  { pattern: 'square', positions: [2, 3, 6, 7] },
  { pattern: 'square', positions: [4, 5, 8, 9] },
  { pattern: 'square', positions: [5, 6, 9, 10] },
  { pattern: 'square', positions: [6, 7, 10, 11] },
  { pattern: 'square', positions: [8, 9, 12, 13] },
  { pattern: 'square', positions: [9, 10, 13, 14] },
  { pattern: 'square', positions: [10, 11, 14, 15] },
  { pattern: 'full_board', positions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
]

/** Which prize slot each raw pattern satisfies. */
export const PATTERN_TO_SLOT: Record<WinPattern, PrizeSlot> = {
  full_board: 'full_board',
  corners: 'corners',
  row: 'line',
  column: 'line',
  diagonal: 'line',
  square: 'square',
}

/** Prize slot payouts as a percentage of the pot. Must sum to 100. */
export const PRIZE_PCT: Record<PrizeSlot, number> = {
  full_board: 40,
  corners: 30,
  line: 20,
  square: 10,
}

export const PRIZE_SLOTS: PrizeSlot[] = ['full_board', 'corners', 'line', 'square']

/**
 * Returns the winning pattern for `slot` on `board` where every card in the
 * pattern is both marked and drawn — or null if the player hasn't earned it.
 * `drawn` is the set of card ids that have been called so far.
 */
export function findWinningPattern(
  board: PlayerBoard,
  slot: PrizeSlot,
  drawn: Set<number>,
): WinPattern | null {
  const marked = new Set(board.markedCards)
  for (const { pattern, positions } of WIN_PATTERNS) {
    if (PATTERN_TO_SLOT[pattern] !== slot) continue
    const complete = positions.every((pos) => {
      const card = board.cards[pos]
      return card !== undefined && marked.has(card.id) && drawn.has(card.id)
    })
    if (complete) return pattern
  }
  return null
}

/** Payout for a slot given the current pot, floored to whole coins. */
export function prizeAmount(slot: PrizeSlot, pot: number): number {
  return Math.floor((pot * PRIZE_PCT[slot]) / 100)
}
