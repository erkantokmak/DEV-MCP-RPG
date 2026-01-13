import clsx from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'destructive' | 'legendary' | 'gold' | 'silver' | 'bronze' | 'default'
  size?: 'sm' | 'md'
}

const variantClasses = {
  primary: 'bg-primary/10 border-primary/30 text-primary',
  secondary: 'bg-secondary/10 border-secondary/30 text-secondary',
  destructive: 'bg-destructive/10 border-destructive/30 text-destructive',
  legendary: 'bg-legendary/10 border-legendary/30 text-legendary',
  gold: 'bg-gold/10 border-gold/30 text-gold',
  silver: 'bg-silver/10 border-silver/30 text-silver',
  bronze: 'bg-bronze/10 border-bronze/30 text-bronze',
  default: 'bg-surface-highlight border-gray-700 text-gray-400',
}

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-1 text-xs',
}

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 border rounded font-bold uppercase tracking-wider font-mono',
      variantClasses[variant],
      sizeClasses[size]
    )}>
      {children}
    </span>
  )
}
