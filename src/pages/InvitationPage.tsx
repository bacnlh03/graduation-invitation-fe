import { useEffect, useState, useRef } from 'react'
import confetti from 'canvas-confetti'
import { useGuestStore } from '@/stores/useGuestStore'
import { useDesignStore } from '@/stores/useDesignStore'
import { InvitationRenderer } from '@/components/InvitationRenderer'
import { useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import type { DesignConfig } from '@/types/design'
import type { Guest } from '@/types'

export function InvitationPage() {
  const [searchParams] = useSearchParams()
  const guestId = searchParams.get('id')
  
  const getGuestById = useGuestStore(state => state.getGuestById)
  const confirmAttendance = useGuestStore(state => state.confirmAttendance)
  const { config, fetchConfig } = useDesignStore()
  
  const [guestName, setGuestName] = useState('Bạn của Ngọc Trâm')
  const [isConfirmed, setIsConfirmed] = useState<number>(0)
  const [isVisible, setIsVisible] = useState(false) // For entry animation
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  useEffect(() => {
    async function init() {
      await fetchConfig()
      if (guestId) {
        const guest = await getGuestById(guestId)
        if (guest) {
          setGuestName(guest.full_name)
          setIsConfirmed(guest.status)
        }
      }
      // Trigger entry animation
      setTimeout(() => setIsVisible(true), 300)
    }
    init()
  }, [guestId, getGuestById, fetchConfig])

  useEffect(() => {
    if (config.music?.enabled && config.music.url && !audioRef.current) {
      audioRef.current = new Audio(config.music.url)
      audioRef.current.loop = true
    }
  }, [config.music])


  const startMusic = () => {
    if (config.music?.enabled && audioRef.current && !isPlaying) {
      const start = config.music.startTime || 0
      const end = config.music.endTime || 0

      audioRef.current.currentTime = start
      audioRef.current.play().catch(e => console.error("Auto-play failed", e))
      setIsPlaying(true)

      // Range enforcement
      const handleTimeUpdate = () => {
        if (!audioRef.current) return
        if (end > 0 && audioRef.current.currentTime >= end) {
          if (audioRef.current.loop) {
            audioRef.current.currentTime = start
          } else {
            audioRef.current.pause()
            setIsPlaying(false)
          }
        }
      }

      audioRef.current.ontimeupdate = handleTimeUpdate
    }
  }

  const handleConfirm = async () => {
    if (isConfirmed === 2) return
    if (guestId) {
       await confirmAttendance(guestId)
    }
    setIsConfirmed(2) // StatusConfirmed
    // Soft, Elegant Celebration (Rose Gold & Champagne)
    confetti({ 
      particleCount: 100, 
      spread: 70, 
      origin: { y: 0.6 }, 
      colors: ['#e2e8f0', '#fecdd3', '#fde68a'], 
      scalar: 0.8,
      drift: 0.5,
      gravity: 0.8
    })
  }

  return (
    <div 
      className="min-h-screen w-full font-serif overflow-hidden relative flex items-center justify-center p-4 selection:bg-rose-200"
      style={{
          // Luxury Pastel Gradient
          background: 'radial-gradient(circle at 50% 0%, #fff1f2 0%, #fff7ed 40%, #fdf2f8 75%, #fce7f3 100%)',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400&family=Dancing+Script:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Roboto:wght@300;400;500;700&family=Great+Vibes&family=Montserrat:wght@300;400;500;700&family=Pacifico&family=Quicksand:wght@300;400;500;700&family=Charm:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Oswald:wght@200;400;700&family=Saira+Stencil+One&family=Open+Sans:ital,wght@0,300;0,400;0,700;1,400&display=swap');
        .font-luxury-serif { font-family: 'Playfair Display', serif; }
        .font-luxury-sans { font-family: 'Montserrat', sans-serif; }
        
        .glass-card {
            background: rgba(255, 255, 255, 0.65);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.8);
            box-shadow: 
                0 20px 50px -12px rgba(167, 139, 250, 0.1), 
                0 0 0 1px rgba(255,255,255,0.5) inset;
        }
        
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(30px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .animate-enter {
            animation: fadeUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      
      {/* Abstract Ambient Shapes (Blur blobs) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-rose-200/40 rounded-full blur-[120px] pointer-events-none mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-amber-100/60 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      <div className="absolute top-[20%] right-[20%] w-[30vh] h-[30vh] bg-pink-300/20 rounded-full blur-[80px] pointer-events-none" />

      {/* Main Card Container */}
      <div 
          className={clsx(
              "relative z-10 transition-all duration-1000",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
      >
          <div className="glass-card rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
             
             {/* Subtle internal border/frame */}
             <div className="absolute inset-4 border border-rose-900/10 rounded-[1.5rem] pointer-events-none"></div>

             <InvitationWrapper 
                  config={config} 
                  guest={{ 
                      id: guestId || 'demo', 
                      full_name: guestName, 
                      status: isConfirmed, 
                      updated_at: '' 
                  }} 
                  isConfirmed={isConfirmed === 2}
                  onConfirm={handleConfirm}
                  onOpen={startMusic}
             />

             {/* Footer tagline */}
             <div className="text-center mt-6 text-rose-900/40 text-xs font-luxury-sans tracking-[0.2em] uppercase">
                 Trân trọng kính mời
             </div>
          </div>
      </div>
    </div>
  )
}

function InvitationWrapper({ config, guest, isConfirmed, onConfirm, onOpen }: { 
    config: DesignConfig, 
    guest: Guest, 
    isConfirmed: boolean, 
    onConfirm: () => void,
    onOpen: () => void
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)

    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                // Calculate available space in the window minus padding
                const viewportWidth = window.innerWidth - 64 // 32px padding on each side
                const viewportHeight = window.innerHeight - 150 // Vertical padding + footer
                
                // Determine scale based on width OR height to ensure it always fits
                const scaleX = viewportWidth / config.width
                const scaleY = viewportHeight / config.height
                
                // Use the smaller scale to fit entirely, but cap at 1.0 (don't upscale pixelated)
                // Actually for vector text upscaling is fine, but for images it might blur.
                // Let's allow max 1.1 for slight "zoom" feel on large screens, but mostly contain.
                let targetScale = Math.min(scaleX, scaleY)
                if (targetScale > 1.2) targetScale = 1.2
                
                setScale(targetScale)
            }
        }
        updateScale()
        window.addEventListener('resize', updateScale)
        const timeout = setTimeout(updateScale, 100)
        return () => {
            window.removeEventListener('resize', updateScale)
            clearTimeout(timeout)
        }
    }, [config.width, config.height])

    return (
        <div ref={containerRef} className="flex justify-center items-center relative z-20">
             <div 
                className="relative shadow-2xl rounded-[2px]" 
                style={{ 
                    width: config.width * scale, 
                    height: config.height * scale,
                    transition: 'width 0.3s ease, height 0.3s ease'
                }}
             >
                <InvitationRenderer 
                    config={config} 
                    guest={guest} 
                    isConfirmed={isConfirmed}
                    onConfirm={onConfirm}
                    scale={scale}
                />

                {/* --- Book Cover Overlay --- */}
                <BookCoverReveal scale={scale} onOpen={onOpen} />
             </div>
        </div>
    )
}

function BookCoverReveal({ scale, onOpen }: { scale: number, onOpen: () => void }) {
    const [isOpened, setIsOpened] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    const handleOpen = () => {
        setIsOpened(true)
        onOpen()
    }

    return (
        <div 
            className={clsx(
                "absolute inset-0 z-50 flex items-center justify-center cursor-pointer perspective-[1500px]",
                isOpened ? "pointer-events-none" : "pointer-events-auto"
            )}
            onClick={handleOpen}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* --- Left Cover Panel --- */}
            <div 
                className={clsx(
                    "absolute left-0 top-0 bottom-0 w-[50%] z-20 origin-left transition-all duration-[1500ms] ease-in-out border-r border-[#3e3b6b]",
                    isOpened ? "-rotate-y-[110deg] opacity-0" : "rotate-y-0 opacity-100"
                )}
                style={{ 
                    backgroundColor: '#1e1b4b', // Midnight Blue
                    backgroundImage: `
                        linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 100%), 
                        url("https://www.transparenttextures.com/patterns/leather.png")
                    `,
                    backgroundBlendMode: 'overlay, multiply',
                    boxShadow: 'inset -5px 0 15px rgba(0,0,0,0.5)',
                    transformStyle: 'preserve-3d'
                }}
            >
                {/* Gold Foil Wave Pattern (Top Left) */}
                <div className="absolute top-0 left-0 w-full h-1/2 opacity-30 pointer-events-none"
                    style={{
                        background: `radial-gradient(circle at 0% 0%, transparent 20%, #bf953f 21%, transparent 22%),
                                     radial-gradient(circle at 0% 0%, transparent 30%, #bf953f 31%, transparent 32%)`
                    }}
                />
                
                {/* Sagittarius Image */}
                <img 
                    src="/sagittarius.png" 
                    alt="Sagittarius" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
                    style={{ mixBlendMode: 'luminosity' }}
                />
            </div>

            {/* --- Right Cover Panel --- */}
            <div 
                className={clsx(
                    "absolute right-0 top-0 bottom-0 w-[50%] z-20 origin-right transition-all duration-[1500ms] ease-in-out border-l border-[#3e3b6b]",
                    isOpened ? "rotate-y-[110deg] opacity-0" : "rotate-y-0 opacity-100"
                )}
                style={{ 
                    backgroundColor: '#1e1b4b',
                    backgroundImage: `
                        linear-gradient(-135deg, rgba(255,255,255,0.03) 0%, transparent 100%), 
                        url("https://www.transparenttextures.com/patterns/leather.png")
                    `,
                    backgroundBlendMode: 'overlay, multiply',
                    boxShadow: 'inset 5px 0 15px rgba(0,0,0,0.5)',
                    transformStyle: 'preserve-3d'
                }}
            >
                {/* Gold Foil Wave Pattern (Bottom Right) */}
                <div className="absolute bottom-0 right-0 w-full h-1/2 opacity-30 pointer-events-none"
                    style={{
                        background: `radial-gradient(circle at 100% 100%, transparent 20%, #bf953f 21%, transparent 22%),
                                     radial-gradient(circle at 100% 100%, transparent 30%, #bf953f 31%, transparent 32%)`
                    }}
                />

                {/* Graduation Image */}
                <img 
                    src="/graduation.png" 
                    alt="Graduation" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
                    style={{ mixBlendMode: 'luminosity' }}
                />
            </div>

            {/* --- Central Spine Shadow --- */}
            <div className={clsx(
                "absolute inset-y-0 w-4 bg-black/40 blur-md z-30 transition-opacity duration-500",
                isOpened ? "opacity-0" : "opacity-100"
            )} />

            {/* --- The Planetary Seal Button (Center) --- */}
            {/* FIXED: No Rotation, just fade out/scale */}
            <div 
                className={clsx(
                    "absolute z-40 flex flex-col items-center justify-center transition-all duration-700",
                    isOpened ? "opacity-0 scale-110" : "opacity-100 scale-100"
                )}
            >
                <div className={clsx(
                    "rounded-full flex items-center justify-center relative shadow-[0_10px_40px_rgba(0,0,0,0.6)]",
                    isHovered ? "scale-105" : "scale-100", // Subtle hover only
                    "transition-transform duration-500 ease-out"
                )}
                style={{
                    width: 100 * scale,
                    height: 100 * scale,
                    // Gold Foil Gradient
                    background: 'conic-gradient(from 180deg, #b45309, #fcd34d, #b45309, #fcd34d, #b45309)',
                    border: '2px solid rgba(255,255,255,0.2)'
                }}>
                    <div className="absolute inset-1 rounded-full bg-[#1e1b4b] flex items-center justify-center">
                        {/* Inner Symbol: Compound Star/Compass */}
                         <svg width="60%" height="60%" viewBox="0 0 24 24" stroke="#fcd34d" strokeWidth="1" fill="none">
                            <circle cx="12" cy="12" r="8" strokeOpacity="0.5" />
                            <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z" fill="#fcd34d" fillOpacity="0.2" />
                            <circle cx="12" cy="12" r="2" fill="#fcd34d" />
                         </svg>
                    </div>
                </div>
                
                {/* <span className={clsx(
                    "mt-4 font-luxury-sans text-[#fcd34d] text-[10px] tracking-[0.3em] uppercase transition-opacity duration-300",
                    isHovered ? "opacity-100" : "opacity-60"
                )}>
                    Mở Thiệp
                </span> */}
            </div>
        </div>
    )
}
