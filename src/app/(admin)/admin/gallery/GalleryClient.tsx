'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Season, GalleryImage } from '@/types/database'
import {
  saveGalleryImageAction,
  updateGalleryImageAction,
  deleteGalleryImageAction,
  swapGalleryOrderAction,
} from './actions'

type Props = {
  seasons: Season[]
  selectedFilter: string // 'all' or season uuid
  images: GalleryImage[]
}

export default function GalleryClient({ seasons, selectedFilter, images }: Props) {
  const router = useRouter()

  // Upload form
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadCaption, setUploadCaption] = useState('')
  const [uploadSeasonId, setUploadSeasonId] = useState(
    selectedFilter !== 'all' ? selectedFilter : ''
  )
  const [uploadKey, setUploadKey] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Edit state
  const [editId, setEditId] = useState<string | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [editSeasonId, setEditSeasonId] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [storageWarning, setStorageWarning] = useState<string | null>(null)

  // Reorder state
  const [isReordering, setIsReordering] = useState(false)

  const sortedImages = [...images].sort((a, b) => a.position_order - b.position_order)

  function handleSeasonFilter(value: string) {
    router.push(`/admin/gallery?season=${value}`)
  }

  function seasonYear(id: string | null): string {
    if (!id) return 'No season'
    return String(seasons.find((s) => s.id === id)?.year ?? id)
  }

  // ── Upload ──────────────────────────────────────────────────────────────────

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!uploadFile) {
      setUploadError('Select a file first.')
      return
    }
    if (!uploadFile.type.startsWith('image/')) {
      setUploadError('Only image files are allowed.')
      return
    }
    setIsUploading(true)
    setUploadError(null)

    try {
      const supabase = createClient()
      const timestamp = Date.now()
      const safeName = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const season = seasons.find((s) => s.id === uploadSeasonId)
      const folder = season ? `season-${season.year}` : 'uncategorized'
      const storagePath = `${folder}/${timestamp}-${safeName}`

      const { error: storageError } = await supabase.storage
        .from('gallery')
        .upload(storagePath, uploadFile, { contentType: uploadFile.type })

      if (storageError) {
        setUploadError(`Upload failed: ${storageError.message}`)
        return
      }

      const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(storagePath)

      const result = await saveGalleryImageAction({
        publicUrl: urlData.publicUrl,
        seasonId: uploadSeasonId || null,
        caption: uploadCaption.trim() || null,
      })

      if ('error' in result) {
        setUploadError(result.error)
      } else {
        setUploadFile(null)
        setUploadCaption('')
        setUploadKey((k) => k + 1)
        router.refresh()
      }
    } finally {
      setIsUploading(false)
    }
  }

  // ── Edit ─────────────────────────────────────────────────────────────────────

  function openEdit(img: GalleryImage) {
    setEditId(img.id)
    setEditCaption(img.caption ?? '')
    setEditSeasonId(img.season_id ?? '')
    setEditError(null)
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editId) return
    setIsEditing(true)
    setEditError(null)
    const result = await updateGalleryImageAction(
      editId,
      editCaption.trim() || null,
      editSeasonId || null
    )
    setIsEditing(false)
    if ('error' in result) {
      setEditError(result.error)
    } else {
      setEditId(null)
      router.refresh()
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  function confirmDelete(img: GalleryImage) {
    setDeleteTarget(img)
    setDeleteError(null)
    setStorageWarning(null)
  }

  async function handleDeleteExecute() {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteError(null)
    const result = await deleteGalleryImageAction(deleteTarget.id, deleteTarget.image_url)
    setIsDeleting(false)
    if ('error' in result) {
      setDeleteError(result.error)
    } else {
      setDeleteTarget(null)
      if ('storageWarning' in result && result.storageWarning) {
        setStorageWarning(result.storageWarning)
      }
      router.refresh()
    }
  }

  // ── Reorder ──────────────────────────────────────────────────────────────────

  async function handleReorder(img: GalleryImage, direction: 'up' | 'down') {
    const idx = sortedImages.findIndex((i) => i.id === img.id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === sortedImages.length - 1) return
    const swapWith = direction === 'up' ? sortedImages[idx - 1] : sortedImages[idx + 1]
    setIsReordering(true)
    await swapGalleryOrderAction(img.id, img.position_order, swapWith.id, swapWith.position_order)
    setIsReordering(false)
    router.refresh()
  }

  // ── Styles ───────────────────────────────────────────────────────────────────

  const inputCls =
    'w-full bg-gray-800 border border-white/20 rounded px-3 py-2 text-sm text-white placeholder:text-gray-600'
  const labelCls = 'block text-xs text-gray-400 mb-1'
  const btnSm = 'text-xs px-2 py-1 rounded border border-white/20 text-gray-400 hover:text-white transition-colors disabled:opacity-40'

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Gallery</h1>

      {/* Storage warning banner */}
      {storageWarning && (
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-950/30 p-3 flex items-start gap-3">
          <p className="text-yellow-300 text-sm flex-1">{storageWarning}</p>
          <button
            onClick={() => setStorageWarning(null)}
            className="text-yellow-500 hover:text-yellow-300 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Season filter */}
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <label className={labelCls}>Filter by Season</label>
          <select
            className="bg-gray-800 border border-white/20 rounded px-3 py-2 text-sm text-white"
            value={selectedFilter}
            onChange={(e) => handleSeasonFilter(e.target.value)}
          >
            <option value="all">All Seasons</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload section */}
      <div className="rounded-xl border border-white/10 bg-gray-800/60 p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Upload Image</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          {uploadError && <p className="text-red-400 text-sm">{uploadError}</p>}

          <div>
            <label className={labelCls}>Image File *</label>
            <input
              key={uploadKey}
              type="file"
              accept="image/*"
              required
              className="w-full text-sm text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-gray-700 file:text-white file:text-xs file:cursor-pointer"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Caption</label>
              <input
                type="text"
                className={inputCls}
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                placeholder="Optional caption"
              />
            </div>
            <div>
              <label className={labelCls}>Season</label>
              <select
                className={inputCls}
                value={uploadSeasonId}
                onChange={(e) => setUploadSeasonId(e.target.value)}
              >
                <option value="">— none —</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded transition-colors"
          >
            {isUploading ? 'Uploading…' : 'Upload'}
          </button>
        </form>
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-4 flex items-center gap-4 flex-wrap">
          <p className="text-sm text-red-300 flex-1">
            Delete &ldquo;{deleteTarget.caption ?? 'this image'}&rdquo;? This cannot be undone.
          </p>
          {deleteError && <p className="text-red-400 text-sm">{deleteError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleDeleteExecute}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded"
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="border border-white/20 text-gray-400 hover:text-white text-sm px-4 py-1.5 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Gallery grid */}
      {sortedImages.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-10">
          No images yet. Upload one above.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sortedImages.map((img, idx) => (
            <div
              key={img.id}
              className="rounded-lg overflow-hidden border border-white/10 bg-gray-800/60"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url}
                alt={img.caption ?? ''}
                className="w-full aspect-square object-cover bg-gray-900"
              />

              {editId === img.id ? (
                // Inline edit form
                <form onSubmit={handleEditSave} className="p-3 space-y-2">
                  {editError && <p className="text-red-400 text-xs">{editError}</p>}
                  <input
                    type="text"
                    className="w-full bg-gray-700 border border-white/20 rounded px-2 py-1.5 text-xs text-white placeholder:text-gray-600"
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    placeholder="Caption"
                  />
                  <select
                    className="w-full bg-gray-700 border border-white/20 rounded px-2 py-1.5 text-xs text-white"
                    value={editSeasonId}
                    onChange={(e) => setEditSeasonId(e.target.value)}
                  >
                    <option value="">— no season —</option>
                    {seasons.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.year}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isEditing}
                      className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded"
                    >
                      {isEditing ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="text-xs text-gray-400 hover:text-white border border-white/20 rounded px-3 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                // Static info + actions
                <div className="p-3 space-y-2">
                  <p className="text-xs text-white truncate">{img.caption ?? '—'}</p>
                  <p className="text-xs text-gray-500">
                    {seasonYear(img.season_id)} &middot; #{img.position_order}
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => openEdit(img)}
                      disabled={!!editId || !!deleteTarget}
                      className={btnSm + ' text-blue-400 hover:text-blue-300 border-blue-400/30'}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleReorder(img, 'up')}
                      disabled={isReordering || idx === 0}
                      className={btnSm}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleReorder(img, 'down')}
                      disabled={isReordering || idx === sortedImages.length - 1}
                      className={btnSm}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => confirmDelete(img)}
                      disabled={!!editId || !!deleteTarget}
                      className={btnSm + ' text-red-400 hover:text-red-300 border-red-400/30'}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
