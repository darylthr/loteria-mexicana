import { CARDS, TOTAL_CARDS, cloneCard } from '../data/cards.js'
import type { AvailableBoard, LoteriaCard } from '../models/game.js'

/** Fisher–Yates shuffle on a copy of the input. */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = input.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** A freshly shuffled 54-card deck (fresh card clones, isDrawn = false). */
export function freshDeck(): LoteriaCard[] {
  return shuffle(CARDS).map((c) => ({ ...c }))
}

/** 16 distinct random cards, laid out as a 4×4 board. */
export function randomBoardCards(): LoteriaCard[] {
  const ids = shuffle(CARDS.map((c) => c.id)).slice(0, 16)
  return ids.map((id) => cloneCard(id)!)
}

/** Build board cards from an explicit list of 16 card ids (custom boards). */
export function boardCardsFromIds(cardIds: number[]): LoteriaCard[] {
  return cardIds.map((id) => cloneCard(id)!)
}

/**
 * Generate the pool of shared (non-custom) boards a room offers in the lobby.
 * Ids are stable within the room so lock/unlock deltas line up client-side.
 */
export function generateSharedBoards(count = 10): AvailableBoard[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `shared-${i}`,
    cards: randomBoardCards(),
    isCustom: false,
    lockedByPlayerId: null,
  }))
}

export const DECK_SIZE = TOTAL_CARDS
