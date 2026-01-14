import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { CharacterSheet } from './pages/CharacterSheet'
import { Inventory } from './pages/Inventory'
import { Leaderboard } from './pages/Leaderboard'
import { Settings } from './pages/Settings'
import { MissionDetail } from './pages/MissionDetail'
import { UserProvider } from './contexts/UserContext'

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="character/:id" element={<CharacterSheet />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="settings" element={<Settings />} />
            <Route path="mission/:id" element={<MissionDetail />} />
          </Route>
        </Routes>
      </Router>
    </UserProvider>
  )
}

export default App
