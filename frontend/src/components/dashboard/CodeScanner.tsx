import { useState } from 'react'
import { Icon } from '../Icon'
import { api } from '../../services/api'

export function CodeScanner() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'scanning' | 'complete' | 'error'>('idle')

  const handleAnalyze = async () => {
    if (!code.trim()) return

    setLoading(true)
    setStatus('scanning')

    try {
      // Backend üzerinden n8n'i tetikler
      await api.analyzeCode({
        code: code,
        language: 'python', // Şimdilik varsayılan, istersen dropdown yapabiliriz
        file_path: 'manual_scan.py'
      })
      
      setStatus('complete')
      setCode('') // Temizle
      // Buraya bir "Success" bildirimi veya Mission Log yenileme eklenebilir
      alert("Scan Complete! Check your Mission Log for rewards.")
      
    } catch (error) {
      console.error(error)
      setStatus('error')
      alert("Scan Failed: Connection Error")
    } finally {
      setLoading(false)
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-surface-accent bg-surface-dark/50 p-6 backdrop-blur-sm relative overflow-hidden group">
      {/* Dekoratif Arkaplan Efekti */}
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon name="radar" className="text-6xl text-primary" />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded bg-primary/20 text-primary shadow-neon">
          <Icon name="code" className="text-xl" />
        </div>
        <div>
          <h3 className="font-display font-bold text-white tracking-wide">CODE SCANNER</h3>
          <p className="text-xs text-gray-400 font-mono">UPLOAD SOURCE FRAGMENT</p>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="// Paste your code here to initialize sequence..."
          className="w-full h-32 bg-background-darker border border-surface-accent rounded-lg p-3 text-sm font-mono text-gray-300 focus:border-primary focus:shadow-neon focus:outline-none resize-none transition-all"
        />
        <div className="absolute bottom-2 right-2 text-[10px] text-gray-600 font-mono">
          {code.length} CHARS
        </div>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading || !code.trim()}
        className={`
          flex items-center justify-center gap-2 py-3 rounded-lg font-display font-bold tracking-widest uppercase transition-all
          ${loading 
            ? 'bg-surface-accent text-gray-400 cursor-not-allowed' 
            : 'bg-primary hover:bg-primary-light text-background-darker hover:shadow-neon cursor-pointer'}
        `}
      >
        {loading ? (
          <>
            <Icon name="sync" className="animate-spin" />
            SCANNING...
          </>
        ) : (
          <>
            <Icon name="play_arrow" />
            INITIATE SCAN
          </>
        )}
      </button>

      {/* Status Line */}
      <div className="flex justify-between items-center text-[10px] font-mono uppercase text-gray-500">
        <span>Target: Manual Input</span>
        <span className={status === 'error' ? 'text-red-500' : 'text-primary'}>
          Status: {status}
        </span>
      </div>
    </div>
  )
}