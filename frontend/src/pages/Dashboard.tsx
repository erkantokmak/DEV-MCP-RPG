import { PartySidebar } from '../components/dashboard/PartySidebar'
import { BossHealth } from '../components/dashboard/BossHealth'
import { MissionLog } from '../components/dashboard/MissionLog'
import { QuickStats } from '../components/dashboard/QuickStats'
import { CodeScanner } from '../components/dashboard/CodeScanner'

export function Dashboard() {
  return (
    <main className="flex flex-1 overflow-hidden">
      {/* Left Sidebar - Party */}
      <PartySidebar />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Boss Health Section */}
        <BossHealth />
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Stats - Sol Taraf */}
            <div className="lg:col-span-2 flex flex-col gap-6">
                 {/* Yeni Scanner Buraya */}
                 <CodeScanner />
                 
                 <QuickStats />
            </div>

            {/* Mission Log - Sağ Taraf */}
            <div className="lg:col-span-1">
                <MissionLog />
            </div>
        </div>
      </div>
    </main>
  )
}
