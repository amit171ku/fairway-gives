'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Play, CheckCircle, Eye } from 'lucide-react'

type DrawMode = 'random' | 'weighted_frequent' | 'weighted_rare'

export default function AdminDrawsPage() {
  const [draws, setDraws] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<DrawMode>('random')
  const [simResult, setSimResult] = useState<any>(null)
  const [simulating, setSimulating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState('')
  const [carryForward, setCarryForward] = useState(0)
  const supabase = createClient()

  const fetchDraws = async () => {
    const { data } = await supabase.from('draws').select('*').order('created_at', { ascending: false })
    setDraws(data ?? [])
    // Get carry forward from last published draw
    const lastPublished = data?.find(d => d.status === 'published')
    if (lastPublished) setCarryForward(lastPublished.jackpot_carry_forward ?? 0)
    setLoading(false)
  }

  useEffect(() => { fetchDraws() }, [])

  const handleSimulate = async () => {
    setSimulating(true)
    setSimResult(null)
    setMessage('')
    try {
      const res = await fetch('/api/draws/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, carryForward }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSimResult(data)
    } catch (e: any) {
      setMessage('Simulation error: ' + e.message)
    }
    setSimulating(false)
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      const res = await fetch('/api/draws/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, carryForward }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage(`Draw published! ${data.winners.length} winner(s) found.`)
      setSimResult(null)
      fetchDraws()
    } catch (e: any) {
      setMessage('Publish error: ' + e.message)
    }
    setPublishing(false)
  }

  const currentMonth = new Date().toISOString().slice(0, 7)
  const alreadyPublished = draws.some(d => d.draw_month === currentMonth && d.status === 'published')

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold">Draw Engine</h1>
        <p className="text-slate text-sm mt-1">Configure, simulate, and publish monthly prize draws</p>
      </div>

      {message && (
        <div className={`text-sm px-4 py-3 rounded-xl mb-6 font-medium ${message.includes('error') || message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-sage-light text-sage'}`}>
          {message}
        </div>
      )}

      {alreadyPublished && (
        <div className="bg-gold-light border border-gold/30 rounded-2xl p-4 mb-6">
          <p className="text-sm font-medium">⚠️ A draw has already been published for {currentMonth}.</p>
        </div>
      )}

      {/* Config */}
      <Card className="mb-6">
        <h2 className="font-medium mb-4">Draw Configuration — {currentMonth}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-slate mb-2">Draw mode</p>
            <div className="flex flex-col gap-2">
              {[
                { key: 'random', label: 'Random', desc: 'Standard lottery — 5 numbers drawn at random from 1–45' },
                { key: 'weighted_frequent', label: 'Weighted: Most Frequent', desc: 'Draws numbers most commonly scored by users' },
                { key: 'weighted_rare', label: 'Weighted: Least Frequent', desc: 'Draws numbers least commonly scored by users' },
              ].map(m => (
                <label key={m.key} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${mode === m.key ? 'border-sage bg-sage/5' : 'border-ink/10 hover:border-ink/25'}`}>
                  <input
                    type="radio"
                    name="mode"
                    value={m.key}
                    checked={mode === m.key}
                    onChange={() => setMode(m.key as DrawMode)}
                    className="mt-0.5 accent-sage"
                  />
                  <div>
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-xs text-slate">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate mb-2">Jackpot carry forward (£)</p>
            <input
              type="number"
              min={0}
              value={carryForward}
              onChange={e => setCarryForward(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-ink/15 text-sm outline-none focus:ring-2 focus:ring-sage/30"
            />
            <p className="text-xs text-slate mt-1.5">Amount rolled over from previous draw's unclaimed jackpot</p>

            <div className="mt-6 p-4 bg-mist rounded-xl">
              <p className="text-xs font-medium mb-2">Prize tier split (of total pool)</p>
              <div className="space-y-1.5">
                {[['5-match (Jackpot)', '40%', 'Rolls over if unclaimed'], ['4-match', '35%', 'Split among winners'], ['3-match', '25%', 'Split among winners']].map(([label, pct, note]) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-slate">{label}</span>
                    <span className="font-medium">{pct} <span className="text-slate font-normal">— {note}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={handleSimulate} loading={simulating} variant="ghost" size="md">
            <Eye size={15} /> Simulate draw
          </Button>
          {simResult && (
            <Button onClick={handlePublish} loading={publishing} variant="secondary" size="md" disabled={alreadyPublished}>
              <CheckCircle size={15} /> Publish this draw
            </Button>
          )}
        </div>
      </Card>

      {/* Simulation result */}
      {simResult && (
        <Card className="mb-6 border-2 border-gold/30 bg-gold-light/20">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold bg-gold text-white px-3 py-1 rounded-full uppercase tracking-wide">Simulation Preview</span>
            <p className="text-xs text-slate">Review before publishing</p>
          </div>

          <div className="mb-4">
            <p className="text-xs text-slate mb-2">Drawn numbers</p>
            <div className="flex gap-2">
              {simResult.drawnNumbers.map((n: number) => (
                <div key={n} className="w-10 h-10 bg-ink text-white rounded-full flex items-center justify-center font-bold">{n}</div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-xl p-3 text-center">
              <p className="text-xs text-slate">Prize pool</p>
              <p className="font-serif font-bold">£{simResult.prizePoolTotal?.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <p className="text-xs text-slate">Winners</p>
              <p className="font-serif font-bold">{simResult.winners?.length ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <p className="text-xs text-slate">New carry forward</p>
              <p className="font-serif font-bold">£{simResult.newCarryForward?.toFixed(2)}</p>
            </div>
          </div>

          {simResult.winners?.length > 0 ? (
            <div>
              <p className="text-xs font-medium mb-2">Winners</p>
              <div className="flex flex-col gap-2">
                {simResult.winners.map((w: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{w.fullName}</p>
                      <p className="text-xs text-slate">{w.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-sage">£{w.prizeAmount.toFixed(2)}</p>
                      <p className="text-xs text-slate">{w.matchedCount}-match</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate text-center py-2">No winners this draw. Jackpot carries forward.</p>
          )}
        </Card>
      )}

      {/* Draw history */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-ink/10">
          <h2 className="font-medium">Draw History</h2>
        </div>
        {loading ? (
          <div className="text-center py-10 text-slate text-sm">Loading...</div>
        ) : draws.length === 0 ? (
          <div className="text-center py-10 text-slate text-sm">No draws yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-mist">
              <tr>
                {['Month', 'Drawn Numbers', 'Prize Pool', 'Carry Fwd', 'Mode', 'Status'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-slate font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {draws.map(d => (
                <tr key={d.id} className="border-t border-ink/8 hover:bg-mist/40">
                  <td className="px-5 py-3">{d.draw_month}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      {(d.drawn_numbers ?? []).map((n: number) => (
                        <span key={n} className="w-6 h-6 bg-ink text-white rounded-full flex items-center justify-center text-xs font-bold">{n}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3">£{d.prize_pool_total?.toLocaleString()}</td>
                  <td className="px-5 py-3">£{d.jackpot_carry_forward?.toFixed(2)}</td>
                  <td className="px-5 py-3 capitalize text-xs">{d.mode}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      d.status === 'published' ? 'bg-sage-light text-sage'
                      : d.status === 'simulated' ? 'bg-gold-light text-gold'
                      : 'bg-mist text-slate border border-ink/10'
                    }`}>{d.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
