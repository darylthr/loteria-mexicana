import { useEffect, useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  delay?: number
  className?: string
}

export default function FadeIn({ children, delay = 0, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={visible
        ? { animation: `fadeSlideUp 0.55s ease ${delay}s both` }
        : { opacity: 0 }
      }
    >
      {children}
    </div>
  )
}
