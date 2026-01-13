import { Icon } from '../Icon'
import { Badge } from '../Badge'
import { motion } from 'framer-motion'

interface Boss {
  name: string
  currentHp: number
  maxHp: number
  type: string
  weaknesses: string[]
}

const currentBoss: Boss = {
  name: 'MEMORY_LEAK_DRAGON',
  currentHp: 34567,
  maxHp: 100000,
  type: 'EPIC',
  weaknesses: ['PROFILER', 'GARBAGE_COLLECTOR', 'HEAP_DUMP'],
}

export function BossHealth() {
  const hpPercentage = (currentBoss.currentHp / currentBoss.maxHp) * 100
  
  return (
    <section className="p-6 border-b border-surface-accent">
      <div className="flex items-center gap-4 mb-4">
        <div className="size-14 rounded-lg bg-destructive/20 border border-destructive flex items-center justify-center">
          <Icon name="bug_report" className="text-3xl text-destructive" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-lg font-display font-bold uppercase tracking-wider text-white">
              {currentBoss.name}
            </h2>
            <Badge variant="legendary">{currentBoss.type}</Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 font-mono">
              WEAKNESSES:
            </span>
            <div className="flex gap-2">
              {currentBoss.weaknesses.map((weakness) => (
                <Badge key={weakness} variant="secondary" size="sm">
                  {weakness}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-display font-black text-destructive">
            {currentBoss.currentHp.toLocaleString()}
            <span className="text-gray-500 text-lg"> / {currentBoss.maxHp.toLocaleString()}</span>
          </div>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">
            HP REMAINING
          </p>
        </div>
      </div>
      
      {/* Boss Health Bar */}
      <div className="relative">
        <div className="h-6 bg-gray-900 rounded overflow-hidden border border-gray-700">
          <motion.div 
            className="h-full bg-gradient-to-r from-destructive to-red-400 relative"
            initial={{ width: 0 }}
            animate={{ width: `${hpPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            {/* Animated stripes */}
            <div className="absolute inset-0 boss-health-stripes opacity-20" />
            {/* Glow effect */}
            <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-l from-white/20 to-transparent" />
          </motion.div>
          {/* Damage markers */}
          <div className="absolute top-0 bottom-0 left-1/4 w-px bg-black/40" />
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-black/40" />
          <div className="absolute top-0 bottom-0 left-3/4 w-px bg-black/40" />
        </div>
        
        {/* Party damage indicator */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span className="text-xs font-mono text-primary animate-pulse">
            -127 DPS
          </span>
        </div>
      </div>
      
      {/* Boss phase indicator */}
      <div className="flex items-center justify-between mt-3 text-xs text-gray-400 font-mono">
        <span>PHASE 2 / 4</span>
        <span>ENRAGE IN: 02:34:12</span>
      </div>
    </section>
  )
}
