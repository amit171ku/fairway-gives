'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editScore, setEditScore] = useState<{ userId: string; scoreId: string; pts: number } | null>(null)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select(`
        *,
        subscriptions (*),
        scores (*)
      `)
      .order('created_at', { ascending: false })
    setUsers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter(u => {
    const matchSearch = u.email.toLowerCase().includes(search.toLowerCase()) || (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    const sub = u.subscriptions?.[0]
    const matchFilter = filter === 'all' || (filter === 'active' && sub?.status === 'active') || (filter === 'inactive' && sub?.status !== 'active')
    return matchSearch && matchFilter
  })

  const updateSubscriptionStatus = async (userId: string, status: string) => {
    const { data: sub } = await supabase.from('subscriptions').select('id').eq('user_id', userId).single()
    if (!sub) return
    await supabase.from('subscriptions').update({ status }).eq('id', sub.id)
    fetchUsers()
    setMessage(`Subscription updated to ${status}`)
    setTimeout(() => setMessage(''), 3000)
  }

  const saveScoreEdit = async () => {
    if (!editScore) return
    await supabase.from('scores').update({ points: editScore.pts }).eq('id', editScore.scoreId)
    setEditScore(null)
    fetchUsers()
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold">Users</h1>
        <p className="text-slate text-sm mt-1">Manage user profiles, subscriptions, and scores</p>
      </div>

      {message && (
        <div className="bg-sage-light text-sage font-medium text-sm px-4 py-3 rounded-xl mb-4">{message}</div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-ink/15 text-sm outline-none focus:ring-2 focus:ring-sage/30"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm capitalize transition-colors ${filter === f ? 'bg-ink text-white' : 'bg-white border border-ink/15 text-slate hover:border-ink/30'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate">Loading users...</div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-mist border-b border-ink/10">
                <tr>
                  {['User', 'Plan', 'Status', 'Scores', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs text-slate font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => {
                  const sub = user.subscriptions?.[0]
                  const scores = user.scores ?? []
                  const isExpanded = expanded === user.id
                  return (
                    <>
                      <tr key={user.id} className="border-b border-ink/8 hover:bg-mist/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-medium">{user.full_name ?? '—'}</p>
                          <p className="text-xs text-slate">{user.email}</p>
                        </td>
                        <td className="px-5 py-3.5 capitalize text-xs">{sub?.plan ?? '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            sub?.status === 'active' ? 'bg-sage-light text-sage'
                            : sub?.status === 'cancelled' ? 'bg-red-50 text-red-500'
                            : 'bg-mist text-slate border border-ink/10'
                          }`}>{sub?.status ?? 'inactive'}</span>
                        </td>
                        <td className="px-5 py-3.5 text-xs">{scores.length}/5</td>
                        <td className="px-5 py-3.5 text-xs text-slate">{new Date(user.created_at).toLocaleDateString('en-GB')}</td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => setExpanded(isExpanded ? null : user.id)}
                            className="flex items-center gap-1 text-xs text-sage hover:underline"
                          >
                            Details {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${user.id}-expanded`} className="bg-mist/50">
                          <td colSpan={6} className="px-5 py-4">
                            <div className="grid md:grid-cols-2 gap-6">
                              {/* Subscription actions */}
                              <div>
                                <p className="text-xs font-medium mb-2">Subscription management</p>
                                <div className="flex gap-2 flex-wrap">
                                  {['active', 'cancelled', 'lapsed'].map(s => (
                                    <button
                                      key={s}
                                      onClick={() => updateSubscriptionStatus(user.id, s)}
                                      className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${sub?.status === s ? 'bg-ink text-white border-ink' : 'border-ink/20 hover:border-ink text-slate'}`}
                                    >
                                      Set {s}
                                    </button>
                                  ))}
                                </div>
                                {sub?.current_period_end && (
                                  <p className="text-xs text-slate mt-2">Period ends: {new Date(sub.current_period_end).toLocaleDateString('en-GB')}</p>
                                )}
                              </div>
                              {/* Score management */}
                              <div>
                                <p className="text-xs font-medium mb-2">Scores ({scores.length}/5)</p>
                                {scores.length === 0 ? <p className="text-xs text-slate">No scores logged</p> : (
                                  <div className="flex flex-col gap-1.5">
                                    {scores.sort((a: any, b: any) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()).map((s: any) => (
                                      <div key={s.id} className="flex items-center gap-3">
                                        <span className="text-xs text-slate w-24">{new Date(s.played_at).toLocaleDateString('en-GB')}</span>
                                        {editScore?.scoreId === s.id ? (
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="number"
                                              min={1} max={45}
                                              value={editScore.pts}
                                              onChange={e => setEditScore({ ...editScore, pts: Number(e.target.value) })}
                                              className="w-16 px-2 py-1 text-xs rounded-lg border border-ink/20 outline-none"
                                            />
                                            <button onClick={saveScoreEdit} className="text-xs text-sage font-medium">Save</button>
                                            <button onClick={() => setEditScore(null)} className="text-xs text-slate">Cancel</button>
                                          </div>
                                        ) : (
                                          <>
                                            <span className="text-xs font-bold">{s.points} pts</span>
                                            <button
                                              onClick={() => setEditScore({ userId: user.id, scoreId: s.id, pts: s.points })}
                                              className="text-xs text-slate hover:text-sage"
                                            >Edit</button>
                                          </>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate text-sm">No users found</div>
          )}
        </Card>
      )}
    </div>
  )
}
