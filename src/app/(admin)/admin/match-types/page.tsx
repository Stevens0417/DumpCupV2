import { listMatchTypes } from '@/lib/db/matchTypes'
import { listAllocations } from '@/lib/db/matchTypeAllocations'
import MatchTypesClient from './MatchTypesClient'

export default async function AdminMatchTypesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const matchTypes = await listMatchTypes()
  const selectedMtId = typeof searchParams.mt === 'string' ? searchParams.mt : null
  const selectedMt = selectedMtId ? (matchTypes.find((m) => m.id === selectedMtId) ?? null) : null
  const allocations = selectedMtId ? await listAllocations(selectedMtId) : []

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Match Types</h1>
      <MatchTypesClient
        matchTypes={matchTypes}
        selectedMt={selectedMt}
        allocations={allocations}
      />
    </div>
  )
}
