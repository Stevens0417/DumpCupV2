import PageHeader from '@/components/layout/PageHeader'
import GalleryGrid from '@/components/gallery/GalleryGrid'
import { getGalleryImages } from '@/lib/db/gallery'

export default async function GalleryPage() {
  const images = await getGalleryImages()

  return (
    <div className="pb-4">
      <PageHeader title="Gallery" subtitle="Tournament photos" />
      <div className="px-4">
        <GalleryGrid images={images} />
      </div>
    </div>
  )
}
