import { Link, useLocation } from 'react-router-dom'
import { Icon } from './Icon'

export function Header() {
  const location = useLocation()
  
  const getPageTitle = () => {
    if (location.pathname === '/') return { title: 'DASHBOARD', icon: 'terminal' }
    if (location.pathname.startsWith('/character')) return { title: 'CHARACTER SHEET', icon: 'person' }
    if (location.pathname === '/inventory') return { title: 'INVENTORY', icon: 'backpack' }
    if (location.pathname === '/leaderboard') return { title: 'LEADERBOARD', icon: 'shield_person' }
    if (location.pathname === '/settings') return { title: 'SETTINGS', icon: 'build' }
    if (location.pathname.startsWith('/mission')) return { title: 'MISSION LOG', icon: 'bug_report' }
    return { title: 'DASHBOARD', icon: 'terminal' }
  }
  
  const { title, icon } = getPageTitle()

  return (
    <header className="flex items-center justify-between border-b border-surface-accent bg-background-dark/95 backdrop-blur-sm px-6 py-4 shrink-0">
      <div className="flex items-center gap-4">
        <Link 
          to="/"
          className="flex items-center justify-center size-10 rounded bg-primary/10 border border-primary text-primary shadow-neon hover:bg-primary/20 transition-colors"
        >
          <Icon name={icon} className="text-2xl" />
        </Link>
        <div>
          <h1 className="text-xl font-display font-bold tracking-widest text-white uppercase leading-none">
            DEV-RPG <span className="text-primary">//</span> {title}
          </h1>
          <p className="text-xs text-gray-400 font-mono tracking-widest mt-1">
            SYS.VER.4.2.0 :: CONNECTED
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Status Indicators */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono uppercase text-gray-400">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary animate-pulse shadow-neon" />
            Server: Online
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-secondary" />
            Agents: 4 Active
          </div>
        </div>
        
        <div className="h-8 w-px bg-surface-accent" />
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <button className="flex size-10 items-center justify-center rounded-lg border border-surface-accent bg-surface-dark text-gray-400 hover:text-white hover:border-primary hover:shadow-neon transition-all">
            <Icon name="notifications" />
          </button>
          <Link 
            to="/settings"
            className="flex size-10 items-center justify-center rounded-lg border border-surface-accent bg-surface-dark text-gray-400 hover:text-white hover:border-primary hover:shadow-neon transition-all"
          >
            <Icon name="settings" />
          </Link>
          <Link
            to="/character/me"
            className="size-10 rounded-lg bg-cover bg-center border border-surface-accent hover:border-primary hover:shadow-neon transition-all"
            style={{ 
              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDheJ4yHmGqYglVsxmaj8be-WiQx0AaaTAWuphUJDK_pJ7HFEl6JS3eCCuOTv7pW_7O6qJnySNRvYqzPgbYZdSkY_Q_krkDx4hHarqmJOAtfYThD-ymVZgECAnoTecT4P_MqB-K5ckneI4vEsqKyKnfohOBMfoQN1KHPibt6qYU9PKxz11rDW8YgITl__rcDYIdWpyNPFZHb-z04eHCAU7B37K3TewTx14xE9ujaIt6b_t114zMrXyqp-8dAf2Km6FpnsFnfs_Yn8k')` 
            }}
          />
        </div>
      </div>
    </header>
  )
}
