import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createServerClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = createServerClient()
  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .eq('is_active', true)
    .order('total_raised', { ascending: false })
    .limit(4)

  const { data: featuredCharity } = await supabase
    .from('charities')
    .select('*')
    .eq('is_featured', true)
    .single()

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="min-h-screen grid md:grid-cols-2 items-center gap-12 px-6 md:px-16 pt-24 pb-12 max-w-7xl mx-auto">
        <div className="animate-slide-up">
          <p className="text-sage text-xs font-medium tracking-widest uppercase mb-4">Golf · Draw · Give</p>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.03] tracking-tight mb-6">
            Play golf.<br />Win prizes.<br />
            <em className="text-sage not-italic">Change lives.</em>
          </h1>
          <p className="text-slate text-lg leading-relaxed max-w-lg mb-8">
            Enter your Stableford scores each month, compete in a draw-based prize pool, and direct real money to the charity you believe in.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="bg-ink text-white font-medium px-8 py-3.5 rounded-full hover:bg-sage transition-all hover:-translate-y-0.5 text-sm">
              Subscribe from £9.99/mo
            </Link>
            <Link href="#how" className="border border-ink/20 text-ink font-medium px-8 py-3.5 rounded-full hover:border-ink transition-all text-sm">
              How it works
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 animate-fade-in">
          {featuredCharity && (
            <div className="bg-sage rounded-2xl p-6 text-white">
              <p className="text-xs uppercase tracking-widest opacity-70 mb-1">Featured charity this month</p>
              <h3 className="font-serif text-2xl font-bold mb-3">{featuredCharity.name}</h3>
              <div className="h-1.5 bg-white/20 rounded-full mb-2 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${Math.min((featuredCharity.total_raised / 7100) * 100, 100).toFixed(0)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs opacity-75">
                <span>£{featuredCharity.total_raised.toLocaleString()} raised</span>
                <span>{Math.round((featuredCharity.total_raised / 7100) * 100)}% of goal</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-ink/10 p-5 relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-sage">
              <p className="font-serif text-4xl font-bold text-ink">£38k</p>
              <p className="text-xs text-slate mt-1">Total prize pool this month</p>
            </div>
            <div className="bg-white rounded-2xl border border-ink/10 p-5 relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gold">
              <p className="font-serif text-4xl font-bold text-ink">847</p>
              <p className="text-xs text-slate mt-1">Active subscribers</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-ink/10 p-5 relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-sage">
            <p className="font-serif text-3xl font-bold text-ink">£12,400</p>
            <p className="text-xs text-slate mt-1">Donated to charities this year</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20 px-6 md:px-16 max-w-7xl mx-auto">
        <p className="text-sage text-xs font-medium tracking-widest uppercase mb-3">The simple bit</p>
        <h2 className="font-serif text-4xl md:text-5xl font-bold mb-12 max-w-xl leading-tight">Three things. One subscription.</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: '01', title: 'Enter your scores', body: 'Log your last 5 Stableford scores (1–45). Your rolling five updates automatically — the newest score always replaces the oldest.' },
            { n: '02', title: 'Enter the monthly draw', body: 'Your scores power a monthly draw. Match 3, 4, or all 5 numbers to win. The jackpot rolls over each month until someone claims it.' },
            { n: '03', title: 'Give to a charity', body: 'At least 10% of your subscription goes directly to the charity you choose. Increase that percentage anytime, or donate independently.' },
          ].map(step => (
            <div key={step.n} className="bg-white rounded-2xl border border-ink/10 p-6">
              <p className="font-serif text-5xl font-bold text-sage-light mb-4">{step.n}</p>
              <h3 className="font-medium text-lg mb-2">{step.title}</h3>
              <p className="text-slate text-sm leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SCORE SYSTEM */}
      <section className="py-20 px-6 md:px-16 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-sage text-xs font-medium tracking-widest uppercase mb-3">Score management</p>
            <h2 className="font-serif text-4xl font-bold mb-4 leading-tight">Five scores. Always current.</h2>
            <p className="text-slate leading-relaxed mb-4">The platform keeps only your last five Stableford scores. Add a new one and the oldest drops automatically. No manual deleting — just a clean, rolling window of your recent form.</p>
            <p className="text-slate leading-relaxed">Every score includes the round date. Most recent always appears first.</p>
          </div>
          <div className="bg-mist rounded-2xl p-6 border border-ink/10">
            <div className="flex justify-between items-center mb-5">
              <span className="font-medium text-sm">My Scores</span>
              <span className="text-xs text-slate">Stableford · Last 5 rounds</span>
            </div>
            {[
              { date: '22 Mar 2026', pts: 34, latest: true },
              { date: '15 Mar 2026', pts: 28, latest: false },
              { date: '08 Mar 2026', pts: 31, latest: false },
              { date: '01 Mar 2026', pts: 25, latest: false },
              { date: '22 Feb 2026', pts: 30, latest: false },
            ].map((s, i) => (
              <div key={i} className={`flex items-center gap-3 py-3 ${i < 4 ? 'border-b border-ink/10' : ''}`}>
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.latest ? 'bg-gold' : 'bg-sage'}`} />
                <span className="text-xs text-slate flex-1">{s.date}{s.latest && <span className="ml-2 text-gold font-medium">Latest</span>}</span>
                <span className="font-serif text-xl font-bold">{s.pts}</span>
                <span className="text-xs text-slate">pts</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRIZE DRAW */}
      <section id="draw" className="py-20 px-6 md:px-16 bg-ink text-white">
        <div className="max-w-7xl mx-auto">
          <p className="text-gold text-xs font-medium tracking-widest uppercase mb-3">The draw engine</p>
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-12 max-w-xl leading-tight">Three ways to win. One jackpot that keeps growing.</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { label: '5-number match', title: 'Jackpot', share: '40% of prize pool', note: 'Rolls over if unclaimed', highlight: true },
              { label: '4-number match', title: 'Major Prize', share: '35% of prize pool', note: 'Split equally among winners', highlight: false },
              { label: '3-number match', title: 'Minor Prize', share: '25% of prize pool', note: 'Split equally among winners', highlight: false },
            ].map(tier => (
              <div key={tier.title} className={`rounded-2xl p-6 border ${tier.highlight ? 'border-gold bg-gold/10' : 'border-white/15'}`}>
                <p className="text-xs uppercase tracking-widest opacity-50 mb-3">{tier.label}</p>
                <h3 className="font-serif text-3xl font-bold mb-1">{tier.title}</h3>
                <p className="text-sm opacity-60 mb-4">{tier.share}</p>
                {tier.highlight ? (
                  <span className="bg-gold text-ink text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">{tier.note}</span>
                ) : (
                  <p className="text-xs opacity-40">{tier.note}</p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm opacity-40">Draw logic: random lottery-style or algorithm-weighted by most/least frequent scores. Admin simulates before publishing.</p>
        </div>
      </section>

      {/* CHARITIES */}
      <section id="charities" className="py-20 px-6 md:px-16 max-w-7xl mx-auto">
        <p className="text-sage text-xs font-medium tracking-widest uppercase mb-3">Impact</p>
        <h2 className="font-serif text-4xl md:text-5xl font-bold mb-12 max-w-xl leading-tight">Charities that play. Causes that matter.</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(charities ?? []).map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-ink/10 p-5 hover:-translate-y-1 transition-transform cursor-pointer">
              <div className="w-12 h-12 bg-sage-light rounded-xl flex items-center justify-center text-2xl mb-4">
                {c.name.includes('Macmillan') ? '🏥' : c.name.includes('Green') ? '🌱' : c.name.includes('Junior') ? '🧒' : '♿'}
              </div>
              <h3 className="font-medium text-sm mb-2">{c.name}</h3>
              <p className="text-xs text-slate leading-relaxed mb-3 line-clamp-3">{c.description}</p>
              <p className="text-xs text-sage font-medium">£{c.total_raised.toLocaleString()} raised</p>
            </div>
          ))}
        </div>
      </section>

      {/* PLANS */}
      <section className="py-20 px-6 md:px-16 bg-white" id="plans">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <p className="text-sage text-xs font-medium tracking-widest uppercase mb-3">Pricing</p>
          <h2 className="font-serif text-4xl font-bold">Simple, honest pricing.</h2>
        </div>
        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
          {[
            { plan: 'Monthly', price: '£9.99', per: '/month', saves: null, features: ['Full score tracking', 'Monthly prize draw entry', 'Charity contribution (min 10%)', 'Cancel anytime'] },
            { plan: 'Yearly', price: '£99.99', per: '/year', saves: 'Save £19.89', features: ['Everything in Monthly', 'Priority draw entry', 'Discounted rate (save 17%)', 'Annual summary report'] },
          ].map(p => (
            <div key={p.plan} className={`rounded-2xl border p-8 ${p.saves ? 'border-sage bg-sage/5 ring-2 ring-sage/20' : 'border-ink/10'}`}>
              {p.saves && <span className="bg-sage text-white text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block">{p.saves}</span>}
              <h3 className="font-serif text-2xl font-bold mb-1">{p.plan}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-serif text-4xl font-bold">{p.price}</span>
                <span className="text-slate text-sm">{p.per}</span>
              </div>
              <ul className="space-y-2 mb-8">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate">
                    <span className="text-sage font-bold">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block text-center font-medium text-sm py-3 rounded-full transition-all ${p.saves ? 'bg-sage text-white hover:bg-sage-dark' : 'bg-ink text-white hover:bg-sage'}`}
              >
                Get started →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 md:px-16 bg-sage text-white text-center">
        <h2 className="font-serif text-5xl md:text-6xl font-bold mb-4 leading-tight">
          Play your round.<br />
          <em className="text-gold not-italic">Change someone's world.</em>
        </h2>
        <p className="text-white/75 text-lg mb-8 max-w-md mx-auto">Monthly or yearly. Cancel any time. At least 10% of every subscription goes directly to charity.</p>
        <Link href="/signup" className="bg-white text-sage font-medium px-10 py-4 rounded-full hover:-translate-y-0.5 transition-transform inline-block text-sm">
          Start your subscription →
        </Link>
      </section>

      <Footer />
    </>
  )
}
