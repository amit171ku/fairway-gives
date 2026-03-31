'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Link from 'next/link'

export default function SubscribePage() {
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const plans = [
    {
      key: 'monthly' as const,
      label: 'Monthly',
      price: '£9.99',
      per: '/month',
      total: '£9.99 billed monthly',
      badge: null,
      features: ['Full score tracking', 'Monthly prize draw entry', 'Charity contribution (min 10%)', 'Cancel anytime'],
    },
    {
      key: 'yearly' as const,
      label: 'Yearly',
      price: '£99.99',
      per: '/year',
      total: 'Just £8.33/month — save £19.89',
      badge: 'Best Value',
      features: ['Everything in Monthly', 'Priority draw entry', 'Discounted rate (save 17%)', 'Annual summary report'],
    },
  ]

  const handleSubscribe = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selected }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create checkout session')
      window.location.href = data.url
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-mist flex flex-col">
      <div className="p-6">
        <Link href="/" className="font-serif font-bold text-xl tracking-tight">
          Fairway<span className="text-sage">Gives</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="font-serif text-4xl font-bold mb-2">Choose your plan</h1>
            <p className="text-slate">Both plans include full access. Pick what suits you.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6 text-center">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-5 mb-8">
            {plans.map(plan => (
              <button
                key={plan.key}
                onClick={() => setSelected(plan.key)}
                className={`text-left rounded-2xl border-2 p-6 transition-all ${
                  selected === plan.key
                    ? 'border-sage bg-sage/5'
                    : 'border-ink/10 bg-white hover:border-ink/30'
                }`}
              >
                {plan.badge && (
                  <span className="bg-sage text-white text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">
                    {plan.badge}
                  </span>
                )}
                <h3 className="font-serif text-xl font-bold mb-1">{plan.label}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-serif text-3xl font-bold">{plan.price}</span>
                  <span className="text-slate text-sm">{plan.per}</span>
                </div>
                <p className="text-xs text-slate mb-4">{plan.total}</p>
                <ul className="space-y-1.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate">
                      <span className="text-sage">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          <Button
            onClick={handleSubscribe}
            loading={loading}
            size="lg"
            className="w-full"
            variant="secondary"
          >
            Continue with {selected === 'monthly' ? '£9.99/month' : '£99.99/year'} →
          </Button>
          <p className="text-center text-xs text-slate mt-3">
            Secure payment via Stripe. Cancel anytime. Min. 10% goes to your chosen charity.
          </p>
        </div>
      </div>
    </div>
  )
}
