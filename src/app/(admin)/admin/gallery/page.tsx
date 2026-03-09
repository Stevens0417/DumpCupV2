import { listSeasons } from '@/lib/db/seasons'
import { listGalleryImages } from '@/lib/db/gallery'
import GalleryClient from './GalleryClient'

export default async function AdminGalleryPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const rawFilter = typeof searchParams.season === 'string' ? searchParams.season : 'all'
  const seasonId = rawFilter === 'all' ? null : rawFilter

  const [seasons, images] = await Promise.all([
    listSeasons(),
    listGalleryImages(seasonId),
  ])

  return (
    <GalleryClient
      seasons={seasons}
      selectedFilter={rawFilter}
      images={images}
    />
  )
}
