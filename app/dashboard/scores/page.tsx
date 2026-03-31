'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { Trash2, Plus } from 'lucide-react'

const schema = z.object({
  points: z.coerce.number().min(1, 'Min 1').max(45, 'Max 45'),
  played_at: z.string().min(1, 'Select a date'),
})
type FormData = z.infer<typeof schema>

export default function ScoresPage() {
  const [scores, setScores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const supabase = createClient()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const fetchScores = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
    setScores(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchScores() }, [])

  const onSubmit = async (data: FormData) => {
    setError('')
    setSuccess('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('scores').insert({
      user_id: user.id,
      points: data.points,
      played_at: data.played_at,
    })
    if (error) { setError(error.message); return }
    setSuccess('Score added! Rolling window updated.')
    reset()
    setAdding(false)
    fetchScores()
    setTimeout(() => setSuccess(''), 3000)
  }

  const deleteScore = async (id: string) => {
    await supabase.from('scores').delete().eq('id', id)
    fetchScores()
  }

  const avg = scores.length ? (scores.reduce((s, c) => s + c.points, 0) / scores.length).toFixed(1) : '—'
  const best = scores.length ? Math.max(...scores.map(s => s.points)) : '—'

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold">My Scores</h1>
          <p className="text-slate text-sm mt-1">Stableford format · Rolling last 5 rounds</p>
        </div>
        <Button onClick={() => setAdding(!adding)} size="sm" variant="secondary">
          <Plus size={14} />
          Add Score
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-xs text-slate mb-1">Scores logged</p>
          <p className="font-serif text-3xl font-bold">{scores.length}<span className="text-slate text-base font-sans">/5</span></p>
        </Card>
        <Card accent="sage">
          <p className="text-xs text-slate mb-1">Average</p>
          <p className="font-serif text-3xl font-bold">{avg}</p>
        </Card>
        <Card accent="gold">
          <p className="text-xs text-slate mb-1">Best score</p>
          <p className="font-serif text-3xl font-bold">{best}</p>
        </Card>
      </div>

      {/* Add score form */}
      {adding && (
        <Card className="mb-6">
          <h2 className="font-medium mb-4">Add a new score</h2>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
          {scores.length >= 5 && (
            <div className="bg-gold-light border border-gold/20 text-sm px-4 py-3 rounded-xl mb-4 text-ink">
              ⚠️ You have 5 scores. Adding a new one will automatically remove your oldest.
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[120px]">
              <Input
                label="Points (1–45)"
                type="number"
                min={1}
                max={45}
                placeholder="e.g. 32"
                {...register('points')}
                error={errors.points?.message}
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <Input
                label="Round date"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                {...register('played_at')}
                error={errors.played_at?.message}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={isSubmitting} variant="secondary" size="md">Save</Button>
              <Button type="button" variant="ghost" size="md" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {success && (
        <div className="bg-sage-light border border-sage/30 text-sage font-medium text-sm px-4 py-3 rounded-xl mb-4">{success}</div>
      )}

      {/* Scores list */}
      <Card>
        <h2 className="font-medium mb-4">Score history</h2>
        {loading ? (
          <div className="text-center py-8 text-slate text-sm">Loading...</div>
        ) : scores.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate text-sm mb-4">No scores logged yet. Add your first Stableford round.</p>
            <Button onClick={() => setAdding(true)} variant="secondary" size="sm">
              <Plus size={14} /> Add first score
            </Button>
          </div>
        ) : (
          <div>
            {scores.map((score, i) => (
              <div key={score.id} className={`flex items-center gap-4 py-3.5 ${i < scores.length - 1 ? 'border-b border-ink/8' : ''}`}>
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${i === 0 ? 'bg-gold' : 'bg-sage'}`} />
                <div className="flex-1">
                  <span className="text-sm text-slate">
                    {new Date(score.played_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  {i === 0 && <span className="ml-2 text-xs bg-gold-light text-gold font-medium px-2 py-0.5 rounded-full">Latest</span>}
                </div>
                <div className="text-right">
                  <span className="font-serif text-2xl font-bold">{score.points}</span>
                  <span className="text-slate text-xs ml-1">pts</span>
                </div>
                <button
                  onClick={() => deleteScore(score.id)}
                  className="text-slate/40 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="text-xs text-slate mt-4 text-center">
        Only your 5 most recent scores are kept. Adding a 6th automatically removes the oldest.
        Scores are used to match against the monthly draw numbers.
      </p>
    </div>
  )
}
