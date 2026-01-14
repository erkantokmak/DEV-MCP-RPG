import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useUser } from '../contexts/UserContext'

// Agent configuration state
interface AgentConfig {
  id: string
  name: string
  role: string
  icon: string
  color: 'primary' | 'secondary' | 'orange'
  enabled: boolean
  strictness: number
}

const initialAgents: AgentConfig[] = [
  { id: 'sensei', name: 'The Sensei', role: 'CODE QUALITY', icon: 'psychology', color: 'primary', enabled: true, strictness: 85 },
  { id: 'scout', name: 'The Scout', role: 'SECURITY', icon: 'visibility', color: 'secondary', enabled: true, strictness: 75 },
  { id: 'tank', name: 'The Tank', role: 'INFRASTRUCTURE', icon: 'shield', color: 'orange', enabled: true, strictness: 50 },
]

interface VisualSetting {
  id: string
  name: string
  description: string
  icon: string
  type: 'toggle' | 'slider'
  value: boolean | number
}

const initialVisualSettings: VisualSetting[] = [
  { id: 'scanlines', name: 'CRT Scanlines', description: 'Enable retro overlay effect.', icon: 'blur_on', type: 'toggle', value: true },
  { id: 'glow', name: 'Neon Glow Intensity', description: 'Adjust bloom strength for UI elements.', icon: 'wb_twilight', type: 'slider', value: 70 },
  { id: 'sounds', name: 'Interface Sounds', description: 'Clicks, hums, and error alerts.', icon: 'volume_up', type: 'toggle', value: false },
]

const sidebarItems = [
  { id: 'agents', label: 'Agent Protocols', icon: 'smart_toy', active: true },
  { id: 'boss', label: 'Boss Health', icon: 'shield_with_heart', active: false },
  { id: 'interface', label: 'Interface', icon: 'tune', active: false },
  { id: 'profile', label: 'Profile', icon: 'badge', active: false },
]

const colorConfig = {
  primary: {
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    text: 'text-primary',
    toggle: '',
  },
  secondary: {
    bg: 'bg-secondary/10',
    border: 'border-secondary/30',
    text: 'text-secondary',
    toggle: 'cyber-toggle-secondary',
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-500',
    toggle: 'style="filter: hue-rotate(90deg);"',
  },
}

export function Settings() {
  const { currentUser, login, logout, register, loading: userLoading, error: userError } = useUser()
  const [agents, setAgents] = useState(initialAgents)
  const [visualSettings, setVisualSettings] = useState(initialVisualSettings)
  const [bossThresholds, setBossThresholds] = useState({ stable: 80, warning: 50, critical: 30 })
  const [cpuLoad] = useState(12)
  
  // Login/Register form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [loginUsername, setLoginUsername] = useState('')
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    displayName: '',
  })

  const toggleAgent = (id: string) => {
    setAgents(agents.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))
  }

  const updateAgentStrictness = (id: string, value: number) => {
    setAgents(agents.map(a => a.id === id ? { ...a, strictness: value } : a))
  }

  const toggleVisualSetting = (id: string) => {
    setVisualSettings(visualSettings.map(s => 
      s.id === id && s.type === 'toggle' ? { ...s, value: !s.value } : s
    ))
  }

  const updateVisualSlider = (id: string, value: number) => {
    setVisualSettings(visualSettings.map(s => 
      s.id === id && s.type === 'slider' ? { ...s, value } : s
    ))
  }
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginUsername.trim()) return
    await login(loginUsername.trim())
    setLoginUsername('')
  }
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registerForm.username.trim()) return
    await register({
      username: registerForm.username.trim(),
      email: registerForm.email.trim() || undefined,
      display_name: registerForm.displayName.trim() || undefined,
    })
    setRegisterForm({ username: '', email: '', displayName: '' })
  }

  return (
    <main className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-surface-accent bg-background-dark shrink-0">
        <nav className="flex-1 py-6 px-4 space-y-1">
          <h3 className="px-2 text-[10px] font-mono uppercase text-gray-500 tracking-widest mb-4">System Controls</h3>
          
          {sidebarItems.slice(0, 3).map((item) => (
            <a 
              key={item.id}
              href={`#${item.id}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded group transition-colors ${
                item.active 
                  ? 'bg-primary/10 border border-primary/30 text-primary shadow-[0_0_10px_rgba(63,255,20,0.1)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon name={item.icon} className="text-lg" />
              <span className="text-sm font-bold uppercase tracking-wider font-display">{item.label}</span>
              {item.active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-neon" />}
            </a>
          ))}
          
          <div className="my-4 border-t border-surface-accent" />
          <h3 className="px-2 text-[10px] font-mono uppercase text-gray-500 tracking-widest mb-4">Account</h3>
          
          {sidebarItems.slice(3).map((item) => (
            <a 
              key={item.id}
              href={`#${item.id}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded text-gray-400 hover:text-white hover:bg-white/5 group transition-colors"
            >
              <Icon name={item.icon} className="text-lg" />
              <span className="text-sm font-bold uppercase tracking-wider font-display">{item.label}</span>
            </a>
          ))}
        </nav>
        
        {/* CPU Load */}
        <div className="p-4 border-t border-surface-accent bg-surface-dark/50">
          <div className="flex justify-between items-center text-[10px] font-mono uppercase text-gray-500 mb-2">
            <span>CPU Load</span>
            <span className="text-primary">{cpuLoad}%</span>
          </div>
          <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary shadow-neon" style={{ width: `${cpuLoad}%` }} />
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-background-dark relative overflow-y-auto custom-scrollbar">
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.05]" style={{
          backgroundImage: 'radial-gradient(#3fff14 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
        
        <div className="max-w-5xl w-full mx-auto p-8 z-10 space-y-12">
          {/* Section 1: Agent Protocols */}
          <section id="agents">
            <div className="flex items-end justify-between mb-6 pb-2 border-b border-surface-accent">
              <div>
                <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider flex items-center gap-3">
                  <span className="text-primary">01 //</span> Agent Protocols
                </h2>
                <p className="text-sm text-gray-500 mt-1 font-mono">Manage active MCP agents and sensitivity levels.</p>
              </div>
              <button className="text-xs bg-surface-highlight hover:bg-surface-accent px-3 py-1 rounded border border-gray-700 text-gray-300 font-mono uppercase">
                Reset Defaults
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => {
                const colors = colorConfig[agent.color]
                return (
                  <div key={agent.id} className={`group relative bg-surface-dark border border-surface-accent p-5 rounded-lg hover:${colors.border.replace('/30', '/50')} transition-all`}>
                    {/* Corner Decorations */}
                    <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${colors.border} rounded-tl-sm opacity-50 group-hover:opacity-100 transition-opacity`} />
                    <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${colors.border} rounded-br-sm opacity-50 group-hover:opacity-100 transition-opacity`} />
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded ${colors.bg} border ${colors.border} flex items-center justify-center ${colors.text}`}>
                          <Icon name={agent.icon} />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-white uppercase">{agent.name}</h3>
                          <span className={`text-[10px] ${colors.text} font-mono ${colors.bg} px-1 rounded`}>{agent.role}</span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={agent.enabled}
                        onChange={() => toggleAgent(agent.id)}
                        className="cyber-toggle"
                      />
                    </div>
                    
                    <p className="text-xs text-gray-400 mb-4 h-8 leading-snug">
                      {agent.id === 'sensei' && 'Analyzes code structure, complexity, and architectural patterns.'}
                      {agent.id === 'scout' && 'Detects vulnerabilities, secrets, and auth risks in real-time.'}
                      {agent.id === 'tank' && 'Monitors docker containers, build pipelines, and deployment health.'}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono uppercase text-gray-500">
                        <span>Strictness</span>
                        <span className={colors.text}>{agent.strictness}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={agent.strictness}
                        onChange={(e) => updateAgentStrictness(agent.id, parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
          
          {/* Section 2: Boss Health Calibration */}
          <section id="boss">
            <div className="flex items-end justify-between mb-6 pb-2 border-b border-surface-accent">
              <div>
                <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider flex items-center gap-3">
                  <span className="text-destructive">02 //</span> Boss Health Calibration
                </h2>
                <p className="text-sm text-gray-500 mt-1 font-mono">Define stability thresholds. Dropping below these values triggers RPG events.</p>
              </div>
            </div>
            
            <div className="bg-surface-dark border border-surface-accent p-8 rounded-lg relative overflow-hidden">
              {/* Background Icon */}
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Icon name="ecg_heart" className="text-9xl" />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
                {/* Sliders */}
                <div className="space-y-8">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-primary">Stable Threshold</label>
                      <span className="font-mono text-primary">{bossThresholds.stable}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={bossThresholds.stable}
                      onChange={(e) => setBossThresholds({ ...bossThresholds, stable: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Health above {bossThresholds.stable}% is considered robust.</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-secondary">Warning Threshold</label>
                      <span className="font-mono text-secondary">{bossThresholds.warning}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={bossThresholds.warning}
                      onChange={(e) => setBossThresholds({ ...bossThresholds, warning: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Health between {bossThresholds.critical}% and {bossThresholds.warning}% triggers warning events.</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-destructive">Critical Failure</label>
                      <span className="font-mono text-destructive">{bossThresholds.critical}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={bossThresholds.critical}
                      onChange={(e) => setBossThresholds({ ...bossThresholds, critical: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Below {bossThresholds.critical}% initiates lockdown protocols.</p>
                  </div>
                </div>
                
                {/* Preview Visualization */}
                <div className="flex flex-col justify-center border-l border-surface-accent pl-10">
                  <h4 className="text-xs font-mono uppercase text-gray-400 mb-4 tracking-widest">Preview Visualization</h4>
                  <div className="relative h-12 w-full bg-[#1e232b] border border-surface-accent rounded overflow-hidden flex gap-1 p-1 mb-2">
                    <div 
                      className="h-full bg-gradient-to-r from-destructive via-secondary to-primary rounded-sm shadow-neon relative overflow-hidden"
                      style={{ width: `${bossThresholds.stable}%` }}
                    >
                      <div className="absolute inset-0 w-full h-full" style={{
                        backgroundImage: 'linear-gradient(45deg,rgba(0,0,0,.1) 25%,transparent 25%,transparent 50%,rgba(0,0,0,.1) 50%,rgba(0,0,0,.1) 75%,transparent 75%,transparent)',
                        backgroundSize: '1rem 1rem',
                      }} />
                    </div>
                    
                    {/* Threshold Markers */}
                    <div className="absolute top-0 bottom-0 border-l border-dashed border-white/50 z-20" style={{ left: `${bossThresholds.critical}%` }}>
                      <span className="absolute -top-3 left-1 text-[8px] font-mono text-destructive">CRIT</span>
                    </div>
                    <div className="absolute top-0 bottom-0 border-l border-dashed border-white/50 z-20" style={{ left: `${bossThresholds.warning}%` }}>
                      <span className="absolute -top-3 left-1 text-[8px] font-mono text-secondary">WARN</span>
                    </div>
                    <div className="absolute top-0 bottom-0 border-l border-dashed border-white/50 z-20" style={{ left: `${bossThresholds.stable}%` }}>
                      <span className="absolute -top-3 left-1 text-[8px] font-mono text-primary">STABLE</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-display font-bold text-primary">{bossThresholds.stable}% HP</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Section 3: Visual Interface */}
          <section id="interface">
            <div className="flex items-end justify-between mb-6 pb-2 border-b border-surface-accent">
              <div>
                <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider flex items-center gap-3">
                  <span className="text-gray-500">03 //</span> Visual Interface
                </h2>
                <p className="text-sm text-gray-500 mt-1 font-mono">Adjust the cyberpunk aesthetic parameters.</p>
              </div>
            </div>
            
            <div className="bg-surface-dark border border-surface-accent p-6 rounded-lg">
              <div className="space-y-6">
                {visualSettings.map((setting, index) => (
                  <div key={setting.id}>
                    {index > 0 && <div className="h-px bg-surface-accent w-full mb-6" />}
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded bg-surface-highlight text-gray-400 group-hover:text-primary transition-colors">
                          <Icon name={setting.icon} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm uppercase tracking-wider">{setting.name}</h4>
                          <p className="text-xs text-gray-500 font-mono">{setting.description}</p>
                        </div>
                      </div>
                      {setting.type === 'toggle' ? (
                        <input 
                          type="checkbox" 
                          checked={setting.value as boolean}
                          onChange={() => toggleVisualSetting(setting.id)}
                          className="cyber-toggle"
                        />
                      ) : (
                        <div className="w-48">
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={setting.value as number}
                            onChange={(e) => updateVisualSlider(setting.id, parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          
          {/* Section 4: Profile / Account */}
          <section id="profile">
            <div className="flex items-end justify-between mb-6 pb-2 border-b border-surface-accent">
              <div>
                <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider flex items-center gap-3">
                  <span className="text-gray-500">04 //</span> Profile
                </h2>
                <p className="text-sm text-gray-500 mt-1 font-mono">Manage your guild identity and authentication.</p>
              </div>
            </div>
            
            <div className="bg-surface-dark border border-surface-accent p-6 rounded-lg">
              {currentUser ? (
                /* Logged in - Show profile info */
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="size-24 rounded-lg border-2 border-primary overflow-hidden bg-black shadow-neon">
                      <img 
                        src={currentUser.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentUser.username}`}
                        alt={currentUser.username}
                        className="size-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-display font-bold text-white">
                        {currentUser.display_name || currentUser.username}
                      </h3>
                      <p className="text-gray-400 font-mono text-sm">@{currentUser.username}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-primary font-mono text-sm">Level {currentUser.level}</span>
                        <span className="text-secondary font-mono text-sm">{currentUser.xp_total.toLocaleString()} XP</span>
                      </div>
                    </div>
                    <Link 
                      to={`/character/${currentUser.id}`}
                      className="px-4 py-2 bg-primary/10 border border-primary/30 rounded text-primary hover:bg-primary/20 transition-colors font-mono text-sm"
                    >
                      View Full Profile
                    </Link>
                  </div>
                  
                  <div className="pt-6 border-t border-surface-accent">
                    <button 
                      onClick={logout}
                      className="px-4 py-2 bg-destructive/10 border border-destructive/30 rounded text-destructive hover:bg-destructive/20 transition-colors font-mono text-sm flex items-center gap-2"
                    >
                      <Icon name="logout" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                /* Not logged in - Show login/register form */
                <div className="space-y-6">
                  {/* Auth Mode Tabs */}
                  <div className="flex gap-2 p-1 bg-surface-highlight rounded-lg">
                    <button
                      onClick={() => setAuthMode('login')}
                      className={`flex-1 px-4 py-2 rounded font-display font-bold uppercase tracking-wider text-sm transition-colors ${
                        authMode === 'login'
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Login
                    </button>
                    <button
                      onClick={() => setAuthMode('register')}
                      className={`flex-1 px-4 py-2 rounded font-display font-bold uppercase tracking-wider text-sm transition-colors ${
                        authMode === 'register'
                          ? 'bg-secondary/10 text-secondary border border-secondary/30'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Register
                    </button>
                  </div>
                  
                  {/* Error Message */}
                  {userError && (
                    <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-destructive text-sm font-mono">
                      <Icon name="error" className="inline mr-2" />
                      {userError}
                    </div>
                  )}
                  
                  {authMode === 'login' ? (
                    /* Login Form */
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-2 block">
                          Username
                        </label>
                        <input
                          type="text"
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          placeholder="Enter your username"
                          className="w-full px-4 py-3 bg-surface-highlight border border-surface-accent rounded text-white font-mono placeholder:text-gray-600 focus:border-primary focus:outline-none transition-colors"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={userLoading || !loginUsername.trim()}
                        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-display font-bold uppercase tracking-widest px-4 py-3 rounded shadow-neon hover:shadow-[0_0_30px_theme('colors.primary')] transition-all flex items-center justify-center gap-2"
                      >
                        {userLoading ? (
                          <Icon name="sync" className="animate-spin" />
                        ) : (
                          <Icon name="login" />
                        )}
                        Sign In
                      </button>
                    </form>
                  ) : (
                    /* Register Form */
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-2 block">
                          Username *
                        </label>
                        <input
                          type="text"
                          value={registerForm.username}
                          onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                          placeholder="Choose a username"
                          className="w-full px-4 py-3 bg-surface-highlight border border-surface-accent rounded text-white font-mono placeholder:text-gray-600 focus:border-secondary focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-2 block">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={registerForm.displayName}
                          onChange={(e) => setRegisterForm({ ...registerForm, displayName: e.target.value })}
                          placeholder="Your display name (optional)"
                          className="w-full px-4 py-3 bg-surface-highlight border border-surface-accent rounded text-white font-mono placeholder:text-gray-600 focus:border-secondary focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-2 block">
                          Email
                        </label>
                        <input
                          type="email"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                          placeholder="your@email.com (optional)"
                          className="w-full px-4 py-3 bg-surface-highlight border border-surface-accent rounded text-white font-mono placeholder:text-gray-600 focus:border-secondary focus:outline-none transition-colors"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={userLoading || !registerForm.username.trim()}
                        className="w-full bg-secondary hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-display font-bold uppercase tracking-widest px-4 py-3 rounded shadow-neon-secondary hover:shadow-[0_0_30px_theme('colors.secondary')] transition-all flex items-center justify-center gap-2"
                      >
                        {userLoading ? (
                          <Icon name="sync" className="animate-spin" />
                        ) : (
                          <Icon name="person_add" />
                        )}
                        Create Account
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </section>
          
          {/* Save Button */}
          <div className="flex justify-end pt-4 pb-12">
            <button className="bg-primary hover:bg-primary/90 text-black font-display font-bold uppercase tracking-widest px-8 py-4 rounded shadow-neon hover:shadow-[0_0_30px_theme('colors.primary')] transition-all transform hover:-translate-y-1 flex items-center gap-2">
              <Icon name="save" />
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
