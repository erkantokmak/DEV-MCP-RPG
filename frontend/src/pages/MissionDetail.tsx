import { useParams, Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useReport, useUsers } from '../hooks/useApi'
import { AnalysisReport, User } from '../services/api'

const statusConfig = {
  CRITICAL: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    text: 'text-destructive',
    shadow: 'shadow-neon-destructive',
    icon: 'warning',
  },
  WARNING: {
    bg: 'bg-secondary/10',
    border: 'border-secondary/30',
    text: 'text-secondary',
    shadow: 'shadow-neon-secondary',
    icon: 'error',
  },
  SUCCESS: {
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    text: 'text-primary',
    shadow: 'shadow-neon',
    icon: 'check_circle',
  },
}

function getStatusFromScore(score: number): 'CRITICAL' | 'WARNING' | 'SUCCESS' {
  if (score < 40) return 'CRITICAL'
  if (score < 70) return 'WARNING'
  return 'SUCCESS'
}

function formatTimeAgo(date: string): string {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

function generateMissionData(report: AnalysisReport, users: User[]) {
  const status = getStatusFromScore(report.score)
  const damage = Math.max(0, 100 - report.score)
  const user = users.find(u => u.id === report.user_id)
  
  // Generate code lines from report data
  const codeLines = generateCodeLines(report)
  
  return {
    id: report.id.slice(0, 5).toUpperCase(),
    commitMessage: `Analysis: ${report.project_name || 'Unknown Project'}`,
    commitHash: report.id.slice(0, 7),
    timeAgo: formatTimeAgo(report.created_at),
    status,
    author: {
      id: user?.id || '',
      name: user?.display_name || user?.username || 'Unknown',
      level: user?.level || 1,
      class: ['Mage', 'Knight', 'Rogue', 'Paladin', 'Ranger'][Math.abs((user?.username || '').charCodeAt(0)) % 5],
      avatar: user?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.username || 'unknown'}`,
    },
    bossImpact: {
      damage: -damage,
      type: status === 'CRITICAL' ? 'Stability Critical Hit' : status === 'WARNING' ? 'Minor Damage' : 'Glancing Blow',
      previousHealth: 100,
      currentHealth: report.score,
    },
    file: report.project_name ? `src/${report.project_name.toLowerCase().replace(/\s+/g, '_')}/main.ts` : 'src/unknown/main.ts',
    codeLines,
    analysis: {
      scout: {
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=scout',
        message: generateScoutMessage(report),
      },
      sensei: {
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=sensei',
        message: generateSenseiMessage(report),
      },
    },
    rawReport: report,
  }
}

function generateCodeLines(report: AnalysisReport) {
  // Extract some context from report data
  const lines = []
  
  lines.push({ line: 1, code: '// Analysis Report Summary', highlighted: false })
  lines.push({ line: 2, code: '', highlighted: false })
  lines.push({ line: 3, code: `// Score: ${report.score}/100`, highlighted: false })
  lines.push({ line: 4, code: '', highlighted: false })
  
  // Parse report data for issues
  if (report.report_data) {
    try {
      const data = typeof report.report_data === 'string' 
        ? JSON.parse(report.report_data) 
        : report.report_data
      
      if (data.issues && Array.isArray(data.issues)) {
        lines.push({ line: 5, code: '// Issues Found:', highlighted: false })
        data.issues.slice(0, 3).forEach((issue: { severity?: string; message?: string }, idx: number) => {
          const severity = issue.severity || 'info'
          const isError = severity === 'critical' || severity === 'error'
          lines.push({
            line: 6 + idx,
            code: `// [${severity.toUpperCase()}] ${issue.message || 'Unknown issue'}`,
            highlighted: isError,
            error: isError,
            fix: isError ? `// [FIXED] ${issue.message || 'Issue resolved'}` : undefined,
          })
        })
      }
      
      if (data.suggestions && Array.isArray(data.suggestions)) {
        const lastLine = lines[lines.length - 1]?.line || 5
        lines.push({ line: lastLine + 1, code: '', highlighted: false })
        lines.push({ line: lastLine + 2, code: '// Suggestions:', highlighted: false })
        data.suggestions.slice(0, 3).forEach((suggestion: string, idx: number) => {
          lines.push({
            line: lastLine + 3 + idx,
            code: `// - ${suggestion}`,
            highlighted: false,
          })
        })
      }
    } catch {
      // If parsing fails, show raw summary
      lines.push({ line: 5, code: '// Report data available', highlighted: false })
    }
  }
  
  return lines
}

function generateScoutMessage(report: AnalysisReport): string {
  const score = report.score
  
  if (score < 40) {
    return `Critical vulnerabilities detected! Analysis score of ${score}/100 indicates severe issues requiring immediate attention. Multiple weaknesses found in the codebase that could compromise system stability.`
  } else if (score < 70) {
    return `Several areas of concern identified. Analysis score of ${score}/100 shows room for improvement. Some code patterns could be optimized for better performance and maintainability.`
  }
  return `Excellent code quality detected! Analysis score of ${score}/100 indicates well-structured and maintainable code. Minor optimizations possible but overall health is strong.`
}

function generateSenseiMessage(report: AnalysisReport): string {
  const score = report.score
  
  if (score < 40) {
    return `Young warrior, this code requires your full attention. Focus on resolving the critical issues first, then refactor for stability. Remember: clean code is the foundation of all great systems.`
  } else if (score < 70) {
    return `A promising foundation, but there is work to be done. Review the suggested improvements and apply them methodically. Each small fix strengthens the whole.`
  }
  return `Well done, developer. Your code demonstrates wisdom and skill. Continue this path of excellence, and always seek ways to improve even when the path seems clear.`
}

export function MissionDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: report, loading: reportLoading, error: reportError } = useReport(id || '')
  const { data: users, loading: usersLoading } = useUsers()
  
  const loading = reportLoading || usersLoading
  
  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="text-center">
          <Icon name="sync" className="text-4xl text-primary animate-spin" />
          <p className="text-gray-400 font-mono mt-4">Loading mission intel...</p>
        </div>
      </main>
    )
  }
  
  if (reportError || !report) {
    return (
      <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="text-center">
          <Icon name="error" className="text-5xl text-destructive" />
          <h2 className="text-xl font-display font-bold text-white mt-4">Mission Not Found</h2>
          <p className="text-gray-400 font-mono mt-2">This mission doesn't exist or has been completed.</p>
          <Link 
            to="/"
            className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-primary/10 border border-primary/30 rounded text-primary hover:bg-primary/20 transition-colors"
          >
            <Icon name="arrow_back" />
            Return to Dashboard
          </Link>
        </div>
      </main>
    )
  }
  
  const mission = generateMissionData(report, users)
  const status = statusConfig[mission.status]

  return (
    <main className="flex-1 overflow-y-auto p-6 relative">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] z-0 pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(#ff00cc 1px, transparent 1px)', 
          backgroundSize: '20px 20px' 
        }} 
      />
      
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Column - Mission Info */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Mission Intel Card */}
          <div className={`bg-surface-dark border ${status.border.replace('/30', '/50')} rounded-lg overflow-hidden ${status.shadow}`}>
            <div className={`${status.bg} px-4 py-3 border-b ${status.border} flex justify-between items-center`}>
              <h3 className={`${status.text} font-display font-bold tracking-widest uppercase text-sm flex items-center gap-2`}>
                <Icon name="bug_report" />
                Mission Intel
              </h3>
              <span className={`text-[10px] font-mono ${status.text} animate-pulse`}>ANALYZED</span>
            </div>
            <div className="p-5 space-y-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1 block">
                  Project / Analysis
                </label>
                <p className="text-white font-medium text-lg leading-tight">{mission.commitMessage}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1 block">
                    Report ID
                  </label>
                  <div className="flex items-center gap-2 text-secondary font-mono bg-surface-highlight p-2 rounded border border-surface-accent">
                    <Icon name="tag" className="text-sm" />
                    {mission.commitHash}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1 block">
                    Time
                  </label>
                  <div className="flex items-center gap-2 text-gray-300 font-mono bg-surface-highlight p-2 rounded border border-surface-accent">
                    <Icon name="schedule" className="text-sm" />
                    {mission.timeAgo}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-2 block">
                  Operative (User)
                </label>
                <Link 
                  to={`/character/${mission.author.id}`}
                  className="flex items-center gap-3 p-3 rounded bg-surface-highlight border border-surface-accent hover:border-secondary transition-colors"
                >
                  <div className="size-10 rounded border border-secondary bg-black/50 overflow-hidden">
                    <img 
                      src={mission.author.avatar} 
                      alt={mission.author.name}
                      className="size-full object-cover" 
                    />
                  </div>
                  <div>
                    <div className="text-secondary font-bold font-display text-sm">{mission.author.name}</div>
                    <div className="text-xs text-gray-500 font-mono">Lvl {mission.author.level} {mission.author.class}</div>
                  </div>
                </Link>
              </div>
              
              {/* Score */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-2 block">
                  Analysis Score
                </label>
                <div className={`p-4 rounded ${status.bg} border ${status.border} text-center`}>
                  <span className={`text-4xl font-display font-bold ${status.text}`}>{report.score}</span>
                  <span className="text-gray-400 text-lg">/100</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Boss Impact Card */}
          <div className="bg-surface-dark border border-surface-accent rounded-lg overflow-hidden relative group hover:border-destructive/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent pointer-events-none" />
            <div className="px-4 py-3 border-b border-surface-accent flex justify-between items-center relative z-10">
              <h3 className="text-gray-400 font-display font-bold tracking-widest uppercase text-sm flex items-center gap-2">
                <Icon name="heart_broken" className="text-orange-500" />
                Boss Impact
              </h3>
            </div>
            <div className="p-6 flex flex-col items-center justify-center relative z-10">
              <div className="text-5xl font-display font-bold text-destructive drop-shadow-[0_0_10px_rgba(255,0,204,0.5)] mb-2 flex items-center">
                {mission.bossImpact.damage} <span className="text-2xl ml-2">HP</span>
              </div>
              <p className="text-xs text-center text-gray-500 font-mono uppercase tracking-widest">
                {mission.bossImpact.type}
              </p>
              
              {/* Health Bar */}
              <div className="w-full h-3 bg-gray-800 rounded-full mt-6 overflow-hidden relative border border-gray-700">
                <div 
                  className="absolute inset-y-0 left-0 bg-primary opacity-30" 
                  style={{ width: `${mission.bossImpact.previousHealth}%` }} 
                />
                <div 
                  className={`absolute inset-y-0 ${mission.bossImpact.currentHealth < 40 ? 'bg-destructive' : mission.bossImpact.currentHealth < 70 ? 'bg-secondary' : 'bg-primary'} shadow-[0_0_10px_currentColor]`}
                  style={{ 
                    left: '0%',
                    width: `${mission.bossImpact.currentHealth}%` 
                  }}
                />
              </div>
              <div className="w-full flex justify-between mt-1 text-[10px] text-gray-500 font-mono">
                <span>0%</span>
                <span>SCORE: {mission.bossImpact.currentHealth}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Code View */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Code Editor */}
          <div className="bg-[#0d1117] border border-surface-accent rounded-lg overflow-hidden flex flex-col h-[500px] shadow-2xl relative">
            {/* Scanlines overlay */}
            <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%]" />
            
            {/* Header */}
            <div className="bg-surface-dark px-4 py-2 border-b border-surface-accent flex justify-between items-center shrink-0 z-30">
              <div className="flex items-center gap-3">
                <Icon name="terminal" className="text-gray-500 text-sm" />
                <span className="text-xs font-mono text-gray-300">Analysis Report: {mission.id}</span>
              </div>
              <div className="flex gap-2">
                <div className="size-3 rounded-full bg-red-500/20 border border-red-500" />
                <div className="size-3 rounded-full bg-yellow-500/20 border border-yellow-500" />
                <div className="size-3 rounded-full bg-green-500/20 border border-green-500" />
              </div>
            </div>
            
            {/* Code Content */}
            <div className="flex-1 overflow-auto font-mono text-sm p-4 text-gray-400 relative z-10">
              {mission.codeLines.map((line, index) => (
                <div key={index}>
                  {/* Error line with fix */}
                  {line.error && line.fix ? (
                    <div className="mt-2 mb-2 relative">
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-destructive text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-neon-destructive">
                        <Icon name="error" className="text-xs" /> ISSUE
                      </div>
                      
                      {/* Error line */}
                      <div className="flex w-full bg-destructive/10 border-l-2 border-destructive">
                        <div className="w-12 text-right pr-4 text-destructive/50 select-none py-1">{line.line}</div>
                        <div className="flex-1 pl-2 text-destructive py-1 relative">
                          <span className="line-through opacity-50">{line.code}</span>
                        </div>
                      </div>
                      
                      {/* Fix line */}
                      <div className="flex w-full bg-primary/10 border-l-2 border-primary">
                        <div className="w-12 text-right pr-4 text-primary/50 select-none py-1">{line.line}</div>
                        <div className="flex-1 pl-2 text-primary py-1 font-bold">{line.fix}</div>
                      </div>
                    </div>
                  ) : line.highlighted ? (
                    /* Highlighted line */
                    <div className="flex w-full bg-secondary/10 border-l-2 border-secondary">
                      <div className="w-12 text-right pr-4 text-secondary/50 select-none">{line.line}</div>
                      <div className="flex-1 pl-2 text-secondary">{line.code}</div>
                    </div>
                  ) : (
                    /* Normal line */
                    <div className="flex w-full group hover:bg-surface-highlight/50">
                      <div className="w-12 text-right pr-4 text-gray-600 select-none">{line.line}</div>
                      <div className="flex-1 pl-2">
                        <CodeHighlight code={line.code} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Raw Report Data */}
              {mission.rawReport.report_data && (
                <div className="mt-8 pt-4 border-t border-surface-accent">
                  <div className="text-xs text-gray-500 mb-2">// Raw Report Data</div>
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap">
                    {typeof mission.rawReport.report_data === 'string' 
                      ? mission.rawReport.report_data 
                      : JSON.stringify(mission.rawReport.report_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Bottom Section - Agent Analysis */}
        <div className="lg:col-span-12 mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scout Analysis */}
          <div className="relative bg-surface-dark border border-secondary/30 rounded-lg p-6 flex gap-5 items-start group hover:border-secondary transition-all shadow-neon-secondary">
            <div className="absolute -top-3 left-6 px-2 bg-background-dark text-secondary text-xs font-bold font-mono tracking-widest border border-secondary/30">
              THE SCOUT // ANALYSIS
            </div>
            <div className="size-16 rounded border-2 border-secondary p-0.5 bg-black shrink-0 relative overflow-hidden">
              <img 
                src={mission.analysis.scout.avatar} 
                alt="The Scout"
                className="size-full object-cover" 
              />
              <div className="absolute inset-0 bg-secondary/20 mix-blend-overlay" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-300 font-mono leading-relaxed">
                <span className="text-secondary font-bold">&gt;&gt;</span> {mission.analysis.scout.message}
              </p>
            </div>
          </div>
          
          {/* Sensei Guidance */}
          <div className="relative bg-surface-dark border border-primary/30 rounded-lg p-6 flex gap-5 items-start group hover:border-primary transition-all shadow-neon">
            <div className="absolute -top-3 right-6 px-2 bg-background-dark text-primary text-xs font-bold font-mono tracking-widest border border-primary/30">
              THE SENSEI // GUIDANCE
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm text-gray-300 font-mono leading-relaxed">
                {mission.analysis.sensei.message} <span className="text-primary font-bold">&lt;&lt;</span>
              </p>
            </div>
            <div className="size-16 rounded border-2 border-primary p-0.5 bg-black shrink-0 relative overflow-hidden">
              <img 
                src={mission.analysis.sensei.avatar} 
                alt="The Sensei"
                className="size-full object-cover" 
              />
              <div className="absolute inset-0 bg-primary/20 mix-blend-overlay" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

// Simple code syntax highlighter component
function CodeHighlight({ code }: { code: string }) {
  if (!code) return null
  
  // Very basic syntax highlighting
  const highlighted = code
    .replace(/(export|const|async|await|return|if|\/\/)/g, '<span class="text-purple-400">$1</span>')
    .replace(/(true|false|null|undefined)/g, '<span class="text-orange-400">$1</span>')
    .replace(/('[^']*')/g, '<span class="text-green-400">$1</span>')
    .replace(/(\d+)/g, '<span class="text-yellow-300">$1</span>')
    .replace(/(\[.*?\])/g, '<span class="text-secondary">$1</span>')
  
  return <span dangerouslySetInnerHTML={{ __html: highlighted }} />
}
