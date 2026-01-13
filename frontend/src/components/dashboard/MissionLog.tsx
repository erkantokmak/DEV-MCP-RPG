import { Link } from 'react-router-dom'
import { Icon } from '../Icon'
import { Badge } from '../Badge'

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

const missions: Mission[] = [
  {
    id: '1',
    title: 'Fix memory leak in DataProcessor.js',
    type: 'bug',
    status: 'in-progress',
    priority: 'critical',
    xpReward: 500,
    goldReward: 150,
    timestamp: '2 min ago',
    agents: ['CODE_QUALITY_MCP', 'ARCHITECT_MCP'],
  },
  {
    id: '2',
    title: 'Implement OAuth2 authentication',
    type: 'feature',
    status: 'completed',
    priority: 'high',
    xpReward: 750,
    goldReward: 200,
    timestamp: '15 min ago',
    agents: ['ARCHITECT_MCP'],
  },
  {
    id: '3',
    title: 'Refactor legacy API endpoints',
    type: 'refactor',
    status: 'pending',
    priority: 'medium',
    xpReward: 300,
    goldReward: 80,
    timestamp: '1 hour ago',
    agents: ['CODE_QUALITY_MCP'],
  },
  {
    id: '4',
    title: 'SQL injection vulnerability scan',
    type: 'security',
    status: 'failed',
    priority: 'critical',
    xpReward: 1000,
    goldReward: 500,
    timestamp: '3 hours ago',
    agents: ['LIGHTHOUSE_MCP'],
  },
  {
    id: '5',
    title: 'Add unit tests for UserService',
    type: 'feature',
    status: 'completed',
    priority: 'low',
    xpReward: 200,
    goldReward: 50,
    timestamp: '5 hours ago',
    agents: ['CODE_QUALITY_MCP'],
  },
]

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

export function MissionLog() {
  return (
    <section className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-0">
        <div className="flex items-center gap-3">
          <Icon name="assignment" className="text-xl text-primary" />
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-white">
            Mission Log
          </h3>
          <Badge variant="primary">{missions.length} ACTIVE</Badge>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs font-mono uppercase text-gray-400 hover:text-white bg-surface-highlight rounded border border-transparent hover:border-surface-accent transition-all">
            All
          </button>
          <button className="px-3 py-1.5 text-xs font-mono uppercase text-primary bg-primary/10 rounded border border-primary/30">
            Active
          </button>
          <button className="px-3 py-1.5 text-xs font-mono uppercase text-gray-400 hover:text-white bg-surface-highlight rounded border border-transparent hover:border-surface-accent transition-all">
            Completed
          </button>
        </div>
      </div>
      
      {/* Mission List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
        {missions.map((mission) => {
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
