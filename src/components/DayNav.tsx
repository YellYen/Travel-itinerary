import { useEffect, useRef } from 'react'

interface Props {
  days: string[]
  activeDay: string
  today: string
  onSelectDay: (day: string) => void
}

export default function DayNav({ days, activeDay, today, onSelectDay }: Props) {
  const stripRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    const chip = chipRefs.current[activeDay]
    const strip = stripRef.current
    if (!chip || !strip) return
    const center = chip.offsetLeft + chip.offsetWidth / 2
    strip.scrollTo({ left: center - strip.offsetWidth / 2, behavior: 'smooth' })
  }, [activeDay])

  return (
    <div ref={stripRef} className="flex overflow-x-auto gap-1 py-2 px-3 no-scrollbar">
      {days.map(day => {
        const d = new Date(day + 'T00:00:00')
        const dateNum = d.getDate()
        const weekday = d.toLocaleDateString('en-US', { weekday: 'short' })
        const isActive = day === activeDay
        const isToday = day === today

        return (
          <button
            key={day}
            ref={el => { chipRefs.current[day] = el }}
            onClick={() => onSelectDay(day)}
            className={`shrink-0 flex flex-col items-center px-3 py-1.5 rounded-xl transition-colors min-w-[52px] relative ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <span className="text-sm font-bold leading-tight">{dateNum}</span>
            <span className="text-xs leading-tight">{weekday}</span>
            {isToday && !isActive && (
              <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
            )}
          </button>
        )
      })}
    </div>
  )
}
