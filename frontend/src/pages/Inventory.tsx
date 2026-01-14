import { useState } from 'react'
import { Icon } from '../components/Icon'

type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

interface InventoryItem {
  id: string
  name: string
  icon: string
  rarity: Rarity
  level?: number
  quantity?: number
  description?: string
  attributes?: { name: string; value: string; positive: boolean }[]
  quote?: string
  acquired?: string
  type: 'equipment' | 'consumable' | 'badge'
}

const rarityConfig = {
  common: {
    border: 'border-[#2a3a27]',
    hoverBorder: 'hover:border-gray-400',
    text: 'text-gray-500',
    hoverText: 'group-hover:text-gray-300',
    bg: '',
    shadow: '',
    label: 'Common',
  },
  rare: {
    border: 'border-secondary/50',
    hoverBorder: 'hover:border-secondary',
    text: 'text-secondary',
    hoverText: '',
    bg: '',
    shadow: 'hover:shadow-neon-secondary',
    label: 'Rare',
  },
  epic: {
    border: 'border-destructive/50',
    hoverBorder: 'hover:border-destructive',
    text: 'text-destructive',
    hoverText: '',
    bg: '',
    shadow: 'hover:shadow-neon-destructive',
    label: 'Epic',
  },
  legendary: {
    border: 'border-legendary',
    hoverBorder: '',
    text: 'text-legendary',
    hoverText: '',
    bg: '',
    shadow: 'shadow-neon-legendary',
    label: 'Legendary',
  },
}

const mockItems: InventoryItem[] = [
  {
    id: '1',
    name: 'Master of Microservices',
    icon: 'hub',
    rarity: 'legendary',
    type: 'badge',
    description: '"Architecture is not about making decisions, it\'s about deferring them until the last responsible moment. You have mastered this art."',
    quote: 'Granted for 10 architecture-passed commits in a single sprint cycle without regression.',
    attributes: [
      { name: 'Architecture Skill', value: '+15', positive: true },
      { name: 'Code Review Speed', value: '+5%', positive: true },
      { name: 'Technical Debt', value: '-20', positive: false },
    ],
  },
  {
    id: '2',
    name: 'Bug Slayer Blade',
    icon: 'pest_control',
    rarity: 'epic',
    level: 5,
    type: 'equipment',
    attributes: [
      { name: 'Bug Detection', value: '+10', positive: true },
      { name: 'Debug Speed', value: '+8%', positive: true },
    ],
  },
  {
    id: '3',
    name: 'Code Cleanser',
    icon: 'cleaning_services',
    rarity: 'rare',
    type: 'equipment',
    attributes: [
      { name: 'Lint Score', value: '+12', positive: true },
      { name: 'Refactor Power', value: '+5', positive: true },
    ],
  },
  {
    id: '4',
    name: 'Terminal Commands',
    icon: 'terminal',
    rarity: 'common',
    quantity: 24,
    type: 'consumable',
  },
  {
    id: '5',
    name: 'Coffee Boost',
    icon: 'coffee',
    rarity: 'common',
    quantity: 3,
    type: 'consumable',
    attributes: [
      { name: 'Productivity', value: '+25% for 1hr', positive: true },
    ],
  },
  {
    id: '6',
    name: 'Security Shield',
    icon: 'shield',
    rarity: 'rare',
    type: 'equipment',
    attributes: [
      { name: 'Vulnerability Block', value: '+15', positive: true },
    ],
  },
  {
    id: '7',
    name: 'Deployment Rocket',
    icon: 'rocket_launch',
    rarity: 'epic',
    type: 'equipment',
    attributes: [
      { name: 'Deploy Speed', value: '+20%', positive: true },
      { name: 'Rollback Time', value: '-50%', positive: true },
    ],
  },
  {
    id: '8',
    name: 'API Connector',
    icon: 'api',
    rarity: 'rare',
    type: 'equipment',
  },
  {
    id: '9',
    name: 'Documentation Scroll',
    icon: 'description',
    rarity: 'common',
    type: 'consumable',
  },
]

const partyMembers = [
  { id: '1', name: 'Code Wizard', level: 42, class: 'Architect', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmlsGlVzDQtI4g0uh50WWVOxjiqE1FPwJh_xucdW16AXnK2WSAsjcpI6iv-8mH50eLVbgeJwQdZsDqBXjbUJ3XAGQ8tpwRYdAc_vNuTjpgQmXgPBmFzFtWacVR8tqDjELgodMcvkp8oGYX5wVybD_pOZV7YlwrqokowKQfdihkR8OctOAFdhJECi1MSzXV8wzFX_2oH3sCXr_Rt9rR7XiHrLujjhCsme1BrUqjAqniHFVsEeStNs8tApWcsR8cIYTyjYI9LecXp_8', active: true },
  { id: '2', name: 'Bug Hunter', level: 28, class: 'QA', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjPI0TZopHxzmRo253twtAMxXjbRj6ytc9eLWZISrmadike1G9yt0uHAFIUBBXC-s_14DTz0Ti4yHQIxCtLu06JE-8Ux5maPiqsjF_jX0OEtNsQYJl2_NjzJ_kVQvSE66s7tkFG5vAF5ey3bZ6OAjjcQRGJ22ZTZx0qkkXH2GcLM3iG1s09dH8kCndpK-KgHGRWEmMOpznPMIHyBesEdySlgCgw4gyPvNCxHu2-LM9SWSJZsLEoDPu2KrLmCBlurdcaIeyR5qmY5o', active: false },
  { id: '3', name: 'Sys Admin', level: 56, class: 'DevOps', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDk6_RBiHR5q0i8qDIthELAVRc9N9LlgBlNGXrESH430bU_K8RiCTLdmcTwfmwXGSknMZGddPkqdwjtdF8-KaiugQyvwmQpK5mFIUcqnjvgsH7b8ZW29H_ZbehCaXfLOOs_qs9cwTzsn1ARkBbeqMBYMwHssVnQ5nrkW2EOTw4S4b396llGxP_xqvTjRqTR3Ds3I6Dkh1FrWffRuMGGNDwgrANFK7Ffpu8quu3D-ZmWeuRr1usjca8UlDcmyiFIu4NLX0hla3tM7Kw', active: false },
]

const filterButtons = ['All Items', 'Equipment', 'Consumables', 'Badges']

export function Inventory() {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(mockItems[0])
  const [activeFilter, setActiveFilter] = useState('All Items')
  const [selectedMember, setSelectedMember] = useState(partyMembers[0].id)

  const filteredItems = mockItems.filter(item => {
    if (activeFilter === 'All Items') return true
    if (activeFilter === 'Equipment') return item.type === 'equipment'
    if (activeFilter === 'Consumables') return item.type === 'consumable'
    if (activeFilter === 'Badges') return item.type === 'badge'
    return true
  })

  const totalSlots = 50
  const usedSlots = mockItems.length
  const emptySlots = Math.max(0, 24 - filteredItems.length) // Show at least 24 slots

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Capacity Bar */}
      <div className="px-6 py-4 border-b border-surface-accent bg-surface-dark/50">
        <div className="max-w-[1600px] mx-auto w-full flex items-center justify-between gap-8">
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <h2 className="text-sm font-display font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Icon name="database" className="text-secondary text-lg" />
                Stash Capacity
              </h2>
              <span className="text-sm font-mono text-secondary">{usedSlots} / {totalSlots} SLOTS</span>
            </div>
            <div className="h-2 w-full bg-surface-highlight border border-surface-accent rounded overflow-hidden">
              <div 
                className="h-full bg-secondary shadow-neon-secondary relative"
                style={{ width: `${(usedSlots / totalSlots) * 100}%` }}
              >
                <div className="absolute inset-0 bg-white/10 animate-[shimmer_2s_infinite]" />
              </div>
            </div>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex gap-2">
            {filterButtons.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                  activeFilter === filter
                    ? 'bg-primary/20 border border-primary text-primary shadow-neon'
                    : 'bg-surface-dark border border-surface-accent text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-full max-w-[1600px] mx-auto">
          {/* Party Sidebar */}
          <aside className="w-72 flex flex-col border-r border-surface-accent bg-background-dark overflow-y-auto shrink-0 hidden lg:flex">
            <div className="p-5 sticky top-0 bg-background-dark z-10 border-b border-surface-accent">
              <h3 className="text-gray-400 font-display font-bold tracking-widest uppercase text-xs flex items-center gap-2">
                <Icon name="group" className="text-sm text-gray-500" />
                Equipped By
              </h3>
            </div>
            
            <div className="flex flex-col p-4 gap-3">
              {partyMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member.id)}
                  className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${
                    selectedMember === member.id
                      ? 'bg-primary/5 border-primary/40'
                      : 'border-transparent hover:bg-surface-dark hover:border-surface-accent opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`size-10 rounded bg-gray-800 border overflow-hidden ${
                    selectedMember === member.id ? 'border-primary' : 'border-gray-600 grayscale'
                  }`}>
                    <img src={member.avatar} alt={member.name} className="size-full object-cover" />
                  </div>
                  <div className="text-left">
                    <div className={`text-sm font-bold ${selectedMember === member.id ? 'text-white' : 'text-gray-300'}`}>
                      {member.name}
                    </div>
                    <div className={`text-[10px] font-mono ${selectedMember === member.id ? 'text-primary' : 'text-gray-500'}`}>
                      LVL {member.level} {member.class.toUpperCase()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Total Worth */}
            <div className="mt-auto p-5 border-t border-surface-accent">
              <div className="p-3 rounded bg-surface-dark border border-surface-accent">
                <h4 className="text-xs text-gray-400 font-mono uppercase mb-2">Total Party Worth</h4>
                <div className="flex items-center gap-2 text-legendary font-display text-xl font-bold">
                  <Icon name="monetization_on" />
                  4,209 GP
                </div>
              </div>
            </div>
          </aside>
          
          {/* Main Inventory Grid */}
          <div className="flex-1 flex flex-col md:flex-row bg-background-dark relative overflow-hidden">
            {/* Background Pattern */}
            <div 
              className="absolute inset-0 opacity-[0.03] z-0 pointer-events-none" 
              style={{ 
                backgroundImage: 'radial-gradient(#3fff14 1px, transparent 1px)', 
                backgroundSize: '20px 20px' 
              }} 
            />
            
            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto p-6 z-10 custom-scrollbar">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-8 gap-3">
                {filteredItems.map((item) => {
                  const config = rarityConfig[item.rarity]
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`item-slot group relative aspect-square bg-surface-dark border-2 rounded cursor-pointer transition-all hover:scale-105 hover:-translate-y-1 ${config.border} ${config.hoverBorder} ${config.shadow} ${
                        selectedItem?.id === item.id ? 'ring-2 ring-white/50' : ''
                      }`}
                    >
                      {/* Legendary Indicator */}
                      {item.rarity === 'legendary' && (
                        <div className="absolute top-1 right-1 size-2 bg-legendary rounded-full animate-pulse shadow-[0_0_5px_#ffaa00]" />
                      )}
                      
                      {/* Item Icon */}
                      <div className="flex items-center justify-center h-full w-full p-3">
                        <Icon 
                          name={item.icon} 
                          className={`text-4xl ${item.rarity === 'legendary' ? 'text-5xl' : ''} ${config.text} ${config.hoverText} item-icon transition-transform duration-300 ${
                            item.rarity === 'legendary' ? 'drop-shadow-[0_0_10px_rgba(255,170,0,0.5)]' : ''
                          }`}
                        />
                      </div>
                      
                      {/* Level Badge */}
                      {item.level && (
                        <div className={`absolute bottom-1 right-1 text-[10px] ${config.text} font-mono font-bold`}>
                          LVL {item.level}
                        </div>
                      )}
                      
                      {/* Quantity Badge */}
                      {item.quantity && (
                        <div className="absolute bottom-1 right-2 text-[10px] text-gray-500 font-mono">
                          x{item.quantity}
                        </div>
                      )}
                      
                      {/* Legendary Name */}
                      {item.rarity === 'legendary' && (
                        <div className="absolute bottom-0 inset-x-0 bg-legendary/20 backdrop-blur-sm p-1">
                          <p className="text-[10px] text-center font-bold text-legendary truncate uppercase">
                            {item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name}
                          </p>
                        </div>
                      )}
                    </button>
                  )
                })}
                
                {/* Empty Slots */}
                {Array.from({ length: emptySlots }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="aspect-square bg-background-dark border border-surface-highlight rounded opacity-50 shadow-inner"
                  />
                ))}
              </div>
            </div>
            
            {/* Item Detail Panel */}
            {selectedItem && (
              <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-surface-accent bg-surface-dark/80 flex flex-col z-20 shadow-2xl">
                <div className="p-6 flex-1 overflow-y-auto">
                  {/* Item Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex flex-col">
                      <span className={`text-xs font-mono ${rarityConfig[selectedItem.rarity].text} tracking-widest uppercase mb-1`}>
                        {rarityConfig[selectedItem.rarity].label} {selectedItem.type}
                      </span>
                      <h2 className="text-2xl font-display font-bold text-white leading-tight">{selectedItem.name}</h2>
                      <div className="flex items-center gap-2 mt-2">
                        {selectedItem.rarity !== 'common' && (
                          <span className={`px-2 py-0.5 rounded ${
                            selectedItem.rarity === 'legendary' ? 'bg-legendary/10 border-legendary/30 text-legendary' :
                            selectedItem.rarity === 'epic' ? 'bg-destructive/10 border-destructive/30 text-destructive' :
                            'bg-secondary/10 border-secondary/30 text-secondary'
                          } border text-[10px] font-bold uppercase tracking-wider`}>
                            {selectedItem.rarity === 'legendary' ? 'Unique' : rarityConfig[selectedItem.rarity].label}
                          </span>
                        )}
                        {selectedItem.level && (
                          <span className="px-2 py-0.5 rounded bg-surface-highlight border border-gray-700 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                            Item Lvl {selectedItem.level}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Item Preview */}
                  <div className={`relative w-full aspect-square bg-background-dark rounded-lg border mb-6 flex items-center justify-center overflow-hidden group ${
                    selectedItem.rarity === 'legendary' ? 'border-legendary/30' : 'border-surface-accent'
                  }`}>
                    {selectedItem.rarity === 'legendary' && (
                      <div className="absolute inset-0 bg-legendary/5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-legendary/20 to-transparent" />
                    )}
                    <Icon 
                      name={selectedItem.icon} 
                      className={`text-9xl ${rarityConfig[selectedItem.rarity].text} ${
                        selectedItem.rarity === 'legendary' ? 'drop-shadow-[0_0_30px_rgba(255,170,0,0.6)] animate-pulse' : ''
                      }`}
                    />
                    
                    {/* Corner Decorations for Legendary */}
                    {selectedItem.rarity === 'legendary' && (
                      <>
                        <div className="absolute top-2 left-2 size-4 border-t-2 border-l-2 border-legendary" />
                        <div className="absolute top-2 right-2 size-4 border-t-2 border-r-2 border-legendary" />
                        <div className="absolute bottom-2 left-2 size-4 border-b-2 border-l-2 border-legendary" />
                        <div className="absolute bottom-2 right-2 size-4 border-b-2 border-r-2 border-legendary" />
                      </>
                    )}
                  </div>
                  
                  {/* Description */}
                  {selectedItem.description && (
                    <div className="mb-6 space-y-4">
                      <p className="text-sm text-gray-300 italic font-serif leading-relaxed">
                        {selectedItem.description}
                      </p>
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-legendary/50 to-transparent" />
                      {selectedItem.quote && (
                        <p className="text-xs text-gray-500 font-mono">
                          <span className={rarityConfig[selectedItem.rarity].text}>ACQUIRED:</span> {selectedItem.quote}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Attributes */}
                  {selectedItem.attributes && selectedItem.attributes.length > 0 && (
                    <div className="bg-surface-dark border border-surface-accent rounded-lg p-4 space-y-3">
                      <h3 className="text-xs text-gray-400 font-mono uppercase tracking-widest mb-2 border-b border-white/5 pb-2">
                        Item Attributes
                      </h3>
                      {selectedItem.attributes.map((attr, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">{attr.name}</span>
                          <span className={`text-sm font-bold ${attr.positive ? 'text-primary' : 'text-destructive'}`}>
                            {attr.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="p-6 border-t border-surface-accent bg-background-dark space-y-3">
                  <button className={`w-full py-3 rounded border font-display font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    selectedItem.rarity === 'legendary'
                      ? 'bg-legendary/10 border-legendary text-legendary hover:bg-legendary hover:text-black shadow-neon-legendary'
                      : 'bg-primary/10 border-primary text-primary hover:bg-primary hover:text-black shadow-neon'
                  }`}>
                    <Icon name="verified" />
                    {selectedItem.type === 'badge' ? 'Equip Badge' : 'Equip Item'}
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="py-2 rounded bg-surface-dark border border-surface-accent text-gray-400 hover:text-white hover:border-white transition-all text-xs font-bold uppercase">
                      Drop
                    </button>
                    <button className="py-2 rounded bg-surface-dark border border-surface-accent text-gray-400 hover:text-white hover:border-white transition-all text-xs font-bold uppercase">
                      Salvage
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
