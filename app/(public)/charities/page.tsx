import { createServerClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'

export default async function CharitiesPage() {
  const supabase = createServerClient()
  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .eq('is_active', true)
    .order('total_raised', { ascending: false })

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 md:px-16 max-w-7xl mx-auto">
        <div className="mb-12">
          <p className="text-sage text-xs font-medium tracking-widest uppercase mb-3">Impact</p>
          <h1 className="font-serif text-5xl font-bold mb-4">Our charities</h1>
          <p className="text-slate text-lg max-w-xl">Every subscription directly funds one of these causes. You choose who benefits from your game.</p>
        </div>

        {/* Featured */}
        {charities?.filter(c => c.is_featured).map(c => (
          <div key={c.id} className="bg-sage text-white rounded-2xl p-8 mb-8 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full text-white/80 mb-3 inline-block">Featured charity</span>
              <h2 className="font-serif text-3xl font-bold mb-3">{c.name}</h2>
              <p className="text-white/80 leading-relaxed mb-4">{c.description}</p>
              {c.upcoming_event && (
                <div className="bg-white/10 rounded-xl px-4 py-3">
                  <p className="text-xs text-white/60 mb-0.5">Upcoming event</p>
                  <p className="font-medium">{c.upcoming_event}</p>
                  {c.event_date && <p className="text-xs text-white/60 mt-0.5">{new Date(c.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="font-serif text-5xl font-bold mb-1">£{c.total_raised.toLocaleString()}</p>
              <p className="text-white/70">raised through FairwayGives</p>
              <Link href="/signup" className="bg-white text-sage font-medium px-8 py-3 rounded-full mt-4 inline-block hover:opacity-90 transition text-sm">
                Support this charity →
              </Link>
            </div>
          </div>
        ))}

        {/* All charities */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {charities?.filter(c => !c.is_featured).map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-ink/10 p-6 hover:-translate-y-1 transition-transform">
              {c.image_url && (
                <div className="w-full h-40 rounded-xl overflow-hidden mb-4 bg-mist">
                  <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                </div>
              )}
              <h3 className="font-medium text-lg mb-2">{c.name}</h3>
              <p className="text-sm text-slate leading-relaxed mb-4">{c.description}</p>
              {c.upcoming_event && (
                <div className="text-xs bg-mist rounded-lg px-3 py-2 mb-3">
                  <span className="text-slate">Upcoming: </span>
                  <span className="font-medium">{c.upcoming_event}</span>
                  {c.event_date && <span className="text-slate"> · {new Date(c.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sage font-medium text-sm">£{c.total_raised.toLocaleString()} raised</span>
                <Link href="/signup" className="text-xs text-sage border border-sage px-3 py-1.5 rounded-full hover:bg-sage hover:text-white transition-colors">
                  Choose →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
