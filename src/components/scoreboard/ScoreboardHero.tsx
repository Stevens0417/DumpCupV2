import Image from 'next/image'

export type TeamScore = {
  name: string
  logoSrc: string
  score: number
  colorClass: string // e.g. 'text-red-400'
}

type Props = {
  teamA: TeamScore
  teamB: TeamScore
}

export default function ScoreboardHero({ teamA, teamB }: Props) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      {/* Team A */}
      <div className="flex flex-col items-center gap-2 flex-1">
        <Image
          src={teamA.logoSrc}
          alt={teamA.name}
          width={80}
          height={80}
          className="object-contain"
        />
        <span
          className={`text-7xl font-black leading-none tabular-nums ${teamA.colorClass}`}
          style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
        >
          {teamA.score}
        </span>
      </div>

      {/* Divider */}
      <div className="flex flex-col items-center px-2">
        <span className="text-gray-600 text-xs font-semibold tracking-widest">VS</span>
      </div>

      {/* Team B */}
      <div className="flex flex-col items-center gap-2 flex-1">
        <Image
          src={teamB.logoSrc}
          alt={teamB.name}
          width={80}
          height={80}
          className="object-contain"
        />
        <span
          className={`text-7xl font-black leading-none tabular-nums ${teamB.colorClass}`}
          style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
        >
          {teamB.score}
        </span>
      </div>
    </div>
  )
}
