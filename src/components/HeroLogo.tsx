import { useState } from 'react'

interface CardProps {
  src: string
  alt: string
  rotate: number
  offsetMb: number
  offsetMr?: number
  offsetMl?: number
  size: 'sm' | 'lg'
  floatDelay: string
  zIndex: number
  opacity?: number
}

function HeroCard({ src, alt, rotate, offsetMb, offsetMr, offsetMl, size, floatDelay, zIndex, opacity = 1 }: CardProps) {
  const [hovered, setHovered] = useState(false)

  const borderOuter = size === 'lg' ? 'border-[6px] border-amber-900 rounded-3xl' : 'border-4 border-amber-900 rounded-2xl'
  const borderInner = size === 'lg' ? 'border-4 border-amber-50 rounded-2xl' : 'border-2 border-amber-50/80 rounded-xl'
  const imgClass   = size === 'lg' ? 'w-32 block' : 'w-24 block'
  const shadow     = size === 'lg' ? 'shadow-2xl shadow-black/60' : 'shadow-xl shadow-black/60'

  const style: React.CSSProperties = {
    rotate: `${hovered ? rotate * 0.4 : rotate}deg`,
    marginBottom: offsetMb,
    marginRight: offsetMr,
    marginLeft: offsetMl,
    zIndex,
    opacity,
    transformOrigin: 'bottom center',
    animation: `heroFloat 3.6s ease-in-out ${floatDelay} infinite`,
    transform: hovered ? 'scale(1.08) translateY(-6px)' : undefined,
    transition: 'transform 0.3s ease, rotate 0.3s ease, opacity 0.3s ease',
    filter: hovered ? 'drop-shadow(0 12px 24px rgba(0,0,0,0.5))' : undefined,
  }

  return (
    <div
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer select-none"
    >
      <div className={`${borderOuter} ${shadow}`}>
        <div className={`${borderInner} overflow-hidden`}>
          <img src={src} alt={alt} className={imgClass} draggable={false} />
        </div>
      </div>
    </div>
  )
}

export default function HeroLogo() {
  return (
    <>
      <style>{`
        @keyframes heroFloat {
          0%, 100% { translate: 0 0px; }
          50%       { translate: 0 -10px; }
        }
      `}</style>

      <div className="flex items-end justify-center">
        <HeroCard
          src="/cards/33.jpg" alt=""
          rotate={-12} offsetMb={8} offsetMr={-32}
          size="sm" floatDelay="0.4s" zIndex={0} opacity={0.85}
        />
        <HeroCard
          src="/cards/01.jpg" alt="El Gallo"
          rotate={0} offsetMb={0}
          size="lg" floatDelay="0s" zIndex={10}
        />
        <HeroCard
          src="/cards/27.jpg" alt=""
          rotate={12} offsetMb={8} offsetMl={-32}
          size="sm" floatDelay="0.8s" zIndex={0} opacity={0.85}
        />
      </div>
    </>
  )
}
