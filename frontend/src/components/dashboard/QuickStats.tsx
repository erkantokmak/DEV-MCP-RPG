import { Icon } from '../Icon'
import { useUser } from '../../contexts/UserContext'
import { useReports } from '../../hooks/useApi'

interface Stat {
  label: string
  value: string | number
  icon: string
  color: 'primary' | 'secondary' | 'destructive' | 'gold'
  subtext?: string
}

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
  const { currentUser } = useUser()
  const { data: reports, loading } = useReports(undefined, 100, 0)
  
  // Bugün yapılan analizleri say
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todaysReports = reports?.filter(r => {
    const reportDate = new Date(r.analyzed_at)
    return reportDate >= today
  }) || []
  
  // Ortalama kod kalitesi skoru
  const avgScore = reports?.length 
    ? Math.round(reports.reduce((sum, r) => sum + r.overall_score, 0) / reports.length)
    : 0
  
  // Kritik sorunları say (score < 50)
  const criticalCount = reports?.filter(r => r.overall_score < 50).length || 0
  
  // Toplam XP (tüm raporlardan)
  const totalXpEarned = reports?.reduce((sum, r) => sum + (r.rpg_summary?.xp_earned || 0), 0) || 0
  
  // İstatistikleri oluştur
  const stats: Stat[] = [
    {
      label: 'Analyses Today',
      value: todaysReports.length,
      icon: 'pest_control',
      color: 'primary',
      subtext: `${reports?.length || 0} total`,
    },
    {
      label: 'Avg Code Quality',
      value: `${avgScore}%`,
      icon: 'verified',
      color: avgScore >= 80 ? 'secondary' : avgScore >= 50 ? 'gold' : 'destructive',
      subtext: avgScore >= 85 ? 'A+ Rating' : avgScore >= 70 ? 'B Rating' : avgScore >= 50 ? 'C Rating' : 'Needs Work',
    },
    {
      label: 'Critical Issues',
      value: criticalCount,
      icon: 'warning',
      color: criticalCount > 0 ? 'destructive' : 'primary',
      subtext: criticalCount > 0 ? 'Needs attention' : 'All clear!',
    },
    {
      label: 'XP Earned',
      value: totalXpEarned.toLocaleString(),
      icon: 'stars',
      color: 'gold',
      subtext: currentUser ? `Level ${currentUser.level}` : 'Login to track',
    },
  ]
  
  return (
    <section className="p-6 border-b border-surface-accent">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const colors = colorClasses[stat.color]
          return (
            <div
              key={stat.label}
              className={`p-4 rounded-lg ${colors.bg} border ${colors.border} hover:${colors.shadow} transition-all group`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`size-10 rounded ${colors.bg} border ${colors.border} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon name={stat.icon} className={`text-xl ${colors.text}`} />
                </div>
                <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <span className={`text-3xl font-display font-bold ${colors.text}`}>
                  {loading ? '...' : stat.value}
                </span>
                {stat.subtext && (
                  <span className="text-xs text-gray-500 font-mono">
                    {stat.subtext}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
