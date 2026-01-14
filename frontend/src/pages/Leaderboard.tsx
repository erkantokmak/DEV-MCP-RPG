import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { ProgressBar } from '../components/ProgressBar'
import { useLeaderboard, useReports } from '../hooks/useApi'
import { useUser } from '../contexts/UserContext'
import { LeaderboardEntry } from '../services/api'

const colorConfig: Record<string, { border: string; text: string; bg: string; shadow: string }> = {
  gold: {
    border: 'border-gold',
    text: 'text-gold',
    bg: 'bg-gold/20',
    shadow: 'shadow-neon-gold',
  },
  silver: {
    border: 'border-silver',
    text: 'text-silver',
    bg: 'bg-silver/10',
    shadow: '',
  },
  bronze: {
    border: 'border-bronze',
    text: 'text-bronze',
    bg: 'bg-bronze/10',
    shadow: '',
  },
  default: {
    border: 'border-gray-700',
    text: 'text-gray-500',
    bg: 'bg-surface-dark',
    shadow: '',
  },
}

const roleNames = ['Code Knight', 'Debug Wizard', 'Architect', 'QA Master', 'DevOps Ninja']

function getPlayerColor(rank: number): string {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  return 'default'
}

function getRole(username: string): string {
  const index = Math.abs(username.charCodeAt(0)) % roleNames.length
  return roleNames[index]
}

function calculateMaxXp(level: number): number {
  let xp = 100
  for (let i = 1; i < level; i++) {
    xp = Math.floor(xp * 1.5)
  }
  return xp
}

function getSanctityLevel(xp: number): { level: string; percent: number } {
  if (xp >= 50000) return { level: 'Divine', percent: 98 }
  if (xp >= 30000) return { level: 'High', percent: 94 }
  if (xp >= 15000) return { level: 'Good', percent: 88 }
  if (xp >= 5000) return { level: 'Average', percent: 65 }
  return { level: 'Risky', percent: 45 }
}

function getBadgesForUser(entry: LeaderboardEntry): { icon: string; color: string }[] {
  const badges: { icon: string; color: string }[] = []
  
  // Rank badge
  if (entry.rank === 1) badges.push({ icon: 'military_tech', color: 'text-gold' })
  else if (entry.rank === 2) badges.push({ icon: 'military_tech', color: 'text-silver' })
  else if (entry.rank === 3) badges.push({ icon: 'military_tech', color: 'text-bronze' })
  
  // XP based badges
  if (entry.xp_total >= 50000) badges.push({ icon: 'verified', color: 'text-primary' })
  if (entry.xp_total >= 20000) badges.push({ icon: 'bolt', color: 'text-secondary' })
  
  // Level based badges
  if (entry.level >= 30) badges.push({ icon: 'shield', color: 'text-orange-400' })
  
  return badges
}

export function Leaderboard() {
  const [timeFilter, setTimeFilter] = useState<'sprint' | 'alltime'>('alltime')
  const { currentUser } = useUser()
  const { data: leaderboard, loading, error } = useLeaderboard(20)
  const { data: reports } = useReports(undefined, 100, 0)
  
  // Calculate guild stats from all users and reports
  const totalXp = leaderboard?.reduce((sum, u) => sum + u.xp_total, 0) || 0
  const avgLevel = leaderboard?.length 
    ? Math.round(leaderboard.reduce((sum, u) => sum + u.level, 0) / leaderboard.length)
    : 1
  const activeQuests = reports?.filter(r => r.status !== 'excellent').length || 0
  
  // Calculate guild tier
  const guildLevel = Math.max(avgLevel, 1)
  const tier = guildLevel >= 50 ? 'DIAMOND TIER' : guildLevel >= 30 ? 'PLATINUM TIER' : guildLevel >= 15 ? 'GOLD TIER' : 'SILVER TIER'
  const nextTier = guildLevel >= 50 ? 'Max' : guildLevel >= 30 ? 'Diamond' : guildLevel >= 15 ? 'Platinum' : 'Gold'
  const progress = Math.min(100, (totalXp % 100000) / 1000)
  
  return (
    <main className="flex-1 flex flex-col bg-background-dark relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none z-0" style={{ backgroundSize: '40px 40px' }} />
      
      {/* Guild Stats Header */}
      <div className="px-6 py-4 border-b border-surface-accent bg-[#12141a] relative z-10">
        <div className="max-w-[1800px] mx-auto w-full flex flex-wrap gap-8 items-center justify-between">
          {/* Guild Level */}
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-full border-2 border-primary flex items-center justify-center bg-primary/10 shadow-neon">
              <Icon name="diversity_3" className="text-primary text-2xl" />
            </div>
            <div>
              <h2 className="text-sm text-gray-400 font-mono uppercase tracking-wider">Guild Level</h2>
              <div className="text-2xl font-display font-bold text-white flex items-baseline gap-2">
                {guildLevel} <span className="text-xs text-primary font-mono">{tier}</span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="flex-1 max-w-2xl">
            <div className="flex justify-between text-xs font-mono uppercase text-gray-400 mb-1">
              <span>Season Progress</span>
              <span>Next Tier: {nextTier} ({Math.round(progress)}%)</span>
            </div>
            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary shadow-neon transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex gap-8 text-right">
            <div>
              <div className="text-xs text-gray-400 font-mono uppercase">Total XP</div>
              <div className="text-xl font-display font-bold text-white">{totalXp.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 font-mono uppercase">Active Quests</div>
              <div className="text-xl font-display font-bold text-secondary">{activeQuests}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Leaderboard Content */}
      <div className="flex-1 overflow-hidden p-6 max-w-[1800px] w-full mx-auto relative z-10">
        <div className="bg-background-dark border border-surface-accent rounded-xl overflow-hidden shadow-2xl h-full flex flex-col relative">
          {/* Corner Decorations */}
          <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-primary/30 rounded-tl-xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-primary/30 rounded-br-xl pointer-events-none" />
          
          {/* Header */}
          <div className="p-6 border-b border-surface-accent bg-surface-dark/50 flex justify-between items-center backdrop-blur-sm">
            <h3 className="text-lg font-display font-bold uppercase text-white flex items-center gap-3">
              <Icon name="leaderboard" className="text-primary" />
              Top Contributors
            </h3>
            <div className="flex bg-background-dark rounded border border-surface-accent p-1">
              <button 
                onClick={() => setTimeFilter('sprint')}
                className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition-colors ${
                  timeFilter === 'sprint' 
                    ? 'bg-primary text-black' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                This Sprint
              </button>
              <button 
                onClick={() => setTimeFilter('alltime')}
                className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition-colors ${
                  timeFilter === 'alltime' 
                    ? 'bg-primary text-black' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All Time
              </button>
            </div>
          </div>
          
          {/* Column Headers */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-mono text-gray-500 uppercase tracking-wider border-b border-surface-accent bg-background-dark">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-4">Hero</div>
            <div className="col-span-3">Level / XP</div>
            <div className="col-span-2 text-center">Code Sanctity</div>
            <div className="col-span-2 text-right">Badges</div>
          </div>
          
          {/* Leaderboard List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {loading && (
              <div className="text-center py-12">
                <Icon name="sync" className="text-3xl text-primary animate-spin" />
                <p className="text-sm text-gray-400 mt-3 font-mono">Loading leaderboard...</p>
              </div>
            )}
            
            {error && !loading && (
              <div className="text-center py-12">
                <Icon name="error" className="text-3xl text-destructive" />
                <p className="text-sm text-gray-400 mt-3 font-mono">Failed to load leaderboard</p>
              </div>
            )}
            
            {!loading && !error && (!leaderboard || leaderboard.length === 0) && (
              <div className="text-center py-12">
                <Icon name="group_off" className="text-5xl text-gray-600" />
                <p className="text-sm text-gray-400 mt-3">No heroes found</p>
                <p className="text-xs text-gray-500 mt-1 font-mono">Be the first to register and claim the top spot!</p>
              </div>
            )}
            
            {leaderboard?.map((player) => {
              const color = getPlayerColor(player.rank)
              const colors = colorConfig[color]
              const maxXp = calculateMaxXp(player.level + 1)
              const currentLevelXp = player.xp_total % maxXp
              const xpProgress = (currentLevelXp / maxXp) * 100
              const sanctity = getSanctityLevel(player.xp_total)
              const badges = getBadgesForUser(player)
              const isCurrentUser = currentUser?.id === player.user_id
              
              return (
                <Link 
                  key={player.user_id}
                  to={`/character/${player.user_id}`}
                  className={`group relative grid grid-cols-12 gap-4 items-center p-4 rounded-lg bg-surface-dark border ${colors.border}/30 hover:border-primary hover:bg-surface-highlight transition-all ${player.rank <= 3 ? colors.shadow : ''} ${isCurrentUser ? 'ring-2 ring-primary/50' : ''}`}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex justify-center">
                    {player.rank <= 3 ? (
                      <div className={`size-10 rounded-full flex items-center justify-center ${colors.bg} border-2 ${colors.border}`}>
                        <span className={`font-display font-bold text-xl ${colors.text}`}>{player.rank}</span>
                      </div>
                    ) : (
                      <span className="text-2xl font-display font-bold text-gray-600">{player.rank}</span>
                    )}
                  </div>
                  
                  {/* Player Info */}
                  <div className="col-span-4 flex items-center gap-4">
                    <div className={`size-14 rounded-lg border-2 ${colors.border}/50 overflow-hidden bg-black/50`}>
                      {player.avatar_url ? (
                        <img src={player.avatar_url} alt={player.username} className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center bg-surface-highlight">
                          <Icon name="person" className="text-2xl text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-white group-hover:text-primary transition-colors flex items-center gap-2">
                        {player.display_name || player.username}
                        {isCurrentUser && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded font-mono">YOU</span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-400 font-mono">Lvl {player.level} {getRole(player.username)}</p>
                    </div>
                  </div>
                  
                  {/* Level / XP */}
                  <div className="col-span-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1 font-mono">
                      <span>XP: {player.xp_total.toLocaleString()}</span>
                      <span>{Math.round(xpProgress)}%</span>
                    </div>
                    <ProgressBar value={xpProgress} max={100} color="primary" size="sm" />
                  </div>
                  
                  {/* Code Sanctity */}
                  <div className="col-span-2 flex flex-col items-center">
                    <div className={`text-2xl font-display font-bold ${
                      sanctity.percent >= 90 ? 'text-primary' : 
                      sanctity.percent >= 70 ? 'text-secondary' : 
                      sanctity.percent >= 50 ? 'text-gold' : 'text-destructive'
                    }`}>
                      {sanctity.percent}%
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono uppercase">{sanctity.level}</span>
                  </div>
                  
                  {/* Badges */}
                  <div className="col-span-2 flex justify-end gap-2">
                    {badges.length > 0 ? (
                      badges.map((badge, i) => (
                        <div key={i} className="size-8 rounded bg-surface-highlight flex items-center justify-center border border-gray-700 group-hover:border-gray-600 transition-colors">
                          <Icon name={badge.icon} className={badge.color} />
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-600 font-mono">No badges yet</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
