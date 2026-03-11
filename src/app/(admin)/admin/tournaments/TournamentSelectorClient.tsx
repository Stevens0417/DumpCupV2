'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Tournament, Season } from '@/types/database'
import { setupTournamentAction, editTournamentAction } from './actions'
import PosterUploader from '@/components/admin/PosterUploader'

type TournamentType = 'kickoff' | 'midseason' | 'yearend'

const CARDS: { type: TournamentType; label: string; description: string }[] = [
  {
    type: 'kickoff',
    label: 'Kickoff Tournament',
    description: 'Season-opening individual stroke play event.',
  },
  {
    type: 'midseason',
    label: 'Midseason Tournament',
    description: 'Mid-season team match play event.',
  },
  {
    type: 'yearend',
    label: 'Year-End Tournament',
    description: 'End-of-season 1v1 stroke play championship.',
  },
]

type Panel = {
  type: TournamentType
  mode: 'setup' | 'edit'
  tournament: Tournament | null
}

type Props = {
  seasons: Season[]
  selectedSeasonId: string | null
  tournaments: Tournament[]
}

export default function TournamentSelectorClient({
  seasons,
  selectedSeasonId,
  tournaments,
}: Props) {
  const router = useRouter()
  const [panel, setPanel] = useState<Panel | null>(null)
  const [date, setDate] = useState('')
  const [course, setCourse] = useState('')
  const [posterUrl, setPosterUrl] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSeasonChange(seasonId: string) {
    if (seasonId) router.push(`/admin/tournaments?season=${seasonId}`)
    else router.push('/admin/tournaments')
  }

  function openSetup(type: TournamentType) {
    setPanel({ type, mode: 'setup', tournament: null })
    setDate('')
    setCourse('')
    setPosterUrl('')
    setFormError(null)
  }

  function openEdit(type: TournamentType, tournament: Tournament) {
    setPanel({ type, mode: 'edit', tournament })
    setDate(tournament.tournament_date ?? '')
    setCourse(tournament.course ?? '')
    setPosterUrl(tournament.poster_url ?? '')
    setFormError(null)
  }

  function closePanel() {
    setPanel(null)
    setFormError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!panel || !selectedSeasonId) return
    setFormError(null)

    startTransition(async () => {
      if (panel.mode === 'setup') {
        const result = await setupTournamentAction(
          selectedSeasonId,
          panel.type,
          date,
          course,
          posterUrl
        )
        if ('error' in result) {
          setFormError(result.error)
        } else if ('conflict' in result) {
          // Tournament already exists — switch to edit mode
          openEdit(panel.type, result.conflict)
          setFormError('A tournament already exists for this season. You can edit it below.')
        } else {
          closePanel()
          router.refresh()
        }
      } else {
        if (!panel.tournament) return
        const result = await editTournamentAction(panel.tournament.id, date, course, posterUrl)
        if ('error' in result) {
          setFormError(result.error)
        } else {
          closePanel()
          router.refresh()
        }
      }
    })
  }

  const panelLabel = panel ? (CARDS.find((c) => c.type === panel.type)?.label ?? '') : ''

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Tournaments</h1>

      {/* Season selector */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Season</label>
        <select
          className="bg-gray-800 border border-white/20 rounded px-3 py-2 text-sm text-white w-full max-w-xs"
          value={selectedSeasonId ?? ''}
          onChange={(e) => handleSeasonChange(e.target.value)}
        >
          <option value="">— select season —</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.year}
            </option>
          ))}
        </select>
      </div>

      {!selectedSeasonId && (
        <p className="text-gray-400 text-sm">Select a season to manage tournaments.</p>
      )}

      {selectedSeasonId && (
        <div className="space-y-4">
          {/* Cards grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            {CARDS.map(({ type, label, description }) => {
              const existing = tournaments.find((t) => t.type === type)
              const isThisOpen = panel?.type === type

              if (existing) {
                return (
                  <div
                    key={type}
                    className={`bg-gray-800 border rounded-xl p-5 transition-colors ${
                      isThisOpen ? 'border-blue-500/50' : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="text-sm font-semibold text-white">{label}</h2>
                      <span className="text-[10px] bg-green-900/50 text-green-400 border border-green-700/50 rounded-full px-2 py-0.5 shrink-0 ml-2">
                        Set up
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{description}</p>
                    {existing.tournament_date && (
                      <p className="text-xs text-gray-500">{existing.tournament_date}</p>
                    )}
                    {existing.course && (
                      <p className="text-xs text-gray-500">{existing.course}</p>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Link
                        href={`/admin/tournaments/${type}?season=${selectedSeasonId}&tournament=${existing.id}`}
                        className="flex-1 text-center text-xs bg-gray-700 hover:bg-gray-600 text-white rounded px-3 py-1.5 transition-colors"
                      >
                        View Details →
                      </Link>
                      <button
                        onClick={() => openEdit(type, existing)}
                        className="text-xs text-gray-400 hover:text-white border border-white/20 rounded px-3 py-1.5 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={type}
                  className={`bg-gray-800 border rounded-xl p-5 transition-colors ${
                    isThisOpen ? 'border-blue-500/50' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-sm font-semibold text-white">{label}</h2>
                    <span className="text-[10px] bg-gray-700/50 text-gray-500 border border-white/10 rounded-full px-2 py-0.5 shrink-0 ml-2">
                      Not set up
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">{description}</p>
                  <button
                    onClick={() => openSetup(type)}
                    className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1.5 transition-colors"
                  >
                    Set up
                  </button>
                </div>
              )
            })}
          </div>

          {/* Inline setup / edit panel */}
          {panel && (
            <div className="rounded-xl border border-white/10 bg-gray-800/60 p-5">
              <h2 className="text-sm font-semibold text-white mb-4">
                {panel.mode === 'setup' ? 'Set up' : 'Edit'}: {panelLabel}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                {formError && <p className="text-yellow-400 text-sm">{formError}</p>}

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-gray-900 border border-white/20 rounded px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Course</label>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="e.g. Augusta National"
                    className="w-full bg-gray-900 border border-white/20 rounded px-3 py-2 text-sm text-white placeholder:text-gray-600"
                  />
                </div>

                <PosterUploader
                  currentUrl={posterUrl || null}
                  tournamentType={panel.type}
                  onUpload={(url) => setPosterUrl(url)}
                />

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded transition-colors"
                  >
                    {isPending ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={closePanel}
                    disabled={isPending}
                    className="text-sm text-gray-400 hover:text-white border border-white/20 rounded px-4 py-2 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
