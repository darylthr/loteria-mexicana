import { Check } from 'lucide-react'
import type { AvailableBoard } from '../types/game'
import type { CustomBoard } from '../api/boards'

interface Props {
  availableBoards: AvailableBoard[]
  myCustomBoards: CustomBoard[]
  selectedBoardIds: string[]
  playerId: string
  players: { id: string; name: string }[]
  onSelect: (boardId: string, isCustom: boolean) => void
}

function MiniBoard({ cards }: { cards: { id: number; imageUrl: string }[] }) {
  return (
    <div
      className="rounded-xl p-1.5 shadow-lg shadow-black/50"
      style={{
        background: 'linear-gradient(145deg, #7c4a22 0%, #5c3214 50%, #3e1f0a 100%)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,220,160,0.15), inset 0 -1px 0 rgba(0,0,0,0.4)',
      }}
    >
      <div className="rounded-lg overflow-hidden" style={{ boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)' }}>
        <div className="grid grid-cols-4 gap-px bg-white rounded-lg">
          {cards.map(c => (
            <img key={c.id} src={c.imageUrl} alt="" className="h-full aspect-2/3 object-fill" />
          ))}
        </div>
      </div>
    </div>
  )
}

function BoardCard({
  cards, label, locked, lockedByName, isMe, selected, onSelect,
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
      className={`relative transition-all rounded-xl ${
        selected
          ? 'ring-2 ring-th-accent ring-offset-2 ring-offset-th-surface cursor-pointer'
          : taken
          ? 'opacity-40 cursor-not-allowed'
          : 'cursor-pointer hover:scale-[1.02]'
      }`}
    >
      <MiniBoard cards={cards} />
      {label && (
        <p className="mt-1.5 text-center text-[11px] font-semibold text-th-sub truncate">{label}</p>
      )}
      {selected && (
        <div className="absolute top-1.5 right-1.5 bg-th-accent text-white p-0.5 rounded-full">
          <Check className="w-2.5 h-2.5" />
        </div>
      )}
      {locked && !isMe && lockedByName && (
        <div className="absolute top-1.5 right-1.5 bg-th-ui text-th text-[10px] font-bold px-1.5 py-0.5 rounded-full truncate max-w-[70%]">{lockedByName}</div>
      )}
    </div>
  )
}

export default function BoardPicker({ availableBoards, myCustomBoards, selectedBoardIds, playerId, players, onSelect }: Props) {
  const sharedBoards = availableBoards.filter(b => !b.isCustom)
  const myCustomInRoom = availableBoards.filter(b => b.isCustom && b.addedByPlayerId === playerId)

  const getPlayerName = (pid: string | null) => pid ? (players.find(p => p.id === pid)?.name ?? pid) : null

  const atMax = selectedBoardIds.length >= 2

  return (
    <div>
      <p className="text-sm text-th-sub mb-4">
        Seleccionados: <span className="font-bold text-th">{selectedBoardIds.length}/2</span>
        <span className="ml-2 opacity-70">· haz clic para elegir o deseleccionar</span>
      </p>

      {myCustomBoards.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-bold text-th-sub mb-2 uppercase tracking-wide">
            Tus tableros
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {myCustomBoards.map(cb => {
              const inRoom = myCustomInRoom.find(b => b.id === cb.id)
              const cards = inRoom
                ? inRoom.cards
                : cb.cardIds.map(id => ({ id, imageUrl: `/cards/${String(id).padStart(2, '0')}.jpg` }))
              const selected = selectedBoardIds.includes(cb.id)
              return (
                <BoardCard
                  key={cb.id}
                  id={cb.id}
                  cards={cards}
                  label={cb.name}
                  locked={atMax && !selected}
                  lockedByName={null}
                  isMe
                  selected={selected}
                  onSelect={() => onSelect(cb.id, true)}
                />
              )
            })}
          </div>
        </div>
      )}

      <h4 className="text-sm font-bold text-th-sub mb-2 uppercase tracking-wide">Tableros de la sala</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {sharedBoards.map((b, i) => {
          const selected = selectedBoardIds.includes(b.id)
          const takenByOther = !!b.lockedByPlayerId && b.lockedByPlayerId !== playerId
          return (
            <BoardCard
              key={b.id}
              id={b.id}
              cards={b.cards}
              label={`#${i + 1}`}
              locked={takenByOther || (atMax && !selected)}
              lockedByName={takenByOther ? getPlayerName(b.lockedByPlayerId) : null}
              isMe={b.lockedByPlayerId === playerId}
              selected={selected}
              onSelect={() => onSelect(b.id, false)}
            />
          )
        })}
      </div>
    </div>
  )
}
