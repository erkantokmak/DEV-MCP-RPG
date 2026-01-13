import clsx from 'clsx'
import { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const variantClasses = {
  primary: 'bg-primary/20 border-primary text-primary hover:bg-primary hover:text-black shadow-neon',
  secondary: 'bg-secondary/20 border-secondary text-secondary hover:bg-secondary hover:text-black shadow-neon-secondary',
  destructive: 'bg-destructive/20 border-destructive text-destructive hover:bg-destructive hover:text-white shadow-neon-destructive',
  ghost: 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5',
  outline: 'bg-surface-dark border-surface-accent text-gray-400 hover:text-white hover:border-primary',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'border rounded font-bold uppercase tracking-wider font-display transition-all',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
