'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react'

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const fetchWinners = async () => {
    const { data } = await supabase
      .from('draw_results')
      .select(`
        *,
        profiles ( full_name, email ),
        draws ( draw_month, drawn_numbers )
      `)
      .order('created_at', { ascending: false })
    setWinners(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchWinners() }, [])

  const updateVerification = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    await supabase.from('draw_results').update({ verification_status: status, admin_notes: notes ?? null }).eq('id', id)
    fetchWinners()
    setMessage(`Winner ${status}`)
    setTimeout(() => setMessage(''), 3000)
  }

  const updatePayment = async (id: string, status: 'paid') => {
    await supabase.from('draw_results').update({ payment_status: status }).eq('id', id)
    fetchWinners()
    setMessage('Payout marked as paid')
    setTimeout(() => setMessage(''), 3000)
  }

  const filtered = winners.filter(w =>
    filter === 'all' || w.verification_status === filter
  )

  const pendingCount = winners.filter(w => w.verification_status === 'pending').length
  const approvedCount = winners.filter(w => w.verification_status === 'approved').length
  const paidCount = winners.filter(w => w.payment_status === 'paid').length
  const totalPaid = winners.filter(w => w.payment_status === 'paid').reduce((s, w) => s + w.prize_amount, 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold">Winners</h1>
        <p className="text-slate text-sm mt-1">Verify submissions and track payouts</p>
      </div>

      {message && (
        <div className="bg-sage-light text-sage font-medium text-sm px-4 py-3 rounded-xl mb-4">{message}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <p className="text-xs text-slate mb-1">Pending review</p>
          <p className="font-serif text-3xl font-bold text-gold">{pendingCount}</p>
        </Card>
        <Card accent="sage">
          <p className="text-xs text-slate mb-1">Approved</p>
          <p className="font-serif text-3xl font-bold">{approvedCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate mb-1">Paid out</p>
          <p className="font-serif text-3xl font-bold">{paidCount}</p>
        </Card>
        <Card accent="gold">
          <p className="text-xs text-slate mb-1">Total paid</p>
          <p className="font-serif text-3xl font-bold">£{totalPaid.toFixed(2)}</p>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm capitalize transition-colors ${filter === f ? 'bg-ink text-white' : 'bg-white border border-ink/15 text-slate hover:border-ink/30'}`}
          >
            {f} {f === 'pending' && pendingCount > 0 && <span className="ml-1 bg-gold text-white text-xs rounded-full w-4 h-4 inline-flex items-center justify-center">{pendingCount}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-slate text-sm">
            No {filter === 'all' ? '' : filter} winners found
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(w => (
            <Card key={w.id}>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium">{w.profiles?.full_name ?? 'Unknown'}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      w.matched_count === 5 ? 'bg-gold-light text-gold'
                      : w.matched_count === 4 ? 'bg-sage-light text-sage'
                      : 'bg-mist text-slate border border-ink/10'
                    }`}>{w.matched_count}-match</span>
                  </div>
                  <p className="text-xs text-slate">{w.profiles?.email}</p>
                  <p className="text-xs text-slate mt-0.5">Draw: {w.draws?.draw_month}</p>
                  {w.draws?.drawn_numbers && (
                    <div className="flex gap-1 mt-2">
                      {w.draws.drawn_numbers.map((n: number) => (
                        <span key={n} className="w-6 h-6 bg-ink text-white rounded-full flex items-center justify-center text-xs font-bold">{n}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <p className="font-serif text-2xl font-bold text-sage">£{w.prize_amount.toFixed(2)}</p>
                  <div className="flex gap-2 justify-end mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      w.verification_status === 'approved' ? 'bg-sage-light text-sage'
                      : w.verification_status === 'rejected' ? 'bg-red-50 text-red-500'
                      : 'bg-gold-light text-gold'
                    }`}>{w.verification_status}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${w.payment_status === 'paid' ? 'bg-sage-light text-sage' : 'bg-mist text-slate border border-ink/10'}`}>
                      {w.payment_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Proof */}
              {w.proof_url && (
                <div className="mt-3 flex items-center gap-3">
                  <p className="text-xs text-slate">Proof submitted:</p>
                  <a href={w.proof_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-sage hover:underline">
                    View proof <ExternalLink size={11} />
                  </a>
                </div>
              )}

              {!w.proof_url && w.verification_status === 'pending' && (
                <p className="text-xs text-slate mt-2 italic">No proof submitted yet</p>
              )}

              {/* Actions */}
              {w.verification_status === 'pending' && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateVerification(w.id, 'approved')}
                  >
                    <CheckCircle size={13} /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => updateVerification(w.id, 'rejected')}
                  >
                    <XCircle size={13} /> Reject
                  </Button>
                </div>
              )}

              {w.verification_status === 'approved' && w.payment_status === 'pending' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3"
                  onClick={() => updatePayment(w.id, 'paid')}
                >
                  Mark as paid
                </Button>
              )}

              {w.admin_notes && (
                <p className="text-xs text-slate mt-2 italic">Notes: {w.admin_notes}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
