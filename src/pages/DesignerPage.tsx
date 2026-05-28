import { useEffect, useRef, useState } from 'react'
import { useDesignStore, normalizeUrl } from '@/stores/useDesignStore'
import { Type, Save, GraduationCap, AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter, Undo, Redo, Layers, ArrowUp, RotateCw, Smile, Eye, X, Music, Volume2 } from 'lucide-react'
import clsx from 'clsx'

const FONTS = [
  { name: 'Merriweather', label: 'Merriweather (Serif)' },
  { name: 'Playfair Display', label: 'Playfair Display (Elegant)' },
  { name: 'Lora', label: 'Lora (Classic Serif)' },
  { name: 'Montserrat', label: 'Montserrat (Modern Sans)' },
  { name: 'Roboto', label: 'Roboto (Clean Sans)' },
  { name: 'Open Sans', label: 'Open Sans (Neutral Sans)' },
  { name: 'Quicksand', label: 'Quicksand (Round Sans)' },
  { name: 'Oswald', label: 'Oswald (Strong Sans)' },
  { name: 'Dancing Script', label: 'Dancing Script (Handwriting)' },
  { name: 'Great Vibes', label: 'Great Vibes (Calligraphy)' },
  { name: 'Pacifico', label: 'Pacifico (Retro Script)' },
  { name: 'Charm', label: 'Charm (Decorative Serif)' },
  { name: 'Saira Stencil One', label: 'Saira Stencil (Military)' },
  { name: 'sans-serif', label: 'Sans Serif (System Default)' },
]

export function DesignerPage() {
  const { 
      config, selectedElementId, loading, fetchConfig, saveConfig, 
      selectElement, updateElement, addElement, moveElement, updateBackground, updateMusic, uploadFile, removeElement,
      undo, redo, past, future, pushStateToHistory,
      bringToFront, sendToBack
  } = useDesignStore()
  
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [guides, setGuides] = useState<{ type: 'horizontal' | 'vertical', pos: number }[]>([])
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [musicDuration, setMusicDuration] = useState(0)
  const [activeTab, setActiveTab] = useState<'design' | 'music'>('design')
  const [isPlaying, setIsPlaying] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const lastAnalyzedUrl = useRef<string | null>(null)

  useEffect(() => {
    const url = config.music?.url
    if (url && url !== lastAnalyzedUrl.current) {
      lastAnalyzedUrl.current = url
      const audio = new Audio(url)
      audio.onloadedmetadata = () => {
        setMusicDuration(audio.duration)
        if (!config.music?.endTime || config.music.endTime === 0 || config.music.endTime > audio.duration) {
          updateMusic({ endTime: audio.duration }, false)
        }
      }
    } else if (!url && musicDuration !== 0) {
      lastAnalyzedUrl.current = null
      setMusicDuration(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.music?.url])
  const dragStartConfig = useRef(config)
  const hasMovedRef = useRef(false)

  useEffect(() => {
    fetchConfig()
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
      }
    }
  }, [fetchConfig])

  const playPreview = () => {
      if (!config.music?.url) return
      
      if (previewAudioRef.current) {
          previewAudioRef.current.pause()
      }
      
      const audio = new Audio(config.music.url)
      previewAudioRef.current = audio
      
      const start = config.music?.startTime || 0
      const end = config.music?.endTime || audio.duration
      
      audio.currentTime = start
      audio.play()
      setIsPlaying(true)
      
      const checkEnd = setInterval(() => {
          if (!previewAudioRef.current || previewAudioRef.current !== audio) {
              clearInterval(checkEnd)
              return
          }
          if (audio.currentTime >= end) {
              audio.pause()
              setIsPlaying(false)
              clearInterval(checkEnd)
          }
          if (audio.paused) {
              setIsPlaying(false)
              clearInterval(checkEnd)
          }
      }, 100)
  }

  const stopPreview = () => {
      if (previewAudioRef.current) {
          previewAudioRef.current.pause()
          previewAudioRef.current.currentTime = config.music?.startTime || 0
          setIsPlaying(false)
      }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!selectedElementId) return
        
        // Nudge with arrows
        const step = e.shiftKey ? 10 : 1
        let dx = 0
        let dy = 0
        
        if (e.key === 'ArrowLeft') dx = -step
        if (e.key === 'ArrowRight') dx = step
        if (e.key === 'ArrowUp') dy = -step
        if (e.key === 'ArrowDown') dy = step
        
        if (dx !== 0 || dy !== 0) {
            e.preventDefault()
            const el = config.elements.find(e => e.id === selectedElementId)
            if (el) {
                moveElement(selectedElementId, el.x + dx, el.y + dy)
            }
        }

        // Copy / Paste Shortcuts
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault() // Prevent native copy
            useDesignStore.getState().copyElement()
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            e.preventDefault()
            useDesignStore.getState().pasteElement()
        }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementId, config.elements, moveElement])

  // Handle Dragging
  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent, id: string, x: number, y: number) => {
    e.stopPropagation()
    // Snapshot config before drag starts
    dragStartConfig.current = config
    hasMovedRef.current = false
    
    selectElement(id)
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - x,
      y: e.clientY - y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElementId) return
    
    hasMovedRef.current = true

    // Raw calculated position
    let newX = e.clientX - dragOffset.x
    let newY = e.clientY - dragOffset.y
    const SNAP_THRESHOLD = 5
    const newGuides: { type: 'horizontal' | 'vertical', pos: number }[] = []

    // Get dimensions of dragging element
    const dragEl = document.getElementById(selectedElementId)
    if (dragEl) {
        const rect = dragEl.getBoundingClientRect()
        const w = rect.width
        const h = rect.height
        
        // Calculate current centers/edges based on newX/newY (relative to canvas)
        // newX/newY are top/left relative to canvas
        const centerX = newX + w / 2
        const centerY = newY + h / 2
        
        // --- Snap Candidates ---
        const candidatesX = [config.width / 2] // Canvas center
        const candidatesY = [config.height / 2]
        
        // Other elements
        config.elements.forEach(other => {
            if (other.id === selectedElementId) return
            const otherEl = document.getElementById(other.id)
            if (otherEl) {
                const r = otherEl.getBoundingClientRect()
                // Convert to relative vals if needed, but our stored x/y are relative. 
                // We trust dimensions from DOM but use stored X/Y for positions to be safe? 
                // Actually stored X/Y are "left/top".
                const ow = r.width
                const oh = r.height
                
                candidatesX.push(other.x) // Left
                candidatesX.push(other.x + ow / 2) // Center
                candidatesX.push(other.x + ow) // Right
                
                candidatesY.push(other.y) // Top
                candidatesY.push(other.y + oh / 2) // Center
                candidatesY.push(other.y + oh) // Bottom
            }
        })
        
        // --- Apply X Snapping ---
        // Check Left Edge, Center, Right Edge
        let snappedX = false
        
        // 1. Center to Candidates
        for (const cx of candidatesX) {
            if (Math.abs(centerX - cx) < SNAP_THRESHOLD) {
                newX = cx - w / 2
                newGuides.push({ type: 'vertical', pos: cx })
                snappedX = true
                break
            }
        }
        
        // 2. Left to Candidates (if not snapped center)
        if (!snappedX) {
             for (const cx of candidatesX) {
                if (Math.abs(newX - cx) < SNAP_THRESHOLD) {
                    newX = cx
                    newGuides.push({ type: 'vertical', pos: cx })
                    snappedX = true
                    break
                }
            }
        }
        
        // 3. Right to Candidates
         if (!snappedX) {
             for (const cx of candidatesX) {
                if (Math.abs((newX + w) - cx) < SNAP_THRESHOLD) {
                    newX = cx - w
                    newGuides.push({ type: 'vertical', pos: cx })
                    break
                }
            }
        }

        // --- Apply Y Snapping ---
        let snappedY = false
        // 1. Center
        for (const cy of candidatesY) {
            if (Math.abs(centerY - cy) < SNAP_THRESHOLD) {
                newY = cy - h / 2
                newGuides.push({ type: 'horizontal', pos: cy })
                snappedY = true
                break
            }
        }
        
        // 2. Top
        if (!snappedY) {
            for (const cy of candidatesY) {
                if (Math.abs(newY - cy) < SNAP_THRESHOLD) {
                    newY = cy
                    newGuides.push({ type: 'horizontal', pos: cy })
                    snappedY = true
                    break
                }
            }
        }

        // 3. Bottom
        if (!snappedY) {
            for (const cy of candidatesY) {
                if (Math.abs((newY + h) - cy) < SNAP_THRESHOLD) {
                    newY = cy - h
                    newGuides.push({ type: 'horizontal', pos: cy })
                    break
                }
            }
        }
    }
    
    // Axis Locking with Shift (Override snap if shift is held? Or Combine? Let's treat Shift as strict lock)
    if (e.shiftKey) {
        setGuides([]) // Hide guides when locking? Or show them? Let's hide to reduce noise or keep simple.
        
        // Determine dominant axis (re-using previous logic but simpler)
        const currentEl = config.elements.find(el => el.id === selectedElementId)
        if (currentEl) {
             const dx = Math.abs(newX - currentEl.x)
             const dy = Math.abs(newY - currentEl.y)
             if (dx > dy) newY = currentEl.y
             else newX = currentEl.x
        }
    } else {
        setGuides(newGuides)
    }
    
    moveElement(selectedElementId, newX, newY)
  }

  const handleMouseUp = () => {
    if (isDragging && hasMovedRef.current) {
        pushStateToHistory(dragStartConfig.current)
    }
    setIsDragging(false)
    setGuides([])
  }

  // Icon Categories
  const ICON_CATEGORIES = {
      'Tình yêu & Cưới': ['❤️', '💍', '💐', '💒', '💌', '💕', '💑', '🕊️', '🌹', '✨'],
      'Tiệc tùng': ['🎂', '🎈', '🍾', '🥂', '🎁', '🕯️', '🎉', '🎊', '🎵', '🍰'],
      'Địa điểm & Chỉ dẫn': ['📍', '🗺️', '🏠', '⛪', '🚗', '✈️', '🅿️', '🕐', '📅', '📞'],
      'Biểu tượng khác': ['⭐', '🎓', '📸', '👗', '👔', '👠', '👑', '💎', '🦄', '🍀']
  }

  // Helper to add new text
  const addTextCheck = () => {
    addElement({
        id: `text_${Date.now()}`,
        type: 'text',
        content: 'New Text',
        x: 50,
        y: 50,
        style: { fontSize: '16px', color: '#000000', fontWeight: 'normal' }
    })
  }

  return (
    <div 
        className="min-h-screen bg-slate-100 flex flex-col md:flex-row"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
    >
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col h-[40vh] md:h-screen z-10 shadow-lg">
         {/* Scrollable area */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-6">
                 <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <GraduationCap size={24} className="text-indigo-600" />
                    Thiết kế
                 </h1>
                 <div className="flex gap-2">
                     <button 
                        onClick={undo} 
                        disabled={past.length === 0}
                        className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"
                        title="Hoàn tác"
                     >
                         <Undo size={16} />
                     </button>
                     <button 
                        onClick={redo} 
                        disabled={future.length === 0}
                        className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"
                        title="Làm lại"
                     >
                         <Redo size={16} />
                     </button>
                 </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b border-slate-100 mb-6">
                 <button 
                    onClick={() => setActiveTab('design')}
                    className={clsx(
                        "flex-1 py-3 text-[10px] font-bold transition-all border-b-2 tracking-widest",
                        activeTab === 'design' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                 >
                     THIẾT KẾ
                 </button>
                 <button 
                    onClick={() => setActiveTab('music')}
                    className={clsx(
                        "flex-1 py-3 text-[10px] font-bold transition-all border-b-2 tracking-widest",
                        activeTab === 'music' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                 >
                     NHẠC NỀN
                 </button>
            </div>

            {activeTab === 'design' ? (
                <div className="space-y-6">
                    {/* Add Elements Section */}
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Thêm phần tử</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={addTextCheck} className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 text-sm font-medium">
                                <Type size={16} /> Văn bản
                            </button>
                            
                            <label className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 text-sm font-medium cursor-pointer">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            const reader = new FileReader()
                                            reader.onload = (ev) => {
                                                addElement({
                                                    id: `img_${Date.now()}`,
                                                    type: 'image',
                                                    content: ev.target?.result as string,
                                                    x: 100,
                                                    y: 100,
                                                    width: 150,
                                                    height: 150,
                                                    style: {}
                                                })
                                            }
                                            reader.readAsDataURL(file)
                                        }
                                    }}
                                />
                                <span className="flex items-center gap-2"><GraduationCap size={16} /> Ảnh</span>
                            </label>
                        </div>
                        <div className="mt-2">
                             <button
                                onClick={() => setShowIconPicker(true)}
                                className="w-full py-3 border border-dashed border-slate-300 rounded-lg text-slate-500 font-medium hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center justify-center gap-2"
                             >
                                <Smile size={18} /> Mở thư viện Icon
                             </button>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Background Settings here */}
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phông nền</p>
                        <div className="flex gap-2">
                            <input 
                                type="color"
                                className="h-10 flex-1 p-0 border border-slate-200 rounded-lg cursor-pointer"
                                value={config.background.color}
                                onChange={(e) => updateBackground({ color: e.target.value })}
                            />
                            <label className="p-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer shadow-sm" title="Đổi ảnh nền">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            const reader = new FileReader()
                                            reader.onload = (ev) => updateBackground({ image: ev.target?.result as string })
                                            reader.readAsDataURL(file)
                                        }
                                    }}
                                />
                                <Layers size={18} className="text-slate-600" />
                            </label>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {selectedElementId ? (
                        <div className="space-y-4 pt-2">
                            <div className="flex justify-between items-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chỉnh sửa</p>
                                <div className="flex gap-2">
                                    <button onClick={() => useDesignStore.getState().copyElement()} className="text-xs text-indigo-600 font-bold hover:underline">Copy</button>
                                    <button onClick={() => useDesignStore.getState().pasteElement()} className="text-xs text-indigo-600 font-bold hover:underline">Paste</button>
                                    <button onClick={() => removeElement(selectedElementId)} className="text-red-500 text-xs hover:underline">Xóa</button>
                                </div>
                            </div>
                            
                            {(() => {
                                const el = config.elements.find(e => e.id === selectedElementId)
                                if (!el) return null
                                return (
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => updateElement(el.id, { x: config.width / 2 - (el.width || 50) })}
                                                className="flex-1 p-2 bg-slate-100 rounded hover:bg-slate-200 text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5"
                                            >
                                                <AlignHorizontalJustifyCenter size={14} /> Căn ngang
                                            </button>
                                            <button 
                                                onClick={() => updateElement(el.id, { y: config.height / 2 - (el.height || 20) })}
                                                className="flex-1 p-2 bg-slate-100 rounded hover:bg-slate-200 text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5"
                                            >
                                                <AlignVerticalJustifyCenter size={14} /> Căn dọc
                                            </button>
                                        </div>

                                        <div className="flex gap-2 items-center">
                                            <div className="flex-1">
                                                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Xoay</label>
                                                <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-2 bg-white">
                                                    <RotateCw size={14} className="text-slate-400" />
                                                    <input 
                                                        type="number"
                                                        className="w-full text-sm outline-none bg-transparent"
                                                        value={el.rotation || 0}
                                                        onChange={(e) => updateElement(el.id, { rotation: parseInt(e.target.value) || 0 })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-1 pt-4">
                                                <button onClick={() => sendToBack(el.id)} className="p-2 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100" title="Dưới cùng"><Layers size={14} className="rotate-180" /></button>
                                                <button onClick={() => bringToFront(el.id)} className="p-2 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100" title="Trên cùng"><Layers size={14} /></button>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Vị trí X</label>
                                                <input type="number" className="w-full border border-slate-200 rounded-lg p-2 text-sm" value={el.x} onChange={(e) => updateElement(el.id, { x: parseInt(e.target.value) || 0 })} />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Vị trí Y</label>
                                                <input type="number" className="w-full border border-slate-200 rounded-lg p-2 text-sm" value={el.y} onChange={(e) => updateElement(el.id, { y: parseInt(e.target.value) || 0 })} />
                                            </div>
                                        </div>

                                        {(el.type === 'text' || el.type === 'button' || el.type === 'dynamic') && (
                                            <div className="space-y-4">
                                                {el.type !== 'dynamic' && (
                                                    <div>
                                                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nội dung</label>
                                                        <textarea className="w-full border border-slate-200 rounded-lg p-2.5 text-sm min-h-[80px] focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all" value={el.content || ''} onChange={(e) => updateElement(el.id, { content: e.target.value })} />
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Cỡ chữ</label>
                                                        <input type="number" className="w-full border border-slate-200 rounded-lg p-2 text-sm" value={parseInt(el.style.fontSize as string) || 16} onChange={(e) => updateElement(el.id, { style: { ...el.style, fontSize: `${e.target.value}px` } })} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Màu chữ</label>
                                                        <input type="color" className="w-full h-[38px] p-1 border border-slate-200 rounded-lg cursor-pointer" value={el.style.color as string || '#000000'} onChange={(e) => updateElement(el.id, { style: { ...el.style, color: e.target.value } })} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Font chữ</label>
                                                    <select 
                                                        className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10" 
                                                        value={el.style.fontFamily || 'sans-serif'} 
                                                        onChange={(e) => updateElement(el.id, { style: { ...el.style, fontFamily: e.target.value } })}
                                                        style={{ fontFamily: el.style.fontFamily }}
                                                    >
                                                        {FONTS.map(f => (
                                                            <option key={f.name} value={f.name} style={{ fontFamily: f.name }}>
                                                                {f.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })()}
                        </div>
                    ) : (
                        <div className="text-slate-400 text-xs text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            Chọn một phần tử để bắt đầu chỉnh sửa
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Music size={14} className="text-indigo-600" /> Cấu hình nhạc
                            </label>
                        </div>
                        <div className="space-y-4">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Tải nhạc từ máy (MP3)</label>
                                    <label className={clsx(
                                        "w-full py-6 flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-all group relative overflow-hidden",
                                        config.music?.url ? "bg-emerald-50 border-emerald-200" : "bg-slate-100/50 border-slate-200 hover:bg-white hover:border-indigo-400"
                                    )} title="Tải nhạc từ máy">
                                        <input 
                                            type="file"
                                            accept="audio/mpeg,audio/wav,audio/mp3"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0]
                                                if (file) {
                                                    const url = await uploadFile(file)
                                                    if (url) {
                                                        updateMusic({ url, enabled: true })
                                                        // Explicitly save the config to ensure persistence across refreshes
                                                        setTimeout(async () => {
                                                            const success = await saveConfig()
                                                            if (success) {
                                                                console.log('Auto-saved music configuration')
                                                            }
                                                        }, 500)
                                                    }
                                                }
                                            }}
                                        />
                                        {config.music?.url ? (
                                            <>
                                                <div className="p-3 bg-white rounded-full shadow-sm mb-2 text-emerald-600 group-hover:scale-110 transition-transform">
                                                    <Music size={20} />
                                                </div>
                                                <span className="text-xs font-bold text-emerald-700">Đã chọn bài nhạc</span>
                                                <span className="text-[9px] text-emerald-600/70 mt-1 font-medium bg-emerald-100/50 px-2 py-0.5 rounded-full max-w-[85%] truncate">
                                                    {config.music.url.split('/').pop()}
                                                </span>
                                                <div className="absolute top-2 right-2 p-1 bg-emerald-500 text-white rounded-full shadow-sm">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-3 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                                    <ArrowUp size={20} className="text-indigo-600" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-500">Nhấn để chọn file nhạc</span>
                                                <span className="text-[10px] text-slate-400 mt-1">Định dạng hỗ trợ: .mp3, .wav</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            
                            {musicDuration > 0 ? (
                                <div className="space-y-4 py-2 border-t border-slate-200/50 mt-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-bold text-slate-400">0s</span>
                                        <div className="flex gap-4">
                                            <div className="text-center">
                                                <label className="block text-[9px] text-slate-400 uppercase font-bold">Bắt đầu</label>
                                                <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{Math.floor(config.music?.startTime || 0)}s</span>
                                            </div>
                                            <div className="text-center">
                                                <label className="block text-[9px] text-slate-400 uppercase font-bold">Kết thúc</label>
                                                <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{Math.floor(config.music?.endTime || musicDuration)}s</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400">{Math.floor(musicDuration)}s</span>
                                    </div>
                                    
                                    <div className="relative h-6 flex items-center bg-slate-200/50 rounded-full px-2">
                                        <div className="absolute left-2 right-2 h-2 bg-slate-300 rounded-full" />
                                        <div 
                                            className="absolute h-2 bg-indigo-500 rounded-full z-10"
                                            style={{
                                                left: `calc(8px + ${(config.music?.startTime || 0) / musicDuration * (100)}% - ${((config.music?.startTime || 0) / musicDuration) * 16}px)`,
                                                width: `calc(${((config.music?.endTime || musicDuration) - (config.music?.startTime || 0)) / musicDuration * 100}% - ${((config.music?.endTime || musicDuration) - (config.music?.startTime || 0)) / musicDuration * 16}px)`
                                            }}
                                        />
                                        <input 
                                            type="range"
                                            min={0}
                                            max={musicDuration}
                                            step={0.1}
                                            value={config.music?.startTime || 0}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value)
                                                const end = config.music?.endTime || musicDuration
                                                updateMusic({ startTime: Math.min(val, end - 1) }, false)
                                            }}
                                            onMouseUp={() => {
                                                const start = config.music?.startTime || 0
                                                updateMusic({ startTime: start }, true)
                                            }}
                                            className="absolute left-2 right-2 w-[calc(100%-16px)] h-2 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                                        />
                                        <input 
                                            type="range"
                                            min={0}
                                            max={musicDuration}
                                            step={0.1}
                                            value={config.music?.endTime || musicDuration}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value)
                                                const start = config.music?.startTime || 0
                                                updateMusic({ endTime: Math.max(val, start + 1) }, false)
                                            }}
                                            onMouseUp={() => {
                                                const end = config.music?.endTime || musicDuration
                                                updateMusic({ endTime: end }, true)
                                            }}
                                            className="absolute left-2 right-2 w-[calc(100%-16px)] h-2 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                                        />
                                    </div>
                                </div>
                            ) : config.music?.url ? (
                                <div className="py-6 text-center border-t border-slate-100">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" />
                                    <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-wider">Phân tích âm thanh...</p>
                                </div>
                            ) : (
                                <div className="py-8 text-center border-t border-slate-100/50">
                                    <div className="p-3 bg-indigo-50 rounded-full w-fit mx-auto mb-3">
                                        <Music size={24} className="text-indigo-300" />
                                    </div>
                                    <p className="text-xs text-slate-400 px-4 leading-relaxed">Tải lên nhạc để bắt đầu thiết kế khoảng phát tự động</p>
                                </div>
                            )}

                             <div className="flex gap-2">
                                <button 
                                    onClick={isPlaying ? stopPreview : playPreview}
                                    disabled={!config.music?.url}
                                    className={clsx(
                                        "flex-1 py-3 text-white shadow-lg rounded-xl disabled:opacity-30 disabled:shadow-none text-sm font-bold flex items-center justify-center gap-2 transition-all",
                                        isPlaying ? "bg-red-500 hover:bg-red-600 shadow-red-100" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                                    )}
                                >
                                    {isPlaying ? (
                                        <><div className="w-2 h-2 bg-white rounded-full animate-pulse" /> Dừng phát</>
                                    ) : (
                                        <><Volume2 size={18} /> Nghe thử</>
                                    )}
                                </button>
                             </div>
                        </div>
                    </div>
                </div>
            )}
          </div>

          {/* Fixed bottom bar */}
          <div className="shrink-0 border-t border-slate-200 bg-white p-4">
             <div className="flex gap-2">
                 <button
                     onClick={() => setShowPreview(true)}
                     className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                 >
                     <Eye size={17} /> Xem trước
                 </button>
                 <button 
                     onClick={() => saveConfig()}
                     className="flex-1 py-3 bg-emerald-700 text-white rounded-lg font-bold hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                 >
                     {loading ? 'Đang lưu...' : <><Save size={17} /> Lưu</>}
                 </button>
             </div>
          </div>
      </div>

      {/* Main Sandbox Area */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-100 overflow-auto relative">
         <div 
            ref={canvasRef}
            className="relative shadow-2xl ring-1 ring-slate-900/5"
            style={{ width: config.width, height: config.height }}
         >
             {/* We use InvitationRenderer but we inject our own drag handlers by overriding the onElementClick */}
             {/* Actually InvitationRenderer renders divs. To make them draggable, we need to wrap them OR let InvitationRenderer handle the specialized click/down */}
             
             {/* Re-implementing a simple render loop here for the Editor to wrap with Draggable */}
             <div 
                className="w-full h-full relative overflow-hidden bg-white"
                style={{
                    backgroundColor: config.background.color,
                    backgroundImage: config.background.image ? `url(${normalizeUrl(config.background.image)})` : undefined,
                }}
                onClick={() => selectElement(null)}
             >
                 {/* Guides */}
                 {guides.map((g, i) => (
                    <div 
                        key={i}
                        className="absolute bg-pink-500 z-[60] pointer-events-none"
                        style={{
                            left: g.type === 'vertical' ? g.pos : 0,
                            top: g.type === 'horizontal' ? g.pos : 0,
                            width: g.type === 'vertical' ? '1px' : '100%',
                            height: g.type === 'horizontal' ? '1px' : '100%',
                            boxShadow: '0 0 2px rgba(255,255,255,0.5)' // enhance visibility
                        }}
                    />
                 ))}

                 {config.elements.map(el => (
                    <div
                        key={el.id}
                        id={el.id}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => handleMouseDown(e, el.id, el.x, el.y)}
                        className={clsx(
                            "absolute cursor-move select-none hover:ring-1 hover:ring-blue-400",
                            selectedElementId === el.id && "ring-2 ring-blue-600 z-50",
                            el.type === 'button' && "flex items-center justify-center font-bold shadow-lg rounded-xl"
                        )}
                        style={{
                            left: el.x,
                            top: el.y,
                            width: el.width,
                            height: el.height,
                            ...el.style,
                            // Match defaults from InvitationRenderer for buttons
                            ...(el.type === 'button' ? {
                                backgroundColor: el.style.backgroundColor || '#064e3b',
                                color: el.style.color || '#ffffff',
                            } : {}),
                            // In editor, we show placeholders for dynamic fields
                            fontSize: el.style.fontSize, // Ensure px is handled
                            transform: `rotate(${el.rotation || 0}deg)`
                        }}
                    >
                        {el.type === 'dynamic' && el.field === 'full_name' ? '{Tên Khách Mời}' : (
                            el.type === 'image' ? (
                                normalizeUrl(el.content) ? (
                                    <img src={normalizeUrl(el.content)} className="w-full h-full object-cover pointer-events-none" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[10px] text-slate-400">No Image</div>
                                )
                            ) : el.content
                        )}
                    </div>
                 ))}
             </div>
         </div>
         
         <div className="absolute bottom-4 right-4 text-xs text-slate-400">
            Kích thước: {config.width} x {config.height} px
         </div>
      </div>


       {/* Icon Picker Modal */}
       {showIconPicker && (
           <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                   <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                       <h3 className="font-bold text-lg text-slate-800">Chọn Thư viện Icon</h3>
                       <button onClick={() => setShowIconPicker(false)} className="text-slate-400 hover:text-red-500 text-2xl">&times;</button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-4 space-y-6">
                       {Object.entries(ICON_CATEGORIES).map(([category, icons]) => (
                           <div key={category}>
                               <h4 className="text-sm font-bold text-slate-500 uppercase mb-3 text-xs">{category}</h4>
                               <div className="grid grid-cols-6 gap-2">
                                   {icons.map(icon => (
                                       <button 
                                           key={icon}
                                           onClick={() => {
                                               addElement({
                                                   id: `icon_${Date.now()}`,
                                                   type: 'text',
                                                   content: icon,
                                                   x: config.width / 2 - 20,
                                                   y: config.height / 2 - 20,
                                                   style: { fontSize: '40px' }
                                               })
                                               setShowIconPicker(false)
                                           }}
                                           className="aspect-square flex items-center justify-center text-3xl hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                       >
                                           {icon}
                                       </button>
                                   ))}
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
           </div>
       )}

       {/* Preview Modal */}
       {showPreview && (
           <PreviewModal onClose={() => setShowPreview(false)} />
       )}
    </div>
  )
}

function PreviewModal({ onClose }: { onClose: () => void }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between w-full px-6 py-3 bg-black/40">
        <div className="flex items-center gap-2 text-white/70 text-sm">
          <Eye size={16} />
          <span className="font-medium">Xem trước — hiển thị giống khách mời</span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition text-sm"
        >
          <X size={15} /> Đóng
        </button>
      </div>

      {/* iframe */}
      <iframe
        src="/invitation"
        className="flex-1 w-full border-0"
        title="Invitation Preview"
      />
    </div>
  )
}
