import type { DesignConfig, DesignElement } from '@/types/design'
import type { Guest } from '@/types'
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

export function InvitationRenderer({ config, guest, onElementClick, selectedId, scale = 1, isConfirmed, onConfirm }: Props) {
  return (
    <div 
      className="relative overflow-hidden shadow-sm transition-colors duration-300"
      style={{
        width: config.width,
        height: config.height,
        backgroundColor: config.background.color,
        backgroundImage: config.background.image ? `url(${config.background.image})` : undefined,
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
                        "absolute transition-all flex items-center justify-center font-bold shadow-lg rounded-xl",
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
                    <img 
                        src={el.content} 
                        alt="element" 
                        className="w-full h-full object-cover pointer-events-none" 
                    />
                </div>
            )
        }

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
                    color: el.style.color || 'inherit',
                    transform: `rotate(${el.rotation || 0}deg)`
                }}
            >
                {renderContent(el, guest)}
            </div>
        )
      })}
    </div>
  )
}
