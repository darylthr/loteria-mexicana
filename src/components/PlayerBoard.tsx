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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 6,
        maxWidth: 480,
      }}
    >
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
