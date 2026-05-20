const CARDS = [
  { src: '/cards/16.jpg', rotate: -14, delay: 0 },
  { src: '/cards/01.jpg', rotate: 0,   delay: 0.08 },
  { src: '/cards/33.jpg', rotate: 14,  delay: 0.16 },
]

interface Props {
  message?: string
}

export default function GameLoader({ message = 'Cargando…' }: Props) {
  return (
    <div className="flex flex-col items-center gap-10">
      <style>{`
        @keyframes dealIn {
          from { opacity: 0; transform: translateY(48px) scale(0.85); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes loaderFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.75); }
          40%            { opacity: 1;   transform: scale(1.1); }
        }
      `}</style>

      <div className="relative flex items-end justify-center" style={{ height: 130 }}>
        {/* Ambient glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 180,
            height: 80,
            background: 'radial-gradient(ellipse at 50% 80%, color-mix(in srgb, var(--th-accent) 30%, transparent), transparent 70%)',
            filter: 'blur(8px)',
          }}
        />

        {CARDS.map(({ src, rotate, delay }, i) => {
          const isCenter = i === 1
          return (
            <div
              key={src}
              style={{
                transform: `rotate(${rotate}deg)`,
                marginLeft: i === 0 ? 0 : -22,
                zIndex: isCenter ? 10 : i === 0 ? 6 : 4,
                position: 'relative',
              }}
            >
              <img
                src={src}
                alt=""
                style={{
                  display: 'block',
                  width: isCenter ? 80 : 60,
                  height: isCenter ? 120 : 90,
                  objectFit: 'cover',
                  borderRadius: 10,
                  animation: [
                    `dealIn 0.55s cubic-bezier(0.34,1.56,0.64,1) ${delay}s both`,
                    `loaderFloat ${1.9 + i * 0.25}s ease-in-out ${delay + 0.55}s infinite`,
                  ].join(', '),
                  boxShadow: isCenter
                    ? '0 12px 40px -6px rgba(0,0,0,0.7), 0 0 0 2px color-mix(in srgb, var(--th-accent) 55%, transparent), inset 0 1px 0 rgba(255,255,255,0.12)'
                    : '0 8px 24px -4px rgba(0,0,0,0.55)',
                }}
              />
            </div>
          )
        })}
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-th font-semibold text-sm tracking-wide">{message}</p>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-th-accent"
              style={{ animation: `dotPulse 1.3s ease-in-out ${i * 0.18}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
