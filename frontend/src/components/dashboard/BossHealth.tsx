import { Icon } from '../Icon'
import { Badge } from '../Badge'
import { useHealth, useMCPStatus } from '../../hooks/useApi'

// Boss'un HP'si sistem sağlığına göre hesaplanır
function calculateBossHealth(mcpStatuses: Record<string, { status: string }> | null): { current: number; max: number } {
  if (!mcpStatuses) return { current: 0, max: 100000 }
  
  const total = Object.keys(mcpStatuses).length
  const healthy = Object.values(mcpStatuses).filter(s => s.status === 'healthy').length
  const degraded = Object.values(mcpStatuses).filter(s => s.status === 'degraded').length
  
  // Her healthy MCP tam HP, degraded yarım HP, unavailable 0
  const healthPercent = ((healthy * 100) + (degraded * 50)) / (total * 100)
  
  return {
    current: Math.floor(healthPercent * 100000),
    max: 100000
  }
}

// Boss tipini sistem durumuna göre belirle
function getBossType(healthPercent: number): { name: string; type: string; weaknesses: string[] } {
  if (healthPercent >= 80) {
    return {
      name: 'SYSTEM_GUARDIAN',
      type: 'HEALTHY',
      weaknesses: ['OPTIMIZATION', 'SCALING', 'TESTING']
    }
  } else if (healthPercent >= 50) {
    return {
      name: 'WARNING_SENTINEL',
      type: 'WARNING',
      weaknesses: ['DEBUGGING', 'RESTART', 'CONFIG_CHECK']
    }
  } else if (healthPercent >= 20) {
    return {
      name: 'ERROR_DRAGON',
      type: 'CRITICAL',
      weaknesses: ['HOTFIX', 'ROLLBACK', 'EMERGENCY_DEPLOY']
    }
  } else {
    return {
      name: 'SYSTEM_CRASH_BOSS',
      type: 'CATASTROPHIC',
      weaknesses: ['FULL_RESTART', 'BACKUP_RESTORE', 'MANUAL_FIX']
    }
  }
}

export function BossHealth() {
  const { data: health, loading: healthLoading } = useHealth()
  const { data: mcpStatus, loading: mcpLoading } = useMCPStatus()
  
  const loading = healthLoading || mcpLoading
  
  const bossHealth = calculateBossHealth(mcpStatus)
  const hpPercentage = (bossHealth.current / bossHealth.max) * 100
  const boss = getBossType(hpPercentage)
  
  // Renk sınıflarını HP yüzdesine göre belirle
  const getHealthColor = () => {
    if (hpPercentage >= 80) return 'primary'
    if (hpPercentage >= 50) return 'secondary'
    if (hpPercentage >= 20) return 'gold'
    return 'destructive'
  }
  
  const healthColor = getHealthColor()
  
  const colorClasses: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
    primary: { bg: 'bg-primary/20', border: 'border-primary', text: 'text-primary', gradient: 'from-primary to-green-400' },
    secondary: { bg: 'bg-secondary/20', border: 'border-secondary', text: 'text-secondary', gradient: 'from-secondary to-cyan-400' },
    gold: { bg: 'bg-gold/20', border: 'border-gold', text: 'text-gold', gradient: 'from-gold to-yellow-400' },
    destructive: { bg: 'bg-destructive/20', border: 'border-destructive', text: 'text-destructive', gradient: 'from-destructive to-red-400' },
  }
  
  const colors = colorClasses[healthColor]
  
  // MCP durumlarını listele
  const mcpServices = mcpStatus ? Object.entries(mcpStatus) : []
  const healthyCount = mcpServices.filter(([_, s]) => s.status === 'healthy').length
  const totalCount = mcpServices.length
  
  if (loading) {
    return (
      <section className="p-6 border-b border-surface-accent">
        <div className="flex items-center justify-center py-8">
          <Icon name="sync" className="text-3xl text-primary animate-spin" />
          <span className="ml-3 text-gray-400 font-mono">Scanning system health...</span>
        </div>
      </section>
    )
  }
  
  return (
    <section className="p-6 border-b border-surface-accent">
      <div className="flex items-center gap-4 mb-4">
        <div className={`size-14 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
          <Icon 
            name={hpPercentage >= 80 ? 'shield_with_heart' : hpPercentage >= 50 ? 'warning' : 'bug_report'} 
            className={`text-3xl ${colors.text}`} 
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-lg font-display font-bold uppercase tracking-wider text-white">
              {boss.name}
            </h2>
            <Badge variant={healthColor === 'primary' ? 'primary' : healthColor === 'secondary' ? 'secondary' : healthColor === 'gold' ? 'gold' : 'destructive'}>
              {boss.type}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 font-mono">
              MCP STATUS:
            </span>
            <div className="flex gap-2">
              {mcpServices.slice(0, 5).map(([name, service]) => (
                <Badge 
                  key={name} 
                  variant={service.status === 'healthy' ? 'primary' : service.status === 'degraded' ? 'secondary' : 'destructive'} 
                  size="sm"
                >
                  {name.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-display font-black ${colors.text}`}>
            {bossHealth.current.toLocaleString()}
            <span className="text-gray-500 text-lg"> / {bossHealth.max.toLocaleString()}</span>
          </div>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">
            SYSTEM HEALTH
          </p>
        </div>
      </div>
      
      {/* Boss Health Bar */}
      <div className="relative">
        <div className="h-6 bg-gray-900 rounded overflow-hidden border border-gray-700">
          <div 
            className={`h-full bg-gradient-to-r ${colors.gradient} relative transition-all duration-1000`}
            style={{ width: `${hpPercentage}%` }}
          >
            {/* Animated stripes */}
            <div className="absolute inset-0 boss-health-stripes opacity-20" />
            {/* Glow effect */}
            <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-l from-white/20 to-transparent" />
          </div>
          {/* Damage markers */}
          <div className="absolute top-0 bottom-0 left-1/4 w-px bg-black/40" />
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-black/40" />
          <div className="absolute top-0 bottom-0 left-3/4 w-px bg-black/40" />
        </div>
        
        {/* Service indicator */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span className={`text-xs font-mono ${colors.text} animate-pulse`}>
            {healthyCount}/{totalCount} MCPs
          </span>
        </div>
      </div>
      
      {/* Status indicator */}
      <div className="flex items-center justify-between mt-3 text-xs text-gray-400 font-mono">
        <span>DB: {health?.database?.toUpperCase() || 'UNKNOWN'}</span>
        <span className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${health?.status === 'healthy' ? 'bg-primary' : health?.status === 'degraded' ? 'bg-secondary' : 'bg-destructive'} animate-pulse`} />
          {health?.status?.toUpperCase() || 'CHECKING...'}
        </span>
      </div>
    </section>
  )
}
