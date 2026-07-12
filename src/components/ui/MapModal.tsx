import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, Navigation, X, ExternalLink } from 'lucide-react'
import clsx from 'clsx'
import {
  getDirectionsUrl,
  getMapEmbedUrl,
  getOpenMapUrl,
  type MapLocation,
} from '@/lib/map'

interface Props extends Pick<MapLocation, 'lat' | 'lng' | 'query' | 'label'> {
  onClose: () => void
}

export function MapModal({ lat, lng, query, label, onClose }: Props) {
  const location = { lat, lng, query, label: label || '' }
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsVisible(true)
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const title = label || query || `${lat}, ${lng}`

  if (!mounted) return null

  return createPortal(
    <div
      className={clsx(
        "fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 transition-all duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl transition-opacity duration-300" />

      {/* Modal Container */}
      <div
        className={clsx(
          'relative w-full max-w-lg bg-white/95 backdrop-blur-3xl rounded-[2rem] shadow-2xl overflow-hidden transition-all duration-300 transform border border-white/20',
          isVisible ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-black/5 transition-all bg-white shadow-sm"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        <div className="p-7 sm:p-8">
          {/* Header */}
          <div className="mb-6 pr-10">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <MapPin size={18} />
              <span className="text-xs font-semibold tracking-wider uppercase">Địa điểm</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
              {title}
            </h3>
          </div>

          {/* Map */}
          <div className="relative rounded-2xl overflow-hidden border border-gray-200/60 shadow-inner bg-gray-50">
            <iframe
              title="Bản đồ địa điểm"
              src={getMapEmbedUrl(location)}
              className="w-full h-[250px] sm:h-[300px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          {/* Actions */}
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <a
              href={getDirectionsUrl(location)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 transition-all active:scale-95"
            >
              <Navigation size={18} />
              Chỉ đường
            </a>
            <a
              href={getOpenMapUrl(location)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all active:scale-95"
            >
              <ExternalLink size={18} />
              Google Maps
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
