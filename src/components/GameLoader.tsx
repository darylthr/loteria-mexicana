const CARDS = [
  '/cards/33.jpg',
  '/cards/27.jpg',
  '/cards/04.jpg',
]

interface Props {
  message?: string
}

export default function GameLoader({ message = 'Cargando…' }: Props) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-end gap-3">
        {CARDS.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className="w-12 h-[4.5rem] object-cover rounded-lg shadow-2xl shadow-black/50 animate-bounce"
            style={{ animationDelay: `${i * 0.18}s`, animationDuration: '0.9s' }}
          />
        ))}
      </div>
      <p className="text-sm text-th-sub">{message}</p>
    </div>
  )
}
