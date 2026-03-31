'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Check } from 'lucide-react'

export default function CharityPage() {
  const [charities, setCharities] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [selectedId, setSelectedId] = useState<string>('')
  const [pct, setPct] = useState(10)
  const [donateAmount, setDonateAmount] = useState(5)
  const [saving, setSaving] = useState(false)
  const [donating, setDonating] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: charityData }, { data: profileData }] = await Promise.all([
        supabase.from('charities').select('*').eq('is_active', true),
        supabase.from('profiles').select('*, subscriptions(*)').eq('id', user.id).single(),
      ])
      setCharities(charityData ?? [])
      setProfile(profileData)
      setSelectedId(profileData?.charity_id ?? '')
      setPct(profileData?.charity_pct ?? 10)
    }
    load()
  }, [])

  const saveSelection = async () => {
    setSaving(true)
    setMessage('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({
      charity_id: selectedId,
      charity_pct: pct,
    }).eq('id', user.id)
    setSaving(false)
    if (error) setMessage('Error saving. Please try again.')
    else setMessage('Charity preference saved!')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleIndependentDonate = async () => {
    if (!selectedId) { setMessage('Please select a charity first.'); return }
    setDonating(true)
    const res = await fetch('/api/charity/donate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ charityId: selectedId, amount: donateAmount }),
    })
    const data = await res.json()
    setDonating(false)
    if (data.url) window.location.href = data.url
    else setMessage(data.error ?? 'Error creating donation session')
  }

  const subAmount = profile?.subscriptions?.[0]?.amount ?? 0
  const contribution = subAmount * (pct / 100)

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold">My Charity</h1>
        <p className="text-slate text-sm mt-1">Choose who benefits from your subscription</p>
      </div>

      {message && (
        <div className={`text-sm px-4 py-3 rounded-xl mb-6 font-medium ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-sage-light text-sage'}`}>
          {message}
        </div>
      )}

      {/* Charity selector */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {charities.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={`text-left rounded-2xl border-2 p-5 transition-all relative ${
              selectedId === c.id ? 'border-sage bg-sage/5' : 'border-ink/10 bg-white hover:border-ink/25'
            }`}
          >
            {selectedId === c.id && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-sage rounded-full flex items-center justify-center">
                <Check size={12} className="text-white" />
              </div>
            )}
            {c.is_featured && (
              <span className="text-xs bg-gold-light text-gold font-medium px-2 py-0.5 rounded-full mb-2 inline-block">Featured</span>
            )}
            <h3 className="font-medium mb-1">{c.name}</h3>
            <p className="text-xs text-slate mb-3 leading-relaxed">{c.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-sage font-medium">£{c.total_raised.toLocaleString()} raised</span>
              {c.upcoming_event && (
                <span className="text-xs text-slate">{c.upcoming_event}</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Contribution slider */}
      <Card className="mb-6">
        <h2 className="font-medium mb-4">Contribution rate</h2>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate">Your charity share</span>
          <span className="font-serif text-2xl font-bold text-sage">{pct}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={pct}
          onChange={e => setPct(Number(e.target.value))}
          className="w-full accent-sage mb-3"
        />
        <div className="flex justify-between text-xs text-slate">
          <span>Min 10%</span>
          <span>100%</span>
        </div>
        {subAmount > 0 && (
          <p className="text-sm text-slate mt-3 bg-mist rounded-xl px-4 py-2.5">
            At {pct}% — <strong className="text-sage">£{contribution.toFixed(2)}/month</strong> will go to your chosen charity
          </p>
        )}
        <Button onClick={saveSelection} loading={saving} variant="secondary" size="md" className="mt-4">
          Save preference
        </Button>
      </Card>

      {/* Independent donation */}
      <Card>
        <h2 className="font-medium mb-1">One-off donation</h2>
        <p className="text-xs text-slate mb-4">Donate directly to your selected charity, independent of your subscription.</p>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">£</span>
            <input
              type="number"
              min={1}
              max={500}
              value={donateAmount}
              onChange={e => setDonateAmount(Number(e.target.value))}
              className="w-20 px-3 py-2 rounded-xl border border-ink/15 text-sm outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage"
            />
          </div>
          <Button onClick={handleIndependentDonate} loading={donating} variant="ghost" size="md">
            Donate £{donateAmount} →
          </Button>
        </div>
        <p className="text-xs text-slate mt-3 opacity-70">You'll be directed to a secure Stripe checkout page.</p>
      </Card>
    </div>
  )
}
