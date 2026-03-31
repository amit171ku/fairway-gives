import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const profile = profileData as any
  const { data: subscriptionData } = await admin.from('subscriptions').select('*').eq('user_id', user.id).single()
  const subscription = subscriptionData as any
  const { data: scoresData } = await supabase.from('scores').select('*').eq('user_id', user.id).order('played_at', { ascending: false })
  const scores = scoresData as any[]
  const { data: charityData } = profile?.charity_id
    ? await supabase.from('charities').select('*').eq('id', profile.charity_id).single()
    : { data: null }
  const charity = charityData as any
  const { data: winningsData } = await supabase.from('draw_results').select('*').eq('user_id', user.id)
  const winnings = winningsData as any[]
  const { data: drawsData } = await supabase.from('draws').select('*').eq('status', 'published').order('draw_date', { ascending: false }).limit(3)
  const draws = drawsData as any[]

  const totalWon = winnings?.reduce((s: number, w: any) => s + w.prize_amount, 0) ?? 0
  const pendingPayout = winnings?.filter((w: any) => w.payment_status === 'pending' && w.verification_status === 'approved').length ?? 0
  const monthlyContrib = subscription?.amount ? subscription.amount * ((profile?.charity_pct ?? 10) / 100) : 0

  const isActive = subscription?.status === 'active'
  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold">Good to see you, {profile?.full_name?.split(' ')[0] ?? 'Golfer'} 👋</h1>
        <p className="text-slate text-sm mt-1">Here's your FairwayGives snapshot.</p>
      </div>

      {!isActive && (
        <div className="bg-gold-light border border-gold/30 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <p className="text-sm text-ink font-medium">Your subscription is not active. Subscribe to enter draws and track scores.</p>
          <Link href="/subscribe" className="bg-gold text-white text-xs font-bold px-4 py-2 rounded-full hover:opacity-90 transition">Subscribe →</Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card accent="sage">
          <p className="text-xs text-slate mb-1">Subscription</p>
          <p className={`font-medium text-sm capitalize ${isActive ? 'text-sage' : 'text-red-500'}`}>{subscription?.status ?? 'Inactive'}</p>
          {renewalDate && <p className="text-xs text-slate mt-0.5">Renews {renewalDate}</p>}
        </Card>
        <Card>
          <p className="text-xs text-slate mb-1">Scores logged</p>
          <p className="font-serif text-2xl font-bold">{scores?.length ?? 0}<span className="text-slate text-sm font-sans">/5</span></p>
        </Card>
        <Card accent="gold">
          <p className="text-xs text-slate mb-1">Total won</p>
          <p className="font-serif text-2xl font-bold">£{totalWon.toFixed(2)}</p>
          {pendingPayout > 0 && <p className="text-xs text-gold mt-0.5">{pendingPayout} payout pending</p>}
        </Card>
        <Card>
          <p className="text-xs text-slate mb-1">Monthly to charity</p>
          <p className="font-serif text-2xl font-bold">£{monthlyContrib.toFixed(2)}</p>
          <p className="text-xs text-slate mt-0.5">{profile?.charity_pct ?? 10}% of subscription</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium">Recent Scores</h2>
            <Link href="/dashboard/scores" className="text-xs text-sage hover:underline">Manage →</Link>
          </div>
          {scores && scores.length > 0 ? (
            <div className="flex flex-col gap-0">
              {scores.slice(0, 5).map((s: any, i: number) => (
                <div key={s.id} className={`flex items-center justify-between py-2.5 ${i < scores.slice(0, 5).length - 1 ? 'border-b border-ink/8' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-gold' : 'bg-sage'}`} />
                    <span className="text-sm text-slate">{new Date(s.played_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <span className="font-serif font-bold">{s.points} pts</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate text-sm mb-3">No scores logged yet</p>
              <Link href="/dashboard/scores" className="text-xs bg-sage text-white px-4 py-2 rounded-full">Add your first score →</Link>
            </div>
          )}
        </Card>

        <Card accent="sage">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium">Your Charity</h2>
            <Link href="/dashboard/charity" className="text-xs text-sage hover:underline">Change →</Link>
          </div>
          {charity ? (
            <div>
              <h3 className="font-medium mb-1">{charity.name}</h3>
              <p className="text-xs text-slate mb-3 line-clamp-2">{charity.description}</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate text-xs">Your contribution rate</span>
                <span className="font-medium text-sage">{profile?.charity_pct ?? 10}%</span>
              </div>
              <div className="h-1.5 bg-sage-light rounded-full mt-2">
                <div className="h-full bg-sage rounded-full" style={{ width: `${profile?.charity_pct ?? 10}%` }} />
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate text-sm mb-3">No charity selected yet</p>
              <Link href="/dashboard/charity" className="text-xs bg-sage text-white px-4 py-2 rounded-full">Choose a charity →</Link>
            </div>
          )}
        </Card>

        <Card className="md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium">Recent Draws</h2>
            <Link href="/dashboard/draws" className="text-xs text-sage hover:underline">Full history →</Link>
          </div>
          {draws && draws.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate border-b border-ink/10">
                    <th className="text-left pb-2 font-medium">Month</th>
                    <th className="text-left pb-2 font-medium">Drawn Numbers</th>
                    <th className="text-left pb-2 font-medium">Prize Pool</th>
                    <th className="text-left pb-2 font-medium">Your Result</th>
                  </tr>
                </thead>
                <tbody>
                  {draws.map((d: any) => {
                    const myResult = winnings?.find((w: any) => w.draw_id === d.id)
                    return (
                      <tr key={d.id} className="border-b border-ink/5">
                        <td className="py-3">{d.draw_month}</td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            {d.drawn_numbers.map((n: number) => (
                              <span key={n} className="w-7 h-7 bg-mist rounded-full flex items-center justify-center text-xs font-bold">{n}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3">£{d.prize_pool_total.toLocaleString()}</td>
                        <td className="py-3">
                          {myResult ? (
                            <span className="bg-gold-light text-gold text-xs font-bold px-2 py-1 rounded-full">
                              {myResult.matched_count}-match · £{myResult.prize_amount.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate text-xs">No match</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate text-sm text-center py-6">No draws published yet. Check back after the monthly draw.</p>
          )}
        </Card>
      </div>
    </div>
  )
}