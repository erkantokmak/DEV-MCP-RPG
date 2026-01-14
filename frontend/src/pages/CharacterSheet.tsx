import { useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { ProgressBar } from '../components/ProgressBar'
import { useUser as useApiUser } from '../hooks/useApi'
import { useUser } from '../contexts/UserContext'
import { User } from '../services/api'

const colorClasses: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
  legendary: {
    bg: 'bg-gold/10',
    border: 'border-gold',
    text: 'text-gold',
    shadow: 'shadow-neon-gold',
  },
  primary: {
    bg: 'bg-primary/10',
    border: 'border-primary',
    text: 'text-primary',
    shadow: 'shadow-neon',
  },
  secondary: {
    bg: 'bg-secondary/10',
    border: 'border-secondary',
    text: 'text-secondary',
    shadow: 'shadow-neon-secondary',
  },
  destructive: {
    bg: 'bg-destructive/10',
    border: 'border-destructive',
    text: 'text-destructive',
    shadow: 'shadow-neon-destructive',
  },
  gray: {
    bg: 'bg-gray-800',
    border: 'border-gray-700',
    text: 'text-gray-500',
    shadow: '',
  },
}

// Generate character data from user
function generateCharacterData(user: User) {
  const roleNames = ['Mage', 'Knight', 'Rogue', 'Paladin', 'Ranger']
  const titles = ['Full-Stack Architect', 'Bug Slayer', 'Code Guardian', 'System Admin', 'DevOps Master']
  const skills = [
    ['React.js', 'TypeScript', 'Node.js', 'GraphQL', 'Tailwind', 'Docker'],
    ['Python', 'Django', 'PostgreSQL', 'Redis', 'AWS', 'Kubernetes'],
    ['Java', 'Spring Boot', 'Hibernate', 'Kafka', 'MongoDB', 'Terraform'],
    ['Go', 'gRPC', 'Prometheus', 'Grafana', 'Vault', 'Consul'],
    ['Rust', 'WebAssembly', 'WASM', 'Deno', 'Bun', 'Edge Functions'],
  ]
  
  const idx = Math.abs(user.username.charCodeAt(0)) % 5
  
  // Calculate stats from XP
  const baseScore = Math.min(100, 50 + Math.floor(user.xp_total / 500))
  
  return {
    id: user.id.slice(0, 8),
    name: user.display_name || user.username,
    title: titles[idx],
    class: roleNames[idx],
    level: user.level,
    xp: user.xp_total % calculateMaxXp(user.level),
    maxXp: calculateMaxXp(user.level),
    avatar: user.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`,
    stats: {
      architecture: Math.min(100, baseScore + (idx * 5) - 10),
      performance: Math.min(100, baseScore - (idx * 3) + 5),
      quality: Math.min(100, baseScore + (idx * 2)),
    },
    skills: skills[idx],
    achievements: generateAchievements(user),
    recentLoot: generateRecentLoot(user),
  }
}

function calculateMaxXp(level: number): number {
  let xp = 100
  for (let i = 1; i < level; i++) {
    xp = Math.floor(xp * 1.5)
  }
  return xp
}

function generateAchievements(user: User) {
  const achievements = [
    { id: '1', name: 'First Steps', icon: 'footprint', color: 'primary', description: 'Completed first analysis', unlocked: user.xp_total > 0 },
    { id: '2', name: 'Bug Squasher', icon: 'pest_control', color: 'destructive', description: 'Fixed 5 Critical bugs in a row', unlocked: user.xp_total >= 500 },
    { id: '3', name: 'Clean Coder', icon: 'cleaning_services', color: 'secondary', description: 'Passed 10 code reviews', unlocked: user.xp_total >= 1000 },
    { id: '4', name: 'The Scout', icon: 'visibility', color: 'primary', description: 'First to identify an issue', unlocked: user.xp_total >= 2000 },
    { id: '5', name: 'Refactor King', icon: 'crown', color: 'legendary', description: 'Reduced code debt by 20%', unlocked: user.xp_total >= 5000 },
    { id: '6', name: 'Night Owl', icon: 'lock', color: 'gray', description: '???', unlocked: false },
  ]
  return achievements
}

function generateRecentLoot(user: User) {
  if (user.xp_total === 0) return []
  
  const loot = []
  
  if (user.xp_total >= 100) {
    loot.push({ id: '1', name: 'Welcome Badge', icon: 'verified', color: 'primary', description: 'Joined the guild.', xp: 100, time: 'Recently' })
  }
  
  if (user.xp_total >= 500) {
    loot.push({ id: '2', name: 'Quality Seal', icon: 'workspace_premium', color: 'secondary', description: 'First quality analysis.', xp: 250, time: 'Recently' })
  }
  
  if (user.xp_total >= 1000) {
    loot.push({ id: '3', name: 'Code Scroll', icon: 'scrollable_header', color: 'secondary', description: 'Documented code.', xp: 150, time: 'Recently' })
  }
  
  if (user.xp_total >= 5000) {
    loot.push({ id: '4', name: 'Legendary Badge', icon: 'military_tech', color: 'legendary', description: 'Achieved 5000 XP.', xp: 500, time: 'Recently' })
  }
  
  return loot.slice(0, 4)
}

export function CharacterSheet() {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useUser()
  
  // If viewing own profile and logged in, use currentUser
  const isOwnProfile = id === currentUser?.id || id === 'me'
  const { data: fetchedUser, loading, error } = useApiUser(isOwnProfile ? currentUser?.id || '' : id || '')
  
  const user = isOwnProfile && currentUser ? currentUser : fetchedUser
  
  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto bg-background-dark relative p-6 flex items-center justify-center">
        <div className="text-center">
          <Icon name="sync" className="text-4xl text-primary animate-spin" />
          <p className="text-gray-400 font-mono mt-4">Loading character data...</p>
        </div>
      </main>
    )
  }
  
  if (error || !user) {
    return (
      <main className="flex-1 overflow-y-auto bg-background-dark relative p-6 flex items-center justify-center">
        <div className="text-center">
          <Icon name="person_off" className="text-5xl text-gray-600" />
          <h2 className="text-xl font-display font-bold text-white mt-4">Character Not Found</h2>
          <p className="text-gray-400 font-mono mt-2">This hero doesn't exist or has left the guild.</p>
        </div>
      </main>
    )
  }
  
  const character = generateCharacterData(user)
  
  return (
    <main className="flex-1 overflow-y-auto bg-background-dark relative p-6 custom-scrollbar">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.05] z-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(#1f2937 15%, transparent 16%), radial-gradient(#1f2937 15%, transparent 16%)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px',
      }} />
      
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Column - Character Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Character Card */}
          <div className="rounded-xl border border-surface-accent bg-surface-dark p-6 relative overflow-hidden group">
            {/* Glow Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 blur-3xl rounded-full" />
            
            <div className="relative flex flex-col items-center">
              {/* Avatar */}
              <div className="relative size-48 rounded-lg border-2 border-primary/50 overflow-hidden shadow-neon mb-6 bg-black/50 group-hover:border-primary transition-colors duration-500">
                <img 
                  src={character.avatar} 
                  alt={character.name}
                  className="size-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 text-center">
                  <span className="font-mono text-xs text-primary tracking-widest">ID: {character.id}</span>
                </div>
              </div>
              
              {/* Name & Title */}
              <h2 className="text-3xl font-display font-bold text-white tracking-wide mb-1">{character.name}</h2>
              <p className="text-gray-400 font-mono text-sm tracking-wider uppercase mb-4">{character.title}</p>
              
              {/* Class Badge */}
              <div className="flex items-center gap-2 px-3 py-1 rounded bg-secondary/10 border border-secondary/30 text-secondary mb-6 shadow-neon-secondary">
                <Icon name="auto_awesome" className="text-sm" />
                <span className="text-xs font-bold uppercase tracking-widest">Class: {character.class}</span>
              </div>
              
              {/* Level & XP Bar */}
              <div className="w-full space-y-2 mb-6">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-white">LEVEL {character.level}</span>
                  <span className="text-primary">XP: {character.xp.toLocaleString()} / {character.maxXp.toLocaleString()}</span>
                </div>
                <div className="h-3 w-full bg-gray-900 rounded-sm border border-gray-700 overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-primary/80 to-primary shadow-[0_0_10px_theme('colors.primary')] relative"
                    style={{ width: `${(character.xp / character.maxXp) * 100}%` }}
                  >
                    <div className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l from-white/30 to-transparent" />
                  </div>
                  <div className="absolute top-0 bottom-0 left-[25%] w-px bg-black/40" />
                  <div className="absolute top-0 bottom-0 left-[50%] w-px bg-black/40" />
                  <div className="absolute top-0 bottom-0 left-[75%] w-px bg-black/40" />
                </div>
              </div>
              
              {/* Stats */}
              <div className="w-full space-y-4 pt-4 border-t border-surface-accent">
                {/* Architecture */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono uppercase text-gray-400 tracking-wider">
                    <span className="flex items-center gap-1">
                      <Icon name="architecture" className="text-secondary text-sm" /> Architecture
                    </span>
                    <span className="text-secondary">{character.stats.architecture}/100</span>
                  </div>
                  <ProgressBar value={character.stats.architecture} max={100} color="secondary" size="sm" />
                </div>
                
                {/* Performance */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono uppercase text-gray-400 tracking-wider">
                    <span className="flex items-center gap-1">
                      <Icon name="speed" className="text-gold text-sm" /> Performance
                    </span>
                    <span className="text-gold">{character.stats.performance}/100</span>
                  </div>
                  <ProgressBar value={character.stats.performance} max={100} color="gold" size="sm" />
                </div>
                
                {/* Quality */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono uppercase text-gray-400 tracking-wider">
                    <span className="flex items-center gap-1">
                      <Icon name="verified" className="text-primary text-sm" /> Quality
                    </span>
                    <span className="text-primary">{character.stats.quality}/100</span>
                  </div>
                  <ProgressBar value={character.stats.quality} max={100} color="primary" size="sm" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Skills */}
          <div className="rounded-xl border border-surface-accent bg-surface-dark p-6">
            <h3 className="flex items-center gap-2 text-sm font-display font-bold uppercase tracking-widest text-white mb-4">
              <Icon name="code" className="text-primary" /> Active Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {character.skills.map((skill) => (
                <span 
                  key={skill}
                  className="px-3 py-1.5 rounded bg-surface-highlight border border-surface-accent text-xs font-mono text-gray-300 hover:border-primary hover:text-primary transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Column - Achievements & Loot */}
        <div className="lg:col-span-8 space-y-6">
          {/* Achievements */}
          <div className="rounded-xl border border-surface-accent bg-surface-dark p-6">
            <h3 className="flex items-center gap-2 text-sm font-display font-bold uppercase tracking-widest text-white mb-6">
              <Icon name="emoji_events" className="text-gold" /> Achievements
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {character.achievements.map((achievement) => {
                const colors = colorClasses[achievement.color]
                return (
                  <div 
                    key={achievement.id}
                    className={`relative p-4 rounded-lg border ${achievement.unlocked ? colors.border + '/30' : 'border-gray-800'} ${achievement.unlocked ? colors.bg : 'bg-gray-900/50'} group hover:${achievement.unlocked ? colors.border : 'border-gray-700'} transition-all`}
                  >
                    <div className={`size-12 rounded-lg ${achievement.unlocked ? colors.bg : 'bg-gray-800'} border ${achievement.unlocked ? colors.border + '/30' : 'border-gray-700'} flex items-center justify-center mb-3 ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                      <Icon name={achievement.icon} className={`text-2xl ${achievement.unlocked ? colors.text : 'text-gray-600'}`} />
                    </div>
                    <h4 className={`font-display font-bold text-sm ${achievement.unlocked ? 'text-white' : 'text-gray-600'}`}>
                      {achievement.name}
                    </h4>
                    <p className={`text-xs mt-1 ${achievement.unlocked ? 'text-gray-400' : 'text-gray-700'}`}>
                      {achievement.description}
                    </p>
                    {!achievement.unlocked && (
                      <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                        <Icon name="lock" className="text-2xl text-gray-600" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Recent Loot */}
          <div className="rounded-xl border border-surface-accent bg-surface-dark p-6">
            <h3 className="flex items-center gap-2 text-sm font-display font-bold uppercase tracking-widest text-white mb-6">
              <Icon name="inventory_2" className="text-secondary" /> Recent Loot
            </h3>
            
            {character.recentLoot.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="inventory" className="text-4xl text-gray-600" />
                <p className="text-gray-400 mt-3">No loot yet</p>
                <p className="text-xs text-gray-500 font-mono">Complete analyses to earn loot!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {character.recentLoot.map((loot) => {
                  const colors = colorClasses[loot.color]
                  return (
                    <div 
                      key={loot.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${colors.border}/20 ${colors.bg} hover:${colors.border}/40 transition-all group`}
                    >
                      <div className={`size-12 rounded-lg ${colors.bg} border ${colors.border}/30 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon name={loot.icon} className={`text-2xl ${colors.text}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-display font-bold text-white group-hover:text-primary transition-colors">{loot.name}</h4>
                        <p className="text-xs text-gray-400">{loot.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-primary font-mono font-bold">+{loot.xp} XP</span>
                        <p className="text-[10px] text-gray-500">{loot.time}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
