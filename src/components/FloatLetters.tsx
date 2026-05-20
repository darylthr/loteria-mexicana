export default function FloatLetters({ text, className = '' }: { text: string; className?: string }) {
  return (
    <>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className={`inline-block transition-all duration-150 hover:-translate-y-3 hover:scale-110 ${className}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          {char}
        </span>
      ))}
    </>
  )
}
