import { PartySidebar } from '../components/dashboard/PartySidebar'
import { BossHealth } from '../components/dashboard/BossHealth'
import { MissionLog } from '../components/dashboard/MissionLog'
import { QuickStats } from '../components/dashboard/QuickStats'

export function Dashboard() {
  return (
    <main className="flex flex-1 overflow-hidden">
      {/* Left Sidebar - Party */}
      <PartySidebar />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Boss Health Section */}
        <BossHealth />
        
        {/* Quick Stats */}
        <QuickStats />
        
        {/* Mission Log */}
        <MissionLog />
      </div>
    </main>
  )
}
