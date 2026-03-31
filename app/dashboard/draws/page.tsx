'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Upload } from 'lucide-react'

export default function DrawsPage() {
  const [draws, setDraws] = useState<any[]>([])
  const [myResults, setMyResults] = useState<any[]>([])
  const [uploading, setUploading] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: drawData }, { data: resultData }] = await Promise.all([
        supabase.from('draws').select('*').eq('status', 'published').order('draw_date', { ascending: false }),
        supabase.from('draw_results').select('*').eq('user_id', user.id),
      ])
      setDraws(drawData ?? [])
      setMyResults(resultData ?? [])
    }
    load()
  }, [])

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>, resultId: string) => {
    if (!e.target.files?.[0]) return
    setUploading(resultId)
    const file = e.target.files[0]
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const path = `${user.id}/${resultId}-${Date.now()}.${file.name.split('.').pop()}`
    const { error: uploadError } = await supabase.storage.from('winner-proofs').upload(path, file)
    if (uploadError) { setMessage('Upload failed: ' + uploadError.message); setUploading(null); return }
    const { data: { publicUrl } } = supabase.storage.from('winner-proofs').getPublicUrl(path)
    await supabase.from('draw_results').update({ proof_url: publicUrl }).eq('id', resultId)
    setMessage('Proof uploaded! Admin will review shortly.')
    setMyResults(prev => prev.map(r => r.id === resultId ? { ...r, proof_url: publicUrl } : r))
    setUploading(null)
    setTimeout(() => setMessage(''), 4000)
  }

  const totalWon = myResults.reduce((s, r) => s + r.prize_amount, 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold">Draw History</h1>
        <p className="text-slate text-sm mt-1">Your participation and winnings across all draws</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="text-xs text-slate mb-1">Draws entered</p>
          <p className="font-serif text-3xl font-bold">{draws.length}</p>
        </Card>
        <Card accent="gold">
          <p className="text-xs text-slate mb-1">Total won</p>
          <p className="font-serif text-3xl font-bold">£{totalWon.toFixed(2)}</p>
        </Card>
        <Card accent="sage">
          <p className="text-xs text-slate mb-1">Times matched</p>
          <p className="font-serif text-3xl font-bold">{myResults.length}</p>
        </Card>
      </div>

      {message && (
        <div className="bg-sage-light border border-sage/30 text-sage font-medium text-sm px-4 py-3 rounded-xl mb-4">{message}</div>
      )}

      {draws.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <p className="text-slate">No draws have been published yet. Check back after the monthly draw.</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {draws.map(draw => {
            const myResult = myResults.find(r => r.draw_id === draw.id)
            return (
              <Card key={draw.id}>
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div>
                    <h2 className="font-medium">{draw.draw_month} Draw</h2>
                    {draw.draw_date && (
                      <p className="text-xs text-slate">{new Date(draw.draw_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate">Prize pool</p>
                    <p className="font-serif font-bold">£{draw.prize_pool_total.toLocaleString()}</p>
                  </div>
                </div>

                {/* Drawn numbers */}
                <div className="mb-4">
                  <p className="text-xs text-slate mb-2">Drawn numbers</p>
                  <div className="flex gap-2">
                    {draw.drawn_numbers.map((n: number) => (
                      <div key={n} className="w-9 h-9 bg-ink text-white rounded-full flex items-center justify-center text-sm font-bold">{n}</div>
                    ))}
                  </div>
                </div>

                {/* My result */}
                {myResult ? (
                  <div className="bg-gold-light rounded-xl p-4 border border-gold/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        🎉 You matched {myResult.matched_count} numbers!
                      </span>
                      <span className="font-serif font-bold text-gold">£{myResult.prize_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        myResult.payment_status === 'paid' ? 'bg-sage-light text-sage' : 'bg-gold-light text-gold border border-gold/30'
                      }`}>
                        Payout: {myResult.payment_status}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        myResult.verification_status === 'approved' ? 'bg-sage-light text-sage'
                        : myResult.verification_status === 'rejected' ? 'bg-red-50 text-red-500'
                        : 'bg-mist text-slate border border-ink/10'
                      }`}>
                        Verification: {myResult.verification_status}
                      </span>
                    </div>
                    {/* Proof upload */}
                    {myResult.verification_status === 'pending' && !myResult.proof_url && (
                      <div className="mt-3">
                        <p className="text-xs text-slate mb-2">Upload a screenshot of your scores to verify your win:</p>
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={e => handleProofUpload(e, myResult.id)}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={uploading === myResult.id}
                          onClick={() => fileRef.current?.click()}
                        >
                          <Upload size={13} />
                          Upload proof
                        </Button>
                      </div>
                    )}
                    {myResult.proof_url && (
                      <p className="text-xs text-sage mt-2">✓ Proof submitted — awaiting admin review</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate/60 text-center py-2">No match in this draw</p>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
