import { Outlet } from 'react-router-dom'
import { Scanlines } from './Scanlines'
import { Header } from './Header'

export function Layout() {
  return (
    <div className="relative flex h-screen w-full flex-col bg-background-dark text-white font-body overflow-hidden">
      {/* Scanlines Overlay */}
      <Scanlines />
      
      {/* Main Layout Container */}
      <div className="flex h-full flex-col relative z-10">
        <Header />
        <Outlet />
      </div>
    </div>
  )
}
