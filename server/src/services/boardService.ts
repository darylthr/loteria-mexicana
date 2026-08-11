import { supabaseAdmin } from '../lib/supabase.js'
import { TOTAL_CARDS } from '../data/cards.js'

export interface CustomBoard {
  id: string
  name: string
  cardIds: number[]
}

interface CustomBoardRow {
  id: string
  name: string
  card_ids: number[]
}

const toBoard = (row: CustomBoardRow): CustomBoard => ({
  id: row.id,
  name: row.name,
  cardIds: row.card_ids,
})

/** Validate a 16-card custom-board selection. Throws on any problem. */
function validateCardIds(cardIds: unknown): number[] {
  if (!Array.isArray(cardIds) || cardIds.length !== 16) {
    throw new Error('A board must have exactly 16 cards')
  }
  const ids = cardIds.map((v) => Number(v))
  if (ids.some((n) => !Number.isInteger(n) || n < 1 || n > TOTAL_CARDS)) {
    throw new Error('Invalid card id in board')
  }
  if (new Set(ids).size !== ids.length) {
    throw new Error('Board cards must be unique')
  }
  return ids
}

/** All custom boards owned by a player. */
export async function getBoards(userId: string): Promise<CustomBoard[]> {
  const { data, error } = await supabaseAdmin
    .from('custom_boards')
    .select('id, name, card_ids')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(toBoard)
}

/** A single custom board, scoped to its owner (used when locking in a room). */
export async function getBoard(userId: string, boardId: string): Promise<CustomBoard | null> {
  const { data, error } = await supabaseAdmin
    .from('custom_boards')
    .select('id, name, card_ids')
    .eq('user_id', userId)
    .eq('id', boardId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? toBoard(data) : null
}

export async function createBoard(
  userId: string,
  name: string,
  cardIds: unknown,
): Promise<CustomBoard> {
  const trimmed = (name ?? '').trim()
  if (!trimmed) throw new Error('Board name is required')
  const ids = validateCardIds(cardIds)

  const { data, error } = await supabaseAdmin
    .from('custom_boards')
    .insert({ user_id: userId, name: trimmed.slice(0, 40), card_ids: ids })
    .select('id, name, card_ids')
    .single()

  if (error) throw new Error(error.message)
  return toBoard(data)
}

export async function deleteBoard(userId: string, boardId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('custom_boards')
    .delete()
    .eq('user_id', userId)
    .eq('id', boardId)

  if (error) throw new Error(error.message)
}
