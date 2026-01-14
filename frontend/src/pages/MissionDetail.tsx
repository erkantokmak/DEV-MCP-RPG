import { useParams, Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useReport } from '../hooks/useApi'
import { AnalysisReport } from '../services/api'

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

type StatusType = 'CRITICAL' | 'WARNING' | 'SUCCESS'

function getStatusFromScore(score: number): StatusType {
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

interface CodeLine {
  line: number
  code: string
  highlighted: boolean
  isError?: boolean
  fix?: string
}

function generateCodeLines(report: AnalysisReport): CodeLine[] {
  const lines: CodeLine[] = []
  
  lines.push({ line: 1, code: '// Analysis Report Summary', highlighted: false })
  lines.push({ line: 2, code: '', highlighted: false })
  lines.push({ line: 3, code: `// Overall Score: ${report.overall_score}/100`, highlighted: false })
  lines.push({ line: 4, code: `// Status: ${report.status}`, highlighted: false })
  lines.push({ line: 5, code: '', highlighted: false })
  
  let lineNum = 6
  
  // Code Quality Issues
  if (report.code_quality?.issues && report.code_quality.issues.length > 0) {
    lines.push({ line: lineNum++, code: '// === Code Quality Issues ===', highlighted: false })
    
    report.code_quality.issues.slice(0, 5).forEach((issue) => {
      const isError = issue.severity === 'critical' || issue.severity === 'high'
      lines.push({
        line: lineNum++,
        code: `// [${issue.severity.toUpperCase()}] ${issue.message}`,
        highlighted: isError,
        isError,
        fix: issue.suggestion ? `// Fix: ${issue.suggestion}` : undefined,
      })
    })
    lines.push({ line: lineNum++, code: '', highlighted: false })
  }
  
  // Architecture Issues
  if (report.architecture?.layer_violations && report.architecture.layer_violations.length > 0) {
    lines.push({ line: lineNum++, code: '// === Architecture Violations ===', highlighted: false })
    report.architecture.layer_violations.slice(0, 3).forEach((violation) => {
      lines.push({ line: lineNum++, code: `// - ${violation}`, highlighted: true })
    })
    lines.push({ line: lineNum++, code: '', highlighted: false })
  }
  
  // Recommendations
  if (report.architecture?.recommendations && report.architecture.recommendations.length > 0) {
    lines.push({ line: lineNum++, code: '// === Recommendations ===', highlighted: false })
    report.architecture.recommendations.slice(0, 3).forEach((rec) => {
      lines.push({ line: lineNum++, code: `// ✓ ${rec}`, highlighted: false })
    })
  }
  
  return lines
}

function generateScoutMessage(report: AnalysisReport): string {
  const score = report.overall_score
  
  if (score < 40) {
    return `Critical vulnerabilities detected! Analysis score of ${score}/100 indicates severe issues requiring immediate attention. ${report.code_quality?.summary || 'Multiple weaknesses found in the codebase.'}`
  } else if (score < 70) {
    return `Several areas of concern identified. Analysis score of ${score}/100 shows room for improvement. ${report.code_quality?.summary || 'Some code patterns could be optimized.'}`
  }
  return `Excellent code quality detected! Analysis score of ${score}/100 indicates well-structured code. ${report.code_quality?.summary || 'Minor optimizations possible.'}`
}

function generateSenseiMessage(report: AnalysisReport): string {
  const score = report.overall_score
  
  if (score < 40) {
    return `Young warrior, this code requires your full attention. ${report.architecture?.summary || 'Focus on resolving critical issues first.'}`
  } else if (score < 70) {
    return `A promising foundation, but there is work to be done. ${report.architecture?.summary || 'Review the suggested improvements.'}`
  }
  return `Well done, developer. Your code demonstrates wisdom and skill. ${report.architecture?.summary || 'Continue this path of excellence.'}`
}

export function MissionDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: report, loading, error } = useReport(id || '')
  
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
  
  if (error || !report) {
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
  
  const status = getStatusFromScore(report.overall_score)
  const statusStyle = statusConfig[status]
  const codeLines = generateCodeLines(report)
  const damage = Math.max(0, 100 - report.overall_score)

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
          <div className={`bg-surface-dark border ${statusStyle.border.replace('/30', '/50')} rounded-lg overflow-hidden ${statusStyle.shadow}`}>
            <div className={`${statusStyle.bg} px-4 py-3 border-b ${statusStyle.border} flex justify-between items-center`}>
              <h3 className={`${statusStyle.text} font-display font-bold tracking-widest uppercase text-sm flex items-center gap-2`}>
                <Icon name="bug_report" />
                Mission Intel
              </h3>
              <span className={`text-[10px] font-mono ${statusStyle.text}`}>ANALYZED</span>
            </div>
            <div className="p-5 space-y-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1 block">
                  Report ID
                </label>
                <p className="text-white font-medium text-lg leading-tight font-mono">{report.report_id}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1 block">
                    Status
                  </label>
                  <div className={`flex items-center gap-2 ${statusStyle.text} font-mono bg-surface-highlight p-2 rounded border border-surface-accent`}>
                    <Icon name={statusStyle.icon} className="text-sm" />
                    {report.status.toUpperCase()}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1 block">
                    Time
                  </label>
                  <div className="flex items-center gap-2 text-gray-300 font-mono bg-surface-highlight p-2 rounded border border-surface-accent">
                    <Icon name="schedule" className="text-sm" />
                    {formatTimeAgo(report.analyzed_at)}
                  </div>
                </div>
              </div>
              
              {/* Score */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-2 block">
                  Overall Score
                </label>
                <div className={`p-4 rounded ${statusStyle.bg} border ${statusStyle.border} text-center`}>
                  <span className={`text-4xl font-display font-bold ${statusStyle.text}`}>{report.overall_score}</span>
                  <span className="text-gray-400 text-lg">/100</span>
                </div>
              </div>
              
              {/* XP Earned */}
              {report.rpg_summary && (
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-2 block">
                    RPG Rewards
                  </label>
                  <div className="p-3 rounded bg-primary/10 border border-primary/30">
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-mono">XP Earned</span>
                      <span className="text-primary font-bold">+{report.rpg_summary.xp_earned}</span>
                    </div>
                    {report.rpg_summary.badges_earned.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {report.rpg_summary.badges_earned.map((badge, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-gold/20 text-gold rounded">
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                -{damage} <span className="text-2xl ml-2">HP</span>
              </div>
              <p className="text-xs text-center text-gray-500 font-mono uppercase tracking-widest">
                {status === 'CRITICAL' ? 'Critical Hit!' : status === 'WARNING' ? 'Minor Damage' : 'Glancing Blow'}
              </p>
              
              {/* Health Bar */}
              <div className="w-full h-3 bg-gray-800 rounded-full mt-6 overflow-hidden relative border border-gray-700">
                <div 
                  className={`absolute inset-y-0 left-0 ${report.overall_score < 40 ? 'bg-destructive' : report.overall_score < 70 ? 'bg-secondary' : 'bg-primary'} shadow-[0_0_10px_currentColor]`}
                  style={{ width: `${report.overall_score}%` }}
                />
              </div>
              <div className="w-full flex justify-between mt-1 text-[10px] text-gray-500 font-mono">
                <span>0%</span>
                <span>SCORE: {report.overall_score}%</span>
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
                <span className="text-xs font-mono text-gray-300">Analysis Report: {report.report_id.slice(0, 8)}</span>
              </div>
              <div className="flex gap-2">
                <div className="size-3 rounded-full bg-red-500/20 border border-red-500" />
                <div className="size-3 rounded-full bg-yellow-500/20 border border-yellow-500" />
                <div className="size-3 rounded-full bg-green-500/20 border border-green-500" />
              </div>
            </div>
            
            {/* Code Content */}
            <div className="flex-1 overflow-auto font-mono text-sm p-4 text-gray-400 relative z-10">
              {codeLines.map((line, index) => (
                <div key={index}>
                  {line.isError && line.fix ? (
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
                    <div className="flex w-full bg-secondary/10 border-l-2 border-secondary">
                      <div className="w-12 text-right pr-4 text-secondary/50 select-none">{line.line}</div>
                      <div className="flex-1 pl-2 text-secondary">{line.code}</div>
                    </div>
                  ) : (
                    <div className="flex w-full group hover:bg-surface-highlight/50">
                      <div className="w-12 text-right pr-4 text-gray-600 select-none">{line.line}</div>
                      <div className="flex-1 pl-2">
                        <CodeHighlight code={line.code} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
                src="https://api.dicebear.com/7.x/bottts/svg?seed=scout"
                alt="The Scout"
                className="size-full object-cover" 
              />
              <div className="absolute inset-0 bg-secondary/20 mix-blend-overlay" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-300 font-mono leading-relaxed">
                <span className="text-secondary font-bold">&gt;&gt;</span> {generateScoutMessage(report)}
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
                {generateSenseiMessage(report)} <span className="text-primary font-bold">&lt;&lt;</span>
              </p>
            </div>
            <div className="size-16 rounded border-2 border-primary p-0.5 bg-black shrink-0 relative overflow-hidden">
              <img 
                src="https://api.dicebear.com/7.x/bottts/svg?seed=sensei"
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
  
  const highlighted = code
    .replace(/(\/\/.*)/g, '<span class="text-gray-500">$1</span>')
    .replace(/(\[.*?\])/g, '<span class="text-secondary">$1</span>')
    .replace(/(✓)/g, '<span class="text-primary">$1</span>')
    .replace(/(\d+)/g, '<span class="text-yellow-300">$1</span>')
  
  return <span dangerouslySetInnerHTML={{ __html: highlighted }} />
}
