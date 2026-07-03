import type { CSSProperties, ReactNode } from 'react'

export default function StarBorder({
  className = '',
  color = '#FFB800',
  speed = '6s',
  thickness = 1,
  children,
}: {
  className?: string
  color?: string
  speed?: string
  thickness?: number
  children: ReactNode
}) {
  return (
    <div
      className={`star-border-container ${className}`}
      style={{ padding: `${thickness}px 0` } as CSSProperties}
    >
      <div
        className="border-gradient-bottom"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className="border-gradient-top"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div className="star-border-inner">{children}</div>
    </div>
  )
}
