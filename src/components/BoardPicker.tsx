import type { AvailableBoard } from '../types/game'
import type { CustomBoard } from '../api/boards'

interface Props {
  availableBoards: AvailableBoard[]
  myCustomBoards: CustomBoard[]
  selectedBoardId: string | null
  playerId: string
  players: { id: string; name: string }[]
  onSelect: (boardId: string, isCustom: boolean) => void
}

function MiniBoard({ cards }: { cards: { id: number; imageUrl: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
      {cards.map(c => (
        <img key={c.id} src={c.imageUrl} alt="" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 2 }} />
      ))}
    </div>
  )
}

function BoardCard({
  id, cards, label, locked, lockedByName, isMe, selected, onSelect,
}: {
  id: string
  cards: { id: number; imageUrl: string }[]
  label?: string
  locked: boolean
  lockedByName: string | null
  isMe: boolean
  selected: boolean
  onSelect: () => void
}) {
  const taken = locked && !isMe
  return (
    <div
      onClick={() => !taken && onSelect()}
      style={{
        border: selected ? '2px solid #0066cc' : taken ? '2px solid #ccc' : '2px solid #ddd',
        borderRadius: 8,
        padding: 8,
        cursor: taken ? 'not-allowed' : 'pointer',
        opacity: taken ? 0.45 : 1,
        background: selected ? '#f0f7ff' : '#fff',
        position: 'relative',
      }}
    >
      <MiniBoard cards={cards} />
      {label && <p style={{ margin: '6px 0 0', fontSize: 11, fontWeight: 600, textAlign: 'center' }}>{label}</p>}
      {selected && (
        <div style={{ position: 'absolute', top: 4, right: 4, background: '#0066cc', color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: 11 }}>✓ Elegido</div>
      )}
      {locked && !isMe && lockedByName && (
        <div style={{ position: 'absolute', top: 4, right: 4, background: '#999', color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: 11 }}>{lockedByName}</div>
      )}
    </div>
  )
}

export default function BoardPicker({ availableBoards, myCustomBoards, selectedBoardId, playerId, players, onSelect }: Props) {
  const sharedBoards = availableBoards.filter(b => !b.isCustom)
  const myCustomInRoom = availableBoards.filter(b => b.isCustom && b.addedByPlayerId === playerId)
  const myCustomNotInRoom = myCustomBoards.filter(cb => !myCustomInRoom.some(b => b.id === cb.id))

  const getPlayerName = (pid: string | null) => pid ? (players.find(p => p.id === pid)?.name ?? pid) : null

  return (
    <div>
      {myCustomBoards.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Mis tableros (+10 monedas)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
            {myCustomBoards.map(cb => {
              const inRoom = myCustomInRoom.find(b => b.id === cb.id)
              const cards = inRoom
                ? inRoom.cards
                : cb.cardIds.map(id => ({ id, imageUrl: `/cards/${String(id).padStart(2, '0')}.jpg` }))
              return (
                <BoardCard
                  key={cb.id}
                  id={cb.id}
                  cards={cards}
                  label={cb.name}
                  locked={false}
                  lockedByName={null}
                  isMe
                  selected={selectedBoardId === cb.id}
                  onSelect={() => onSelect(cb.id, true)}
                />
              )
            })}
          </div>
        </div>
      )}

      <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Tableros de la sala</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
        {sharedBoards.map((b, i) => (
          <BoardCard
            key={b.id}
            id={b.id}
            cards={b.cards}
            label={`#${i + 1}`}
            locked={!!b.lockedByPlayerId}
            lockedByName={getPlayerName(b.lockedByPlayerId)}
            isMe={b.lockedByPlayerId === playerId}
            selected={selectedBoardId === b.id}
            onSelect={() => onSelect(b.id, false)}
          />
        ))}
      </div>
    </div>
  )
}
