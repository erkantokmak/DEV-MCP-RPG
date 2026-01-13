import { Icon } from '../Icon'

interface Stat {
  label: string
  value: string | number
  icon: string
  color: 'primary' | 'secondary' | 'destructive' | 'gold'
  subtext?: string
}

const stats: Stat[] = [
  {
    label: 'Bugs Slain Today',
    value: 47,
    icon: 'pest_control',
    color: 'primary',
    subtext: '+12 from yesterday',
  },
  {
    label: 'Code Quality',
    value: '94.2%',
    icon: 'verified',
    color: 'secondary',
    subtext: 'A+ Rating',
  },
  {
    label: 'Critical Issues',
    value: 3,
    icon: 'warning',
    color: 'destructive',
    subtext: 'Needs attention',
  },
  {
    label: 'Gold Earned',
    value: '2,847',
    icon: 'monetization_on',
    color: 'gold',
    subtext: 'This week',
  },
]

const colorClasses = {
  primary: {
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    text: 'text-primary',
    shadow: 'shadow-neon',
  },
  secondary: {
    bg: 'bg-secondary/10',
    border: 'border-secondary/30',
    text: 'text-secondary',
    shadow: 'shadow-neon-secondary',
  },
  destructive: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    text: 'text-destructive',
    shadow: 'shadow-neon-destructive',
  },
  gold: {
    bg: 'bg-gold/10',
    border: 'border-gold/30',
    text: 'text-gold',
    shadow: 'shadow-neon-gold',
  },
}

export function QuickStats() {
  return (
    <section className="p-6 border-b border-surface-accent">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const colors = colorClasses[stat.color]
          return (
            <div
              key={stat.label}
              className={`p-4 rounded-lg ${colors.bg} border ${colors.border} hover:${colors.shadow} transition-all`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon name={stat.icon} className={`text-xl ${colors.text}`} />
                <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
              <div className={`text-2xl font-display font-black ${colors.text}`}>
                {stat.value}
              </div>
              {stat.subtext && (
                <p className="text-xs text-gray-500 mt-1 font-mono">
                  {stat.subtext}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
