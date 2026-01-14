import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../Icon'
import { Badge } from '../Badge'
import { useReports } from '../../hooks/useApi'
import { AnalysisReport } from '../../services/api'

interface Mission {
  id: string
  title: string
  type: 'bug' | 'feature' | 'refactor' | 'security'
  status: 'in-progress' | 'completed' | 'failed' | 'pending'
  priority: 'critical' | 'high' | 'medium' | 'low'
  xpReward: number
  goldReward: number
  timestamp: string
  agents: string[]
}

const typeConfig = {
  bug: { icon: 'bug_report', color: 'destructive' as const },
  feature: { icon: 'auto_awesome', color: 'secondary' as const },
  refactor: { icon: 'construction', color: 'gold' as const },
  security: { icon: 'shield', color: 'legendary' as const },
}

const statusConfig = {
  'in-progress': { label: 'IN PROGRESS', color: 'secondary' as const, icon: 'sync' },
  completed: { label: 'COMPLETED', color: 'primary' as const, icon: 'check_circle' },
  failed: { label: 'FAILED', color: 'destructive' as const, icon: 'cancel' },
  pending: { label: 'PENDING', color: 'default' as const, icon: 'schedule' },
}

const priorityConfig = {
  critical: { color: 'destructive' as const },
  high: { color: 'gold' as const },
  medium: { color: 'secondary' as const },
  low: { color: 'default' as const },
}

// Convert AnalysisReport to Mission for display
function reportToMission(report: AnalysisReport): Mission {
  // Determine type based on analysis content
  const hasSecurityIssue = report.code_quality?.issues?.some(i => i.type.includes('security'))
  const hasArchIssue = report.architecture && (report.architecture.circular_dependencies?.length > 0 || report.architecture.layer_violations?.length > 0)
  const hasBug = report.code_quality?.issues?.some(i => i.severity === 'critical' || i.severity === 'high')
  
  let type: Mission['type'] = 'feature'
  if (hasSecurityIssue) type = 'security'
  else if (hasBug) type = 'bug'
  else if (hasArchIssue) type = 'refactor'
  
  // Determine status based on score
  let status: Mission['status'] = 'completed'
  if (report.status === 'critical') status = 'failed'
  else if (report.status === 'needs_improvement') status = 'in-progress'
  
  // Determine priority based on score
  let priority: Mission['priority'] = 'low'
  if (report.overall_score < 50) priority = 'critical'
  else if (report.overall_score < 70) priority = 'high'
  else if (report.overall_score < 85) priority = 'medium'
  
  // Get active agents from analysis
  const agents: string[] = []
  if (report.code_quality) agents.push('CODE_QUALITY_MCP')
  if (report.architecture) agents.push('ARCHITECT_MCP')
  if (report.event_loop) agents.push('EVENT_LOOP_MCP')
  if (report.cost_analysis) agents.push('COST_MCP')
  
  // Calculate time ago
  const analyzed = new Date(report.analyzed_at)
  const now = new Date()
  const diff = now.getTime() - analyzed.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  let timestamp = 'Just now'
  if (days > 0) timestamp = `${days}d ago`
  else if (hours > 0) timestamp = `${hours}h ago`
  else if (minutes > 0) timestamp = `${minutes}m ago`
  
  return {
    id: report.report_id,
    title: `Analysis #${report.report_id.slice(-6)} - Score: ${report.overall_score}`,
    type,
    status,
    priority,
    xpReward: report.rpg_summary?.xp_earned || report.overall_score * 10,
    goldReward: Math.floor((report.rpg_summary?.xp_earned || report.overall_score * 10) / 3),
    timestamp,
    agents,
  }
}

export function MissionLog() {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const { data: reports, loading, error } = useReports(undefined, 20, 0)
  
  // Convert reports to missions
  const missions = reports?.map(reportToMission) || []
  
  // Filter missions
  const filteredMissions = missions.filter(m => {
    if (filter === 'all') return true
    if (filter === 'active') return m.status === 'in-progress' || m.status === 'pending'
    if (filter === 'completed') return m.status === 'completed' || m.status === 'failed'
    return true
  })
  
  const activeCount = missions.filter(m => m.status === 'in-progress' || m.status === 'pending').length
  
  return (
    <section className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-0">
        <div className="flex items-center gap-3">
          <Icon name="assignment" className="text-xl text-primary" />
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-white">
            Mission Log
          </h3>
          <Badge variant="primary">{activeCount > 0 ? `${activeCount} ACTIVE` : `${missions.length} TOTAL`}</Badge>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-mono uppercase rounded border transition-all ${
              filter === 'all' 
                ? 'text-primary bg-primary/10 border-primary/30' 
                : 'text-gray-400 hover:text-white bg-surface-highlight border-transparent hover:border-surface-accent'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 text-xs font-mono uppercase rounded border transition-all ${
              filter === 'active' 
                ? 'text-primary bg-primary/10 border-primary/30' 
                : 'text-gray-400 hover:text-white bg-surface-highlight border-transparent hover:border-surface-accent'
            }`}
          >
            Active
          </button>
          <button 
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 text-xs font-mono uppercase rounded border transition-all ${
              filter === 'completed' 
                ? 'text-primary bg-primary/10 border-primary/30' 
                : 'text-gray-400 hover:text-white bg-surface-highlight border-transparent hover:border-surface-accent'
            }`}
          >
            Completed
          </button>
        </div>
      </div>
      
      {/* Mission List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
        {loading && (
          <div className="text-center py-12">
            <Icon name="sync" className="text-3xl text-primary animate-spin" />
            <p className="text-sm text-gray-400 mt-3 font-mono">Loading missions...</p>
          </div>
        )}
        
        {error && !loading && (
          <div className="text-center py-12">
            <Icon name="error" className="text-3xl text-destructive" />
            <p className="text-sm text-gray-400 mt-3 font-mono">Failed to load missions</p>
            <p className="text-xs text-gray-500 mt-1">{error.message}</p>
          </div>
        )}
        
        {!loading && !error && filteredMissions.length === 0 && (
          <div className="text-center py-12">
            <Icon name="assignment_turned_in" className="text-5xl text-gray-600" />
            <p className="text-sm text-gray-400 mt-3">No missions found</p>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              {filter === 'all' 
                ? 'Run a code analysis to create your first mission!' 
                : `No ${filter} missions at the moment`}
            </p>
          </div>
        )}
        
        {filteredMissions.map((mission) => {
          const type = typeConfig[mission.type]
          const status = statusConfig[mission.status]
          const priority = priorityConfig[mission.priority]
          
          return (
            <Link
              key={mission.id}
              to={`/mission/${mission.id}`}
              className="flex items-center gap-4 p-4 bg-surface-dark rounded-lg border border-surface-accent hover:border-primary/30 transition-all group"
            >
              {/* Type Icon */}
              <div className={`size-12 rounded-lg bg-${type.color}/10 border border-${type.color}/30 flex items-center justify-center`}>
                <Icon name={type.icon} className={`text-2xl text-${type.color}`} />
              </div>
              
              {/* Mission Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white group-hover:text-primary transition-colors truncate">
                    {mission.title}
                  </span>
                  <Badge variant={priority.color} size="sm">
                    {mission.priority.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Icon name={status.icon} className={`text-sm text-${status.color}`} />
                    {status.label}
                  </span>
                  <span>{mission.timestamp}</span>
                  <span className="flex items-center gap-1">
                    <Icon name="smart_toy" className="text-sm" />
                    {mission.agents.length} Agents
                  </span>
                </div>
              </div>
              
              {/* Rewards */}
              <div className="flex items-center gap-4 text-sm font-mono">
                <span className="flex items-center gap-1 text-primary">
                  <Icon name="star" className="text-base" filled />
                  +{mission.xpReward} XP
                </span>
                <span className="flex items-center gap-1 text-gold">
                  <Icon name="monetization_on" className="text-base" filled />
                  +{mission.goldReward}
                </span>
              </div>
              
              {/* Arrow */}
              <Icon name="chevron_right" className="text-gray-600 group-hover:text-primary transition-colors" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
