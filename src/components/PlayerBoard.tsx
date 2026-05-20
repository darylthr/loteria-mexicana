import CardTile from './CardTile'
import type { PlayerBoard as PlayerBoardType } from '../types/game'

interface PlayerBoardProps {
  board: PlayerBoardType
  drawnCardIds: Set<number>
  onMark: (cardId: number) => void
}

export default function PlayerBoard({ board, drawnCardIds, onMark }: PlayerBoardProps) {
  const marked = new Set(board.markedCards)

  return (
    <div className="grid grid-cols-4 gap-1 p-2 bg-stone-800 rounded-xl border border-stone-700 w-[296px] h-[396px] shrink-0">
      {board.cards.map((card) => (
        <CardTile
          key={card.id}
          card={card}
          isMarked={marked.has(card.id)}
          isDrawn={drawnCardIds.has(card.id)}
          onClick={() => onMark(card.id)}
        />
      ))}
    </div>
  )
}
