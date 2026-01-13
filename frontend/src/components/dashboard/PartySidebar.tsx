import { Link } from 'react-router-dom'
import { Icon } from '../Icon'
import { Avatar } from '../Avatar'
import { Badge } from '../Badge'
import { ProgressBar } from '../ProgressBar'

interface PartyMember {
  id: string
  name: string
  role: string
  level: number
  xp: number
  maxXp: number
  avatar: string
  status: 'online' | 'offline' | 'away'
}

const partyMembers: PartyMember[] = [
  {
    id: 'me',
    name: 'CyberNinja_007',
    role: 'CODE KNIGHT',
    level: 42,
    xp: 7500,
    maxXp: 10000,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDheJ4yHmGqYglVsxmaj8be-WiQx0AaaTAWuphUJDK_pJ7HFEl6JS3eCCuOTv7pW_7O6qJnySNRvYqzPgbYZdSkY_Q_krkDx4hHarqmJOAtfYThD-ymVZgECAnoTecT4P_MqB-K5ckneI4vEsqKyKnfohOBMfoQN1KHPibt6qYU9PKxz11rDW8YgITl__rcDYIdWpyNPFZHb-z04eHCAU7B37K3TewTx14xE9ujaIt6b_t114zMrXyqp-8dAf2Km6FpnsFnfs_Yn8k',
    status: 'online',
  },
  {
    id: '2',
    name: 'NullPointer',
    role: 'DEBUG WIZARD',
    level: 38,
    xp: 4200,
    maxXp: 8000,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOvg51FS5eL0DwxvAZqxb39bG1sPFbQy3YcNkwJgq1u_mJU05uJaTG6gwYCYe6qxT-d1WIW5RjmO46_TE1dO1uIKQP89-PNE8bYTKhHglZbP_aS0KFM9FdgHPWvZMHu4mbTLExTRFNQ1sAhZvW0SXLjG3I2Lc0AQzQVCKUdv_MX-6qJoVXxJ_aFLqKHoGzE9A0v5hfGIJtO3NJEflzs2XJY_wN_4ddqLDCuYUxHnWzZtx7k6o5GdaOpXnS5b_BERwLUEDiTBRJTWU',
    status: 'online',
  },
  {
    id: '3',
    name: 'ByteBreaker',
    role: 'ARCHITECT',
    level: 51,
    xp: 9100,
    maxXp: 15000,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUqzRJd9Exy6Pf-1jN8o3Xu5C3Yn_e9n8C4lE8gJyp9HrJ4L1sQx3p7kR2c8bT1mJ5aW7fN4cVxB9D6oH2iR1rK7qN0Z5yL2dP3gT4s5U6vE8xM0fS1nO2jA7bK9cR3mW4vH5qI6tY8zX0wP7sL9nJ',
    status: 'away',
  },
  {
    id: '4',
    name: 'SyntaxSlayer',
    role: 'CODE KNIGHT',
    level: 33,
    xp: 2800,
    maxXp: 6000,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDheJ4yHmGqYglVsxmaj8be-WiQx0AaaTAWuphUJDK_pJ7HFEl6JS3eCCuOTv7pW_7O6qJnySNRvYqzPgbYZdSkY_Q_krkDx4hHarqmJOAtfYThD-ymVZgECAnoTecT4P_MqB-K5ckneI4vEsqKyKnfohOBMfoQN1KHPibt6qYU9PKxz11rDW8YgITl__rcDYIdWpyNPFZHb-z04eHCAU7B37K3TewTx14xE9ujaIt6b_t114zMrXyqp-8dAf2Km6FpnsFnfs_Yn8k',
    status: 'offline',
  },
]

const statusColors = {
  online: 'bg-primary shadow-neon',
  offline: 'bg-gray-600',
  away: 'bg-gold',
}

export function PartySidebar() {
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
              4 / 6 MEMBERS ONLINE
            </p>
          </div>
        </div>
      </div>
      
      {/* Party Members List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
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
                border={index === 0 ? 'primary' : 'default'}
              />
              <span className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-surface-dark ${statusColors[member.status]}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white truncate group-hover:text-primary transition-colors">
                  {member.name}
                </span>
                {index === 0 && (
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
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded font-display font-bold text-xs uppercase tracking-wider hover:bg-primary hover:text-black transition-all">
          <Icon name="person_add" className="text-base" />
          Invite to Party
        </button>
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
