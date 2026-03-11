'use client'

import { useState } from 'react'

type TeamPoints = { team_name: string; team_points: number }

type Props = {
  posterUrl: string | null
  course: string | null
  tournamentDate: string | null
  tournamentType: 'kickoff' | 'midseason' | 'yearend'
  year: number
  teamPoints: TeamPoints[]
}

const TYPE_LABELS: Record<Props['tournamentType'], string> = {
  kickoff: 'Kickoff Tournament',
  midseason: 'Midseason Event',
  yearend: 'Year-End Championship',
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function fmtDate(d: string | null): string | null {
  if (!d) return null
  const [year, month, day] = d.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function teamColor(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('dresden')) return 'text-red-400'
  if (lower.includes('york')) return 'text-blue-400'
  return 'text-gray-300'
}

export default function PosterCard({
  posterUrl,
  course,
  tournamentDate,
  tournamentType,
  year,
  teamPoints,
}: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const title = TYPE_LABELS[tournamentType]
  const dateStr = fmtDate(tournamentDate)

  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {/* Poster image */}
        {posterUrl ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="w-full block focus:outline-none"
            aria-label="View full poster"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterUrl}
              alt={`${title} ${year} poster`}
              className="w-full object-cover max-h-72"
            />
          </button>
        ) : (
          <div className="w-full h-40 bg-white/5 flex items-center justify-center">
            <span className="text-gray-600 text-sm">No poster available</span>
          </div>
        )}

        {/* Meta */}
        <div className="px-4 pt-3 pb-2 space-y-0.5">
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <p className="text-xs text-gray-400">{year}</p>
          {course && <p className="text-xs text-gray-400">{course}</p>}
          {dateStr && <p className="text-xs text-gray-500">{dateStr}</p>}
        </div>

        {/* Team points */}
        {teamPoints.length > 0 && (
          <div className="px-4 pb-3 flex gap-6">
            {teamPoints.map((tp) => (
              <div key={tp.team_name} className="flex items-baseline gap-1.5">
                <span className={`text-xs font-medium ${teamColor(tp.team_name)}`}>
                  {tp.team_name}
                </span>
                <span className="text-lg font-black tabular-nums text-white leading-none">
                  {fmt(tp.team_points)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && posterUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Image — stop propagation so clicking the image itself doesn't close */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterUrl}
            alt={`${title} ${year} poster`}
            className="max-w-full max-h-full object-contain p-4"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
