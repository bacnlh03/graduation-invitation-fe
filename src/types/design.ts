import type { CSSProperties } from 'react'

export type ElementType = 'text' | 'image' | 'dynamic' | 'button'

export interface DesignElement {
  id: string
  type: ElementType
  // Content for static text, or image URL
  content?: string
  // For dynamic fields (e.g., 'full_name')
  field?: string
  // Position
  x: number
  y: number
  // Dimensions (optional, mainly for images or bounded text)
  width?: number
  height?: number
  // Rotation in degrees
  rotation?: number
  // Styles
  style: CSSProperties
  // Optional label for layer list
  label?: string
}

export interface DesignConfig {
  background: {
    color: string
    image?: string
  }
  elements: DesignElement[]
  // Dimensions of the card for calibration
  width: number
  height: number
  music?: {
    url: string
    enabled: boolean
    startTime?: number // in seconds
    endTime?: number   // in seconds
  }
}

// Default config to seed the editor (The current Panda themeish)
export const DEFAULT_CONFIG: DesignConfig = {
  width: 400,
  height: 600,
  music: {
    url: '',
    enabled: false
  },
  background: {
    color: '#1e1b4b', // Midnight Blue
    image: 'https://www.transparenttextures.com/patterns/stardust.png'
  },
  elements: [
    // Top Ornament (Star)
    {
      id: 'top_star',
      type: 'text',
      content: '✦',
      x: 185,
      y: 40,
      style: { 
        fontSize: '32px', 
        color: '#fcd34d', // Amber-300 (Gold)
        opacity: 0.8,
        textShadow: '0 0 10px rgba(251, 191, 36, 0.5)'
      }
    },
    {
      id: 'title',
      type: 'text',
      content: 'Lễ Tốt Nghiệp',
      x: 50,
      y: 90,
      style: { 
        fontSize: '28px', 
        fontWeight: '400', 
        color: '#fbbf24', // Amber-400
        fontFamily: 'Playfair Display',
        textTransform: 'uppercase',
        letterSpacing: '6px',
        textAlign: 'center',
        width: '300px'
      }
    },
    {
      id: 'guest_label',
      type: 'text',
      content: 'Trân trọng kính mời',
      x: 50,
      y: 140,
      style: {
        fontSize: '12px',
        color: '#94a3b8', // Slate-400
        fontFamily: 'Montserrat',
        textAlign: 'center',
        width: '300px',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }
    },
    {
      id: 'my_name',
      type: 'text',
      content: 'Ngọc Trâm',
      x: 50,
      y: 170,
      style: {
        fontSize: '56px',
        fontWeight: '700',
        color: '#fef3c7', // Amber-100
        fontFamily: 'Playfair Display',
        textAlign: 'center',
        width: '300px',
        textShadow: '0 4px 20px rgba(251, 191, 36, 0.3)'
      }
    },
    {
       id: 'constellation_divider',
       type: 'text', 
       content: '★  ★  ★',
       x: 50,
       y: 240,
       style: {
           color: '#fcd34d',
           fontSize: '14px',
           textAlign: 'center',
           width: '300px',
           letterSpacing: '10px',
           opacity: 0.6
       }
    },
    {
      id: 'guest_name',
      type: 'dynamic',
      field: 'full_name',
      x: 25, 
      y: 280,
      style: {
        fontSize: '32px',
        fontWeight: '500',
        color: '#ffffff', // White
        fontFamily: 'Playfair Display',
        textAlign: 'center',
        width: '350px',
        textShadow: '0 2px 10px rgba(255, 255, 255, 0.2)'
      }
    },
    {
      id: 'message',
      type: 'text',
      content: 'Cùng chia sẻ khoảnh khắc đẹp nhất dưới bầu trời đêm đầy sao.',
      x: 40,
      y: 350,
      style: {
        fontSize: '14px',
        color: '#cbd5e1', // Slate-300
        fontFamily: 'Montserrat',
        fontStyle: 'italic',
        textAlign: 'center',
        width: '320px',
        lineHeight: '1.8'
      }
    },
    {
        id: 'details_block',
        type: 'text',
        content: '08:00 • 28.11.2026\nĐại học Quốc tế (IU)',
        x: 50,
        y: 450,
        style: { 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#fcd34d', // Gold
            fontFamily: 'Montserrat',
            textAlign: 'center',
            width: '300px',
            lineHeight: '1.8',
            letterSpacing: '2px',
            borderTop: '1px solid rgba(251, 191, 36, 0.3)',
            borderBottom: '1px solid rgba(251, 191, 36, 0.3)',
            padding: '10px 0'
        }
    },
    {
        id: 'confirm_btn',
        type: 'button',
        content: 'Xác nhận',
        x: 100,
        y: 530,
        width: 200,
        height: 44,
        style: { 
            fontSize: '14px', 
            backgroundColor: '#fcd34d', // Gold Button 
            color: '#1e1b4b', // Dark Text
            borderRadius: '50px', // Rounded Pill
            fontFamily: 'Montserrat',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            fontWeight: '700',
            boxShadow: '0 0 20px rgba(251, 191, 36, 0.4)'
        }
    }
  ]
}
