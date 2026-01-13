import clsx from 'clsx'

interface ProgressBarProps {
  value: number
  max?: number
  color?: 'primary' | 'secondary' | 'destructive' | 'legendary' | 'gold' | 'silver' | 'bronze'
  size?: 'sm' | 'md' | 'lg'
  showStripes?: boolean
  showShine?: boolean
  showMarkers?: boolean
  className?: string
}

const colorClasses = {
  primary: 'bg-primary shadow-neon',
  secondary: 'bg-secondary shadow-neon-secondary',
  destructive: 'bg-destructive shadow-neon-destructive',
  legendary: 'bg-legendary shadow-neon-legendary',
  gold: 'bg-gold shadow-neon-gold',
  silver: 'bg-silver',
  bronze: 'bg-bronze',
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

export function ProgressBar({ 
  value, 
  max = 100, 
  color = 'primary',
  size = 'md',
  showStripes = false,
  showShine = false,
  showMarkers = false,
  className 
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  return (
    <div className={clsx(
      'w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700',
      sizeClasses[size],
      className
    )}>
      <div 
        className={clsx(
          'h-full transition-all duration-500 ease-out relative',
          colorClasses[color],
          showStripes && 'progress-stripes'
        )}
        style={{ width: `${percentage}%` }}
      >
        {showShine && (
          <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-l from-white/20 to-transparent" />
        )}
      </div>
      
      {showMarkers && (
        <>
          <div className="absolute top-0 bottom-0 left-[25%] w-px bg-black/40" />
          <div className="absolute top-0 bottom-0 left-[50%] w-px bg-black/40" />
          <div className="absolute top-0 bottom-0 left-[75%] w-px bg-black/40" />
        </>
      )}
    </div>
  )
}
