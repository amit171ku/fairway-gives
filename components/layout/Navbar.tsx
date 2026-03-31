'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-mist/95 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif font-bold text-xl tracking-tight">
          Fairway<span className="text-sage">Gives</span>
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          {[['#how', 'How it works'], ['#draw', 'Prize Draw'], ['/charities', 'Charities']].map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="text-slate text-sm hover:text-ink transition-colors">{label}</Link>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="bg-ink text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-sage transition-colors">
              Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-slate hover:text-ink transition-colors">Sign in</Link>
              <Link href="/signup" className="bg-ink text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-sage transition-colors">
                Start playing →
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-mist/98 backdrop-blur-md border-t border-ink/10 px-6 py-4 flex flex-col gap-4">
          {[['#how', 'How it works'], ['#draw', 'Prize Draw'], ['/charities', 'Charities']].map(([href, label]) => (
            <Link key={href} href={href} className="text-slate text-sm" onClick={() => setMenuOpen(false)}>{label}</Link>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-ink/10">
            {user ? (
              <Link href="/dashboard" className="bg-ink text-white text-sm font-medium px-5 py-2.5 rounded-full text-center">Dashboard →</Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-center text-slate">Sign in</Link>
                <Link href="/signup" className="bg-ink text-white text-sm font-medium px-5 py-2.5 rounded-full text-center">Start playing →</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
