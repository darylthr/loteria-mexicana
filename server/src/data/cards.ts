import type { LoteriaCard } from '../models/game.js'

/**
 * The 54 cards of the traditional Lotería Mexicana (Don Clemente order).
 * Image files live in the frontend under public/cards/NN.jpg.
 */
const CARD_NAMES: string[] = [
  'El Gallo', // 1
  'El Diablito', // 2
  'La Dama', // 3
  'El Catrín', // 4
  'El Paraguas', // 5
  'La Sirena', // 6
  'La Escalera', // 7
  'La Botella', // 8
  'El Barril', // 9
  'El Árbol', // 10
  'El Melón', // 11
  'El Valiente', // 12
  'El Gorrito', // 13
  'La Muerte', // 14
  'La Pera', // 15
  'La Bandera', // 16
  'El Bandolón', // 17
  'El Violoncello', // 18
  'La Garza', // 19
  'El Pájaro', // 20
  'La Mano', // 21
  'La Bota', // 22
  'La Luna', // 23
  'El Cotorro', // 24
  'El Borracho', // 25
  'El Negrito', // 26
  'El Corazón', // 27
  'La Sandía', // 28
  'El Tambor', // 29
  'El Camarón', // 30
  'Las Jaras', // 31
  'El Músico', // 32
  'La Araña', // 33
  'El Soldado', // 34
  'La Estrella', // 35
  'El Cazo', // 36
  'El Mundo', // 37
  'El Apache', // 38
  'El Nopal', // 39
  'El Alacrán', // 40
  'La Rosa', // 41
  'La Calavera', // 42
  'La Campana', // 43
  'El Cantarito', // 44
  'El Venado', // 45
  'El Sol', // 46
  'La Corona', // 47
  'La Chalupa', // 48
  'El Pino', // 49
  'El Pescado', // 50
  'La Palma', // 51
  'La Maceta', // 52
  'El Arpa', // 53
  'La Rana', // 54
]

export const TOTAL_CARDS = CARD_NAMES.length

/** Immutable master list of all 54 cards. */
export const CARDS: readonly LoteriaCard[] = CARD_NAMES.map((name, i) => {
  const id = i + 1
  return {
    id,
    name,
    imageUrl: `/cards/${String(id).padStart(2, '0')}.jpg`,
    isDrawn: false,
  }
})

/** Look up a single card by id (1..54). */
export function getCard(id: number): LoteriaCard | undefined {
  return CARDS.find((c) => c.id === id)
}

/** Fresh, mutable copy of a card so per-room `isDrawn` state stays isolated. */
export function cloneCard(id: number): LoteriaCard | undefined {
  const card = getCard(id)
  return card ? { ...card } : undefined
}
