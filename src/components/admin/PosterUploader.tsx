'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  currentUrl: string | null
  tournamentType: string
  onUpload: (url: string) => void
}

export default function PosterUploader({ currentUrl, tournamentType, onUpload }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${tournamentType}/${Date.now()}-poster.${ext}`
    const supabase = createClient()

    // Best-effort delete old file
    if (currentUrl) {
      try {
        const marker = '/tournament-posters/'
        const idx = currentUrl.indexOf(marker)
        if (idx >= 0) {
          await supabase.storage
            .from('tournament-posters')
            .remove([currentUrl.slice(idx + marker.length)])
        }
      } catch {
        // ignore
      }
    }

    const { error: uploadError } = await supabase.storage
      .from('tournament-posters')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('tournament-posters').getPublicUrl(path)
    onUpload(data.publicUrl)
    setUploading(false)
    // Reset input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">Poster Image</label>
      {currentUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={currentUrl} alt="Poster preview" className="h-24 rounded object-cover mb-2" />
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-3 py-1.5 text-xs bg-gray-800 border border-white/20 rounded text-gray-200 hover:bg-gray-700 disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : currentUrl ? 'Replace' : 'Upload'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
