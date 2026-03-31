'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Users, Trophy, Heart, CheckSquare, LogOut, BarChart3 } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/draws', label: 'Draw Engine', icon: Trophy },
  { href: '/admin/charities', label: 'Charities', icon: Heart },
  { href: '/admin/winners', label: 'Winners', icon: CheckSquare },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-mist flex">
      <aside className="w-60 bg-ink text-white flex flex-col fixed top-0 left-0 bottom-0 z-40">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="font-serif font-bold text-lg">
            Fairway<span className="text-sage-light">Gives</span>
          </Link>
          <p className="text-xs text-white/40 mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                pathname === href
                  ? 'bg-sage text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            <BarChart3 size={14} />
            My Dashboard
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors w-full"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-60 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
