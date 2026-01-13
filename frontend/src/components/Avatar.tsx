import clsx from 'clsx'

interface AvatarProps {
  src?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  border?: 'default' | 'primary' | 'secondary' | 'legendary' | 'gold' | 'silver' | 'bronze'
  className?: string
}

const sizeClasses = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-12',
  xl: 'size-16',
}

const borderClasses = {
  default: 'border-gray-600',
  primary: 'border-primary shadow-neon',
  secondary: 'border-secondary shadow-neon-secondary',
  legendary: 'border-legendary shadow-neon-legendary',
  gold: 'border-gold shadow-neon-gold',
  silver: 'border-silver',
  bronze: 'border-bronze',
}

export function Avatar({ src, alt = 'Avatar', size = 'md', border = 'default', className }: AvatarProps) {
  return (
    <div className={clsx(
      'rounded border overflow-hidden bg-black/50',
      sizeClasses[size],
      borderClasses[border],
      className
    )}>
      {src ? (
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : (
        <div className="size-full flex items-center justify-center bg-gray-800 text-gray-500">
          <span className="material-symbols-outlined">person</span>
        </div>
      )}
    </div>
  )
}
