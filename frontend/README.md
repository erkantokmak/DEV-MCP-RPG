# DEV-RPG Frontend

Cyberpunk-themed AI-powered CI/CD dashboard built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- 🎮 **RPG-Style Dashboard** - Boss battles, party members, mission logs
- ⚡ **Reactive UI** - Real-time updates with Zustand state management
- 🎨 **Cyberpunk Theme** - Neon colors, scanlines, retro-futuristic design
- 🔥 **Smooth Animations** - Framer Motion for fluid transitions
- 📱 **Responsive Design** - Works on desktop and mobile

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Zustand** - State management
- **Framer Motion** - Animation library

## Development

### Prerequisites

- Node.js 20+
- npm or yarn

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (port 3200)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### With Docker

```bash
# Build and run with docker-compose (from project root)
cd ..
docker-compose up frontend

# Or build manually
docker build -t dev-rpg-frontend .
docker run -p 3200:80 dev-rpg-frontend
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── dashboard/       # Dashboard-specific components
│   │   │   ├── BossHealth.tsx
│   │   │   ├── MissionLog.tsx
│   │   │   ├── PartySidebar.tsx
│   │   │   └── QuickStats.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Header.tsx
│   │   ├── Icon.tsx
│   │   ├── Layout.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Scanlines.tsx
│   ├── pages/               # Route pages
│   │   ├── Dashboard.tsx
│   │   ├── CharacterSheet.tsx
│   │   ├── Inventory.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── MissionDetail.tsx
│   │   └── Settings.tsx
│   ├── App.tsx              # Root component with routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles & theme
├── public/                  # Static assets
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind theme
├── tsconfig.json            # TypeScript config
└── Dockerfile               # Production build

```

## Design System

### Colors

- **Primary (Neon Green)**: `#3fff14` - Success, progress, online status
- **Secondary (Cyan)**: `#00e5ff` - Info, features, XP
- **Destructive (Magenta)**: `#ff00cc` - Errors, critical bugs, boss health
- **Legendary (Purple)**: `#a855f7` - Epic items, special badges
- **Gold**: `#fbbf24` - Currency, rewards, high priority
- **Silver**: `#94a3b8` - Common items
- **Bronze**: `#d97706` - Basic items

### Typography

- **Display Font**: Space Grotesk (headings, buttons, stats)
- **Body Font**: Inter (text, descriptions)
- **Mono Font**: System monospace (code, technical info)

### Components

All components support:
- Multiple variants (primary, secondary, destructive, etc.)
- Size options (sm, md, lg)
- Hover states with neon glow effects
- Consistent border radius and spacing

### Animations

- **Scanlines Overlay** - CRT monitor effect
- **Progress Stripes** - Animated diagonal stripes
- **Boss Health** - Pulsing damage indicators
- **Neon Shadows** - Glowing border effects

## API Integration

Frontend connects to Backend API on port 3210:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210'

// Example API calls
GET /api/missions          // Mission log data
GET /api/party             // Party members
GET /api/leaderboard       // Guild rankings
POST /api/analyze          // Trigger code analysis
```

## Environment Variables

Create `.env.local` for development:

```env
VITE_API_URL=http://localhost:3210
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Contributing

1. Follow the existing component structure
2. Use Tailwind utility classes
3. Keep components focused and reusable
4. Add TypeScript types for all props
5. Test responsive design

## License

MIT
