import { useState } from 'react'
import type { DesignConfig, DesignElement } from '@/types/design'
import type { Guest } from '@/types'
import { normalizeUrl } from '@/stores/useDesignStore'
import { MapModal } from '@/components/ui/MapModal'
import { getElementMapLocation, hasMapLocation, type MapLocation } from '@/lib/map'
import { MapPin } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  config: DesignConfig
  guest?: Guest | null
  // If provided, we are in Editor mode
  onElementClick?: (id: string, e: React.MouseEvent) => void
  selectedId?: string | null
  // Optional scale for previewing
  scale?: number
  isConfirmed?: boolean
  onConfirm?: () => void
}

interface MapTarget extends Pick<MapLocation, 'lat' | 'lng' | 'query' | 'label'> {}

// Helper to render dynamic content
const renderContent = (el: DesignElement, guest?: Guest | null, isConfirmed?: boolean) => {
  if (el.type === 'dynamic' && el.field === 'full_name') {
    return guest?.full_name || 'Tên Khách Mời'
  }
  if (el.type === 'button') {
     return isConfirmed ? 'Đã xác nhận tham dự' : (el.content || 'Xác nhận tham dự')
  }
  return el.content
}

function AddressLine({
  text,
  onOpenMap,
  isEditor,
}: {
  text: string
  onOpenMap: () => void
  isEditor: boolean
}) {
  if (isEditor) {
    return <span>{text}</span>
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onOpenMap()
      }}
      className={clsx(
        'group inline-flex items-center justify-center gap-1.5 max-w-full',
        'cursor-pointer transition-all duration-300',
        'hover:drop-shadow-[0_0_10px_rgba(251,191,36,0.55)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fcd34d]/50 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent rounded-sm'
      )}
    >
      <MapPin
        size={13}
        className="shrink-0 text-[#fcd34d]/70 group-hover:text-[#fcd34d] group-hover:scale-110 transition-all"
      />
      <span className="underline decoration-[#fcd34d]/35 underline-offset-[5px] group-hover:decoration-[#fcd34d]/80 group-hover:text-[#fef3c7] transition-colors">
        {text}
      </span>
    </button>
  )
}

function TextElementContent({
  el,
  guest,
  isEditor,
  onOpenMap,
}: {
  el: DesignElement
  guest?: Guest | null
  isEditor: boolean
  onOpenMap: (target: MapTarget) => void
}) {
  const content = renderContent(el, guest)
  const mapLocation = getElementMapLocation(el)
  const canOpenMap = hasMapLocation(el)

  if (!canOpenMap || !content) {
    return <>{content}</>
  }

  const openMap = (label: string) =>
    onOpenMap({ ...mapLocation, label })

  const lines = content.split('\n')

  if (lines.length > 1) {
    const addressLine = lines[lines.length - 1]
    const prefixLines = lines.slice(0, -1)

    return (
      <>
        {prefixLines.join('\n')}
        {'\n'}
        <AddressLine
          text={addressLine}
          isEditor={isEditor}
          onOpenMap={() => openMap(addressLine)}
        />
      </>
    )
  }

  if (isEditor) {
    return <>{content}</>
  }

  return (
    <AddressLine
      text={content}
      isEditor={false}
      onOpenMap={() => openMap(content)}
    />
  )
}

export function InvitationRenderer({ config, guest, onElementClick, selectedId, scale = 1, isConfirmed, onConfirm }: Props) {
  const [mapTarget, setMapTarget] = useState<MapTarget | null>(null)
  const isEditor = Boolean(onElementClick)

  return (
    <>
      <div 
        className="relative overflow-hidden shadow-sm transition-colors duration-300"
        style={{
          width: config.width,
          height: config.height,
          backgroundColor: config.background.color,
          backgroundImage: config.background.image ? `url(${normalizeUrl(config.background.image)})` : undefined,
          transform: `scale(${scale})`,
          transformOrigin: 'top left'
        }}
      >
        {config.elements.map((el) => {
          const isSelected = selectedId === el.id
          
          if (el.type === 'button') {
              return (
                  <button
                      key={el.id}
                      onClick={(e) => {
                          if (onElementClick) {
                              onElementClick(el.id, e)
                          } else if (onConfirm) {
                              onConfirm()
                          }
                      }}
                      className={clsx(
                          "absolute transition-all flex items-center justify-center font-bold shadow-lg rounded-xl px-4 py-2 text-center",
                          onElementClick ? "cursor-move" : (isConfirmed ? "cursor-default border-2 border-emerald-200" : "cursor-pointer active:scale-95"),
                          isSelected && "ring-2 ring-blue-600 z-50"
                      )}
                      style={{
                          left: el.x,
                          top: el.y,
                          width: el.width,
                          height: el.height,
                          ...el.style,
                          backgroundColor: isConfirmed ? '#ecfdf5' : (el.style.backgroundColor || '#064e3b'),
                          color: isConfirmed ? '#047857' : (el.style.color || '#ffffff'),
                          transform: `rotate(${el.rotation || 0}deg)`
                      }}
                  >
                      {renderContent(el, guest, isConfirmed)}
                  </button>
              )
          }

          if (el.type === 'image') {
              return (
                  <div
                      key={el.id}
                      onClick={(e) => onElementClick && onElementClick(el.id, e)}
                      className={clsx(
                          "absolute transition-all cursor-default select-none",
                          onElementClick && "cursor-pointer hover:ring-1 hover:ring-blue-400",
                          isSelected && "ring-2 ring-blue-600 z-50"
                      )}
                      style={{
                          left: el.x,
                          top: el.y,
                          width: el.width,
                          height: el.height,
                          ...el.style,
                          transform: `rotate(${el.rotation || 0}deg)`
                      }}
                  >
                      {normalizeUrl(el.content) && (
                          <img 
                              src={normalizeUrl(el.content)} 
                              alt="element" 
                              className="w-full h-full object-cover pointer-events-none" 
                          />
                      )}
                  </div>
              )
          }

          const hasMap = hasMapLocation(el)

          return (
              <div
                  key={el.id}
                  onClick={(e) => onElementClick && onElementClick(el.id, e)}
                  className={clsx(
                      "absolute transition-all select-none whitespace-pre-wrap",
                      onElementClick ? "cursor-pointer hover:ring-1 hover:ring-blue-400" : (hasMap ? "cursor-default" : "cursor-default"),
                      isSelected && "ring-2 ring-blue-600 z-50"
                  )}
                  style={{
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      ...el.style,
                      color: el.style.color || 'inherit',
                      transform: `rotate(${el.rotation || 0}deg)`
                  }}
              >
                  <TextElementContent
                    el={el}
                    guest={guest}
                    isEditor={isEditor}
                    onOpenMap={setMapTarget}
                  />
              </div>
          )
        })}
      </div>

      {mapTarget && (
        <MapModal
          lat={mapTarget.lat}
          lng={mapTarget.lng}
          query={mapTarget.query}
          label={mapTarget.label}
          onClose={() => setMapTarget(null)}
        />
      )}
    </>
  )
}
