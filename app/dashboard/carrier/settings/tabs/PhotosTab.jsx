'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Upload, X, ChevronLeft, ChevronRight, Star, ImageIcon } from 'lucide-react'

export default function PhotosTab({ carrierId, photos: initial }) {
  const [photos, setPhotos] = useState(initial ?? [])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  // Find the profile photo (first one, or explicitly marked)
  const profilePhotoIndex = 0 // first photo is always profile photo

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/carriers/settings/photos', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const json = await res.json()
        setPhotos((prev) => [...prev, json.data.url])
        toast.success('Photo uploaded')
        if (fileRef.current) fileRef.current.value = ''
      } else {
        const err = await res.json()
        toast.error(err.error ?? 'Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    }
    setUploading(false)
  }

  async function handleDelete(index) {
    const url = photos[index]
    // Extract key from URL
    const key = url.split('.com/')[1]
    if (!key) return

    const res = await fetch(
      `/api/carriers/settings/photos/remove?key=${encodeURIComponent(key)}`,
      { method: 'DELETE' },
    )
    if (res.ok) {
      setPhotos((prev) => prev.filter((_, i) => i !== index))
      toast.success('Photo removed')
    } else {
      toast.error('Failed to remove')
    }
  }

  async function handleMakeProfilePhoto(index) {
    if (index === 0) return
    const res = await fetch('/api/carriers/settings/photos/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromIndex: index, toIndex: 0 }),
    })
    if (res.ok) {
      const reordered = [...photos]
      const [moved] = reordered.splice(index, 1)
      reordered.unshift(moved)
      setPhotos(reordered)
      toast.success('Profile photo set')
    } else {
      toast.error('Failed to update')
    }
  }

  async function handleMove(index, direction) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= photos.length) return
    const reordered = [...photos]
    ;[reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]]
    setPhotos(reordered)

    // Persist reorder
    const res = await fetch('/api/carriers/settings/photos/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromIndex: index, toIndex: newIndex }),
    })
    if (!res.ok) {
      // Revert on failure
      setPhotos(photos)
      toast.error('Failed to reorder')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Photos</h2>

      {/* Upload CTA */}
      <label className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors mb-6">
        <Upload size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-sm font-medium text-gray-500">
          Click here to upload photos
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {uploading ? 'Uploading…' : 'JPG, PNG or WebP. Max 10MB.'}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          disabled={uploading}
        />
      </label>

      {/* Photo grid */}
      {photos.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          No photos yet. Upload photos of your fleet and vehicles.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((url, index) => {
            const isProfile = index === profilePhotoIndex
            return (
              <div
                key={index}
                className={`relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 ${
                  isProfile ? 'border-gray-900' : 'border-transparent'
                }`}
              >
                <img
                  src={url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  {/* Reorder arrows */}
                  <button
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0}
                    className="p-1.5 bg-white rounded-full text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <button
                    onClick={() => handleMove(index, 1)}
                    disabled={index === photos.length - 1}
                    className="p-1.5 bg-white rounded-full text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={14} />
                  </button>

                  {/* Make profile photo */}
                  {!isProfile && (
                    <button
                      onClick={() => handleMakeProfilePhoto(index)}
                      className="p-1.5 bg-white rounded-full text-amber-500 hover:bg-amber-50"
                      title="Make profile photo"
                    >
                      <Star size={14} />
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(index)}
                    className="p-1.5 bg-white rounded-full text-red-500 hover:bg-red-50"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Profile photo badge */}
                {isProfile && (
                  <div className="absolute top-2 left-2 bg-gray-900 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    Profile
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
