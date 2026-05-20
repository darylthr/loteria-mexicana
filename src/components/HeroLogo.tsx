export default function HeroLogo() {
  return (
    <div className="flex items-end justify-center">
        {/* Left card */}
        <div className="-rotate-12 origin-bottom -mr-8 mb-2 opacity-80 z-0">
        <div className="border-4 border-amber-900 rounded-2xl shadow-xl shadow-black/60">
            <div className="border-2 border-amber-50/80 rounded-xl overflow-hidden">
            <img src="/cards/33.jpg" alt="" className="w-24 block" draggable={false} />
            </div>
        </div>
        </div>

        {/* Center — El Gallo */}
        <div className="z-10">
        <div className="border-[6px] border-amber-900 rounded-3xl shadow-2xl shadow-black/60">
            <div className="border-4 border-amber-50 rounded-2xl overflow-hidden">
            <img src="/cards/01.jpg" alt="El Gallo" className="w-32 block" draggable={false} />
            </div>
        </div>
        </div>

        {/* Right card */}
        <div className="rotate-12 origin-bottom -ml-8 mb-2 opacity-80 z-0">
        <div className="border-4 border-amber-900 rounded-2xl shadow-xl shadow-black/60">
            <div className="border-2 border-amber-50/80 rounded-xl overflow-hidden">
            <img src="/cards/27.jpg" alt="" className="w-24 block" draggable={false} />
            </div>
        </div>
        </div>
    </div>
  )
}
