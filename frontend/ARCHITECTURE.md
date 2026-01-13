# 🎮 DEV-RPG - Frontend Architecture

## Overview

React-based cyberpunk-themed dashboard for the AI-powered CI/CD tool. Converts HTML prototypes from `ui-pre/` into production-ready component-based architecture.

## 🏗️ Architecture

### Component Hierarchy

```
App (Router)
└── Layout
    ├── Scanlines (Global overlay)
    ├── Header (Navigation)
    └── <Page Content>
        └── Page-specific components
```

### Page Structure

#### 1. **Dashboard** (`/`)
- **Purpose**: Main mission control center
- **Components**:
  - `PartySidebar` - Active team members (left sidebar, 320px)
  - `BossHealth` - Current bug/feature progress (epic boss battle)
  - `QuickStats` - 4 key metrics (bugs slain, quality score, critical issues, gold)
  - `MissionLog` - Active tasks with status, priority, XP/gold rewards

#### 2. **Character Sheet** (`/character/:id`)
- **Purpose**: Developer profile with stats, achievements, badges
- **Status**: Placeholder (coming soon)

#### 3. **Inventory** (`/inventory`)
- **Purpose**: Collected items, badges, loot from completed missions
- **Status**: Placeholder (coming soon)

#### 4. **Leaderboard** (`/leaderboard`)
- **Purpose**: Guild rankings, top contributors
- **Status**: Placeholder (coming soon)

#### 5. **Settings** (`/settings`)
- **Purpose**: Configure MCP agents, thresholds, notifications
- **Status**: Placeholder (coming soon)

#### 6. **Mission Detail** (`/mission/:id`)
- **Purpose**: Code diff viewer, AI feedback from agents
- **Status**: Placeholder (coming soon)

## 🎨 Design System

### Color Palette

```typescript
colors: {
  primary: '#3fff14',      // Neon Green - Success, online, progress
  secondary: '#00e5ff',    // Cyan - Info, features, XP
  destructive: '#ff00cc',  // Magenta - Errors, bugs, boss health
  legendary: '#a855f7',    // Purple - Epic items
  gold: '#fbbf24',         // Gold - Currency, high priority
  silver: '#94a3b8',       // Silver - Common items
  bronze: '#d97706',       // Bronze - Basic items
  
  background: {
    dark: '#0a0e14',       // Main background
    DEFAULT: '#111827',    // Alternative bg
  },
  surface: {
    dark: '#1e293b',       // Card backgrounds
    DEFAULT: '#334155',    // Default surface
    highlight: '#1e293b',  // Hover state
    accent: '#475569',     // Borders
  }
}
```

### Typography

- **Display**: `Space Grotesk` - Headings, buttons, stats (800 weight)
- **Body**: `Inter` - Text, descriptions (400-600 weight)
- **Mono**: System monospace - Code, technical details

### Shadow Effects

```css
.shadow-neon              // Green glow (#3fff14)
.shadow-neon-secondary    // Cyan glow (#00e5ff)
.shadow-neon-destructive  // Magenta glow (#ff00cc)
.shadow-neon-legendary    // Purple glow (#a855f7)
.shadow-neon-gold         // Gold glow (#fbbf24)
```

### Animations

1. **Scanlines** - CRT monitor effect (opacity: 40%)
2. **Progress Stripes** - Diagonal animated stripes (20px, 1s loop)
3. **Boss Health Stripes** - Thicker stripes for boss bars (30px, 2s loop)
4. **Neon Pulse** - Glowing indicators (`animate-pulse`)

## 🧩 Reusable Components

### Core UI

| Component | Variants | Props | Usage |
|-----------|----------|-------|-------|
| `Avatar` | default, primary, secondary, legendary, gold, silver, bronze | src, size (sm/md/lg/xl), border | User/party member images |
| `Badge` | primary, secondary, destructive, legendary, gold, silver, bronze, default | size (sm/md) | Status labels, tags |
| `Button` | primary, secondary, destructive, ghost, outline | size (sm/md/lg) | Actions |
| `Card` | default, primary, secondary, destructive, legendary | hover | Content containers |
| `Icon` | - | name, filled, className | Material Symbols icons |
| `ProgressBar` | primary, secondary, destructive, legendary, gold, silver, bronze | value, max, size, showStripes, showShine, showMarkers | XP bars, health bars |

### Layout

| Component | Purpose |
|-----------|---------|
| `Layout` | Root layout with header + scanlines |
| `Header` | Top navigation with page title |
| `Scanlines` | CRT overlay effect |

### Dashboard Specific

| Component | Purpose | Data |
|-----------|---------|------|
| `BossHealth` | Epic bug/feature progress bar | Boss stats (name, HP, weaknesses) |
| `MissionLog` | Scrollable mission list | Missions array |
| `PartySidebar` | Team member roster | Party members |
| `QuickStats` | 4 metric cards | Stat objects |

## 📊 Data Flow

### State Management (Zustand)

```typescript
// Store structure (to be implemented)
interface AppStore {
  user: User
  party: PartyMember[]
  missions: Mission[]
  boss: BossData
  stats: QuickStats
  setUser: (user: User) => void
  fetchMissions: () => Promise<void>
  // ... other actions
}
```

### API Integration

```typescript
// API endpoints (backend port 3210)
GET /api/user              // Current user profile
GET /api/party             // Team members
GET /api/missions          // Mission log
GET /api/leaderboard       // Rankings
POST /api/analyze          // Trigger analysis
GET /api/reports/:id       // Mission detail
```

### Environment Variables

```env
VITE_API_URL=http://localhost:3210   # Backend API URL
```

## 🛠️ Development Workflow

### 1. Local Development

```bash
cd frontend
npm install
npm run dev   # Port 3200
```

### 2. Docker Build

```bash
# From project root
docker-compose up frontend
```

### 3. Production Build

```bash
npm run build
# Output: dist/ (served by Nginx)
```

## 📁 File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── dashboard/           # Dashboard modules
│   │   │   ├── BossHealth.tsx
│   │   │   ├── MissionLog.tsx
│   │   │   ├── PartySidebar.tsx
│   │   │   └── QuickStats.tsx
│   │   ├── Avatar.tsx           # Profile images
│   │   ├── Badge.tsx            # Status tags
│   │   ├── Button.tsx           # Action buttons
│   │   ├── Card.tsx             # Containers
│   │   ├── Header.tsx           # Top nav
│   │   ├── Icon.tsx             # Material Symbols
│   │   ├── Layout.tsx           # Root layout
│   │   ├── ProgressBar.tsx      # XP/health bars
│   │   └── Scanlines.tsx        # CRT effect
│   ├── pages/
│   │   ├── Dashboard.tsx        # Main page ✅
│   │   ├── CharacterSheet.tsx   # Profile (todo)
│   │   ├── Inventory.tsx        # Items (todo)
│   │   ├── Leaderboard.tsx      # Rankings (todo)
│   │   ├── MissionDetail.tsx    # Code diff (todo)
│   │   └── Settings.tsx         # Config (todo)
│   ├── App.tsx                  # Router setup
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
├── public/                      # Static assets
├── Dockerfile                   # Production build
├── nginx.conf                   # Nginx config
├── package.json                 # Dependencies
├── tailwind.config.js           # Theme config
├── vite.config.ts               # Vite setup
└── tsconfig.json                # TypeScript config
```

## ✅ Implementation Status

### Completed ✅
- [x] Project scaffolding (Vite + React + TypeScript)
- [x] Tailwind config with cyberpunk theme
- [x] Global styles (scanlines, scrollbar, animations)
- [x] Core components (Avatar, Badge, Button, Card, Icon, ProgressBar)
- [x] Layout components (Layout, Header, Scanlines)
- [x] Dashboard page (fully functional)
- [x] Dashboard components (BossHealth, MissionLog, PartySidebar, QuickStats)
- [x] Routing setup (React Router)
- [x] Docker build configuration
- [x] Nginx production config

### Pending 🔄
- [ ] Character Sheet page (profile, stats, achievements)
- [ ] Inventory page (item grid, equipped items)
- [ ] Leaderboard page (guild rankings)
- [ ] Settings page (agent config, thresholds)
- [ ] Mission Detail page (code diff viewer, AI feedback)
- [ ] Zustand store implementation
- [ ] API integration (fetch real data)
- [ ] Authentication flow
- [ ] WebSocket for real-time updates
- [ ] Responsive mobile design

## 🚀 Next Steps

1. **Backend Integration**
   - Create Zustand store
   - Connect to `/api/missions`, `/api/party` endpoints
   - Handle loading/error states

2. **Complete Pages**
   - Convert remaining HTML designs to React components
   - Character Sheet → Profile card + stats grid
   - Inventory → Item grid with filters
   - Leaderboard → Table with rankings
   - Settings → Form with agent toggles

3. **Real-time Updates**
   - WebSocket connection to backend
   - Live mission progress updates
   - Boss health changes
   - Party member status changes

4. **Performance**
   - Code splitting with React.lazy()
   - Image optimization
   - Bundle size analysis

## 📝 Notes

- All colors use Tailwind theme extensions
- Material Symbols Outlined icons via Google Fonts CDN
- Framer Motion ready for advanced animations
- Custom scrollbar styles for consistency
- Desktop-first design (mobile responsive pending)

## 🎯 Goals

1. **Gamification**: Make CI/CD fun with RPG mechanics
2. **Clarity**: Clear visual hierarchy for critical information
3. **Performance**: Fast loads, smooth animations
4. **Extensibility**: Easy to add new pages/features
5. **Aesthetics**: Cyberpunk theme with neon accents
