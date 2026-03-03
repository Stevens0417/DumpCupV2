import { listPlayers } from '@/lib/db/players'
import PlayersClient from './PlayersClient'

export default async function AdminPlayersPage() {
  const players = await listPlayers()
  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Players</h1>
      <PlayersClient players={players} />
    </div>
  )
}
