import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-ink text-white/60 py-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <Link href="/" className="font-serif font-bold text-lg text-white">
          Fairway<span className="text-sage-light">Gives</span>
        </Link>
        <div className="flex gap-6 text-sm">
          <Link href="/charities" className="hover:text-white transition-colors">Charities</Link>
          <Link href="/#how" className="hover:text-white transition-colors">How it works</Link>
          <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
        </div>
        <p className="text-xs">© {new Date().getFullYear()} FairwayGives. All rights reserved.</p>
      </div>
    </footer>
  )
}
