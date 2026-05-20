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
    <div className="grid grid-cols-4 gap-0.5">
      {cards.map(c => (
        <img key={c.id} src={c.imageUrl} alt="" className="w-full aspect-[2/3] object-cover rounded-sm" />
      ))}
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
      className={`relative rounded-xl overflow-hidden transition-all border-2 ${
        selected
          ? 'border-th-accent ring-2 ring-th-accent shadow-md'
          : taken
          ? 'border-th opacity-40 cursor-not-allowed'
          : 'border-th hover:border-th-accent hover:shadow-md cursor-pointer'
      }`}
    >
      <div className="p-1.5 bg-th-surface">
        <MiniBoard cards={cards} />
        {label && (
          <p className="mt-1 text-center text-[11px] font-semibold text-th-sub truncate">{label}</p>
        )}
      </div>
      {selected && (
        <div className="absolute top-1.5 right-1.5 bg-th-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">✓</div>
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
            Mis tableros <span className="text-th-accent font-normal normal-case">+10 monedas</span>
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
