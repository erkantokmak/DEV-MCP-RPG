import { Link } from 'react-router-dom'
import { Icon } from '../Icon'
import { Avatar } from '../Avatar'
import { Badge } from '../Badge'
import { ProgressBar } from '../ProgressBar'
import { useUser } from '../../contexts/UserContext'
import { useUsers } from '../../hooks/useApi'
import { User } from '../../services/api'

interface PartyMember {
  id: string
  name: string
  role: string
  level: number
  xp: number
  maxXp: number
  avatar: string
  status: 'online' | 'offline' | 'away'
  isCurrentUser?: boolean
}

const statusColors = {
  online: 'bg-primary shadow-neon',
  offline: 'bg-gray-600',
  away: 'bg-gold',
}

// Calculate XP needed for next level
function calculateMaxXp(level: number): number {
  let xp = 100
  for (let i = 1; i < level; i++) {
    xp = Math.floor(xp * 1.5)
  }
  return xp
}

// Convert User to PartyMember
function userToPartyMember(user: User, isCurrentUser: boolean = false): PartyMember {
  const roles = ['CODE KNIGHT', 'DEBUG WIZARD', 'ARCHITECT', 'QA MASTER', 'DEVOPS NINJA']
  const role = roles[Math.abs(user.username.charCodeAt(0)) % roles.length]
  
  return {
    id: user.id,
    name: user.display_name || user.username,
    role,
    level: user.level,
    xp: user.xp_total % calculateMaxXp(user.level),
    maxXp: calculateMaxXp(user.level),
    avatar: user.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`,
    status: isCurrentUser ? 'online' : (Math.random() > 0.5 ? 'online' : 'offline'),
    isCurrentUser,
  }
}

export function PartySidebar() {
  const { currentUser } = useUser()
  const { data: users, loading, error } = useUsers(10, 0)
  
  // Prepare party members list
  const partyMembers: PartyMember[] = []
  
  // Add current user first if exists
  if (currentUser) {
    partyMembers.push(userToPartyMember(currentUser, true))
  }
  
  // Add other users from API
  if (users) {
    users
      .filter(u => u.id !== currentUser?.id)
      .slice(0, 5)
      .forEach(user => {
        partyMembers.push(userToPartyMember(user, false))
      })
  }
  
  const onlineCount = partyMembers.filter(m => m.status === 'online').length
  
  return (
    <aside className="w-80 border-r border-surface-accent bg-surface-dark shrink-0 flex flex-col overflow-hidden">
      {/* Party Header */}
      <div className="p-4 border-b border-surface-accent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-primary/10 border border-primary/30">
            <Icon name="groups" className="text-primary text-xl" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm uppercase tracking-widest text-white">
              Active Party
            </h3>
            <p className="text-xs text-gray-400 font-mono">
              {onlineCount} / {partyMembers.length} MEMBERS ONLINE
            </p>
          </div>
        </div>
      </div>
      
      {/* Party Members List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {loading && (
          <div className="text-center py-8">
            <Icon name="sync" className="text-2xl text-primary animate-spin" />
            <p className="text-xs text-gray-400 mt-2 font-mono">Loading party...</p>
          </div>
        )}
        
        {error && !loading && (
          <div className="text-center py-8">
            <Icon name="error" className="text-2xl text-destructive" />
            <p className="text-xs text-gray-400 mt-2 font-mono">Failed to load party</p>
          </div>
        )}
        
        {!loading && !currentUser && partyMembers.length === 0 && (
          <div className="text-center py-8">
            <Icon name="person_off" className="text-4xl text-gray-600" />
            <p className="text-sm text-gray-400 mt-2">No users yet</p>
            <p className="text-xs text-gray-500 mt-1 font-mono">Create an account to join the party!</p>
          </div>
        )}
        
        {partyMembers.map((member, index) => (
          <Link
            key={member.id}
            to={`/character/${member.id}`}
            className="flex items-center gap-3 p-3 rounded-lg bg-surface-highlight hover:bg-surface-accent border border-transparent hover:border-primary/30 transition-all group"
          >
            <div className="relative">
              <Avatar 
                src={member.avatar} 
                size="lg"
                border={member.isCurrentUser ? 'primary' : 'default'}
              />
              <span className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-surface-dark ${statusColors[member.status]}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white truncate group-hover:text-primary transition-colors">
                  {member.name}
                </span>
                {member.isCurrentUser && (
                  <Badge variant="primary" size="sm">YOU</Badge>
                )}
              </div>
              <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                {member.role}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge variant="secondary" size="sm">
                  LV.{member.level}
                </Badge>
                <div className="flex-1">
                  <ProgressBar 
                    value={member.xp} 
                    max={member.maxXp} 
                    color="primary" 
                    size="sm" 
                  />
                </div>
              </div>
            </div>
            <Icon name="chevron_right" className="text-gray-600 group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>
      
      {/* Party Actions */}
      <div className="p-4 border-t border-surface-accent space-y-2">
        {!currentUser ? (
          <Link
            to="/settings"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded font-display font-bold text-xs uppercase tracking-wider hover:bg-primary hover:text-black transition-all"
          >
            <Icon name="login" className="text-base" />
            Login / Register
          </Link>
        ) : (
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded font-display font-bold text-xs uppercase tracking-wider hover:bg-primary hover:text-black transition-all">
            <Icon name="person_add" className="text-base" />
            Invite to Party
          </button>
        )}
        <Link 
          to="/leaderboard"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-surface-highlight border border-surface-accent text-gray-400 rounded font-display font-bold text-xs uppercase tracking-wider hover:border-secondary hover:text-secondary transition-all"
        >
          <Icon name="leaderboard" className="text-base" />
          Guild Leaderboard
        </Link>
      </div>
    </aside>
  )
}
