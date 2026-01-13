import clsx from 'clsx'
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'legendary'
  hover?: boolean
}

const variantClasses = {
  default: 'border-surface-accent',
  primary: 'border-primary/30 hover:border-primary shadow-neon',
  secondary: 'border-secondary/30 hover:border-secondary shadow-neon-secondary',
  destructive: 'border-destructive/30 hover:border-destructive shadow-neon-destructive',
  legendary: 'border-legendary/30 hover:border-legendary shadow-neon-legendary',
}

export function Card({ children, className, variant = 'default', hover = false }: CardProps) {
  return (
    <div className={clsx(
      'bg-surface-dark border rounded-lg',
      variantClasses[variant],
      hover && 'transition-all hover:-translate-y-1',
      className
    )}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={clsx('px-6 py-4 border-b border-surface-accent', className)}>
      {children}
    </div>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={clsx('p-6', className)}>
      {children}
    </div>
  )
}
