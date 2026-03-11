export type PlayerRow = {
  name: string
  handicap: number | null
  isCaptain?: boolean
}

type Props = {
  teamName: string
  colorClass: string // e.g. 'text-red-400'
  players: PlayerRow[]
  align?: 'left' | 'right'
}

export default function TeamColumn({ teamName, colorClass, players, align = 'left' }: Props) {
  const isRight = align === 'right'
  return (
    <div className={`flex flex-col ${isRight ? 'items-end' : 'items-start'}`}>
      <p className={`text-[10px] font-bold tracking-widest mb-2 ${colorClass}`}>
        {teamName.toUpperCase()}
      </p>
      <div className="space-y-1.5 w-full">
        {players.map((p, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 ${isRight ? 'flex-row-reverse' : ''}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colorClass} opacity-70`}
              style={{ backgroundColor: 'currentColor' }}
            />
            <span className="text-xs text-gray-200 leading-none truncate flex-1">
              {p.name}
              {p.isCaptain && <span className="text-[9px] text-gray-500 ml-1">(C)</span>}
            </span>
            {p.handicap != null && (
              <span className="text-[10px] text-gray-500 flex-shrink-0">{p.handicap}</span>
            )}
          </div>
        ))}
        {players.length === 0 && (
          <p className="text-xs text-gray-600">No players yet</p>
        )}
      </div>
    </div>
  )
}
