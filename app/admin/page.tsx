import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import Card from '@/components/ui/Card'

export default async function AdminPage() {
  const supabase = createAdminClient()

  const [
    { count: totalUsers },
    { count: activeSubscribers },
    { data: draws },
    { data: charities },
    { data: winners },
    { data: contributions },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('draws').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('charities').select('*').eq('is_active', true),
    supabase.from('draw_results').select('*').eq('verification_status', 'pending'),
    supabase.from('charity_contributions').select('amount'),
  ])

  const totalPrizePool = draws?.reduce((s, d) => s + d.prize_pool_total, 0) ?? 0
  const totalContributions = contributions?.reduce((s, c) => s + c.amount, 0) ?? 0
  const publishedDraws = draws?.filter(d => d.status === 'published').length ?? 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold">Admin Overview</h1>
        <p className="text-slate text-sm mt-1">Platform health and key metrics</p>
      </div>

      {/* Pending alerts */}
      {(winners?.length ?? 0) > 0 && (
        <div className="bg-gold-light border border-gold/30 rounded-2xl p-4 mb-6">
          <p className="font-medium text-sm">⚠️ {winners?.length} winner verification{(winners?.length ?? 0) > 1 ? 's' : ''} pending review</p>
          <a href="/admin/winners" className="text-xs text-gold underline mt-1 inline-block">Review now →</a>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card accent="sage">
          <p className="text-xs text-slate mb-1">Total users</p>
          <p className="font-serif text-3xl font-bold">{totalUsers ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate mb-1">Active subscribers</p>
          <p className="font-serif text-3xl font-bold">{activeSubscribers ?? 0}</p>
        </Card>
        <Card accent="gold">
          <p className="text-xs text-slate mb-1">Total prize pool</p>
          <p className="font-serif text-3xl font-bold">£{totalPrizePool.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate mb-1">Charity raised</p>
          <p className="font-serif text-3xl font-bold">£{totalContributions.toLocaleString()}</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent draws */}
        <Card>
          <h2 className="font-medium mb-4">Recent Draws</h2>
          {draws && draws.length > 0 ? (
            <div className="flex flex-col gap-3">
              {draws.map(d => (
                <div key={d.id} className="flex items-center justify-between border-b border-ink/8 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{d.draw_month}</p>
                    <p className="text-xs text-slate capitalize">{d.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">£{d.prize_pool_total.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      d.status === 'published' ? 'bg-sage-light text-sage'
                      : d.status === 'simulated' ? 'bg-gold-light text-gold'
                      : 'bg-mist text-slate'
                    }`}>{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate text-center py-4">No draws yet</p>
          )}
          <a href="/admin/draws" className="text-xs text-sage hover:underline mt-3 inline-block">Manage draws →</a>
        </Card>

        {/* Charities summary */}
        <Card>
          <h2 className="font-medium mb-4">Active Charities</h2>
          {charities && charities.length > 0 ? (
            <div className="flex flex-col gap-3">
              {charities.map(c => (
                <div key={c.id} className="flex items-center justify-between border-b border-ink/8 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    {c.is_featured && <span className="text-xs bg-gold-light text-gold px-2 py-0.5 rounded-full">Featured</span>}
                  </div>
                  <p className="text-sm text-sage font-medium">£{c.total_raised.toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate text-center py-4">No charities yet</p>
          )}
          <a href="/admin/charities" className="text-xs text-sage hover:underline mt-3 inline-block">Manage charities →</a>
        </Card>
      </div>
    </div>
  )
}
