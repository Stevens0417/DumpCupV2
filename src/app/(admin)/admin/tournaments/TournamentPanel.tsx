'use client'

import {
  useState,
  useEffect,
  useTransition,
  useMemo,
  type FormEvent,
} from 'react'
import { useRouter } from 'next/navigation'
import type { Tournament, TournamentEntry, Player, Team } from '@/types/database'
import PosterUploader from '@/components/admin/PosterUploader'
import { lookupPointsForPosition } from '@/lib/domain/tournamentPoints'
import {
  createTournamentAction,
  updateTournamentAction,
  deleteTournamentAction,
  savePositionPointsAction,
  getTournamentDataAction,
  getTournamentEntriesAction,
  createTournamentEntryAction,
  updateTournamentEntryAction,
  deleteTournamentEntryAction,
  type EntryActionInput,
} from './actions'

type TournamentType = 'kickoff' | 'midseason' | 'yearend'

const TYPE_LABELS: Record<TournamentType, string> = {
  kickoff: 'Kickoff',
  midseason: 'Mid-Season',
  yearend: 'Year-End',
}

type PPRow = { finish_position: string; points: string }

type Props = {
  tournament: Tournament | null
  seasonId: string
  type: TournamentType
  players: Player[]
  teams: Team[]
  playerTeamMap?: Record<string, string | null>
}

// ── Meta form ────────────────────────────────────────────────────────────────

function MetaForm({
  initial,
  isEdit,
  isPending,
  error,
  tournamentType,
  onSubmit,
  onCancel,
}: {
  initial: { date: string; course: string; posterUrl: string }
  isEdit: boolean
  isPending: boolean
  error: string | null
  tournamentType: TournamentType
  onSubmit: (date: string, course: string, posterUrl: string) => void
  onCancel: () => void
}) {
  const [date, setDate] = useState(initial.date)
  const [course, setCourse] = useState(initial.course)
  const [posterUrl, setPosterUrl] = useState(initial.posterUrl)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(date, course, posterUrl)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-gray-700 border border-white/20 rounded px-3 py-2 text-sm text-white w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Course</label>
          <input
            type="text"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            maxLength={100}
            className="bg-gray-700 border border-white/20 rounded px-3 py-2 text-sm text-white w-full"
          />
        </div>
        <div className="sm:col-span-2">
          <PosterUploader
            currentUrl={posterUrl || null}
            tournamentType={tournamentType}
            onUpload={(url) => setPosterUrl(url)}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
        >
          {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Tournament'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="text-sm text-gray-400 hover:text-white px-3 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Entry form ───────────────────────────────────────────────────────────────

function EntryForm({
  entry,
  players,
  teams,
  ppMapping,
  playerTeamMap,
  isPending,
  error,
  onSubmit,
  onCancel,
}: {
  entry: TournamentEntry | undefined
  players: Player[]
  teams: Team[]
  ppMapping: { finish_position: number; points: number }[]
  playerTeamMap?: Record<string, string | null>
  isPending: boolean
  error: string | null
  onSubmit: (input: EntryActionInput) => void
  onCancel: () => void
}) {
  const isEdit = !!entry

  const [playerId, setPlayerId] = useState(entry?.player_id ?? '')
  const [teamId, setTeamId] = useState(entry?.team_id ?? '')
  const [gross, setGross] = useState(entry?.gross_score != null ? String(entry.gross_score) : '')
  const [handicap, setHandicap] = useState(
    entry?.handicap_used != null ? String(entry.handicap_used) : ''
  )
  const [position, setPosition] = useState(
    entry?.finish_position != null ? String(entry.finish_position) : ''
  )
  const [points, setPoints] = useState(
    entry?.points_awarded != null ? String(entry.points_awarded) : ''
  )
  const [pointsManual, setPointsManual] = useState(false)

  // Auto-fill handicap + team from player on player change (add mode only)
  useEffect(() => {
    if (isEdit) return
    const player = players.find((p) => p.id === playerId)
    if (player) {
      setHandicap(String(player.handicap))
      if (playerTeamMap) {
        setTeamId(playerTeamMap[playerId] ?? '')
      }
    } else {
      setHandicap('')
    }
  }, [playerId, isEdit, players, playerTeamMap])

  // Auto-fill points from position mapping when position changes
  useEffect(() => {
    if (pointsManual) return
    const pos = parseInt(position)
    if (!isNaN(pos) && pos > 0) {
      const pts = lookupPointsForPosition(pos, ppMapping)
      setPoints(pts !== null ? String(pts) : '')
    } else {
      setPoints('')
    }
  }, [position, pointsManual, ppMapping])

  const computedNet = useMemo(() => {
    const g = parseFloat(gross)
    const h = parseFloat(handicap)
    if (!isNaN(g) && !isNaN(h)) return Math.round(g - h)
    return null
  }, [gross, handicap])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!playerId) return
    onSubmit({
      player_id: playerId,
      team_id: teamId || null,
      gross_score: gross ? parseInt(gross) : null,
      handicap_used: handicap ? parseFloat(handicap) : null,
      net_score: computedNet,
      finish_position: position ? parseInt(position) : null,
      points_awarded: points !== '' ? parseFloat(points) : null,
    })
  }

  const currentPlayer = players.find((p) => p.id === playerId)

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border border-white/10 rounded-lg p-3 bg-gray-700/30">
      <h4 className="text-xs font-semibold text-gray-300">
        {isEdit ? `Edit: ${players.find((p) => p.id === entry?.player_id)?.full_name ?? 'Entry'}` : 'New Entry'}
      </h4>
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs text-gray-400 mb-1">Player *</label>
          <select
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            disabled={isEdit}
            required
            className="bg-gray-700 border border-white/20 rounded px-3 py-2 text-sm text-white w-full disabled:opacity-50"
          >
            <option value="">— select —</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} (hcp {p.handicap})
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs text-gray-400 mb-1">Team</label>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="bg-gray-700 border border-white/20 rounded px-3 py-2 text-sm text-white w-full"
          >
            <option value="">— none —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Gross Score</label>
          <input
            type="number"
            value={gross}
            onChange={(e) => setGross(e.target.value)}
            min={18}
            max={200}
            className="bg-gray-700 border border-white/20 rounded px-3 py-2 text-sm text-white w-full"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Handicap Used
            {currentPlayer && !isEdit && (
              <span className="text-gray-500 ml-1">(player: {currentPlayer.handicap})</span>
            )}
          </label>
          <input
            type="number"
            value={handicap}
            onChange={(e) => setHandicap(e.target.value)}
            min={0}
            max={54}
            step={0.1}
            className="bg-gray-700 border border-white/20 rounded px-3 py-2 text-sm text-white w-full"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Net Score</label>
          <div className="bg-gray-600 border border-white/10 rounded px-3 py-2 text-sm text-gray-300 h-10 flex items-center">
            {computedNet !== null ? computedNet : '—'}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Finish Position</label>
          <input
            type="number"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            min={1}
            className="bg-gray-700 border border-white/20 rounded px-3 py-2 text-sm text-white w-full"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs text-gray-400 mb-1">
            Points Awarded
            {!pointsManual && <span className="text-gray-500 ml-1">(auto)</span>}
            {pointsManual && <span className="text-yellow-400 ml-1">(manual)</span>}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={points}
              onChange={(e) => { setPoints(e.target.value); setPointsManual(true) }}
              min={0}
              step={0.5}
              className="bg-gray-700 border border-white/20 rounded px-3 py-2 text-sm text-white flex-1"
            />
            {pointsManual && (
              <button
                type="button"
                onClick={() => { setPointsManual(false); setPosition((p) => p) }}
                className="text-xs text-gray-400 hover:text-white px-2"
                title="Reset to auto"
              >
                ↺
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending || !playerId}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
        >
          {isPending ? 'Saving…' : isEdit ? 'Save Entry' : 'Add Entry'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="text-sm text-gray-400 hover:text-white px-3 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function TournamentPanel({ tournament, seasonId, type, players, teams, playerTeamMap }: Props) {
  const router = useRouter()
  const label = TYPE_LABELS[type]

  // Meta form state
  const [showMetaForm, setShowMetaForm] = useState(false)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [metaPending, startMetaTransition] = useTransition()
  const [showDeleteTournament, setShowDeleteTournament] = useState(false)

  // Position points state
  const [ppRows, setPpRows] = useState<PPRow[]>([])
  const [ppLoaded, setPpLoaded] = useState(false)
  const [ppSaving, setPpSaving] = useState(false)
  const [ppError, setPpError] = useState<string | null>(null)

  // Entries state
  const [entries, setEntries] = useState<TournamentEntry[]>([])
  const [entriesLoaded, setEntriesLoaded] = useState(false)
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [editEntry, setEditEntry] = useState<TournamentEntry | undefined>()
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null)
  const [entryPending, startEntryTransition] = useTransition()
  const [entryError, setEntryError] = useState<string | null>(null)

  // Load position points + entries when tournament ID changes (not every prop update)
  useEffect(() => {
    if (!tournament) return
    getTournamentDataAction(tournament.id).then((result) => {
      if ('error' in result) return
      setPpRows(
        result.positionPoints.map((r) => ({
          finish_position: String(r.finish_position),
          points: String(r.points),
        }))
      )
      setEntries(result.entries)
      setPpLoaded(true)
      setEntriesLoaded(true)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament?.id])

  // Position mapping for auto-fill
  const ppMapping = useMemo(
    () =>
      ppRows
        .filter((r) => r.finish_position && r.points)
        .map((r) => ({
          finish_position: parseInt(r.finish_position),
          points: parseFloat(r.points),
        }))
        .filter((r) => !isNaN(r.finish_position) && !isNaN(r.points)),
    [ppRows]
  )

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleMetaSubmit(date: string, course: string, posterUrl: string) {
    setMetaError(null)
    const fd = new FormData()
    fd.set('tournament_date', date)
    fd.set('course', course)
    fd.set('poster_url', posterUrl)

    startMetaTransition(async () => {
      const result = tournament
        ? await updateTournamentAction(tournament.id, fd)
        : await createTournamentAction(seasonId, type, fd)
      if ('error' in result) {
        setMetaError(result.error)
      } else {
        setShowMetaForm(false)
        router.refresh()
      }
    })
  }

  function handleDeleteTournament() {
    startMetaTransition(async () => {
      const result = await deleteTournamentAction(tournament!.id)
      if ('error' in result) {
        setMetaError(result.error)
      } else {
        setShowDeleteTournament(false)
        router.refresh()
      }
    })
  }

  async function handleSavePositionPoints() {
    setPpError(null)
    const rows = ppMapping
    setPpSaving(true)
    const result = await savePositionPointsAction(tournament!.id, rows)
    setPpSaving(false)
    if ('error' in result) {
      setPpError(result.error)
    }
  }

  function handleEntrySubmit(input: EntryActionInput) {
    setEntryError(null)
    startEntryTransition(async () => {
      let result
      if (editEntry) {
        const { player_id: _, ...rest } = input
        result = await updateTournamentEntryAction(editEntry.id, rest)
      } else {
        result = await createTournamentEntryAction(tournament!.id, input)
      }
      if ('error' in result) {
        setEntryError(result.error)
        return
      }
      setShowEntryForm(false)
      setEditEntry(undefined)
      // Refresh entries list
      const refresh = await getTournamentEntriesAction(tournament!.id)
      if ('data' in refresh) setEntries(refresh.data)
      router.refresh()
    })
  }

  function handleDeleteEntry(id: string) {
    startEntryTransition(async () => {
      const result = await deleteTournamentEntryAction(id)
      if ('error' in result) {
        setEntryError(result.error)
      } else {
        setDeleteEntryId(null)
        setEntries((prev) => prev.filter((e) => e.id !== id))
        router.refresh()
      }
    })
  }

  function handleOpenEditEntry(entry: TournamentEntry) {
    setEditEntry(entry)
    setEntryError(null)
    setShowEntryForm(true)
    setDeleteEntryId(null)
  }

  function handleOpenAddEntry() {
    setEditEntry(undefined)
    setEntryError(null)
    setShowEntryForm(true)
    setDeleteEntryId(null)
  }

  function playerName(id: string) {
    return players.find((p) => p.id === id)?.full_name ?? id.slice(0, 8)
  }
  function teamName(id: string | null) {
    if (!id) return '—'
    return teams.find((t) => t.id === id)?.name ?? id.slice(0, 8)
  }

  // Import here to avoid circular issues — getTournamentEntriesAction
  // is already imported at the top of the file

  return (
    <div className="space-y-6">
      {/* ── Tournament Meta ── */}
      <div className="bg-gray-800 border border-white/10 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">{label} Tournament</h3>
          {tournament && !showMetaForm && !showDeleteTournament && (
            <div className="flex gap-3">
              <button
                onClick={() => { setShowMetaForm(true); setMetaError(null) }}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Edit
              </button>
              <button
                onClick={() => setShowDeleteTournament(true)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* View: no tournament */}
        {!tournament && !showMetaForm && (
          <div className="space-y-2">
            <p className="text-sm text-gray-400">No {label} tournament for this season.</p>
            <button
              onClick={() => { setShowMetaForm(true); setMetaError(null) }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded"
            >
              Create Tournament
            </button>
          </div>
        )}

        {/* View: tournament exists */}
        {tournament && !showMetaForm && !showDeleteTournament && (
          <div className="text-sm text-gray-300 space-y-1">
            <p>
              <span className="text-gray-500">Date: </span>
              {tournament.tournament_date ?? '—'}
            </p>
            <p>
              <span className="text-gray-500">Course: </span>
              {tournament.course ?? '—'}
            </p>
            {tournament.poster_url && (
              <p>
                <span className="text-gray-500">Poster: </span>
                <a
                  href={tournament.poster_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline break-all"
                >
                  {tournament.poster_url}
                </a>
              </p>
            )}
          </div>
        )}

        {/* Delete confirm */}
        {showDeleteTournament && (
          <div className="space-y-2">
            <p className="text-sm text-yellow-400">
              Delete this tournament? This will also delete all position points and entries.
            </p>
            {metaError && <p className="text-red-400 text-sm">{metaError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleDeleteTournament}
                disabled={metaPending}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
              >
                {metaPending ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setShowDeleteTournament(false)}
                disabled={metaPending}
                className="text-sm text-gray-400 hover:text-white px-3 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Create / Edit form */}
        {showMetaForm && (
          <MetaForm
            initial={{
              date: tournament?.tournament_date ?? '',
              course: tournament?.course ?? '',
              posterUrl: tournament?.poster_url ?? '',
            }}
            isEdit={!!tournament}
            isPending={metaPending}
            error={metaError}
            tournamentType={type}
            onSubmit={handleMetaSubmit}
            onCancel={() => { setShowMetaForm(false); setMetaError(null) }}
          />
        )}
      </div>

      {/* ── Position Points ── */}
      {tournament && (
        <div className="bg-gray-800 border border-white/10 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-200">Position Points</h3>

          {!ppLoaded && <p className="text-xs text-gray-500">Loading…</p>}

          {ppLoaded && (
            <>
              {ppError && <p className="text-red-400 text-sm">{ppError}</p>}

              <div className="space-y-2">
                {ppRows.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs text-gray-400 w-16 shrink-0">Position</span>
                      <input
                        type="number"
                        value={row.finish_position}
                        min={1}
                        onChange={(e) => {
                          setPpRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, finish_position: e.target.value } : r
                            )
                          )
                        }}
                        className="bg-gray-700 border border-white/20 rounded px-2 py-1 text-sm text-white w-16"
                      />
                      <span className="text-xs text-gray-400 w-12 shrink-0">Points</span>
                      <input
                        type="number"
                        value={row.points}
                        min={0}
                        step={0.5}
                        onChange={(e) => {
                          setPpRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, points: e.target.value } : r
                            )
                          )
                        }}
                        className="bg-gray-700 border border-white/20 rounded px-2 py-1 text-sm text-white w-20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setPpRows((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:text-red-300 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setPpRows((prev) => [...prev, { finish_position: '', points: '' }])}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  + Add position
                </button>
              </div>

              <button
                type="button"
                onClick={handleSavePositionPoints}
                disabled={ppSaving}
                className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded"
              >
                {ppSaving ? 'Saving…' : 'Save Points Table'}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Entries ── */}
      {tournament && (
        <div className="bg-gray-800 border border-white/10 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-200">
              Entries {entriesLoaded && `(${entries.length})`}
            </h3>
            {!showEntryForm && (
              <button
                onClick={handleOpenAddEntry}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                + Add Entry
              </button>
            )}
          </div>

          {!entriesLoaded && <p className="text-xs text-gray-500">Loading…</p>}

          {/* Entry form */}
          {showEntryForm && (
            <EntryForm
              entry={editEntry}
              players={players}
              teams={teams}
              ppMapping={ppMapping}
              playerTeamMap={playerTeamMap}
              isPending={entryPending}
              error={entryError}
              onSubmit={handleEntrySubmit}
              onCancel={() => { setShowEntryForm(false); setEditEntry(undefined); setEntryError(null) }}
            />
          )}

          {entryError && !showEntryForm && (
            <p className="text-red-400 text-sm">{entryError}</p>
          )}

          {/* Entries list */}
          {entriesLoaded && entries.length === 0 && !showEntryForm && (
            <p className="text-sm text-gray-400">No entries yet.</p>
          )}

          {entries.length > 0 && (
            <div className="space-y-2">
              {entries.map((entry) => {
                const isDeleting = deleteEntryId === entry.id
                return (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between gap-2 bg-gray-700/40 rounded p-2"
                  >
                    <div className="flex-1 min-w-0 text-sm">
                      <span className="font-medium text-white">{playerName(entry.player_id)}</span>
                      <span className="text-gray-400 text-xs ml-2">{teamName(entry.team_id)}</span>
                      <div className="text-xs text-gray-400 mt-0.5 flex gap-3 flex-wrap">
                        {entry.gross_score != null && <span>Gross: {entry.gross_score}</span>}
                        {entry.handicap_used != null && <span>HCP: {entry.handicap_used}</span>}
                        {entry.net_score != null && <span>Net: {entry.net_score}</span>}
                        {entry.finish_position != null && <span>Pos: {entry.finish_position}</span>}
                        {entry.points_awarded != null && <span>Pts: {entry.points_awarded}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {!isDeleting && (
                        <>
                          <button
                            onClick={() => handleOpenEditEntry(entry)}
                            disabled={entryPending}
                            className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteEntryId(entry.id)}
                            disabled={entryPending}
                            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {isDeleting && (
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-yellow-400">Delete?</span>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            disabled={entryPending}
                            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteEntryId(null)}
                            className="text-xs text-gray-400 hover:text-white"
                          >
                            No
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
